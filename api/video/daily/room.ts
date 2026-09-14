import type { VercelRequest, VercelResponse } from '@vercel/node';
import { provisionDailyRoom } from '../../_lib/dailyRoom';

// Vercel serverless function: POST /api/video/daily/room
// Keeps the Daily.co API key server-side — the browser only ever asks this
// endpoint for a room URL, it never talks to api.daily.co directly.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const sessionId = String((req.body as any)?.sessionId || '').trim();
  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  try {
    const room = await provisionDailyRoom(sessionId);
    res.status(200).json(room);
  } catch (err: any) {
    console.warn('Daily.co room provisioning error:', err?.message);
    res.status(502).json({ error: 'Unable to provision Daily.co room', detail: err?.message });
  }
}
