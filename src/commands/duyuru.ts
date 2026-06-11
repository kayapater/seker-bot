import { ChannelType, SlashCommandBuilder, TextChannel, NewsChannel } from 'discord.js';
import type { Command } from '../types/command.js';

export const duyuru: Command = {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription('Belirli bir kanala duyuru gönderir.')
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Duyurunun gönderileceği kanal')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('mesaj')
        .setDescription('Duyuru mesajı')
        .setRequired(true)
        .setMaxLength(2000)
    )
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageMessages'],
  requiredClientPermissions: ['SendMessages', 'ViewChannel'],
  async execute(interaction) {
    const channelId = interaction.options.getChannel('kanal', true).id;
    const message = interaction.options.getString('mesaj', true);

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    const channel = guild.channels.cache.get(channelId) as TextChannel | NewsChannel | null;

    if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
      await interaction.reply({
        content: 'Sadece metin veya duyuru kanalları seçilebilir.',
        ephemeral: true,
      });
      return;
    }

    try {
      await channel.send({
        content: message,
      });

      await interaction.reply({
        content: `✅ Duyuru **${channel.name}** kanalına başarıyla gönderildi!`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: 'Duyuru gönderilirken bir hata oluştu. Botun o kanala mesaj gönderme yetkisi olduğundan emin ol.',
        ephemeral: true,
      });
    }
  },
};

