import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { logModeration } from '../utils/logger-system.js';

export const sustur: Command = {
  data: new SlashCommandBuilder()
    .setName('sustur')
    .setDescription('Bir kullanıcıyı belirli süre susturur (timeout).')
    .addUserOption((option) =>
      option
        .setName('kullanıcı')
        .setDescription('Susturulacak kullanıcı')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('dakika')
        .setDescription('Susturma süresi (dakika)')
        .setMinValue(1)
        .setMaxValue(40320) // 28 gün
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('sebep')
        .setDescription('Susturma sebebi')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ModerateMembers'],
  requiredClientPermissions: ['ModerateMembers'],
  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanıcı', true);
    const minutes = interaction.options.getInteger('dakika', true);
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
        content: 'Kendini susturamazsın!',
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member;
    if (member && 'roles' in member) {
      const memberRoles = member.roles as any;
      if (targetMember.roles.highest.position >= memberRoles.highest.position) {
        await interaction.reply({
          content: 'Bu kullanıcıyı susturamazsın. Seninle aynı veya daha yüksek yetkiye sahip.',
          ephemeral: true,
        });
        return;
      }
    }

    if (!targetMember.moderatable) {
      await interaction.reply({
        content: 'Bu kullanıcıyı susturamıyorum. Botun yetkisi yeterli değil.',
        ephemeral: true,
      });
      return;
    }

    const timeoutDuration = minutes * 60 * 1000; // dakika -> milisaniye
    const timeoutUntil = new Date(Date.now() + timeoutDuration);

    try {
      await targetMember.timeout(timeoutDuration, `${interaction.user.tag} tarafından: ${reason}`);

      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      let durationText = '';
      if (days > 0) {
        durationText = `${days} gün`;
      } else if (hours > 0) {
        durationText = `${hours} saat`;
      } else {
        durationText = `${minutes} dakika`;
      }

      await interaction.reply({
        content: `✅ **${targetUser.tag}** ${durationText} süreyle susturuldu.\n📝 Sebep: ${reason}\n⏰ Bitiş: <t:${Math.floor(timeoutUntil.getTime() / 1000)}:R>`,
      });

      // Log kaydı
      await logModeration(interaction.client, {
        guild,
        action: 'Kullanıcı Susturuldu',
        moderator: interaction.user,
        target: targetUser,
        reason,
        details: `Süre: ${durationText}\nBitiş: <t:${Math.floor(timeoutUntil.getTime() / 1000)}:F>`,
        color: 0xffaa00,
      });
    } catch (error) {
      await interaction.reply({
        content: 'Kullanıcı susturulurken bir hata oluştu.',
        ephemeral: true,
      });
    }
  },
};

