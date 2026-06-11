import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { setLogChannel, getGuildSettings } from '../utils/guild-settings-db.js';

export const logSifirla: Command = {
  data: new SlashCommandBuilder()
    .setName('log-sifirla')
    .setDescription('Log sistemini kapatır ve ayarları sıfırlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['Administrator'],
  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    // Mevcut ayarları kontrol et
    const settings = getGuildSettings(guild.id);
    
    if (!settings || !settings.logChannelId) {
      await interaction.reply({
        content: '❌ Zaten ayarlanmış bir log kanalı yok.',
        ephemeral: true,
      });
      return;
    }

    // Log kanalını sıfırla
    setLogChannel(guild.id, null);

    await interaction.reply({
      content: `✅ Log sistemi kapatıldı.\n\nÖnceki log kanalı: <#${settings.logChannelId}>\n\nArtık moderasyon işlemleri kaydedilmeyecek.`,
      ephemeral: true,
    });
  },
};

