// Moderasyon log sistemi

import type { Client, Guild, User, GuildMember, TextChannel } from 'discord.js';
import { getGuildSettings } from './guild-settings-db.js';
import { logger } from './logger.js';
import { getTurkeyISOString } from './time.js';

export interface LogOptions {
  guild: Guild;
  action: string;
  moderator: User | GuildMember;
  target?: User | GuildMember;
  reason?: string;
  details?: string | undefined;
  color?: number;
}

/**
 * Moderasyon işlemini log kanalına kaydeder
 */
export const logModeration = async (client: Client, options: LogOptions): Promise<void> => {
  try {
    const settings = getGuildSettings(options.guild.id);
    
    if (!settings || !settings.logChannelId) {
      return; // Log kanalı ayarlanmamış
    }

    const logChannel = await client.channels.fetch(settings.logChannelId).catch(() => null);
    
    if (!logChannel || !('send' in logChannel)) {
      logger.warn(`Log kanalı bulunamadı veya erişilemedi: ${settings.logChannelId}`);
      return;
    }

    const moderatorUser = 'user' in options.moderator ? options.moderator.user : options.moderator;
    const targetUser = options.target 
      ? ('user' in options.target ? options.target.user : options.target)
      : null;

    const embed: any = {
      color: options.color || 0x5865f2,
      title: `📋 ${options.action}`,
      fields: [
        {
          name: '👮 Yetkili',
          value: `${moderatorUser.tag} (${moderatorUser.id})`,
          inline: true,
        },
      ],
      timestamp: getTurkeyISOString(),
      footer: {
        text: options.guild.name,
        icon_url: options.guild.iconURL() || undefined,
      },
    };

    if (targetUser) {
      embed.fields.push({
        name: '👤 Hedef',
        value: `${targetUser.tag} (${targetUser.id})`,
        inline: true,
      });
    }

    if (options.reason) {
      embed.fields.push({
        name: '📝 Sebep',
        value: options.reason,
        inline: false,
      });
    }

    if (options.details) {
      embed.fields.push({
        name: '📄 Detaylar',
        value: options.details,
        inline: false,
      });
    }

    await (logChannel as TextChannel).send({ embeds: [embed] });
  } catch (error) {
    logger.error('Log gönderilirken hata oluştu:', error);
  }
};

