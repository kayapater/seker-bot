import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { logModeration } from '../utils/logger-system.js';

export const yasakla: Command = {
  data: new SlashCommandBuilder()
    .setName('yasakla')
    .setDescription('Bir kullanıcıyı sunucudan yasaklar.')
    .addUserOption((option) =>
      option
        .setName('kullanıcı')
        .setDescription('Yasaklanacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('sebep')
        .setDescription('Yasaklama sebebi')
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('mesaj-silme')
        .setDescription('Son kaç günün mesajlarını sil (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['BanMembers'],
  requiredClientPermissions: ['BanMembers'],
  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanıcı', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const deleteMessageDays = interaction.options.getInteger('mesaj-silme') || 0;

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (targetMember) {
      const member = interaction.member;
      if (member && 'roles' in member) {
        const memberRoles = member.roles as any;
        if (targetMember.roles.highest.position >= memberRoles.highest.position) {
          await interaction.reply({
            content: 'Bu kullanıcıyı yasaklayamazsın. Seninle aynı veya daha yüksek yetkiye sahip.',
            ephemeral: true,
          });
          return;
        }
      }

      if (!targetMember.bannable) {
        await interaction.reply({
          content: 'Bu kullanıcıyı yasaklayamıyorum. Botun yetkisi yeterli değil veya kullanıcı yasaklanamaz.',
          ephemeral: true,
        });
        return;
      }
    }

    try {
      await guild.members.ban(targetUser.id, {
        reason: `${interaction.user.tag} tarafından: ${reason}`,
        deleteMessageDays,
      });

      await interaction.reply({
        content: `✅ **${targetUser.tag}** sunucudan yasaklandı.\n📝 Sebep: ${reason}`,
      });

      // Log kaydı
      await logModeration(interaction.client, {
        guild,
        action: 'Kullanıcı Yasaklandı',
        moderator: interaction.user,
        target: targetUser,
        reason,
        details: deleteMessageDays > 0 ? `Son ${deleteMessageDays} günün mesajları silindi.` : undefined,
        color: 0xff0000,
      });
    } catch (error) {
      await interaction.reply({
        content: 'Kullanıcı yasaklanırken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};

