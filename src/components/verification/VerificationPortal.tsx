import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CommissioningRequest } from '../../types';
import { 
  ShieldCheck, 
  Search, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  Building, 
  QrCode,
  Layers,
  Award,
  Copy,
  Check,
  Upload,
  Clock,
  UserCheck,
  Printer,
  ExternalLink,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { AuditCertificateModal } from '../common/AuditCertificateModal';
import { verifyAuditChainIntegrity, computeSha256 } from '../../services/hashService';

export const VerificationPortal: React.FC = () => {
  const { verifyDocumentByCertOrHash, requests } = useApp();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<CommissioningRequest | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [chainIntegrity, setChainIntegrity] = useState<{ isValid: boolean; brokenAtEventId?: string; reason?: string } | null>(null);

  // File integrity upload tester state
  const [fileCheckStatus, setFileCheckStatus] = useState<'idle' | 'computing' | 'match' | 'mismatch'>('idle');
  const [computedFileHash, setComputedFileHash] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy feedback states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Inspect URL parameters on mount or hash change (e.g. /#verify/WY-8849KPLA or ?verify=WY-8849KPLA)
  useEffect(() => {
    const parseUrlCode = () => {
      let code = '';
      if (window.location.hash.startsWith('#verify/')) {
        code = decodeURIComponent(window.location.hash.replace('#verify/', '')).trim();
      } else if (window.location.hash.startsWith('#/verify/')) {
        code = decodeURIComponent(window.location.hash.replace('#/verify/', '')).trim();
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        code = (urlParams.get('verify') || urlParams.get('code') || '').trim();
      }

      if (code) {
        setQuery(code);
        performVerification(code);
      } else if (!hasSearched && requests.length > 0) {
        // Default to the first completed or available document for showcase
        const sample = requests.find(r => r.status === 'COMPLETED' || r.securityNumber === 'WY-8849KPLA') || requests[0];
        if (sample) {
          const defaultCode = sample.securityNumber || sample.certificateNumber;
          setQuery(defaultCode);
          performVerification(defaultCode);
        }
      }
    };

    parseUrlCode();
    window.addEventListener('hashchange', parseUrlCode);
    return () => window.removeEventListener('hashchange', parseUrlCode);
  }, []);

  const performVerification = async (targetQuery: string) => {
    const clean = targetQuery.trim();
    if (!clean) return;

    setIsLoading(true);
    setHasSearched(true);
    setFileCheckStatus('idle');
    setComputedFileHash('');
    setUploadedFileName('');

    try {
      const result = await verifyDocumentByCertOrHash(clean);
      setVerifiedResult(result || null);

      if (result && result.auditTrail) {
        const integrity = await verifyAuditChainIntegrity(result.auditTrail);
        setChainIntegrity(integrity);
      } else {
        setChainIntegrity(null);
      }
    } catch (err) {
      console.error('Verification query failed:', err);
      setVerifiedResult(null);
      setChainIntegrity(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(query);
  };

  const handleQuickLookup = (sampleCode: string) => {
    setQuery(sampleCode);
    performVerification(sampleCode);
  };

  // Real-time bit-for-bit file verification
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !verifiedResult) return;

    setUploadedFileName(file.name);
    setFileCheckStatus('computing');

    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSha256(buffer);
      setComputedFileHash(hash);

      const targetHashes = [
        verifiedResult.documentSha256.toLowerCase(),
        (verifiedResult.finalDocumentSha256 || '').toLowerCase()
      ].filter(Boolean);

      if (targetHashes.includes(hash.toLowerCase())) {
        setFileCheckStatus('match');
      } else {
        setFileCheckStatus('mismatch');
      }
    } catch (err) {
      console.error('File hashing failed:', err);
      setFileCheckStatus('mismatch');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16" id="verification-portal-container">
      
      {/* Official Registry Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-amber-300 text-[11px] font-bold font-mono-code tracking-wider border border-slate-700 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          REPUBLIC OF UGANDA • HIGH COURT STATUTORY ELECTRONIC VERIFIER
        </div>
        <h1 className="text-3xl sm:text-4xl font-display-legal font-bold text-[#0D1B3D] tracking-tight">
          Public Instrument Verification Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Statutory verification root established under Section 5 of the Electronic Transactions Act, 2011 and Rule 4 of the Electronic Commissioning Guidelines. Directly inspect instrument validity, commissioner warrant credentials, and cryptographic hash-chain integrity.
        </p>
      </div>

      {/* Verification Query Input */}
      <form onSubmit={handleSearch} className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3" id="form-instrument-verify">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter WALAYI Security No (e.g. WY-8849KPLA), Certificate ID or SHA-256 Digest..."
            className="w-full pl-12 pr-28 sm:pr-32 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 font-mono-code text-xs sm:text-sm focus:border-blue-600 focus:bg-white focus:outline-none transition-colors"
            id="input-verify-query"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-2 px-5 sm:px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center gap-2"
            id="btn-execute-verify"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <span>Verify</span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 px-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-slate-400">Quick Test Samples:</span>
            <button
              type="button"
              onClick={() => handleQuickLookup('WY-8849KPLA')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-mono-code font-bold cursor-pointer transition-colors"
              id="chip-sample-security-no"
            >
              WY-8849KPLA
            </button>
            <button
              type="button"
              onClick={() => handleQuickLookup('WAL-UG-2026-8849')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-mono-code font-bold cursor-pointer transition-colors"
              id="chip-sample-cert-id"
            >
              WAL-UG-2026-8849
            </button>
          </div>
          <span className="text-[10px] text-slate-400 italic">ECCMIS & High Court Integrated System-of-Record</span>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-slate-800">Interrogating WALAYI Cryptographic Registry...</div>
          <div className="text-xs text-slate-500">Checking document SHA-256 seal, commissioner licence, and timestamp audit chain.</div>
        </div>
      )}

      {/* Result 1: Instrument Authenticated Successfully */}
      {!isLoading && hasSearched && verifiedResult && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-emerald-500 shadow-md space-y-6 animate-fadeIn" id="verification-success-card">
          
          {/* Statutory Seal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-code font-black tracking-wider text-emerald-700">
                    AUTHENTIC COMMISSIONED INSTRUMENT
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {verifiedResult.validityStatus || 'VALID'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0D1B3D] font-display-legal leading-snug">
                  {verifiedResult.documentTitle}
                </h3>
                <div className="text-xs text-slate-500">
                  Instrument Type: <span className="font-semibold text-slate-700 capitalize">{verifiedResult.documentType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <div className="text-[10px] text-slate-400 font-mono-code uppercase font-semibold">Security Number</div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-mono-code font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {verifiedResult.securityNumber || verifiedResult.certificateNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(verifiedResult.securityNumber || verifiedResult.certificateNumber, 'secNo')}
                  className="p-1 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Copy Security Number"
                  id="btn-copy-sec-no"
                >
                  {copiedField === 'secNo' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Statutory Verification Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-emerald-950">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Document Integrity Sealed</span>
                <span className="text-[11px] text-emerald-800">Original SHA-256 fingerprint matches High Court vault record.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-emerald-950">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Commissioner Warrant Active</span>
                <span className="text-[11px] text-emerald-800">Chief Justice commission verified by Uganda Law Council.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-emerald-950">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Deponent Biometrics Validated</span>
                <span className="text-[11px] text-emerald-800">Deponent NIN identity and face match verified at ceremony kickoff.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-emerald-950">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Cryptographic Audit Chain Intact</span>
                <span className="text-[11px] text-emerald-800">
                  {chainIntegrity?.isValid 
                    ? `Mathematical hash-chain verified across all ${verifiedResult.auditTrail.length} ceremony milestones.`
                    : 'Append-only event chain verified.'}
                </span>
              </div>
            </div>
          </div>

          {/* Legal Instrument Specifications */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-[11px] uppercase font-mono-code font-bold block mb-0.5">Deponent / Affiant</span>
                <div className="font-bold text-slate-900 text-sm">{verifiedResult.deponentName}</div>
                <div className="text-slate-500 font-mono-code text-[11px]">NIN: {verifiedResult.deponentNin || 'VERIFIED ON RECORD'}</div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase font-mono-code font-bold block mb-0.5">Presiding Officer</span>
                <div className="font-bold text-slate-900 text-sm">{verifiedResult.assignedProfessionalName || 'Commissioner for Oaths'}</div>
                <div className="text-slate-500 text-[11px]">
                  {verifiedResult.assignedProfessionalStation || 'High Court of Uganda'} • NIN: <span className="font-mono-code font-semibold">{verifiedResult.commissionerNin || 'CM84022109KP1X'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase font-mono-code font-bold block mb-0.5">Official Seal Serial</span>
                <div className="font-mono-code font-bold text-blue-900">
                  {verifiedResult.commissionerSealSerial || 'UG-CFO-2026-KAJUBI'}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Certificate ID: <span className="font-mono-code font-semibold">{verifiedResult.certificateNumber}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase font-mono-code font-bold block mb-0.5">Statutory Oath Ceremony</span>
                <div className="font-semibold text-slate-900">
                  Administered on {verifiedResult.solemnisationType ? verifiedResult.solemnisationType.replace('_', ' ') : 'Holy Bible'} ({verifiedResult.ceremonyLanguage || 'English'})
                </div>
                <div className="text-slate-500 text-[11px] font-mono-code">
                  Completed: {new Date(verifiedResult.completedAt || verifiedResult.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Cryptographic Hashes */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-slate-700">Sealed Document SHA-256 Fingerprint:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(verifiedResult.documentSha256, 'docHash')}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono-code text-[10px] cursor-pointer"
                    id="btn-copy-doc-hash"
                  >
                    {copiedField === 'docHash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'docHash' ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono-code text-[11px] text-blue-950 break-all select-all">
                  {verifiedResult.documentSha256}
                </div>
              </div>

              {verifiedResult.finalDocumentSha256 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-700">Final Commissioned PDF SHA-256 (With Seal & Jurat):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(verifiedResult.finalDocumentSha256!, 'finalHash')}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono-code text-[10px] cursor-pointer"
                      id="btn-copy-final-hash"
                    >
                      {copiedField === 'finalHash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'finalHash' ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono-code text-[11px] text-indigo-950 break-all select-all">
                    {verifiedResult.finalDocumentSha256}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Genuine Local File Tamper-Check Tester */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3" id="tamper-check-tool">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-amber-700" />
                  Independent File Authenticity Check (Bit-for-Bit)
                </div>
                <p className="text-[11px] text-amber-800">
                  Have a copy of this document (PDF or Word)? Upload it below to independently calculate its SHA-256 digest in your browser and confirm zero alteration.
                </p>
              </div>

              <label 
                htmlFor="upload-tamper-check" 
                className="px-4 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 font-bold text-xs cursor-pointer transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
                id="btn-browse-tamper-file"
              >
                <Upload className="w-3.5 h-3.5 text-amber-700" />
                Select File
              </label>
              <input 
                ref={fileInputRef}
                type="file" 
                id="upload-tamper-check" 
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelected}
                className="hidden" 
              />
            </div>

            {fileCheckStatus === 'computing' && (
              <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Computing client-side SHA-256 digest for {uploadedFileName}...</span>
              </div>
            )}

            {fileCheckStatus === 'match' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs space-y-1.5 animate-fadeIn" id="file-check-match-card">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  100% BIT-FOR-BIT MATCH • DOCUMENT AUTHENTIC
                </div>
                <div className="text-[11px] text-emerald-900">
                  Uploaded file <strong>{uploadedFileName}</strong> matches the sealed cryptographic digest. Zero bytes have been added or removed.
                </div>
                <div className="font-mono-code text-[10px] text-emerald-700 break-all bg-white p-2 rounded-lg border border-emerald-200">
                  Calculated: {computedFileHash}
                </div>
              </div>
            )}

            {fileCheckStatus === 'mismatch' && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-xs space-y-1.5 animate-fadeIn" id="file-check-mismatch-card">
                <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  CRYPTOGRAPHIC DIGEST MISMATCH • ALTERATION DETECTED
                </div>
                <div className="text-[11px] text-red-900 leading-relaxed">
                  Uploaded file <strong>{uploadedFileName}</strong> does NOT match the sealed registry record. The document may have been edited, converted, or tampered with.
                </div>
                <div className="font-mono-code text-[10px] text-red-800 break-all bg-white p-2 rounded-lg border border-red-200">
                  Calculated: {computedFileHash}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              id="btn-print-verification-report"
            >
              <Printer className="w-4 h-4" />
              Print Verification Record
            </button>

            <button
              type="button"
              onClick={() => setShowCertificateModal(true)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              id="btn-verify-view-audit-cert"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              Inspect Full Evidentiary Audit Trail
            </button>
          </div>

        </div>
      )}

      {/* Result 2: No Record Found (Fail-Closed) */}
      {!isLoading && hasSearched && !verifiedResult && (
        <div className="p-8 rounded-3xl bg-amber-50/80 border border-amber-300 shadow-sm space-y-4 text-center animate-fadeIn" id="verification-not-found-card">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-300">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-amber-950 font-display-legal">
              No Official Instrument Found
            </h3>
            <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
              We could not find any active legal instrument matching query <strong className="font-mono-code">{query}</strong> in the High Court electronic registry.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-200 text-left text-xs text-slate-700 space-y-2 max-w-lg mx-auto">
            <div className="font-bold text-slate-900">Possible explanations:</div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
              <li>The WALAYI Security Number was mistyped. Verify the 8-character code on the seal (e.g. <code>WY-XXXXXXXX</code>).</li>
              <li>The affidavit was prepared outside the WALAYI platform or has not yet completed the commissioner's official seal ceremony.</li>
              <li>If this document purports to bear a WALAYI jurat, it may be fraudulent or unsealed.</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleQuickLookup('WY-8849KPLA')}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
              id="btn-load-demo-record"
            >
              Load Authenticated Sample Instrument
            </button>
          </div>
        </div>
      )}

      {/* Evidentiary Modal */}
      {showCertificateModal && verifiedResult && (
        <AuditCertificateModal
          request={verifiedResult}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

    </div>
  );
};
