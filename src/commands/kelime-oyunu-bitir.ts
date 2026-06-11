import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { stopWordGame, getWordGameChannel } from '../utils/word-game-db.js';

export const kelimeOyunuBitir: Command = {
  data: new SlashCommandBuilder()
    .setName('kelime-oyunu-bitir')
    .setDescription('Belirtilen kanaldaki kelime oyununu bitirir.')
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Oyunun bitirileceği kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['Administrator'],
  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('kanal') || interaction.channel;

    if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'Lütfen geçerli bir metin kanalı belirtin.',
        ephemeral: true,
      });
      return;
    }

    const game = getWordGameChannel(targetChannel.id);

    if (!game || !game.isActive) {
      await interaction.reply({
        content: `**${targetChannel}** kanalında aktif bir kelime oyunu bulunmuyor.`,
        ephemeral: true,
      });
      return;
    }

    stopWordGame(targetChannel.id);

    await interaction.reply({
      content: `✅ **${targetChannel}** kanalındaki kelime oyunu bitirildi!\n📊 Toplam **${game.wordCount}** kelime yazıldı.`,
    });
  },
};

