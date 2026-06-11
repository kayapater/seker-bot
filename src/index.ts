import {
  Client,
  Events,
  GatewayIntentBits,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
} from 'discord.js';
import { Player } from 'discord-player';
import { YoutubeiExtractor } from "discord-player-youtubei";
import type {
  Interaction,
  PermissionResolvable,
} from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';
import { env } from './config/env.js';
import { commandMap, commands } from './commands/index.js';
import { logger } from './utils/logger.js';
import './core/database.js'; // Veritabanını başlat
import { createTicket, getUserTickets, getTicket, deleteTicket } from './utils/tickets-db.js';
import { getAllKickChannels, updateKickChannelStatus } from './utils/kick-db.js';
import { checkKickLiveStatus } from './utils/kick-api.js';
import { getWordGameChannel, addWord, isWordUsed } from './utils/word-game-db.js';
import { isValidTurkishWord, getLastLetter, startsWithLetter, getRandomTurkishWord } from './utils/turkish-words.js';
import { checkTDKWord, loadWordList } from './utils/tdk-api.js';
import { checkRateLimit } from './utils/rate-limiter.js';
import { getTurkeyISOString } from './utils/time.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
  ],
});

const player = new Player(client as any, {
  skipFFmpeg: false, // FFmpeg kullanımını zorunlu kıl
});

// Hata yönetimi
player.events.on('error', (queue, error) => {
  logger.error(`[Player Error] ${error.message}`);
});

player.events.on('playerError', (queue, error) => {
  logger.error(`[Player Connection Error] ${error.message}`);
});

// Debug Logları
player.events.on('playerStart', (queue, track) => {
  logger.info(`[Player] Çalmaya başladı: ${track.title}`);
});

player.events.on('audioTrackAdd', (queue, track) => {
  logger.info(`[Player] Kuyruğa eklendi: ${track.title}`);
});

player.events.on('disconnect', (queue) => {
  logger.info('[Player] Bot kanaldan ayrıldı.');
});

player.events.on('emptyChannel', (queue) => {
  logger.info('[Player] Kanal boş olduğu için ayrıldı.');
});

player.events.on('emptyQueue', (queue) => {
  logger.info('[Player] Kuyruk bitti.');
});

// Extractors yükleme işlemi (GÜNCELLENDİ ve LOGLU)
const loadExtractors = async () => {
  try {
    // YoutubeiExtractor'ı yükle (En öncelikli ve güvenilir)
    await player.extractors.register(YoutubeiExtractor, {
      streamOptions: {
        highWaterMark: 1 << 25,
      },
    });
    
    logger.info(`[Player] Yüklenen çözümleyiciler: ${Array.from(player.extractors.store.keys()).join(', ')}`);
  } catch (error) {
    logger.error(`[Player] Çözümleyiciler yüklenirken hata: ${error}`);
  }
};

loadExtractors();

const hasPermissions = (
  permissions: Readonly<PermissionResolvable[]> | undefined,
  checker: ((permission: PermissionResolvable) => boolean) | undefined
) => {
  if (!permissions || permissions.length === 0) {
    return true;
  }

  if (!checker) {
    return false;
  }

  return permissions.every((permission) => checker(permission));
};

const handleTicketCreation = async (interaction: any) => {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: 'Bu işlem sadece sunucularda yapılabilir.',
      ephemeral: true,
    });
    return;
  }

  const guild = interaction.guild;
  const user = interaction.user;

  // Kullanıcının zaten açık bir ticket'ı var mı kontrol et
  const existingTickets = getUserTickets(user.id, guild.id);
  if (existingTickets.length > 0) {
    const existingChannel = guild.channels.cache.get(existingTickets[0]?.channelId || '');
    if (existingChannel) {
      await interaction.reply({
        content: `Zaten açık bir ticket'ın var: ${existingChannel}`,
        ephemeral: true,
      });
      return;
    }
  }

  try {
    // Kategori bul veya oluştur
    let category = guild.channels.cache.find(
      (c: any) => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('ticket')
    ) as any;

    if (!category) {
      category = await guild.channels.create({
        name: '🎫 Ticket Odaları',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });
    }

    // Ticket kanalı oluştur
    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: guild.members.me!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ],
    });

    // Ticket'ı kaydet
    createTicket(user.id, ticketChannel.id, guild.id);

    // Kapatma butonu
    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('🔒 Ticket\'ı Kapat')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

    // Hoş geldin mesajı
    await ticketChannel.send({
      content: `${user} - Ticket odanız oluşturuldu!\n\nLütfen sorununuzu detaylı bir şekilde açıklayın. Yetkililer en kısa sürede size yardımcı olacaktır.`,
      components: [row],
    });

    await interaction.reply({
      content: `✅ Ticket odanız oluşturuldu: ${ticketChannel}`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error('Ticket oluşturulurken hata oluştu.', error);
    await interaction.reply({
      content: 'Ticket oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
      ephemeral: true,
    });
  }
};

