import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { SplashScreen } from './components/auth/SplashScreen';
import { AuthPage } from './components/auth/AuthPage';

// Views
import { HomeView } from './components/home/HomeView';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { NewCommissioningModal } from './components/commissioning/NewCommissioningModal';
import { DailyCommissioningRoom } from './components/room/DailyCommissioningRoom';
import { DocumentsView } from './components/documents/DocumentsView';
import { CredentialVaultView } from './components/vault/CredentialVaultView';
import { WalletView } from './components/wallet/WalletView';
import { VerificationPortal } from './components/verification/VerificationPortal';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { MasterControlCenter } from './components/admin/MasterControlCenter';
import { ProSubscriptionView } from './components/pro/ProSubscriptionView';
import { AuthorityOnboardingModal } from './components/onboarding/AuthorityOnboardingModal';
import { CommissionerDashboard } from './components/commissioning/CommissionerDashboard';
import { CommissionerSettings } from './components/commissioner/CommissionerSettings';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { IncomingCallBanner } from './components/common/IncomingCallBanner';
import { PrivacyNoticeView } from './components/legal/PrivacyNoticeView';
import { TermsAndConditionsView } from './components/legal/TermsAndConditionsView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { canAccessView, resolveAccessibleView } from './services/roleService';

// Global notification toast component
import { X, CheckCircle, AlertTriangle, Bell, Info } from 'lucide-react';

const NotificationToasts: React.FC = () => {
  const { notifications, dismissNotification } = useApp();
  const activeList = notifications.filter(n => !n.read).slice(0, 3);

  if (activeList.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none" id="toast-notifications-root">
      {activeList.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto p-4 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-start gap-3 text-slate-900 transition-all animate-slideUp hover:border-slate-300"
          id={`toast-item-${n.id}`}
        >
          <div className="mt-0.5 flex-shrink-0">
            {n.type === 'SUCCESS' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            {n.type === 'ALERT' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {n.type === 'PAYMENT' && <CheckCircle className="w-5 h-5 text-blue-600" />}
            {n.type === 'INFO' && <Info className="w-5 h-5 text-blue-500" />}
            {n.type === 'VERIFICATION' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            {n.type === 'CEREMONY' && <Bell className="w-5 h-5 text-blue-600" />}
            {n.type === 'SYSTEM' && <Info className="w-5 h-5 text-slate-600" />}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h4 className="font-bold text-xs text-slate-900 leading-tight">{n.title}</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dismissNotification(n.id);
            }}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0 -mr-1 -mt-1"
            title="Dismiss"
            aria-label="Dismiss notification"
            id={`btn-dismiss-toast-${n.id}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

const MainContent: React.FC = () => {
  const { currentView, setCurrentView, isMasterAdmin, currentUser } = useApp();

  // Role-based access guard. Rather than blocking with an "Access Denied"
  // screen, silently steer the user to a view their role can actually open.
  // Combined with role-filtered navigation, this means each user only ever
  // sees what they're meant to see — the concept of "switching roles" simply
  // isn't surfaced.
  React.useEffect(() => {
    if (!canAccessView(currentUser.role, currentView).canAccess) {
      const target = resolveAccessibleView(currentUser.role, currentView);
      if (target !== currentView) {
        setCurrentView(target as any);
      }
    }
  }, [currentUser.role, currentView, setCurrentView]);

  if (!canAccessView(currentUser.role, currentView).canAccess) {
    // Render nothing for the brief moment before the redirect effect runs,
    // so a forbidden view never flashes on screen.
    return <main className="flex-1" />;
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Isolated per top-level view, keyed to it, so a crash in one view
          (e.g. a broken admin tab) can't take the whole app to a blank
          screen — navigating to any other view still works. */}
      <ErrorBoundary resetKey={currentView}>
        {currentView === 'home' && <HomeView />}
        {currentView === 'marketplace' && <MarketplaceView />}
        {currentView === 'new-commissioning' && <NewCommissioningModal />}
        {currentView === 'room' && <DailyCommissioningRoom />}
        {currentView === 'documents' && <DocumentsView />}
        {currentView === 'commissioner-dashboard' && <CommissionerDashboard />}
        {currentView === 'commissioner-settings' && <CommissionerSettings />}
        {currentView === 'vault' && <CredentialVaultView />}
        {currentView === 'wallet' && <WalletView />}
        {(currentView === 'verify' || currentView === 'verify-portal' || currentView === 'verification') && <VerificationPortal />}
        {currentView === 'admin' && (isMasterAdmin ? <MasterControlCenter /> : <SuperAdminDashboard />)}
        {currentView === 'pro' && <ProSubscriptionView />}
        {currentView === 'onboarding' && <AuthorityOnboardingModal />}
        {currentView === 'auth' && <HomeView />}
        {currentView === 'privacy' && <PrivacyNoticeView />}
        {currentView === 'terms' && <TermsAndConditionsView />}
      </ErrorBoundary>
    </main>
  );
};

function AuthCheckingScreen() {
  return (
    <div className="min-h-screen w-full bg-[#0B1120] flex items-center justify-center" id="auth-checking-screen">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-[11px] font-mono-code uppercase tracking-widest">Checking session…</span>
      </div>
    </div>
  );
}

function MainAppShell() {
  const { currentView, setCurrentView, isSignedIn, isAuthReady } = useApp();
  const [showSplash, setShowSplash] = useState(false);

  // Detect direct public verification links, or the auth page routes
  // (#/signin, #/signup, #/forgot-password), on initial landing or hashchange
  React.useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search;
      const params = new URLSearchParams(search);

      if (
        hash.startsWith('#verify') || 
        hash.startsWith('#/verify') || 
        params.has('verify') || 
        params.has('code')
      ) {
        setCurrentView('verify-portal');
        return;
      }

      const isAuthRoute =
        hash.startsWith('#/signin') ||
        hash.startsWith('#signin') ||
        hash.startsWith('#/signup') ||
        hash.startsWith('#signup') ||
        hash.startsWith('#/forgot-password') ||
        hash.startsWith('#forgot-password');

      if (isAuthRoute) {
        setCurrentView('auth');
      }
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, [setCurrentView]);

  // Still waiting on Firebase's first auth callback — hold here briefly so a
  // returning, already-signed-in user never sees the sign-in page flash by.
  if (!isAuthReady) {
    return <AuthCheckingScreen />;
  }

  // The public certificate verification portal is the one feature reachable
  // without an account (e.g. a court checking a certificate from a link).
  const isPublicVerifyRoute =
    currentView === 'verify' || currentView === 'verify-portal' || currentView === 'verification';

  // Every other feature requires signing in first — this is the very first
  // thing an unauthenticated visitor sees.
  if (!isSignedIn && !isPublicVerifyRoute) {
    return (
      <>
        <AuthPage
          onVerifyInstead={() => {
            window.location.hash = '#/verify';
            setCurrentView('verify-portal');
          }}
        />
        <NotificationToasts />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Navbar />
      <MainContent />
      <Footer />
      <NotificationToasts />
      <IncomingCallBanner />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppShell />
    </AppProvider>
  );
}
