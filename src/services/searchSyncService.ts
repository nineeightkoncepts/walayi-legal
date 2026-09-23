import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { UserProfile } from '../types';

export interface CommissionerSearchHit {
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

interface SearchConfig {
  configured: boolean;
  appId?: string;
  searchApiKey?: string;
  indexName?: string;
}

let configPromise: Promise<SearchConfig> | null = null;
let searchClient: ReturnType<typeof algoliasearch> | null = null;

/**
 * Fetches (and caches for the session) the public search config from the
 * server — the search-only API key, safe to hold client-side, never the
 * admin/indexing key. Resolves to { configured: false } whenever Algolia
 * isn't set up yet, or the request itself fails, so every caller has one
 * simple thing to check before doing anything Algolia-specific.
 */
async function getSearchConfig(): Promise<SearchConfig> {
  if (!configPromise) {
    configPromise = fetch('/api/search/config')
      .then((res) => (res.ok ? res.json() : { configured: false }))
      .catch(() => ({ configured: false }));
  }
  return configPromise;
}

async function getSearchClient(): Promise<{ client: ReturnType<typeof algoliasearch>; indexName: string } | null> {
  const config = await getSearchConfig();
  if (!config.configured || !config.appId || !config.searchApiKey || !config.indexName) {
    return null;
  }
  if (!searchClient) {
    searchClient = algoliasearch(config.appId, config.searchApiKey);
  }
  return { client: searchClient, indexName: config.indexName };
}

/**
 * Marketplace name search via Algolia — the "Search Commissioner by name"
 * box from the concept note. Returns null (not an empty array) whenever
 * Algolia isn't configured, or the request fails for any reason, so the
 * Marketplace can tell "no results" apart from "search unavailable, fall
 * back to the existing client-side name filter" per the concept note's
 * fail-gracefully requirement — a stale/failed index must never look like
 * "this commissioner doesn't exist."
 */
export async function searchCommissioners(query: string): Promise<CommissionerSearchHit[] | null> {
  try {
    const resolved = await getSearchClient();
    if (!resolved) return null;

    const { results } = await resolved.client.searchForHits<CommissionerSearchHit>({
      requests: [
        {
          indexName: resolved.indexName,
          query,
          hitsPerPage: 20,
          // Admission/eligibility is re-verified server-side (Firestore
          // rules + createCommissioningRequest) before any assignment —
          // this filter is purely so a stale index entry doesn't dangle a
          // non-admitted commissioner in front of a searcher.
          filters: 'admitted_status:ADMITTED AND active_status:true'
        }
      ]
    });

    const first = results[0];
    return 'hits' in first ? (first.hits as CommissionerSearchHit[]) : [];
  } catch (err) {
    console.warn('Commissioner search notice:', err);
    return null;
  }
}

/** True once the server confirms Algolia is actually configured. */
export async function isSearchAvailable(): Promise<boolean> {
  const config = await getSearchConfig();
  return config.configured;
}

const professionalCategoryToLabel: Record<string, string> = {
  commissioner_for_oaths: 'Commissioner for Oaths',
  notary_public: 'Notary Public',
  judicial_officer: 'Judicial Officer',
  justice_of_the_peace: 'Justice of the Peace',
  advocate: 'Advocate',
};

/** Builds the sanitized, index-safe record for one commissioner — only the
 * fields the concept note's field list allows; never credential files,
 * national ID numbers, private phone numbers or payment data.
 *
 * active_status marks record eligibility (this commissioner is currently
 * admitted, so the record should exist at all) — it is NOT the personal
 * "accepting new work right now" toggle (availableNow). The existing
 * Marketplace already treats availableNow as an explicit opt-in filter
 * (the "Available Now" checkbox), not something that hides a commissioner
 * by default, and search should behave the same way. Records are removed
 * outright on suspend/reject/deactivate (see setCommissionerAdmission), so
 * any record that still exists in the index is, by construction, active.
 */
export function buildCommissionerSearchRecord(user: UserProfile): CommissionerSearchHit {
  return {
    objectID: user.id,
    full_name: user.fullName,
    firm_name: user.firmName || user.lawFirmName || undefined,
    professional_title: user.professionalCategory ? professionalCategoryToLabel[user.professionalCategory] : undefined,
    location_name: user.stationCity || undefined,
    professional_category: user.professionalCategory || undefined,
    role: user.role,
    district: user.stationCity || undefined,
    active_status: true,
    admitted_status: user.admissionStatus || undefined,
    profile_photo_url: user.avatarUrl || undefined,
    fee_preview_ugx: typeof user.indicativeFeeUGX === 'number' ? user.indicativeFeeUGX : undefined,
  };
}

/**
 * Pushes one commissioner's public record into the search index (admit, or
 * a profile edit by an already-admitted commissioner) — best-effort. Never
 * throws: search sync is an enhancement layer on top of the real,
 * authoritative Firestore admission decision, which has already happened
 * by the time this is called.
 */
export async function syncCommissionerToSearch(idToken: string, user: UserProfile): Promise<void> {
  try {
    const config = await getSearchConfig();
    if (!config.configured) return;

    await fetch('/api/search/sync-commissioner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        action: 'upsert',
        record: buildCommissionerSearchRecord(user)
      })
    });
  } catch (err) {
    console.warn('Search index sync notice:', err);
  }
}

/** Removes a commissioner from the search index — suspended/rejected/deactivated. */
export async function removeCommissionerFromSearch(idToken: string, userId: string): Promise<void> {
  try {
    const config = await getSearchConfig();
    if (!config.configured) return;

    await fetch('/api/search/sync-commissioner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, action: 'remove', objectID: userId })
    });
  } catch (err) {
    console.warn('Search index removal notice:', err);
  }
}
