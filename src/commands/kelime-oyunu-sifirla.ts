import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { getWordGameChannel } from '../utils/word-game-db.js';
import { db } from '../core/database.js';

export const kelimeOyunuSifirla: Command = {
  data: new SlashCommandBuilder()
    .setName('kelime-oyunu-sifirla')
    .setDescription('Belirtilen kanaldaki kelime oyunu geçmişini tamamen siler.')
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Geçmişi silinecek kanal')
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

    if (!game) {
      await interaction.reply({
        content: `**${targetChannel}** kanalında kelime oyunu geçmişi bulunamadı.`,
        ephemeral: true,
      });
      return;
    }

    // Kelime sayısını al
    const wordCountStmt = db.prepare('SELECT COUNT(*) as count FROM word_game_words WHERE channel_id = ?');
    const wordResult: any = wordCountStmt.get(targetChannel.id);
    const wordCount = wordResult.count;

    if (wordCount === 0 && !game.isActive) {
      await interaction.reply({
        content: `**${targetChannel}** kanalında silinecek bir şey yok.`,
        ephemeral: true,
      });
      return;
    }

    // Kelimeleri sil
    const deleteWordsStmt = db.prepare('DELETE FROM word_game_words WHERE channel_id = ?');
    deleteWordsStmt.run(targetChannel.id);

    // Kanal kaydını sil
    const deleteChannelStmt = db.prepare('DELETE FROM word_game_channels WHERE channel_id = ?');
    deleteChannelStmt.run(targetChannel.id);

    await interaction.reply({
      content: `✅ **${targetChannel}** kanalındaki kelime oyunu geçmişi tamamen silindi.\n\n📊 **${wordCount}** kelime silindi.`,
    });
  },
};

