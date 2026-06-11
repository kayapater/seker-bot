import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { getWordGameChannel, getUsedWords } from '../utils/word-game-db.js';
import { getTurkeyISOString } from '../utils/time.js';

export const kelimeOyunuDurum: Command = {
  data: new SlashCommandBuilder()
    .setName('kelime-oyunu-durum')
    .setDescription('Belirtilen kanaldaki kelime oyunu durumunu gösterir.')
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Durumu görüntülenecek kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageChannels'],
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

    const usedWords = getUsedWords(targetChannel.id);
    const recentWords = usedWords.slice(0, 10).map((w) => `**${w.word}**`).join(', ');

    await interaction.reply({
      embeds: [
        {
          color: 0x5865f2,
          title: '📝 Kelime Oyunu Durumu',
          fields: [
            {
              name: '📊 İstatistikler',
              value: [
                `**Toplam Kelime:** ${game.wordCount}`,
                `**Son Harf:** ${game.lastLetter ? `\`${game.lastLetter.toUpperCase()}\`` : 'Henüz kelime yazılmadı'}`,
                `**Son Yazılan:** ${game.lastUserId ? `<@${game.lastUserId}>` : 'Henüz yok'}`,
              ].join('\n'),
              inline: true,
            },
            {
              name: '📝 Son Kelimeler',
              value: recentWords || 'Henüz kelime yazılmadı',
              inline: false,
            },
          ],
          footer: {
            text: `Kanal: ${targetChannel.name}`,
          },
          timestamp: getTurkeyISOString(),
        },
      ],
    });
  },
};

