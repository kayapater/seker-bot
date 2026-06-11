import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { getWarnings, removeWarning, clearWarnings } from '../utils/warnings-db.js';

export const uyarSil: Command = {
  data: new SlashCommandBuilder()
    .setName('uyar-sil')
    .setDescription('Bir kullanıcının uyarılarını siler.')
    .addUserOption((option) =>
      option
        .setName('kullanıcı')
        .setDescription('Uyarıları silinecek kullanıcı')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('numara')
        .setDescription('Silinecek uyarı numarası (boş bırakılırsa tümü silinir)')
        .setRequired(false)
        .setMinValue(1)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['Administrator'],
  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanıcı', true);
    const warningNumber = interaction.options.getInteger('numara');

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    const warnings = getWarnings(guild.id, targetUser.id);

    if (warnings.length === 0) {
      await interaction.reply({
        content: `**${targetUser.tag}** kullanıcısının uyarısı bulunmuyor.`,
        ephemeral: true,
      });
      return;
    }

    if (warningNumber === null) {
      // Tüm uyarıları sil
      const count = clearWarnings(guild.id, targetUser.id);
      await interaction.reply({
        content: `✅ **${targetUser.tag}** kullanıcısının tüm uyarıları (${count} adet) silindi.`,
      });
    } else {
      // Belirli bir uyarıyı sil
      const index = warningNumber - 1; // Kullanıcı 1'den başlar, array 0'dan
      if (index < 0 || index >= warnings.length) {
        await interaction.reply({
          content: `Geçersiz uyarı numarası. Toplam ${warnings.length} uyarı var.`,
          ephemeral: true,
        });
        return;
      }

      const removed = removeWarning(guild.id, targetUser.id, index);
      if (removed) {
        await interaction.reply({
          content: `✅ **${targetUser.tag}** kullanıcısının ${warningNumber}. uyarısı silindi.`,
        });
      } else {
        await interaction.reply({
          content: 'Uyarı silinirken bir hata oluştu.',
          ephemeral: true,
        });
      }
    }
  },
};

