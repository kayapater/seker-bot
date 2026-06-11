import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { getKickChannels } from '../utils/kick-db.js';

export const kickListe: Command = {
  data: new SlashCommandBuilder()
    .setName('kick-liste')
    .setDescription('Takip edilen Kick kanallarını listeler.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageChannels'],
  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    const channels = getKickChannels(guild.id);

    if (channels.length === 0) {
      await interaction.reply({
        content: 'Takip edilen Kick kanalı bulunmuyor.',
        ephemeral: true,
      });
      return;
    }

    const channelList = channels
      .map((ch, index) => {
        return `${index + 1}. **${ch.kickUsername}** → <#${ch.channelId}>`;
      })
      .join('\n');

    await interaction.reply({
      content: `**📺 Takip Edilen Kick Kanalları**\n\n${channelList}\n\nToplam: **${channels.length}** kanal`,
      ephemeral: true,
    });
  },
};

