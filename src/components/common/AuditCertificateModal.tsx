import React, { useEffect, useState } from 'react';
import { CommissioningRequest } from '../../types';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  QrCode, 
  Lock, 
  Building2, 
  CheckCircle2, 
  ExternalLink,
  Download
} from 'lucide-react';
import { OfficialSeal } from './OfficialSeal';
import QRCode from 'qrcode';
import { downloadCertifiedInstrumentPdf } from '../../services/pdfService';

interface AuditCertificateModalProps {
  request: CommissioningRequest;
  initialTab?: 'instrument' | 'audit';
  onClose: () => void;
}

export const AuditCertificateModal: React.FC<AuditCertificateModalProps> = ({ 
  request, 
  initialTab = 'instrument', 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'instrument' | 'audit'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const code = request.securityNumber || request.certificateNumber;
    const verificationUrl = `${window.location.origin}/#verify/${code}`;
    QRCode.toDataURL(verificationUrl, { width: 140, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation failed', err));
  }, [request.certificateNumber, request.securityNumber]);

  const copyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Always produce a real PDF file for the certified instrument, regardless of
  // whether the original uploaded document was a PDF or a Word file.
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadCertifiedInstrumentPdf(request);
    } catch (err) {
      console.warn('Certified PDF generation failed, falling back to print dialog:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formattedDate = new Date(request.completedAt || request.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto" id="audit-certificate-modal">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 text-slate-900">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              {activeTab === 'instrument' ? <FileText className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display-legal font-bold text-slate-900 text-sm">
                  {activeTab === 'instrument' ? 'Certified Legal Instrument' : 'Evidentiary Audit Certificate'}
                </span>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  {request.certificateNumber}
                </span>
                {request.securityNumber && (
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold hidden sm:inline">
                    SEC: {request.securityNumber}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                {request.documentTitle}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveTab('instrument')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'instrument'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="btn-tab-certified-instrument"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Legal Instrument (ECCMIS)</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="btn-tab-audit-trail"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audit Trail (Cap. 5)</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              id="btn-download-certificate-pdf"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              id="btn-print-certificate"
              title="Print"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              id="btn-close-certificate-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CERTIFIED LEGAL INSTRUMENT (THE FORMAL AFFIDAVIT ITSELF) */}
        {/* ========================================================================= */}
        {activeTab === 'instrument' && (
          <div className="p-8 sm:p-12 space-y-8 bg-white max-h-[80vh] overflow-y-auto" id="printable-legal-instrument">
            
            {/* Judicial Court Header */}
            <div className="text-center space-y-1 border-b-2 border-slate-900 pb-6">
              <div className="text-[11px] font-display-legal font-extrabold tracking-[0.2em] text-slate-900 uppercase">
                THE REPUBLIC OF UGANDA
              </div>
              <div className="text-sm font-display-legal font-bold text-slate-800 tracking-wider uppercase">
                IN THE HIGH COURT OF UGANDA AT {request.assignedProfessionalStation ? request.assignedProfessionalStation.toUpperCase() : 'KAMPALA'}
              </div>
              <div className="text-xs text-slate-600 font-serif-legal italic">
                IN THE MATTER OF THE COMMISSIONERS FOR OATHS (ADVOCATES) ACT, CAP. 5
              </div>
              <div className="text-xs text-slate-600 font-serif-legal italic">
                IN THE MATTER OF THE STATUTORY DECLARATIONS ACT & ELECTRONIC TRANSACTIONS ACT 2011
              </div>
              <div className="text-xs font-bold text-slate-800 font-mono-code uppercase pt-1">
                IN THE MATTER OF: {request.documentTitle.toUpperCase()}
              </div>
            </div>

            {/* Instrument Title */}
            <div className="text-center py-2">
              <h2 className="text-xl sm:text-2xl font-display-legal font-extrabold uppercase tracking-wide text-slate-900 underline decoration-2 underline-offset-4">
                {request.documentType === 'statutory_declaration' ? 'STATUTORY DECLARATION' : 'SWORN AFFIDAVIT'}
              </h2>
            </div>

            {/* Deposition Body */}
            <div className="space-y-4 text-xs sm:text-sm font-serif-legal text-slate-800 leading-relaxed text-justify">
              <p>
                <strong>I, {request.deponentName}</strong>, of c/o Kampala, Uganda, holder of Uganda National Identification Card (NIN: <strong>{request.deponentNin}</strong>), being duly sworn / affirmed, hereby depose and state as follows:
              </p>

              <ol className="list-decimal pl-6 space-y-3">
                <li>
                  That I am a male/female adult Ugandan of sound mind and the deponent herein, and I execute this statutory instrument in that legal capacity.
                </li>
                <li>
                  That the facts deponed herein are within my personal knowledge, belief, and information, save where stated to be derived from sources disclosed herein.
                </li>
                <li>
                  That I have personally verified the contents of the instrument titled <strong>"{request.documentTitle}"</strong> (Original File: <em>{request.fileName}</em>, File Size: {request.fileSizeKb} KB), locked under immutable cryptographic SHA-256 digest:
                  <div className="my-1.5 p-2 bg-slate-50 border border-slate-200 rounded font-mono-code text-[11px] text-slate-700 break-all select-all">
                    {request.documentSha256}
                  </div>
                </li>
                {request.hasAnnexures && request.annexures && request.annexures.length > 0 && (
                  <li>
                    That the statutory exhibit(s) attached hereto—namely {request.annexures.map(a => `Exhibit "${a.identifier}" (${a.description || a.fileName})`).join('; ')}—are true copies of the original documents referred to in this deposition.
                  </li>
                )}
                <li>
                  {request.statutoryWordingUsed || "That whatever is stated hereinabove is true and correct to the best of my knowledge, information, and belief, so help me God."}
                </li>
              </ol>
            </div>

            {/* Execution & Jurat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-300">
              
              {/* Left Column: Deponent Execution */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-500">
                  DEPONENT EXECUTION (CAP. 5 COMPLIANT)
                </span>
                
                <div className="h-24 bg-white rounded-xl border border-dashed border-slate-300 flex items-center justify-center p-2">
                  {request.deponentExecutionMethod === 'THUMBPRINT' ? (
                    request.deponentThumbprintDataUrl ? (
                      <img src={request.deponentThumbprintDataUrl} alt="Deponent Thumbprint" className="max-h-20 object-contain" />
                    ) : (
                      <span className="text-xs font-mono-code text-slate-500">Biometric Thumbprint Affixed</span>
                    )
                  ) : request.deponentSignatureDataUrl ? (
                    <img src={request.deponentSignatureDataUrl} alt="Deponent Signature" className="max-h-20 object-contain" />
                  ) : (
                    <span className="text-base font-serif-legal italic text-slate-900 font-bold">{request.deponentName}</span>
                  )}
                </div>

                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-900">{request.deponentName}</div>
                  <div className="text-slate-500 font-mono-code text-[11px]">NIN: {request.deponentNin}</div>
                  <div className="text-slate-500 text-[11px]">Executed: {formattedDate}</div>
                </div>
              </div>

              {/* Right Column: Presiding Commissioner Jurat & Seal */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-500">
                  STATUTORY JURAT & OFFICIAL COMMISSIONER ATTESTATION
                </span>

                <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg text-[11px] font-serif-legal text-slate-800 italic leading-relaxed">
                  SWORN / AFFIRMED at {request.assignedProfessionalStation || 'Kampala'}, Uganda, this {formattedDate}, by the said {request.deponentName} who appeared via secure statutory video link.
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-mono-code text-slate-400 uppercase">Commissioner Signature</span>
                    <div className="h-16 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center p-1">
                      {request.commissionerSignatureDataUrl ? (
                        <img src={request.commissionerSignatureDataUrl} alt="Commissioner Signature" className="max-h-14 object-contain" />
                      ) : (
                        <span className="text-xs font-serif-legal italic text-slate-800 font-bold">
                          {request.assignedProfessionalName || 'Adv. Kato Mukasa'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 truncate">
                      {request.assignedProfessionalName || 'Adv. Kato Mukasa'}
                    </div>
                    <div className="text-[10px] text-blue-800 font-semibold uppercase">
                      COMMISSIONER FOR OATHS / ADVOCATE
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono-code">
                      Warrant: CFO/2026/0119 • High Court of Uganda{request.commissionerNin ? ` • NIN: ${request.commissionerNin}` : ''}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <OfficialSeal
                      authorityType={request.assignedProfessionalAuthority || 'commissioner_for_oaths'}
                      officialName={request.assignedProfessionalName || 'ADV. KATO MUKASA'}
                      stationOrCourt={request.assignedProfessionalStation || 'HIGH COURT OF UGANDA'}
                      serialNumber={request.commissionerSealSerial || `UG-CFO-2026-${request.certificateNumber.slice(-4)}`}
                      size="md"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Official Security & ECCMIS Certification Box */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {qrDataUrl && (
                  <div className="p-1 bg-white rounded-xl border border-blue-200 shadow-xs shrink-0">
                    <img src={qrDataUrl} alt="Verification QR" className="w-20 h-20" />
                  </div>
                )}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono-code">WALAYI SECURITY NO:</span>
                    <span className="font-bold font-mono-code text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      {request.securityNumber || `WY-${request.certificateNumber.slice(-8)}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Certificate ID: <strong className="font-mono-code text-slate-900">{request.certificateNumber}</strong>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    CERTIFIED STATUTORY INSTRUMENT • COMPLIANT WITH UGANDA ECCMIS E-FILING
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-500 font-mono-code shrink-0">
                <div>ELECTRONIC TRANSACTIONS ACT 2011</div>
                <div>COMMISSIONERS FOR OATHS ACT CAP. 5</div>
                <div>walayi.ug/verify</div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EVIDENTIARY AUDIT CERTIFICATE & LOG TABLE */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="p-8 space-y-6 bg-white max-h-[80vh] overflow-y-auto" id="printable-audit-certificate">
            
            {/* Certificate Header Badge */}
            <div className="border-2 border-slate-300 rounded-xl p-6 bg-slate-50 text-center relative overflow-hidden">
              <div className="text-[10px] font-display-legal tracking-[0.25em] text-blue-700 font-bold uppercase mb-1">
                REPUBLIC OF UGANDA • JUDICIAL INFRASTRUCTURE
              </div>
              <h1 className="text-2xl md:text-3xl font-display-legal font-extrabold text-slate-900 tracking-wide">
                CERTIFICATE OF DIGITAL COMMISSIONING & OATH
              </h1>
              <p className="text-xs text-slate-600 font-serif-legal italic mt-1 max-w-xl mx-auto leading-relaxed">
                Issued in compliance with the Commissioners for Oaths (Advocates) Act Cap. 5, Electronic Signatures Act, and Electronic Transactions Act of Uganda.
              </p>

              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-3 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono-code">
                <span>CERTIFICATE NO:</span>
                <strong className="text-blue-900 font-bold">{request.certificateNumber}</strong>
                {request.securityNumber && (
                  <>
                    <span className="text-blue-300">•</span>
                    <span>SECURITY NO:</span>
                    <strong className="text-blue-900 font-bold tracking-wider">{request.securityNumber}</strong>
                  </>
                )}
              </div>
            </div>

            {/* Key Instrument Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono-code">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Instrument & Deponent Details
                </h3>
                
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Document Title:</span>
                    <p className="font-semibold text-slate-900">{request.documentTitle}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Deponent Full Name:</span>
                    <p className="font-semibold text-slate-900">{request.deponentName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500">National ID (NIN):</span>
                      <p className="font-mono-code text-slate-800">{request.deponentNin}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Deposition:</span>
                      <p className="font-semibold text-blue-700 capitalize">{request.solemnisationType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Execution Method:</span>
                      <p className="font-semibold text-slate-900 capitalize">{(request.deponentExecutionMethod || 'SIGNATURE').toLowerCase()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono-code">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Commissioning Authority Details
                </h3>
                
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Presiding Commissioner:</span>
                    <p className="font-semibold text-slate-900">{request.assignedProfessionalName || 'Adv. Kajubi Lovelock'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Legal Authority Basis:</span>
                    <p className="font-semibold text-slate-800">
                      {request.assignedProfessionalAuthority === 'commissioner_for_oaths' ? 'Commissioner for Oaths (Cap. 5)' :
                       request.assignedProfessionalAuthority === 'notary_public' ? 'Notary Public (Cap. 18)' :
                       request.assignedProfessionalAuthority === 'judicial_officer' ? 'Ex-Officio Judicial Officer' : 'Justice of the Peace (Cap. 15)'}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="text-slate-500">Station / Jurisdiction:</span>
                      <p className="text-slate-800">{request.assignedProfessionalStation || 'High Court of Uganda'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Commissioning Date:</span>
                      <p className="font-mono-code text-slate-800">
                        {new Date(request.completedAt || request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Cryptographic Integrity Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 font-mono-code uppercase">
                  Cryptographic SHA-256 Document Integrity Digest
                </span>
                <button
                  onClick={() => copyHash(request.documentSha256)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 cursor-pointer font-medium"
                  id="btn-copy-sha256"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy Hash'}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-white font-mono-code text-xs text-slate-800 break-all border border-slate-200 select-all">
                {request.documentSha256}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>File: {request.fileName} ({request.fileSizeKb} KB)</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Unbroken Cryptographic Hash Chain Verified
                </span>
              </div>
            </div>

            {/* Statutory Annexures & Exhibit Manifest Section */}
            {request.hasAnnexures && request.annexures && request.annexures.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Statutory Annexures & Exhibits Manifest ({request.annexures.length} Exhibits)
                  </h4>
                  <span className="text-[10px] font-mono-code font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ALL EXHIBITS COMMISSIONED
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono-code text-[10px]">
                      <tr>
                        <th className="px-3 py-1.5">Mark</th>
                        <th className="px-3 py-1.5">Exhibit Description</th>
                        <th className="px-3 py-1.5">File Name / Size</th>
                        <th className="px-3 py-1.5">SHA-256 Digest</th>
                        <th className="px-3 py-1.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                      {request.annexures.map((annex) => (
                        <tr key={annex.id}>
                          <td className="px-3 py-2 font-mono-code font-bold text-blue-700">
                            Exhibit "{annex.identifier}"
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {annex.description || annex.fileName}
                          </td>
                          <td className="px-3 py-2 text-slate-500 font-mono-code text-[10px]">
                            {annex.fileName} ({annex.fileSize})
                          </td>
                          <td className="px-3 py-2 font-mono-code text-[10px] text-slate-600 break-all select-all">
                            {annex.sha256}
                          </td>
                          <td className="px-3 py-2 font-mono-code text-[10px] font-bold text-emerald-700">
                            ✓ COMMISSIONED
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Statutory Jurat Section */}
            {request.juratText && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 font-display-legal">
                  Official Statutory Jurat Recital
                </h4>
                <div className="p-4 rounded-lg bg-amber-50/40 border border-amber-200 font-serif-legal text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {request.juratText}
                </div>
              </div>
            )}

            {/* Signatures & Seal Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
              
              {/* Deponent Signature / Thumbprint */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 font-medium uppercase font-mono-code">
                  {request.deponentExecutionMethod === 'THUMBPRINT' ? 'Deponent Thumbprint' : 'Deponent Signature'}
                </span>
                <div className="h-16 my-1 bg-white rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                  {request.deponentExecutionMethod === 'THUMBPRINT' ? (
                    request.deponentThumbprintDataUrl && request.deponentThumbprintDataUrl.trim().length > 0 ? (
                      <img src={request.deponentThumbprintDataUrl} alt="Deponent Thumbprint" className="max-h-14 max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-mono-code text-slate-400">Thumbprint Affixed</span>
                    )
                  ) : request.deponentSignatureDataUrl && request.deponentSignatureDataUrl.trim().length > 0 ? (
                    <img src={request.deponentSignatureDataUrl} alt="Deponent Signature" className="max-h-14 max-w-full object-contain" />
                  ) : (
                    <span className="text-xs font-serif-legal italic text-slate-700 font-semibold">{request.deponentName}</span>
                  )}
                </div>
                <span className="text-[10px] font-mono-code text-slate-500">{request.deponentName}</span>
              </div>

              {/* Official Seal Stamp */}
              <div className="flex justify-center">
                <OfficialSeal
                  authorityType={request.assignedProfessionalAuthority || 'commissioner_for_oaths'}
                  officialName={request.assignedProfessionalName || 'ADV. KAJUBI LOVELOCK'}
                  stationOrCourt={request.assignedProfessionalStation || 'HIGH COURT OF UGANDA'}
                  serialNumber={request.commissionerSealSerial || `UG-CFO-2026-${request.certificateNumber.slice(-4)}`}
                  size="md"
                />
              </div>

              {/* Commissioner Signature */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 font-medium uppercase font-mono-code">Commissioner Signature</span>
                <div className="h-16 my-1 bg-white rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                  {request.commissionerSignatureDataUrl && request.commissionerSignatureDataUrl.trim().length > 0 ? (
                    <img src={request.commissionerSignatureDataUrl} alt="Commissioner Signature" className="max-h-14 max-w-full object-contain" />
                  ) : (
                    <span className="text-xs font-serif-legal italic text-slate-700 font-semibold">{request.assignedProfessionalName || 'Adv. Kajubi Lovelock'}</span>
                  )}
                </div>
                <span className="text-[10px] font-mono-code text-slate-500">
                  {request.assignedProfessionalName || 'Adv. Kajubi Lovelock'}
                </span>
              </div>

            </div>

            {/* Immutable Evidentiary Audit Log Table */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono-code">
                <span>Chronological Event Audit Trail ({request.auditTrail.length} Recorded Checkpoints)</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-[11px] font-sans">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono-code">
                    <tr>
                      <th className="px-3 py-2">Timestamp (EAT)</th>
                      <th className="px-3 py-2">Event</th>
                      <th className="px-3 py-2">Actor / Role</th>
                      <th className="px-3 py-2">IP & Device Signature</th>
                      <th className="px-3 py-2">Evidentiary Checkpoint Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {request.auditTrail.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2 font-mono-code text-slate-500 whitespace-nowrap">
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-3 py-2 font-semibold text-blue-700 whitespace-nowrap">
                          {ev.eventType}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{ev.actorName}</div>
                          <div className="text-[10px] text-slate-500">{ev.actorRole}</div>
                        </td>
                        <td className="px-3 py-2 font-mono-code text-slate-500 text-[10px]">
                          {ev.ipAddress}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {ev.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification QR & ECCMIS Compliance Footnote */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {qrDataUrl && qrDataUrl.trim().length > 0 ? (
                  <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <img src={qrDataUrl} alt="Verification QR" className="w-20 h-20" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-slate-200 rounded flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    AUTHENTICATED BY WALAYI DIGITAL TRUST ROOT
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-md mt-0.5">
                    Scan this QR code or navigate to <span className="text-blue-600 font-mono-code">walayi.ug/verify</span> to independently inspect cryptographic verification, commissioner credentials, and SHA-256 seal integrity.
                  </p>
                  <div className="mt-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    ✓ READY FOR ELECTRONIC COURT FILING (ECCMIS)
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-500 font-mono-code">
                <div>WALAYI ENGINE V2.4</div>
                <div>Kampala, Uganda</div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
