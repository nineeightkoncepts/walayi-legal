import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Scale, 
  FileCheck2, 
  BookOpen, 
  QrCode, 
  ArrowRight, 
  Video, 
  Lightbulb, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FileText,
  Smartphone,
  ExternalLink,
  Lock
} from 'lucide-react';

import { BrandLogo } from '../common/BrandLogo';

export const HomeView: React.FC = () => {
  const { 
    currentUser, 
    setCurrentView, 
    requests, 
    setActiveCommissioningId 
  } = useApp();

  const [showTipsModal, setShowTipsModal] = useState(false);

  const activeCeremony = requests.find(r => 
    r.status === 'CEREMONY_ACTIVE' || r.status === 'ACCEPTED' || r.status === 'DOCUMENT_LOCKED'
  );

  const recentDocuments = requests.slice(0, 3);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12" id="home-view-container">
      
      {/* Active Ceremony Alert Banner */}
      {activeCeremony && (
        <div className="bg-blue-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
              <Video className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-blue-900 uppercase font-mono-code">
                  ACTIVE CEREMONY
                </span>
                <span className="text-xs text-blue-100 font-mono-code">{activeCeremony.certificateNumber}</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {activeCeremony.documentTitle}
              </h3>
              <p className="text-xs text-blue-100">
                Presiding: {activeCeremony.assignedProfessionalName || 'Commissioner for Oaths'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveCommissioningId(activeCeremony.id);
              setCurrentView('room');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors whitespace-nowrap"
            id="btn-enter-active-room"
          >
            <Video className="w-4 h-4" />
            Enter Room
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Action Center: Simplified to Notepad Thinking (Part J) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs relative overflow-hidden text-center space-y-8">
        
        {/* Tutorial / Tips Trigger (Top Right) */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowTipsModal(true)}
            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer shadow-xs group"
            id="btn-open-tips-tutorial"
            title="How it Works & Tips"
          >
            <Lightbulb className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center space-y-1">
          {currentUser?.fullName && currentUser.fullName !== 'Guest User' && (
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight" id="user-console-welcome-header">
              Welcome, {currentUser.fullName}
            </h2>
          )}
          <BrandLogo variant="full" size="xl" showSlogan={true} className="mb-2" />
        </div>

        {/* Dominant Primary Action */}
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => setCurrentView('new-commissioning')}
            className="w-full group p-6 rounded-2xl bg-[#0097A7] hover:bg-[#00838F] text-white cursor-pointer transition-all shadow-lg hover:shadow-xl flex flex-col items-center gap-3 active:scale-95"
            id="btn-main-commission-doc"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold shadow-xs group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-lg font-black uppercase tracking-wide">
                COMMISSION MY DOCUMENT
              </span>
              <p className="text-[11px] text-teal-50/80 font-medium">
                Upload Affidavit • Select Commissioner • Instant Ceremony
              </p>
            </div>
          </button>
        </div>

        {/* Secondary Navigation Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          <button 
            onClick={() => setCurrentView('documents')}
            className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all font-bold text-xs cursor-pointer"
            id="btn-sec-my-documents"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            MY DOCUMENTS
          </button>
          
          <button 
            onClick={() => setCurrentView('marketplace')}
            className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all font-bold text-xs cursor-pointer"
            id="btn-sec-find-commissioner"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            FIND A COMMISSIONER
          </button>

          <button 
            onClick={() => {
              // Usually handled in Navbar profile trigger, but here for completeness
              const btn = document.getElementById('btn-open-user-profile-modal');
              if (btn) btn.click();
            }}
            className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all font-bold text-xs cursor-pointer"
            id="btn-sec-my-profile"
          >
            <Lock className="w-4 h-4 text-slate-500" />
            MY PROFILE
          </button>
        </div>

        {/* Multi-Platform Notice */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              <strong>Cross-Platform Universal App:</strong> Android, iPhone (iOS), Chrome, Edge, Safari, Firefox.
            </span>
          </div>
        </div>

      </section>

      {/* Quick Access Documents Stream */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Documents & Ceremonies
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('documents')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            id="btn-view-all-docs"
          >
            <span>View All ({requests.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentDocuments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No commissioning documents initiated yet. Click "Swear an Affidavit" above to begin.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{doc.documentTitle}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono-code font-bold ${
                      doc.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'CEREMONY_ACTIVE' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {(doc.status || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono-code">
                    <span>{doc.certificateNumber}</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>UGX {doc.totalAmountUGX?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setActiveCommissioningId(doc.id);
                      setCurrentView('documents');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                  {doc.status === 'CEREMONY_ACTIVE' && (
                    <button
                      onClick={() => {
                        setActiveCommissioningId(doc.id);
                        setCurrentView('room');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Video className="w-3 h-3" />
                      Enter Room
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tutorial & Tips Modal (Lightbulb Click) */}
      {showTipsModal && (
        <div className="fixed inset-0 z-50 flex p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto" id="tutorial-tips-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] m-auto">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">How Digital Commissioning Works</h3>
                  <p className="text-[11px] text-slate-300">Quick 4-step statutory procedure</p>
                </div>
              </div>
              <button
                onClick={() => setShowTipsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Steps & Tips */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono-code font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Upload & Cryptographic Lock</h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Upload your affidavit PDF. A SHA-256 cryptographic digest is locked to ensure it cannot be modified.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono-code font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Escrow Statutory Fee</h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Pay the statutory commissioner fee via MTN Mobile Money or Airtel Money. Funds remain safely escrowed until completion.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono-code font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Live Statutory Video Oath</h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Meet the Commissioner for Oaths in the encrypted video room. Administer/take the solemn oath or affirmation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono-code font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Digital Jurat & Finalised PDF</h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Both parties sign on canvas. The electronic jurat, official seal, and independently verifiable audit certificate are generated instantly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Tips Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  Tips for a Smooth Ceremony:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                  <li>Keep your National ID (NIN) or Passport nearby for video identity check.</li>
                  <li>Ensure good room lighting and stable MTN/Airtel internet connection.</li>
                </ul>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowTipsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
