import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../types/command.js';
import { getTurkeyISOString } from '../utils/time.js';

export const uyeSay: Command = {
  data: new SlashCommandBuilder()
    .setName('üye-say')
    .setDescription('Sunucudaki üye sayısı ve durum istatistiklerini gösterir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  guildOnly: true,
  requiredMemberPermissions: ['ManageGuild'],
  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Bu komut sadece sunucularda çalışır.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply(); // Hemen yanıt ver, işlem uzun sürebilir

    const totalMembers = guild.memberCount;
    
    // Cache'deki üyeleri kullan, eğer yeterli değilse sadece bir kısmını fetch et
    let allMembers = guild.members.cache;
    
    // Eğer cache'deki üye sayısı toplam üye sayısından çok azsa, sadece bir kısmını fetch et
    if (allMembers.size < totalMembers * 0.5 && totalMembers < 1000) {
      try {
        // Sadece ilk 1000 üyeyi fetch et (timeout ile)
        await Promise.race([
          guild.members.fetch({ limit: 1000 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]).catch(() => {
          // Timeout veya hata durumunda cache'i kullan
        });
        allMembers = guild.members.cache;
      } catch (error) {
        // Hata durumunda cache'i kullan
      }
    }
    
    const bots = allMembers.filter((member) => member.user.bot).size;
    // İnsan sayısını hesapla: eğer cache tam değilse tahmin et
    const humans = allMembers.size === totalMembers 
      ? allMembers.filter((member) => !member.user.bot).size
      : totalMembers - bots;

    const online = allMembers.filter((m) => m.presence?.status === 'online').size;
    const idle = allMembers.filter((m) => m.presence?.status === 'idle').size;
    const dnd = allMembers.filter((m) => m.presence?.status === 'dnd').size;
    const offline = allMembers.filter((m) => !m.presence || m.presence.status === 'offline').size;

    const onlineTotal = online + idle + dnd;

    await interaction.editReply({
      embeds: [
        {
          color: 0x5865f2,
          title: '📊 Üye İstatistikleri',
          fields: [
            {
              name: '👥 Genel',
              value: [
                `**Toplam:** ${totalMembers}`,
                `**İnsan:** ${humans}`,
                `**Bot:** ${bots}`,
              ].join('\n'),
              inline: true,
            },
            {
              name: '🟢 Durumlar',
              value: [
                `**🟢 Çevrimiçi:** ${online}`,
                `**🟡 Boşta:** ${idle}`,
                `**🔴 Rahatsız Etme:** ${dnd}`,
                `**⚫ Çevrimdışı:** ${offline}`,
              ].join('\n'),
              inline: true,
            },
            {
              name: '📈 Özet',
              value: [
                `**Aktif Üyeler:** ${onlineTotal}`,
                `**Çevrimdışı:** ${offline}`,
                `**Aktiflik Oranı:** ${totalMembers > 0 ? Math.round((onlineTotal / totalMembers) * 100) : 0}%`,
              ].join('\n'),
              inline: false,
            },
          ],
          footer: {
            text: guild.name,
            ...(guild.iconURL() ? { icon_url: guild.iconURL()! } : {}),
          },
          timestamp: getTurkeyISOString(),
        },
      ],
    });
  },
};

