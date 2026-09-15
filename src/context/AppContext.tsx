import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserRole, 
  OperatingView,
  MasterAdminSection,
  AdminAuditEvent,
  DisputeItem,
  CommissioningRequest, 
  PaymentTransaction, 
  LegalPolicyRule, 
  NotificationItem, 
  CredentialDocument,
  CommissioningStatus,
  AuditEvent
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_REQUESTS, 
  INITIAL_LEGAL_POLICY_RULES, 
  INITIAL_CREDENTIAL_DOCS,
  INITIAL_ADMIN_AUDIT_LOGS,
  INITIAL_DISPUTES,
  INITIAL_PLATFORM_TRANSACTIONS
} from '../data/mockData';
import { 
  computeSha256, 
  generateCertificateNumber, 
  generateWalayiSecurityNumber,
  computeAuditEventHash,
  computeAuditEventHashSync,
  verifyAuditChainIntegrity
} from '../services/hashService';
import { checkCommissionerConflict } from '../utils/conflictValidation';
import { PaymentAdapter } from '../services/paymentService';
import { auth, fbSignOut, onAuthStateChanged, db } from '../services/firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, query as fsQuery, where, getDocs } from 'firebase/firestore';
import { getStoredProfilePhoto } from '../services/profilePhotoService';
import { isSuperAdminEmail, isCommissionerLike } from '../services/roleService';
import { PRESENCE_HEARTBEAT_INTERVAL_MS } from '../services/presenceService';

export type AppView = 
  | 'home'
  | 'marketplace'
  | 'new-commissioning'
  | 'room'
  | 'documents'
  | 'commissioner-dashboard'
  | 'commissioner-settings'
  | 'vault'
  | 'wallet'
  | 'admin'
  | 'pro'
  | 'verify'
  | 'verification'
  | 'verify-portal'
  | 'lawfirm'
  | 'onboarding'
  | 'auth';

interface AppContextType {
  currentUser: UserProfile;
  users: UserProfile[];
  requests: CommissioningRequest[];
  credentialDocs: Record<string, CredentialDocument[]>;
  policyRules: LegalPolicyRule[];
  transactions: PaymentTransaction[];
  notifications: NotificationItem[];
  adminAuditLogs: AdminAuditEvent[];
  disputes: DisputeItem[];
  currentView: AppView;
  operatingView: OperatingView;
  masterAdminSection: MasterAdminSection;
  activeCommissioningId: string | null;
  preselectedCommissionerId: string | null;
  platformFeePercentage: number;
  deviceMode: 'desktop' | 'mobile' | 'tablet';
  isMasterAdmin: boolean;
  isSignedIn: boolean;
  isAuthReady: boolean;
  
