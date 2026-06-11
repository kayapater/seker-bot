// Rate limiting sistemi

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

/**
 * Rate limit kontrolü yapar
 * @param userId Kullanıcı ID'si
 * @param commandName Komut adı
 * @param maxUses Maksimum kullanım sayısı
 * @param windowMs Zaman penceresi (milisaniye)
 * @returns true ise rate limit aşıldı, false ise devam edilebilir
 */
export const checkRateLimit = (
  userId: string,
  commandName: string,
  maxUses: number = 5,
  windowMs: number = 60000 // 1 dakika
): { limited: boolean; remainingTime?: number } => {
  const key = `${userId}:${commandName}`;
  const now = Date.now();
  
  const entry = rateLimits.get(key);

  // Eğer kayıt yoksa veya süre dolmuşsa yeni kayıt oluştur
  if (!entry || now >= entry.resetAt) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { limited: false };
  }

  // Limit aşıldı mı kontrol et
  if (entry.count >= maxUses) {
    const remainingTime = Math.ceil((entry.resetAt - now) / 1000); // saniye cinsinden
    return { limited: true, remainingTime };
  }

  // Sayacı artır
  entry.count++;
  return { limited: false };
};

/**
 * Belirli bir kullanıcının rate limit'ini sıfırlar
 */
export const resetRateLimit = (userId: string, commandName: string): void => {
  const key = `${userId}:${commandName}`;
  rateLimits.delete(key);
};

/**
 * Tüm rate limit'leri temizler (opsiyonel - bakım için)
 */
export const clearAllRateLimits = (): void => {
  rateLimits.clear();
};

/**
 * Eski rate limit kayıtlarını temizler (bellek optimizasyonu)
 */
export const cleanupExpiredRateLimits = (): void => {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now >= entry.resetAt) {
      rateLimits.delete(key);
    }
  }
};

// Her 5 dakikada bir eski kayıtları temizle
setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);

