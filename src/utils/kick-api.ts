// Kick API çağrıları (veritabanı işlemi değil)

// Kick API'den canlı yayın durumunu kontrol et
export const checkKickLiveStatus = async (username: string): Promise<{
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  thumbnail?: string;
} | null> => {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${username.toLowerCase()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Kick API yanıt hatası (${username}): ${response.status} ${response.statusText}`);
      return null;
    }

    const data: any = await response.json();
    
    // Kick API yapısına göre canlı yayın kontrolü
    // livestream objesi her zaman var olabilir, ama içinde gerçekten canlı yayın bilgisi olup olmadığını kontrol et
    const livestream = data.livestream || data.live_stream || data.stream;
    
    // Canlı yayın kontrolü: En güvenilir yöntem - gerçek yayın bilgilerini kontrol et
    let isLive = false;
    
    if (livestream) {
      // En güvenilir kontrol: viewer_count veya session_title varsa VE id varsa canlı yayın var
      // Ayrıca is_live flag'ini de kontrol et
      const hasViewerCount = livestream.viewer_count !== undefined || livestream.viewerCount !== undefined;
      const hasSessionTitle = livestream.session_title || livestream.title || livestream.sessionTitle;
      const hasStreamId = livestream.id && typeof livestream.id === 'number';
      const isLiveFlag = livestream.is_live === true || livestream.isLive === true;
      
      // Canlı yayın sadece şu durumlarda true:
      // 1. is_live flag'i true ise VEYA
      // 2. stream id var VE (viewer_count var VEYA session_title var)
      if (isLiveFlag) {
        isLive = true;
      } else if (hasStreamId && (hasViewerCount || hasSessionTitle)) {
        // Stream id var ve yayın bilgileri var - canlı yayın olabilir
        // Ama ek kontrol: viewer_count 0'dan büyük olmalı veya session_title olmalı
        const viewerCount = livestream.viewer_count || livestream.viewerCount || 0;
        if (viewerCount > 0 || hasSessionTitle) {
          isLive = true;
        }
      }
      
      // Debug log (sadece sorun olduğunda açılabilir)
      // console.log(`Kick API Debug (${username}):`, {
      //   hasStreamId,
      //   hasViewerCount,
      //   hasSessionTitle,
      //   isLiveFlag,
      //   isLive,
      //   livestream: JSON.stringify(livestream).substring(0, 200)
      // });
    }
    
    if (isLive && livestream) {
      return {
        isLive: true,
        title: livestream.session_title || livestream.title || livestream.sessionTitle || 'Canlı Yayın',
        viewerCount: livestream.viewer_count || livestream.viewerCount || livestream.viewers || 0,
        thumbnail: livestream.thumbnail?.url || livestream.thumbnail_url || data.user?.profile_pic || null,
      };
    }

    return { isLive: false };
  } catch (error) {
    console.error(`Kick API hatası (${username}):`, error);
    return null;
  }
};

