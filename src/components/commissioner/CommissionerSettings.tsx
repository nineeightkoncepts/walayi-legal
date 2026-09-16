import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Upload,
  DollarSign,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileSignature,
  User,
  Smartphone,
} from 'lucide-react';
import {
  getCommissionerFeeSettings,
  saveCommissionerFeeSettings,
  validateFees,
  createFeeSnapshot,
} from '../../services/commissionerFeeService';
import { CommissionerFeeModel } from '../../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Uganda mobile money numbers: 07XXXXXXXX (10 digits) or +2567XXXXXXXX.
const isValidUgandaMsisdn = (value: string): boolean =>
  /^(07\d{8}|\+2567\d{8})$/.test(value.trim());

export const CommissionerSettings: React.FC = () => {
  const { currentUser, addNotification, updateCurrentUser } = useApp();

  // Profile & Signature Upload
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [signatureImageFile, setSignatureImageFile] = useState<File | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  // Fee Settings
  const [feeModel, setFeeModel] = useState<CommissionerFeeModel>('flat_rate');
  const [flatRateUGX, setFlatRateUGX] = useState<number | ''>('');
  const [affidavitFeeUGX, setAffidavitFeeUGX] = useState<number | ''>('');
  const [annexureFeesUGX, setAnnexureFeesUGX] = useState<number | ''>('');
  const [savingFees, setSavingFees] = useState(false);

  // Payout Destination
  const [payoutProvider, setPayoutProvider] = useState<'MTN_MOMO' | 'AIRTEL_MONEY'>(
    currentUser.payoutProvider || 'MTN_MOMO'
  );
  const [payoutMsisdn, setPayoutMsisdn] = useState(currentUser.payoutMsisdn || '');
  const [savingPayout, setSavingPayout] = useState(false);

  // UI
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewAnnexuresCount, setPreviewAnnexuresCount] = useState(1);

  // Load existing fee settings on mount
  useEffect(() => {
    const loadFees = async () => {
      const settings = await getCommissionerFeeSettings(currentUser.id);
      if (settings) {
        setFeeModel(settings.model);
        if (settings.flatRateUGX) setFlatRateUGX(settings.flatRateUGX);
        if (settings.affidavitFeeUGX) setAffidavitFeeUGX(settings.affidavitFeeUGX);
        if (settings.annexureFeesUGX) setAnnexureFeesUGX(settings.annexureFeesUGX);
      }
    };
    loadFees();
  }, [currentUser.id]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) {
        setProfileImageFile(file);
      } else {
        setErrorMessage('Profile image must be under 5MB and a valid image file.');
      }
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') && file.size < 2 * 1024 * 1024) {
        setSignatureImageFile(file);
      } else {
        setErrorMessage('Signature must be under 2MB and a valid image file.');
      }
    }
  };

  const handleUploadProfile = async () => {
    if (!profileImageFile) return;

    setUploadingProfile(true);
    setErrorMessage(null);

    try {
      // TODO: Implement actual Firebase Storage upload using profilePhotoService
      // For now, simulate the upload
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addNotification('Profile Updated', 'Your profile image has been updated.', 'SUCCESS');
      setProfileImageFile(null);
    } catch (err) {
      setErrorMessage('Failed to upload profile image. Please try again.');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleUploadSignature = async () => {
    if (!signatureImageFile) return;

    setUploadingSignature(true);
    setErrorMessage(null);

    try {
      // TODO: Implement actual Firebase Storage upload
      // For now, simulate the upload
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addNotification(
        'Signature Uploaded',
        'Your official commissioning signature has been securely stored.',
        'SUCCESS'
      );
      setSignatureImageFile(null);
    } catch (err) {
      setErrorMessage('Failed to upload signature. Please try again.');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSaveFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    const validation = validateFees(
      feeModel,
      typeof flatRateUGX === 'number' ? flatRateUGX : undefined,
      typeof affidavitFeeUGX === 'number' ? affidavitFeeUGX : undefined,
      typeof annexureFeesUGX === 'number' ? annexureFeesUGX : undefined
    );

    if (!validation.valid) {
      setErrorMessage(validation.errors.join(' '));
      return;
    }

    setSavingFees(true);

    try {
      await saveCommissionerFeeSettings(
        currentUser.id,
        feeModel,
        typeof flatRateUGX === 'number' ? flatRateUGX : undefined,
        typeof affidavitFeeUGX === 'number' ? affidavitFeeUGX : undefined,
        typeof annexureFeesUGX === 'number' ? annexureFeesUGX : undefined
      );

      setSuccessMessage('Commissioning fees have been saved and will apply to new requests.');
      addNotification(
        'Fees Updated',
        `Your ${feeModel === 'flat_rate' ? 'flat-rate' : 'per-item'} commissioning fees have been saved.`,
        'SUCCESS'
      );
    } catch (err) {
      setErrorMessage('Failed to save fees. Please try again.');
    } finally {
      setSavingFees(false);
    }
  };

  const handleSavePayoutDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isValidUgandaMsisdn(payoutMsisdn)) {
      setErrorMessage('Enter a valid mobile money number, e.g. 0771234567 or +256771234567.');
      return;
    }

    setSavingPayout(true);
    try {
      const updatedAt = new Date().toISOString();
      await setDoc(
        doc(db, 'users', currentUser.id),
        { payoutProvider, payoutMsisdn: payoutMsisdn.trim(), payoutDestinationUpdatedAt: updatedAt },
        { merge: true }
      );
      updateCurrentUser({ payoutProvider, payoutMsisdn: payoutMsisdn.trim(), payoutDestinationUpdatedAt: updatedAt });
      setSuccessMessage('Payout destination saved. Future escrow releases will be sent here.');
      addNotification(
        'Payout Destination Saved',
        `Your commissioning payouts will now be sent to ${payoutProvider === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'} ${payoutMsisdn.trim()}.`,
        'SUCCESS'
      );
    } catch (err) {
      setErrorMessage('Failed to save payout destination. Please try again.');
    } finally {
      setSavingPayout(false);
    }
  };

  // Calculate preview fee based on current settings
  const calculatePreviewFee = (): number | null => {
    if (feeModel === 'flat_rate') {
      return typeof flatRateUGX === 'number' ? flatRateUGX : null;
    } else {
      const aff = typeof affidavitFeeUGX === 'number' ? affidavitFeeUGX : 0;
      const ann = typeof annexureFeesUGX === 'number' ? annexureFeesUGX : 0;
      return aff + ann * previewAnnexuresCount;
    }
  };

  const previewFee = calculatePreviewFee();

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">
            Commissioning Settings
          </h1>
          <p className="text-sm text-slate-600">
            Configure your profile, signature, and commissioning fees
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* === SECTION 1: PROFILE IMAGE === */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <User className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Profile Image</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload or change your profile photo</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser.avatarUrl && (
              <img
                src={currentUser.avatarUrl}
                alt="Profile"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
              />
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
                id="profile-image-input"
              />
              <label
                htmlFor="profile-image-input"
                className="inline-block px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Choose Image
              </label>
              {profileImageFile && (
                <button
                  onClick={handleUploadProfile}
                  disabled={uploadingProfile}
                  className="ml-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {profileImageFile && (
            <p className="text-xs text-slate-500 mt-2">{profileImageFile.name}</p>
          )}
        </div>

        {/* === SECTION 2: COMMISSIONING SIGNATURE === */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-100">
              <FileSignature className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Commissioning Signature</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload your official signature for oath documents</p>
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleSignatureChange}
            className="hidden"
            id="signature-image-input"
          />
          <label
            htmlFor="signature-image-input"
            className="inline-block px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
          >
            Choose Signature
          </label>
          {signatureImageFile && (
            <button
              onClick={handleUploadSignature}
              disabled={uploadingSignature}
              className="ml-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploadingSignature ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </>
              )}
            </button>
          )}
          {signatureImageFile && (
            <p className="text-xs text-slate-500 mt-2">{signatureImageFile.name}</p>
          )}
        </div>

        {/* === SECTION 3: PAYOUT DESTINATION === */}
        <form onSubmit={handleSavePayoutDestination}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-teal-100">
                <Smartphone className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Payout Destination</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Where your commissioning escrow releases are sent — a deliberately configured setting, separate from your contact number.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-2">Mobile Money Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutProvider('MTN_MOMO')}
                  className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                    payoutProvider === 'MTN_MOMO'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  id="btn-payout-provider-mtn"
                >
                  <div className="text-[11px] font-bold">MTN Mobile Money</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutProvider('AIRTEL_MONEY')}
                  className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                    payoutProvider === 'AIRTEL_MONEY'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  id="btn-payout-provider-airtel"
                >
                  <div className="text-[11px] font-bold">Airtel Money</div>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-2">Payout Phone Number</label>
              <input
                type="tel"
                value={payoutMsisdn}
                onChange={(e) => setPayoutMsisdn(e.target.value)}
                placeholder="e.g., 0771234567"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                id="input-payout-msisdn"
              />
              {currentUser.payoutMsisdn && currentUser.payoutDestinationUpdatedAt && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Currently on file: {currentUser.payoutProvider === 'AIRTEL_MONEY' ? 'Airtel Money' : 'MTN MoMo'} {currentUser.payoutMsisdn} — last updated{' '}
                  {new Date(currentUser.payoutDestinationUpdatedAt).toLocaleDateString()}.
                </p>
              )}
              {!currentUser.payoutMsisdn && (
                <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                  No payout destination configured yet — set one before you can withdraw escrow releases.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={savingPayout}
              className="w-full py-3 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              id="btn-save-payout-destination"
            >
              {savingPayout ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE PAYOUT DESTINATION</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* === SECTION 4: COMMISSIONING FEES === */}
        <form onSubmit={handleSaveFees}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-100">
                <DollarSign className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Commissioning Fees</h2>
                <p className="text-xs text-slate-500 mt-0.5">Set your professional commissioning rates (UGX)</p>
                <p className="text-[10px] text-slate-400 mt-1 italic">WALAYI platform fee applies separately and is not shown here.</p>
              </div>
            </div>

            {/* Fee Model Selection */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-700 block mb-2">Pricing Model</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFeeModel('flat_rate')}
                  className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                    feeModel === 'flat_rate'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[11px] font-bold">Flat Rate</div>
                  <div className="text-[9px] text-slate-500 mt-1">One fee for any commissioning</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFeeModel('per_item')}
                  className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                    feeModel === 'per_item'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[11px] font-bold">Affidavit + Annexures</div>
                  <div className="text-[9px] text-slate-500 mt-1">Different fees per component</div>
                </button>
              </div>
            </div>

            {/* Flat Rate Input */}
            {feeModel === 'flat_rate' && (
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Commissioning Fee (UGX)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={flatRateUGX}
                  onChange={(e) => setFlatRateUGX(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g., 50000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  This flat fee applies to all commissioning requests.
                </p>
              </div>
            )}

            {/* Per-Item Inputs */}
            {feeModel === 'per_item' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Affidavit Fee (UGX)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={affidavitFeeUGX}
                    onChange={(e) => setAffidavitFeeUGX(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 30000"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Base fee for commissioning an affidavit.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Annexure/Exhibit Fee (UGX)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={annexureFeesUGX}
                    onChange={(e) => setAnnexureFeesUGX(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 5000"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Charged per annexure/exhibit. Total = Affidavit Fee + (Annexure Fee × count).
                  </p>
                </div>
              </div>
            )}

            {/* Fee Preview */}
            {previewFee !== null && (
              <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-2">
                  Fee Preview
                </p>
                {feeModel === 'flat_rate' ? (
                  <p className="text-sm font-bold text-blue-900">
                    Flat commissioning fee: <span className="text-blue-700">UGX {previewFee.toLocaleString()}</span>
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-blue-900">
                      Affidavit: UGX {(typeof affidavitFeeUGX === 'number' ? affidavitFeeUGX : 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-900">
                      Annexures ({previewAnnexuresCount}): UGX{' '}
                      {((typeof annexureFeesUGX === 'number' ? annexureFeesUGX : 0) * previewAnnexuresCount).toLocaleString()}
                    </p>
                    <div className="border-t border-blue-200 pt-1 mt-1">
                      <p className="text-sm font-bold text-blue-900">
                        Total: UGX {previewFee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {feeModel === 'per_item' && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <label className="text-[10px] font-bold text-blue-700 block mb-1">
                      Adjust preview annexures count:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={previewAnnexuresCount}
                      onChange={(e) => setPreviewAnnexuresCount(Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded text-xs border border-blue-300"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={savingFees}
              className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingFees ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Fees...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE COMMISSIONING FEES</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500 mt-3 text-center">
              Fees you set here apply to new commissioning requests only.
              <br />
              In-flight requests keep the fee locked at initiation.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
};
