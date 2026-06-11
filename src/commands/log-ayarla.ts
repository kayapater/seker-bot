import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { setLogChannel, getGuildSettings } from '../utils/guild-settings-db.js';
import { getTurkeyISOString } from '../utils/time.js';

export const logAyarla: Command = {
  data: new SlashCommandBuilder()
    .setName('log-ayarla')
    .setDescription('Moderasyon loglarının gönderileceği kanalı ayarlar.')
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Log kanalı (boş bırakırsanız log sistemi kapatılır)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['Administrator'],
  requiredClientPermissions: ['SendMessages'],
  async execute(interaction) {
    const channel = interaction.options.getChannel('kanal', false);
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    if (!channel) {
      // Log sistemini kapat
      setLogChannel(guild.id, null);
      await interaction.reply({
        content: '✅ Log sistemi kapatıldı.',
        ephemeral: true,
      });
      return;
    }

    if (channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'Sadece metin kanalları seçilebilir.',
        ephemeral: true,
      });
      return;
    }

    // Log kanalını ayarla
    setLogChannel(guild.id, channel.id);

    await interaction.reply({
      content: `✅ Log kanalı **${channel.name}** olarak ayarlandı.\n\nBundan sonra tüm moderasyon işlemleri bu kanala kaydedilecek.`,
      ephemeral: true,
    });

    // Test mesajı gönder
    if ('send' in channel) {
      try {
        await channel.send({
          embeds: [{
            color: 0x00ff00,
            title: '✅ Log Sistemi Aktif',
            description: 'Moderasyon logları bu kanala gönderilecek.',
            timestamp: getTurkeyISOString(),
          }],
        });
      } catch (error) {
        await interaction.followUp({
          content: '⚠️ Log kanalına mesaj gönderilemedi. Botun o kanala mesaj gönderme yetkisi olduğundan emin olun.',
          ephemeral: true,
        });
      }
    }
  },
};

