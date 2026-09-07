# my-assistant RELAY — a telefon helyzet-adatanak atmeneti puffere.
#
# ⛔ EZ NEM A my-assistant SZERVER. Owner-direktiva (2026-09-07): a my-assistant szerver
# kivulrol NEM elerheto; a telefon IDE kuld, a szerver pedig INNEN huz le kifele iranyu
# kapcsolattal. Ez a kep az EGYETLEN, ami az internet fele nez.
#
# ── Path B build (ugyanaz, mint az organizernel) ─────────────────────────────
# A CDP pipeline a CI-hoszton buildel es tesztel, majd `pnpm prune --prod`-dal
# kigyomlalja a dev-fuggosegeket. Ez a Dockerfile CSAK MASOL — nem fordit es nem
# telepit.
#
# 🔴 MIERT NINCS ITT `npm i` (es ezert `.npmrc` SEM):
#   A `.npmrc` letrehozasa GLOBALIS HARD RULE szerint TILOS, barmely repoban, barmely
#   szinten (`core-no-npmrc`) — a flottaban elo npm publish auth-tokenek szivarogtak ki
#   plaintextben ilyen fajlokbol. Egy Docker build-stage-ben irt `/root/.npmrc` sem
#   kivetel: a tokent BESUTI egy image-retegbe.
#   ⭐ A megoldas nem trukkos token-atadas, hanem az, hogy IDE BENT NINCS TELEPITES.
#      A privat `@futdevpro/*` csomagokat a CI-hoszt szedi le, ahol a jogosultsag
#      amugy is el — a kepbe mar csak a KESZ `node_modules` kerul.
#
# Build context: `./relay` — a `.dynamo/pipeline.cicd.config.json` `docker-build`
# lepesenek `settings.context` mezoje allitja be.

FROM node:20-slim

WORKDIR /app

# A leforditott kimenet (tsc → ./build).
COPY build ./build

# A CI-hoszton mar prod-ra metszett fuggosegek (`pnpm prune --prod`).
COPY node_modules ./node_modules

# A `type: module` miatt a Node ENNEK a fajlnak a leteben dont ESM/CJS-rol —
# nelkule a `build/index.js` CommonJS-kent tolne el, es a betoltes elszallna.
COPY package.json ./package.json

# DEC-MA-010: my-assistant relay HTTP port = 39345 (FDP-konvencio, XY=34).
# ⚠️ Csak az ALAPERTELMEZES; a `MA_RELAY_PORT` felulirja (`app.server.ts`).
EXPOSE 39345

# ⛔ TOKEN SOHA NEM KERUL A KEPBE. A ket relay-token (`MA_RELAY_INGEST_TOKEN`,
# `MA_RELAY_PULL_TOKEN`) FUTASIDOBEN jon a compose environmentbol. Hianyzo token
# eseten a relay MINDENT elutasit (fail-closed) — nem nyilik ki.

CMD ["node", "build/index.js"]
