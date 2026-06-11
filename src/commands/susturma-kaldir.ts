import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { logModeration } from '../utils/logger-system.js';

export const susturmaKaldir: Command = {
  data: new SlashCommandBuilder()
    .setName('susturma-kaldir')
    .setDescription('Bir kullanıcının susturmasını kaldırır.')
    .addUserOption((option) =>
      option
        .setName('kullanıcı')
        .setDescription('Susturması kaldırılacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('sebep')
        .setDescription('Susturma kaldırma sebebi')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ModerateMembers'],
  requiredClientPermissions: ['ModerateMembers'],
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
        content: 'Kendi susturmanı kaldıramazsın!',
        ephemeral: true,
      });
      return;
    }

    // Kullanıcı susturulmuş mu kontrol et
    if (!targetMember.isCommunicationDisabled()) {
      await interaction.reply({
        content: `**${targetUser.tag}** zaten susturulmamış.`,
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member;
    if (member && 'roles' in member) {
      const memberRoles = member.roles as any;
      if (targetMember.roles.highest.position >= memberRoles.highest.position) {
        await interaction.reply({
          content: 'Bu kullanıcının susturmasını kaldıramazsın. Seninle aynı veya daha yüksek yetkiye sahip.',
          ephemeral: true,
        });
        return;
      }
    }

    if (!targetMember.moderatable) {
      await interaction.reply({
        content: 'Bu kullanıcının susturmasını kaldıramıyorum. Botun yetkisi yeterli değil.',
        ephemeral: true,
      });
      return;
    }

    try {
      await targetMember.timeout(null, `${interaction.user.tag} tarafından: ${reason}`);

      await interaction.reply({
        content: `✅ **${targetUser.tag}** kullanıcısının susturması kaldırıldı.\n📝 Sebep: ${reason}`,
      });

      // Log kaydı
      await logModeration(interaction.client, {
        guild,
        action: 'Susturma Kaldırıldı',
        moderator: interaction.user,
        target: targetUser,
        reason,
        color: 0x00ff00,
      });
    } catch (error) {
      await interaction.reply({
        content: 'Susturma kaldırılırken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};