const handleTicketClose = async (interaction: any) => {
  if (!interaction.guild || !interaction.channel) {
    await interaction.reply({
      content: 'Bu işlem sadece sunucularda yapılabilir.',
      ephemeral: true,
    });
    return;
  }

  const channel = interaction.channel;
  const ticket = getTicket(channel.id);

  if (!ticket) {
    await interaction.reply({
      content: 'Bu bir ticket kanalı değil.',
      ephemeral: true,
    });
    return;
  }

  // Yetki kontrolü: Ticket sahibi veya yetkili
  const member = interaction.member;
  const hasPermission = 
    (member && 'permissions' in member && member.permissions.has(PermissionFlagsBits.ManageChannels)) ||
    ticket.userId === interaction.user.id;

  if (!hasPermission) {
    await interaction.reply({
      content: 'Bu ticket\'ı kapatma yetkiniz yok.',
      ephemeral: true,
    });
    return;
  }

  try {
    await interaction.reply({
      content: '⏳ Ticket arşivleniyor ve sohbet kopyası gönderiliyor...',
    });

    const guild = interaction.guild;
    
    // Arşiv kategorisi bul veya oluştur
    let archiveCategory = guild.channels.cache.find(
      (c: any) => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('ticket arşiv')
    ) as any;

    if (!archiveCategory) {
      archiveCategory = await guild.channels.create({
        name: '📦 Ticket Arşiv',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: guild.members.me!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
            ],
          },
        ],
      });
      logger.info(`Ticket arşiv kategorisi oluşturuldu: ${archiveCategory.id}`);
    }

    // Mesajları topla ve transcript oluştur
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const sortedMessages = messages.sort((a: any, b: any) => a.createdTimestamp - b.createdTimestamp);
      
      const user = await interaction.client.users.fetch(ticket.userId);
      const closedBy = interaction.user;
      const closedAt = Math.floor(Date.now() / 1000);

      // Embed transcript oluştur
      const transcriptEmbed: any = {
        color: 0x5865f2,
        title: `📋 Ticket Transcript - ${channel.name}`,
        fields: [
          {
            name: '👤 Kullanıcı',
            value: `${user.tag} (${user.id})`,
            inline: true,
          },
          {
            name: '🔒 Kapatan',
            value: `${closedBy.tag}`,
            inline: true,
          },
          {
            name: '📅 Oluşturulma',
            value: `<t:${ticket.createdAt}:F>`,
            inline: false,
          },
          {
            name: '🔒 Kapatılma',
            value: `<t:${closedAt}:F>`,
            inline: false,
          },
          {
            name: '📊 Mesaj Sayısı',
            value: `${sortedMessages.size} mesaj`,
            inline: true,
          },
        ],
        footer: {
          text: guild.name,
          icon_url: guild.iconURL() || undefined,
        },
        timestamp: getTurkeyISOString(),
      };

      // Mesajları formatla (daha düzenli)
      let transcriptText = '';
      sortedMessages.forEach((msg: any) => {
        const timestamp = new Date(msg.createdTimestamp).toLocaleString('tr-TR', { 
          timeZone: 'Europe/Istanbul',
          dateStyle: 'short',
          timeStyle: 'medium'
        });
        const content = msg.content || '*(Embed/Dosya/Resim)*';
        transcriptText += `**[${timestamp}] ${msg.author.tag}:**\n${content}\n\n`;
      });

      // Kullanıcıya DM gönder (embed formatında)
      try {
        await user.send({ embeds: [transcriptEmbed] });
        
        // Mesajları embed formatında DM'e gönder
        const dmChunks: string[] = [];
        let currentDmChunk = '';
        
        const messagesArray = Array.from(sortedMessages.values());
        
        messagesArray.forEach((msg: any, index: number) => {
          const timestamp = new Date(msg.createdTimestamp).toLocaleString('tr-TR', { 
            timeZone: 'Europe/Istanbul',
            dateStyle: 'short',
            timeStyle: 'short'
          });
          const content = msg.content || '*(Embed/Dosya/Resim)*';
          const line = `**${msg.author.tag}** • \`${timestamp}\`\n${content}\n\n`;
          
          // Discord embed description limiti: 4096 karakter
          if ((currentDmChunk + line).length > 4000) {
            dmChunks.push(currentDmChunk);
            currentDmChunk = line;
          } else {
            currentDmChunk += line;
          }
        });
        
        // Son chunk'ı ekle (eğer varsa)
        if (currentDmChunk.length > 0) {
          dmChunks.push(currentDmChunk);
        }
        
        // Eğer hiç mesaj yoksa boş embed gönder
        if (dmChunks.length === 0) {
          dmChunks.push('*(Mesaj bulunamadı)*');
        }
        
        // Her chunk'ı embed olarak DM'e gönder
        for (let i = 0; i < dmChunks.length; i++) {
          await user.send({
            embeds: [{
              color: 0x5865f2,
              title: i === 0 ? '💬 Sohbet Geçmişi' : `💬 Sohbet Geçmişi (Devam ${i + 1})`,
              description: dmChunks[i],
              footer: {
                text: `Sayfa ${i + 1}/${dmChunks.length} • ${guild.name}`,
                icon_url: guild.iconURL() || undefined,
              },
            }],
          });
        }

        logger.info(`Ticket transcript DM gönderildi: ${ticket.userId}`);
      } catch (dmError) {
        logger.warn(`Kullanıcıya DM gönderilemedi (${ticket.userId})`);
        transcriptEmbed.description = '⚠️ Kullanıcıya DM gönderilemedi.';
      }

      // Kanalı arşive taşı
      await channel.setParent(archiveCategory.id);
      await channel.setName(`closed-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`);
      
      // Kullanıcıya son mesaj gönder
      await channel.send({
        content: `${user} - Bu ticket arşivlendi. Artık bu kanala erişiminiz yok. Sohbet geçmişiniz DM'inize gönderildi.`,
      });

      // 2 saniye bekle ki kullanıcı mesajı görsün
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Kanal izinlerini güncelle - sadece yetkililer görebilsin
      await channel.permissionOverwrites.set([
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: ticket.userId,
          deny: [PermissionFlagsBits.ViewChannel], // Kullanıcı artık göremesin
        },
        {
          id: guild.members.me!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ]);

      // İzin değişikliği sonrası kullanıcı Discord'u yenilediğinde kanal kaybolacak
      // Ek olarak: Kullanıcıya DM'den de bildirim gönderelim
      try {
        await user.send({
          embeds: [{
            color: 0xff9900,
            title: '🔒 Ticket Arşivlendi',
            description: `**${guild.name}** sunucusundaki ticket'ınız arşivlendi ve artık erişiminiz yok.\n\nSohbet geçmişiniz yukarıda gönderildi.`,
            footer: {
              text: 'Discord\'u yenilediğinizde kanal kaybolacak.',
            },
          }],
        });
      } catch (dmError) {
        logger.warn(`Arşiv bildirimi DM gönderilemedi: ${ticket.userId}`);
      }

      // Arşiv kanalına transcript gönder
      await channel.send({ embeds: [transcriptEmbed] });
      
      // Mesajları embed formatında arşive kaydet (daha hoş görünüm)
      const messageChunks: string[] = [];
      let currentChunk = '';
      
      const archiveMessagesArray = Array.from(sortedMessages.values());
      
      archiveMessagesArray.forEach((msg: any) => {
        const timestamp = new Date(msg.createdTimestamp).toLocaleString('tr-TR', { 
          timeZone: 'Europe/Istanbul',
          dateStyle: 'short',
          timeStyle: 'short'
        });
        const content = msg.content || '*(Embed/Dosya/Resim)*';
        const line = `**${msg.author.tag}** • \`${timestamp}\`\n${content}\n\n`;
        
        // Discord embed description limiti: 4096 karakter
        if ((currentChunk + line).length > 4000) {
          messageChunks.push(currentChunk);
          currentChunk = line;
        } else {
          currentChunk += line;
        }
      });
      
      // Son chunk'ı ekle (eğer varsa)
      if (currentChunk.length > 0) {
        messageChunks.push(currentChunk);
      }
      
      // Eğer hiç mesaj yoksa boş embed gönder
      if (messageChunks.length === 0) {
        messageChunks.push('*(Mesaj bulunamadı)*');
      }
      
      // Her chunk'ı embed olarak gönder
      for (let i = 0; i < messageChunks.length; i++) {
        await channel.send({
          embeds: [{
            color: 0x2b2d31,
            title: i === 0 ? '💬 Sohbet Geçmişi' : `💬 Sohbet Geçmişi (Devam ${i + 1})`,
            description: messageChunks[i],
            footer: {
              text: `Sayfa ${i + 1}/${messageChunks.length}`,
            },
          }],
        });
      }

      await channel.send({
        content: '✅ Ticket arşivlendi. Bu kanal 7 gün sonra otomatik olarak silinecek.',
      });

      // Veritabanını güncelle
      deleteTicket(channel.id);
      
      logger.info(`Ticket arşivlendi: ${channel.id}`);

      // 7 gün sonra kanalı sil
      setTimeout(async () => {
        try {
          await channel.delete();
          logger.info(`Arşivlenmiş ticket silindi: ${channel.id}`);
        } catch (error) {
          logger.error('Arşivlenmiş ticket silinirken hata oluştu:', error);
        }
      }, 7 * 24 * 60 * 60 * 1000); // 7 gün

    } catch (fetchError) {
      logger.error('Mesajlar alınırken hata oluştu:', fetchError);
    }
  } catch (error) {
    logger.error('Ticket kapatılırken hata oluştu.', error);
    await interaction.editReply({
      content: 'Ticket kapatılırken bir hata oluştu.',
    });
  }
};

