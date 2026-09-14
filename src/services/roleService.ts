import { UserRole } from '../types';

/**
 * Role-Based Access Control (RBAC) — determines what each role can access.
 * Rules: once a user signs in, only views permitted by their role are accessible.
 */

/**
 * Emails that are always granted the platform's apex (super/master) admin tier,
 * regardless of what their Firestore profile says. These accounts are recognised
 * at sign-in and mapped to the highest-privilege role.
 */
export const SUPER_ADMIN_EMAILS = [
  'admin@wallahi.ug',
  'ambrosenen@gmail.com',
];

/**
 * True when the given email is a designated super admin. Case/whitespace safe.
 */
export const isSuperAdminEmail = (email?: string | null): boolean =>
  !!email && SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());

export type FeatureAccess = {
  canAccess: boolean;
  reason?: string;
};

/**
 * Check if a role can access a specific view/feature.
 * Used to gate navigation and render protected views.
 */
export const canAccessView = (
  role: UserRole | null | undefined,
  view: string
): FeatureAccess => {
  if (!role) {
    return { canAccess: false, reason: 'Not authenticated' };
  }

  // Role permission matrix: what each role can access
  const permissions: Record<UserRole, Set<string>> = {
    'deponent': new Set([
      'home',
      'marketplace',     // browse commissioners
      'new-commissioning', // request commissioning
      'room',            // live commissioning room
      'documents',       // own documents
      'vault',           // own credentials
      'wallet',          // own wallet/payments
      'pro',             // pro subscription
      'verify-portal',   // certificate verification (public anyway)
    ]),

    'commissioner': new Set([
      'home',
      'commissioner-dashboard', // his dashboard
      'commissioner-settings',   // his settings (NEW)
      'room',             // live commissioning room
      'documents',        // his documents
      'wallet',           // his wallet/payouts
      'verify-portal',    // certificate verification
    ]),

    'advocate': new Set([
      'home',
      'marketplace',
      'documents',
      'wallet',
      'verify-portal',
    ]),

    'notary': new Set([
      'home',
      'commissioner-dashboard', // notaries often have similar workflows
      'room',
      'documents',
      'wallet',
      'verify-portal',
    ]),

    'judicial_officer': new Set([
      'home',
      'documents',
      'wallet',
      'verify-portal',
    ]),

    'justice_of_peace': new Set([
      'home',
      'documents',
      'wallet',
      'verify-portal',
    ]),

    'law_firm_admin': new Set([
      'home',
      'marketplace',
      'new-commissioning',
      'room',
      'documents',
      'vault',
      'wallet',
      'verify-portal',
    ]),

    'super_admin': new Set([
      'home',
      'marketplace',
      'new-commissioning',
      'room',
      'documents',
      'vault',
      'wallet',
      'admin',
      'pro',
      'verify-portal',
    ]),

    'admin': new Set([
      'home',
      'marketplace',
      'new-commissioning',
      'room',
      'documents',
      'vault',
      'wallet',
      'admin',
      'pro',
      'verify-portal',
    ]),

    'master_admin': new Set([
      'home',
      'marketplace',
      'new-commissioning',
      'room',
      'documents',
      'vault',
      'wallet',
      'admin',
      'pro',
      'onboarding',
      'verify-portal',
    ]),

    'user': new Set([
      'home',
      'marketplace',
      'new-commissioning',
      'room',
      'documents',
      'vault',
      'wallet',
      'pro',
      'verify-portal',
    ]),
  };

  const allowed = permissions[role];
  if (!allowed) {
    return { canAccess: false, reason: `Unknown role: ${role}` };
  }

  if (allowed.has(view)) {
    return { canAccess: true };
  }

  return {
    canAccess: false,
    reason: `Role '${role}' cannot access '${view}'`,
  };
};

/**
 * Check if a role is an admin-level role.
 */
export const isAdminRole = (role: UserRole | null | undefined): boolean => {
  return role === 'master_admin' || role === 'admin' || role === 'super_admin';
};

/**
 * Check if a role is a commissioner-like role (handles commissioning).
 */
export const isCommissionerLike = (
  role: UserRole | null | undefined
): boolean => {
  return (
    role === 'commissioner' ||
    role === 'notary' ||
    role === 'judicial_officer' ||
    role === 'justice_of_peace'
  );
};

/**
 * Check if a role can set commissioning fees.
 */
export const canSetFees = (role: UserRole | null | undefined): boolean => {
  return (
    role === 'commissioner' ||
    role === 'notary' ||
    role === 'judicial_officer' ||
    role === 'justice_of_peace'
  );
};

/**
 * Check if a role can access admin features.
 */
export const canAccessAdmin = (role: UserRole | null | undefined): boolean => {
  return isAdminRole(role);
};

/**
 * The landing / home view each role should be taken to. Used both for the
 * brand-logo "Home" click and as the safe fallback when a user somehow lands
 * on a view their role can't access (instead of showing an Access Denied wall).
 */
export const getDefaultViewForRole = (role: UserRole | null | undefined): string => {
  if (!role) return 'home';
  if (isAdminRole(role)) return 'admin';
  if (isCommissionerLike(role)) return 'commissioner-dashboard';
  return 'home';
};

/**
 * Resolve a view the given role is actually allowed to see. If the requested
 * view is permitted, it's returned unchanged; otherwise the role's default
 * home view is returned. This lets the app silently redirect rather than
 * blocking with an "Access Denied" screen.
 */
export const resolveAccessibleView = (
  role: UserRole | null | undefined,
  view: string
): string => {
  if (canAccessView(role, view).canAccess) return view;
  return getDefaultViewForRole(role);
};

/**
 * Top-level navigation items. `view` is the primary destination and
 * `matches` are the views that should keep the tab highlighted. A nav item is
 * only rendered when the current role can access its `view`, so each user
 * simply sees the tabs relevant to them — no role switching required.
 */
export interface NavItem {
  key: string;
  label: string;
  view: string;
  matches: string[];
}

export const getVisibleNavItems = (role: UserRole | null | undefined): NavItem[] => {
  const home: NavItem = isCommissionerLike(role)
    ? { key: 'home', label: 'HOME', view: 'commissioner-dashboard', matches: ['home', 'commissioner-dashboard'] }
    : isAdminRole(role)
      ? { key: 'home', label: 'HOME', view: 'admin', matches: ['home', 'admin'] }
      : { key: 'home', label: 'HOME', view: 'home', matches: ['home'] };

  const candidates: NavItem[] = [
    home,
    { key: 'requests', label: 'REQUESTS', view: 'commissioner-dashboard', matches: ['commissioner-dashboard'] },
    { key: 'documents', label: 'DOCUMENTS', view: 'documents', matches: ['documents'] },
    { key: 'marketplace', label: 'MARKETPLACE', view: 'marketplace', matches: ['marketplace'] },
    { key: 'verify', label: 'VERIFY', view: 'verify-portal', matches: ['verify', 'verify-portal', 'verification'] },
    { key: 'admin', label: 'ADMIN', view: 'admin', matches: ['admin'] },
  ];

  // De-duplicate (home may coincide with requests/admin destination) and keep
  // only items the role is permitted to open.
  const seen = new Set<string>();
  return candidates.filter((item) => {
    if (item.key !== 'home' && item.view === home.view) return false; // avoid duplicate of home
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return canAccessView(role, item.view).canAccess;
  });
};
