// Sunucu ayarları veritabanı işlemleri

import { db } from '../core/database.js';

export interface GuildSettings {
  id: number;
  guildId: string;
  logChannelId: string | null;
  createdAt: number;
}

/**
 * Sunucu ayarlarını getirir
 */
export const getGuildSettings = (guildId: string): GuildSettings | undefined => {
  const stmt = db.prepare(`
    SELECT * FROM guild_settings WHERE guild_id = ?
  `);
  
  const row = stmt.get(guildId) as any;
  
  if (!row) {
    return undefined;
  }
  
  return {
    id: row.id,
    guildId: row.guild_id,
    logChannelId: row.log_channel_id,
    createdAt: row.created_at,
  };
};

/**
 * Log kanalını ayarlar
 */
export const setLogChannel = (guildId: string, channelId: string | null): void => {
  const existing = getGuildSettings(guildId);
  
  if (existing) {
    const stmt = db.prepare(`
      UPDATE guild_settings SET log_channel_id = ? WHERE guild_id = ?
    `);
    stmt.run(channelId, guildId);
  } else {
    const stmt = db.prepare(`
      INSERT INTO guild_settings (guild_id, log_channel_id) VALUES (?, ?)
    `);
    stmt.run(guildId, channelId);
  }
};

