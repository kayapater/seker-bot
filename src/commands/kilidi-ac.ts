import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';

export const kilidiAc: Command = {
  data: new SlashCommandBuilder()
    .setName('kilidi-ac')
    .setDescription('Bir kanalın kilidini açar.')
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Kilidi açılacak kanal (boş bırakılırsa mevcut kanal)')
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
        content: 'Sadece metin veya forum kanalları açılabilir.',
        ephemeral: true,
      });
      return;
    }

    try {
      await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone.id, {
        SendMessages: null,
        SendMessagesInThreads: null,
      });

      await interaction.reply({
        content: `🔓 **${channel.name}** kanalının kilidi açıldı.`,
      });
    } catch (error) {
      await interaction.reply({
        content: 'Kanal kilidi açılırken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};

