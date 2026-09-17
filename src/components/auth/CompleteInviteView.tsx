import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldCheck, Mail, Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { auth, db, signInWithEmailLink, updatePassword } from '../../services/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { isSuperAdminEmail, sanitizeEmailForId } from '../../services/roleService';
import { BrandLogo } from '../common/BrandLogo';

type Step = 'confirm-email' | 'set-password' | 'done';

// Landing page for an admin-issued account invite. Rendered whenever the
// current URL is a Firebase passwordless sign-in link (see App.tsx), which
// is how the emailed "set up your account" link from UserManagementSection
// actually gets someone into a real, working account — no real Firebase
// Auth user (or Firestore users/{uid} profile) exists for them until they
// land here and complete this.
export const CompleteInviteView: React.FC = () => {
  const { signInUser, addNotification } = useApp();

  const initialEmail = (() => {
    try {
      return new URLSearchParams(window.location.search).get('email') || '';
    } catch {
      return '';
    }
  })();

  const [step, setStep] = useState<Step>('confirm-email');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeRole, setWelcomeRole] = useState<UserRole>('deponent');

  const cleanUrl = () => {
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      // ignore
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter the email address this invitation was sent to.');
      return;
    }

    setIsLoading(true);
    try {
      const credential = await signInWithEmailLink(auth, trimmedEmail, window.location.href);
      const user = credential.user;

      // Pull the profile the admin set up when they sent this invite, so
      // the invitee doesn't have to re-enter their own role/name/etc.
      const inviteId = sanitizeEmailForId(trimmedEmail);
      const inviteSnap = await getDoc(doc(db, 'pendingInvites', inviteId));
      const invite: any = inviteSnap.exists() ? inviteSnap.data() : null;

      const isDesignatedSuperAdmin = isSuperAdminEmail(user.email || trimmedEmail);
      let role: UserRole = isDesignatedSuperAdmin ? 'master_admin' : (invite?.role || 'deponent');

      // The Firestore rule for users/{uid} never lets a self-authored create
      // grant an admin-tier role — only an existing admin's write may do
      // that (see firestore.rules). An admin inviting someone directly to
      // master_admin/super_admin therefore can't be self-applied here; fall
      // back to deponent and leave the actual elevation to be done from
      // User Management afterward, via the properly-authorized role change.
      if ((role === 'master_admin' || role === 'super_admin' || role === 'admin') && !isDesignatedSuperAdmin) {
        role = 'deponent';
      }

      const fullName = invite?.fullName || user.displayName || trimmedEmail.split('@')[0];

      const userDocData = {
        uid: user.uid,
        id: user.uid,
        email: user.email || trimmedEmail,
        displayName: fullName,
        fullName,
        role: role === 'master_admin' || role === 'super_admin' || role === 'admin' ? 'admin' : (role === 'deponent' ? 'user' : role),
        profilePhotoUrl: null,
        avatarUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        phone: invite?.phone || '',
        location: invite?.stationCity || 'Kampala',
        nationalIdNumber: invite?.nationalIdNumber || undefined,
        lawFirmName: invite?.lawFirmName || undefined,
        firmName: invite?.firmName || null,
        enrollmentNumber: invite?.enrollmentNumber || undefined,
        verified: false,
        fee: ['commissioner', 'notary', 'judicial_officer', 'justice_of_peace'].includes(role) ? 25000 : 0,
        admissionStatus: ['commissioner', 'notary', 'judicial_officer', 'justice_of_peace'].includes(role) ? 'PENDING' : null,
      };

      await setDoc(doc(db, 'users', user.uid), userDocData, { merge: true });

      if (inviteSnap.exists()) {
        deleteDoc(doc(db, 'pendingInvites', inviteId)).catch(() => {
          // Best-effort cleanup — a leftover invite doc is harmless.
        });
      }

      cleanUrl();
      setWelcomeName(fullName);
      setWelcomeRole(role);
      setStep('set-password');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') {
        setErrorMessage('This activation link has already been used or has expired. Ask an admin to resend your invitation.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('That doesn\'t look like a valid email address.');
      } else {
        setErrorMessage(err?.message || 'Could not activate this account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const finishIntoApp = () => {
    const u = auth.currentUser;
    signInUser({
      id: u?.uid,
      fullName: welcomeName || u?.displayName || undefined,
      email: u?.email || email,
      role: welcomeRole,
      avatarUrl: u?.photoURL || undefined,
    } as any);
    addNotification('Account Activated', `Welcome to WALAYI, ${welcomeName}. Your account is ready.`, 'SUCCESS');
    setStep('done');
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length > 0) {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, password);
        }
      } catch (err: any) {
        // Not fatal — they're already signed in via the email link either
        // way, and can always set a password later from their profile.
        console.warn('Could not set password during invite completion:', err?.message);
      } finally {
        setIsLoading(false);
      }
    }

    finishIntoApp();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1120] to-[#0D1B3D] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo variant="glyph" size="lg" />
          <div>
            <h1 className="text-xl font-display-legal font-bold text-[#0D1B3D]">
              {step === 'done' ? 'You\'re All Set' : 'Activate Your WALAYI Account'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {step === 'confirm-email' && 'An administrator invited you to WALAYI. Confirm your email to continue.'}
              {step === 'set-password' && 'Optionally set a password so you can also sign in without an email link.'}
              {step === 'done' && 'Redirecting you into the platform now.'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'confirm-email' && (
          <form onSubmit={handleActivate} className="space-y-4" id="complete-invite-email-form">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  id="complete-invite-email-input"
                  autoFocus
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#0D1B3D] hover:bg-[#14285A] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
              id="btn-complete-invite-activate"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{isLoading ? 'Activating…' : 'Activate Account'}</span>
            </button>
          </form>
        )}

        {step === 'set-password' && (
          <form onSubmit={handleSetPassword} className="space-y-4" id="complete-invite-password-form">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">New Password (optional)</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to skip"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  id="complete-invite-password-input"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
            {password.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    id="complete-invite-confirm-password-input"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
              id="btn-complete-invite-finish"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{isLoading ? 'Finishing…' : (password ? 'Set Password & Enter WALAYI' : 'Skip & Enter WALAYI')}</span>
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-2 py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-sm text-slate-600">Taking you into WALAYI…</p>
          </div>
        )}
      </div>
    </div>
  );
};
