// Zaman damgası yardımcı fonksiyonları (GMT+3 - Türkiye saati)

/**
 * Türkiye saatine (GMT+3) göre zaman damgası oluşturur
 */
export const getTurkeyTime = (): Date => {
  const now = new Date();
  // UTC'ye 3 saat ekle (Türkiye saati)
  const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return turkeyTime;
};

/**
 * Discord timestamp formatı için Unix timestamp (saniye cinsinden)
 * Türkiye saatine göre
 */
export const getTurkeyTimestamp = (date?: Date): number => {
  const d = date || getTurkeyTime();
  return Math.floor(d.getTime() / 1000);
};

/**
 * ISO string formatında Türkiye saati
 * Discord embed timestamp için kullanılır
 */
export const getTurkeyISOString = (date?: Date): string => {
  const d = date || new Date();
  // Türkiye saati için UTC+3 offset'i ekle
  const offset = 3; // GMT+3
  const utc = d.getTime() + (d.getTimezoneOffset() * 60 * 1000);
  const turkeyTime = new Date(utc + (offset * 60 * 60 * 1000));
  return turkeyTime.toISOString();
};

