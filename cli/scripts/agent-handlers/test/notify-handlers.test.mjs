// scripts/agent-handlers/test/notify-handlers.test.mjs
// Regression-tesztek a notify-discord (cycle 130) + notify-push (cycle 131)
// handlerekhez. node:test (Node stdlib) — nulla új dependency, a cli
// jasmine-on-build mintát tükrözi: a compiled dist/-et teszteli.
//
// Futtatás: `pnpm build && node --test test/` (vagy `pnpm test`).
// A pure helper-ek + a HTTP-integráció (lokál mock-szerver) + az error-path-ok
// vannak lefedve. KIEMELT: a notify-push emoji-ByteString regressziós fix
// (JSON publish formátum, NEM HTTP-header) — lásd cycle 131.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { buildDiscordPayload, handleNotifyDiscord } from '../dist/handlers/notify-discord.js';
import { buildNtfyPayload, handleNotifyPush } from '../dist/handlers/notify-push.js';

/** Indít egy egyszer-fogadó mock HTTP szervert, ami rögzíti a beérkező requestet. */
function mockServer(statusCode = 204, respBody = '') {
  const state = { received: null };
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      state.received = {
        method: req.method,
        path: req.url,
        contentType: req.headers['content-type'],
        auth: req.headers['authorization'],
        body,
      };
      res.writeHead(statusCode).end(respBody);
    });
  });
  return { server, state };
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
}

// ─────────────────────────────────────────────────────────────────────────
// notify-discord — pure payload builder
// ─────────────────────────────────────────────────────────────────────────

test('discord: buildDiscordPayload — mention=user → content <@id>, priority→szín', () => {
  const p = buildDiscordPayload({ title: 'T', message: 'M', priority: 'warning', mention: 'user' }, '999');
  assert.equal(p.content, '<@999>');
  assert.equal(p.embeds[0].title, 'T');
  assert.equal(p.embeds[0].description, 'M');
  assert.equal(p.embeds[0].color, 0xf1c40f); // warning = sárga
});

test('discord: buildDiscordPayload — mention=none → üres content, default szín', () => {
  const p = buildDiscordPayload({ title: 'T', message: 'M', mention: 'none' }, '999');
  assert.equal(p.content, '');
  assert.equal(p.embeds[0].color, 0x3498db); // default = info kék
});

test('discord: buildDiscordPayload — explicit color override', () => {
  const p = buildDiscordPayload({ title: 'T', message: 'M', color: 0xabcdef }, undefined);
  assert.equal(p.embeds[0].color, 0xabcdef);
  assert.equal(p.content, ''); // userId hiányzik → nincs mention
});

// ─────────────────────────────────────────────────────────────────────────
// notify-discord — integration (mock webhook) + error-path
// ─────────────────────────────────────────────────────────────────────────

test('discord: handler valódi POST a webhook-ra (204) — embed + mention helyes', async () => {
  const { server, state } = mockServer(204);
  const url = await listen(server);
  try {
    process.env.MA_DISCORD_WEBHOOK_URL = `${url}/webhook/test`;
    process.env.MA_DISCORD_USER_ID = '123456789';
    await handleNotifyDiscord({
      type: 'notify-discord', tier: 1,
      args: { title: '💪 Matrac', message: 'Edzés', priority: 'info', mention: 'user', throttleId: `d-${Date.now()}` },
    });
    assert.equal(state.received.method, 'POST');
    assert.equal(state.received.contentType, 'application/json');
    const body = JSON.parse(state.received.body);
    assert.equal(body.content, '<@123456789>');
    assert.equal(body.embeds[0].title, '💪 Matrac'); // emoji a JSON body-ban OK
    assert.equal(body.embeds[0].color, 0x3498db);
  } finally {
    server.close();
    delete process.env.MA_DISCORD_WEBHOOK_URL;
    delete process.env.MA_DISCORD_USER_ID;
  }
});

test('discord: hiányzó MA_DISCORD_WEBHOOK_URL → MA-DISCORD-NO-WEBHOOK-URL throw', async () => {
  delete process.env.MA_DISCORD_WEBHOOK_URL;
  await assert.rejects(
    () => handleNotifyDiscord({ type: 'notify-discord', tier: 1, args: { title: 'x', message: 'y' } }),
    /MA-DISCORD-NO-WEBHOOK-URL/,
  );
});

