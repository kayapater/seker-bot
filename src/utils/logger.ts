const timestamp = () => {
  // Türkiye saati için GMT+3 offset'i ekle
  const now = new Date();
  const turkeyOffset = 3 * 60; // GMT+3 = 180 dakika
  const localOffset = now.getTimezoneOffset(); // Yerel saat ile UTC arasındaki fark (dakika)
  
  // Türkiye saatini hesapla
  const turkeyTime = new Date(now.getTime() + (turkeyOffset + localOffset) * 60 * 1000);
  
  const year = turkeyTime.getFullYear();
  const month = String(turkeyTime.getMonth() + 1).padStart(2, '0');
  const day = String(turkeyTime.getDate()).padStart(2, '0');
  const hours = String(turkeyTime.getHours()).padStart(2, '0');
  const minutes = String(turkeyTime.getMinutes()).padStart(2, '0');
  const seconds = String(turkeyTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} GMT+3`;
};

export const logger = {
  info(message: string) {
    console.log(`[INFO] ${timestamp()} | ${message}`);
  },
  warn(message: string) {
    console.warn(`[WARN] ${timestamp()} | ${message}`);
  },
  error(message: string, error?: unknown) {
    console.error(`[ERROR] ${timestamp()} | ${message}`, error);
  },
};

