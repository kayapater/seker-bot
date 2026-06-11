import { db } from '../core/database.js';

interface WordGameChannel {
  id: number;
  channelId: string;
  guildId: string;
  isActive: boolean;
  lastLetter: string | null;
  lastUserId: string | null;
  wordCount: number;
  createdAt: number;
}

interface WordGameWord {
  id: number;
  channelId: string;
  word: string;
  userId: string;
  userTag: string;
  createdAt: number;
}

/**
 * Kanal için kelime oyununu başlatır
 */
export const startWordGame = (channelId: string, guildId: string): WordGameChannel => {
  // Önce mevcut oyunu kontrol et
  const existing = getWordGameChannel(channelId);
  if (existing && existing.isActive) {
    return existing;
  }

  // Yeni oyun başlat veya mevcut oyunu aktif et
  if (existing) {
    const stmt = db.prepare(
      'UPDATE word_game_channels SET is_active = 1, word_count = 0, last_letter = NULL, last_user_id = NULL WHERE channel_id = ?'
    );
    stmt.run(channelId);
    
    // Kullanılan kelimeleri temizle
    const clearWords = db.prepare('DELETE FROM word_game_words WHERE channel_id = ?');
    clearWords.run(channelId);
    
    return getWordGameChannel(channelId)!;
  }

  const stmt = db.prepare(
    'INSERT INTO word_game_channels (channel_id, guild_id, is_active, word_count) VALUES (?, ?, 1, 0)'
  );
  const info = stmt.run(channelId, guildId);
  
  return {
    id: info.lastInsertRowid as number,
    channelId,
    guildId,
    isActive: true,
    lastLetter: null,
    lastUserId: null,
    wordCount: 0,
    createdAt: Math.floor(Date.now() / 1000),
  };
};

/**
 * Kanal için kelime oyununu bitirir
 */
export const stopWordGame = (channelId: string): boolean => {
  const stmt = db.prepare('UPDATE word_game_channels SET is_active = 0 WHERE channel_id = ?');
  const info = stmt.run(channelId);
  return info.changes > 0;
};

/**
 * Kanal için kelime oyunu durumunu alır
 */
export const getWordGameChannel = (channelId: string): WordGameChannel | undefined => {
  const stmt = db.prepare('SELECT * FROM word_game_channels WHERE channel_id = ?');
  const row: any = stmt.get(channelId);
  
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    channelId: row.channel_id,
    guildId: row.guild_id,
    isActive: row.is_active === 1,
    lastLetter: row.last_letter,
    lastUserId: row.last_user_id,
    wordCount: row.word_count,
    createdAt: row.created_at * 1000,
  };
};

/**
 * Sunucudaki tüm aktif kelime oyunlarını alır
 */
export const getActiveWordGames = (guildId?: string): WordGameChannel[] => {
  let stmt;
  let rows: any[];
  
  if (guildId) {
    stmt = db.prepare('SELECT * FROM word_game_channels WHERE is_active = 1 AND guild_id = ?');
    rows = stmt.all(guildId);
  } else {
    stmt = db.prepare('SELECT * FROM word_game_channels WHERE is_active = 1');
    rows = stmt.all();
  }

  return rows.map((row: any) => ({
    id: row.id,
    channelId: row.channel_id,
    guildId: row.guild_id,
    isActive: row.is_active === 1,
    lastLetter: row.last_letter,
    lastUserId: row.last_user_id,
    wordCount: row.word_count,
    createdAt: row.created_at * 1000,
  }));
};

/**
 * Kelime ekler ve oyun durumunu günceller
 */
export const addWord = (
  channelId: string,
  word: string,
  userId: string,
  userTag: string,
  lastLetter: string
): boolean => {
  try {
    // Kelimeyi ekle
    const wordStmt = db.prepare(
      'INSERT INTO word_game_words (channel_id, word, user_id, user_tag) VALUES (?, ?, ?, ?)'
    );
    wordStmt.run(channelId, word.toLowerCase(), userId, userTag);

    // Oyun durumunu güncelle
    const updateStmt = db.prepare(
      'UPDATE word_game_channels SET last_letter = ?, last_user_id = ?, word_count = word_count + 1 WHERE channel_id = ?'
    );
    updateStmt.run(lastLetter, userId, channelId);

    return true;
  } catch (error) {
    // Kelime zaten kullanılmış olabilir (UNIQUE constraint)
    return false;
  }
};

/**
 * Kanalda kullanılan kelimeleri alır
 */
export const getUsedWords = (channelId: string): WordGameWord[] => {
  const stmt = db.prepare('SELECT * FROM word_game_words WHERE channel_id = ? ORDER BY created_at DESC LIMIT 50');
  const rows: any[] = stmt.all(channelId);

  return rows.map((row: any) => ({
    id: row.id,
    channelId: row.channel_id,
    word: row.word,
    userId: row.user_id,
    userTag: row.user_tag,
    createdAt: row.created_at * 1000,
  }));
};

/**
 * Kelimenin daha önce kullanılıp kullanılmadığını kontrol eder
 */
export const isWordUsed = (channelId: string, word: string): boolean => {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM word_game_words WHERE channel_id = ? AND word = ?');
  const row: any = stmt.get(channelId, word.toLowerCase());
  return row && row.count > 0;
};

