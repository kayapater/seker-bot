import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import type { Command } from '../types/command.js';

export const duraklat: Command = {
  data: new SlashCommandBuilder()
    .setName('duraklat')
    .setDescription('Çalan şarkıyı geçici olarak duraklatır.'),
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const player = useMainPlayer();
    const queue = player?.nodes.get(interaction.guildId!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({ content: 'Şu anda çalan bir müzik yok.', ephemeral: true });
      return;
    }

    if (queue.node.isPaused()) {
      await interaction.reply({ content: 'Müzik zaten duraklatılmış! Devam ettirmek için `/devam` kullanın.', ephemeral: true });
      return;
    }

    queue.node.pause();
    await interaction.reply('⏸️ Müzik duraklatıldı.');
  }
};


