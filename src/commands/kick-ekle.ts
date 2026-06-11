import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { addKickChannel, getKickChannel, updateKickChannelStatus } from '../utils/kick-db.js';
import { checkKickLiveStatus } from '../utils/kick-api.js';

export const kickEkle: Command = {
  data: new SlashCommandBuilder()
    .setName('kick-ekle')
    .setDescription('Kick kanalını takip listesine ekler.')
    .addStringOption((option) =>
      option
        .setName('kullanici')
        .setDescription('Kick kullanıcı adı (örn: xqc)')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('kanal')
        .setDescription('Bildirimlerin gönderileceği Discord kanalı')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('everyone')
        .setDescription('@everyone etiketlensin mi?')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageChannels'],
  requiredClientPermissions: ['SendMessages'],
  async execute(interaction) {
    const kickUsername = interaction.options.getString('kullanici', true);
    const channel = interaction.options.getChannel('kanal', true);
    const mentionEveryone = interaction.options.getBoolean('everyone') || false;

    if (channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'Sadece metin kanalları seçilebilir.',
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

    // Kanal zaten ekli mi kontrol et
    const existing = getKickChannel(guild.id, kickUsername);
    if (existing) {
      await interaction.reply({
        content: `**${kickUsername}** zaten takip listesinde. Bildirim kanalı: <#${existing.channelId}>`,
        ephemeral: true,
      });
      return;
    }

    // Kick kanalının geçerli olup olmadığını kontrol et
    await interaction.deferReply({ ephemeral: true });

    const kickStatus = await checkKickLiveStatus(kickUsername);
    if (kickStatus === null) {
      await interaction.editReply({
        content: `**${kickUsername}** Kick kanalı bulunamadı. Kullanıcı adını kontrol edin.`,
      });
      return;
    }

    // Kanalı ekle (mevcut durumu kaydet)
    const kickChannel = addKickChannel(kickUsername, guild.id, channel.id, mentionEveryone);
    
    const everyoneMention = mentionEveryone ? '\n🔔 @everyone etiketlenecek' : '';
    
    // Eğer şu anda canlı yayındaysa, durumu kaydet (ilk bildirim göndermemek için)
    if (kickStatus.isLive) {
      updateKickChannelStatus(guild.id, kickUsername, true);
      await interaction.editReply({
        content: `✅ **${kickUsername}** takip listesine eklendi!\n📢 Bildirimler <#${channel.id}> kanalına gönderilecek.${everyoneMention}\n\n⚠️ Kanal şu anda canlı yayında. Yayın bittikten sonra tekrar başladığında bildirim gönderilecek.`,
      });
    } else {
      await interaction.editReply({
        content: `✅ **${kickUsername}** takip listesine eklendi!\n📢 Bildirimler <#${channel.id}> kanalına gönderilecek.${everyoneMention}`,
      });
    }
  },
};

