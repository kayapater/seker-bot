import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { addWarning, getWarnings } from '../utils/warnings-db.js';
import { logModeration } from '../utils/logger-system.js';

export const uyar: Command = {
  data: new SlashCommandBuilder()
    .setName('uyar')
    .setDescription('Bir kullanıcıya uyarı verir.')
    .addUserOption((option) =>
      option
        .setName('kullanıcı')
        .setDescription('Uyarı verilecek kullanıcı')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('sebep')
        .setDescription('Uyarı sebebi')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ModerateMembers'],
  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanıcı', true);
    const reason = interaction.options.getString('sebep', true);

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: 'Kendine uyarı veremezsin!',
        ephemeral: true,
      });
      return;
    }

    const warning = addWarning(
      guild.id,
      targetUser.id,
      interaction.user.id,
      interaction.user.tag,
      reason
    );

    const totalWarnings = getWarnings(guild.id, targetUser.id).length;

    await interaction.reply({
      content: `⚠️ **${targetUser.tag}** kullanıcısına uyarı verildi.\n📝 Sebep: ${reason}\n📊 Toplam uyarı: **${totalWarnings}**`,
    });

    // Log kaydı
    await logModeration(interaction.client, {
      guild,
      action: 'Uyarı Verildi',
      moderator: interaction.user,
      target: targetUser,
      reason,
      details: `Toplam uyarı: ${totalWarnings}`,
      color: 0xffff00,
    });
  },
};

