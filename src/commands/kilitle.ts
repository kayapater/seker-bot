import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';

export const kilitle: Command = {
  data: new SlashCommandBuilder()
    .setName('kilitle')
    .setDescription('Bir kanalı kilitler (herkes mesaj gönderemez).')
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Kilitlenecek kanal (boş bırakılırsa mevcut kanal)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageChannels'],
  requiredClientPermissions: ['ManageChannels'],
  async execute(interaction) {
    const channelOption = interaction.options.getChannel('kanal');
    const channel = (channelOption || interaction.channel) as any;

    if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildForum)) {
      await interaction.reply({
        content: 'Sadece metin veya forum kanalları kilitlenebilir.',
        ephemeral: true,
      });
      return;
    }

    try {
      await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone.id, {
        SendMessages: false,
        SendMessagesInThreads: false,
      });

      await interaction.reply({
        content: `🔒 **${channel.name}** kanalı kilitlendi.`,
      });
    } catch (error) {
      await interaction.reply({
        content: 'Kanal kilitlenirken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};