  // Actions
  addUser: (userData: Partial<UserProfile> & { fullName: string; email: string; role: UserRole }) => UserProfile;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  deleteUser: (userId: string) => void;
  setCurrentView: (view: AppView) => void;
  setOperatingView: (view: OperatingView) => void;
  setMasterAdminSection: (section: MasterAdminSection) => void;
  setDeviceMode: (mode: 'desktop' | 'mobile' | 'tablet') => void;
  switchUser: (userId: string) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  signOutUser: () => Promise<void>;
  signInUser: (profileUpdates?: Partial<UserProfile>) => void;
  setActiveCommissioningId: (id: string | null) => void;
  setPreselectedCommissionerId: (id: string | null) => void;
  submitCredentialDocument: (userId: string, doc: Omit<CredentialDocument, 'id' | 'uploadedAt' | 'status'>) => void;
  reviewCredentialDocument: (userId: string, docId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => void;
  createCommissioningRequest: (data: Partial<CommissioningRequest>) => Promise<CommissioningRequest>;
  updateCommissioningRequest: (id: string, updates: Partial<CommissioningRequest>, auditEvent?: Partial<AuditEvent>) => void;
  advanceCeremonyState: (id: string, nextStatus: CommissioningStatus, auditDetails?: string, extraUpdates?: Partial<CommissioningRequest>) => void;
  executePayment: (params: {
    serviceFeeUGX: number;
    provider: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'WALLET';
    phoneNumber: string;
    commissioningId?: string;
    purpose: 'COMMISSIONING_ESCROW' | 'PRO_SUBSCRIPTION' | 'PAYOUT_WITHDRAWAL';
  }) => Promise<PaymentTransaction>;
  subscribePro: (planName: 'Standard' | 'Pro Advocate' | 'Chambers Premier') => void;
  updateLegalPolicy: (rule: LegalPolicyRule) => void;
  setPlatformFee: (percentage: number) => void;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  dismissAllNotifications: () => void;
  addNotification: (title: string, message: string, type: NotificationItem['type']) => void;
  verifyDocumentByCertOrHash: (query: string) => Promise<CommissioningRequest | undefined>;
  logAdminAction: (log: Omit<AdminAuditEvent, 'id' | 'timestamp' | 'adminEmail' | 'adminName'>) => void;
  processRefund: (transactionId: string, reason: string) => Promise<boolean>;
  resolveDispute: (id: string, resolution: 'REFUND' | 'RELEASE' | 'DISMISS', note?: string) => void;
  toggleProfessionalStatus: (userId: string, action: 'SUSPEND' | 'REINSTATE' | 'APPROVE' | 'REJECT', reason?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// A blank, unauthenticated placeholder profile. Used as the pre-login state
// and again on sign-out — the app never silently starts "as" a real user.
const createGuestUser = (): UserProfile => ({
  id: 'guest-deponent',
  fullName: 'Guest User',
  email: '',
  phone: '',
  role: 'deponent',
  avatarUrl: '',
  nationalIdNumber: '',
  stationCity: 'Kampala',
  isProSubscriber: false,
  rating: 5.0,
  reviewCount: 0,
  completedCeremoniesCount: 0,
  averageResponseMinutes: 0,
  indicativeFeeUGX: 0,
  availableNow: false,
  allowsRemote: true,
  authorities: []
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  // Always start blank. If a previous Firebase session is still valid, the
  // onAuthStateChanged listener below fills in the real profile moments
  // after mount — the app never guesses or assumes an identity up front.
  const [currentUser, setCurrentUser] = useState<UserProfile>(createGuestUser);
  const [requests, setRequests] = useState<CommissioningRequest[]>(() => {
    try {
      const saved = localStorage.getItem('walayi_commissioning_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, CommissioningRequest>();
          parsed.forEach((r: CommissioningRequest) => map.set(r.id, r));
          INITIAL_REQUESTS.forEach(r => {
            if (!map.has(r.id)) map.set(r.id, r);
          });
          return Array.from(map.values());
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached commissioning requests', e);
    }
    return INITIAL_REQUESTS;
  });
  const [credentialDocs, setCredentialDocs] = useState<Record<string, CredentialDocument[]>>(INITIAL_CREDENTIAL_DOCS);
  const [policyRules, setPolicyRules] = useState<LegalPolicyRule[]>(INITIAL_LEGAL_POLICY_RULES);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [operatingView, setOperatingView] = useState<OperatingView>('USER');
  const [masterAdminSection, setMasterAdminSection] = useState<MasterAdminSection>('OVERVIEW');
  const [activeCommissioningId, setActiveCommissioningId] = useState<string | null>(() => {
    return localStorage.getItem('walayi_active_commissioning_id') || 'req-002';
  });
  const [preselectedCommissionerId, setPreselectedCommissionerId] = useState<string | null>(null);
  const [platformFeePercentage, setPlatformFeePercentage] = useState<number>(5);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [adminAuditLogs, setAdminAuditLogs] = useState<AdminAuditEvent[]>(INITIAL_ADMIN_AUDIT_LOGS);
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(INITIAL_PLATFORM_TRANSACTIONS);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  // Flips to true once Firebase has reported whether a session exists —
  // lets the UI hold off on the sign-in page for a moment instead of
  // flashing it in front of a returning, already-authenticated user.
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Persist requests to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('walayi_commissioning_requests', JSON.stringify(requests));
    } catch (e) {
      console.warn('Failed to cache commissioning requests locally', e);
    }
  }, [requests]);

  // Persist activeCommissioningId
  useEffect(() => {
    if (activeCommissioningId) {
      localStorage.setItem('walayi_active_commissioning_id', activeCommissioningId);
    }
  }, [activeCommissioningId]);

  // Real-time Firestore sync for active commissioning session (two-party room sync)
  useEffect(() => {
    if (!activeCommissioningId) return;

    try {
      const unsub = onSnapshot(doc(db, 'commissioningRequests', activeCommissioningId), (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as CommissioningRequest;
          setRequests(prev => {
            const existing = prev.find(r => r.id === activeCommissioningId);
            if (!existing) {
              // The other party opened a session this device hasn't seen yet
              // (e.g. a request the counterpart just created). Pull it in so
              // both accounts share the same live commissioning document.
              return [remoteData, ...prev];
            }
            // Merge remote state so changes by other party are reflected instantly
            const merged: CommissioningRequest = {
              ...existing,
              ...remoteData,
              auditTrail: remoteData.auditTrail || existing.auditTrail
            };
            return prev.map(r => r.id === activeCommissioningId ? merged : r);
          });
        }
      }, (err) => {
        // Silently handle offline/permission errors without disrupting ceremony
        console.warn('Firestore active room sync notice:', err?.message);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Could not attach Firestore listener', e);
    }
  }, [activeCommissioningId]);

  // ---------------------------------------------------------------------------
  // Live requests feed addressed to the signed-in party.
  // The listener above only tracks whichever single document is currently
  // "active" (i.e. already open) on this device. Without this, a commissioner
  // never learns a deponent created/ringing a new request until they happen
  // to open that exact request first — so an incoming call rings into
  // nothing. Stream every commissioningRequests doc assigned to this user
  // (by commissionerId for commissioners, by deponentUserId for deponents)
  // so both the request list and any live call state stay current everywhere
  // in the app, not just inside an already-open room.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSignedIn || !currentUser.id || currentUser.id === 'guest-deponent') return;

    const field = isCommissionerLike(currentUser.role) ? 'commissionerId' : 'deponentUserId';
    const q = fsQuery(collection(db, 'commissioningRequests'), where(field, '==', currentUser.id));

    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(q, (snap) => {
        setRequests(prev => {
          const byId = new Map<string, CommissioningRequest>(prev.map(r => [r.id, r]));
          snap.forEach((d) => {
            const remoteData = d.data() as CommissioningRequest;
            const existing = byId.get(remoteData.id);
            byId.set(remoteData.id, existing
              ? { ...existing, ...remoteData, auditTrail: remoteData.auditTrail || existing.auditTrail }
              : remoteData);
          });
          return Array.from(byId.values());
        });
      }, (err) => {
        console.warn('Firestore assigned-requests sync notice:', err?.message);
      });
    } catch (e) {
      console.warn('Could not attach assigned-requests listener', e);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [isSignedIn, currentUser.id, currentUser.role]);

  const isMasterAdmin = currentUser.role === 'master_admin' || currentUser.role === 'super_admin' || currentUser.role === 'admin' || isSuperAdminEmail(currentUser.email);

  // Load saved profile photo from localStorage or Firestore on startup
  useEffect(() => {
    const cachedPhoto = getStoredProfilePhoto(currentUser.id);
    if (cachedPhoto && !currentUser.avatarUrl) {
      setCurrentUser(prev => ({ ...prev, avatarUrl: cachedPhoto }));
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsSignedIn(true);
        localStorage.setItem('wallahi_auth_signed_in', 'true');
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const r = (data.role || '').toLowerCase();
            const em = (fbUser.email || data.email || '').toLowerCase();
            let mappedRole: UserRole = 'deponent';
            let opView: OperatingView = 'USER';

            if (r === 'admin' || r === 'master_admin' || isSuperAdminEmail(em)) {
              mappedRole = 'master_admin';
              opView = 'ADMIN';
            } else if (r === 'commissioner' || r === 'notary' || r === 'judicial_officer' || r === 'justice_of_peace') {
              mappedRole = 'commissioner';
              opView = 'COMMISSIONER';
            } else {
              mappedRole = 'deponent';
              opView = 'USER';
            }

            const photo = data.profilePhotoUrl || data.avatarUrl || fbUser.photoURL || '';
            setCurrentUser(prev => ({
              ...prev,
              id: fbUser.uid,
              fullName: data.displayName || data.fullName || fbUser.displayName || prev.fullName,
              email: fbUser.email || data.email || prev.email,
              role: mappedRole,
              avatarUrl: photo || prev.avatarUrl,
              indicativeFeeUGX: data.fee || prev.indicativeFeeUGX
            }));
            setOperatingView(opView);
          } else {
            const isAdmin = isSuperAdminEmail(fbUser.email);
            const isComm = fbUser.email?.toLowerCase().includes('commissioner');
            const mappedRole: UserRole = isAdmin ? 'master_admin' : (isComm ? 'commissioner' : 'deponent');
            const opView: OperatingView = isAdmin ? 'ADMIN' : (isComm ? 'COMMISSIONER' : 'USER');
            setCurrentUser(prev => ({
              ...prev,
              id: fbUser.uid,
              fullName: fbUser.displayName || prev.fullName,
              email: fbUser.email || prev.email,
              avatarUrl: fbUser.photoURL || prev.avatarUrl,
              role: mappedRole
            }));
            setOperatingView(opView);
          }
        } catch (err) {
          console.warn('Could not sync user photo/profile from Firestore:', err);
        }
      } else {
        // No active Firebase session (fresh visit, expired session, or just
        // signed out) — make sure the app is in a clean, unauthenticated state.
        setIsSignedIn(false);
        localStorage.setItem('wallahi_auth_signed_in', 'false');
        setCurrentUser(createGuestUser());
        setOperatingView('USER');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  // ---------------------------------------------------------------------------
  // Live commissioner directory.
  // Any account registered with a commissioner-like role is surfaced on the
  // marketplace and made selectable in the commissioning workflow the moment
  // it is created — no separate verification/approval step. We stream the
  // `users` collection and merge those professionals into local state.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSignedIn) return;

    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(collection(db, 'users'), (snap) => {
        const commissioners: UserProfile[] = [];

        snap.forEach((d) => {
          const data: any = d.data() || {};
          const role = (data.role || '').toLowerCase();
          const email = (data.email || '').toLowerCase();
          const isCommissionerLike =
            ['commissioner', 'notary', 'judicial_officer', 'justice_of_peace'].includes(role) ||
            data.professionalCategory === 'commissioner_for_oaths' ||
            email.includes('commissioner');

          if (!isCommissionerLike) return;

          const mappedRole: UserRole = (['commissioner', 'notary', 'judicial_officer', 'justice_of_peace'].includes(role)
            ? role
            : 'commissioner') as UserRole;

          const fullName =
            data.fullName || data.displayName || (email ? email.split('@')[0] : 'Commissioner');

          commissioners.push({
            id: data.id || d.id,
            fullName,
            email: data.email || '',
            phone: data.phone || data.phoneNumber || '+256 700 000 000',
            role: mappedRole,
            avatarUrl: data.avatarUrl || data.profilePhotoUrl || '',
            nationalIdNumber: data.nationalIdNumber || undefined,
            stationCity: data.location || data.stationCity || 'Kampala',
            lawFirmName: data.lawFirmName || data.firmName || 'Independent Chambers',
            firmName: data.firmName || null,
            professionalCategory: 'commissioner_for_oaths',
            authorities: [
              {
                type: 'commissioner_for_oaths',
                status: 'VERIFIED',
                basis: 'COMMISSIONER_ACT_CAP_5',
                verifiedAt: new Date().toISOString(),
              },
            ],
            isProSubscriber: !!data.isProSubscriber,
            rating: typeof data.rating === 'number' ? data.rating : 5.0,
            reviewCount: data.reviewCount || 0,
            completedCeremoniesCount: data.completedCeremoniesCount || 0,
            averageResponseMinutes: data.averageResponseMinutes || 5,
            indicativeFeeUGX: typeof data.fee === 'number' ? data.fee : (data.indicativeFeeUGX || 25000),
            availableNow: data.availableNow !== undefined ? !!data.availableNow : true,
            allowsRemote: data.allowsRemote !== undefined ? !!data.allowsRemote : true,
            lastActiveAt: data.lastActiveAt || undefined,
          });
        });

        if (commissioners.length === 0) return;

        setUsers((prev) => {
          const byId = new Map<string, UserProfile>(
            prev.map((u) => [u.id, u] as [string, UserProfile])
          );
          const emailToId = new Map<string, string>(
            prev.map((u) => [(u.email || '').toLowerCase(), u.id] as [string, string])
          );

          commissioners.forEach((fc) => {
            const emailLc = (fc.email || '').toLowerCase();
            const existingIdByEmail = emailLc ? emailToId.get(emailLc) : undefined;
            // A profile with this email already exists (e.g. a seeded pro) —
            // don't create a duplicate card for the same person.
            if (existingIdByEmail && existingIdByEmail !== fc.id) return;

            const existing = byId.get(fc.id);
            // Start from any richer local-only profile fields already on
            // record, but let this fresh snapshot win on every field it
            // actually carries (fc last) — otherwise a live field like
            // lastActiveAt/availableNow would freeze at whatever value it
            // had the first time this listener ever saw that user.
            byId.set(fc.id, existing ? { ...existing, ...fc } : fc);
          });

          return Array.from(byId.values());
        });
      });
    } catch (e) {
      console.warn('Could not attach users directory listener', e);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [isSignedIn]);

  // ---------------------------------------------------------------------------
  // Presence heartbeat.
  // Firestore has no server-side "disconnect" hook (unlike Realtime Database's
  // onDisconnect), so live "who's online" is approximated: while a signed-in
  // user's tab is open and visible, keep refreshing their own lastActiveAt on
  // their users/{id} doc. Anyone reading that doc treats it as online while
  // the timestamp is recent (see isUserOnline) and stale once it isn't —
  // this is what lets the marketplace show real online/offline commissioners.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSignedIn || !currentUser.id || currentUser.id === 'guest-deponent') return;

    const beat = () => {
      if (document.visibilityState !== 'visible') return;
      setDoc(doc(db, 'users', currentUser.id), { lastActiveAt: new Date().toISOString() }, { merge: true })
        .catch((err) => console.warn('Presence heartbeat notice:', err?.message));
    };

    beat();
    const interval = setInterval(beat, PRESENCE_HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', beat);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', beat);
    };
  }, [isSignedIn, currentUser.id]);

  const signOutUser = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign out notice:', err);
    }
    setIsSignedIn(false);
    localStorage.setItem('wallahi_auth_signed_in', 'false');

    setCurrentUser(createGuestUser());
    setActiveCommissioningId(null);
    setPreselectedCommissionerId(undefined);
    setOperatingView('USER');
    setCurrentView('home');
  };

  const signInUser = (profileUpdates?: Partial<UserProfile>) => {
    setIsSignedIn(true);
    localStorage.setItem('wallahi_auth_signed_in', 'true');
    if (profileUpdates) {
      const em = (profileUpdates.email || '').toLowerCase();
      // Designated super-admin emails are always elevated to the apex tier,
      // regardless of the role supplied by the sign-in form / Firestore doc.
      const elevated: Partial<UserProfile> = isSuperAdminEmail(em)
        ? { ...profileUpdates, role: 'master_admin' }
        : profileUpdates;
      updateCurrentUser(elevated);
      const r = (elevated.role || '').toLowerCase();
      if (r === 'admin' || r === 'master_admin' || isSuperAdminEmail(em)) {
        setOperatingView('ADMIN');
        setCurrentView('admin');
      } else if (r === 'commissioner' || r === 'notary' || r === 'judicial_officer' || r === 'justice_of_peace') {
        setOperatingView('COMMISSIONER');
        setCurrentView('commissioner-dashboard');
      } else {
        setOperatingView('USER');
        setCurrentView('home');
      }
    }
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      userId: 'user-client-1',
      title: 'Affidavit Successfully Commissioned',
      message: 'Certificate WAL-UG-2026-8849 is minted and ready for ECCMIS court filing.',
      type: 'VERIFICATION',
      timestamp: '2026-08-30T10:28:00Z',
      read: false
    },
    {
      id: 'notif-2',
      userId: 'cfo-1',
      title: 'New Commissioning Request Received',
      message: 'Grace Akello submitted a Statutory Declaration for review.',
      type: 'CEREMONY',
      timestamp: '2026-08-31T08:00:00Z',
      read: false
    }
  ]);

  const logAdminAction = (log: Omit<AdminAuditEvent, 'id' | 'timestamp' | 'adminEmail' | 'adminName'>) => {
    const newLog: AdminAuditEvent = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminEmail: currentUser.email,
      adminName: currentUser.fullName,
      timestamp: new Date().toISOString(),
      ...log
    };
    setAdminAuditLogs(prev => [newLog, ...prev]);
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      if (target.role === 'master_admin' || target.role === 'super_admin' || target.role === 'admin' || isSuperAdminEmail(target.email)) {
        setOperatingView('ADMIN');
        setCurrentView('admin');
      } else if (target.role === 'commissioner' || target.role === 'notary' || target.role === 'judicial_officer' || target.role === 'justice_of_peace') {
        setOperatingView('COMMISSIONER');
        setCurrentView('commissioner-dashboard');
      } else {
        setOperatingView('USER');
        setCurrentView('home');
      }
    }
  };

  const addUser = (userData: Partial<UserProfile> & { fullName: string; email: string; role: UserRole }): UserProfile => {
    const newId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const isLegalPro = ['commissioner', 'advocate', 'notary', 'judicial_officer', 'justice_of_peace'].includes(userData.role);
    
    const newUser: UserProfile = {
      id: newId,
      fullName: userData.fullName,
      email: userData.email,
      phone: userData.phone || '+256 700 000 000',
      role: userData.role,
      avatarUrl: userData.avatarUrl || '',
      nationalIdNumber: userData.nationalIdNumber || `CM${Math.floor(10000000 + Math.random() * 90000000)}112A`,
      stationCity: userData.stationCity || 'Kampala',
      lawFirmName: userData.lawFirmName || (isLegalPro ? 'Independent Chambers' : undefined),
      firmName: userData.firmName || null,
      enrollmentNumber: userData.enrollmentNumber || (isLegalPro ? `UG/ENR/${Math.floor(1000 + Math.random() * 9000)}/2026` : undefined),
      isProSubscriber: userData.isProSubscriber || false,
      rating: 5.0,
      reviewCount: 0,
      completedCeremoniesCount: 0,
      averageResponseMinutes: isLegalPro ? 5 : 0,
      indicativeFeeUGX: isLegalPro ? 10000 : 0,
      availableNow: true,
      allowsRemote: true,
      authorities: userData.authorities || (isLegalPro ? [
        {
          type: userData.role === 'commissioner' ? 'commissioner_for_oaths' : (userData.role === 'notary' ? 'notary_public' : (userData.role === 'judicial_officer' ? 'judicial_officer' : 'advocate')),
          status: 'VERIFIED',
          basis: 'COMMISSIONER_ACT_CAP_5',
          yearOfAdmission: 2024,
          practisingCertificateYear: 2026,
          verifiedAt: new Date().toISOString(),
          licenceNumber: `LIC-UG-${Math.floor(10000 + Math.random() * 90000)}`
        }
      ] : []),
      ...userData
    };

    setUsers(prev => [newUser, ...prev]);

    logAdminAction({
      action: 'USER_CREATED',
      targetType: 'USER',
      targetId: newId,
      targetName: newUser.fullName,
      newStatus: newUser.role,
      reason: `Super Admin added new user profile with role ${newUser.role.toUpperCase()}`
    });

    addNotification(
      'User Account Created',
      `${newUser.fullName} has been registered with role ${newUser.role.toUpperCase()}.`,
      'SYSTEM'
    );

    return newUser;
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    // Client-side guard for a fast, clear failure — the real enforcement is
    // in firestore.rules (only an admin-authored write may change `role`),
    // since a UI-level check alone can always be bypassed.
    if (!isMasterAdmin) {
      console.warn('updateUserRole: blocked — only an admin may change a user\'s role.');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const oldRole = targetUser.role;
    const isLegalPro = ['commissioner', 'advocate', 'notary', 'judicial_officer', 'justice_of_peace'].includes(newRole);
    let nextAuthorities = targetUser.authorities || [];

    if (isLegalPro && nextAuthorities.length === 0) {
      nextAuthorities = [
        {
          type: newRole === 'commissioner' ? 'commissioner_for_oaths' : (newRole === 'notary' ? 'notary_public' : 'advocate'),
          status: 'VERIFIED',
          basis: 'COMMISSIONER_ACT_CAP_5',
          yearOfAdmission: 2024,
          practisingCertificateYear: 2026,
          verifiedAt: new Date().toISOString(),
          licenceNumber: `LIC-UG-${Math.floor(10000 + Math.random() * 90000)}`
        }
      ];
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, authorities: nextAuthorities } : u));

    // If updating currently logged in user
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, role: newRole }));
    }

    // Persist to Firestore — otherwise the live users-directory listener
    // simply re-syncs the old role back in on its next snapshot, silently
    // discarding the change the moment this admin's session refreshes.
    // Firestore stores the collapsed admin-tier value as 'admin' and the
    // plain client role as 'user' (matching how sign-up and the auth-state
    // listener already read/write this field) rather than the UI's more
    // granular UserRole distinctions.
    const firestoreRole =
      newRole === 'master_admin' || newRole === 'super_admin' || newRole === 'admin' ? 'admin' :
      newRole === 'deponent' ? 'user' :
      newRole;
    setDoc(doc(db, 'users', userId), {
      role: firestoreRole,
      authorities: nextAuthorities,
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(err => {
      console.warn('Firestore role update notice:', err?.message);
    });

    logAdminAction({
      action: 'USER_ROLE_ASSIGNED',
      targetType: 'USER',
      targetId: userId,
      targetName: targetUser.fullName,
      previousStatus: oldRole,
      newStatus: newRole,
      reason: `Super Admin assigned new role to ${targetUser.fullName}: ${newRole.toUpperCase()}`
    });

    addNotification(
      'User Role Updated',
      `${targetUser.fullName}'s role was changed from ${oldRole.toUpperCase()} to ${newRole.toUpperCase()}.`,
      'SYSTEM'
    );
  };

  const deleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('Security Protection: You cannot delete the currently active administrator account.');
      return;
    }
    const target = users.find(u => u.id === userId);
    if (!target) return;

    setUsers(prev => prev.filter(u => u.id !== userId));

    // Delete the Firestore record too — otherwise the live commissioner
    // directory listener (which streams the whole users collection) would
    // simply pull the "deleted" account straight back into local state on
    // its next snapshot.
    deleteDoc(doc(db, 'users', userId)).catch(err => {
      console.warn('Firestore user delete notice:', err?.message);
    });

    logAdminAction({
      action: 'USER_DELETED',
      targetType: 'USER',
      targetId: userId,
      targetName: target.fullName,
      reason: `Super Admin removed user account from platform.`
    });

    addNotification(
      'User Removed',
      `${target.fullName} (${target.email}) was removed from the platform.`,
      'SYSTEM'
    );
  };

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      setUsers(all => all.map(u => u.id === prev.id ? updated : u));
      return updated;
    });
  };

  const submitCredentialDocument = (userId: string, doc: Omit<CredentialDocument, 'id' | 'uploadedAt' | 'status'>) => {
    const newDoc: CredentialDocument = {
      ...doc,
      id: `cred-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      status: 'PENDING'
    };

    setCredentialDocs(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), newDoc]
    }));

    // Update user authority status to DOCUMENTS_SUBMITTED / UNDER_REVIEW
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          authorities: u.authorities.map(a => ({
            ...a,
            status: 'UNDER_REVIEW' as const
          }))
        };
      }
      return u;
    }));

    addNotification(
      'Credentials Submitted for Review',
      `Document "${doc.name}" has been queued for Super Admin review.`,
      'CREDENTIAL'
    );
  };

  const reviewCredentialDocument = (userId: string, docId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    let targetDocName = 'Credential';
    setCredentialDocs(prev => {
      const userDocs = prev[userId] || [];
      const updated = userDocs.map(d => {
        if (d.id === docId) {
          targetDocName = d.name;
          return { ...d, status, rejectionReason: reason };
        }
        return d;
      });
      return { ...prev, [userId]: updated };
    });

    const userObj = users.find(u => u.id === userId);

    // If verified, update the user's authority to VERIFIED
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          authorities: u.authorities.map(a => ({
            ...a,
            status: status === 'VERIFIED' ? ('VERIFIED' as const) : ('REJECTED' as const),
            verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : undefined
          }))
        };
      }
      return u;
    }));

    logAdminAction({
      action: status === 'VERIFIED' ? 'CREDENTIAL_APPROVED' : 'CREDENTIAL_REJECTED',
      targetType: 'CREDENTIAL',
      targetId: docId,
      targetName: `${userObj?.fullName || 'User'} - ${targetDocName}`,
      previousStatus: 'UNDER_REVIEW',
      newStatus: status,
      reason: reason || (status === 'VERIFIED' ? 'Approved following statutory credential validation' : 'Failed verification criteria')
    });

    addNotification(
      `Credential ${status === 'VERIFIED' ? 'Approved' : 'Rejected'}`,
      `Credential review for ${userObj?.fullName || 'professional'} completed. Status: ${status}.`,
      'CREDENTIAL'
    );
  };

  const toggleProfessionalStatus = (userId: string, action: 'SUSPEND' | 'REINSTATE' | 'APPROVE' | 'REJECT', reason?: string) => {
    const userObj = users.find(u => u.id === userId);
    let newStatus: any = 'VERIFIED';
    if (action === 'SUSPEND') newStatus = 'MARKETPLACE_SUSPENDED';
    if (action === 'REJECT') newStatus = 'REJECTED';
    if (action === 'REINSTATE' || action === 'APPROVE') newStatus = 'VERIFIED';

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          authorities: u.authorities.map(a => ({
            ...a,
            status: newStatus
          }))
        };
      }
      return u;
    }));

    logAdminAction({
      action: `PROFESSIONAL_${action}`,
      targetType: 'USER',
      targetId: userId,
      targetName: userObj?.fullName || 'Professional',
      previousStatus: userObj?.authorities[0]?.status,
      newStatus,
      reason: reason || `Admin action: ${action} executed.`
    });

    addNotification(
      `Professional Status Changed`,
      `${userObj?.fullName || 'Professional'} status updated to ${newStatus}.`,
      'SYSTEM'
    );
  };

  const processRefund = async (transactionId: string, reason: string): Promise<boolean> => {
    const txn = transactions.find(t => t.id === transactionId);
    if (!txn) return false;

    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        return {
          ...t,
          status: 'REFUNDED'
        };
      }
      return t;
    }));

    if (txn.commissioningId) {
      setRequests(prev => prev.map(r => {
        if (r.id === txn.commissioningId) {
          return {
            ...r,
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED'
          };
        }
        return r;
      }));
    }

    logAdminAction({
      action: 'PAYMENT_REFUNDED',
      targetType: 'TRANSACTION',
      targetId: transactionId,
      targetName: `Txn Ref: ${txn.transactionRef} (UGX ${txn.amountUGX.toLocaleString()})`,
      previousStatus: txn.status,
      newStatus: 'REFUNDED',
      reason
    });

    addNotification(
      'Refund Processed',
      `UGX ${txn.amountUGX.toLocaleString()} refunded for ${txn.userName}. Ref: ${txn.transactionRef}.`,
      'PAYMENT'
    );

    return true;
  };

  const resolveDispute = (id: string, resolution: 'REFUND' | 'RELEASE' | 'DISMISS', note?: string) => {
    const dispute = disputes.find(d => d.id === id);
    if (!dispute) return;

    let nextStatus: any = 'DISMISSED';
    if (resolution === 'REFUND') {
      nextStatus = 'RESOLVED_REFUNDED';
      if (dispute.transactionId) {
        processRefund(dispute.transactionId, note || 'Dispute resolved in favor of deponent');
      }
    } else if (resolution === 'RELEASE') {
      nextStatus = 'RESOLVED_RELEASED';
    }

    setDisputes(prev => prev.map(d => d.id === id ? {
      ...d,
      status: nextStatus,
      resolvedAt: new Date().toISOString(),
      resolutionNote: note
    } : d));

    logAdminAction({
      action: `DISPUTE_${resolution}`,
      targetType: 'TRANSACTION',
      targetId: id,
      targetName: `Dispute ${id} - ${dispute.deponentName}`,
      previousStatus: dispute.status,
      newStatus: nextStatus,
      reason: note || `Dispute ${resolution} by Master Admin`
    });

    addNotification(
      'Dispute Resolved',
      `Dispute ${id} marked as ${nextStatus}.`,
      'SYSTEM'
    );
  };

  const createCommissioningRequest = async (data: Partial<CommissioningRequest>): Promise<CommissioningRequest> => {
    // 1. Role-Based Conflict Check Enforcement (Immutable Critical Path Step 4)
    if (data.assignedProfessionalId) {
      const commissioner = users.find(u => u.id === data.assignedProfessionalId);
      if (commissioner) {
        const conflict = checkCommissionerConflict({
          currentUser,
          commissioner,
          deponentSelectionType: data.deponentSelectionType || 'self',
          uploaderFirm: data.uploaderFirm !== undefined ? data.uploaderFirm : (currentUser.firmName || currentUser.lawFirmName || null),
          isJudicialMatterHandling: !!data.isJudicialConflict
        });

        if (conflict.hasConflict) {
          throw new Error(`Conflict Check Violation [${conflict.ruleViolated}]: ${conflict.reason} ${conflict.advice || ''}`);
        }
      }
    }

    const certNumber = generateCertificateNumber();
    const securityNumber = generateWalayiSecurityNumber();
    const hash = data.documentSha256 || await computeSha256(data.fileName || 'Affidavit.pdf');
    
    // Flat WALAYI platform fee (calculateFees defaults to WALAYI_PLATFORM_FEE_UGX).
    const feeInfo = PaymentAdapter.calculateFees(data.serviceFeeUGX || 25000);

    const initialAudit: AuditEvent = {
      id: `aud-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      eventType: 'DOCUMENT_UPLOADED',
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ipAddress: '197.239.4.88 (Kampala)',
      deviceFingerprint: 'CLIENT-DEVICE-NODE',
      details: `Document "${data.fileName || 'Affidavit'}" uploaded. Integrity SHA-256 computed.`
    };

    const hashAudit: AuditEvent = {
      id: `aud-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      eventType: 'SHA256_HASH_GENERATED',
      actorName: 'WALAYI Crypto Kernel',
      actorRole: 'Security Engine',
      ipAddress: '10.0.4.1',
      deviceFingerprint: 'WALAYI-CRYPTO-NODE',
      details: `SHA-256 Digest: ${hash}`
    };

    const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const initHash = computeAuditEventHashSync(genesisHash, initialAudit);
    initialAudit.prevEventHash = genesisHash;
    initialAudit.eventHash = initHash;

    const hAuditHash = computeAuditEventHashSync(initHash, hashAudit);
    hashAudit.prevEventHash = initHash;
    hashAudit.eventHash = hAuditHash;

    const effectivePaymentStatus = data.paymentStatus || 'ESCROWED';

    const newReq: CommissioningRequest = {
      id: `req-${Date.now()}`,
      certificateNumber: certNumber,
      securityNumber: securityNumber,
      documentTitle: data.documentTitle || 'Sworn Affidavit of Truth',
      documentType: data.documentType || 'affidavit_general',
      deponentName: data.deponentName || currentUser.fullName,
      deponentNin: data.deponentNin || currentUser.nationalIdNumber || 'CM92018104LK7A',
      deponentPhone: data.deponentPhone || currentUser.phone,
      deponentEmail: data.deponentEmail || currentUser.email,
      deponentUserId: currentUser.id,
      uploaderId: currentUser.id,
      deponentId: data.deponentSelectionType === 'self' ? currentUser.id : null,
      commissionerId: data.assignedProfessionalId,
      uploaderFirm: data.uploaderFirm !== undefined ? data.uploaderFirm : (currentUser.firmName || currentUser.lawFirmName || null),
      commissionerFirm: data.commissionerFirm || null,
      isJudicialConflict: !!data.isJudicialConflict,
      judicialConflictDetails: data.judicialConflictDetails || null,
      deponentSelectionType: data.deponentSelectionType || 'self',
      assignedProfessionalId: data.assignedProfessionalId,
      assignedProfessionalName: data.assignedProfessionalName,
      assignedProfessionalAuthority: data.assignedProfessionalAuthority,
      assignedProfessionalStation: data.assignedProfessionalStation,
      commissionerNin: (data.assignedProfessionalId && users.find(u => u.id === data.assignedProfessionalId)?.nationalIdNumber) || undefined,
      status: effectivePaymentStatus === 'ESCROWED' ? 'PAID' : 'PAYMENT_PENDING',
      validityStatus: 'VALID',
      createdAt: new Date().toISOString(),
      fileName: data.fileName || 'Sworn_Affidavit.pdf',
      fileSizeKb: data.fileSizeKb || 295,
      documentSha256: hash,
      isDocumentLocked: false,
      solemnisationType: data.solemnisationType || 'holy_bible',
      statutoryWordingUsed: data.statutoryWordingUsed || "I swear by Almighty God that the contents of this affidavit are true to the best of my knowledge, information, and belief, so help me God.",
      ceremonyLanguage: data.ceremonyLanguage || 'English',
      serviceFeeUGX: feeInfo.serviceFeeUGX,
      platformFeeUGX: feeInfo.platformFeeUGX,
      totalAmountUGX: feeInfo.totalAmountUGX,
      paymentMethod: data.paymentMethod || 'MTN_MOMO',
      paymentReference: data.paymentReference || `MTN-UG-${Math.floor(10000000 + Math.random() * 90000000)}`,
      paymentStatus: effectivePaymentStatus,
      dailySessionId: `daily-sess-ug-${Math.floor(10000 + Math.random() * 90000)}`,
      auditChainHash: hAuditHash,
      auditTrail: [initialAudit, hashAudit]
    };

    setRequests(prev => [newReq, ...prev]);
    setActiveCommissioningId(newReq.id);

    // Mirror to Firestore for cross-device real-time sync
    try {
      setDoc(doc(db, 'commissioningRequests', newReq.id), newReq, { merge: true }).catch(err => {
        console.warn('Firestore request creation notice:', err?.message);
      });
    } catch (e) {
      // Ignored non-blocking
    }

    addNotification(
      'New Commissioning Request Initialised',
      `Affidavit ${certNumber} created and escrow payment ${effectivePaymentStatus === 'ESCROWED' ? 'completed' : 'pending'}.`,
      'CEREMONY'
    );

    return newReq;
  };

  const updateCommissioningRequest = (id: string, updates: Partial<CommissioningRequest>, auditEvent?: Partial<AuditEvent>) => {
    let updatedReq: CommissioningRequest | null = null;
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        const newAuditTrail = [...req.auditTrail];
        let cumulativeHash = req.auditChainHash || (newAuditTrail.length > 0 && newAuditTrail[newAuditTrail.length - 1].eventHash) || '0000000000000000000000000000000000000000000000000000000000000000';
        
        if (auditEvent && auditEvent.eventType) {
          const evId = `aud-${Date.now()}`;
          const evTimestamp = new Date().toISOString();
          const evType = auditEvent.eventType;
          const evActorName = auditEvent.actorName || currentUser.fullName;
          const evActorRole = auditEvent.actorRole || currentUser.role;
          const evDetails = auditEvent.details || 'Workflow state updated.';
          
          const evHash = computeAuditEventHashSync(cumulativeHash, {
            id: evId,
            timestamp: evTimestamp,
            eventType: evType,
            actorName: evActorName,
            actorRole: evActorRole,
            details: evDetails
          });

          const chainedEvent: AuditEvent = {
            id: evId,
            timestamp: evTimestamp,
            eventType: evType,
            actorName: evActorName,
            actorRole: evActorRole,
            ipAddress: auditEvent.ipAddress || '197.239.4.12',
            deviceFingerprint: 'BROWSER-SECURE-NODE',
            details: evDetails,
            prevEventHash: cumulativeHash,
            eventHash: evHash,
            ...auditEvent
          };
          newAuditTrail.push(chainedEvent);
          cumulativeHash = evHash;
        }

        updatedReq = {
          ...req,
          ...updates,
          auditChainHash: cumulativeHash,
          auditTrail: newAuditTrail
        };
        return updatedReq;
      }
      return req;
    }));

    // Mirror to Firestore for live ceremony sync
    if (updatedReq) {
      try {
        setDoc(doc(db, 'commissioningRequests', id), updatedReq, { merge: true }).catch(err => {
          console.warn('Firestore request update sync notice:', err?.message);
        });
      } catch (e) {
        // Ignored non-blocking
      }
    }
  };

  const advanceCeremonyState = (
    id: string, 
    nextStatus: CommissioningStatus, 
    auditDetails?: string, 
    extraUpdates?: Partial<CommissioningRequest>
  ) => {
    const req = requests.find(r => r.id === id);
    if (!req) {
      console.error(`[WALAYI State Guard] Request not found: ${id}`);
      return;
    }

    // Critical Path Hard Prerequisite: Review & Pay (Escrowed Funds Gate)
    // Cannot proceed to ceremony room, document lock, oath, signing, commissioning, or completion without escrow
    const effectivePaymentStatus = extraUpdates?.paymentStatus || req.paymentStatus;
    const isEscrowConfirmed = effectivePaymentStatus === 'ESCROWED' || effectivePaymentStatus === 'RELEASED';

    const requiresEscrowStatuses: CommissioningStatus[] = [
      'CEREMONY_ACTIVE',
      'DOCUMENT_LOCKED',
      'OATH_ADMINISTERED',
      'SIGNING',
      'COMMISSIONED',
      'COMPLETED'
    ];

    if (requiresEscrowStatuses.includes(nextStatus) && !isEscrowConfirmed) {
      throw new Error(`Critical Path Violation: Cannot transition to ${nextStatus}. Escrowed payment is mandatory under Cap. 5 & Advocates Act.`);
    }

    // Critical Path Sequential Transition Validation
    // Defines allowed predecessor statuses for each state in the pipeline
    const ALLOWED_PREDECESSORS: Record<CommissioningStatus, CommissioningStatus[]> = {
      'DRAFT': [],
      'SUBMITTED': ['DRAFT'],
      'PAYMENT_PENDING': ['DRAFT', 'SUBMITTED'],
      'PAID': ['DRAFT', 'SUBMITTED', 'PAYMENT_PENDING', 'PAID'],
      'PROFESSIONAL_SELECTED': ['DRAFT', 'SUBMITTED', 'PAID'],
      'ACCEPTED': ['SUBMITTED', 'PAID', 'PROFESSIONAL_SELECTED', 'ACCEPTED'],
      'DOCUMENT_REVIEW': ['PAID', 'ACCEPTED', 'SUBMITTED', 'DOCUMENT_REVIEW'],
      'ANNEXURES_REVIEW': ['DOCUMENT_REVIEW', 'PAID', 'ACCEPTED', 'ANNEXURES_REVIEW'],
      'DOCUMENT_LOCKED': ['DOCUMENT_REVIEW', 'ANNEXURES_REVIEW', 'PAID', 'ACCEPTED', 'CEREMONY_ACTIVE', 'DOCUMENT_LOCKED'],
      'CEREMONY_SCHEDULED': ['PAID', 'ACCEPTED', 'DOCUMENT_REVIEW'],
      'CEREMONY_ACTIVE': ['PAID', 'ACCEPTED', 'DOCUMENT_REVIEW', 'ANNEXURES_REVIEW', 'CEREMONY_SCHEDULED', 'DOCUMENT_LOCKED', 'CEREMONY_ACTIVE'],
      'OATH_ADMINISTERED': ['CEREMONY_ACTIVE', 'DOCUMENT_LOCKED', 'OATH_ADMINISTERED'],
      'SIGNING': ['OATH_ADMINISTERED', 'SIGNING'],
      'COMMISSIONED': ['SIGNING', 'COMMISSIONED'],
      'VERIFIED': ['COMMISSIONED', 'VERIFIED'],
      'DELIVERED': ['COMMISSIONED', 'VERIFIED', 'COMPLETED', 'DELIVERED'],
      'COMPLETED': ['COMMISSIONED', 'VERIFIED', 'COMPLETED'],
      'REJECTED': ['SUBMITTED', 'PAID', 'DOCUMENT_REVIEW', 'CEREMONY_ACTIVE'],
      'CANCELLED': ['DRAFT', 'SUBMITTED', 'PAYMENT_PENDING', 'PAID', 'ACCEPTED'],
      'INTERRUPTED': ['CEREMONY_ACTIVE', 'DOCUMENT_LOCKED', 'OATH_ADMINISTERED', 'SIGNING'],
      'DISPUTED': ['PAID', 'ACCEPTED', 'COMMISSIONED', 'COMPLETED']
    };

    const allowed = ALLOWED_PREDECESSORS[nextStatus];
    if (allowed && !allowed.includes(req.status)) {
      console.warn(`[WALAYI State Guard] Out-of-order ceremony transition: attempting ${req.status} -> ${nextStatus}.`);
    }

    // Atomic Security Number and Final State Finalisation
    let secNumber = req.securityNumber || extraUpdates?.securityNumber;
    if (!secNumber && (nextStatus === 'COMMISSIONED' || nextStatus === 'COMPLETED')) {
      secNumber = generateWalayiSecurityNumber();
    }

    // Atomic Final Document Digest computation if finalizing
    let finalHash = req.finalDocumentSha256 || extraUpdates?.finalDocumentSha256;
    if (!finalHash && (nextStatus === 'COMMISSIONED' || nextStatus === 'COMPLETED')) {
      finalHash = computeAuditEventHashSync(req.documentSha256, {
        id: `fin-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: 'DOCUMENT_COMMISSIONED',
        actorName: req.assignedProfessionalName || currentUser.fullName,
        actorRole: 'commissioner',
        details: req.documentTitle
      });
    }

    const enrichedUpdates: Partial<CommissioningRequest> = {
      status: nextStatus,
      ...(secNumber ? { securityNumber: secNumber } : {}),
      ...(finalHash ? { finalDocumentSha256: finalHash } : {}),
      ...(nextStatus === 'COMMISSIONED' || nextStatus === 'COMPLETED' ? { validityStatus: 'VALID' as const } : {}),
      ...(nextStatus === 'COMPLETED' ? { paymentStatus: 'RELEASED' as const, completedAt: new Date().toISOString() } : {}),
      ...extraUpdates
    };

    const auditType: AuditEvent['eventType'] = 
      nextStatus === 'DOCUMENT_LOCKED' ? 'DOCUMENT_LOCKED' :
      nextStatus === 'OATH_ADMINISTERED' ? 'OATH_ADMINISTERED' :
      nextStatus === 'SIGNING' ? 'DEPONENT_SIGNED' :
      nextStatus === 'COMMISSIONED' ? 'COMMISSIONER_SIGNED' :
      nextStatus === 'VERIFIED' ? 'VERIFICATION_QR_MINTED' :
      nextStatus === 'COMPLETED' ? 'FUNDS_SETTLED' : 'VIDEO_SESSION_INITIATED';

    updateCommissioningRequest(id, enrichedUpdates, {
      eventType: auditType,
      details: auditDetails || `Ceremony status advanced to ${nextStatus}.`
    });
  };

  const executePayment = async (params: {
    serviceFeeUGX: number;
    provider: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'WALLET';
    phoneNumber: string;
    commissioningId?: string;
    purpose: 'COMMISSIONING_ESCROW' | 'PRO_SUBSCRIPTION' | 'PAYOUT_WITHDRAWAL';
  }): Promise<PaymentTransaction> => {
    const txn = await PaymentAdapter.initiateMomoPayment({
      userId: currentUser.id,
      userName: currentUser.fullName,
      phoneNumber: params.phoneNumber,
      provider: params.provider,
      serviceFeeUGX: params.serviceFeeUGX,
      platformFeePercentage: platformFeePercentage,
      commissioningId: params.commissioningId,
      purpose: params.purpose
    });

    setTransactions(prev => [txn, ...prev]);
    return txn;
  };

  const subscribePro = (planName: 'Standard' | 'Pro Advocate' | 'Chambers Premier') => {
    updateCurrentUser({
      isProSubscriber: true,
      proPlanName: planName,
      proExpiresAt: '2027-08-31'
    });
    addNotification(
      'WALAYI PRO Activated',
      `Your subscription to ${planName} is active. Enhanced marketplace visibility enabled.`,
      'PAYMENT'
    );
  };

  const updateLegalPolicy = (rule: LegalPolicyRule) => {
    const prevRule = policyRules.find(r => r.id === rule.id);
    setPolicyRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    
    logAdminAction({
      action: 'LEGAL_POLICY_UPDATED',
      targetType: 'POLICY',
      targetId: rule.id,
      targetName: rule.authorityTitle,
      previousStatus: prevRule?.statutoryBasis,
      newStatus: rule.statutoryBasis,
      reason: `Statutory policy updated by Master Admin`
    });

    addNotification(
      'Legal Policy Matrix Updated',
      `Policy for ${rule.authorityTitle} updated by Master Administrator.`,
      'SYSTEM'
    );
  };

  const setPlatformFee = (percentage: number) => {
    const prev = platformFeePercentage;
    setPlatformFeePercentage(percentage);

    logAdminAction({
      action: 'PLATFORM_FEE_UPDATED',
      targetType: 'FEE',
      targetId: 'config-fee',
      targetName: 'Platform Commission Fee Rate',
      previousStatus: `${prev}%`,
      newStatus: `${percentage}%`,
      reason: 'Transaction fee rate adjusted by Master Admin'
    });

    addNotification(
      'Platform Fee Rate Updated',
      `WALAYI transaction commission fee set to ${percentage}%.`,
      'SYSTEM'
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (title: string, message: string, type: NotificationItem['type']) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const verifyDocumentByCertOrHash = async (query: string): Promise<CommissioningRequest | undefined> => {
    const clean = query.trim();
    if (!clean) return undefined;
    const cleanLower = clean.toLowerCase();
    const cleanUpper = clean.toUpperCase();

    // 1. Check local state first
    const localMatch = requests.find(r => 
      (r.securityNumber && r.securityNumber.toLowerCase() === cleanLower) ||
      r.certificateNumber.toLowerCase() === cleanLower || 
      (r.documentSha256 && r.documentSha256.toLowerCase() === cleanLower) || 
      (r.finalDocumentSha256 && r.finalDocumentSha256.toLowerCase() === cleanLower) ||
      r.id.toLowerCase() === cleanLower
    );
    if (localMatch) {
      return localMatch;
    }

    // 2. Query Firestore system-of-record
    try {
      // Direct doc ID check
      const docRef = doc(db, 'commissioningRequests', clean);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as CommissioningRequest;
        setRequests(prev => prev.some(r => r.id === data.id) ? prev : [data, ...prev]);
        return data;
      }

      const reqCol = collection(db, 'commissioningRequests');

      // Check securityNumber
      const qSec = fsQuery(reqCol, where('securityNumber', '==', cleanUpper));
      const snapSec = await getDocs(qSec);
      if (!snapSec.empty) {
        const data = snapSec.docs[0].data() as CommissioningRequest;
        setRequests(prev => prev.some(r => r.id === data.id) ? prev : [data, ...prev]);
        return data;
      }

      // Check certificateNumber
      const qCert = fsQuery(reqCol, where('certificateNumber', '==', cleanUpper));
      const snapCert = await getDocs(qCert);
      if (!snapCert.empty) {
        const data = snapCert.docs[0].data() as CommissioningRequest;
        setRequests(prev => prev.some(r => r.id === data.id) ? prev : [data, ...prev]);
        return data;
      }

      // Check documentSha256
      const qHash = fsQuery(reqCol, where('documentSha256', '==', cleanLower));
      const snapHash = await getDocs(qHash);
      if (!snapHash.empty) {
        const data = snapHash.docs[0].data() as CommissioningRequest;
        setRequests(prev => prev.some(r => r.id === data.id) ? prev : [data, ...prev]);
        return data;
      }

      // Check finalDocumentSha256
      const qFinalHash = fsQuery(reqCol, where('finalDocumentSha256', '==', cleanLower));
      const snapFinalHash = await getDocs(qFinalHash);
      if (!snapFinalHash.empty) {
        const data = snapFinalHash.docs[0].data() as CommissioningRequest;
        setRequests(prev => prev.some(r => r.id === data.id) ? prev : [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.warn('Firestore verification query notice:', err);
    }

    return undefined;
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      requests,
      credentialDocs,
      policyRules,
      transactions,
      notifications,
      adminAuditLogs,
      disputes,
      currentView,
      operatingView,
      masterAdminSection,
      activeCommissioningId,
      preselectedCommissionerId,
      platformFeePercentage,
      deviceMode,
      isMasterAdmin,
      isSignedIn,
      isAuthReady,
      setCurrentView,
      setOperatingView,
      setMasterAdminSection,
      setDeviceMode,
      switchUser,
      addUser,
      updateUserRole,
      deleteUser,
      updateCurrentUser,
      signOutUser,
      signInUser,
      setActiveCommissioningId,
      setPreselectedCommissionerId,
      submitCredentialDocument,
      reviewCredentialDocument,
      createCommissioningRequest,
      updateCommissioningRequest,
      advanceCeremonyState,
      executePayment,
      subscribePro,
      updateLegalPolicy,
      setPlatformFee,
      markNotificationRead,
      dismissNotification,
      dismissAllNotifications,
      addNotification,
      verifyDocumentByCertOrHash,
      logAdminAction,
      processRefund,
      resolveDispute,
      toggleProfessionalStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
