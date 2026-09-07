import { DyFM_AI_Message } from '@futdevpro/fsm-dynamo/ai';
import { Channel, Client, Collection, Guild, GuildMember, Message, TextChannel, VoiceChannel } from 'discord.js';
import { CV_SpeechRecognizerService } from '../_enums/cv-speech-recognizer-service.enum.js';
import { DyFM_Array, DyFM_Object, DyFM_Error, DyFM_Log, DyFM_LogStyle } from '@futdevpro/fsm-dynamo';
import { CVO_Main_ControlService } from '../../voice-output/_services/cvo-main.control-service.js';
import { CVO_TextToSpeechService } from '../../voice-output/_enums/cvo-text-to-speech-service.enum.js';
import { settings } from '../../../_collections/consts/settings.const.js';
import { ccapDefaultSystemPrompt } from '../../../_collections/consts/ccap-default-system-prompt.const.js';
import { CVO_CCAPSound } from '../../voice-output/_enums/cvo-ccap-sound.enum.js';
import { NewVersionContext } from '../../../_models/data-models/new-version-context.data-model.js';
import { CCAP_MasterService } from '../../../_services/ccap.master-service.js';
import { CV_ServiceBase } from './cv.service-base.js';
import { DyNTS_Bot_ChannelWrapper, DyNTS_Bot_MessageWrapper, DyNTS_Bot_MessagingProvider_ServiceBase } from '@futdevpro/nts-dynamo/bot';


export interface CV_ResultReview_Context {
  userName: string;
  transcription: string;
  provider: CV_SpeechRecognizerService;
}

export class CV_ResultReview_ControlService extends CV_ServiceBase {
  
  static getInstance(): CV_ResultReview_ControlService {
    return CV_ResultReview_ControlService.getSingletonInstance();
  }

  /* private readonly ccap_CS: CCAP_ControlService = CCAP_ControlService.getInstance(); */
  private readonly ccapVoiceOutput_CS: CVO_Main_ControlService = CVO_Main_ControlService.getInstance();

