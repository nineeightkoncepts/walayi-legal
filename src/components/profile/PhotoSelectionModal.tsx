import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  RefreshCw, 
  Check, 
  Trash2, 
  FlipHorizontal, 
  AlertCircle,
  Sparkles,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { uploadProfilePhoto, removeProfilePhoto, validateImageFile } from '../../services/profilePhotoService';
import { UserAvatar } from '../common/UserAvatar';

interface PhotoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoSelectionModal: React.FC<PhotoSelectionModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUser, addNotification } = useApp();
  
  const [activeTab, setActiveTab] = useState<'picker' | 'camera'>('picker');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isMirror, setIsMirror] = useState(true);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setCapturedBlob(null);
      setErrorMessage(null);
      setCameraError(null);
    } else {
      stopCameraStream();
    }
  }, [isOpen]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Stop camera stream helper
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

  // Start camera stream
  const startCameraStream = async (deviceIdToUse?: string) => {
    stopCameraStream();
    setCameraError(null);
    setCapturedBlob(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser.');
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

      // Enumerate available cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (e) {
        // ignore enumeration errors
      }
    } catch (err: any) {
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No compatible camera found on this device. Please use Image Picker.');
      } else {
        setCameraError(err.message || 'Unable to start camera.');
      }
    }
  };

  // Handle Tab Switch
  const handleTabChange = (tab: 'picker' | 'camera') => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === 'camera') {
      startCameraStream();
    } else {
      stopCameraStream();
    }
  };

  // Handle File Input from Image Picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Capture Frame from Live Camera
  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply mirror if enabled
    if (isMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopCameraStream();
      }
    }, 'image/jpeg', 0.92);
  };

  // Retake Camera Photo
  const handleRetake = () => {
    setCapturedBlob(null);
    setPreviewUrl(null);
    startCameraStream();
  };

  // Save Selected / Captured Photo
  const handleSavePhoto = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let fileToUpload: File;

      if (activeTab === 'camera' && capturedBlob) {
        fileToUpload = new File([capturedBlob], `camera_photo_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
      } else if (activeTab === 'picker' && selectedFile) {
        fileToUpload = selectedFile;
      } else {
        throw new Error('Please select an image or take a photo first.');
      }

      const finalUrl = await uploadProfilePhoto(fileToUpload, currentUser.id);
      updateCurrentUser({ avatarUrl: finalUrl });

      addNotification(
        'Profile Photo Updated',
        'Your profile photograph has been updated successfully.',
        'SUCCESS'
      );

      stopCameraStream();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove Photo -> Revert to Blank Avatar
  const handleRemovePhoto = async () => {
    setIsProcessing(true);
    try {
      await removeProfilePhoto(currentUser.id);
      updateCurrentUser({ avatarUrl: '' });
      addNotification(
        'Photo Removed',
        'Profile photograph reset to blank avatar.',
        'INFO'
      );
      stopCameraStream();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
      id="photo-selection-modal-backdrop"
    >
      {/* Centered via auto margins, not align-items/justify-content — those
          clip an over-tall modal unscrollably at the top on short screens;
          margin:auto centers when there's room and falls back to flush
          top-of-scroll placement (fully reachable) when there isn't. */}
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col m-auto text-slate-900 animate-scaleUp"
        style={{ maxHeight: 'min(90vh, 90dvh)' }}
        id="photo-selection-modal"
      >

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0097A7] flex items-center justify-center border border-teal-200">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                Profile Photo
              </h3>
              <p className="text-[11px] text-slate-500">
                Replace blank avatar with your real photo
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            id="btn-close-photo-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Camera vs Image Picker */}
        <div className="p-4 pb-0 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange('picker')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'picker'
                  ? 'bg-white text-[#0D1B3D] shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="tab-photo-picker"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Image Picker</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('camera')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-white text-[#0D1B3D] shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="tab-photo-camera"
            >
              <Camera className="w-3.5 h-3.5 text-[#0097A7]" />
              <span>Live Camera</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Image Picker */}
          {activeTab === 'picker' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                id="file-input-photo-picker"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center justify-center space-y-3 p-4 border border-teal-200 bg-teal-50/40 rounded-2xl">
                  <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-md">
                    <img 
                      src={previewUrl} 
                      alt="Selected Preview" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-800">
                      {selectedFile?.name || 'Selected Photo'}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 text-[11px] text-[#0097A7] font-bold hover:underline cursor-pointer"
                    >
                      Choose Different Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#0097A7] rounded-3xl p-8 text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-teal-50/30 flex flex-col items-center justify-center space-y-3 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#0097A7] group-hover:border-teal-300 shadow-xs transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">
                      Click or Drag to Upload
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Supports JPG, JPEG, PNG, or WebP (up to 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Live Camera Viewfinder */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 text-center">
                  <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="font-bold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCameraStream()}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : previewUrl && capturedBlob ? (
                /* Snapshot Captured Preview */
                <div className="flex flex-col items-center justify-center space-y-3 p-4 border border-teal-200 bg-teal-50/40 rounded-2xl">
                  <div className="w-36 h-36 rounded-full overflow-hidden ring-4 ring-white shadow-md">
                    <img 
                      src={previewUrl} 
                      alt="Captured Camera Snapshot" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase font-mono-code">
                      Snapshot Ready
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={handleRetake}
                        className="text-[11px] text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer mt-1"
                      >
                        Retake Snapshot
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Live Camera Stream */
                <div className="space-y-2">
                  <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-300 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${isMirror ? '-scale-x-100' : ''}`}
                    />
                    
                    {/* Viewfinder crosshair overlay */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-3xl m-4" />
                    <div className="absolute w-40 h-40 rounded-full border border-teal-400/40 pointer-events-none" />

                    {/* Camera Controls Overlay */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsMirror(!isMirror)}
                        className={`p-1.5 rounded-lg backdrop-blur-md text-white transition-colors cursor-pointer ${
                          isMirror ? 'bg-white/30 text-teal-300' : 'bg-black/40 text-white/70'
                        }`}
                        title={isMirror ? 'Disable Mirror' : 'Enable Mirror'}
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Device selector if multiple cameras available */}
                  {availableDevices.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        startCameraStream(e.target.value);
                      }}
                      className="w-full text-[11px] py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      {availableDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId}>
                          {dev.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Capture Button */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={captureCameraFrame}
                      disabled={!isCameraActive}
                      className="py-2.5 px-6 rounded-2xl bg-[#0097A7] hover:bg-[#00838F] text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto active:scale-95 disabled:opacity-50"
                      id="btn-take-snapshot"
                    >
                      <Camera className="w-4 h-4" />
                      Take Snapshot
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Avatar Summary */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <UserAvatar
                src={currentUser.avatarUrl || null}
                name={currentUser.fullName}
                size="sm"
              />
              <div className="text-[11px]">
                <span className="font-bold text-slate-700">Current Status:</span>{' '}
                <span className="text-slate-500">
                  {currentUser.avatarUrl ? 'Custom Photo' : 'Blank Avatar'}
                </span>
              </div>
            </div>

            {currentUser.avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isProcessing}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                id="btn-reset-blank-avatar"
              >
                <Trash2 className="w-3 h-3" />
                Reset to Blank
              </button>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSavePhoto}
            disabled={!previewUrl || isProcessing}
            className="px-5 py-2 rounded-xl bg-[#0D1B3D] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            id="btn-save-chosen-photo"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-teal-300" />
                Use Photo
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
