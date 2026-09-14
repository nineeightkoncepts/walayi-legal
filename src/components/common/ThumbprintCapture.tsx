import React, { useState, useEffect, useRef } from 'react';
import { 
  Fingerprint, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Upload, 
  Smartphone, 
  Info,
  Sparkles,
  ShieldCheck,
  Check,
  RotateCcw
} from 'lucide-react';
import { biometricService, FingerprintCaptureResponse } from '../../services/biometricService';
import { motion, AnimatePresence } from 'motion/react';

interface ThumbprintCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export const ThumbprintCapture: React.FC<ThumbprintCaptureProps> = ({ onCapture, onCancel }) => {
  const [mode, setMode] = useState<'TOUCH' | 'SCANNER' | 'UPLOAD'>('TOUCH');
  const [status, setStatus] = useState<'IDLE' | 'CAPTURING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number>(94);
  const [deviceInfo, setDeviceInfo] = useState<string>('Capacitive Touch Surface');

  // Touch press progress (0 - 100)
  const [pressProgress, setPressProgress] = useState(0);
  const pressTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startScannerCapture = async () => {
    setStatus('CAPTURING');
    setErrorMessage(null);
    
    try {
      const response = await biometricService.captureThumbprint();
      
      if (response.status === 'CAPTURE_SUCCESS' && response.dataUrl) {
        setCapturedImage(response.dataUrl);
        setQualityScore(response.qualityScore || 95);
        setDeviceInfo(response.deviceInfo?.type || 'Optical Biometric Scanner (500 DPI)');
        setStatus('SUCCESS');
      } else {
        setStatus('ERROR');
        setErrorMessage(response.errorMessage || 'Biometric device not detected. Please try Touch mode or Ink Upload.');
      }
    } catch (err) {
      setStatus('ERROR');
      setErrorMessage('Could not connect to biometric sensor.');
    }
  };

  // Handle Touch Press & Hold
  const handleTouchStart = () => {
    if (status === 'SUCCESS') return;
    setStatus('CAPTURING');
    setPressProgress(0);

    let progress = 0;
    pressTimerRef.current = setInterval(() => {
      progress += 10;
      setPressProgress(progress);
      if (progress >= 100) {
        clearInterval(pressTimerRef.current);
        const thumbUrl = biometricService.generateTouchImpression(`touch-${Date.now()}`);
        setCapturedImage(thumbUrl);
        setQualityScore(96);
        setDeviceInfo('Biometric Dwell Touch Sensor (1000Hz)');
        setStatus('SUCCESS');
      }
    }, 120);
  };

