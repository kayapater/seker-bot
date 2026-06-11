import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { commands } from './commands/index.js';
import { logger } from './utils/logger.js';
import type { Command } from './types/command.js';

const rest = new REST({ version: '10' }).setToken(env.token);

const register = async () => {
  try {
    logger.info('Slash komutları güncelleniyor...');

    const body = commands.map((command: Command) => command.data.toJSON());

    if (env.guildId) {
      // Guild komutları (hızlı test için)
      await rest.put(
        Routes.applicationGuildCommands(env.clientId, env.guildId),
        { body }
      );
      logger.info(`Slash komutları sunucuya (${env.guildId}) başarıyla kaydedildi.`);
    } else {
      // Global komutlar (tüm sunucularda kullanılabilir, 1 saate kadar sürebilir)
      await rest.put(
        Routes.applicationCommands(env.clientId),
        { body }
      );
      logger.info('Slash komutları global olarak başarıyla kaydedildi. (Yayılması 1 saate kadar sürebilir)');
    }
  } catch (error) {
    logger.error('Komutlar güncellenirken hata oluştu.', error);
    process.exit(1);
  }
};

register();