test('discord: HTTP 400 → MA-DISCORD-HTTP-ERROR throw', async () => {
  const { server } = mockServer(400, 'bad');
  const url = await listen(server);
  try {
    process.env.MA_DISCORD_WEBHOOK_URL = `${url}/wh`;
    await assert.rejects(
      () => handleNotifyDiscord({ type: 'notify-discord', tier: 1, args: { title: 'x', message: 'y' } }),
      /MA-DISCORD-HTTP-ERROR/,
    );
  } finally {
    server.close();
    delete process.env.MA_DISCORD_WEBHOOK_URL;
  }
});

// ─────────────────────────────────────────────────────────────────────────
// notify-push (ntfy) — pure payload builder
// ─────────────────────────────────────────────────────────────────────────

test('ntfy: buildNtfyPayload — priority name→szám, tags string→array (trim+szűrés)', () => {
  const p = buildNtfyPayload({ title: '💪 T', message: 'M', priority: 'high', tags: 'muscle, warning ,' }, 'topicX');
  assert.equal(p.topic, 'topicX');
  assert.equal(p.title, '💪 T');
  assert.equal(p.priority, 4); // high = 4
  assert.deepEqual(p.tags, ['muscle', 'warning']);
});

test('ntfy: buildNtfyPayload — priority/tags hiánya → undefined (ntfy default)', () => {
  const p = buildNtfyPayload({ title: 'T', message: 'M' }, 'topicX');
  assert.equal(p.priority, undefined);
  assert.equal(p.tags, undefined);
});

// ─────────────────────────────────────────────────────────────────────────
// notify-push — integration + REGRESSZIÓS GUARD (emoji-ByteString, cycle 131)
// ─────────────────────────────────────────────────────────────────────────

test('ntfy: handler JSON-POST a base-URL-re — emoji a title-ben NEM dob (regresszió-guard)', async () => {
  const { server, state } = mockServer(200, '{"id":"x"}');
  const url = await listen(server);
  try {
    process.env.MA_NTFY_URL = `${url}/`; // trailing slash → tolerálás
    process.env.MA_NTFY_TOPIC = 'my-assistant-test';
    process.env.MA_NTFY_AUTH = 'secret-token';
    // 💪 emoji a title-ben — a régi HTTP-header publish itt 'Cannot convert to
    // ByteString' hibát dobott. A JSON publish UTF-8-safe → ennek mennie kell.
    await handleNotifyPush({
      type: 'notify-push', tier: 1,
      args: { title: '💪 Mai matrac?', message: 'Edzés', priority: 'high', tags: 'muscle', throttleId: `p-${Date.now()}` },
    });
    assert.equal(state.received.method, 'POST');
    assert.equal(state.received.path, '/'); // JSON publish → base-URL, topic a body-ban
    assert.equal(state.received.contentType, 'application/json');
    assert.equal(state.received.auth, 'Bearer secret-token');
    const body = JSON.parse(state.received.body);
    assert.equal(body.topic, 'my-assistant-test');
    assert.equal(body.title, '💪 Mai matrac?');
    assert.equal(body.priority, 4);
    assert.deepEqual(body.tags, ['muscle']);
  } finally {
    server.close();
    delete process.env.MA_NTFY_URL;
    delete process.env.MA_NTFY_TOPIC;
    delete process.env.MA_NTFY_AUTH;
  }
});

test('ntfy: hiányzó MA_NTFY_TOPIC → MA-NTFY-NO-TOPIC throw', async () => {
  delete process.env.MA_NTFY_TOPIC;
  await assert.rejects(
    () => handleNotifyPush({ type: 'notify-push', tier: 1, args: { title: 'x', message: 'y' } }),
    /MA-NTFY-NO-TOPIC/,
  );
});

test('ntfy: HTTP 403 → MA-NTFY-HTTP-ERROR throw', async () => {
  const { server } = mockServer(403, 'forbidden');
  const url = await listen(server);
  try {
    process.env.MA_NTFY_URL = url;
    process.env.MA_NTFY_TOPIC = 'topic2';
    await assert.rejects(
      () => handleNotifyPush({ type: 'notify-push', tier: 1, args: { title: 'x', message: 'y' } }),
      /MA-NTFY-HTTP-ERROR/,
    );
  } finally {
    server.close();
    delete process.env.MA_NTFY_URL;
    delete process.env.MA_NTFY_TOPIC;
  }
});
