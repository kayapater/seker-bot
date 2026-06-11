import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';

export const avatar: Command = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Bir kullanıcının avatarını gösterir.')
    .addUserOption((option) =>
      option
        .setName('kullanıcı')
        .setDescription('Avatarını görmek istediğin kullanıcı')
    )
    .setDMPermission(false),
  guildOnly: true,
  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

    await interaction.reply({
      embeds: [
        {
          color: 0x5865f2,
          author: {
            name: `${targetUser.tag} - Avatar`,
            icon_url: targetUser.displayAvatarURL(),
          },
          image: {
            url: targetUser.displayAvatarURL({ size: 512 }),
          },
          footer: {
            text: `Kullanıcı ID: ${targetUser.id}`,
          },
        },
      ],
    });
  },
};

