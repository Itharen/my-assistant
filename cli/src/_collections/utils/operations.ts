import { DyFM_Error, DyFM_Log } from '@futdevpro/fsm-dynamo';

import { 
  Client, Guild, GuildChannelManager, GuildBasedChannel, Message, TextBasedChannel, GuildMember, 
  TextChannel,
  VoiceChannel
} from 'discord.js';
import { Collection } from 'discord.js';
import { settings } from '../consts/settings.const.js'
import { Subscription } from 'rxjs';

export interface LastMessageDate {
  memberName: string
  allMessages: number
  lastMessageDate: Date
}

export interface LastMentionDate {
  memberId: string
  memberName: string
  allMentions: number
  lastMentionDate: Date
}

export class Operations {

  static findChannelByName(channels: GuildChannelManager, name: string): GuildBasedChannel {
    const channel = channels.cache.find(
      (ch) => ch.name === name && ch.isTextBased()
    )

    if (!channel) {
      DyFM_Log.error(`No text channel found "${name}"`)
      return
    }

    return channel
  }

  static findTextChannelByName(channels: GuildChannelManager, name: string): TextChannel {
    const channel = this.findChannelByName(channels, name)

    if (!channel) {
      throw new Error(`No text channel found with name: "${name}"`)
    }
    
    if (!channel?.isTextBased()) {
      throw new Error(`Channel is not text based "${name}"`)
    }

    return channel as TextChannel
  }

  static findVoiceChannelByName(channels: GuildChannelManager, name: string): VoiceChannel {
    const channel = this.findChannelByName(channels, name)
    
    if (!channel.isVoiceBased()) {
      throw new Error(`Channel is not voice based "${name}"`)
    }

    return channel as VoiceChannel
  }

  static async reportIn(guild: Guild, client: Client): Promise<void> {
    try {
      const lastReportMessage = await Operations.getLastMessageInChannel(
        guild,
        settings.ccap.channelNames.report
      )
      const reportMessage = `${client.user?.username} report for duty! (v${settings.version} ${settings.env})`

      if (lastReportMessage.content === reportMessage) {
        await Operations.deleteMessage(lastReportMessage).catch((error) => {
          DyFM_Error.logSimple('Failed to delete message', error);
        });
      }

      Operations.sendMessageToChannelByName(
        guild, 
        settings.ccap.channelNames.report, 
        reportMessage
      )
    } catch (error) {
      DyFM_Error.logSimple('Failed to report in', error);
    }
  }

  static sendMessageToChannelByName(guild: Guild, channelName: string, message: string) {
    const channel = Operations.findChannelByName(guild.channels, channelName)

    if (channel?.isTextBased()) {
      channel.send(message)
      DyFM_Log.success('Message sent to channel', channel.name)
    } else {
      DyFM_Log.error(`Channel is not text based "${channelName}"`)
    }
  }

  static async readMembersInChannel(
    guild: Guild, 
    channelName: string
  ): Promise<Collection<string, GuildMember>> {
    const channel = Operations.findChannelByName(guild.channels, channelName)
        
    const members = await this.fetchMembersInGuild(guild)

    const allowedMembers = members?.filter((member) =>
      channel.permissionsFor(member)?.has('ViewChannel')
    )

    return allowedMembers
  }

  static async fetchMembersInGuild(guild: Guild): Promise<Collection<string, GuildMember>> {
    try {
      // Try to fetch with a limit to avoid timeout
      return await guild?.members.fetch({ limit: 1000 })
    } catch (fetchError: any) {
      throw new DyFM_Error({
        errorCode: 'CCAP-OPS-FMI0',
        message: 'Failed to fetch members',
        error: fetchError,
      })
    }
  }

  static async readMemberNamesInChannel(guild: Guild, channelName: string): Promise<string[]> {
    const members = await Operations.readMembersInChannel(guild, channelName)

    const memberNames = members?.map((member) => member.user.username)

    return memberNames
  }

