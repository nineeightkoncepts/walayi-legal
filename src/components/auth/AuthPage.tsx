import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  browserLocalPersistence,
  browserSessionPersistence
} from '../../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { isSuperAdminEmail } from '../../services/roleService';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

// Google's brand mark isn't part of lucide-react, so it's drawn inline.
const GoogleIcon: React.FC = () => (
  <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

// Keeps the URL hash and the on-page mode in sync so the page is a real,
// linkable, bookmarkable, back-button-friendly route (#/signin, #/signup,
// #/forgot-password) rather than just internal component state.
const modeFromHash = (): AuthMode => {
  const hash = window.location.hash.toLowerCase();
  if (hash.startsWith('#/signup') || hash.startsWith('#signup')) return 'signup';
  if (hash.startsWith('#/forgot-password') || hash.startsWith('#forgot-password')) return 'forgot-password';
  return 'signin';
};

interface AuthPageProps {
  /** Lets the person reach the public certificate-verification portal, the
   *  one feature usable without an account, straight from this page. */
  onVerifyInstead: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onVerifyInstead }) => {
  const { signInUser, addNotification } = useApp();

  const [mode, setMode] = useState<AuthMode>(() => modeFromHash());

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Sign Up fields
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'user' | 'commissioner'>('user');

  // Forgot Password fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Shared UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep mode synced with hash changes (e.g. browser back/forward, or a link
  // elsewhere in the app pointing at #/signup).
  useEffect(() => {
    const syncFromHash = () => setMode(modeFromHash());
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const navigateToMode = (next: AuthMode) => {
    setErrorMessage(null);
    setMode(next);
    const target = next === 'signin' ? '#/signin' : next === 'signup' ? '#/signup' : '#/forgot-password';
    if (window.location.hash !== target) {
      window.location.hash = target;
    }
  };

  // Helper to map Firebase Auth error codes to user-friendly messages
  const mapAuthError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/email-already-in-use') {
      return 'This email is already registered. Please sign in.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters.';
    }
    if (code === 'auth/user-not-found') {
      return 'No account found with this email.';
    }
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Invalid email or password. Please try again.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many failed attempts. Please try again later.';
    }
    if (code === 'auth/network-request-failed' || message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.';
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return 'An account already exists with this email using a password. Please sign in with your password instead.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'This domain is not yet authorized for Google sign-in. Please contact support.';
    }
    return message || 'An unexpected error occurred. Please try again.';
  };

  const finishAndEnter = () => {
    // Clear the auth hash so refreshing the app doesn't bounce back here.
    // No further action needed: once isSignedIn flips true in context, the
    // app shell re-renders and this page unmounts on its own.
    if (window.location.hash.startsWith('#/signin') ||
        window.location.hash.startsWith('#/signup') ||
        window.location.hash.startsWith('#/forgot-password')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  // --- SIGN-IN WORKFLOW ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = signInEmail.trim();
    const password = signInPassword;

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Set persistence based on "Remember me" checkbox
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      // Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user profile from Firestore
      let userRole: UserRole = 'deponent';
      let displayName = user.displayName || email.split('@')[0];
      let photoUrl = user.photoURL || '';

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const r = (data.role || '').toLowerCase();
          if (r === 'admin' || r === 'master_admin' || isSuperAdminEmail(user.email)) {
            userRole = 'master_admin';
          } else if (r === 'commissioner') {
            userRole = 'commissioner';
          } else {
            userRole = 'deponent';
          }
          displayName = data.displayName || data.fullName || displayName;
          photoUrl = data.profilePhotoUrl || data.avatarUrl || photoUrl;
        } else {
          // Default role fallback
          const isAdmin = isSuperAdminEmail(user.email);
          const isComm = user.email?.toLowerCase().includes('commissioner');
          userRole = isAdmin ? 'master_admin' : (isComm ? 'commissioner' : 'deponent');

          // Seed document for future sessions
          await setDoc(userDocRef, {
            uid: user.uid,
            id: user.uid,
            email: user.email,
            displayName,
            fullName: displayName,
            role: userRole === 'master_admin' ? 'admin' : (userRole === 'commissioner' ? 'commissioner' : 'user'),
            profilePhotoUrl: photoUrl || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } catch (fsErr) {
        console.warn('Firestore user profile fetch notice:', fsErr);
      }

      // Update global context & auto-redirect to appropriate console
      signInUser({
        id: user.uid,
        fullName: displayName,
        email: user.email || email,
        role: userRole,
        avatarUrl: photoUrl
      });

      addNotification(
        'Sign In Successful',
        `Welcome back, ${displayName}.`,
        'SUCCESS'
      );

      finishAndEnter();
    } catch (err: any) {
      setErrorMessage(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // --- GOOGLE SIGN-IN / SIGN-UP WORKFLOW ---
  // One Firebase call (signInWithPopup) covers both cases: if this Google
  // account has never signed in before, Firebase creates the auth user on
  // the spot, so the same handler works from both the Sign In and Sign Up
  // views. A brand-new account picks up the role selected in the Sign Up
  // view's "I am a:" toggle (defaulting to deponent from the Sign In view,
  // which has no role picker) — mirroring the email/password fallback.
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      let userRole: UserRole = 'deponent';
      let displayName = user.displayName || user.email?.split('@')[0] || 'WALAYI User';
      let photoUrl = user.photoURL || '';
      let isNewAccount = false;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const r = (data.role || '').toLowerCase();
        if (r === 'admin' || r === 'master_admin' || isSuperAdminEmail(user.email)) {
          userRole = 'master_admin';
        } else if (r === 'commissioner') {
          userRole = 'commissioner';
        } else {
          userRole = 'deponent';
        }
        displayName = data.displayName || data.fullName || displayName;
        photoUrl = data.profilePhotoUrl || data.avatarUrl || photoUrl;
      } else {
        isNewAccount = true;
        const isAdmin = isSuperAdminEmail(user.email);
        const chosenRole = mode === 'signup' ? signUpRole : 'user';
        userRole = isAdmin ? 'master_admin' : (chosenRole === 'commissioner' ? 'commissioner' : 'deponent');

        await setDoc(userDocRef, {
          uid: user.uid,
          id: user.uid,
          email: user.email,
          displayName,
          fullName: displayName,
          role: userRole === 'master_admin' ? 'admin' : (userRole === 'commissioner' ? 'commissioner' : 'user'),
          profilePhotoUrl: photoUrl || null,
          avatarUrl: photoUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          phone: '',
          location: 'Kampala',
          verified: false,
          fee: userRole === 'commissioner' ? 25000 : 0,
          // Commissioner-category accounts start PENDING and stay out of the
          // marketplace until the Master Admin expressly admits them — this
          // is enforced server-side (see the live directory query in
          // AppContext.tsx and the commissioningRequests create rule), not
          // just a frontend default. Google auth never assigns professional
          // privileges automatically, matching that same gate.
          admissionStatus: userRole === 'commissioner' ? 'PENDING' : null,
          authProvider: 'google'
        }, { merge: true });
      }

      signInUser({
        id: user.uid,
        fullName: displayName,
        email: user.email || '',
        role: userRole,
        avatarUrl: photoUrl
      });

      addNotification(
        isNewAccount ? 'Account Created' : 'Sign In Successful',
        isNewAccount
          ? `Welcome to WALAYI, ${displayName}. Your account has been initialized.`
          : `Welcome back, ${displayName}.`,
        'SUCCESS'
      );

      finishAndEnter();
    } catch (err: any) {
      // A user closing the popup or double-clicking isn't an error worth
      // surfacing — every other failure gets the usual friendly message.
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setErrorMessage(mapAuthError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- SIGN-UP WORKFLOW ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullName = signUpFullName.trim();
    const email = signUpEmail.trim();
    const password = signUpPassword;
    const confirmPassword = signUpConfirmPassword;
    const role = signUpRole;

    // Validation Rules
    if (!fullName) {
      setErrorMessage('Full name is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!role) {
      setErrorMessage('Please select an account role.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create user profile in Firestore (users collection)
      const userDocRef = doc(db, 'users', user.uid);
      const newUserData = {
        uid: user.uid,
        id: user.uid,
        email: user.email,
        displayName: fullName,
        fullName: fullName,
        role: role, // 'user' | 'commissioner'
        profilePhotoUrl: null,
        avatarUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        phone: '',
        location: 'Kampala',
        verified: false,
        fee: role === 'commissioner' ? 25000 : 0,
        // See the matching comment in handleGoogleAuth above: PENDING until
        // the Master Admin expressly admits this account, enforced
        // server-side, not just hidden client-side.
        admissionStatus: role === 'commissioner' ? 'PENDING' : null
      };

      try {
        await setDoc(userDocRef, newUserData);
      } catch (fsErr) {
        console.warn('Firestore create user profile notice:', fsErr);
      }

      // 3. Auto-login & redirect to appropriate console
      const mappedRole: UserRole = isSuperAdminEmail(user.email || email)
        ? 'master_admin'
        : (role === 'commissioner' ? 'commissioner' : 'deponent');
      signInUser({
        id: user.uid,
        fullName: fullName,
        email: user.email || email,
        role: mappedRole,
        avatarUrl: ''
      });

      addNotification(
        'Account Created',
        `Welcome to WALAYI, ${fullName}. Your account has been initialized.`,
        'SUCCESS'
      );

      finishAndEnter();
    } catch (err: any) {
      setErrorMessage(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // --- FORGOT PASSWORD WORKFLOW ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetSuccess(false);

    const email = resetEmail.trim();

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin,
        handleCodeInApp: false
      });
      setResetSuccess(true);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email. Please check and try again.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Too many requests. Please wait a moment and try again.');
      } else if (code === 'auth/network-request-failed' || err?.message?.includes('network')) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage(mapAuthError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1120] flex flex-col lg:flex-row" id="auth-page-root">

      {/* ================================================================= */}
      {/* LEFT PANEL: National Brand / Statutory Context (desktop only)     */}
      {/* ================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 w-full">
            <img
              src="/assets/brand/walayi-logo.jpg"
              alt="WALAYI — Sworn. Witnessed. Sealed."
              className="w-full h-auto"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-300 font-sans tracking-wide">
              Digital Oath &amp; Commissioning Workflow for Uganda
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* RIGHT PANEL: The actual form                                      */}
      {/* ================================================================= */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full overflow-hidden flex flex-col">

            {/* Header (mobile brand mark; desktop already shows the left panel) */}
            <div className="bg-white p-6 flex flex-col items-center border-b border-slate-100 lg:hidden">
              <img
                src="/assets/brand/walayi-logo.jpg"
                alt="WALAYI — Sworn. Witnessed. Sealed."
                className="w-full max-w-[280px] h-auto"
              />
            </div>

            {/* Error message banner */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-semibold animate-fadeIn" id="auth-error-banner">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Body: Notepad-Simplicity Form Views */}
            <div className="p-6 space-y-5">

              {/* ============================================= */}
              {/* VIEW 1: SIGN IN */}
              {/* ============================================= */}
              {mode === 'signin' && (
                <div className="space-y-4" id="view-signin-form">
                  <div>
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Welcome to Walayi
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sign in to access your statutory dashboard
                    </p>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Email address</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          placeholder="e.g. user@example.com"
                          required
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          id="signin-email-input"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          id="signin-password-input"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    {/* Remember me Checkbox (Session Persistence) */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          id="checkbox-remember-me"
                        />
                        <span className="text-xs font-semibold text-slate-700">Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(signInEmail);
                          setResetSuccess(false);
                          navigateToMode('forgot-password');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        id="link-forgot-password"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Primary Action Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      id="btn-submit-signin"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>SIGN IN</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* Google Sign In */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
                    id="btn-google-signin"
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>

                  {/* Navigation link: Don't have an account? Sign Up */}
                  <div className="pt-3 text-center border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => navigateToMode('signup')}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        id="link-switch-to-signup"
                      >
                        Sign Up
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {/* ============================================= */}
              {/* VIEW 2: SIGN UP */}
              {/* ============================================= */}
              {mode === 'signup' && (
                <div className="space-y-4" id="view-signup-form">
                  <div>
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Create your WALAYI account
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Join Uganda's digital oath and commissioning platform
                    </p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={signUpFullName}
                          onChange={(e) => setSignUpFullName(e.target.value)}
                          placeholder="e.g. Florence Kia or Adv. Kajubi Lovelock"
                          required
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          id="signup-fullname-input"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Email address</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="e.g. name@example.com"
                          required
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          id="signup-email-input"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Password (min 6 chars)</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          id="signup-password-input"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Confirm Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={signUpConfirmPassword}
                          onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          id="signup-confirm-password-input"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-slate-700 block">I am a:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSignUpRole('user')}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            signUpRole === 'user'
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                          id="role-select-user"
                        >
                          <div className="text-[11px] font-bold">Deponent / User</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Oath Taker</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSignUpRole('commissioner')}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            signUpRole === 'commissioner'
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                          id="role-select-commissioner"
                        >
                          <div className="text-[11px] font-bold leading-tight">Commissioner</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Cap. 5 Officer</div>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 pt-0.5">
                        Master Admin accounts are provisioned internally and can't be self-registered.
                      </p>
                    </div>

                    {/* Primary Action Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                      id="btn-submit-signup"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>CREATE ACCOUNT</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* Google Sign Up — uses the role selected above */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
                    id="btn-google-signup"
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>

                  {/* Navigation link: Already have an account? Sign In */}
                  <div className="pt-3 text-center border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => navigateToMode('signin')}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        id="link-switch-to-signin"
                      >
                        Sign In
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {/* ============================================= */}
              {/* VIEW 3: FORGOT PASSWORD */}
              {/* ============================================= */}
              {mode === 'forgot-password' && (
                <div className="space-y-4" id="view-forgot-password-form">
                  <div>
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Reset your password
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Enter the email address associated with your account. We'll send you a link to reset your password.
                    </p>
                  </div>

                  {resetSuccess ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fadeIn">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-emerald-900">
                          Reset link sent to your email
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-snug">
                          Please check your inbox at <strong>{resetEmail}</strong> and click the link to configure a new password.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setResetSuccess(false);
                          navigateToMode('signin');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Return to Sign In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Email address</label>
                        <div className="relative">
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="e.g. your-email@example.com"
                            required
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                            id="forgot-password-email-input"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                      </div>

                      {/* Primary Action Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                        id="btn-send-reset-link"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <span>SEND RESET LINK</span>
                        )}
                      </button>

                      {/* Back to Sign In Link */}
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => navigateToMode('signin')}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                          id="link-back-to-signin"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Sign In</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* The one feature reachable without an account: public certificate verification */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onVerifyInstead}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              id="link-verify-without-account"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Have a certificate to verify instead? Use the public verification portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
