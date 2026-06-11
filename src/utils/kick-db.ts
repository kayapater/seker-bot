// Kick kanalları veritabanı işlemleri

import { db } from '../core/database.js';

export interface KickChannel {
  id: number;
  kickUsername: string;
  guildId: string;
  channelId: string;
  lastLiveStatus: boolean;
  lastChecked: number;
  mentionEveryone: boolean;
}

export const addKickChannel = (
  kickUsername: string,
  guildId: string,
  channelId: string,
  mentionEveryone: boolean = false
): KickChannel => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO kick_channels (kick_username, guild_id, channel_id, last_live_status, last_checked, mention_everyone)
    VALUES (?, ?, ?, 0, ?, ?)
  `);
  
  stmt.run(kickUsername.toLowerCase(), guildId, channelId, Date.now(), mentionEveryone ? 1 : 0);
  
  return getKickChannel(guildId, kickUsername)!;
};

export const removeKickChannel = (guildId: string, kickUsername: string): boolean => {
  const stmt = db.prepare(`
    DELETE FROM kick_channels 
    WHERE guild_id = ? AND kick_username = ?
  `);
  
  const result = stmt.run(guildId, kickUsername.toLowerCase());
  return result.changes > 0;
};

export const getKickChannels = (guildId: string): KickChannel[] => {
  const stmt = db.prepare(`
    SELECT * FROM kick_channels WHERE guild_id = ?
  `);
  
  const rows = stmt.all(guildId) as any[];
  
  return rows.map((row) => ({
    id: row.id,
    kickUsername: row.kick_username,
    guildId: row.guild_id,
    channelId: row.channel_id,
    lastLiveStatus: row.last_live_status === 1,
    lastChecked: row.last_checked,
    mentionEveryone: row.mention_everyone === 1 || false,
  }));
};

export const getAllKickChannels = (): KickChannel[] => {
  const stmt = db.prepare(`
    SELECT * FROM kick_channels
  `);
  
  const rows = stmt.all() as any[];
  
  return rows.map((row) => ({
    id: row.id,
    kickUsername: row.kick_username,
    guildId: row.guild_id,
    channelId: row.channel_id,
    lastLiveStatus: row.last_live_status === 1,
    lastChecked: row.last_checked,
    mentionEveryone: row.mention_everyone === 1,
  }));
};

export const getKickChannel = (guildId: string, kickUsername: string): KickChannel | undefined => {
  const stmt = db.prepare(`
    SELECT * FROM kick_channels 
    WHERE guild_id = ? AND kick_username = ?
  `);
  
  const row = stmt.get(guildId, kickUsername.toLowerCase()) as any;
  
  if (!row) {
    return undefined;
  }
  
  return {
    id: row.id,
    kickUsername: row.kick_username,
    guildId: row.guild_id,
    channelId: row.channel_id,
    lastLiveStatus: row.last_live_status === 1,
    lastChecked: row.last_checked,
    mentionEveryone: row.mention_everyone === 1,
  };
};

export const updateKickChannelStatus = (
  guildId: string,
  kickUsername: string,
  isLive: boolean
): void => {
  const stmt = db.prepare(`
    UPDATE kick_channels 
    SET last_live_status = ?, last_checked = ?
    WHERE guild_id = ? AND kick_username = ?
  `);
  
  stmt.run(isLive ? 1 : 0, Date.now(), guildId, kickUsername.toLowerCase());
};

