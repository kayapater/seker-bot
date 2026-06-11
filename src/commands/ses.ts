import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import type { Command } from '../types/command.js';

export const ses: Command = {
  data: new SlashCommandBuilder()
    .setName('ses')
    .setDescription('Ses seviyesini ayarlar.')
    .addIntegerOption(option => 
      option.setName('seviye')
        .setDescription('Ses seviyesi (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const player = useMainPlayer();
    if (!player) {
      await interaction.reply({ content: 'Müzik çalar aktif değil.', ephemeral: true });
      return;
    }

    const queue = player.nodes.get(interaction.guildId!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({ content: 'Şu anda çalan bir müzik yok.', ephemeral: true });
      return;
    }

    const vol = interaction.options.getInteger('seviye', true);
    
    queue.node.setVolume(vol);

    await interaction.reply(`🔊 Ses seviyesi **%${vol}** olarak ayarlandı.`);
  }
};