  async reviewResult(
    params: {
      userId: string,
      member: GuildMember,
      userDisplayName: string,
      //channel: DyNTS_Bot_ChannelWrapper<VoiceChannel>, // TextChannel, 
      channel: Channel,
      /* provider: DyNTS_Bot_MessagingProvider_ServiceBase<VoiceChannel, Message, any>, */
      transcription: string, 
      currentLanguage: string,
    },
    issuer: string,
  ): Promise<void> {
    try {
      if (!params.channel) {
        DyFM_Log.error('❌ Nem található a voice csatorna az üzenet küldéshez!');
        return;
      }

      if (!params.channel.isVoiceBased()) {
        DyFM_Log.error('❌ A voice csatorna nem voice-based!');
        return;
      }

      const wrappedChannel: DyNTS_Bot_ChannelWrapper<VoiceChannel> = await this.ccap_MS.defaultMessagingProvider.wrapChannel(
        params.channel,
      );

      if (settings.ccap.listenOnlyMode || settings.ccap.ronnieMode) {
        let messageContent: string = `[VOICE|USER] 🎤 **${params.userDisplayName}**: _${params.transcription}_`;

        if (settings.ccap.ronnieMode) {
          const ronnieMention: string | null = await this.getRonnieMentionForChannel(params.channel, issuer);
          if (ronnieMention) {
            messageContent = `${ronnieMention} ${messageContent}`;
          }
        }

        wrappedChannel.sendMessage(messageContent, issuer);
        return;
      }

      const conversation: DyFM_AI_Message[] = await this.gatherMessagesInChannel(wrappedChannel, issuer);
      /* let context: NewVersionContext;
      if (messages.length) {
        const { simplifiedContext, fullContext } = await this.ccap_CS.gatherContext(
          DyFM_Array.last(messages),
          messages, 
          params.channel.id, 
          params.userDisplayName, 
          params.userId, 
          issuer
        );
        context = simplifiedContext;
      } else {
        context = new NewVersionContext({
          discordId: params.channel.id,
        })
      } */

      const [
        isOutOfContext,
        fixedTranscription,
      ] =  await Promise.all([
        this.ccap_MS.llmChat_CS.requestSimpleMessageInConversation({
          conversation: conversation,
          message: 
            'Ez az üzenet hangfeldolgozás útján érkezett, és a következőképpen lett értelmezve: ' +
            `"${params.transcription}"\n` +
            'Kérlek add meg, hogy ez az értelmezés beleillik-e a jelenlegi beszélgetésbe, ' +
            'Vagy félre lett értelmezve. ("OK", "NOISE", "OUTOFCONTEXT", vagy "MISPELLED")' +
            `\n"NOISE": Akkor félre van értelmezve, ` +
            `az üzenet nem angol, nem is magyar és nem is angol-magyar nyelv kombináció, ` +
            `vagy teljesen halandzsa. ` +
            `(De engedélyezzük a szleng-et, a vidékiösségöt és egyéb hangutánzásokat.)` +
            `\n"MISPELLED": Ha csak elírás van a korábbiakkal összevetve, ` + 
            `azaz kis igazításra szorul csak.` +
            '\nHa a végeredmény "OUTOFCONTEXT" vagy "NOISE", ' +
            'mert akkor írd le pár szóban, hogy miért gondolod, hogy noise, vagy out of context.',
          settings: {
            systemPrompt: 
              'Te egy nagyon pontos folytonosság, nyelv, és értelmezés meghatározó vagy. ' +
              'Pontosan értelmezd a nyelvet, és a beszélgetés folytonosságát ' +
              '(amennyiben van folyamatos beszélgetés). ' +
              'Minden magyar, angol, vagy kevert magyar-angol szöveg elfogadott. ' +
              'A felhasználó bármikor válthat kontextust, témát, vagy célt, csak arra vagyunk kíváncsiak, ' +
              'hogy a felismert szöveg helyesen lett-e vajon értelmezve, vagy teljesen értelmetlen. ' +
              'A felhasználó bármikor kezdhet új témát, vagy csaponghat, vagy változtathat a beszélgetés témáján. ' +
              'Mindenképpen legyen benne a válaszodban a következők egyike ' +
              '(az egyik mindig legyen benne a válaszodban, de mindig szigorúan csak az egyik): ' +
              '"OK", "NOISE", "OUTOFCONTEXT", vagy "MISPELLED" ' +
              'Figyelj oda rá, hogy a túl rövid vagy zajos hanganyagok eredményei sokszor ' +
              'csak rövid angol szavak vagy kifejezések mint pl: ' +
              `"Thank you.", "That's really needed."` +
              '\nEz ugye nem elfogadható azaz "NOISE". ' + 
              '\nHa nem magyar és nem is angol, akkor mindig "NOISE". ' +
              '\nHa nem "OK" akkor mindig írd le pár szóban, hogy miért gondolod.',
          },
          issuer: issuer,
          /* context: context, */
        }),
        this.ccap_MS.llmChat_CS.requestSimpleMessageInConversation({
          conversation: conversation,
          message: 
            'A hangbeszélgetés következő következő hangból szövegbe generált szövegének tartalma a következő: ' +
            `"${params.transcription}"\n` +
            'Kérlek javítsd ki a helyesírást, és a hang-félreértelmezést ha szükséges. ' +
            'A válaszod csak a javított vagy elfogadott bemeneti szöveget tartalmazza és semmi mást.',
          settings: {
            systemPrompt: 
              'Te egy nagyon pontos és precíz folytonosság azonosító és helyesírás ellenőrző vagy, ' +
              'aki a modern nyelvezettel is képes lépést tartani. ' +
              'Nagyon határozottan meg tudod állítani, ' +
              'hogy a hangból szövegbe generált szövegek tartalma hol térhet el a transcribed szövegtől.' +
              '\nNagyon pontosan csak és kizárólag annyit módosítasz amennyit feltétlenül szükséges. ' +
              'Könnyen meghatározod a hasonló hangzású szavakat és könnyen rájössz, ha egy ugyan olyan, ' +
              'de más szót használtunk a hangból szövegbe generálás során. ' +
              'Különösen figyelj oda a kiejtési hasonlóságokra. ' +
              '\nMindig csak a javított vagy elfogadott bemeneti szöveget add vissza és semmi mást.',
          },
          issuer: issuer,
            /* context: context, */
        }),
      ])

      if (this.debugLog) {
        /* DyFM_Log.log(
          `🔍 [DEBUG] context: `, JSON.stringify(context, null, 2)  
        ); */
        DyFM_Log.log(
          `🔍 [DEBUG] isOutOfContext: ${isOutOfContext}`
        );
        DyFM_Log.log(
          `🔍 [DEBUG] fixedTranscription: ${fixedTranscription}`
        );
      }

      const upperCaseIsOutOfContext = isOutOfContext.toUpperCase();
      let resultTypeCode: 'OK' | 'ADJUSTED' | 'OUTOFCONTEXT' | 'NOISE';
      let resolvedMessage: string;
      let debugMessage: string;
      let newDiscordMessage: DyNTS_Bot_MessageWrapper<any>;
      

      if (upperCaseIsOutOfContext.includes('OK')) {
        resultTypeCode = 'OK';
        resolvedMessage = `[VOICE|USER] 🎤 **${params.userDisplayName}**: _${params.transcription}_`;
        this.ccapVoiceOutput_CS.playSound(CVO_CCAPSound.typing, 'result-review-cs');

      } else if (upperCaseIsOutOfContext.includes('MISPELLED')) {
        resultTypeCode = 'ADJUSTED';
        resolvedMessage = `[VOICE|USER|ADJUSTED] 🎤 **${params.userDisplayName}**: _${fixedTranscription}_`;
        debugMessage = `\n--------------------------------` +
          `\n[DEBUG|ADJUSTEDFROM] _🔍 **adjusted from**: "${params.transcription}"_`;
        this.ccapVoiceOutput_CS.playSound(CVO_CCAPSound.typing, 'result-review-cs');

      } else if (upperCaseIsOutOfContext.includes('OUTOFCONTEXT')) {
        resultTypeCode = 'OUTOFCONTEXT';
        resolvedMessage = `[VOICE|USER|OUTOFCONTEXT] 🎤 **${params.userDisplayName}**: ${params.transcription}`;
        debugMessage = `\n--------------------------------` +
          `\n[DEBUG|OUTOFCONTEXT] _🔍 **This is out of context**: "${isOutOfContext.replace('OUTOFCONTEXT', '').trim()}"_` +
          `\n[DEBUG|OUTOFCONTEXT] _🔧 **Modify to this**: "${fixedTranscription}"_`;
        DyFM_Log.T_warn(
          'CV_ResultReview_ControlService.reviewResult: OUTOFCONTEXT',
          {
            isOutOfContext: isOutOfContext,
            fixedTranscription: fixedTranscription,
          }
        );
        this.ccapVoiceOutput_CS.playSound(CVO_CCAPSound.hmmm, 'result-review-cs');

      } else {
        resultTypeCode = 'NOISE';
        resolvedMessage = `[VOICE|USER|NOISE] _🎤 **${params.userDisplayName}**: ${params.transcription}_`;
        debugMessage = `\n--------------------------------` +
          `\n[DEBUG|NOISE] _🔍 **This is noise**: "${isOutOfContext.replace('NOISE', '').trim()}"_`;
        DyFM_Log.T_warn(
          'CV_ResultReview_ControlService.reviewResult: NOISE',
          {
            isOutOfContext: isOutOfContext,
            fixedTranscription: fixedTranscription,
          }
        );
        this.ccapVoiceOutput_CS.playSound(CVO_CCAPSound.cutSlash, 'result-review-cs');
        return;
      }

      if (resultTypeCode === 'OUTOFCONTEXT') {
        //const clarificationQuestion = await this.ccap_MS.llmChat_CS.getQuestionAnswerInConversation({
        //  conversation: conversation,
        //  question: 
        //    'A felhasználó hangüzenete nem tűnik jól értelmezettnek a hangfelismerés alapján. ' +
        //    'Kérlek kérdezz rá, nagyon röviden, hogy tényleg ezt mondta-e (a kérdésben legyen benne a szöveg is): ' +
        //    `"${params.transcription}"`,
        //  /* settings: {
        //    systemPrompt: ccapDefaultSystemPrompt,
        //  }, */
        //  issuer: issuer,
        //  /* context: context, */
        //  debugLog: true,
        //});
        const clarificationQuestion = `Tényleg ezt mondtad?: "${params.transcription}"`;
        DyFM_Log.testInfo(
          `🔍 [DEBUG] clarificationQuestion: ${clarificationQuestion}`
        );
        const newClarificationQuestionMessage: DyNTS_Bot_MessageWrapper<any> = await wrappedChannel.sendMessage(
          /* params.channel, */
          `[VOICE|CCAP|CLARIFY] 🔊 ${clarificationQuestion}`,
          issuer
        );
        /* const newClarificationQuestionMessage: DyNTS_Bot_MessageWrapper<any> = await params.channel.send(
          `[VOICE|CCAP|CLARIFY] 🔊 ${clarificationQuestion}`
        ); */

        if (!params.channel.isVoiceBased()) {
          DyFM_Log.error(
            `🔊❌ Nem tudom lejátszani a hangot, mert ez nem voice csatorna!`
          )
  
          newClarificationQuestionMessage.provider.replyToMessage(
            newClarificationQuestionMessage,
            `[SYSTEM|ERROR|VOICE|CHANNEL_TYPE|ODB-CVS-RR1] Nem tudom lejátszani a hangot, ` +
              `mert ez nem voice csatorna!`
          )
          return;
        }
        await this.ccapVoiceOutput_CS.speakText(
          {
            text: clarificationQuestion,
            service: CVO_TextToSpeechService.openai,
          },
          {
            playAudio: true,
            discordChannel: params.channel as VoiceChannel,
          }
        );

        return;
      }

      newDiscordMessage = await wrappedChannel.sendMessage(resolvedMessage, issuer);
      if (!newDiscordMessage) {
        return;
      }

      if (settings.ccap_debugLevel >= 1 && debugMessage) {
        // DEBUG
        await params.channel.send(debugMessage);
      }

      // re-set the author to the member instead of the bot
      newDiscordMessage.authorId = params.member.id;
      newDiscordMessage.authorName = params.member.displayName;
      newDiscordMessage.authorDisplayName = params.member.displayName;
      newDiscordMessage.isBot = false;

      /* const result = await this.ccap_CS.resolveMessage(
        newDiscordMessage, 
        'ccap-voice-control',
        '[VOICE|CCAP] 🔊',
        //context: context,
      ); */
      DyFM_Log.H_info('CV_ResultReview_ControlService.reviewResult', newDiscordMessage.content);
      const result: DyNTS_Bot_MessageWrapper<any> = await this.ccap_MS.io_CS.handleMessageWithOptionalPreFlag({
        conversation: conversation,
        message: newDiscordMessage,
        addPreFlag: '[VOICE|CCAP] 🔊',
        issuer: issuer,
        //context: context,
      });

      if (!params.channel.isVoiceBased()) {
        DyFM_Log.error(
          `🔊❌ Nem tudom lejátszani a hangot, mert ez nem voice csatorna!`
        )

        result.reply(
          `[SYSTEM|ERROR|VOICE|CHANNEL_TYPE|ODB-CVS-RR2] Nem tudom lejátszani a hangot, ` +
          `mert ez nem voice csatorna!`
        )
        return;
      }

      if (result) {
        await this.ccapVoiceOutput_CS.speakText({
          text: result.content,
          service: CVO_TextToSpeechService.openai,
        },
        {
          playAudio: true,
          discordChannel: params.channel as VoiceChannel,
        });
      }
    } catch (error) {
      DyFM_Log.H_error('WTF !!!!!!!!!!!!!!!!');

      /* DyFM_Log.H_error('CV_ResultReview_ControlService.reviewResult', error); */

      DyFM_Error.logSimple('CV_ResultReview_ControlService.reviewResult', error);

      if (params.channel.isTextBased()) {
        (params.channel as TextChannel).send(
          `[SYSTEM|ERROR|ODB-CVS-RR0] Hiba történt a ccap üzenet feldolgozása során:\n` +
          DyFM_Error.getAnyMessage(error)
        )
      }
    }
  }

