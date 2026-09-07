import { CCAP_ServiceBase } from '../../../_services/new-ass/ccap.service-base.js';
import { DyFM_AI_Message } from '@futdevpro/fsm-dynamo/ai';
import { DyNTS_Bot_ChannelWrapper } from '@futdevpro/nts-dynamo/bot';
import { TextChannel } from 'discord.js';

/**
 * Voice-specific service base
 * Bridges type gap between new-ass (DyFM_AI_Message) and voice module (DyFM_AI_Message)
 */
export class CV_ServiceBase extends CCAP_ServiceBase {
  
  /**
   * Override to return OAI messages for voice compatibility
   * Converts DyFM_AI_Message[] to DyFM_AI_Message[]
   */
  //override async gatherMessagesInChannel(
  //  channel: DyNTS_Bot_ChannelWrapper,
  //  issuer: string,
  //): Promise<DyFM_AI_Message[]> {
  //  const aiMessages = await super.gatherMessagesInChannel(channel, issuer);
  //  
  //  // Convert DyFM_AI_Message[] to DyFM_AI_Message[]
  //  return aiMessages.map(msg => ({
  //    role: msg.role as any, // Roles are compatible
  //    content: msg.content
  //  }));
  //}
}

