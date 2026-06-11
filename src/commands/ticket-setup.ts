import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';

export const ticketSetup: Command = {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Ticket sistemi için butonlu mesaj gönderir.')
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Butonlu mesajın gönderileceği kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('kategori')
        .setDescription('Ticket odalarının oluşturulacağı kategori (opsiyonel)')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['Administrator'],
  requiredClientPermissions: ['SendMessages', 'ManageChannels'],
  async execute(interaction) {
    const channel = interaction.options.getChannel('kanal', true);
    const category = interaction.options.getChannel('kategori', false);

    if (channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'Sadece metin kanalları seçilebilir.',
        ephemeral: true,
      });
      return;
    }

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('🎫 Ticket Oluştur')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    try {
      await (channel as any).send({
        content: '**🎫 Ticket Sistemi**\n\nBir sorununuz mu var? Aşağıdaki butona tıklayarak destek talebi oluşturabilirsiniz.',
        components: [row],
      });

      // Kategori ID'sini sakla (eğer verildiyse)
      if (category) {
        // Kategori ID'sini bir yerde saklamak gerekir (şimdilik sadece log)
        console.log(`Ticket kategori ID: ${category.id}`);
      }

      await interaction.reply({
        content: `✅ Ticket sistemi **${channel.name}** kanalına başarıyla kuruldu!`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: 'Mesaj gönderilirken bir hata oluştu. Botun o kanala mesaj gönderme yetkisi olduğundan emin ol.',
        ephemeral: true,
      });
    }
  },
};

