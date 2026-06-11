import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun gecikme süresini gösterir.'),
  async execute(interaction) {
    const sent = await interaction.reply({
      content: '🏓 Pong! Hesaplanıyor...',
      fetchReply: true,
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const websocket = interaction.client.ws.ping;

    await interaction.editReply({
      content: [
        '🏓 **Pong!**',
        `📡 WebSocket: **${websocket}ms**`,
        `⏱️ Gecikme: **${roundtrip}ms**`,
      ].join('\n'),
    });
  },
};

