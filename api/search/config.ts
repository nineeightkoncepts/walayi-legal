import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAlgoliaConfigured, ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY, ALGOLIA_INDEX_NAME } from '../_lib/algoliaSync';

// Vercel serverless function: GET /api/search/config
// Hands the browser only the search-only API key (safe to expose — it can
// query but never write/delete), never the admin/indexing key. When
// Algolia isn't configured on the server, `configured: false` tells the
// client to fall back to the Marketplace's existing client-side name
// filtering instead of breaking.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (!isAlgoliaConfigured()) {
      res.status(200).json({ configured: false });
      return;
    }

    res.status(200).json({
      configured: true,
      appId: ALGOLIA_APP_ID,
      searchApiKey: ALGOLIA_SEARCH_API_KEY,
      indexName: ALGOLIA_INDEX_NAME
    });
  } catch (err: any) {
    console.error('Algolia config error:', err?.stack || err?.message || err);
    res.status(200).json({ configured: false });
  }
}
