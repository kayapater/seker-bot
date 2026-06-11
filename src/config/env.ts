import { config } from 'dotenv';

config();

const requiredKeys = ['DISCORD_TOKEN', 'CLIENT_ID'] as const;

requiredKeys.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Ortam değişkeni eksik: ${key}`);
  }
});

export const env = {
  token: process.env.DISCORD_TOKEN as string,
  clientId: process.env.CLIENT_ID as string,
  guildId: process.env.GUILD_ID as string | undefined,
};

