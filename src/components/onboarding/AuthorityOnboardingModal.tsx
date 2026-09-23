import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuthorityType, LegalBasis } from '../../types';
import { 
  Scale, 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ChevronLeft, 
  FileText, 
  Building, 
  Lock, 
  Award,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const AuthorityOnboardingModal: React.FC = () => {
  const { 
    currentUser, 
    updateCurrentUser, 
    submitCredentialDocument, 
    setCurrentView 
  } = useApp();

  const [selectedAuthority, setSelectedAuthority] = useState<AuthorityType>('commissioner_for_oaths');
  const [step, setStep] = useState<number>(1);

  // Form Fields
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [lawFirmName, setLawFirmName] = useState(currentUser.lawFirmName || '');
  const [chambersAddress, setChambersAddress] = useState(currentUser.physicalChambersAddress || 'Plot 14 Lumumba Avenue, Kampala');
  const [stationCity, setStationCity] = useState(currentUser.stationCity || 'Kampala');
  const [nationalIdNumber, setNationalIdNumber] = useState(currentUser.nationalIdNumber || 'CM84022109KP1X');
  
  // Specific authority fields
  const [practisingCertYear, setPractisingCertYear] = useState<number>(2026);
  const [licenceNumber, setLicenceNumber] = useState<string>('CFO/2026/0491');
  const [courtStation, setCourtStation] = useState<string>('High Court of Uganda (Commercial Division)');
  const [judicialDesignation, setJudicialDesignation] = useState<string>('Senior Magistrate Grade One');
  const [jpGazetteReference, setJpGazetteReference] = useState<string>('Uganda Gazette Vol. CXVIII No. 24');

  // Uploaded docs
  const [uploadedPC, setUploadedPC] = useState<string>('Practising_Certificate_2026_LawCouncil.pdf');
  const [uploadedWarrant, setUploadedWarrant] = useState<string>('Chief_Justice_CFO_Commission_Warrant.pdf');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    let basis: LegalBasis = 'COMMISSIONER_ACT_CAP_5';
    if (selectedAuthority === 'notary_public') basis = 'NOTARIES_PUBLIC_ACT';
    if (selectedAuthority === 'judicial_officer') basis = 'JUDICIAL_OFFICE';
    if (selectedAuthority === 'justice_of_the_peace') basis = 'JUSTICES_OF_PEACE_ACT';

    // Submit credentials to private vault
    if (selectedAuthority === 'commissioner_for_oaths' || selectedAuthority === 'notary_public') {
      submitCredentialDocument(currentUser.id, {
        name: `2026 Practising Certificate (${fullName})`,
        type: 'practising_certificate',
        fileName: uploadedPC,
        fileSize: '1.4 MB',
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        issuingAuthority: 'Uganda Law Council / High Court of Uganda',
        verificationReference: `ULC-PC-2026-${Math.floor(1000 + Math.random() * 9000)}`
      });

      submitCredentialDocument(currentUser.id, {
        name: selectedAuthority === 'commissioner_for_oaths' 
          ? 'Chief Justice Commissioner for Oaths Appointment' 
          : 'High Court Notary Public Roll Warrant',
        type: selectedAuthority === 'commissioner_for_oaths' ? 'chief_justice_commission' : 'notarial_appointment',
        fileName: uploadedWarrant,
        fileSize: '2.3 MB',
        validFrom: '2024-01-01',
        validUntil: '2028-12-31',
        issuingAuthority: 'Office of the Chief Justice of Uganda',
        verificationReference: licenceNumber
      });
    } else if (selectedAuthority === 'judicial_officer') {
      submitCredentialDocument(currentUser.id, {
        name: `Judicial Instrument of Appointment (${judicialDesignation})`,
        type: 'judicial_warrant',
        fileName: 'Judicial_Service_Commission_Warrant.pdf',
        fileSize: '2.8 MB',
        validFrom: '2022-01-01',
        validUntil: '2035-12-31',
        issuingAuthority: 'Judicial Service Commission / Judiciary of Uganda',
        verificationReference: `JSC-JUD-${Date.now().toString().slice(-5)}`
      });
    } else {
      submitCredentialDocument(currentUser.id, {
        name: 'Uganda Gazette Notice of Appointment (JP)',
        type: 'jp_gazette_notice',
        fileName: 'Uganda_Gazette_JP_Appointment.pdf',
        fileSize: '1.9 MB',
        validFrom: '2025-01-01',
        validUntil: '2030-12-31',
        issuingAuthority: 'Minister of Justice & Constitutional Affairs',
        verificationReference: jpGazetteReference
      });
    }

    // Update user profile authorities state
    const isJudicial = selectedAuthority === 'judicial_officer';
    const profCat: 'judicial_officer' | 'commissioner_for_oaths' | 'justice_of_the_peace' | 'notary_public' | 'advocate' = 
      selectedAuthority === 'commissioner_for_oaths' ? 'commissioner_for_oaths' :
      selectedAuthority === 'judicial_officer' ? 'judicial_officer' :
      selectedAuthority === 'notary_public' ? 'notary_public' :
      selectedAuthority === 'justice_of_the_peace' ? 'justice_of_the_peace' : 'advocate';

    const persisted = await updateCurrentUser({
      fullName,
      lawFirmName: isJudicial ? undefined : (lawFirmName || undefined),
      firmName: isJudicial ? null : (lawFirmName || null),
      physicalChambersAddress: chambersAddress,
      stationCity,
      nationalIdNumber,
      professionalCategory: profCat,
      isJudicialOfficer: isJudicial,
      judicialTitle: isJudicial ? judicialDesignation : null,
      court: isJudicial ? courtStation : null,
      role: selectedAuthority === 'commissioner_for_oaths' ? 'commissioner' :
            selectedAuthority === 'notary_public' ? 'notary' :
            selectedAuthority === 'judicial_officer' ? 'judicial_officer' : 'justice_of_peace',
      // Re-entering PENDING here (rather than leaving whatever it was)
      // matters if this account was previously REJECTED/SUSPENDED and is
      // now re-declaring a fresh authority — it belongs back in the
      // Master Admin's review queue, not stuck in its old decision.
      admissionStatus: 'PENDING',
      authorities: [
        ...currentUser.authorities,
        {
          type: selectedAuthority,
          status: 'UNDER_REVIEW',
          basis,
          licenceNumber,
          courtStation,
          practisingCertificateYear: practisingCertYear,
          institutionalDesignation: selectedAuthority === 'judicial_officer' ? judicialDesignation : undefined
        }
      ]
    });

    setIsSubmitting(false);

    if (!persisted) {
      // updateCurrentUser already surfaced a notification with the reason —
      // this inline error keeps the person from believing they're done
      // (and heading off to wait for an admission decision that will never
      // come) when the write to their account actually failed.
      setSubmitError('This could not be saved to your account. Please check your connection and try submitting again — do not assume you\'re registered until this succeeds.');
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto pb-16" id="onboarding-flow-container">
      
      {/* Header */}
      <div className="mb-6 space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono-code border border-blue-200">
          <Scale className="w-3.5 h-3.5" />
          LEGAL AUTHORITY ONBOARDING & CREDENTIAL ENROLMENT
        </div>
        <h1 className="text-2xl sm:text-3xl font-display-legal font-bold text-slate-900">
          What legal authority do you have to perform this service?
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          WALAYI enforces strict statutory credential validation. Only verified legal practitioners and appointed officers can join the marketplace.
        </p>
      </div>

      {!isSubmitted ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-sm">
          
          {/* STEP 1: Authority Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider font-mono-code">
              Select Your Primary Legal Authority
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* CFO */}
              <div
                onClick={() => setSelectedAuthority('commissioner_for_oaths')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedAuthority === 'commissioner_for_oaths'
                    ? 'bg-blue-50/70 border-2 border-blue-600 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                id="onboard-opt-cfo"
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1 text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Commissioner for Oaths
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Advocate holding a valid {new Date().getFullYear()} Practising Certificate & Chief Justice Commission (Cap. 5).
                </p>
              </div>

              {/* Notary */}
              <div
                onClick={() => setSelectedAuthority('notary_public')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedAuthority === 'notary_public'
                    ? 'bg-blue-50/70 border-2 border-blue-600 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                id="onboard-opt-notary"
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1 text-slate-900">
                  <Award className="w-4 h-4 text-blue-600" />
                  Notary Public
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enrolled Notary Public under the Notaries Public Act, Cap. 18 with active practising status.
                </p>
              </div>

              {/* Judicial Officer */}
              <div
                onClick={() => setSelectedAuthority('judicial_officer')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedAuthority === 'judicial_officer'
                    ? 'bg-blue-50/70 border-2 border-blue-600 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                id="onboard-opt-judicial"
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1 text-slate-900">
                  <Building className="w-4 h-4 text-blue-600" />
                  Judicial Officer (Ex-Officio)
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Authority derived directly from Judicial Office (Magistrates Courts Act / Judicature Act).
                </p>
              </div>

              {/* Justice of Peace */}
              <div
                onClick={() => setSelectedAuthority('justice_of_the_peace')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedAuthority === 'justice_of_the_peace'
                    ? 'bg-blue-50/70 border-2 border-blue-600 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                id="onboard-opt-jp"
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1 text-slate-900">
                  <Scale className="w-4 h-4 text-blue-600" />
                  Justice of the Peace
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Appointed by the Minister under Justices of the Peace Act, Cap. 15 (includes prison officers).
                </p>
              </div>

            </div>
          </div>

          {/* Form details */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name (as appears on roll/gazette)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  id="input-onboard-fullname"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  National ID Number (NIRA NIN)
                </label>
                <input
                  type="text"
                  required
                  value={nationalIdNumber}
                  onChange={(e) => setNationalIdNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono-code text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="CM..."
                  id="input-onboard-nin"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Law Firm Chambers / Institution
                </label>
                <input
                  type="text"
                  value={lawFirmName}
                  onChange={(e) => setLawFirmName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Mukasa & Associates Advocates"
                  id="input-onboard-firm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Station / Court Location
                </label>
                <select
                  value={stationCity}
                  onChange={(e) => setStationCity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  id="select-onboard-station"
                >
                  <option value="Kampala (Commercial Division)">Kampala (Commercial Division)</option>
                  <option value="Kampala (Civil Division)">Kampala (Civil Division)</option>
                  <option value="Jinja">Jinja</option>
                  <option value="Gulu">Gulu</option>
                  <option value="Mbarara">Mbarara</option>
                  <option value="Entebbe">Entebbe</option>
                  <option value="Fort Portal">Fort Portal</option>
                  <option value="Mbale">Mbale</option>
                </select>
              </div>
            </div>

            {/* Authority-Specific Mandatory Proofs */}
            {(selectedAuthority === 'commissioner_for_oaths' || selectedAuthority === 'notary_public') && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono-code">
                  Statutory Advocate Verification Proofs
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Current Year Practising Certificate (2026)
                    </label>
                    <div className="p-3 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate text-slate-800 font-medium">{uploadedPC}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Uploaded</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {selectedAuthority === 'commissioner_for_oaths' 
                        ? 'Chief Justice Commission Warrant (Cap. 5)' 
                        : 'Notary Public Roll Enrolment Warrant'}
                    </label>
                    <div className="p-3 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate text-slate-800 font-medium">{uploadedWarrant}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Uploaded</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic">
                  Note: The system validates that the practising certificate is current for the relevant year ({practisingCertYear}). If expired, marketplace visibility is suspended until renewed.
                </div>
              </div>
            )}

            {selectedAuthority === 'judicial_officer' && (
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="text-xs font-bold text-blue-900">
                  AUTHORITY DERIVED FROM JUDICIAL OFFICE
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Judicial Officers are not required to upload a separate Chief Justice Commissioner for Oaths appointment. Legal authority arises ex-officio from judicial office under the Magistrates Courts Act & Judicature Act.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mt-2 mb-1">
                    Official Judicial Designation
                  </label>
                  <input
                    type="text"
                    value={judicialDesignation}
                    onChange={(e) => setJudicialDesignation(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. Chief Magistrate / Registrar"
                  />
                </div>
              </div>
            )}

            {selectedAuthority === 'justice_of_the_peace' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  JUSTICE OF THE PEACE APPOINTMENT VERIFICATION
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Authority must be verified according to the Uganda Gazette notice or formal ministerial appointment instrument (Justices of the Peace Act, Cap. 15).
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mt-2 mb-1">
                    Uganda Gazette Reference / Prison Service ID
                  </label>
                  <input
                    type="text"
                    value={jpGazetteReference}
                    onChange={(e) => setJpGazetteReference(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono-code focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                id="btn-submit-authority-application"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSubmitting ? 'Saving…' : 'Submit Credentials For Compliance Review'}
              </button>
            </div>

          </form>

        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-6 shadow-sm">
          
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-display-legal font-bold text-slate-900">
              Authority Application Submitted
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your credentials have been securely stored in your private Credential Vault and placed in the Super Admin compliance review queue.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Authority Requested:</span>
              <span className="font-bold text-slate-900 capitalize">{selectedAuthority.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                UNDER REVIEW
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Marketplace Visibility:</span>
              <span className="text-slate-600 font-medium">Pending Super Admin Verification</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentView('vault')}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              id="btn-onboard-go-vault"
            >
              <Lock className="w-4 h-4" />
              View Credential Vault
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              id="btn-onboard-go-admin"
            >
              <Scale className="w-4 h-4" />
              Switch to Super Admin Review Queue
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
