import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import type { Command } from '../types/command.js';

export const gec: Command = {
  data: new SlashCommandBuilder()
    .setName('gec')
    .setDescription('Çalan şarkıyı geçer.'),
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const player = useMainPlayer();
    if (!player) {
      await interaction.reply({ content: 'Müzik çalar aktif değil.', ephemeral: true });
      return;
    }

    const queue = player.nodes.get(interaction.guildId!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({ content: 'Şu anda çalan bir şarkı yok.', ephemeral: true });
      return;
    }

    queue.node.skip();

    await interaction.reply(`⏩ **${queue.currentTrack?.title}** geçildi!`);
  }
};
