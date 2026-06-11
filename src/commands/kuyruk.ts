import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import type { Command } from '../types/command.js';

export const kuyruk: Command = {
  data: new SlashCommandBuilder()
    .setName('kuyruk')
    .setDescription('Müzik kuyruğunu gösterir.'),
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const player = useMainPlayer();
    if (!player) {
      await interaction.reply({ content: 'Müzik çalar aktif değil.', ephemeral: true });
      return;
    }

    const queue = player.nodes.get(interaction.guildId!);

    if (!queue || queue.tracks.size === 0) {
      await interaction.reply({ content: 'Kuyruk boş veya şu an müzik çalmıyor.', ephemeral: true });
      return;
    }

    const currentTrack = queue.currentTrack;
    const tracks = queue.tracks.toArray();
    
    // İlk 10 şarkıyı göster
    const tracksList = tracks.slice(0, 10).map((track, i) => {
      return `${i + 1}. **[${track.title}](${track.url})** - ${track.duration}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🎵 Müzik Kuyruğu')
      .setDescription(`**Şu an Çalıyor:**\n[${currentTrack?.title}](${currentTrack?.url}) - ${currentTrack?.duration}\n\n**Sıradakiler:**\n${tracksList}`)
      .setFooter({ text: `${tracks.length} şarkı sırada` });

    await interaction.reply({ embeds: [embed] });
  }
};