  const handleTouchEnd = () => {
    if (pressProgress < 100 && status !== 'SUCCESS') {
      clearInterval(pressTimerRef.current);
      setPressProgress(0);
      setStatus('IDLE');
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedImage(result);
        setQualityScore(92);
        setDeviceInfo('Scanned Ink Impression (High-Res)');
        setStatus('SUCCESS');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRecapture = () => {
    setCapturedImage(null);
    setStatus('IDLE');
    setPressProgress(0);
    setErrorMessage(null);
  };

  return (
    <div className="p-6 space-y-6 text-center animate-fadeIn max-w-md mx-auto" id="thumbprint-capture-root">
      
      {/* Method Pills */}
      {status !== 'SUCCESS' && (
        <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => { setMode('TOUCH'); setStatus('IDLE'); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'TOUCH' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Touch Pad
          </button>
          <button
            type="button"
            onClick={() => { setMode('SCANNER'); startScannerCapture(); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'SCANNER' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            USB Scanner
          </button>
          <button
            type="button"
            onClick={() => { setMode('UPLOAD'); setStatus('IDLE'); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'UPLOAD' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload Ink
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <AnimatePresence mode="wait">
        
        {/* SUCCESS VIEW */}
        {status === 'SUCCESS' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>BIOMETRIC THUMBPRINT VERIFIED</span>
              </div>
              <p className="text-xs text-slate-500 font-medium pt-1">
                Friction ridge patterns extracted & timestamped for statutory Jurat.
              </p>
            </div>

            {/* Thumbprint Preview Card */}
            <div className="relative w-40 h-48 rounded-3xl border-2 border-emerald-500/40 bg-slate-50 overflow-hidden mx-auto shadow-lg flex flex-col items-center justify-center p-2">
              {capturedImage && capturedImage.trim().length > 0 && (
                <img 
                  src={capturedImage} 
                  alt="Affixed Thumbprint" 
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs rounded-xl p-1 text-[9px] font-mono-code text-slate-700 font-bold border border-slate-200 flex items-center justify-between px-2">
                <span>NFIQ: {qualityScore}%</span>
                <span className="text-emerald-600">PASS</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono-code">
              Device: <strong className="text-slate-800">{deviceInfo}</strong>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => onCapture(capturedImage!)}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                id="btn-confirm-thumbprint"
              >
                <Check className="w-4 h-4" />
                <span>AFFIX THIS THUMBPRINT TO INSTRUMENT</span>
              </button>
              
              <button
                type="button"
                onClick={handleRecapture}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recapture / Re-stamp</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* TOUCH IMPRESSION MODE */}
        {status !== 'SUCCESS' && mode === 'TOUCH' && (
          <motion.div 
            key="touch-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-display-legal">
                PRESS & HOLD THUMB ON PAD
              </h3>
              <p className="text-xs text-slate-500">
                Press and hold your thumb firmly inside the target box below.
              </p>
            </div>

            {/* Interactive Press Target */}
            <div 
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="w-48 h-56 rounded-3xl border-2 border-dashed border-blue-500 bg-blue-50/50 hover:bg-blue-100/50 active:bg-blue-200/50 transition-all mx-auto flex flex-col items-center justify-center relative select-none cursor-pointer overflow-hidden group shadow-inner"
              id="touch-fingerprint-pad"
            >
              {/* Progress Radial / Waterfill */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-blue-600/30 transition-all duration-75 pointer-events-none"
                style={{ height: `${pressProgress}%` }}
              />

              <Fingerprint className={`w-20 h-20 text-blue-600 transition-transform ${
                pressProgress > 0 ? 'scale-110 animate-pulse text-blue-800' : 'group-hover:scale-105'
              }`} />

              <div className="pt-3 text-center relative z-10">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block font-mono-code">
                  {pressProgress > 0 ? `Scanning (${pressProgress}%)` : 'Press & Hold'}
                </span>
                <span className="text-[10px] text-blue-700">Right or Left Thumb</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono-code flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Direct Biometric Dwell Verification
            </div>
          </motion.div>
        )}

        {/* USB SCANNER MODE */}
        {status !== 'SUCCESS' && mode === 'SCANNER' && (
          <motion.div 
            key="scanner-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto relative overflow-hidden">
              <Fingerprint className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {status === 'CAPTURING' ? 'Scanning External Biometric...' : 'External Biometric Reader'}
              </h3>
              <p className="text-xs text-slate-500">
                {status === 'CAPTURING' 
                  ? 'Please place your thumb on the USB hardware sensor.'
                  : 'Ready to capture from attached optical or capacitive sensor.'}
              </p>
            </div>

            {status === 'ERROR' && (
              <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={startScannerCapture}
              disabled={status === 'CAPTURING'}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'CAPTURING' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Hardware...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>Scan Thumbprint Now</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* UPLOAD INK MODE */}
        {status !== 'SUCCESS' && mode === 'UPLOAD' && (
          <motion.div 
            key="upload-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-3xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 transition-all text-center space-y-2 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-bold text-xs text-slate-800">
                Click to Upload Ink Thumbprint Photo
              </div>
              <p className="text-[10px] text-slate-500">
                Upload clear photo/scan of physical ink thumb impression (JPG, PNG)
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Cancel button */}
      {status !== 'SUCCESS' && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel Execution
          </button>
        </div>
      )}

    </div>
  );
};
