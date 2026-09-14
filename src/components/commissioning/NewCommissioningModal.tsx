import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DocumentType, 
  SolemnisationType, 
  AuthorityType,
  AnnexureItem,
  UserProfile
} from '../../types';
import { 
  ShieldCheck, 
  Upload, 
  Lock, 
  BookOpen, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  FileText, 
  Video, 
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  Paperclip,
  Plus,
  Trash2,
  Check,
  Layers,
  FileUp,
  FolderOpen,
  X,
  FileCheck,
  Building2,
  Scale,
  Gavel,
  UserCheck,
  UserX,
  HelpCircle,
  MapPin,
  Info
} from 'lucide-react';
import { getStatutoryOathText } from '../../services/juratService';
import { checkCommissionerConflict, ConflictCheckResult } from '../../utils/conflictValidation';
import { UserAvatar } from '../common/UserAvatar';
import { PlatformFeeSheet } from '../payment/PlatformFeeSheet';
import { WALAYI_PLATFORM_FEE_UGX } from '../../services/paymentService';
import { PaymentTransaction } from '../../types';

// Documents may be commissioned in PDF or Microsoft Word (.doc / .docx) format.
const ACCEPTED_DOCUMENT_FORMATS =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const NewCommissioningModal: React.FC = () => {
  const { 
    currentUser, 
    users, 
    preselectedCommissionerId,
    createCommissioningRequest, 
    executePayment, 
    setActiveCommissioningId, 
    setCurrentView,
    platformFeePercentage,
    addNotification
  } = useApp();

  // Wizard Step: 1 = Document & Deponent, 2 = Commissioner Selection, 3 = Escrow & Payment, 4 = Ready
  const [step, setStep] = useState<number>(1);

  // Document State
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('affidavit_general');
  const [fileName, setFileName] = useState('');
  const [fileSizeKb, setFileSizeKb] = useState(0);
  const [sha256Hash, setSha256Hash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // User Role Analysis for Conflict Routing
  const isJudicialUser = currentUser.professionalCategory === 'judicial_officer' || currentUser.isJudicialOfficer || currentUser.role === 'judicial_officer';
  const isAdvocateUser = currentUser.professionalCategory === 'advocate' || (currentUser.role === 'deponent' && !!(currentUser.firmName || currentUser.lawFirmName));
  const isCommissionerUser = currentUser.role === 'commissioner' || currentUser.professionalCategory === 'commissioner_for_oaths';

  // Deponent Selection & Conflict Questions (Part 4)
  const [deponentSelectionType, setDeponentSelectionType] = useState<'self' | 'on_behalf'>(() => {
    return isAdvocateUser ? 'on_behalf' : 'self';
  });
  const [deponentFullName, setDeponentFullName] = useState(currentUser.fullName);
  const [deponentNin, setDeponentNin] = useState(currentUser.nationalIdNumber || 'CM92018104LK7A');
  const [uploaderFirm, setUploaderFirm] = useState(currentUser.firmName || currentUser.lawFirmName || '');

  // Judicial Conflict Question (Part 4, Step 2)
  const [isJudicialMatterHandling, setIsJudicialMatterHandling] = useState<boolean>(false);

  // Commissioner Selection State (Part 5 & 6)
  const verifiedPros = users.filter(u => 
    u.role === 'commissioner' || 
    u.role === 'notary' || 
    u.role === 'judicial_officer' || 
    u.role === 'justice_of_peace' ||
    (u.authorities && u.authorities.length > 0)
  );

  const [selectedProId, setSelectedProId] = useState<string>(() => {
    if (preselectedCommissionerId) return preselectedCommissionerId;
    const defaultNonConflicted = verifiedPros.find(p => p.id !== currentUser.id);
    return defaultNonConflicted ? defaultNonConflicted.id : (verifiedPros[0]?.id || '');
  });

  // Active conflict alert modal state
  const [conflictModalData, setConflictModalData] = useState<{
    commissionerName: string;
    ruleViolated?: string;
    reason?: string;
    advice?: string;
  } | null>(null);

  // Solemnisation & Payment State
  const [solemnisationType, setSolemnisationType] = useState<SolemnisationType>('holy_bible');
  const [language, setLanguage] = useState<'English' | 'Luganda'>('English');
  const [paymentProvider, setPaymentProvider] = useState<'MTN_MOMO' | 'AIRTEL_MONEY'>('MTN_MOMO');
  const [momoPhone, setMomoPhone] = useState(currentUser.phone || '+256772491002');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Annexures State
  const [hasAnnexures, setHasAnnexures] = useState<boolean>(false);
  const [annexuresList, setAnnexuresList] = useState<AnnexureItem[]>([]);
  const [newAnnexureIdentifier, setNewAnnexureIdentifier] = useState('A');
  const [newAnnexureTitle, setNewAnnexureTitle] = useState('');
  const [newAnnexureFile, setNewAnnexureFile] = useState<File | null>(null);
  const [newAnnexureSha256, setNewAnnexureSha256] = useState('');
  const [isHashingAnnexure, setIsHashingAnnexure] = useState(false);
  const [annexureError, setAnnexureError] = useState<string | null>(null);

  // Resolve active commissioner
  const activePro = verifiedPros.find(p => p.id === selectedProId) || verifiedPros[0];

  // Check if active selected commissioner has conflict
  const activeProConflict = activePro ? checkCommissionerConflict({
    currentUser,
    commissioner: activePro,
    deponentSelectionType,
    uploaderFirm,
    isJudicialMatterHandling
  }) : { hasConflict: false };

  // Calculate Fees
  const baseServiceFeeUGX = activePro?.indicativeFeeUGX || 25000;
  const exhibitFeePerUnit = 5000;
  const exhibitFeeUGX = hasAnnexures ? annexuresList.length * exhibitFeePerUnit : 0;
  const subtotalUGX = baseServiceFeeUGX + exhibitFeeUGX;
  // Flat WALAYI platform fee (no longer a percentage of the service fee).
  const platformFeeUGX = WALAYI_PLATFORM_FEE_UGX;
  const totalAmountUGX = subtotalUGX + platformFeeUGX;

  // Cryptographic hashing helper
  const computeSha256 = async (str: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const processSelectedFile = async (file: File) => {
    setFileName(file.name);
    setFileSizeKb(Math.round(file.size / 1024));
    setIsHashing(true);
    
    if (!documentTitle) {
      const cleanName = file.name.replace(/\.(pdf|docx?|doc)$/i, '').replace(/[-_]/g, ' ');
      setDocumentTitle(cleanName || (documentType === 'affidavit_general' ? 'Sworn Affidavit' : documentType === 'statutory_declaration' ? 'Statutory Declaration' : 'Legal Instrument'));
    }

    const textSample = `${file.name}-${file.size}-${Date.now()}`;
    const hash = await computeSha256(textSample);
    setSha256Hash(hash);
    setIsHashing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setFileName('');
    setFileSizeKb(0);
    setSha256Hash('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnnexureFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewAnnexureFile(file);
      setIsHashingAnnexure(true);
      const textSample = `${file.name}-${file.size}-${Date.now()}`;
      const hash = await computeSha256(textSample);
      setNewAnnexureSha256(hash);
      setIsHashingAnnexure(false);
    }
  };

  const handleAddAnnexure = () => {
    setAnnexureError(null);
    const cleanId = newAnnexureIdentifier.trim().toUpperCase();
    if (!cleanId) {
      setAnnexureError('Annexure Identifier (e.g. A, B, C, D1) cannot be empty.');
      return;
    }
    if (annexuresList.some(a => a.identifier.toUpperCase() === cleanId)) {
      setAnnexureError(`Annexure "${cleanId}" already exists. Identifiers must be unique.`);
      return;
    }
    if (!newAnnexureFile && !newAnnexureSha256) {
      setAnnexureError('Please select a file for this annexure.');
      return;
    }

    const newAnnexure: AnnexureItem = {
      id: `annex-${Date.now()}-${cleanId}`,
      identifier: cleanId,
      description: newAnnexureTitle || `Exhibit marked "${cleanId}"`,
      fileName: newAnnexureFile ? newAnnexureFile.name : `Exhibit_${cleanId}_Document.pdf`,
      fileSize: newAnnexureFile ? `${Math.round(newAnnexureFile.size / 1024)} KB` : '185 KB',
      sha256: newAnnexureSha256 || '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
      uploadedAt: new Date().toISOString(),
      status: 'CONFIRMED'
    };

    const nextChar = String.fromCharCode(cleanId.charCodeAt(0) + 1);
    setAnnexuresList(prev => [...prev, newAnnexure]);
    setNewAnnexureIdentifier(nextChar.match(/[A-Z]/) ? nextChar : '');
    setNewAnnexureTitle('');
    setNewAnnexureFile(null);
    setNewAnnexureSha256('');
  };

  const handleRemoveAnnexure = (id: string) => {
    setAnnexuresList(prev => prev.filter(a => a.id !== id));
  };

  // If active selected commissioner has a conflict when entering step 2, auto-select first valid one
  useEffect(() => {
    if (step === 2) {
      const isCurrentConflict = activePro ? checkCommissionerConflict({
        currentUser,
        commissioner: activePro,
        deponentSelectionType,
        uploaderFirm,
        isJudicialMatterHandling
      }).hasConflict : false;

      if (isCurrentConflict) {
        const validAlternative = verifiedPros.find(p => !checkCommissionerConflict({
          currentUser,
          commissioner: p,
          deponentSelectionType,
          uploaderFirm,
          isJudicialMatterHandling
        }).hasConflict);

        if (validAlternative) {
          setSelectedProId(validAlternative.id);
        }
      }
    }
  }, [step, deponentSelectionType, uploaderFirm, isJudicialMatterHandling]);

  // Final payment execution & transaction creation
  const handleCreateAndPay = async (confirmedTxn?: PaymentTransaction, feeRef?: string) => {
    if (!activePro) {
      addNotification(
        'No Commissioner Available',
        'No commissioner has registered yet. Please check back once a commissioner has signed up.',
        'ALERT'
      );
      return;
    }
    if (activeProConflict.hasConflict) {
      setConflictModalData({
        commissionerName: activePro.fullName,
        ruleViolated: activeProConflict.ruleViolated,
        reason: activeProConflict.reason,
        advice: activeProConflict.advice
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const wording = getStatutoryOathText(solemnisationType, language);

      const effectiveDeponentName = deponentSelectionType === 'self' ? currentUser.fullName : (deponentFullName.trim() || 'Deponent Client');
      const effectiveDeponentNin = deponentSelectionType === 'self' ? (currentUser.nationalIdNumber || deponentNin) : (deponentNin.trim() || 'CF92018104LK7A');

      const createdReq = await createCommissioningRequest({
        documentTitle: documentTitle || 'Statutory Affidavit',
        documentType,
        fileName,
        fileSizeKb,
        documentSha256: sha256Hash,
        deponentName: effectiveDeponentName,
        deponentNin: effectiveDeponentNin,
        deponentPhone: momoPhone,
        deponentEmail: currentUser.email,
        assignedProfessionalId: activePro.id,
        assignedProfessionalName: activePro.fullName,
        assignedProfessionalAuthority: activePro.role as AuthorityType,
        assignedProfessionalStation: activePro.stationCity,
        uploaderFirm: uploaderFirm.trim() || null,
        commissionerFirm: activePro.firmName || activePro.lawFirmName || null,
        isJudicialConflict: isJudicialMatterHandling,
        judicialConflictDetails: isJudicialMatterHandling ? {
          type: 'case_before_judicial_officer',
          judicialOfficerId: currentUser.id,
          matterDescription: documentTitle
        } : null,
        deponentSelectionType,
        solemnisationType,
        ceremonyLanguage: language,
        statutoryWordingUsed: wording,
        hasAnnexures: hasAnnexures && annexuresList.length > 0,
        annexures: hasAnnexures ? annexuresList : [],
        annexuresConfirmed: hasAnnexures && annexuresList.length > 0,
        serviceFeeUGX: baseServiceFeeUGX,
        exhibitFeeUGX,
        platformFeeUGX,
        totalAmountUGX,
        paymentMethod: confirmedTxn?.provider || paymentProvider,
        paymentReference: feeRef || confirmedTxn?.transactionRef || `WY-FEE-${Date.now()}`,
        paymentStatus: 'ESCROWED'
      });

      setPaymentDone(true);
      setIsProcessingPayment(false);
      setActiveCommissioningId(createdReq.id);
      setStep(4); // Completion
    } catch (err) {
      console.error(err);
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16" id="commissioning-flow-container">
      
      {/* Flow Header */}
      <div className="mb-6 space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0097A7] text-xs font-bold font-mono-code border border-teal-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          STATUTORY COMMISSIONING • STEP {step} OF 3
        </div>
        <h1 className="text-2xl sm:text-3xl font-display-legal font-bold text-[#0D1B3D]">
          Digital Affidavit & Oath Commissioning
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          Statutory verification with automatic ethical safeguards under Uganda Cap. 5 & the Advocates Act.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[
          { num: 1, label: 'Document & Deponent' },
          { num: 2, label: 'Select Commissioner' },
          { num: 3, label: 'Escrow Payment' }
        ].map((item) => (
          <div key={item.num} className="flex items-center gap-2">
            <div 
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                step === item.num 
                  ? 'bg-[#0097A7] text-white shadow-xs' 
                  : step > item.num 
                    ? 'bg-teal-50 text-[#0097A7] border border-teal-200' 
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span>{item.num}.</span>
              <span className="hidden sm:inline">{item.label}</span>
            </div>
            {item.num < 3 && <div className="w-4 h-0.5 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: Document Upload & Conflict Questions (Part 4) */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 space-y-8 shadow-sm">
          
          <div className="space-y-1 text-center">
            <h2 className="text-xl sm:text-2xl font-display-legal font-black text-[#0D1B3D] uppercase tracking-tight">
              UPLOAD DOCUMENT & DISCLOSURES
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              STEP 01 — PREPARE INSTRUMENT & ETHICAL CLASSIFICATION
            </p>
          </div>

          <div className="space-y-6">
            
            {/* PART 4: Step 1 — Deponent Selection */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#0097A7]" />
                    Who is the Deponent?
                  </label>
                  <span className="text-[10px] font-mono-code text-slate-400">Rule 1 & 2 Safeguard</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Who will be swearing the oath and signing the statutory instrument?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeponentSelectionType('self')}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                    deponentSelectionType === 'self'
                      ? 'bg-blue-50 border-[#0097A7] text-[#0D1B3D] shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                  id="deponent-radio-self"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">I am the Deponent</span>
                    {deponentSelectionType === 'self' && <Check className="w-4 h-4 text-[#0097A7]" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    I will personally appear via secure video link and sign this document.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeponentSelectionType('on_behalf')}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                    deponentSelectionType === 'on_behalf'
                      ? 'bg-blue-50 border-[#0097A7] text-[#0D1B3D] shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                  id="deponent-radio-onbehalf"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Submitting for Someone Else</span>
                    {deponentSelectionType === 'on_behalf' && <Check className="w-4 h-4 text-[#0097A7]" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    I am an Advocate, law clerk, or firm representative uploading for a client.
                  </p>
                </button>
              </div>

              {/* On behalf conditional inputs */}
              {deponentSelectionType === 'on_behalf' && (
                <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Deponent's Full Name (Client)</label>
                    <input
                      type="text"
                      value={deponentFullName}
                      onChange={(e) => setDeponentFullName(e.target.value)}
                      placeholder="e.g. Grace Nakato"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                      id="input-deponent-fullname"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Deponent NIN (National ID)</label>
                    <input
                      type="text"
                      value={deponentNin}
                      onChange={(e) => setDeponentNin(e.target.value)}
                      placeholder="e.g. CM92018104LK7A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono-code focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                      id="input-deponent-nin"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Uploader Law Practice / Firm</label>
                    <input
                      type="text"
                      value={uploaderFirm}
                      onChange={(e) => setUploaderFirm(e.target.value)}
                      placeholder="e.g. Lovelock Advocates"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                      id="input-uploader-firm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ROLE-BASED CONFLICT DISCLOSURE & SAFEGUARDS */}
            {isJudicialUser ? (
              /* CASE 1: JUDICIAL OFFICER CONFLICT DISCLOSURE (Rule 3) */
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3" id="conflict-panel-judicial">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wider">
                      <Gavel className="w-4 h-4 text-amber-600" />
                      Judicial Conflict Disclosure (Rule 3)
                    </div>
                    <p className="text-[11px] text-amber-900 leading-snug">
                      Presiding Officer: <strong>{currentUser.fullName}</strong> ({currentUser.judicialTitle || 'Judicial Officer'}, {currentUser.court || 'Court of Judicature'}).
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Is this document arising from a matter you are personally handling or presiding over in court?
                    </p>
                  </div>
                  <span className="text-[9px] font-mono-code bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                    Rule 3
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsJudicialMatterHandling(false)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      !isJudicialMatterHandling
                        ? 'bg-white border-amber-500 text-amber-950 font-bold shadow-xs'
                        : 'bg-amber-100/50 border-amber-200/60 text-amber-900/70 hover:bg-white'
                    }`}
                    id="judicial-conflict-no"
                  >
                    <div className="text-xs">No, this matter is outside my court</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Standard independent statutory oath</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsJudicialMatterHandling(true)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isJudicialMatterHandling
                        ? 'bg-amber-600 border-amber-700 text-white font-bold shadow-sm'
                        : 'bg-amber-100/50 border-amber-200/60 text-amber-900/70 hover:bg-white'
                    }`}
                    id="judicial-conflict-yes"
                  >
                    <div className="text-xs">Yes, this matter is before my court</div>
                    <div className="text-[9px] text-amber-100 mt-0.5">Presiding officer in this cause/suit</div>
                  </button>
                </div>

                {isJudicialMatterHandling && (
                  <div className="p-3.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs space-y-1 animate-fadeIn" id="judicial-conflict-warning-banner">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>⚠️ JUDICIAL CONFLICT RECORDED</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-900">
                      Under judicial ethics and impartiality rules, a Judicial Officer cannot commission documents from matters they are presiding over. You will be directed to select an independent external Commissioner for Oaths in Step 2.
                    </p>
                  </div>
                )}
              </div>
            ) : isAdvocateUser ? (
              /* CASE 2: ADVOCATE / LAW FIRM CONFLICT DISCLOSURE (Rule 2) */
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3" id="conflict-panel-advocate">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-blue-950 uppercase tracking-wider">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Advocate & Firm Conflict Safeguard (Rule 2)
                    </div>
                    <p className="text-[11px] text-blue-900 leading-snug">
                      Counsel on Record: <strong>{currentUser.fullName}</strong> ({currentUser.firmName || currentUser.lawFirmName || 'Law Firm'}).
                    </p>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Section 9 of the Advocates Act & Cap. 5 strictly prohibit an advocate or commissioner from administering an oath in a matter where their law firm is on record. Commissioners from <strong>{currentUser.firmName || currentUser.lawFirmName || 'your firm'}</strong> will be automatically marked as conflicted in Step 2.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono-code bg-blue-200/80 text-blue-950 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                    Rule 2
                  </span>
                </div>
              </div>
            ) : isCommissionerUser ? (
              /* CASE 3: COMMISSIONER SELF-COMMISSIONING SAFEGUARD (Rule 1) */
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3" id="conflict-panel-commissioner">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Commissioner Self-Commissioning Safeguard (Rule 1)
                    </div>
                    <p className="text-[11px] text-indigo-900 leading-snug">
                      Gazetted Commissioner: <strong>{currentUser.fullName}</strong>.
                    </p>
                    {deponentSelectionType === 'self' ? (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Self-Commissioning Prohibited</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Because you are the deponent on this instrument, you cannot administer your own oath. An independent Commissioner must be selected in Step 2.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-indigo-800 leading-relaxed">
                        You are uploading on behalf of a client. You may commission if your firm is not on record, or assign to an independent peer.
                      </p>
                    )}
                  </div>
                  <span className="text-[9px] font-mono-code bg-indigo-200/80 text-indigo-950 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                    Rule 1
                  </span>
                </div>
              </div>
            ) : (
              /* CASE 4: INDEPENDENT CITIZEN / DEPONENT (No professional conflict) */
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3" id="conflict-panel-citizen">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Independent Deponent Verification:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    No judicial or firm conflict on record. You will select an independent verified Commissioner for Oaths in Step 2.
                  </p>
                </div>
              </div>
            )}

            {/* Document Type Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['AFFIDAVIT', 'DECLARATION', 'OTHER'] as const).map((opt) => {
                  const isSelected = 
                    (documentType === 'affidavit_general' && opt === 'AFFIDAVIT') || 
                    (documentType === 'statutory_declaration' && opt === 'DECLARATION') ||
                    (documentType === 'other' && opt === 'OTHER');
                  
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const newType = opt === 'AFFIDAVIT' ? 'affidavit_general' : opt === 'DECLARATION' ? 'statutory_declaration' : 'other';
                        setDocumentType(newType);
                      }}
                      className={`py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-[#0097A7] text-[#0097A7] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                      id={`btn-doctype-${opt.toLowerCase()}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Upload Area */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                SELECT PDF OR WORD INSTRUMENT
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept={ACCEPTED_DOCUMENT_FORMATS}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />

              {!fileName ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 relative select-none ${
                    isDragging
                      ? 'border-[#0097A7] bg-teal-50/80 ring-4 ring-[#0097A7]/20 scale-[1.01]'
                      : 'border-slate-200 hover:border-[#0097A7] bg-slate-50/60 hover:bg-teal-50/20'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  id="dropzone-document-upload"
                >
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0097A7] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <FileUp className="w-7 h-7" />
                  </div>

                  <div className="space-y-1 max-w-sm">
                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Drag and drop document here
                    </div>
                    <p className="text-xs text-slate-400 font-medium">or</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#0097A7] hover:bg-[#00838F] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    id="btn-trigger-upload-picker"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Document</span>
                  </button>

                  <p className="text-[10px] text-slate-400 font-mono-code pt-1">
                    Supported formats: PDF or Word — .pdf, .doc, .docx (Max 25MB)
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-3xl bg-teal-50/60 border-2 border-[#0097A7] space-y-4 animate-fadeIn">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#0097A7] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-600 text-white font-mono-code">
                            DOCUMENT ATTACHED
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">
                          {fileName}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono-code">
                          {fileSizeKb} KB • SHA-256 SECURED
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Remove and choose another document"
                      id="btn-remove-uploaded-file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {isHashing ? (
                    <div className="flex items-center gap-2 text-xs font-mono-code text-[#0097A7] animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Computing cryptographic SHA-256 fingerprint...</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-white border border-teal-100 flex items-center justify-between text-[10px] font-mono-code text-slate-600">
                      <span className="text-slate-400 font-bold">DIGEST:</span>
                      <span className="text-[#0097A7] font-semibold truncate ml-2 max-w-[280px]">{sha256Hash}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      id="btn-replace-document"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#0097A7]" />
                      <span>Change Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      id="btn-clear-document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Annexures / Exhibits Option */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                  ANNEXURES / EXHIBITS?
                </h3>
                <p className="text-xs text-slate-400">Attach supporting statutory exhibits to this instrument.</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setHasAnnexures(true)}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    hasAnnexures ? 'bg-[#0097A7] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasAnnexures(false);
                    setAnnexuresList([]);
                  }}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    !hasAnnexures ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {hasAnnexures && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attached Exhibits</span>
                  <div className="text-[10px] font-black text-[#0097A7] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                    {annexuresList.length} ITEMS ATTACHED
                  </div>
                </div>

                {annexuresList.length > 0 && (
                  <div className="space-y-2">
                    {annexuresList.map((annex) => (
                      <div key={annex.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-[#0097A7] text-white flex items-center justify-center font-black text-[10px] shrink-0">
                            {annex.identifier}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{annex.description}</p>
                            <p className="text-[10px] text-slate-400 font-mono-code">{annex.fileName} • {annex.fileSize}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnnexure(annex.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remove Exhibit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={newAnnexureIdentifier}
                      onChange={(e) => setNewAnnexureIdentifier(e.target.value.toUpperCase())}
                      className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-black text-xs text-center uppercase"
                      placeholder="A"
                      title="Exhibit Identifier"
                    />
                    <input
                      type="text"
                      value={newAnnexureTitle}
                      onChange={(e) => setNewAnnexureTitle(e.target.value)}
                      className="sm:col-span-5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold"
                      placeholder="Exhibit Description (e.g. National ID Copy)"
                    />
                    <div className="sm:col-span-3">
                      <input
                        type="file"
                        id="annex-file-input"
                        accept={ACCEPTED_DOCUMENT_FORMATS}
                        onChange={handleAnnexureFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('annex-file-input')?.click()}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold truncate flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                          newAnnexureFile 
                            ? 'bg-teal-50 border-teal-300 text-[#0097A7]' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{newAnnexureFile ? newAnnexureFile.name : 'Select File'}</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAnnexure}
                      className="sm:col-span-2 py-2.5 rounded-xl bg-[#0097A7] hover:bg-[#00838F] text-white font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-sm flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ADD
                    </button>
                  </div>

                  {annexureError && (
                    <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {annexureError}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!fileName}
            className="w-full py-5 rounded-2xl bg-[#0097A7] hover:bg-[#00838F] disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95"
            id="btn-step1-next"
          >
            CONTINUE TO COMMISSIONER SELECTION
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Commissioner Selection with Ethical Filtering (Part 5 & 6) */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 space-y-8 shadow-sm animate-fadeIn">
          
          <div className="space-y-1 text-center">
            <h2 className="text-xl sm:text-2xl font-display-legal font-black text-[#0D1B3D] uppercase tracking-tight">
              SELECT COMMISSIONER FOR OATHS
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              STEP 02 — ETHICAL COMMISSIONER SELECTION (CAP. 5 SAFEGUARDS)
            </p>
          </div>

          {/* Ethical Safeguard Active Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 space-y-0.5">
              <span className="font-bold uppercase tracking-wider text-[11px]">Automatic Conflict Prevention Active:</span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                WALAYI enforces statutory ethical standards under Uganda Law. Practitioners from your firm, yourself as deponent, or judicial officers presiding over this matter cannot be selected.
              </p>
            </div>
          </div>

          {/* Commissioner Cards List */}
          <div className="space-y-3" id="commissioner-selection-list">
            {verifiedPros.length === 0 && (
              <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-1" id="no-commissioners-available">
                <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
                <p className="text-xs font-bold text-amber-900">No commissioners are registered yet</p>
                <p className="text-[11px] text-amber-700">
                  Check back once a commissioner for oaths has signed up on WALAYI.
                </p>
              </div>
            )}
            {verifiedPros.map((pro) => {
              const conflictCheck = checkCommissionerConflict({
                currentUser,
                commissioner: pro,
                deponentSelectionType,
                uploaderFirm,
                isJudicialMatterHandling
              });

              const isSelected = selectedProId === pro.id;
              const hasConflict = conflictCheck.hasConflict;

              return (
                <div
                  key={pro.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                    hasConflict
                      ? 'bg-slate-50/90 border-slate-200 opacity-80'
                      : isSelected
                        ? 'bg-teal-50/50 border-[#0097A7] shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                  id={`commissioner-card-${pro.id}`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar
                          src={pro.avatarUrl || null}
                          name={pro.fullName}
                          size="lg"
                          shape="rounded"
                          className="border border-slate-200 shadow-xs"
                        />
                        {pro.availableNow && !hasConflict && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            {pro.fullName}
                          </h4>
                          <span className="text-[9px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            VERIFIED
                          </span>
                        </div>

                        {/* Professional Category & Title */}
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-600 font-medium">
                          <span className="font-bold text-[#0097A7]">
                            {pro.isJudicialOfficer || pro.professionalCategory === 'judicial_officer'
                              ? `Judicial Officer • ${pro.judicialTitle || 'Magistrate'}`
                              : pro.professionalCategory === 'justice_of_the_peace'
                                ? 'Justice of the Peace'
                                : pro.professionalCategory === 'notary_public'
                                  ? 'Notary Public'
                                  : 'Commissioner for Oaths • Advocate'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {pro.stationCity}
                          </span>
                        </div>

                        {/* Firm & Court details */}
                        <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {(pro.firmName || pro.lawFirmName) && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              Firm: <strong className="text-slate-700">{pro.firmName || pro.lawFirmName}</strong>
                            </span>
                          )}
                          {pro.court && (
                            <span className="flex items-center gap-1">
                              <Gavel className="w-3 h-3 text-amber-500" />
                              Court: <strong className="text-slate-700">{pro.court}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side Fee and Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Fee</div>
                        <div className="text-xs sm:text-sm font-black font-mono-code text-slate-900">
                          UGX {pro.indicativeFeeUGX.toLocaleString()}
                        </div>
                      </div>

                      {hasConflict ? (
                        <button
                          type="button"
                          onClick={() => {
                            setConflictModalData({
                              commissionerName: pro.fullName,
                              ruleViolated: conflictCheck.ruleViolated,
                              reason: conflictCheck.reason,
                              advice: conflictCheck.advice
                            });
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                          id={`btn-conflict-reason-${pro.id}`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Conflict Warning</span>
                        </button>
                      ) : isSelected ? (
                        <div className="px-4 py-2 rounded-xl bg-[#0097A7] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                          <Check className="w-4 h-4" />
                          <span>Selected</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedProId(pro.id)}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#0097A7] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          id={`btn-select-commissioner-${pro.id}`}
                        >
                          Select
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Inline Conflict Banner if conflicted */}
                  {hasConflict && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-start gap-2 text-[11px] text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold">{conflictCheck.reason}</span>
                        <p className="text-[10px] text-amber-800 mt-0.5">{conflictCheck.advice}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 py-4 rounded-2xl border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              BACK
            </button>

            <button
              type="button"
              disabled={!activePro || activeProConflict.hasConflict}
              onClick={() => {
                if (!activePro) return;
                if (activeProConflict.hasConflict) {
                  setConflictModalData({
                    commissionerName: activePro.fullName,
                    ruleViolated: activeProConflict.ruleViolated,
                    reason: activeProConflict.reason,
                    advice: activeProConflict.advice
                  });
                  return;
                }
                setStep(3);
              }}
              className="flex-1 py-4 rounded-2xl bg-[#0097A7] hover:bg-[#00838F] disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              id="btn-step2-next"
            >
              CONTINUE TO PAYMENT
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Confirmation & Platform Fee */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-display-legal font-black text-[#0D1B3D] uppercase tracking-tight">
              STATUTORY ESCROW & OATH SPECIFICATION
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              STEP 03 — WALAYI PLATFORM FEE
            </p>

            {/* Solemnisation Type (Bible / Quran / Affirmation) */}
            <div className="pt-4 max-w-xl mx-auto space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Solemnisation / Oath Form
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'holy_bible', label: 'Holy Bible', sub: 'Christian Oath' },
                  { id: 'holy_quran', label: 'Holy Quran', sub: 'Islamic Oath' },
                  { id: 'statutory_affirmation', label: 'Affirmation', sub: 'Solemn Promise' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSolemnisationType(opt.id as any)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      solemnisationType === opt.id
                        ? 'bg-blue-50 border-[#0097A7] text-[#0D1B3D] font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Fee Confirmation Sheet */}
          <PlatformFeeSheet
            amountUGX={totalAmountUGX}
            serviceFeeUGX={baseServiceFeeUGX + exhibitFeeUGX}
            platformFeeUGX={platformFeeUGX}
            deponentName={deponentSelectionType === 'self' ? currentUser.fullName : (deponentFullName.trim() || 'Deponent Client')}
            deponentPhone={momoPhone}
            documentTitle={documentTitle || 'Statutory Affidavit'}
            commissionerName={activePro?.fullName}
            onPaymentSuccess={(txn, feeRef) => {
              handleCreateAndPay(txn, feeRef);
            }}
            onCancel={() => setStep(2)}
          />

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Success / Document Locked */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-emerald-200 text-center space-y-6 shadow-sm animate-fadeIn">
          
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-display-legal font-bold text-slate-900">
              Payment Confirmed & Document Locked
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your statutory affidavit and {annexuresList.length} attached exhibit(s) have been verified with SHA-256 and locked in escrow. {activePro?.fullName} is ready to preside over your digital oath ceremony.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Presiding Commissioner:</span>
              <span className="font-semibold text-slate-900">{activePro?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Document Digest:</span>
              <span className="font-mono-code text-blue-700 text-[10px] truncate max-w-[180px]">{sha256Hash}</span>
            </div>
            {annexuresList.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Annexures Attached:</span>
                <span className="font-mono-code text-slate-900 font-semibold">{annexuresList.length} Exhibits</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Escrow Reference:</span>
              <span className="font-mono-code text-emerald-700">ESCROW-UG-{Date.now().toString().slice(-6)}</span>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('room')}
            className="w-full max-w-md mx-auto py-4 rounded-2xl bg-[#0097A7] hover:bg-[#00838F] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
            id="btn-launch-commissioning-room"
          >
            <Video className="w-5 h-5" />
            Launch Secure Commissioning Room
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFLICT EXPLANATION MODAL (Clean Professional Warning) */}
      {/* ========================================================================= */}
      {conflictModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="conflict-explanation-modal">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 text-slate-900 animate-fadeIn">
            
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-rose-600">
                    Statutory Ethical Guard
                  </span>
                  <h3 className="text-base font-black uppercase text-slate-900">
                    Conflict of Interest Detected
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConflictModalData(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <div className="text-xs font-bold text-rose-950">
                {conflictModalData.reason}
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                {conflictModalData.advice}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-900">Statutory Legal Framework:</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                <li>Commissioners for Oaths (Advocates) Act, Cap. 5, Laws of Uganda</li>
                <li>Advocates (Professional Conduct and Etiquette) Regulations</li>
                <li>Uganda Code of Judicial Conduct (Impartiality Mandate)</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setConflictModalData(null)}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              id="btn-close-conflict-modal"
            >
              Understand & Select Independent Commissioner
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
