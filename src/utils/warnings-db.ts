// Uyarılar veritabanı işlemleri

import { db } from '../core/database.js';

export interface Warning {
  id: number;
  userId: string;
  guildId: string;
  moderatorId: string;
  moderatorTag: string;
  reason: string;
  timestamp: number;
}

export const addWarning = (
  guildId: string,
  userId: string,
  moderatorId: string,
  moderatorTag: string,
  reason: string
): Warning => {
  const stmt = db.prepare(`
    INSERT INTO warnings (user_id, guild_id, moderator_id, moderator_tag, reason)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(userId, guildId, moderatorId, moderatorTag, reason);
  
  return {
    id: result.lastInsertRowid as number,
    userId,
    guildId,
    moderatorId,
    moderatorTag,
    reason,
    timestamp: Date.now(),
  };
};

export const getWarnings = (guildId: string, userId: string): Warning[] => {
  const stmt = db.prepare(`
    SELECT * FROM warnings 
    WHERE guild_id = ? AND user_id = ?
    ORDER BY created_at DESC
  `);
  
  const rows = stmt.all(guildId, userId) as any[];
  
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    guildId: row.guild_id,
    moderatorId: row.moderator_id,
    moderatorTag: row.moderator_tag,
    reason: row.reason,
    timestamp: row.created_at * 1000,
  }));
};

export const removeWarning = (guildId: string, userId: string, index: number): boolean => {
  // Önce tüm uyarıları al
  const warnings = getWarnings(guildId, userId);
  
  if (index < 0 || index >= warnings.length) {
    return false;
  }
  
  // Belirtilen index'teki uyarıyı sil
  const warningToDelete = warnings[index];
  if (!warningToDelete) {
    return false;
  }
  
  const stmt = db.prepare(`
    DELETE FROM warnings WHERE id = ?
  `);
  
  const result = stmt.run(warningToDelete.id);
  return result.changes > 0;
};

export const clearWarnings = (guildId: string, userId: string): number => {
  const stmt = db.prepare(`
    DELETE FROM warnings WHERE guild_id = ? AND user_id = ?
  `);
  
  const result = stmt.run(guildId, userId);
  return result.changes;
};

