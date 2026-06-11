import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

// Kelime listesi önbelleği
let wordSet: Set<string> | null = null;

/**
 * Yerel kelime listesini yükler
 */
export const loadWordList = (): void => {
  try {
    const wordsPath = path.join(process.cwd(), 'data', 'words.txt');
    
    if (!fs.existsSync(wordsPath)) {
      logger.warn('Yerel kelime listesi (data/words.txt) bulunamadı. API kullanılacak.');
      return;
    }

    logger.info('Yerel kelime listesi yükleniyor...');
    
    const data = fs.readFileSync(wordsPath, 'utf-8');
    const words = data.split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length >= 2); // En az 2 harfli kelimeler
    
    wordSet = new Set(words);
    
    logger.info(`✅ ${wordSet.size} kelime başarıyla yüklendi.`);
  } catch (error) {
    logger.error('Kelime listesi yüklenirken hata oluştu:', error);
  }
};

/**
 * TDK sözlüğünde kelime var mı kontrol eder
 * Önce yerel listeyi kontrol eder, yoksa API'ye bakar
 */
export const checkTDKWord = async (word: string): Promise<boolean> => {
  const normalizedWord = word.toLowerCase().trim();

  // 1. Yerel liste kontrolü (En hızlı)
  if (wordSet) {
    if (wordSet.has(normalizedWord)) {
      return true;
    }
    // Eğer yerel liste yüklü ama kelime yoksa, API'ye sormadan reddet
    // (Yerel listenin tam olduğu varsayımıyla - eğer tam değilse API fallback açılabilir)
    return false; 
  }

  // 2. API kontrolü (Yavaş - Fallback)
  try {
    const url = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(normalizedWord)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://sozluk.gov.tr/',
        'Origin': 'https://sozluk.gov.tr',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    if (data && Array.isArray(data) && data.length > 0) {
      const firstResult = data[0];
      if (firstResult && (firstResult.madde || firstResult.madde_adi || firstResult.kelime)) {
        const madde = (firstResult.madde || firstResult.madde_adi || firstResult.kelime).toLowerCase().trim();
        
        // Basit normalizasyon ve karşılaştırma
        const clean = (t: string) => {
          const map: Record<string, string> = { 'ı': 'i', 'ü': 'u', 'ğ': 'g', 'ş': 's', 'ö': 'o', 'ç': 'c' };
          return t.replace(/[ıüüğşöç]/g, (c) => map[c] || c);
        };
        
        if (madde === normalizedWord || clean(madde) === clean(normalizedWord)) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    return false;
  }
};
