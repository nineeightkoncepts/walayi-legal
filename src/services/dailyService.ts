import { ApiConfigService } from './apiConfigService';

export interface DailyRoomInfo {
  url: string;
  name: string;
  isCustomUrl?: boolean;
}

export class DailyService {
  /**
   * Retrieves or creates a real Daily.co room using configured API key or domain.
   */
  static async getOrCreateRoom(sessionId: string, customRoomUrl?: string): Promise<DailyRoomInfo> {
    if (customRoomUrl && customRoomUrl.trim().startsWith('http')) {
      const cleanUrl = customRoomUrl.trim();
      const name = cleanUrl.split('/').pop() || sessionId;
      return { url: cleanUrl, name, isCustomUrl: true };
    }

    const config = ApiConfigService.loadConfig().dailyCo;
    const sanitizedSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const roomName = `${config.roomPrefix || 'wallahi-'}${sanitizedSessionId}`.slice(0, 64);

    // If API Key is provided, create the room via Daily.co REST API
    if (config.apiKey && config.apiKey.trim().length > 0) {
      try {
        const response = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey.trim()}`
          },
          body: JSON.stringify({
            name: roomName,
            properties: {
              enable_chat: true,
              enable_screenshare: true,
              start_video_off: false,
              start_audio_off: false,
              enable_advanced_chat: true
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.url) {
            return { url: data.url, name: data.name || roomName };
          }
        } else {
          // If room already exists (HTTP 400 / room_exists), try fetching it
          const fetchResp = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
            headers: {
              Authorization: `Bearer ${config.apiKey.trim()}`
            }
          });
          if (fetchResp.ok) {
            const existingData = await fetchResp.json();
            if (existingData && existingData.url) {
              return { url: existingData.url, name: existingData.name || roomName };
            }
          }
        }
      } catch (err) {
        console.warn('Daily.co API room creation request failed, falling back to domain room URL:', err);
      }
    }

    // Fallback using configured Daily Domain
    const domainBase = config.domain ? config.domain.trim().replace(/\/$/, '') : 'https://wallahi.daily.co';
    const roomUrl = `${domainBase}/${roomName}`;
    return { url: roomUrl, name: roomName };
  }
}
