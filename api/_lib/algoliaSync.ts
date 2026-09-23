// Server-only Algolia sync logic, shared by both the Vercel serverless
// function (api/search/*.ts) and the Express route (server.ts) — same
// dual-path pattern as api/_lib/dailyRoom.ts.
//
// Per the WALAYI Incremental Algolia Search Integration concept note:
// Algolia is a discovery index only, never the source of truth. The admin
// (indexing) API key lives ONLY here, read from an environment variable —
// it must never reach the frontend bundle. The browser only ever gets the
// separate, safe-to-expose search-only API key (see config.ts).

import { algoliasearch } from 'algoliasearch';

export const ALGOLIA_APP_ID = (process.env.ALGOLIA_APP_ID || '').trim();
export const ALGOLIA_ADMIN_API_KEY = (process.env.ALGOLIA_ADMIN_API_KEY || '').trim();
export const ALGOLIA_SEARCH_API_KEY = (process.env.ALGOLIA_SEARCH_API_KEY || '').trim();
export const ALGOLIA_INDEX_NAME = (process.env.ALGOLIA_INDEX_NAME || 'walayi_commissioners_prod').trim();

export const isAlgoliaConfigured = (): boolean =>
  !!(ALGOLIA_APP_ID && ALGOLIA_ADMIN_API_KEY && ALGOLIA_SEARCH_API_KEY);

// Exactly the "Suggested searchable/filterable fields" from the concept
// note — never credential files, national ID numbers, private phone
// numbers, internal admin notes or payment/transaction data.
export interface CommissionerSearchRecord {
  objectID: string;
  full_name: string;
  other_names?: string;
  firm_name?: string;
  professional_title?: string;
  location_name?: string;
  professional_category?: string;
  role?: string;
  district?: string;
  region?: string;
  active_status?: boolean;
  admitted_status?: string;
  profile_photo_url?: string;
  fee_preview_ugx?: number;
}

let cachedClient: ReturnType<typeof algoliasearch> | null = null;

function getAdminClient() {
  if (!isAlgoliaConfigured()) return null;
  if (!cachedClient) {
    cachedClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
  }
  return cachedClient;
}

/** Indexes (or re-indexes) one admitted, active commissioner's public record. */
export async function upsertCommissionerRecord(record: CommissionerSearchRecord): Promise<void> {
  const client = getAdminClient();
  if (!client) throw new Error('ALGOLIA_NOT_CONFIGURED');
  await client.saveObject({ indexName: ALGOLIA_INDEX_NAME, body: record });
}

/** Removes a commissioner from the search index — suspended/rejected/deactivated. */
export async function removeCommissionerRecord(objectID: string): Promise<void> {
  const client = getAdminClient();
  if (!client) throw new Error('ALGOLIA_NOT_CONFIGURED');
  await client.deleteObject({ indexName: ALGOLIA_INDEX_NAME, objectID }).catch((err: any) => {
    // Deleting a record that was never indexed (e.g. Algolia was configured
    // after this commissioner was rejected) is a no-op, not a failure.
    if (err?.status !== 404) throw err;
  });
}
