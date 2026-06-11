import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';
import type { Command } from '../types/command.js';
import { logger } from '../utils/logger.js';

export const oynat: Command = {
  data: new SlashCommandBuilder()
    .setName('oynat')
    .setDescription('Bir şarkı çalar veya sıraya ekler (SoundCloud).')
    .addStringOption((option) =>
      option
        .setName('sarki')
        .setDescription('Çalınacak şarkı adı veya linki')
        .setRequired(true)
    ),
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const player = useMainPlayer();
    if (!player) {
      await interaction.reply({ content: 'Müzik çalar başlatılamadı!', ephemeral: true });
      return;
    }

    const channel = (interaction.member as any)?.voice?.channel;
    if (!channel) {
      await interaction.reply({ content: 'Müzik çalmak için bir ses kanalında olmalısın!', ephemeral: true });
      return;
    }

    const query = interaction.options.getString('sarki', true);

    await interaction.deferReply();

    try {
      // Link mi yoksa arama terimi mi kontrol et
      const searchEngine = query.startsWith('http') ? QueryType.AUTO : QueryType.SOUNDCLOUD_SEARCH;

      const { track } = await player.play(channel, query, {
        searchEngine: searchEngine, // Varsayılan olarak SoundCloud'da ara
        nodeOptions: {
          metadata: interaction,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 300000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 300000,
        },
      });

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎵 Müzik Eklendi')
        .setDescription(`**[${track.title}](${track.url})**\nSıraya eklendi!`)
        .setThumbnail(track.thumbnail)
        .addFields(
          { name: 'Süre', value: track.duration, inline: true },
          { name: 'İsteyen', value: interaction.user.toString(), inline: true }
        )
        .setFooter({ text: `Şeker Bot Müzik Sistemi` });

      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      logger.error(`Şarkı oynatma hatası: ${e}`);
      await interaction.editReply(`Bir hata oluştu: Şarkı bulunamadı veya oynatılamıyor.\nHata: ${e}`);
    }
  }
};
