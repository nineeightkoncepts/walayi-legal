// Shared Daily.co room-provisioning logic, used by both the Vercel
// serverless function (api/video/daily/room.ts, for the Vercel/custom-domain
// deployment) and the Express route (server.ts, for local dev / any
// non-Vercel deployment) so the two never drift apart.
//
// Files under api/_lib are not turned into routes by Vercel (the leading
// underscore opts the directory out of routing) — this is plain shared code.

export interface DailyRoomResult {
  url: string;
  name: string;
  isProvisioned: boolean;
}

export const isDailyConfigured = (): boolean => !!process.env.DAILY_CO_API_KEY;

export const dailyDomain = (): string =>
  (process.env.DAILY_CO_DOMAIN || 'https://wallahi.daily.co').trim();

const roomNameFor = (sessionId: string): string => {
  const roomPrefix = process.env.DAILY_CO_ROOM_PREFIX || 'wallahi-';
  const sanitized = sessionId.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  return `${roomPrefix}${sanitized}`.slice(0, 64);
};

// Creates (or fetches, if it already exists) a Daily.co room for a
// commissioning session. Both parties call this with the same sessionId
// (the commissioning request id), so the deterministic room name routes
// them into the same room.
export async function provisionDailyRoom(sessionId: string): Promise<DailyRoomResult> {
  const apiKey = (process.env.DAILY_CO_API_KEY || '').trim();
  const roomName = roomNameFor(sessionId);

  if (!apiKey) {
    // No Daily.co account configured yet — hand back a best-effort domain
    // URL so the client has something to try, flagged as unprovisioned so
    // the UI can explain why joining may fail.
    return {
      url: `${dailyDomain().replace(/\/$/, '')}/${roomName}`,
      name: roomName,
      isProvisioned: false
    };
  }

  const createResp = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
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

  if (createResp.ok) {
    const data = await createResp.json();
    return { url: data.url, name: data.name || roomName, isProvisioned: true };
  }

  // Room may already exist from a prior session — fetch it instead of failing.
  const fetchResp = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (fetchResp.ok) {
    const data = await fetchResp.json();
    return { url: data.url, name: data.name || roomName, isProvisioned: true };
  }

  const errBody = await createResp.text().catch(() => '');
  throw new Error(`Daily.co room creation failed (${createResp.status}): ${errBody}`);
}
