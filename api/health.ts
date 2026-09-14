import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isDailyConfigured, dailyDomain } from './_lib/dailyRoom';

// Vercel serverless function: GET /api/health
// Mirrors the fields the client actually reads from the Express server's
// /api/health (see server.ts) so the same admin status check works on
// whichever deployment is serving the app.
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    dailyConfigured: isDailyConfigured(),
    dailyDomain: dailyDomain(),
    timestamp: new Date().toISOString()
  });
}
