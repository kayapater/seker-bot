import { ChannelType, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';

export const temizle: Command = {
  data: new SlashCommandBuilder()
    .setName('temizle')
    .setDescription('Bir kanaldaki son mesajları temizler.')
    .addIntegerOption((option) =>
      option
        .setName('adet')
        .setDescription('Silinecek mesaj adedi (1-100)')
        .setRequired(true)
    )
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageMessages'],
  requiredClientPermissions: ['ManageMessages'],
  async execute(interaction) {
    const amount = interaction.options.getInteger('adet', true);

    if (amount < 1 || amount > 100) {
      await interaction.reply({
        content: 'Lütfen 1 ile 100 arasında bir değer gir.',
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'Bu komut sadece metin kanallarında çalışır.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const deleted = await channel.bulkDelete(amount, true);

    await interaction.editReply(
      `✅ ${deleted.size} mesaj başarıyla silindi.`
    );
  },
};

