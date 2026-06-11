import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';

export const bilgi: Command = {
  data: new SlashCommandBuilder()
    .setName('bilgi')
    .setDescription('Sunucu hakkında özet bilgi verir.')
    .setDMPermission(false),
  guildOnly: true,
  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    const owner = await guild.fetchOwner();

    await interaction.reply({
      ephemeral: true,
      content: [
        `👥 Sunucu adı: **${guild.name}**`,
        `📦 Üye sayısı: **${guild.memberCount}**`,
        `👑 Sahip: **${owner.displayName}**`,
        `🆔 Sunucu ID: \`${guild.id}\``,
      ].join('\n'),
    });
  },
};

