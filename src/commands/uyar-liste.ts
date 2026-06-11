import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { getWarnings } from '../utils/warnings-db.js';
import { getTurkeyISOString } from '../utils/time.js';

export const uyarListe: Command = {
  data: new SlashCommandBuilder()
    .setName('uyar-liste')
    .setDescription('Bir kullanıcının uyarı geçmişini gösterir.')
    .addUserOption((option) =>
      option
        .setName('kullanıcı')
        .setDescription('Uyarı geçmişi görüntülenecek kullanıcı')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ModerateMembers'],
  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanıcı', true);

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

    const warningFields = warnings.slice(0, 10).map((warning, index) => {
      const date = new Date(warning.timestamp);
      return {
        name: `⚠️ Uyarı #${index + 1}`,
        value: [
          `**Sebep:** ${warning.reason}`,
          `**Moderatör:** ${warning.moderatorTag}`,
          `**Tarih:** <t:${Math.floor(date.getTime() / 1000)}:R>`,
        ].join('\n'),
        inline: false,
      };
    });

    const embed: any = {
      color: 0xff9900,
      author: {
        name: `${targetUser.tag} - Uyarı Geçmişi`,
        icon_url: targetUser.displayAvatarURL(),
      },
      description: `Toplam **${warnings.length}** uyarı`,
      fields: warningFields,
      timestamp: getTurkeyISOString(),
    };

    if (warnings.length > 10) {
      embed.footer = {
        text: `İlk 10 uyarı gösteriliyor (Toplam: ${warnings.length})`,
      };
    }

    await interaction.reply({
      embeds: [embed],
    });
  },
};

