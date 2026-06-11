import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import { getTurkeyISOString } from '../utils/time.js';

export const profil: Command = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Kullanıcı profili hakkında bilgi gösterir.')
    .addUserOption((option) =>
      option
        .setName('kullanıcı')
        .setDescription('Profilini görmek istediğin kullanıcı')
    )
    .setDMPermission(false),
  guildOnly: true,
  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;
    const member = interaction.guild?.members.cache.get(targetUser.id);

    if (!member) {
      await interaction.reply({
        content: 'Bu kullanıcı sunucuda bulunamadı.',
        ephemeral: true,
      });
      return;
    }

    const roles = member.roles.cache
      .filter((role) => role.id !== interaction.guild!.id)
      .map((role) => role.toString())
      .slice(0, 10)
      .join(', ') || 'Rol yok';

    const joinedAt = member.joinedAt
      ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
      : 'Bilinmiyor';

    const accountCreated = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;

    await interaction.reply({
      embeds: [
        {
          color: member.displayColor || 0x5865f2,
          author: {
            name: targetUser.tag,
            icon_url: targetUser.displayAvatarURL(),
          },
          thumbnail: {
            url: targetUser.displayAvatarURL({ size: 256 }),
          },
          fields: [
            {
              name: '👤 Kullanıcı',
              value: `${targetUser} (\`${targetUser.id}\`)`,
              inline: true,
            },
            {
              name: '📅 Hesap Oluşturulma',
              value: accountCreated,
              inline: true,
            },
            {
              name: '📥 Sunucuya Katılma',
              value: joinedAt,
              inline: true,
            },
            {
              name: `🎭 Roller (${member.roles.cache.size - 1})`,
              value: roles.length > 1024 ? roles.slice(0, 1021) + '...' : roles,
              inline: false,
            },
          ],
          footer: {
            text: `Sunucu: ${interaction.guild!.name}`,
          },
          timestamp: getTurkeyISOString(),
        },
      ],
    });
  },
};

