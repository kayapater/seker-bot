import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';

export const yavasMod: Command = {
  data: new SlashCommandBuilder()
    .setName('yavaş-mod')
    .setDescription('Kanal yavaş modunu ayarlar (saniye cinsinden).')
    .addIntegerOption((option) =>
      option
        .setName('saniye')
        .setDescription('Yavaş mod süresi (0-21600 saniye, 0 = kapat)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Ayarlanacak kanal (boş bırakılırsa mevcut kanal)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageChannels'],
  requiredClientPermissions: ['ManageChannels'],
  async execute(interaction) {
    const seconds = interaction.options.getInteger('saniye', true);
    const channelOption = interaction.options.getChannel('kanal');
    const channel = (channelOption || interaction.channel) as any;

    if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildForum)) {
      await interaction.reply({
        content: 'Sadece metin veya forum kanalları için yavaş mod ayarlanabilir.',
        ephemeral: true,
      });
      return;
    }

    try {
      await channel.setRateLimitPerUser(seconds);

      if (seconds === 0) {
        await interaction.reply({
          content: `✅ **${channel.name}** kanalında yavaş mod kapatıldı.`,
        });
      } else {
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        let timeText = '';
        if (hours > 0) {
          timeText = `${hours} saat`;
        } else if (minutes > 0) {
          timeText = `${minutes} dakika`;
        } else {
          timeText = `${seconds} saniye`;
        }

        await interaction.reply({
          content: `✅ **${channel.name}** kanalında yavaş mod **${timeText}** olarak ayarlandı.`,
        });
      }
    } catch (error) {
      await interaction.reply({
        content: 'Yavaş mod ayarlanırken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};

