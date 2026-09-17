import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  User, 
  Camera, 
  Upload, 
  RefreshCw, 
  Check, 
  X, 
  ShieldCheck, 
  Award, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Maximize2,
  Video,
  PenTool,
  Trash2,
  SwitchCamera,
  Layers,
  Crown,
  BookOpen,
  Info,
  LogIn
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { uploadProfilePhoto } from '../../services/profilePhotoService';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface ProfileAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAboutLegal?: () => void;
}

export const ProfileAccountModal: React.FC<ProfileAccountModalProps> = ({
  isOpen,
  onClose,
  onOpenAboutLegal
}) => {
  const { 
    currentUser, 
    updateCurrentUser, 
    isMasterAdmin, 
    isSignedIn,
    operatingView, 
    setOperatingView,
    setCurrentView,
    addNotification 
  } = useApp();

  // Form State for Particulars
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [stationCity, setStationCity] = useState(currentUser.stationCity || 'Kampala Central');
  const [nationalIdNumber, setNationalIdNumber] = useState(currentUser.nationalIdNumber || '');
  const [enrollmentNumber, setEnrollmentNumber] = useState(currentUser.enrollmentNumber || '');
  const [firmName, setFirmName] = useState(currentUser.firmName || currentUser.lawFirmName || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [professionalCategory, setProfessionalCategory] = useState<
    'commissioner_for_oaths' | 'judicial_officer' | 'justice_of_the_peace' | 'notary_public' | 'advocate' | 'other'
  >(
    currentUser.professionalCategory || 
    (currentUser.role === 'judicial_officer' ? 'judicial_officer' : 
     currentUser.role === 'commissioner' ? 'commissioner_for_oaths' : 
     currentUser.role === 'justice_of_peace' ? 'justice_of_the_peace' : 
     currentUser.role === 'notary' ? 'notary_public' : 'commissioner_for_oaths')
  );
  const [isJudicialOfficer, setIsJudicialOfficer] = useState<boolean>(
    currentUser.isJudicialOfficer || currentUser.role === 'judicial_officer' || false
  );
  const [judicialTitle, setJudicialTitle] = useState<string>(
    currentUser.judicialTitle || 'Magistrate'
  );
  const [court, setCourt] = useState<string>(
    currentUser.court || ''
  );

  // Photo Upload & Camera State
  const [activePhotoTab, setActivePhotoTab] = useState<'picker' | 'camera'>('picker');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>(currentUser.avatarUrl);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Signature State
  const [previewSignatureUrl, setPreviewSignatureUrl] = useState<string | undefined>(currentUser.signatureDataUrl);
  const signatureFileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isMirror, setIsMirror] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when currentUser changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser.fullName);
      setEmail(currentUser.email);
      setPhoneNumber(currentUser.phoneNumber || '');
      setStationCity(currentUser.stationCity || 'Kampala Central');
      setNationalIdNumber(currentUser.nationalIdNumber || '');
      setEnrollmentNumber(currentUser.enrollmentNumber || '');
      setFirmName(currentUser.firmName || currentUser.lawFirmName || '');
      setAddress(currentUser.address || '');
      setProfessionalCategory(
        currentUser.professionalCategory || 
        (currentUser.role === 'judicial_officer' ? 'judicial_officer' : 
         currentUser.role === 'commissioner' ? 'commissioner_for_oaths' : 
         currentUser.role === 'justice_of_peace' ? 'justice_of_the_peace' : 
         currentUser.role === 'notary' ? 'notary_public' : 'commissioner_for_oaths')
      );
      setIsJudicialOfficer(currentUser.isJudicialOfficer || currentUser.role === 'judicial_officer' || false);
      setJudicialTitle(currentUser.judicialTitle || 'Magistrate');
      setCourt(currentUser.court || '');
      setPreviewPhotoUrl(currentUser.avatarUrl);
      setPreviewSignatureUrl(currentUser.signatureDataUrl);
      setCapturedPhoto(null);
      setSaveSuccess(false);
    } else {
      stopCameraStream();
    }
  }, [isOpen, currentUser]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Enumerate all available camera video input devices (inbuilt, USB, webcams)
  const loadCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setCameraError('MediaDevices API is not supported on this browser or platform.');
        return;
      }

      // Query devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoInputs);

      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate camera devices:', err);
    }
  };

  // Start Camera Stream
  const startCameraStream = async (deviceIdToUse?: string) => {
    stopCameraStream();
    setCameraError(null);
    setCapturedPhoto(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const targetDeviceId = deviceIdToUse || selectedDeviceId;
      
      const constraints: MediaStreamConstraints = {
        video: targetDeviceId 
          ? { deviceId: { exact: targetDeviceId }, width: { ideal: 640 }, height: { ideal: 640 } }
          : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      // Reload device labels once permission is granted
      await loadCameraDevices();
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser or switch to image file upload.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No compatible camera found. Please connect an external USB webcam or use file upload.');
      } else {
        setCameraError(err.message || 'Unable to access camera. Please verify device connection.');
      }
    }
  };

  // Stop Camera Stream
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Switch to Camera Tab
  const handleSelectCameraTab = () => {
    setActivePhotoTab('camera');
    loadCameraDevices();
    startCameraStream();
  };

  // Switch to File Picker Tab
  const handleSelectPickerTab = () => {
    stopCameraStream();
    setActivePhotoTab('picker');
  };

  // Handle Device Change
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    startCameraStream(newDeviceId);
  };

  // Capture Snapshot from Video Frame
  const takeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop from center square
    const startX = ((video.videoWidth || size) - size) / 2;
    const startY = ((video.videoHeight || size) - size) / 2;

    if (isMirror) {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);
    setPreviewPhotoUrl(dataUrl);
    stopCameraStream();
  };

  // Retake photo
  const retakeSnapshot = () => {
    setCapturedPhoto(null);
    startCameraStream();
  };

  // Handle File Input from Image Picker (Hardened to Firebase Storage & Firestore)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const uploadedUrl = await uploadProfilePhoto(file, currentUser.id);
      setPreviewPhotoUrl(uploadedUrl);
      setCapturedPhoto(uploadedUrl);
      updateCurrentUser({ avatarUrl: uploadedUrl });
      addNotification(
        'Profile Photo Saved',
        'Your profile photograph has been hardened and saved to Firebase.',
        'SUCCESS'
      );
    } catch (err: any) {
      // Fallback to local data URL if offline/network error
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPreviewPhotoUrl(result);
          setCapturedPhoto(result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Signature File Input
  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG). Transparent PNG is preferred.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPreviewSignatureUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save All Particulars to App Context & Firestore
  const handleSaveParticulars = async () => {
    setIsSaving(true);

    try {
      const finalAvatar = previewPhotoUrl || currentUser.avatarUrl || '';
      const isJudicial = professionalCategory === 'judicial_officer' || isJudicialOfficer;
      const cleanFirm = firmName.trim() || null;

      updateCurrentUser({
        fullName: fullName.trim() || currentUser.fullName,
        email: email.trim() || currentUser.email,
        phoneNumber: phoneNumber.trim(),
        stationCity: stationCity.trim(),
        nationalIdNumber: nationalIdNumber.trim(),
        enrollmentNumber: enrollmentNumber.trim(),
        firmName: cleanFirm,
        lawFirmName: cleanFirm || undefined,
        address: address.trim(),
        professionalCategory,
        isJudicialOfficer: isJudicial,
        judicialTitle: isJudicial ? judicialTitle.trim() : null,
        court: isJudicial ? court.trim() : null,
        avatarUrl: finalAvatar,
        signatureDataUrl: previewSignatureUrl,
        signatureUploadedAt: previewSignatureUrl !== currentUser.signatureDataUrl ? new Date().toISOString() : currentUser.signatureUploadedAt,
        signatureType: 'UPLOADED'
      });

      // Save user profile to Firestore
      try {
        if (currentUser.id) {
          await setDoc(doc(db, 'users', currentUser.id), {
            id: currentUser.id,
            fullName: fullName.trim() || currentUser.fullName,
            email: email.trim() || currentUser.email,
            phone: phoneNumber.trim(),
            stationCity: stationCity.trim(),
            nationalIdNumber: nationalIdNumber.trim(),
            enrollmentNumber: enrollmentNumber.trim(),
            firmName: cleanFirm,
            lawFirmName: cleanFirm || null,
            address: address.trim(),
            professionalCategory,
            isJudicialOfficer: isJudicial,
            judicialTitle: isJudicial ? judicialTitle.trim() : null,
            court: isJudicial ? court.trim() : null,
            profilePhotoUrl: finalAvatar,
            avatarUrl: finalAvatar,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (fsErr) {
        console.warn('Firestore user profile sync notice:', fsErr);
      }

      setSaveSuccess(true);
      addNotification(
        'Profile Particulars Updated',
        'Your profile photograph and statutory particulars have been saved.',
        'SUCCESS'
      );

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto" id="user-profile-modal-root">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold font-display-legal text-white truncate">
                  User Profile & Account Particulars
                </h2>
                {isMasterAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono-code font-bold bg-amber-500 text-slate-950 shrink-0">
                    MASTER ADMIN
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                Manage statutory identity, verifiable photograph, and chambers credentials
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Close"
            id="btn-close-profile-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-700 text-sm">
          
          {/* Section 1: Photograph Upload Suite (Picker vs Live Camera) */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Official Profile Photograph & Identity Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload an official portrait or capture a live selfie with an inbuilt or external webcam
                </p>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleSelectPickerTab}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activePhotoTab === 'picker'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="tab-photo-picker"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Image Picker
                </button>
                <button
                  type="button"
                  onClick={handleSelectCameraTab}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activePhotoTab === 'camera'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="tab-photo-camera"
                >
                  <Video className="w-3.5 h-3.5" />
                  Live Camera
                </button>
              </div>
            </div>

            {/* Photo Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              
              {/* Left Column: Current / Preview Portrait Card */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to select and upload photograph"
                >
                  <UserAvatar
                    src={previewPhotoUrl}
                    name={fullName}
                    size="xl"
                    shape="rounded"
                    showUploadOverlay={true}
                    className="border-2 border-blue-600 shadow-md"
                  />
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-slate-900 text-amber-400 border border-slate-700 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{fullName}</div>
                  <div className="text-[10px] text-blue-700 font-mono-code font-bold uppercase mt-0.5">
                    {(currentUser.role || '').replace(/_/g, ' ')}
                  </div>
                </div>
                
                <div className="text-[10px] text-slate-400 font-mono-code flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Biometric Standard
                </div>
              </div>

              {/* Right Column: Active Capture / Upload Controls */}
              <div className="md:col-span-8 space-y-3">
                
                {/* Tab Content 1: Image Picker */}
                {activePhotoTab === 'picker' && (
                  <div className="p-4 bg-white rounded-2xl border border-dashed border-slate-300 hover:border-blue-500 transition-colors text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Choose photo from your device storage
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports PNG, JPG, JPEG, and WebP (Max 10MB)
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      id="input-profile-file-picker"
                    />

                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        id="btn-browse-photo-file"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Browse Files
                      </button>

                      {previewPhotoUrl !== currentUser.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewPhotoUrl(currentUser.avatarUrl);
                            setCapturedPhoto(null);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content 2: Live Camera with Device Selector (Inbuilt + Removable/External) */}
                {activePhotoTab === 'camera' && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3" id="camera-capture-suite">
                    
                    {/* Device Selector & Camera Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <select
                          value={selectedDeviceId}
                          onChange={handleDeviceChange}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 w-full"
                          id="select-camera-device"
                        >
                          {availableDevices.length === 0 ? (
                            <option value="">Default System Camera</option>
                          ) : (
                            availableDevices.map((device, idx) => (
                              <option key={device.deviceId || idx} value={device.deviceId}>
                                {device.label || `Camera Device ${idx + 1} (${device.deviceId.slice(0, 8)}...)`}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsMirror(!isMirror)}
                          className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            isMirror ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                          title="Mirror / Flip Selfie"
                          id="btn-toggle-mirror"
                        >
                          <SwitchCamera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startCameraStream()}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
                          title="Refresh Camera"
                          id="btn-refresh-camera"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Camera Video Viewport or Error */}
                    {cameraError ? (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2 text-center">
                        <AlertCircle className="w-5 h-5 mx-auto text-red-600" />
                        <p className="font-semibold">{cameraError}</p>
                        <button
                          type="button"
                          onClick={() => startCameraStream()}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer"
                        >
                          Retry Camera
                        </button>
                      </div>
                    ) : capturedPhoto && capturedPhoto.trim().length > 0 ? (
                      /* Snapshot Preview */
                      <div className="space-y-3 text-center">
                        <div className="relative inline-block mx-auto">
                          <img
                            src={capturedPhoto}
                            alt="Snapshot"
                            className="w-48 h-48 rounded-2xl object-cover border-2 border-emerald-500 shadow-md mx-auto"
                          />
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                            Captured
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={retakeSnapshot}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retake
                          </button>
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Ready to Save
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Live Video Stream Viewport */
                      <div className="space-y-3 text-center">
                        <div className="relative w-48 h-48 sm:w-52 sm:h-52 mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-inner flex items-center justify-center">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isMirror ? '-scale-x-100' : ''}`}
                          />
                          <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={takeSnapshot}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                            id="btn-take-selfie-snapshot"
                          >
                            <Camera className="w-4 h-4" />
                            Capture Photo
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>
          </div>

          {/* Section 2: My Signature (Part G & H) */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-blue-600" />
                  SIGNATURE & OFFICIAL SEAL
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your statutory signature and commissioner seal for instrument endorsement.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Signature Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature</span>
                {previewSignatureUrl && previewSignatureUrl.trim().length > 0 ? (
                  <div className="space-y-3">
                    <div className="relative group bg-slate-50 rounded-xl border border-slate-200 p-2 w-full h-24 flex items-center justify-center overflow-hidden">
                      <img
                        src={previewSignatureUrl}
                        alt="My Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => signatureFileInputRef.current?.click()}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSignatureUrl(undefined)}
                        className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold text-[10px] uppercase cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => signatureFileInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500">UPLOAD SIGNATURE</span>
                  </button>
                )}
              </div>

              {/* Official Seal Card (For Commissioners) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OFFICIAL SEAL / STAMP</span>
                {currentUser.role !== 'deponent' ? (
                  <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">UPLOAD SEAL (PNG)</span>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center p-4">
                    <Lock className="w-5 h-5 text-slate-300 mb-1" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Only available for Verified Commissioners</span>
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={signatureFileInputRef}
              onChange={handleSignatureFileChange}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />
          </div>

          {/* Section 3: Statutory Identity & Particulars Form */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Statutory Particulars & Chambers Record
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="e.g. Ambrose Enen"
                  id="profile-input-fullname"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    placeholder="user@example.com"
                    id="profile-input-email"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Phone Number (Uganda MoMo) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mobile Money / Phone Contact</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono-code font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    placeholder="e.g. +256 772 123456"
                    id="profile-input-phone"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Judicial Station / City */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">High Court Circuit / Station City</label>
                <div className="relative">
                  <select
                    value={stationCity}
                    onChange={(e) => setStationCity(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    id="profile-select-station"
                  >
                    <option value="Kampala Central">Kampala Central (Commercial / Civil Div.)</option>
                    <option value="Nakawa">Nakawa Circuit</option>
                    <option value="Jinja">Jinja Circuit</option>
                    <option value="Mbarara">Mbarara Circuit</option>
                    <option value="Gulu">Gulu Circuit</option>
                    <option value="Fort Portal">Fort Portal Circuit</option>
                    <option value="Mbale">Mbale Circuit</option>
                    <option value="Arua">Arua Circuit</option>
                    <option value="Soroti">Soroti Circuit</option>
                    <option value="Masaka">Masaka Circuit</option>
                    <option value="Mukono">Mukono Circuit</option>
                  </select>
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* National Identification Number (NIN) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">National ID (NIN)</label>
                <input
                  type="text"
                  value={nationalIdNumber}
                  onChange={(e) => setNationalIdNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono-code uppercase focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="e.g. CM89012345ABC"
                  id="profile-input-nin"
                />
              </div>

              {/* High Court Enrollment No (for Practitioners) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">High Court Roll / Warrant No.</label>
                <input
                  type="text"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono-code focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="e.g. HCR/2018/4891"
                  id="profile-input-enrollment"
                />
              </div>

              {/* Commissioner Specific Fields (Part H) */}
              {currentUser.role !== 'deponent' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">SCN Number (System Counsel No.)</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono-code focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      placeholder="e.g. SCN/2023/1234"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Practising Certificate No.</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono-code focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      placeholder="e.g. PC/2024/5678"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest text-blue-600">Commissioner Warrant / Gazetted Authority (PDF)</label>
                    <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-black text-slate-800 uppercase">Upload Appointment Warrant</div>
                        <div className="text-[9px] text-slate-400 font-bold">PDF, JPEG or PNG (MAX 10MB)</div>
                      </div>
                      <Upload className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </>
              )}

              {/* Chambers / Practice Firm */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Chambers / Law Practice / Organisation</label>
                  <span className="text-[10px] text-slate-400 font-medium">Used for firm conflict-of-interest detection</span>
                </div>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="e.g. Lovelock Advocates & Commissioners"
                  id="profile-input-firm"
                />
              </div>

              {/* Professional Category & Ethical Role */}
              <div className="space-y-2 sm:col-span-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Professional Category & Authority Type</label>
                  <span className="text-[10px] font-mono-code text-blue-600 font-bold uppercase">Ethical Safeguards</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'commissioner_for_oaths', label: 'Commissioner for Oaths', sub: 'Advocate (Cap. 5)' },
                    { id: 'judicial_officer', label: 'Judicial Officer', sub: 'Magistrate / Judge' },
                    { id: 'justice_of_the_peace', label: 'Justice of the Peace', sub: 'Statutory JP' },
                    { id: 'notary_public', label: 'Notary Public', sub: 'Cap. 18' },
                    { id: 'advocate', label: 'Advocate Only', sub: 'High Court Roll' },
                    { id: 'other', label: 'Other Deponent', sub: 'General User' }
                  ].map((cat) => {
                    const isSelected = professionalCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setProfessionalCategory(cat.id as any);
                          if (cat.id === 'judicial_officer') {
                            setIsJudicialOfficer(true);
                          } else {
                            setIsJudicialOfficer(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                        id={`profile-category-${cat.id}`}
                      >
                        <div className="text-[11px] font-bold leading-tight">{cat.label}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{cat.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Judicial Officer Details (When category is judicial_officer or isJudicialOfficer) */}
              {(professionalCategory === 'judicial_officer' || isJudicialOfficer) && (
                <div className="space-y-3 sm:col-span-2 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Judicial Officer Particulars & Ethics
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Judicial Title</label>
                      <select
                        value={judicialTitle}
                        onChange={(e) => setJudicialTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        id="profile-select-judicial-title"
                      >
                        <option value="Chief Magistrate">Chief Magistrate</option>
                        <option value="Grade One Magistrate">Grade One Magistrate</option>
                        <option value="High Court Judge">High Court Judge</option>
                        <option value="Justice of Appeal">Justice of Appeal</option>
                        <option value="Supreme Court Justice">Supreme Court Justice</option>
                        <option value="Registrar">Registrar / Deputy Registrar</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Court Station</label>
                      <input
                        type="text"
                        value={court}
                        onChange={(e) => setCourt(e.target.value)}
                        placeholder="e.g. Mengo Chief Magistrate Court"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                        id="profile-input-court"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-amber-800 leading-relaxed bg-amber-100/50 p-2.5 rounded-xl border border-amber-200">
                    <span className="font-bold">Uganda Judicial Conduct Rule:</span> Judicial Officers are strictly prohibited from commissioning affidavits or documents arising from matters they are personally handling or presiding over.
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Section 3: Master Admin Exclusive Role Switcher */}
          {isMasterAdmin && (
            <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Master Admin Role Governance
                  </span>
                </div>
                <span className="text-[10px] font-mono-code bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Exclusive Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Toggle your active platform role directly or test between roles:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    updateCurrentUser({ role: 'deponent' });
                    setOperatingView('USER');
                    setCurrentView('home');
                    addNotification('Role Switched', 'Switched active mode to Normal User (Deponent).', 'SYSTEM');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    currentUser.role === 'deponent'
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700/80 text-slate-300'
                  }`}
                  id="profile-toggle-role-deponent"
                >
                  <div className="text-xs font-bold">Normal User</div>
                  <div className="text-[10px] text-slate-300/80 mt-0.5">Deponent / Client</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateCurrentUser({ role: 'commissioner' });
                    setOperatingView('COMMISSIONER');
                    setCurrentView('commissioner-dashboard');
                    addNotification('Role Switched', 'Switched active mode to Commissioner for Oaths.', 'SYSTEM');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    currentUser.role === 'commissioner' || currentUser.role === 'notary'
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700/80 text-slate-300'
                  }`}
                  id="profile-toggle-role-commissioner"
                >
                  <div className="text-xs font-bold">Commissioner for Oaths</div>
                  <div className="text-[10px] text-slate-300/80 mt-0.5">Statutory Officer</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateCurrentUser({ role: 'master_admin' });
                    setOperatingView('ADMIN');
                    setCurrentView('admin');
                    addNotification('Role Switched', 'Switched active mode to Master Admin.', 'SYSTEM');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    currentUser.role === 'master_admin'
                      ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700/80 text-slate-300'
                  }`}
                  id="profile-toggle-role-admin"
                >
                  <div className="text-xs font-bold">Master Admin</div>
                  <div className="text-[10px] text-slate-300/80 mt-0.5">Root Governance</div>
                </button>
              </div>
            </div>
          )}

          {/* Section 4: Legal Infrastructure Link */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold">Legal & Regulatory Context</div>
                <div className="text-[11px] text-slate-400">What WALAYI is, and the Acts relevant to commissioning in Uganda</div>
              </div>
            </div>
            {onOpenAboutLegal && (
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onOpenAboutLegal();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                View About Section
              </button>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {saveSuccess ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Particulars Saved Successfully
              </span>
            ) : (
              <span className="font-mono-code text-[11px]">
                Active Profile: {currentUser.role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleSaveParticulars}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              id="btn-save-profile-particulars"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Particulars
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
