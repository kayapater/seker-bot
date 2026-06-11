import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { removeKickChannel, getKickChannel } from '../utils/kick-db.js';

export const kickSil: Command = {
  data: new SlashCommandBuilder()
    .setName('kick-sil')
    .setDescription('Kick kanalını takip listesinden çıkarır.')
    .addStringOption((option) =>
      option
        .setName('kullanici')
        .setDescription('Kick kullanıcı adı')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['Administrator'],
  async execute(interaction) {
    const kickUsername = interaction.options.getString('kullanici', true);

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    const existing = getKickChannel(guild.id, kickUsername);
    if (!existing) {
      await interaction.reply({
        content: `**${kickUsername}** takip listesinde bulunamadı.`,
        ephemeral: true,
      });
      return;
    }

    const removed = removeKickChannel(guild.id, kickUsername);
    if (removed) {
      await interaction.reply({
        content: `✅ **${kickUsername}** takip listesinden çıkarıldı.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'Kanal silinirken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};