  /**
   * Ronnie bot Discord user ID-jának lekérése a guild-ból.
   * Ha ronnieBotId meg van adva a settings-ben, azt adja vissza; különben név alapján keres
   * (displayName, username, globalName, case-insensitive).
   * Ha a bot nem található, null-t ad vissza.
   */
  async getRonnieUserId(channel: Channel, issuer: string): Promise<string | null> {
    try {
      if (settings.ccap.ronnieBotId?.trim()) {
        return settings.ccap.ronnieBotId.trim();
      }

      const guild: Guild = (channel as VoiceChannel).guild;
      const members: Collection<string, GuildMember> = await guild.members.fetch();
      const searchName: string = settings.ccap.ronnieBotName.trim().toLowerCase();

      const ronnieMember: GuildMember | undefined = members.find((member: GuildMember) => {
        if (!member.user.bot) {
          return false;
        }
        const displayNameMatch: boolean = (member.displayName?.trim().toLowerCase() ?? '') === searchName;
        const usernameMatch: boolean = (member.user.username?.trim().toLowerCase() ?? '') === searchName;
        const globalNameMatch: boolean =
          (member.user.globalName?.trim().toLowerCase() ?? '') === searchName;
        return displayNameMatch || usernameMatch || globalNameMatch;
      });

      if (ronnieMember) {
        return ronnieMember.id;
      }

      DyFM_Log.warn(`Ronnie bot not found: ${settings.ccap.ronnieBotName}`);
      return null;
    } catch (error) {
      DyFM_Log.error('Error getting Ronnie mention:', error);
      return null;
    }
  }

  /**
   * Ronnie bot mention string lekérése a guild-ból (publikus, szöveges üzenetekhez is).
   * getRonnieUserId alapján építi a mention stringet.
   */
  async getRonnieMentionForChannel(channel: Channel, issuer: string): Promise<string | null> {
    const ronnieUserId: string | null = await this.getRonnieUserId(channel, issuer);
    return ronnieUserId ? `<@${ronnieUserId}>` : null;
  }
}