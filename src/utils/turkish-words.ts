// Türkçe kelime kontrolü için yardımcı fonksiyonlar

// Türkçe harfler
const TURKISH_LETTERS = 'abcçdefgğhıijklmnoöprsştuüvyzxqw';
const TURKISH_LOWERCASE = TURKISH_LETTERS.toLowerCase();
const TURKISH_UPPERCASE = TURKISH_LETTERS.toUpperCase();

/**
 * Türkçe karakterleri normalize eder (ı->i, ş->s, ç->c, etc.)
 */
export const normalizeTurkish = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

/**
 * Kelimenin sadece Türkçe harflerden oluşup oluşmadığını kontrol eder
 */
export const isValidTurkishWord = (word: string): boolean => {
  // En az 2 karakter olmalı
  if (word.length < 2) {
    return false;
  }

  // Sadece Türkçe harfler ve boşluk olmamalı
  const turkishRegex = /^[a-zçğıöşü]+$/i;
  if (!turkishRegex.test(word)) {
    return false;
  }

  // Türkçe kelime kontrolü için basit kurallar
  // (Gerçek bir kelime kontrolü için API veya daha kapsamlı bir liste gerekir)
  return true;
};

/**
 * Kelimenin son harfini alır (Türkçe karakterleri dikkate alarak)
 */
export const getLastLetter = (word: string): string | null => {
  if (!word || word.length === 0) {
    return null;
  }

  // Son harfi al (Türkçe karakterleri koru)
  const lastCharIndex = word.length - 1;
  const lastCharRaw = word[lastCharIndex];
  if (!lastCharRaw) {
    return null;
  }
  const lastChar = lastCharRaw.toLowerCase();
  
  // Eğer son karakter özel bir karakter ise (noktalama, sayı, vs.) bir önceki harfi al
  if (!TURKISH_LOWERCASE.includes(lastChar)) {
    // Son geçerli harfi bul
    for (let i = word.length - 1; i >= 0; i--) {
      const char = word[i]?.toLowerCase();
      if (char && TURKISH_LOWERCASE.includes(char)) {
        return char;
      }
    }
    return null;
  }

  return lastChar;
};

/**
 * Kelimenin belirli bir harfle başlayıp başlamadığını kontrol eder
 */
export const startsWithLetter = (word: string, letter: string): boolean => {
  if (!word || !letter || word.length === 0) {
    return false;
  }

  const firstChar = word[0]?.toLowerCase();
  if (!firstChar) {
    return false;
  }

  const targetLetter = letter.toLowerCase();

  // Türkçe karakter eşleştirmesi
  const turkishPairs: { [key: string]: string[] } = {
    'i': ['ı', 'i'],
    'ı': ['ı', 'i'],
    'g': ['g', 'ğ'],
    'ğ': ['g', 'ğ'],
    'u': ['u', 'ü'],
    'ü': ['u', 'ü'],
    's': ['s', 'ş'],
    'ş': ['s', 'ş'],
    'o': ['o', 'ö'],
    'ö': ['o', 'ö'],
    'c': ['c', 'ç'],
    'ç': ['c', 'ç'],
  };

  // Eğer özel bir eşleştirme varsa kontrol et
  if (turkishPairs[targetLetter]) {
    return turkishPairs[targetLetter].includes(firstChar);
  }

  return firstChar === targetLetter;
};

/**
 * TDK sözlüğünde kelime var mı kontrol eder
 * Bu fonksiyon artık kullanılmıyor, checkTDKWord kullanılmalı
 */
export const isRealTurkishWord = async (word: string): Promise<boolean> => {
  // Basit kontrol: En az 2 karakter, sadece Türkçe harfler
  if (!isValidTurkishWord(word)) {
    return false;
  }

  // Çok kısa veya tekrarlayan harflerden oluşan kelimeleri reddet
  if (word.length === 2 && word[0] && word[1] && word[0] === word[1]) {
    return false;
  }

  // Geçerli bir Türkçe kelime gibi görünüyor
  return true;
};

/**
 * Rastgele bir Türkçe kelime döndürür (oyun başlatmak için)
 */
export const getRandomTurkishWord = (): string => {
  const words = [
    'araba', 'bebek', 'çiçek', 'deniz', 'elma', 'fener', 'güneş', 'hava', 'ırmak', 'iğne',
    'jilet', 'kale', 'limon', 'masa', 'nergis', 'okul', 'pencere', 'radyo', 'sandalye', 'tahta',
    'uçak', 'üzüm', 'vazo', 'yıldız', 'zaman', 'araba', 'balık', 'çanta', 'dere', 'ekmek',
    'fare', 'gül', 'halı', 'ıhlamur', 'iplik', 'jandarma', 'karpuz', 'lamba', 'meyve', 'nar',
    'orman', 'pamuk', 'raket', 'sabun', 'tavuk', 'uçurtma', 'üzgün', 'vapur', 'yaprak', 'zarf',
    'armut', 'biber', 'çamur', 'düğme', 'elbise', 'fincan', 'gözlük', 'hızlı', 'ıslak', 'içecek',
    'jimnastik', 'kavun', 'lale', 'muz', 'nane', 'ocak', 'pantolon', 'rahat', 'sandal', 'tavşan',
    'uçak', 'üzüm', 'vazo', 'yemek', 'zil', 'ayna', 'bebek', 'çorap', 'dolap', 'elma',
    'fırça', 'güneş', 'halı', 'ıhlamur', 'iğne', 'jilet', 'kale', 'limon', 'masa', 'nergis'
  ];
  
  return words[Math.floor(Math.random() * words.length)] || 'kelime';
};

