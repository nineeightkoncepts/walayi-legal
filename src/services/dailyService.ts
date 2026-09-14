import { ApiConfigService } from './apiConfigService';

export interface DailyRoomInfo {
  url: string;
  name: string;
  isCustomUrl?: boolean;
  isProvisioned?: boolean;
}

export class DailyService {
  /**
   * Retrieves or creates a real Daily.co room for a commissioning session.
   * Room creation happens server-side (POST /api/video/daily/room) so the
   * Daily.co API key never has to live in the browser — both parties pass
   * the same sessionId and land in the same deterministically-named room.
   */
  static async getOrCreateRoom(sessionId: string, customRoomUrl?: string): Promise<DailyRoomInfo> {
    if (customRoomUrl && customRoomUrl.trim().startsWith('http')) {
      const cleanUrl = customRoomUrl.trim();
      const name = cleanUrl.split('/').pop() || sessionId;
      return { url: cleanUrl, name, isCustomUrl: true };
    }

    try {
      const response = await fetch('/api/video/daily/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.url) {
          return { url: data.url, name: data.name || sessionId, isProvisioned: !!data.isProvisioned };
        }
      }
    } catch (err) {
      console.warn('Daily.co server room provisioning request failed, falling back to configured domain:', err);
    }

    // Fallback: derive the same deterministic room URL client-side using
    // whatever domain is configured, in case the server request itself failed
    // (e.g. offline dev preview without the Express server running).
    const config = ApiConfigService.loadConfig().dailyCo;
    const sanitizedSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const roomName = `${config.roomPrefix || 'wallahi-'}${sanitizedSessionId}`.slice(0, 64);
    const domainBase = config.domain ? config.domain.trim().replace(/\/$/, '') : 'https://wallahi.daily.co';
    return { url: `${domainBase}/${roomName}`, name: roomName, isProvisioned: false };
  }
}
