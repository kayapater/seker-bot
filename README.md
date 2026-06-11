# Şeker Bot

Türkçe moderasyon odaklı Discord botu. Slash komutlarıyla çalışır ve kolayca genişletilebilir bir mimariye sahiptir.

## Başlangıç

1. Bağımlılıkları yükle:
   ```bash
   npm install
   ```
2. `env.example` dosyasını `.env` olarak kopyala ve değerleri doldur:
   - `DISCORD_TOKEN`: Bot tokenı
   - `CLIENT_ID`: Uygulama (bot) ID'si
   - `GUILD_ID`: Komutları test etmek istediğin sunucu ID'si

3. Geliştirme ortamında botu çalıştır:
   ```bash
   npm run dev
   ```

4. Slash komutlarını güncelle:
   ```bash
   npm run deploy:commands
   ```

## Komutlar

- `/bilgi`: Sunucuya dair temel bilgileri gösterir.
- `/temizle adet:<1-100>`: Metin kanalındaki son mesajları toplu siler. Kullanıcı ve bot için `Mesajları Yönet` izni gerekir.

## Mimari

- `src/commands`: Her komut kendi dosyasında tanımlanır.
- `src/config`: Ortam değişkenleri ve yapılandırmalar.
- `src/utils/logger.ts`: Basit zaman damgalı log arayüzü.
- `src/deploy-commands.ts`: Slash komutlarını Discord API'ye kaydeder.

Yeni komut eklemek için `src/commands` klasörüne yeni bir dosya ekle ve `src/commands/index.ts` içinde listeye eklemen yeterli.

