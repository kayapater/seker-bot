// Ticket veritabanı işlemleri

import { db } from '../core/database.js';

export interface Ticket {
  id: number;
  userId: string;
  channelId: string;
  guildId: string;
  createdAt: number;
  closedAt?: number;
}

export const createTicket = (userId: string, channelId: string, guildId: string): Ticket => {
  const stmt = db.prepare(`
    INSERT INTO tickets (user_id, channel_id, guild_id)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(userId, channelId, guildId);
  
  return {
    id: result.lastInsertRowid as number,
    userId,
    channelId,
    guildId,
    createdAt: Date.now(),
  };
};

export const getTicket = (channelId: string): Ticket | undefined => {
  const stmt = db.prepare(`
    SELECT * FROM tickets WHERE channel_id = ? AND closed_at IS NULL
  `);
  
  const row = stmt.get(channelId) as any;
  
  if (!row) {
    return undefined;
  }
  
  const ticket: Ticket = {
    id: row.id,
    userId: row.user_id,
    channelId: row.channel_id,
    guildId: row.guild_id,
    createdAt: row.created_at * 1000,
  };
  
  if (row.closed_at) {
    ticket.closedAt = row.closed_at * 1000;
  }
  
  return ticket;
};

export const getUserTickets = (userId: string, guildId: string): Ticket[] => {
  const stmt = db.prepare(`
    SELECT * FROM tickets 
    WHERE user_id = ? AND guild_id = ? AND closed_at IS NULL
  `);
  
  const rows = stmt.all(userId, guildId) as any[];
  
  return rows.map((row) => {
    const ticket: Ticket = {
      id: row.id,
      userId: row.user_id,
      channelId: row.channel_id,
      guildId: row.guild_id,
      createdAt: row.created_at * 1000,
    };
    
    if (row.closed_at) {
      ticket.closedAt = row.closed_at * 1000;
    }
    
    return ticket;
  });
};

export const deleteTicket = (channelId: string): boolean => {
  const stmt = db.prepare(`
    UPDATE tickets 
    SET closed_at = strftime('%s', 'now')
    WHERE channel_id = ?
  `);
  
  const result = stmt.run(channelId);
  return result.changes > 0;
};

