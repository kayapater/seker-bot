import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { logModeration } from '../utils/logger-system.js';

export const at: Command = {
  data: new SlashCommandBuilder()
    .setName('at')
    .setDescription('Bir kullanıcıyı sunucudan atar.')
    .addUserOption((option) =>
      option
        .setName('kullanıcı')
        .setDescription('Atılacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('sebep')
        .setDescription('Atılma sebebi')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['KickMembers'],
  requiredClientPermissions: ['KickMembers'],
  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanıcı', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      await interaction.reply({
        content: 'Bu kullanıcı sunucuda bulunamadı.',
        ephemeral: true,
      });
      return;
    }

    if (targetMember.id === interaction.user.id) {
      await interaction.reply({
        content: 'Kendini atamazsın!',
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member;
    if (member && 'roles' in member) {
      const memberRoles = member.roles as any;
      if (targetMember.roles.highest.position >= memberRoles.highest.position) {
        await interaction.reply({
          content: 'Bu kullanıcıyı atamazsın. Seninle aynı veya daha yüksek yetkiye sahip.',
          ephemeral: true,
        });
        return;
      }
    }

    if (!targetMember.kickable) {
      await interaction.reply({
        content: 'Bu kullanıcıyı atamıyorum. Botun yetkisi yeterli değil veya kullanıcı atılamaz.',
        ephemeral: true,
      });
      return;
    }

    try {
      await targetMember.kick(`${interaction.user.tag} tarafından: ${reason}`);

      await interaction.reply({
        content: `✅ **${targetUser.tag}** sunucudan atıldı.\n📝 Sebep: ${reason}`,
      });

      // Log kaydı
      await logModeration(interaction.client, {
        guild,
        action: 'Kullanıcı Atıldı',
        moderator: interaction.user,
        target: targetUser,
        reason,
        color: 0xff9900,
      });
    } catch (error) {
      await interaction.reply({
        content: 'Kullanıcı atılırken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};

