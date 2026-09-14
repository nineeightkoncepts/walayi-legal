import type { VercelRequest, VercelResponse } from '@vercel/node';
import { provisionDailyRoom } from '../../_lib/dailyRoom';

// Vercel serverless function: POST /api/video/daily/room
// Keeps the Daily.co API key server-side — the browser only ever asks this
// endpoint for a room URL, it never talks to api.daily.co directly.
//
// The whole body is wrapped in one try/catch, including request parsing —
// an uncaught throw anywhere here surfaces to the client as an opaque
// platform-level 500 with no detail, so nothing is allowed to run outside
// this block.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    let body: any = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const sessionId = String(body?.sessionId || '').trim();
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const room = await provisionDailyRoom(sessionId);
    res.status(200).json(room);
  } catch (err: any) {
    console.error('Daily.co room provisioning error:', err?.stack || err?.message || err);
    res.status(502).json({ error: 'Unable to provision Daily.co room', detail: err?.message || String(err) });
  }
}