  static async fetchAllMessagesWithPaging(
    channel: TextBasedChannel,
    maxFetch = 1000
  ): Promise<Collection<string, Message<true>>> {
    let lastId: string | undefined;
    let fetched: number = 0;
    const allMessages = new Collection<string, Message<true>>();

    while (fetched < maxFetch) {
      const options: any = { limit: 100 };
      if (lastId) options.before = lastId;

      const messages = await channel.messages.fetch(options) as unknown as Collection<string, Message<true>>;
      if (messages.size === 0) break;

      messages.forEach((msg: Message<true>) => {
        allMessages.set(msg.id, msg);
      });

      lastId = messages.last()?.id;
      fetched += messages.size;
    }

    DyFM_Log.success('Fetched messages with paging', allMessages.size);
    return allMessages;
  }

  static async readLastMessageDatesByMembers(
    guild: Guild, 
    channelName: string,
    memberNames: string[]
  ): Promise<LastMessageDate[]> {
    const channel = Operations.findChannelByName(guild.channels, channelName)

    if (!channel?.isTextBased()) {
      DyFM_Log.error(`Channel is not text based "${channelName}"`)
      return
    }

    // Prepare tracking for each member
    const memberStatus: Record<string, { lastMessageDate: Date | null, allMessages: number }> = {};
    memberNames.forEach(name => {
      memberStatus[name] = { lastMessageDate: null, allMessages: 0 };
    });

    let lastId: string | undefined;
    let done: boolean = false;
    const cutoffTime: number = Date.now() - settings.messageFetchTimeLimit;
    let totalFetched: number = 0;

    while (!done && totalFetched < settings.messageFetchCountLimit) {
      const options: any = { limit: 100 };
      if (lastId) options.before = lastId;
      const messages = await channel.messages.fetch(options) as unknown as Collection<string, Message<true>>;
      if (messages.size === 0) break;

      let shouldStop = false;
      messages.forEach((message) => {
        // Check if message is too old
        if (message.createdTimestamp < cutoffTime) {
          shouldStop = true;

          return;
        }

        const author = message.author.username;
        if (memberStatus[author] !== undefined) {
          memberStatus[author].allMessages++;

          // Only set lastMessageDate if not already set (since we fetch newest first)
          if (!memberStatus[author].lastMessageDate) {
            memberStatus[author].lastMessageDate = message.createdAt;
          }
        }
      });

      if (shouldStop) {
        DyFM_Log.warn('Reached time limit cutoff');
        break;
      }

      // Check if all members have a lastMessageDate
      done = memberNames.every(name => memberStatus[name].lastMessageDate !== null);
      lastId = messages.last()?.id;
      totalFetched += messages.size;
    }

    if (totalFetched >= settings.messageFetchCountLimit) {
      DyFM_Log.warn('Reached maximum fetch count limit', settings.messageFetchCountLimit);
    }

    const lastMessageDatesByMembers: LastMessageDate[] = memberNames.map((memberName) => {
      const status = memberStatus[memberName];
      if (!status.lastMessageDate) {
        DyFM_Log.warn('No last message date found for member', memberName);

        return {
          memberName: memberName,
          allMessages: status.allMessages,
          lastMessageDate: null/* new Date(0) */
        }
      }

      return ({ 
        memberName: memberName, 
        allMessages: status.allMessages,
        lastMessageDate: new Date(status.lastMessageDate)
      })
    });

    return lastMessageDatesByMembers;
  }

