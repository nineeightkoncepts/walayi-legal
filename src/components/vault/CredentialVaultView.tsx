import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CredentialDocument, AuthorityType } from '../../types';
import { SignatureVaultStudio } from './SignatureVaultStudio';
import { SealStudio } from './SealStudio';
import { uploadCredentialDocument, formatFileSize } from '../../services/documentStorageService';
import { 
  Lock, 
  ShieldCheck, 
  Upload, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  PlusCircle, 
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  PenTool,
  Award
} from 'lucide-react';

export const CredentialVaultView: React.FC = () => {
  const { 
    currentUser, 
    credentialDocs, 
    submitCredentialDocument, 
    setCurrentView 
  } = useApp();

  const [vaultTab, setVaultTab] = useState<'CREDENTIALS' | 'SIGNATURE' | 'SEAL'>('CREDENTIALS');
  const [isUploading, setIsUploading] = useState(false);
  const [docName, setDocName] = useState('2027 Practising Certificate Renewal');
  const [docType, setDocType] = useState<CredentialDocument['type']>('practising_certificate');
  const [validUntil, setValidUntil] = useState('2027-12-31');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const myDocs = credentialDocs[currentUser.id] || [];

  const handleUploadNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    // A document title alone proves nothing — require the actual file
    // before this is queued for Master Admin review, otherwise an admin
    // ends up approving a renewal that was never really provided.
    if (!selectedFile) {
      setUploadError('Please select the actual certificate/warrant file before submitting.');
      return;
    }

    setIsSubmittingUpload(true);
    try {
      const uploaded = await uploadCredentialDocument(currentUser.id, selectedFile);
      submitCredentialDocument(currentUser.id, {
        name: docName,
        type: docType,
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size),
        fileUrl: uploaded.url,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: validUntil,
        issuingAuthority: 'Uganda Law Council / High Court of Uganda',
        verificationReference: `ULC-REN-${Date.now().toString().slice(-5)}`
      });
      setIsUploading(false);
      setSelectedFile(null);
    } catch (err: any) {
      setUploadError(`Could not upload this document: ${err?.message || 'unknown error'}. Please try again.`);
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto" id="credential-vault-container">
      
      {/* Top Nav Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-3 no-scrollbar">
        <button
          onClick={() => setVaultTab('CREDENTIALS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            vaultTab === 'CREDENTIALS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          id="tab-vault-credentials"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Practising Certificates & Warrants</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-code font-bold bg-white/20">
            {myDocs.length}
          </span>
        </button>

        <button
          onClick={() => setVaultTab('SIGNATURE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            vaultTab === 'SIGNATURE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          id="tab-vault-signature"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>My Professional Signature</span>
          {currentUser.signatureDataUrl && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-code font-bold bg-emerald-100 text-emerald-800">
              Active
            </span>
          )}
        </button>

        <button
          onClick={() => setVaultTab('SEAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            vaultTab === 'SEAL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          id="tab-vault-seal"
        >
          <Award className="w-3.5 h-3.5" />
          <span>WALAYI Professional Seal Studio</span>
        </button>
      </div>

      {/* Signature Vault Tab Content */}
      {vaultTab === 'SIGNATURE' && <SignatureVaultStudio />}

      {/* Seal Studio Tab Content */}
      {vaultTab === 'SEAL' && <SealStudio />}

      {/* Credentials Tab Content */}
      {vaultTab === 'CREDENTIALS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 font-mono-code px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                WALAYI SECURE CREDENTIAL VAULT
              </div>
              <h1 className="text-2xl font-display-legal font-bold text-slate-900">
                Professional Authority & Credential Vault
              </h1>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Private vault storing official warrants, practising certificates, and gazette notices. The marketplace exposes only cryptographic verification status, never raw confidential documents.
              </p>
            </div>

            <button
              onClick={() => setIsUploading(!isUploading)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap transition-colors"
              id="btn-vault-upload-cert"
            >
              <PlusCircle className="w-4 h-4" />
              Upload New Credential / Renewal
            </button>
          </div>

          {/* Upload New Document Form */}
          {isUploading && (
            <form onSubmit={handleUploadNew} className="p-6 rounded-3xl bg-white border border-blue-200 space-y-4 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Upload Authority Document / Annual Renewal
                </h3>
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 2027 Practising Certificate"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="practising_certificate">Practising Certificate (Annual)</option>
                    <option value="chief_justice_commission">Chief Justice CFO Commission</option>
                    <option value="notarial_appointment">Notary Public Warrant</option>
                    <option value="judicial_warrant">Judicial Instrument</option>
                    <option value="jp_gazette_notice">JP Gazette Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document File</label>
                <label
                  htmlFor="vault-input-doc-file"
                  className="p-3 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-between text-xs cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate text-slate-800 font-medium">
                      {selectedFile ? selectedFile.name : 'Click to select PDF/JPG/PNG file…'}
                    </span>
                  </div>
                  {selectedFile ? (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded shrink-0">Selected</span>
                  ) : (
                    <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </label>
                <input
                  id="vault-input-doc-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpload}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  id="btn-confirm-vault-upload"
                >
                  {isSubmittingUpload ? 'Uploading…' : 'Submit to Master Admin Review'}
                </button>
              </div>
            </form>
          )}

          {/* Active Authority Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentUser.authorities.map((auth, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-code uppercase font-bold text-slate-500">
                    {auth.basis || 'STATUTORY BASIS'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
                    auth.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    auth.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {auth.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 capitalize">
                  {(auth.type || '').replace(/_/g, ' ')}
                </h3>

                <div className="text-[11px] text-slate-500 font-mono-code space-y-0.5">
                  {auth.licenceNumber && <div>Licence: <strong className="text-slate-800">{auth.licenceNumber}</strong></div>}
                  {auth.practisingCertificateYear && <div>PC Year: <strong className="text-slate-800">{auth.practisingCertificateYear}</strong></div>}
                  {auth.courtStation && <div>Station: <strong className="text-slate-800">{auth.courtStation}</strong></div>}
                  {auth.verifiedAt && <div>Verified: <span className="text-emerald-700 font-semibold">{auth.verifiedAt}</span></div>}
                </div>
              </div>
            ))}
          </div>

          {/* Document Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display-legal">
                <FileText className="w-4 h-4 text-blue-600" />
                Submitted Credential & Warrant Documents
              </h2>
              <span className="text-xs font-mono-code text-slate-500">
                {myDocs.length} Documents in Vault
              </span>
            </div>

            {myDocs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">No credential documents found in this vault.</p>
                <button
                  onClick={() => setIsUploading(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Upload First Credential
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-mono-code border-y border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Document Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Issuing Authority</th>
                      <th className="px-4 py-3">Validity</th>
                      <th className="px-4 py-3">Verification Ref</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {myDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{doc.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal font-mono-code block mt-0.5">
                            {doc.fileName} ({doc.fileSize})
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1.5 text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5"
                              >
                                View <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono-code text-[11px] capitalize">
                          {(doc.type || '').replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {doc.issuingAuthority}
                        </td>
                        <td className="px-4 py-3 font-mono-code text-[11px]">
                          {doc.validFrom} to <strong className="text-slate-900">{doc.validUntil}</strong>
                        </td>
                        <td className="px-4 py-3 font-mono-code text-blue-700 text-[11px]">
                          {doc.verificationReference}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono-code font-bold inline-flex items-center gap-1 ${
                            doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            doc.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {doc.status === 'VERIFIED' ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                            {doc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
