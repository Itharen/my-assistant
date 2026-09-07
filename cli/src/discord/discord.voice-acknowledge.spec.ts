import {
  VOICE_HEARD_REACTION,
  markVoiceHeard,
  replyToVoice,
  type VoiceAcknowledgeTarget,
} from './discord.voice-acknowledge.js';

/** Hamis Discord-üzenet: rögzíti, mit hívtak rajta, és tud szándékosan bukni. */
function makeTarget(options: { reactFails?: Error; replyFailsAt?: number } = {}): {
  target: VoiceAcknowledgeTarget;
  reactions: string[];
  replies: string[];
} {
  const reactions: string[] = [];
  const replies: string[] = [];

  const target: VoiceAcknowledgeTarget = {
    react: async (emoji: string): Promise<unknown> => {
      if (options.reactFails) throw options.reactFails;

      reactions.push(emoji);

      return undefined;
    },
    reply: async (content: string): Promise<unknown> => {
      if (options.replyFailsAt !== undefined && replies.length === options.replyFailsAt) {
        throw new Error('Missing Permissions');
      }

      replies.push(content);

      return undefined;
    },
  };

  return { target: target, reactions: reactions, replies: replies };
}

describe('discord.voice-acknowledge', () => {
  describe('markVoiceHeard', () => {
    it('a fül-emojit teszi rá alapértelmezésben', async () => {
      const { target, reactions } = makeTarget();

      const outcome = await markVoiceHeard(target);

      expect(outcome.ok).toBe(true);
      expect(reactions).toEqual([VOICE_HEARD_REACTION]);
    });

    it('NEM dob hibát, ha a Discord elutasítja — leírja az okot és az orvoslást', async () => {
      const { target } = makeTarget({ reactFails: new Error('Missing Permissions') });

      const outcome = await markVoiceHeard(target);

      expect(outcome.ok).toBe(false);
      expect(outcome.detail).toContain('Missing Permissions');
      expect(outcome.remedy).toContain('Add Reactions');
    });
  });

  describe('replyToVoice', () => {
    it('MINDEN darab válaszként megy — nem csak az első', async () => {
      const { target, replies } = makeTarget();

      const outcome = await replyToVoice(target, ['egy', 'kettő', 'három']);

      expect(outcome.ok).toBe(true);
      expect(replies).toEqual(['egy', 'kettő', 'három']);
    });

    it('üres listára nem küld semmit', async () => {
      const { target, replies } = makeTarget();

      const outcome = await replyToVoice(target, []);

      expect(outcome.ok).toBe(false);
      expect(replies).toEqual([]);
    });

    it('az ELSŐ darab bukásánál a jogosultságra mutat', async () => {
      const { target } = makeTarget({ replyFailsAt: 0 });

      const outcome = await replyToVoice(target, ['egy', 'kettő']);

      expect(outcome.ok).toBe(false);
      expect(outcome.detail).toContain('1/2');
      expect(outcome.remedy).toContain('csatornán');
    });

    it('🔴 a KÖZBENSŐ bukásnál figyelmeztet, hogy az átirat CSONKÁN látszik', async () => {
      const { target, replies } = makeTarget({ replyFailsAt: 1 });

      const outcome = await replyToVoice(target, ['egy', 'kettő', 'három']);

      expect(outcome.ok).toBe(false);
      expect(outcome.detail).toContain('2/3');
      expect(outcome.remedy).toContain('CSONKÁN');
      // Az első darab kiment — ezért látszik csonkán, és ezért kell külön kezelni.
      expect(replies).toEqual(['egy']);
    });
  });
});