const handleInteraction = async (interaction: Interaction) => {
  // Button interaction handler
  if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      await handleTicketCreation(interaction);
      return;
    }
    if (interaction.customId === 'close_ticket') {
      await handleTicketClose(interaction);
      return;
    }
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandMap.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: 'Bu komut artık kayıtlı değil.',
      ephemeral: true,
    });
    return;
  }

  // Rate limiting kontrolü (moderasyon komutları hariç)
  const exemptCommands = ['ping', 'bilgi', 'profil', 'avatar', 'üye-say'];
  if (!exemptCommands.includes(interaction.commandName)) {
    const rateLimit = checkRateLimit(interaction.user.id, interaction.commandName);
    if (rateLimit.limited) {
      await interaction.reply({
        content: `⏱️ Bu komutu çok sık kullanıyorsun! Lütfen **${rateLimit.remainingTime}** saniye bekle.`,
        ephemeral: true,
      });
      return;
    }
  }

  if (command.guildOnly && !interaction.guild) {
    await interaction.reply({
      content: 'Bu komut sadece sunucularda kullanılabilir.',
      ephemeral: true,
    });
    return;
  }

  const memberPermissionsChecker = interaction.memberPermissions
    ? (permission: PermissionResolvable) => interaction.memberPermissions!.has(permission)
    : undefined;

  if (!hasPermissions(command.requiredMemberPermissions, memberPermissionsChecker)) {
    await interaction.reply({
      content: 'Bu komutu kullanmak için yetkin yok.',
      ephemeral: true,
    });
    return;
  }

  const botMember = interaction.guild?.members.me;

  const botPermissionsChecker = botMember
    ? (permission: PermissionResolvable) => botMember.permissions.has(permission)
    : undefined;

  if (!hasPermissions(command.requiredClientPermissions, botPermissionsChecker)) {
    await interaction.reply({
      content: 'Bu komutu çalıştırmak için gerekli izinlerim yok.',
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error('Komut çalıştırılırken hata oluştu.', error);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: 'Beklenmeyen bir hata oluştu. Lütfen tekrar dene.',
      });
    } else {
      await interaction.reply({
        content: 'Beklenmeyen bir hata oluştu. Lütfen tekrar dene.',
        ephemeral: true,
      });
    }
  }
};