  static async readLastMessageWithMemberNamePingInIt(
    guild: Guild,
    channelName: string,
    members: Collection<string, GuildMember>
  ): Promise<LastMentionDate[]> {
    const channel = Operations.findChannelByName(guild.channels, channelName)

    if (!channel?.isTextBased()) {
      DyFM_Log.error(`Channel is not text based "${channelName}"`)
      return []
    }

    // Prepare tracking for each member
    const memberStatus: Record<string, { lastMentionDate: Date | null, allMentions: number }> = {};
    members.forEach(member => {
      memberStatus[member.user.username] = { lastMentionDate: null, allMentions: 0 };
    });

    let lastId: string | undefined;
    let done: boolean = false;
    const cutoffTime: number = Date.now() - settings.messageFetchTimeLimit;
    let totalFetched: number = 0;

    while (!done && totalFetched < settings.messageFetchCountLimit) {
      const options: any = { limit: 100 };
      if (lastId) options.before = lastId;
      const messages = await channel.messages.fetch(options) as unknown as Collection<string, Message<true>>;
      if (messages.size === 0) break;

      let shouldStop = false;
      messages.forEach((message) => {
        // Check if message is too old
        if (message.createdTimestamp < cutoffTime) {
          shouldStop = true;
          return;
        }

        // Check if message content contains "@Username" for any member
        members.forEach(member => {
          if (message.content.includes(`@${member.user.id}`) && !memberStatus[member.user.username].lastMentionDate) {
            memberStatus[member.user.username].lastMentionDate = message.createdAt;
            memberStatus[member.user.username].allMentions++;
            DyFM_Log.success(
              'Found message with member ping', 
              { 
                memberName: member.user.username, 
                messageId: message.id 
              }
            );
          }
        });
      });

      if (shouldStop) {
        DyFM_Log.warn('Reached time limit cutoff while searching for member pings');
        break;
      }

      // Check if all members have a lastMessageDate
      done = members.every(member => memberStatus[member.user.username].lastMentionDate !== null);
      lastId = messages.last()?.id;
      totalFetched += messages.size;
    }

    if (totalFetched >= settings.messageFetchCountLimit) {
      DyFM_Log.warn(
        'Reached maximum fetch count limit while searching for member pings', 
        settings.messageFetchCountLimit
      );
    }

    const lastMentionDatesByMembers: LastMentionDate[] = members.map((member) => {
      const status = memberStatus[member.user.username];
      if (!status.lastMentionDate) {
        DyFM_Log.warn('No message found with member ping', member.user.username);
        return {
          memberId: member.user.id,
          memberName: member.user.username,
          allMentions: status.allMentions,
          lastMentionDate: null/* new Date(0) */
        }
      }
      return ({ 
        memberId: member.user.id,
        memberName: member.user.username, 
        allMentions: status.allMentions,
        lastMentionDate: new Date(status.lastMentionDate)
      })
    });

    return lastMentionDatesByMembers;
  }
  static readMentionsInChannel = this.readLastMessageWithMemberNamePingInIt

  static async readLastMessagesInChannel(
    guild: Guild,
    channelName: string,
  ): Promise<Collection<string, Message<true>>> {
    const channel = Operations.findChannelByName(guild.channels, channelName)

    if (!channel?.isTextBased()) {
      DyFM_Log.error(`Channel is not text based "${channelName}"`)
      return
    }

    const messages = await channel.messages.fetch({ limit: 100 })

    return messages
  }
  
  static async getLastMessageInChannel(
    guild: Guild,
    channelName: string
  ): Promise<Message<true>> {
    const channel = Operations.findChannelByName(guild.channels, channelName)

    if (!channel?.isTextBased()) {
      DyFM_Log.error(`Channel is not text based "${channelName}"`)
      return
    }
    
    const messages = await channel.messages.fetch({ limit: 1 })

    return messages.first()
  }

  static getMemberIdByName(
    members: Collection<string, GuildMember>, 
    username: string
  ): string | undefined {
    const member = members.find(m => m.user.username === username);
    return member ? member.user.id : undefined;
  }

  static async deleteMessage(message: Message): Promise<void> {
    await message.delete().catch((error) => {
      DyFM_Error.logSimple('Failed to delete message', error);
    });

    DyFM_Log.success('Message deleted', message.id);
  }
}
