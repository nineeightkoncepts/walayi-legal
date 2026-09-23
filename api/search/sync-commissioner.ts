import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminIdToken } from '../_lib/verifyFirebaseAdmin';
import { isAlgoliaConfigured, upsertCommissionerRecord, removeCommissionerRecord, CommissionerSearchRecord } from '../_lib/algoliaSync';

// Vercel serverless function: POST /api/search/sync-commissioner
// The one write path into the Algolia index — per the concept note,
// "Ordinary frontend users must not write directly to the index." The
// browser never holds the admin/indexing key; it calls this endpoint
// instead, which verifies the caller is a signed-in WALAYI admin (via
// their Firebase ID token) before touching Algolia at all.
//
// Called from AppContext's setCommissionerAdmission (admit/suspend/reject)
// and from updateCurrentUser (an already-admitted commissioner editing
// their public profile) — see src/services/searchSyncService.ts.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (!isAlgoliaConfigured()) {
      // Not an error — search sync is an optional enhancement layer, and
      // the admission itself (the real, authoritative action) already
      // succeeded in Firestore before this was ever called.
      res.status(200).json({ synced: false, reason: 'ALGOLIA_NOT_CONFIGURED' });
      return;
    }

    let body: any = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const idToken = String(body?.idToken || '');
    const adminEmail = await verifyAdminIdToken(idToken);
    if (!adminEmail) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const action = body?.action === 'remove' ? 'remove' : 'upsert';

    if (action === 'remove') {
      const objectID = String(body?.objectID || '');
      if (!objectID) {
        res.status(400).json({ error: 'objectID is required' });
        return;
      }
      await removeCommissionerRecord(objectID);
      res.status(200).json({ synced: true });
      return;
    }

    const record = body?.record as CommissionerSearchRecord | undefined;
    if (!record?.objectID || !record?.full_name) {
      res.status(400).json({ error: 'record.objectID and record.full_name are required' });
      return;
    }

    await upsertCommissionerRecord(record);
    res.status(200).json({ synced: true });
  } catch (err: any) {
    console.error('Algolia sync error:', err?.stack || err?.message || err);
    res.status(502).json({ error: 'Unable to sync search index', detail: err?.message || String(err) });
  }
}
