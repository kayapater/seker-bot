import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import type { Command } from '../types/command.js';

export const devam: Command = {
  data: new SlashCommandBuilder()
    .setName('devam')
    .setDescription('Duraklatılan şarkıyı devam ettirir.'),
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const player = useMainPlayer();
    const queue = player?.nodes.get(interaction.guildId!);

    if (!queue) {
      await interaction.reply({ content: 'Şu anda bir müzik kuyruğu yok.', ephemeral: true });
      return;
    }

    if (!queue.node.isPaused()) {
      await interaction.reply({ content: 'Müzik zaten çalıyor!', ephemeral: true });
      return;
    }

    queue.node.resume();
    await interaction.reply('▶️ Müzik devam ediyor.');
  }
};


