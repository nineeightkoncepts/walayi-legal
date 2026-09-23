// Verifies that a request genuinely comes from a signed-in WALAYI admin,
// without needing a Firebase Admin SDK service-account credential (none is
// available in this deployment — see the equivalent constraint noted
// elsewhere in this codebase). Uses the Identity Toolkit REST API's
// accounts:lookup, which only needs the project's own Web API key — a
// value that's already public (it ships inside the client bundle via
// firebase-applet-config.json; Firebase's access control lives in security
// rules, not in keeping this key secret).

// Kept as a literal (not a JSON import) so this resolves identically
// whether bundled by esbuild (server.ts) or Vercel's own function bundler
// (api/*.ts) — both of which handle JSON module resolution differently.
const FIREBASE_WEB_API_KEY = 'AIzaSyCGwWhjTopChZnsy0fFYULr6R2Nx69mK7U';

// Mirrors src/services/roleService.ts's SUPER_ADMIN_EMAILS and
// firestore.rules' isAdmin() hardcoded list — keep all three in sync.
const ADMIN_EMAILS = [
  'admin@wallahi.ug',
  'ambrosenen@gmail.com',
  'nineeightkoncepts@gmail.com',
];

/**
 * Verifies a Firebase ID token and confirms the signed-in account is a
 * designated admin email. Returns the verified email on success, or null if
 * the token is missing/invalid/expired, or doesn't belong to an admin.
 */
export async function verifyAdminIdToken(idToken: string | undefined | null): Promise<string | null> {
  if (!idToken) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );
    if (!res.ok) return null;

    const data: any = await res.json();
    const email = String(data?.users?.[0]?.email || '').toLowerCase().trim();
    if (!email || !ADMIN_EMAILS.includes(email)) return null;

    return email;
  } catch (err) {
    console.warn('Admin token verification notice:', err);
    return null;
  }
}