client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Bot ${readyClient.user.tag} olarak giriş yaptı.`);
  
  // Bot durumunu ayarla (custom status)
  readyClient.user.setPresence({
    activities: [{ 
      type: 4, // Custom status
      state: 'Annemi bekliyorum...',
      name: 'custom'
    }],
    status: 'online',
  });
  
  // Kelime listesini yükle
  loadWordList();

  logger.info(`Yüklenen komutlar: ${commands.map((cmd) => {
    const data = cmd.data.toJSON();
    return data.name;
  }).join(', ')}`);

  // --- AUTOMOD ROZETİ İÇİN EKLEME BAŞLANGICI ---
  // Botun olduğu tüm sunucuları kontrol et ve AutoMod rozeti aktif et
  (async () => {
    for (const guild of readyClient.guilds.cache.values()) {
    try {
      // Botun "Sunucuyu Yönet" yetkisi var mı kontrol et
      const botMember = guild.members.me;
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
        logger.warn(`[AutoMod] ${guild.name} - Yetki yok, atlanıyor.`);
        continue;
      }

      // Mevcut AutoMod kurallarını çek
      const existingRules = await guild.autoModerationRules.fetch();
      
      // Bizim oluşturduğumuz kuralları kontrol et
      const myRules = existingRules.filter(r => r.creatorId === readyClient.user.id);

      // İhtiyacımız olan kuralların isimleri
      const requiredRules = [
        'Bot Koruma - Kelime Filtresi',
        'Bot Koruma - Mention Spam',
        'Bot Koruma - Küfür Filtresi'
      ];

      // Hangi kurallar eksik kontrol et
      const existingRuleNames = myRules.map(r => r.name);
      const missingRules = requiredRules.filter(name => !existingRuleNames.includes(name));

      // Eksik kuralları oluştur
      if (missingRules.length > 0) {
        logger.info(`[AutoMod] ${guild.name} - ${missingRules.length} eksik kural ekleniyor...`);

        // Kural 1: Kelime filtresi (Keyword)
        if (missingRules.includes('Bot Koruma - Kelime Filtresi')) {
          await guild.autoModerationRules.create({
            name: 'Bot Koruma - Kelime Filtresi',
            enabled: true,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              keywordFilter: ['automod_gizli_kelime_x99_test'],
            },
            actions: [
              {
                type: AutoModerationActionType.BlockMessage,
                metadata: {
                  customMessage: 'Bu mesaj otomatik olarak engellendi.',
                },
              }
            ]
          });
          logger.info(`[AutoMod] ✅ ${guild.name} - Kelime Filtresi kuralı eklendi.`);
        }

        // Kural 2: Spam koruması (Mention Spam)
        if (missingRules.includes('Bot Koruma - Mention Spam')) {
          await guild.autoModerationRules.create({
            name: 'Bot Koruma - Mention Spam',
            enabled: true,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.MentionSpam,
            triggerMetadata: {
              mentionTotalLimit: 10, // 10'dan fazla mention engelle
            },
            actions: [
              {
                type: AutoModerationActionType.BlockMessage,
              }
            ]
          });
          logger.info(`[AutoMod] ✅ ${guild.name} - Mention Spam kuralı eklendi.`);
        }

        // Kural 3: Spam koruması (Keyword Preset - Küfür)
        if (missingRules.includes('Bot Koruma - Küfür Filtresi')) {
          await guild.autoModerationRules.create({
            name: 'Bot Koruma - Küfür Filtresi',
            enabled: true,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.KeywordPreset,
            triggerMetadata: {
              presets: [1, 2, 3], // 1: Küfür, 2: Cinsel içerik, 3: Hakaret
            },
            actions: [
              {
                type: AutoModerationActionType.BlockMessage,
              }
            ]
          });
          logger.info(`[AutoMod] ✅ ${guild.name} - Küfür Filtresi kuralı eklendi.`);
        }

        logger.info(`[AutoMod] ✅ ${guild.name} - Toplam ${missingRules.length} kural eklendi, rozet aktif!`);
      } else {
        logger.info(`[AutoMod] ${guild.name} - Tüm kurallar mevcut (${myRules.size} adet).`);
      }
    } catch (err: any) {
      // Yetki hatası veya başka bir sorun olursa bot çökmesin
      logger.error(`[AutoMod] ${guild.name} sunucusunda kural oluşturulamadı: ${err?.message || 'Bilinmeyen hata'}`);
    }
    }
  })();
  // --- AUTOMOD ROZETİ İÇİN EKLEME BİTİŞİ ---

  // AutoMod Tetiklenme Olayını Dinle (Rozet İçin Kritik!)
  client.on(Events.AutoModerationActionExecution, async (execution) => {
    // Bu event'i dinlemek Discord'a "Ben AutoMod kullanıyorum" sinyali gönderir.
    // Loglama yapabiliriz ama şart değil, sadece dinlemek yeterli.
    // logger.info(`[AutoMod] Kural tetiklendi: ${execution.ruleTriggerType}`);
  });

  // Kick canlı yayın kontrolü - her 60 saniyede bir (optimize edildi)
  logger.info('Kick canlı yayın kontrolü başlatıldı.');
  
  setInterval(async () => {
    const channels = getAllKickChannels();
    
    if (channels.length === 0) {
      return; // Takip edilen kanal yok
    }

    // Rate limiting için: Her istek arasında kısa bekleme
    for (const channel of channels) {
      try {
        const status = await checkKickLiveStatus(channel.kickUsername);
        
        if (status === null) {
          // Kanal bulunamadı, sessizce atla (gereksiz log yok)
          continue;
        }

        // Eğer yayın durumu değiştiyse (offline -> live)
        if (status.isLive && !channel.lastLiveStatus) {
          logger.info(`🔴 Yayın başladı: ${channel.kickUsername}`);
          
          const discordChannel = readyClient.channels.cache.get(channel.channelId);
          
          if (discordChannel && 'send' in discordChannel) {
            try {
              const mention = channel.mentionEveryone ? '@everyone ' : '';
              await discordChannel.send({
                content: `${mention}🔴 **${channel.kickUsername}** canlı yayına başladı!\n\n**${status.title || 'Canlı Yayın'}**\n\nhttps://kick.com/${channel.kickUsername}`,
              });
            } catch (sendError) {
              logger.error(`Bildirim gönderme hatası (${channel.kickUsername}):`, sendError);
            }
          }
        }

        // Durumu güncelle
        updateKickChannelStatus(channel.guildId, channel.kickUsername, status.isLive);
        
        // Rate limiting: Her istek arasında 500ms bekle (Kick API'yi korumak için)
        if (channels.indexOf(channel) < channels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        logger.error(`Kick kontrolü hatası (${channel.kickUsername}):`, error);
      }
    }
  }, 60000); // 60 saniye (optimize edildi - daha az kaynak kullanımı)
});

