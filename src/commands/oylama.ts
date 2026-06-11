import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';

export const oylama: Command = {
  data: new SlashCommandBuilder()
    .setName('oylama')
    .setDescription('Bir oylama oluşturur.')
    .addStringOption((option) =>
      option
        .setName('soru')
        .setDescription('Oylama sorusu')
        .setRequired(true)
        .setMaxLength(2000)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageMessages'],
  async execute(interaction) {
    const question = interaction.options.getString('soru', true);

    await interaction.reply({
      content: `📊 **Oylama**\n\n${question}`,
    });

    const message = await interaction.fetchReply();
    await message.react('✅');
    await message.react('❌');
  },
};

