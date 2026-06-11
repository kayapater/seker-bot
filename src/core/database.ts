import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { logger } from '../utils/logger.js';

const db: DatabaseType = new Database('data/bot.db');

// Veritabanı tablolarını oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS kick_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kick_username TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    last_live_status INTEGER DEFAULT 0,
    last_checked INTEGER DEFAULT 0,
    mention_everyone INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(guild_id, kick_username)
  );
  
  CREATE TABLE IF NOT EXISTS db_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    closed_at INTEGER,
    UNIQUE(channel_id)
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    moderator_tag TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS word_game_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL UNIQUE,
    guild_id TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    last_letter TEXT,
    last_user_id TEXT,
    word_count INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS word_game_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL,
    word TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_tag TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(channel_id, word)
  );

  CREATE TABLE IF NOT EXISTS guild_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL UNIQUE,
    log_channel_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_kick_channels_guild ON kick_channels(guild_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
  CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON warnings(guild_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_word_game_channels_guild ON word_game_channels(guild_id);
  CREATE INDEX IF NOT EXISTS idx_word_game_words_channel ON word_game_words(channel_id);
  CREATE INDEX IF NOT EXISTS idx_guild_settings_guild ON guild_settings(guild_id);
`);

// Migration sistemi: Eksik sütunları ekle
function runMigrations() {
  // Migration: kick_channels tablosuna mention_everyone sütunu ekle
  const migrationName = 'add_mention_everyone_to_kick_channels';
  const checkMigration = db.prepare('SELECT * FROM db_migrations WHERE migration_name = ?').get(migrationName);
  
  if (!checkMigration) {
    try {
      // Sütun var mı kontrol et
      const tableInfo = db.prepare('PRAGMA table_info(kick_channels)').all() as any[];
      const hasMentionEveryone = tableInfo.some((col: any) => col.name === 'mention_everyone');
      
      if (!hasMentionEveryone) {
        db.exec(`ALTER TABLE kick_channels ADD COLUMN mention_everyone INTEGER DEFAULT 0`);
        logger.info('Migration: mention_everyone sütunu eklendi.');
      }
      
      // Migration'ı kaydet
      db.prepare('INSERT INTO db_migrations (migration_name) VALUES (?)').run(migrationName);
      logger.info(`Migration '${migrationName}' uygulandı.`);
    } catch (error) {
      logger.error('Migration hatası:', error);
    }
  }
}

runMigrations();
logger.info('Veritabanı bağlantısı kuruldu.');

export { db };
