import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Command } from '../types/command.js';
import { db } from '../core/database.js';

export const ticketArsivTemizle: Command = {
  data: new SlashCommandBuilder()
    .setName('ticket-arsiv-temizle')
    .setDescription('Kapatılmış tüm ticket kayıtlarını veritabanından siler.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['Administrator'],
  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    // Kapalı ticket'ları ve kanal ID'lerini al
    const ticketsStmt = db.prepare('SELECT channel_id FROM tickets WHERE guild_id = ? AND closed_at IS NOT NULL');
    const tickets: any[] = ticketsStmt.all(guild.id);

    if (tickets.length === 0) {
      await interaction.reply({
        content: '❌ Silinecek kapalı ticket kaydı bulunamadı.',
        ephemeral: true,
      });
      return;
    }

    // Onay butonu oluştur
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_ticket_cleanup')
      .setLabel('✅ Evet, Sil')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_ticket_cleanup')
      .setLabel('❌ İptal')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

    await interaction.reply({
      content: `⚠️ **DİKKAT: GERİ ALINAMAZ İŞLEM!**\n\n**${tickets.length}** adet kapalı ticket kaydı ve arşiv kanalı **kalıcı olarak silinecek**.\n\n**Bu işlem:**\n• Tüm arşiv kanallarını Discord'dan siler\n• Tüm ticket kayıtlarını veritabanından siler\n• **GERİ ALINAMAZ**\n\nDevam etmek istediğinizden emin misiniz?`,
      components: [row],
      ephemeral: true,
    });

    // Buton yanıtını bekle
    try {
      const filter = (i: any) => {
        return (i.customId === 'confirm_ticket_cleanup' || i.customId === 'cancel_ticket_cleanup') && i.user.id === interaction.user.id;
      };

      const buttonInteraction = await interaction.channel?.awaitMessageComponent({ 
        filter, 
        time: 30000 // 30 saniye
      });

      if (!buttonInteraction) {
        return;
      }

      if (buttonInteraction.customId === 'cancel_ticket_cleanup') {
        await buttonInteraction.update({
          content: '❌ İşlem iptal edildi. Hiçbir şey silinmedi.',
          components: [],
        });
        return;
      }

      // Onaylandı, işleme devam et
      await buttonInteraction.update({
        content: '⏳ Arşiv kanalları ve kayıtlar siliniyor...',
        components: [],
      });

    let deletedChannels = 0;
    let notFoundChannels = 0;

    // Her ticket kanalını sil
    for (const ticket of tickets) {
      try {
        const channel = await guild.channels.fetch(ticket.channel_id).catch(() => null);
        if (channel) {
          await channel.delete();
          deletedChannels++;
        } else {
          notFoundChannels++;
        }
      } catch (error) {
        notFoundChannels++;
      }
    }

    // Veritabanından sil
    const deleteStmt = db.prepare('DELETE FROM tickets WHERE guild_id = ? AND closed_at IS NOT NULL');
    const info = deleteStmt.run(guild.id);

    let resultMessage = `✅ **${info.changes}** adet kapalı ticket kaydı veritabanından silindi.\n\n`;
    resultMessage += `📦 **${deletedChannels}** arşiv kanalı silindi.\n`;
    
    if (notFoundChannels > 0) {
      resultMessage += `⚠️ **${notFoundChannels}** kanal bulunamadı (zaten silinmiş olabilir).`;
    }

      await buttonInteraction.editReply({
        content: resultMessage,
      });
    } catch (error) {
      // Zaman aşımı
      await interaction.editReply({
        content: '⏱️ İşlem zaman aşımına uğradı. Hiçbir şey silinmedi.',
        components: [],
      });
    }
  },
};

