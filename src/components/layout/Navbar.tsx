import React, { useState, useEffect, useRef } from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { OperatingView } from '../../types';
import { 
  Shield, 
  Scale, 
  FileText, 
  UserCheck, 
  Wallet, 
  Bell, 
  Search, 
  Smartphone, 
  Monitor, 
  Tablet,
  ChevronDown,
  Lock,
  PlusCircle,
  Award,
  Settings,
  Briefcase,
  Layers,
  Crown,
  Eye,
  RotateCcw,
  Sparkles,
  Cpu,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  BookOpen,
  Camera,
  RefreshCw,
  X,
  UserPlus,
  Key
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { AboutLegalInfrastructureModal } from '../common/AboutLegalInfrastructureModal';
import { ProfileAccountModal } from '../profile/ProfileAccountModal';
import { MasterAdminShieldConsole } from '../admin/MasterAdminShieldConsole';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { UserAvatar } from '../common/UserAvatar';
import { PhotoSelectionModal } from '../profile/PhotoSelectionModal';
import { uploadProfilePhoto } from '../../services/profilePhotoService';
import { getVisibleNavItems } from '../../services/roleService';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    currentView, 
    setCurrentView,
    operatingView,
    setOperatingView,
    isMasterAdmin,
    isSignedIn,
    signOutUser,
    updateCurrentUser,
    addNotification,
    notifications,
    markNotificationRead,
    deviceMode,
    setDeviceMode,
    requests
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showOperatingMenu, setShowOperatingMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showAboutLegalModal, setShowAboutLegalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showPhotoSelectionModal, setShowPhotoSelectionModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showShieldConsole, setShowShieldConsole] = useState(false);
  const [quickVerifyQuery, setQuickVerifyQuery] = useState('');

  const profilePanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigate to the dedicated sign in / sign up / forgot password page
  const goToAuth = (mode: 'signin' | 'signup' | 'forgot-password') => {
    window.location.hash = mode === 'signin' ? '#/signin' : mode === 'signup' ? '#/signup' : '#/forgot-password';
    setCurrentView('auth');
  };

  const unreadNotifs = notifications.filter(n => !n.read);
  const activeCeremony = requests.find(r => r.status === 'CEREMONY_ACTIVE' || r.status === 'ACCEPTED');

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profilePanelRef.current && !profilePanelRef.current.contains(e.target as Node)) {
        setShowProfilePanel(false);
      }
    };
    if (showProfilePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfilePanel]);

  // Handle Photo Upload directly from the Profile Panel
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const newPhotoUrl = await uploadProfilePhoto(file, currentUser.id);
      updateCurrentUser({ avatarUrl: newPhotoUrl });
      addNotification(
        'Profile Photo Saved',
        'Your profile photograph has been hardened and saved to Firebase.',
        'SUCCESS'
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Keyboard shortcut Alt+S for Shield Console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowShieldConsole(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleHomeClick = () => {
    const role = (currentUser.role || '').toLowerCase();
    if (isMasterAdmin || role === 'admin' || role === 'master_admin') {
      setOperatingView('ADMIN');
      setCurrentView('admin');
    } else if (role === 'commissioner' || role === 'notary' || role === 'judicial_officer') {
      setOperatingView('COMMISSIONER');
      setCurrentView('commissioner-dashboard');
    } else {
      setOperatingView('USER');
      setCurrentView('home');
    }
  };

  // Navigation tabs the signed-in user's role is permitted to open.
  const visibleNavItems = getVisibleNavItems(currentUser.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo (Part F & Role-Based Home) */}
          <div 
            onClick={handleHomeClick} 
            className="flex items-center cursor-pointer group select-none"
            id="nav-brand-logo"
            title="Go to Home Dashboard"
          >
            <BrandLogo variant="compact" size="sm" />
          </div>

          {/* Navigation Items — filtered by the signed-in user's role, so each
              user only sees the tabs they're permitted to open. */}
          <nav className="flex items-center gap-1 sm:gap-3">
            {visibleNavItems.map((item) => {
              const isActive = item.matches.includes(currentView);
              const isAdminItem = item.key === 'admin';
              const onClick = () => {
                if (item.view === 'admin') {
                  setOperatingView('ADMIN');
                } else if (item.view === 'commissioner-dashboard') {
                  setOperatingView('COMMISSIONER');
                } else if (item.view === 'home') {
                  setOperatingView('USER');
                }
                setCurrentView(item.view as AppView);
              };
              return (
                <button
                  key={item.key}
                  onClick={onClick}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    isActive
                      ? isAdminItem
                        ? 'text-indigo-700 bg-indigo-50 font-black'
                        : 'text-[#0097A7] bg-teal-50'
                      : isAdminItem
                        ? 'text-slate-500 hover:text-indigo-900'
                        : 'text-slate-500 hover:text-[#0D1B3D]'
                  }`}
                  id={`nav-link-${item.key}`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* PWA Install Button blinking in the address-bar / navigation area */}
            <PWAInstallButton variant="nav" />
            
            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Profile Button with Embedded Panel */}
            <div className="relative" ref={profilePanelRef}>
              <button
                onClick={() => setShowProfilePanel(prev => !prev)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer group"
                id="btn-open-user-profile-modal"
                aria-expanded={showProfilePanel}
                title={isSignedIn ? `${currentUser.fullName} Profile` : 'Sign In / Account Profile'}
              >
                <UserAvatar
                  src={isSignedIn && currentUser.avatarUrl ? currentUser.avatarUrl : null}
                  name={isSignedIn ? currentUser.fullName : undefined}
                  size="sm"
                  className="ring-1 ring-slate-200"
                />
                <span className="hidden sm:block text-[10px] font-black text-slate-900 uppercase tracking-widest">
                  PROFILE
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showProfilePanel ? 'rotate-180' : ''}`} />
              </button>

              {/* Embedded Profile Panel right beneath it */}
              {showProfilePanel && (
                <div 
                  className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 z-50 animate-scaleUp text-slate-900"
                  id="profile-dropdown-panel"
                >
                  {!isSignedIn ? (
                    /* State: Not signed in - Blank Avatar + SIGN IN & CREATE ACCOUNT buttons */
                    <div className="flex flex-col items-center text-center space-y-4 py-2">
                      <UserAvatar size="xl" src={null} />
                      <div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">Account Profile</div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Sign in or register to commission affidavits, verify certificates, and access your console.
                        </p>
                      </div>

                      <div className="w-full space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfilePanel(false);
                            goToAuth('signin');
                          }}
                          className="w-full py-3 px-4 rounded-2xl bg-[#0D1B3D] hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                          id="btn-profile-sign-in"
                        >
                          <LogIn className="w-4 h-4 text-[#0097A7]" />
                          SIGN IN
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowProfilePanel(false);
                            goToAuth('signup');
                          }}
                          className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          id="btn-profile-sign-up"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                          CREATE ACCOUNT
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* State: Signed in - User Photo / Blank Avatar + Name + EDIT PROFILE + SIGN OUT */
                    <div className="flex flex-col items-center space-y-4">
                      {/* Avatar with click-to-upload / camera workflow */}
                      <div className="flex flex-col items-center text-center">
                        <div 
                          onClick={() => setShowPhotoSelectionModal(true)}
                          className="relative cursor-pointer group"
                          title="Click on blank photo to take picture or upload from device"
                          id="btn-navbar-avatar-select"
                        >
                          <UserAvatar
                            size="xl"
                            src={currentUser.avatarUrl || null}
                            name={currentUser.fullName}
                            showUploadOverlay={true}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowPhotoSelectionModal(true)}
                          className="mt-2 text-[11px] font-bold text-[#0097A7] hover:underline flex items-center gap-1.5 cursor-pointer"
                          id="btn-navbar-choose-photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {currentUser.avatarUrl ? 'Change Photo (Camera / Picker)' : 'Set Photo (Camera / Picker)'}
                        </button>
                      </div>

                      {/* User Name & Particulars */}
                      <div className="text-center w-full min-w-0">
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">
                          {currentUser.fullName}
                        </h4>
                        {currentUser.email && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {currentUser.email}
                          </p>
                        )}
                        <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {(currentUser.role || '').replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="w-full h-px bg-slate-100" />

                      {/* Actions: EDIT PROFILE & SIGN OUT */}
                      <div className="w-full space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfilePanel(false);
                            setShowProfileModal(true);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                          id="btn-panel-edit-profile"
                        >
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          EDIT PROFILE
                        </button>

                        {/* Commissioner Settings — only visible for commissioners */}
                        {(currentUser.role === 'commissioner' || currentUser.role === 'notary' || currentUser.role === 'judicial_officer') && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowProfilePanel(false);
                              setCurrentView('commissioner-settings');
                            }}
                            className="w-full py-2.5 px-3 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                            id="btn-panel-commissioner-settings"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            COMMISSIONING SETTINGS
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={async () => {
                            setShowProfilePanel(false);
                            setShowProfileModal(false);
                            await signOutUser();
                            goToAuth('signin');
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                          id="btn-panel-sign-out"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          SIGN OUT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </nav>

        </div>
      </div>

      {/* Modals */}
      <AboutLegalInfrastructureModal
        isOpen={showAboutLegalModal}
        onClose={() => setShowAboutLegalModal(false)}
      />
      <ProfileAccountModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenAboutLegal={() => {
          setShowProfileModal(false);
          setShowAboutLegalModal(true);
        }}
      />
      <PhotoSelectionModal
        isOpen={showPhotoSelectionModal}
        onClose={() => setShowPhotoSelectionModal(false)}
      />
      <MasterAdminShieldConsole
        isOpen={showShieldConsole}
        onClose={() => setShowShieldConsole(false)}
      />
    </header>
  );
};


