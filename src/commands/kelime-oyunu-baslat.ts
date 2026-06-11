import { ChannelType, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import type { Command } from '../types/command.js';
import { startWordGame, getWordGameChannel, addWord } from '../utils/word-game-db.js';
import { getRandomTurkishWord, getLastLetter } from '../utils/turkish-words.js';

export const kelimeOyunuBaslat: Command = {
  data: new SlashCommandBuilder()
    .setName('kelime-oyunu-baslat')
    .setDescription('Belirtilen kanalda kelime oyununu başlatır.')
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Oyunun başlatılacağı kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageChannels'],
  requiredClientPermissions: ['SendMessages'],
  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('kanal') || interaction.channel;

    if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'Lütfen geçerli bir metin kanalı belirtin.',
        ephemeral: true,
      });
      return;
    }

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    // Oyunu başlat
    const game = startWordGame(targetChannel.id, guild.id);

    // İlk kelimeyi bot belirle
    const firstWord = getRandomTurkishWord();
    const lastLetter = getLastLetter(firstWord);
    
    if (!lastLetter) {
      await interaction.reply({
        content: '❌ İlk kelime oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        ephemeral: true,
      });
      return;
    }

    // İlk kelimeyi veritabanına ekle (bot olarak)
    addWord(
      targetChannel.id,
      firstWord,
      interaction.client.user!.id,
      interaction.client.user!.tag,
      lastLetter
    );

    // İlk kelimeyi kanala gönder
    const textChannel = targetChannel as TextChannel;
    const firstWordMessage = await textChannel.send(`🎮 **İlk kelime:** **${firstWord}**\n\n📝 Sıradaki kelime **${lastLetter.toUpperCase()}** harfiyle başlamalı!\n\n**Kurallar:**\n• Yazılan kelimenin son harfiyle yeni kelime yazılmalı\n• Kelimeler Türkçe olmalı ve daha önce kullanılmamış olmalı\n• En az 2 karakter olmalı\n• Aynı kişi üst üste yazamaz`);

    await interaction.reply({
      content: `✅ **${targetChannel}** kanalında kelime oyunu başlatıldı! İlk kelime: **${firstWord}**`,
      ephemeral: true,
    });
  },
};

