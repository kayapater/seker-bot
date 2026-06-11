import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import type { Command } from '../types/command.js';

export const durdur: Command = {
  data: new SlashCommandBuilder()
    .setName('durdur')
    .setDescription('Müziği kapatır, sırayı siler ve kanaldan ayrılır.'),
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const player = useMainPlayer();
    if (!player) {
      await interaction.reply({ content: 'Müzik çalar aktif değil.', ephemeral: true });
      return;
    }

    const queue = player.nodes.get(interaction.guildId!);

    if (!queue) {
      await interaction.reply({ content: 'Şu anda çalan bir müzik yok.', ephemeral: true });
      return;
    }

    queue.delete();

    await interaction.reply('⏹️ Müzik durduruldu ve kuyruk temizlendi.');
  }
};