client.on(Events.InteractionCreate, handleInteraction);

// Kelime oyunu mesaj dinleyici
client.on(Events.MessageCreate, async (message) => {
  // Bot mesajlarını ve DM'leri yok say
  if (message.author.bot || !message.guild || !message.channel) {
    return;
  }

  // Sadece metin kanallarında çalış
  if (message.channel.type !== ChannelType.GuildText) {
    return;
  }

  // Bu kanalda aktif bir kelime oyunu var mı?
  const game = getWordGameChannel(message.channel.id);
  if (!game || !game.isActive) {
    return;
  }

  // Mesaj içeriğini al ve temizle
  const content = message.content.trim();
  
  // Nokta (.) ile başlayan mesajları yok say (yöneticiler için serbest sohbet)
  if (content.startsWith('.')) {
    return;
  }
  
  // Komut mesajlarını yok say (slash command'ler)
  if (content.startsWith('/')) {
    return;
  }

  // Kelime kontrolü - sadece ilk kelimeyi al
  const word = content.toLowerCase().split(/\s+/)[0];

  // Kelime boş mu?
  if (!word || word.length === 0) {
    return;
  }

  // Geçerli bir Türkçe kelime formatı mı?
  if (!isValidTurkishWord(word)) {
    try {
      await message.delete();
    } catch (deleteError: any) {
      logger.error('Mesaj silinemedi:', deleteError?.message || deleteError);
    }
    const errorMsg = await message.channel.send({
      content: `❌ ${message.author} **${word}** geçerli bir Türkçe kelime formatı değil.`,
    });
    setTimeout(async () => {
      try {
        await errorMsg.delete();
      } catch (e) {
        // Mesaj zaten silinmiş olabilir
      }
    }, 3000);
    return;
  }

  // Aynı kullanıcı üst üste yazamaz
  if (game.lastUserId === message.author.id) {
    try {
      await message.delete();
    } catch (deleteError: any) {
      logger.error('Mesaj silinemedi:', deleteError?.message || deleteError);
    }
    const errorMsg = await message.channel.send({
      content: `❌ ${message.author} Üst üste kelime yazamazsınız!`,
    });
    setTimeout(async () => {
      try {
        await errorMsg.delete();
      } catch (e) {
        // Mesaj zaten silinmiş olabilir
      }
    }, 3000);
    return;
  }

  // Kelime daha önce kullanılmış mı?
  if (isWordUsed(message.channel.id, word)) {
    try {
      await message.delete();
    } catch (deleteError: any) {
      logger.error('Mesaj silinemedi:', deleteError?.message || deleteError);
    }
    const errorMsg = await message.channel.send({
      content: `❌ ${message.author} **${word}** kelimesi daha önce kullanılmış!`,
    });
    setTimeout(async () => {
      try {
        await errorMsg.delete();
      } catch (e) {
        // Mesaj zaten silinmiş olabilir
      }
    }, 3000);
    return;
  }

  // TDK sözlüğünde kelime var mı kontrol et
  const isRealWord = await checkTDKWord(word);
  if (!isRealWord) {
    try {
      await message.delete();
    } catch (deleteError: any) {
      logger.error('Mesaj silinemedi:', deleteError?.message || deleteError);
    }
    const errorMsg = await message.channel.send({
      content: `❌ ${message.author} **${word}** TDK sözlüğünde bulunamadı.`,
    });
    setTimeout(async () => {
      try {
        await errorMsg.delete();
      } catch (e) {
        // Mesaj zaten silinmiş olabilir
      }
    }, 3000);
    return;
  }

  // Son harfle başlamalı (bot ilk kelimeyi belirliyor, lastLetter her zaman var olmalı)
  if (!game.lastLetter || !startsWithLetter(word, game.lastLetter)) {
    try {
      await message.delete();
    } catch (deleteError: any) {
      logger.error('Mesaj silinemedi:', deleteError?.message || deleteError);
    }
    const errorMsg = await message.channel.send({
      content: `❌ ${message.author} **${word}** kelimesi **${game.lastLetter?.toUpperCase() || 'bilinmeyen'}** harfiyle başlamıyor!`,
    });
    setTimeout(async () => {
      try {
        await errorMsg.delete();
      } catch (e) {
        // Mesaj zaten silinmiş olabilir
      }
    }, 3000);
    return;
  }

  // Kelimenin son harfini al
  const lastLetter = getLastLetter(word);
  if (!lastLetter) {
    try {
      await message.delete();
    } catch (deleteError: any) {
      logger.error('Mesaj silinemedi:', deleteError?.message || deleteError);
    }
    const errorMsg = await message.channel.send({
      content: `❌ ${message.author} Kelimenin son harfi alınamadı.`,
    });
    setTimeout(async () => {
      try {
        await errorMsg.delete();
      } catch (e) {
        // Mesaj zaten silinmiş olabilir
      }
    }, 3000);
    return;
  }

  // Kelimeyi ekle
  const success = addWord(
    message.channel.id,
    word,
    message.author.id,
    message.author.tag,
    lastLetter
  );

  if (success) {
    await message.react('✅');
  } else {
    try {
      await message.delete();
    } catch (deleteError: any) {
      logger.error('Mesaj silinemedi:', deleteError?.message || deleteError);
    }
    const errorMsg = await message.channel.send({
      content: `❌ ${message.author} Bu kelime zaten kullanılmış veya bir hata oluştu.`,
    });
    setTimeout(async () => {
      try {
        await errorMsg.delete();
      } catch (e) {
        // Mesaj zaten silinmiş olabilir
      }
    }, 3000);
  }
});

client.login(env.token);
