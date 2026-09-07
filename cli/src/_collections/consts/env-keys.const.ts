import { GatewayIntentBits, Partials } from 'discord.js';
import * as dotenv from 'dotenv'

dotenv.config()

export const envKeys = {
  discord: {
    token: process.env.CCAP_DISCORD_BOT_TOKEN,
    clientId: process.env.CCAP_DISCORD_BOT_CLIENT_ID,
    oauth2Url: process.env.CCAP_DISCORD_BOT_OAUTH2_URL,
    guildId: process.env.FDP_DISCORD_GUILD_ID,
    reportChannelName: 'bot-reports',
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildVoiceStates,
    ],    
    partials: [
      Partials.Channel,
    ],
  },

  // atlasdbUri: process.env.CCAP_DB_URI,

  openAi: {
    apiKey: process.env.FDP_OPENAI_API_KEY,
    organization: process.env.FDP_OPENAI_ORGANIZATION,
    project: process.env.CCAP_OPENAI_PROJECT,
    ttsApiKey: process.env.FDP_OPENAI_TTS_API_KEY,
  },

  elevenLabs: {
    apiKey: process.env.FDP_ELEVENLABS_API_KEY,
  },

  clickup: {
    apiKey: process.env.OGS_CLICKUP_API_KEY,
    workspaceId: process.env.OGS_CLICKUP_WORKSPACE_ID,
    spaceId: process.env.OGS_CLICKUP_SPACE_ID,
    listId: process.env.OGS_CLICKUP_LIST_ID,
  },
};

