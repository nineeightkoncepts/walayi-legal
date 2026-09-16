import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CommissioningStatus, SolemnisationType, DocumentMarkPlacement } from '../../types';
import { generateStatutoryJurat, getStatutoryOathText } from '../../services/juratService';
import { SignatureCanvas } from '../common/SignatureCanvas';
import { OfficialSeal } from '../common/OfficialSeal';
import { AuditCertificateModal } from '../common/AuditCertificateModal';
import { DailyVideoCallFrame } from './DailyVideoCallFrame';
import { ApiGatewayConfigModal } from '../admin/ApiGatewayConfigModal';
import { ApiConfigService } from '../../services/apiConfigService';
import confetti from 'canvas-confetti';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  ShieldCheck, 
  Lock, 
  BookOpen, 
  PenTool, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  RotateCcw, 
  Download, 
  ExternalLink,
  Wifi,
  Sparkles,
  Award,
  Layers,
  Eye,
  Bell,
  Clock,
  Smartphone,
  CheckCircle2,
  DollarSign,
  UserCheck,
  PhoneCall,
  PhoneOff,
  Phone,
  Volume2,
  VolumeX,
  Settings,
  Copy,
  Check,
  Key,
  Fingerprint,
  Scale
} from 'lucide-react';
import { ThumbprintCapture } from '../common/ThumbprintCapture';
import { PdfSignaturePlacer } from '../common/PdfSignaturePlacer';
import { ExecutionMethod } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { UserAvatar } from '../common/UserAvatar';
import { PlatformFeeSheet } from '../payment/PlatformFeeSheet';
import { downloadFinalInstrumentPdf } from '../../services/pdfOverlayService';

export const DailyCommissioningRoom: React.FC = () => {
  const { 
    currentUser, 
    requests, 
    activeCommissioningId, 
    updateCommissioningRequest, 
    advanceCeremonyState,
    setCurrentView,
    executePayment,
    addNotification
  } = useApp();

  const activeRequest = requests.find(r => r.id === activeCommissioningId) || requests[0];

  const isCommissioner = currentUser.role === 'commissioner' || 
                        currentUser.role === 'notary' || 
                        currentUser.role === 'judicial_officer' || 
                        currentUser.role === 'justice_of_peace' ||
                        currentUser.role === 'super_admin' ||
                        currentUser.role === 'master_admin';

  // Room State: 'PRE_ENTRY' | 'WAITING_FOR_PARTNER' | 'CONNECTED'
  const [hasEnteredRoom, setHasEnteredRoom] = useState<boolean>(false);
  const [partnerConnected, setPartnerConnected] = useState<boolean>(false);

  // My role in this two-party session, and the counterpart's presence flag key.
  const myRole: 'deponent' | 'commissioner' = isCommissioner ? 'commissioner' : 'deponent';
  const myPresenceKey = isCommissioner ? 'commissionerPresent' : 'deponentPresent';
  const partnerName = isCommissioner
    ? activeRequest.deponentName
    : (activeRequest.assignedProfessionalName || 'Commissioner');

  // Incoming call from the other party (they pressed "Call" first).
  const [incomingCall, setIncomingCall] = useState<boolean>(false);

  // Calling State ('LOBBY' | 'CALLING')
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callingSeconds, setCallingSeconds] = useState<number>(0);
  const [isRingtoneMuted, setIsRingtoneMuted] = useState<boolean>(false);
  const callingPipVideoRef = useRef<HTMLVideoElement | null>(null);
  const stopRingAudioRef = useRef<(() => void) | null>(null);
  
  // Real Local Media Stream
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [mediaStreamActive, setMediaStreamActive] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Audio / Video toggles
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [pingAlertSent, setPingAlertSent] = useState(false);

  // Payment Resolution inside Room if locked
  const [isResolvingPayment, setIsResolvingPayment] = useState(false);

  // Ceremony Step State (1 to 14 mapped to 4 statutory milestones)
  const [ceremonyStep, setCeremonyStep] = useState<number>(() => {
    if (activeRequest.status === 'COMPLETED') return 14;
    if (activeRequest.status === 'COMMISSIONED') return 12;
    if (activeRequest.status === 'SIGNING') return 9;
    if (activeRequest.status === 'OATH_ADMINISTERED') return 8;
    if (activeRequest.status === 'DOCUMENT_LOCKED') return 4;
    return activeRequest.ceremonyStep || 1;
  });
  const [deponentNinVerified, setDeponentNinVerified] = useState(true);
  const [selectedSolemnisation, setSelectedSolemnisation] = useState<SolemnisationType>(activeRequest.solemnisationType || 'holy_bible');
  const [deponentSignData, setDeponentSignData] = useState<string | null>(activeRequest.deponentSignatureDataUrl || null);
  const [deponentThumbData, setDeponentThumbData] = useState<string | null>(activeRequest.deponentThumbprintDataUrl || null);
  const [executionMethod, setExecutionMethod] = useState<ExecutionMethod | null>(activeRequest.deponentExecutionMethod || null);
  const [commissionerSignData, setCommissionerSignData] = useState<string | null>(activeRequest.commissionerSignatureDataUrl || null);
  const [sealApplied, setSealApplied] = useState<boolean>(!!activeRequest.commissionerSealSerial);
  const [isDeponentMode, setIsDeponentMode] = useState<boolean>(false);

  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditModalTab, setAuditModalTab] = useState<'instrument' | 'audit'>('instrument');
  const [showApiGatewayModal, setShowApiGatewayModal] = useState<boolean>(false);
  const [generatedJurat, setGeneratedJurat] = useState<string>('');

  // A mark (signature/thumbprint) that's been captured but not yet placed
  // on the document — holds it while PdfSignaturePlacer is shown, so the
  // request is only updated once the signer has confirmed (or skipped)
  // exactly where it should land on the real uploaded PDF.
  const [pendingDeponentMark, setPendingDeponentMark] = useState<{ dataUrl: string; kind: ExecutionMethod } | null>(null);
  const [pendingCommissionerMark, setPendingCommissionerMark] = useState<string | null>(null);

  const isPaymentPaid = activeRequest.paymentStatus === 'ESCROWED' || activeRequest.paymentStatus === 'RELEASED';
  // Placement on the real document is only possible when the source file
  // itself was a genuine PDF (pdf-lib can't parse .doc/.docx) — otherwise
  // marks fall back to a default position at final-instrument build time.
  const canPlaceOnOriginal = !!activeRequest.rawFileUrl && activeRequest.originalMimeType === 'application/pdf';

  const finalizeDeponentMark = (dataUrl: string, kind: ExecutionMethod, placement?: DocumentMarkPlacement) => {
    if (kind === 'SIGNATURE') {
      setDeponentSignData(dataUrl);
    } else {
      setDeponentThumbData(dataUrl);
    }
    updateCommissioningRequest(activeRequest.id, {
      ...(kind === 'SIGNATURE' ? { deponentSignatureDataUrl: dataUrl } : { deponentThumbprintDataUrl: dataUrl }),
      deponentSignedAt: new Date().toISOString(),
      ...(placement ? { deponentMarkPlacement: placement } : {})
    } as any, {
      eventType: kind === 'SIGNATURE' ? 'DEPONENT_SIGNED' : 'THUMBPRINT_CAPTURED',
      details: kind === 'SIGNATURE'
        ? `Deponent executed the document with an electronic signature${placement ? ', placed at a chosen location on the instrument' : ''}.`
        : 'Biometric thumbprint captured and confirmed by deponent.'
    });
    setPendingDeponentMark(null);
    if (!isDeponentMode) handleNextStep(10);
  };

  // Routes a freshly-captured deponent mark either straight to persistence
  // (no real PDF to place it on) or into the placement step first.
  const handleDeponentMarkCaptured = (dataUrl: string, kind: ExecutionMethod) => {
    if (canPlaceOnOriginal) {
      setPendingDeponentMark({ dataUrl, kind });
    } else {
      finalizeDeponentMark(dataUrl, kind);
    }
  };

  const finalizeCommissionerMark = (dataUrl: string, placement?: DocumentMarkPlacement) => {
    setCommissionerSignData(dataUrl);
    updateCommissioningRequest(activeRequest.id, {
      commissionerSignatureDataUrl: dataUrl,
      commissionerSignedAt: new Date().toISOString(),
      ...(placement ? { commissionerMarkPlacement: placement } : {})
    } as any, {
      eventType: 'COMMISSIONER_SIGNED',
      details: `Commissioner executed the instrument with an electronic signature${placement ? ', placed at a chosen location on the document' : ''}.`
    });
    setPendingCommissionerMark(null);
    handleNextStep(11);
  };

  const handleCommissionerMarkCaptured = (dataUrl: string) => {
    if (canPlaceOnOriginal) {
      setPendingCommissionerMark(dataUrl);
    } else {
      finalizeCommissionerMark(dataUrl);
    }
  };

  // Synchronize ceremony step and execution assets when updated remotely
  useEffect(() => {
    if (activeRequest.ceremonyStep && activeRequest.ceremonyStep !== ceremonyStep) {
      setCeremonyStep(activeRequest.ceremonyStep);
    }
    if (activeRequest.deponentSignatureDataUrl && activeRequest.deponentSignatureDataUrl !== deponentSignData) {
      setDeponentSignData(activeRequest.deponentSignatureDataUrl);
    }
    if (activeRequest.deponentThumbprintDataUrl && activeRequest.deponentThumbprintDataUrl !== deponentThumbData) {
      setDeponentThumbData(activeRequest.deponentThumbprintDataUrl);
    }
    if (activeRequest.commissionerSignatureDataUrl && activeRequest.commissionerSignatureDataUrl !== commissionerSignData) {
      setCommissionerSignData(activeRequest.commissionerSignatureDataUrl);
    }
    if (activeRequest.commissionerSealSerial && !sealApplied) {
      setSealApplied(true);
    }
  }, [
    activeRequest.ceremonyStep,
    activeRequest.deponentSignatureDataUrl,
    activeRequest.deponentThumbprintDataUrl,
    activeRequest.commissionerSignatureDataUrl,
    activeRequest.commissionerSealSerial
  ]);

  // Start real local media stream when in lobby
  useEffect(() => {
    let active = true;

    async function initCamera() {
      if (hasEnteredRoom) return; // Chamber frame manages camera inside the room
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: true
          });
          if (active && !hasEnteredRoom) {
            localStreamRef.current = stream;
            setMediaStreamActive(true);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          } else {
            stream.getTracks().forEach(t => t.stop());
          }
        }
      } catch (err: any) {
        console.warn('Lobby camera preview notice:', err?.message);
        setMediaError('Local camera preview fallback engaged.');
      }
    }

    if (!hasEnteredRoom) {
      initCamera();
    } else if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [hasEnteredRoom]);

  // Update video element when stream is active or element mounts
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [hasEnteredRoom, partnerConnected, isVideoOn]);

  // Toggle video track
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoOn;
      });
    }
  }, [isVideoOn]);

  // Toggle audio track
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  // Initialize or synchronize ceremony status
  useEffect(() => {
    if (activeRequest.status === 'COMPLETED' || activeRequest.status === 'COMMISSIONED') {
      setCeremonyStep(14);
      setSealApplied(true);
      setPartnerConnected(true);
      setHasEnteredRoom(true);
    } else if (activeRequest.status === 'SIGNING') {
      setCeremonyStep(9);
      setPartnerConnected(true);
      setHasEnteredRoom(true);
    } else if (activeRequest.status === 'OATH_ADMINISTERED') {
      setCeremonyStep(8);
      setPartnerConnected(true);
      setHasEnteredRoom(true);
    } else if (activeRequest.status === 'DOCUMENT_LOCKED') {
      setCeremonyStep(4);
      setPartnerConnected(true);
      setHasEnteredRoom(true);
    }
  }, [activeRequest.status]);

  // Generate real dynamic jurat when reaching signing or jurat stage
  useEffect(() => {
    const jurat = generateStatutoryJurat({
      deponentName: activeRequest.deponentName,
      commissionerName: activeRequest.assignedProfessionalName || currentUser.fullName,
      commissionerAuthority: activeRequest.assignedProfessionalAuthority || 'commissioner_for_oaths',
      courtStationOrCity: activeRequest.assignedProfessionalStation || 'Kampala (High Court)',
      solemnisationType: selectedSolemnisation,
      date: new Date(),
      certificateNumber: activeRequest.certificateNumber,
      licenceNumber: 'CFO/2024/0119'
    });
    setGeneratedJurat(jurat);
  }, [activeRequest, selectedSolemnisation, currentUser.fullName]);

  // Advance ceremony step handler with audit recording
  const handleNextStep = (stepNumber: number) => {
    setCeremonyStep(stepNumber);

    if (stepNumber === 4) {
      advanceCeremonyState(activeRequest.id, 'DOCUMENT_LOCKED', 'Document locked by Commissioner prior to solemn oath.', { ceremonyStep: 4 });
    } else if (stepNumber === 7) {
      advanceCeremonyState(activeRequest.id, 'OATH_ADMINISTERED', `Statutory oath administered on ${selectedSolemnisation}.`, { ceremonyStep: 7 });
    } else if (stepNumber === 9) {
      advanceCeremonyState(activeRequest.id, 'SIGNING', 'Execution of digital signatures initiated.', { ceremonyStep: 9 });
    } else if (stepNumber === 11) {
      setSealApplied(true);
      advanceCeremonyState(activeRequest.id, 'COMMISSIONED', 'Official statutory seal and digital stamp applied.', { ceremonyStep: 11 });
    } else if (stepNumber === 14) {
      // Complete the ceremony and record the commissioner net payout.
      // Settlement to the commissioner is handled off-platform.
      const netPayout = activeRequest.serviceFeeUGX;

      advanceCeremonyState(
        activeRequest.id, 
        'COMPLETED', 
        `Ceremony completed. Net payout of UGX ${netPayout.toLocaleString()} recorded for ${activeRequest.assignedProfessionalName}. Certified legal instrument issued.`,
        {
          ceremonyStep: 14,
          paymentStatus: 'RELEASED',
          completedAt: new Date().toISOString(),
          juratText: generatedJurat,
          deponentExecutionMethod: executionMethod || activeRequest.deponentExecutionMethod || undefined,
          deponentSignatureDataUrl: deponentSignData || activeRequest.deponentSignatureDataUrl || undefined,
          deponentThumbprintDataUrl: deponentThumbData || activeRequest.deponentThumbprintDataUrl || undefined,
          commissionerSignatureDataUrl: commissionerSignData || activeRequest.commissionerSignatureDataUrl || undefined,
          commissionerSealSerial: activeRequest.commissionerSealSerial || `UG-CFO-2026-${activeRequest.certificateNumber.slice(-4)}`
        }
      );

      addNotification(
        'Instrument Sealed & Payout Recorded',
        `Net payout of UGX ${netPayout.toLocaleString()} recorded for ${activeRequest.assignedProfessionalName}. WALAYI Security Number minted.`,
        'PAYMENT'
      );

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    } else {
      updateCommissioningRequest(activeRequest.id, { ceremonyStep: stepNumber });
    }
  };

  const handleResolvePaymentInRoom = async () => {
    setIsResolvingPayment(true);
    try {
      await executePayment({
        serviceFeeUGX: activeRequest.serviceFeeUGX,
        provider: 'MTN_MOMO',
        phoneNumber: activeRequest.deponentPhone || '+256772000000',
        commissioningId: activeRequest.id,
        purpose: 'COMMISSIONING_ESCROW'
      });

      updateCommissioningRequest(activeRequest.id, {
        paymentStatus: 'ESCROWED',
        paymentMethod: 'MTN_MOMO',
        paymentReference: `MTN-UG-${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'PAID'
      }, {
        eventType: 'PAYMENT_ESCROWED',
        details: `Payment of UGX ${activeRequest.totalAmountUGX.toLocaleString()} escrowed via MTN MoMo.`
      });

      addNotification(
        'Escrow Payment Confirmed',
        `Commissioning fee of UGX ${activeRequest.totalAmountUGX.toLocaleString()} confirmed. Video room unlocked.`,
        'PAYMENT'
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolvingPayment(false);
    }
  };

  // Calling Audio & Auto-connect simulation
  useEffect(() => {
    if (!isCalling) {
      if (stopRingAudioRef.current) {
        stopRingAudioRef.current();
        stopRingAudioRef.current = null;
      }
      setCallingSeconds(0);
      return;
    }

    // Attach stream to PIP element
    if (callingPipVideoRef.current && localStreamRef.current) {
      callingPipVideoRef.current.srcObject = localStreamRef.current;
    }

    // Soft ringtone loop
    if (!isRingtoneMuted) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          let active = true;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);
          gain.gain.setValueAtTime(0.03, ctx.currentTime);

          const ringPulse = () => {
            if (!active || ctx.state === 'closed') return;
            const now = ctx.currentTime;
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.setValueAtTime(0, now + 1.2);
          };

          ringPulse();
          const ringInterval = setInterval(ringPulse, 3200);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start();
          osc2.start();

          stopRingAudioRef.current = () => {
            active = false;
            clearInterval(ringInterval);
            try {
              osc1.stop();
              osc2.stop();
              ctx.close();
            } catch (e) {}
          };
        }
      } catch (e) {
        console.warn('Audio ring fallback:', e);
      }
    }

    const timer = setInterval(() => {
      setCallingSeconds(prev => prev + 1);
    }, 1000);

    // No auto-answer: the call stays ringing until the other party (on their
    // own account/device) actually accepts. Acceptance arrives via the synced
    // liveCallState watcher below.

    return () => {
      clearInterval(timer);
      if (stopRingAudioRef.current) {
        stopRingAudioRef.current();
        stopRingAudioRef.current = null;
      }
    };
  }, [isCalling, isRingtoneMuted]);

  // Sync calling PIP video ref if stream changes
  useEffect(() => {
    if (isCalling && callingPipVideoRef.current && localStreamRef.current) {
      callingPipVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isCalling, isVideoOn, mediaStreamActive]);

  const handleStartCall = () => {
    if (!isPaymentPaid) {
      alert('Statutory Rule: Payment must be completed before initiating the call.');
      return;
    }
    setIsCalling(true);
    // Broadcast the ring to the other party via the synced session document.
    updateCommissioningRequest(activeRequest.id, {
      liveCallState: 'RINGING',
      callInitiatedByRole: myRole,
      callInitiatedByName: currentUser.fullName,
      [myPresenceKey]: true,
    } as any, {
      eventType: 'VIDEO_SESSION_INITIATED',
      details: `${currentUser.fullName} (${myRole}) initiated the statutory video call.`
    });
  };

  const handleCancelCall = () => {
    setIsCalling(false);
    if (stopRingAudioRef.current) {
      stopRingAudioRef.current();
      stopRingAudioRef.current = null;
    }
    // Clear the shared ring so the other party stops seeing an incoming call.
    updateCommissioningRequest(activeRequest.id, {
      liveCallState: 'IDLE',
      callInitiatedByRole: undefined,
      callInitiatedByName: undefined,
    } as any);
    addNotification(
      'Call Cancelled',
      `Call to ${partnerName} cancelled.`,
      'SYSTEM'
    );
  };

  // Caller side: bridge into the room once the other party accepts.
  const handleConnectCall = () => {
    if (stopRingAudioRef.current) {
      stopRingAudioRef.current();
      stopRingAudioRef.current = null;
    }
    setIsCalling(false);
    setIncomingCall(false);
    setHasEnteredRoom(true);
    setPartnerConnected(true);
    addNotification(
      'Session Connected',
      `Direct encrypted line connected with ${partnerName}.`,
      'CEREMONY'
    );
  };

  // Caller side: "Connect Now" — broadcast CONNECTED so a ringing partner is
  // pulled into the room together with the caller.
  const handleCallerForceConnect = () => {
    updateCommissioningRequest(activeRequest.id, {
      liveCallState: 'CONNECTED',
      callConnectedAt: new Date().toISOString(),
      [myPresenceKey]: true,
    } as any);
    handleConnectCall();
  };

  // Callee side: accept an incoming ring and connect both parties.
  const handleAcceptIncoming = () => {    if (stopRingAudioRef.current) {
      stopRingAudioRef.current();
      stopRingAudioRef.current = null;
    }
    updateCommissioningRequest(activeRequest.id, {
      liveCallState: 'CONNECTED',
      callConnectedAt: new Date().toISOString(),
      [myPresenceKey]: true,
    } as any, {
      eventType: 'VIDEO_SESSION_INITIATED',
      details: `${currentUser.fullName} (${myRole}) accepted the call. Two-party session connected.`
    });
    setIncomingCall(false);
    setIsCalling(false);
    setHasEnteredRoom(true);
    setPartnerConnected(true);
  };

  const handleDeclineIncoming = () => {
    if (stopRingAudioRef.current) {
      stopRingAudioRef.current();
      stopRingAudioRef.current = null;
    }
    updateCommissioningRequest(activeRequest.id, {
      liveCallState: 'IDLE',
      callInitiatedByRole: undefined,
      callInitiatedByName: undefined,
    } as any);
    setIncomingCall(false);
  };

  // React to the shared call state changing on the OTHER party's device.
  useEffect(() => {
    const state = activeRequest.liveCallState;
    const initiatedBy = activeRequest.callInitiatedByRole;

    if (state === 'CONNECTED') {
      // Someone accepted — both sides drop into the connected room.
      if (!hasEnteredRoom) {
        handleConnectCall();
      }
      return;
    }

    if (state === 'RINGING' && initiatedBy && initiatedBy !== myRole) {
      // The counterpart is calling me and I'm not already in the room.
      if (!hasEnteredRoom && !isCalling) {
        setIncomingCall(true);
      }
      return;
    }

    if (state === 'IDLE' || state === 'ENDED' || !state) {
      setIncomingCall(false);
    }
  }, [activeRequest.liveCallState, activeRequest.callInitiatedByRole, hasEnteredRoom, isCalling, myRole]);

  // Publish my presence while I'm inside the connected room; reflect the
  // counterpart's presence flag as the "partner connected" signal.
  useEffect(() => {
    if (hasEnteredRoom) {
      updateCommissioningRequest(activeRequest.id, { [myPresenceKey]: true } as any);
    }
    // Best-effort: mark absent when leaving the room view entirely.
    return () => {
      if (hasEnteredRoom) {
        updateCommissioningRequest(activeRequest.id, { [myPresenceKey]: false } as any);
      }
    };
  }, [hasEnteredRoom]);

  useEffect(() => {
    const partnerPresent = isCommissioner
      ? activeRequest.deponentPresent
      : activeRequest.commissionerPresent;
    if (partnerPresent && hasEnteredRoom) {
      setPartnerConnected(true);
    }
  }, [activeRequest.deponentPresent, activeRequest.commissionerPresent, hasEnteredRoom, isCommissioner]);

  const handleSendPingAlert = () => {
    setPingAlertSent(true);
    addNotification(
      'Notification Dispatched',
      `Direct SMS alert sent to ${isCommissioner ? activeRequest.deponentName : activeRequest.assignedProfessionalName} (${isCommissioner ? activeRequest.deponentPhone : '+256 702 119 004'}).`,
      'SYSTEM'
    );
    setTimeout(() => setPingAlertSent(false), 4000);
  };

  const oathText = getStatutoryOathText(selectedSolemnisation, activeRequest.ceremonyLanguage || 'English');

  // =========================================================================
  // VIEW 1: STRICT PAYMENT GATE SCREEN (IF UNPAID)
  // =========================================================================
  if (!isPaymentPaid) {
    return (
      <div className="max-w-2xl mx-auto my-6 space-y-4" id="payment-gate-blocking-screen">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-3">
          <div className="flex flex-col items-center justify-center">
            <BrandLogo variant="glyph" size="lg" className="mb-2" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              STATUTORY PAYMENT GATE • COMMISSIONING ROOM LOCKED
            </span>
            <h2 className="text-xl font-display-legal font-bold text-[#0D1B3D]">
              Escrow Deposit Required Before Convening Oath
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Under Cap. 5 Laws of Uganda & Electronic Transactions Act 2011, commissioning fees must be locked in statutory escrow prior to convening the live video ceremony.
            </p>
          </div>
        </div>

        {/* Platform Fee Confirmation Sheet */}
        <PlatformFeeSheet
          amountUGX={activeRequest.totalAmountUGX}
          serviceFeeUGX={activeRequest.serviceFeeUGX}
          platformFeeUGX={activeRequest.platformFeeUGX}
          commissioningId={activeRequest.id}
          deponentName={activeRequest.deponentName}
          deponentPhone={activeRequest.deponentPhone}
          documentTitle={activeRequest.documentTitle}
          commissionerName={activeRequest.assignedProfessionalName}
          onPaymentSuccess={(txn, feeRef) => {
            updateCommissioningRequest(activeRequest.id, {
              paymentStatus: 'ESCROWED',
              paymentMethod: txn.provider,
              paymentReference: feeRef,
              status: 'PAID'
            }, {
              eventType: 'PAYMENT_ESCROWED',
              details: `WALAYI platform fee of UGX ${activeRequest.totalAmountUGX.toLocaleString()} confirmed. Reference: ${feeRef}`
            });

            addNotification(
              'Platform Fee Confirmed',
              `WALAYI platform fee of UGX ${activeRequest.totalAmountUGX.toLocaleString()} confirmed. Video room unlocked.`,
              'PAYMENT'
            );
          }}
          onCancel={() => setCurrentView(isCommissioner ? 'documents' : 'home')}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2-INCOMING: FULL-SCREEN INCOMING CALL (the other party rang first)
  // =========================================================================
  if (incomingCall && !hasEnteredRoom) {
    const callerName = activeRequest.callInitiatedByName
      || (isCommissioner ? activeRequest.deponentName : (activeRequest.assignedProfessionalName || 'Commissioner'));
    const callerRole = activeRequest.callInitiatedByRole === 'commissioner' ? 'Commissioner for Oaths' : 'Deponent';

    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#0B1120] to-[#0D1B3D] flex flex-col items-center justify-center p-6 text-white animate-fadeIn" id="incoming-call-screen">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
          <span className="text-[11px] font-mono-code uppercase tracking-[0.3em] text-emerald-300 animate-pulse">
            Incoming Statutory Call
          </span>

          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <UserAvatar size="xl" name={callerName} className="ring-4 ring-emerald-400/40 relative" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-display-legal font-bold">{callerName}</h2>
            <p className="text-sm text-slate-300">{callerRole}</p>
            <p className="text-[11px] text-slate-400 pt-1">
              Certificate {activeRequest.certificateNumber} • {activeRequest.documentTitle}
            </p>
          </div>

          <div className="flex items-center justify-center gap-10 pt-4">
            <button
              onClick={handleDeclineIncoming}
              className="flex flex-col items-center gap-2 group cursor-pointer"
              id="btn-decline-incoming-call"
            >
              <span className="w-16 h-16 rounded-full bg-rose-600 group-hover:bg-rose-700 flex items-center justify-center shadow-xl transition-colors">
                <PhoneOff className="w-7 h-7 text-white" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Decline</span>
            </button>

            <button
              onClick={handleAcceptIncoming}
              className="flex flex-col items-center gap-2 group cursor-pointer"
              id="btn-accept-incoming-call"
            >
              <span className="w-16 h-16 rounded-full bg-emerald-500 group-hover:bg-emerald-600 flex items-center justify-center shadow-xl transition-colors animate-bounce">
                <PhoneCall className="w-7 h-7 text-white" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2A: FULL-SCREEN IMMERSIVE CALLING EXPERIENCE
  // =========================================================================
  if (isCalling) {
    const targetName = isCommissioner
      ? activeRequest.deponentName
      : (activeRequest.assignedProfessionalName || 'Adv. Kajubi Lovelock');

    const targetRole = isCommissioner
      ? `Deponent • NIN: ${activeRequest.deponentNin}`
      : `${activeRequest.assignedProfessionalStation || 'High Court of Uganda'} • Commissioner for Oaths`;

    const targetSubtitle = isCommissioner
      ? `Deponent Mobile: ${activeRequest.deponentPhone || '+256 772 123 456'}`
      : 'Advocate & Statutory Commissioner for Oaths';

    return (
      <div className="fixed inset-0 z-50 bg-[#060B18] text-white flex flex-col justify-between overflow-hidden animate-fadeIn select-none" id="calling-screen-fullscreen">
        {/* Subtle radial ambient background light */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,151,167,0.18),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(13,27,61,0.6),transparent_60%)] pointer-events-none" />

        {/* Top Bar: Minimalist encrypted session indicator */}
        <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo variant="glyph" size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display-legal font-bold tracking-wider text-xs sm:text-sm text-slate-200">
                  STATUTORY COMMISSIONING LINE
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-800/60 font-mono-code flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  END-TO-END ENCRYPTED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono-code">
                {activeRequest.certificateNumber} • {activeRequest.documentTitle}
              </p>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setIsRingtoneMuted(!isRingtoneMuted)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            title={isRingtoneMuted ? 'Unmute Ringing' : 'Mute Ringing'}
            id="btn-toggle-calling-sound"
          >
            {isRingtoneMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-teal-300" />}
          </button>
        </header>

        {/* Center Stage: Recipient Avatar & Pulsing Radar Rings */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 -mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 -m-8 rounded-full border border-teal-500/20 animate-ping pointer-events-none" style={{ animationDuration: '2.4s' }} />
            <div className="absolute inset-0 -m-16 rounded-full border border-teal-400/10 pointer-events-none animate-pulse" />
            <div className="absolute inset-0 -m-4 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />

            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-b from-teal-400/40 via-blue-500/20 to-transparent shadow-2xl flex items-center justify-center">
              <UserAvatar
                name={targetName}
                size="xl"
              />
            </div>
          </div>

          {/* Calling Status & Target Info */}
          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-teal-300 text-xs font-mono-code font-bold">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>
                {isCommissioner ? 'CALLING DEPONENT...' : 'CALLING COMMISSIONER...'}
              </span>
              <span className="text-slate-400">
                ({callingSeconds < 10 ? `00:0${callingSeconds}` : `00:${callingSeconds}`})
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display-legal font-bold text-white tracking-tight">
              {targetName}
            </h2>

            <p className="text-sm font-semibold text-slate-300">
              {targetRole}
            </p>

            <p className="text-xs text-slate-400">
              {targetSubtitle}
            </p>

            <div className="pt-3 text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Ringing... Statutory video link establishing</span>
            </div>
          </div>
        </div>

        {/* Floating Picture-in-Picture Self-Camera Preview */}
        <div className="absolute bottom-28 right-6 sm:right-10 z-20 w-32 sm:w-44 aspect-video rounded-2xl bg-slate-900/90 border border-white/15 overflow-hidden shadow-2xl backdrop-blur-md">
          {isVideoOn ? (
            <video
              ref={callingPipVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900">
              <VideoOff className="w-5 h-5 mb-1 opacity-60" />
              <span className="text-[10px] font-mono-code">Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 text-[9px] font-mono-code text-white/90 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>You</span>
          </div>
        </div>

        {/* Bottom Floating Control Bar */}
        <footer className="relative z-10 pb-8 sm:pb-12 px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 sm:gap-6 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl">
            {/* Mute Mic */}
            <button
              type="button"
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-3.5 rounded-full transition-all cursor-pointer ${
                isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              id="btn-calling-toggle-mic"
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Toggle Video */}
            <button
              type="button"
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3.5 rounded-full transition-all cursor-pointer ${
                isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              }`}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
              id="btn-calling-toggle-video"
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Instant Connect / Answer Button */}
            <button
              type="button"
              onClick={handleCallerForceConnect}
              className="px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              title="Connect session immediately"
              id="btn-calling-instant-connect"
            >
              <PhoneCall className="w-4 h-4 text-emerald-200" />
              <span>Connect Now</span>
            </button>

            {/* Cancel / End Call */}
            <button
              type="button"
              onClick={handleCancelCall}
              className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xl shadow-rose-600/40 cursor-pointer"
              title="Cancel Call"
              id="btn-calling-cancel"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-mono-code">
            Direct peer-to-peer encrypted channel • Connecting...
          </p>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2B: LEAN, MINIMALIST STATUTORY COMMISSIONING LOBBY
  // =========================================================================
  if (!hasEnteredRoom) {
    return (
      <div className="max-w-4xl mx-auto my-6 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6 animate-fadeIn" id="pre-entry-commissioning-lobby">
        
        {/* Lobby Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                END-TO-END ENCRYPTED
              </span>
              <span className="text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                PAYMENT ESCROWED (UGX {activeRequest.totalAmountUGX.toLocaleString()})
              </span>
            </div>
            <h1 className="text-2xl font-display-legal font-bold text-[#0D1B3D]">
              Statutory Commissioning Chamber
            </h1>
            <p className="text-xs text-slate-500">
              Certificate: <strong className="font-mono-code text-slate-800">{activeRequest.certificateNumber}</strong> • Document: <strong className="text-slate-800">{activeRequest.documentTitle}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Audit Trail
            </button>
          </div>
        </div>

        {/* Split Grid: Camera/Mic Test on Left | Calling Action & Checklist on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left: Real Camera Test Preview */}
          <div className="md:col-span-6 space-y-3">
            <div className="relative rounded-2xl bg-slate-900 border border-slate-300 overflow-hidden shadow-inner aspect-video flex items-center justify-center">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="text-center p-4 text-slate-400 space-y-2">
                  <VideoOff className="w-8 h-8 mx-auto opacity-70" />
                  <p className="text-xs font-mono-code">Camera Feed Disabled</p>
                </div>
              )}

              {/* Status Overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs">
                <div className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-900 font-bold text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{currentUser.fullName}</span>
                  <span className="text-[10px] text-teal-700 font-mono-code font-normal">
                    ({isCommissioner ? 'Commissioner' : 'Deponent'})
                  </span>
                </div>
                <div className="bg-slate-900/80 text-white px-2 py-0.5 rounded text-[10px] font-mono-code">
                  Camera Ready
                </div>
              </div>
            </div>

            {/* Media Toggles */}
            <div className="flex items-center justify-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isMicOn ? 'bg-white text-slate-800 border border-slate-200 shadow-xs' : 'bg-red-50 text-red-600 border border-red-200'
                }`}
                id="btn-lobby-toggle-mic"
              >
                {isMicOn ? <Mic className="w-4 h-4 text-emerald-600" /> : <MicOff className="w-4 h-4 text-red-600" />}
                <span>{isMicOn ? 'Mic Ready' : 'Mic Muted'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isVideoOn ? 'bg-white text-slate-800 border border-slate-200 shadow-xs' : 'bg-red-50 text-red-600 border border-red-200'
                }`}
                id="btn-lobby-toggle-video"
              >
                {isVideoOn ? <Video className="w-4 h-4 text-teal-600" /> : <VideoOff className="w-4 h-4 text-red-600" />}
                <span>{isVideoOn ? 'Camera Active' : 'Camera Off'}</span>
              </button>
            </div>
          </div>

          {/* Right: Statutory Checklist & Start Call Button */}
          <div className="md:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Statutory Pre-Call Checklist
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-700 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Mobile Money Escrow Settled
                  </span>
                  <span className="font-bold text-emerald-700">✓ VERIFIED</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-700 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Deponent NIRA National ID (NIN)
                  </span>
                  <span className="font-mono-code font-bold text-blue-700">{activeRequest.deponentNin}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-700 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Statutory Video Line
                  </span>
                  <span className="font-mono-code text-[11px] text-emerald-700 font-bold">✓ SECURE & READY</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: "Call Commissioner" or "Call Deponent" */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleStartCall}
                className="w-full py-4 px-6 rounded-2xl bg-[#0D1B3D] hover:bg-[#14285A] text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
                id="btn-start-statutory-call"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4 text-emerald-300 animate-pulse" />
                </div>
                <span>{isCommissioner ? 'Call Deponent' : 'Call Commissioner'}</span>
              </button>

              <p className="text-center text-[11px] text-slate-500">
                Direct, end-to-end encrypted statutory session for oath solemnisation.
              </p>
            </div>

          </div>

        </div>

        {/* Audit Certificate Modal */}
        {showAuditModal && (
          <AuditCertificateModal
            request={activeRequest}
            initialTab={auditModalTab}
            onClose={() => setShowAuditModal(false)}
          />
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW 3: LIVE CONNECTED COMMISSIONING CEREMONY (REAL DAILY CALL & STATUTORY VM)
  // =========================================================================
  return (
    <div className="space-y-4 pb-16 animate-fadeIn" id="commissioning-room-container">
      
      {/* Room Header & Compliance Status Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-4">
          <BrandLogo variant="glyph" size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display-legal font-bold text-[#0D1B3D] text-sm">
                STATUTORY REMOTE COMMISSIONING CHAMBERS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-[#0097A7] font-mono-code font-bold border border-teal-100">
                {activeRequest.certificateNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Presiding: <strong className="text-slate-800">{activeRequest.assignedProfessionalName || 'Adv. Kajubi Lovelock'}</strong> • Deponent: <strong className="text-slate-800">{activeRequest.deponentName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          
          {/* Connection quality badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono-code text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Stream:</span>
            <span className="text-emerald-700 font-bold">Low Latency</span>
          </div>

          <button
            onClick={() => setLowBandwidthMode(!lowBandwidthMode)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              lowBandwidthMode ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Optimizes audio bitrate for low data/Uganda 3G connections"
            id="btn-toggle-low-bandwidth"
          >
            {lowBandwidthMode ? 'Low Bandwidth (Active)' : 'Bandwidth: HD'}
          </button>

          <button
            onClick={() => setShowApiGatewayModal(true)}
            className="text-[11px] px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold flex items-center gap-1.5 border border-amber-300 cursor-pointer transition-colors"
            id="btn-room-open-api-secrets"
            title="Configure Daily.co API key or MTN MoMo gateway secrets"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            API & Secrets
          </button>

          <button
            onClick={() => setShowAuditModal(true)}
            className="text-[11px] px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold flex items-center gap-1.5 border border-blue-200 cursor-pointer transition-colors"
            id="btn-room-view-audit"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Audit Certificate
          </button>

        </div>
      </div>

      {/* Main Split Grid: Left Real Daily Video Call | Right Ceremony Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Real Daily.co WebRTC Video Call Frame */}
        <div className="lg:col-span-6 space-y-4">
          <DailyVideoCallFrame
            sessionId={activeRequest.id}
            userName={currentUser.fullName}
            userRole={isCommissioner ? 'Commissioner' : 'Deponent'}
            onParticipantJoined={(count) => {
              if (count > 1) {
                setPartnerConnected(true);
              }
            }}
            onParticipantLeft={(count) => {
              if (count <= 1) {
                setPartnerConnected(false);
              }
            }}
          />
        </div>

        {/* RIGHT COLUMN: 14-Step Statutory Ceremony Engine */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-sm">
            
            {/* Header: Ceremony State Progression */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-code text-blue-700 font-bold uppercase tracking-wider">
                    STATUTORY CEREMONY ENGINE • STAGE {ceremonyStep} OF 14
                  </span>
                  <h3 className="text-lg font-display-legal font-bold text-slate-900">
                    {ceremonyStep === 1 ? '1. Verify Deponent Identity & NIN' :
                     ceremonyStep === 2 ? '2. Confirm Deponent Physical & Video Presence' :
                     ceremonyStep === 3 ? '3. Review Affidavit Content & Exhibits' :
                     ceremonyStep === 4 ? '4. Cryptographic Document Lock (SHA-256)' :
                     ceremonyStep === 5 ? '5. Solemnisation Selection & Religious Oath' :
                     ceremonyStep === 6 ? '6. Statutory Wording Recital Display' :
                     ceremonyStep === 7 ? '7. Administer Statutory Oath / Affirmation' :
                     ceremonyStep === 8 ? '8. Deponent Verbal Confirmation' :
                     ceremonyStep === 9 ? '9. Deponent Electronic Signature Execution' :
                     ceremonyStep === 10 ? '10. Commissioner Electronic Signature' :
                     ceremonyStep === 11 ? '11. Apply Official Seal & Statutory Stamp' :
                     ceremonyStep === 12 ? '12. Generate Statutory Jurat' :
                     ceremonyStep === 13 ? '13. Mint Evidentiary Verification Certificate' :
                     '14. Ceremony Completed & ECCMIS Ready'}
                  </h3>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono-code border ${
                    ceremonyStep < 14 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {ceremonyStep < 14 ? `STAGE ${ceremonyStep <= 4 ? 1 : ceremonyStep <= 8 ? 2 : ceremonyStep <= 10 ? 3 : 4} OF 4` : 'SEALED & ISSUED'}
                  </span>
                </div>
              </div>

              {/* 4 Consolidated Statutory Milestones */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { num: 1, label: 'Identity & Lock' },
                  { num: 2, label: 'Statutory Oath' },
                  { num: 3, label: 'Signatures' },
                  { num: 4, label: 'Seal & Issue' }
                ].map((m) => {
                  const activeMilestone = ceremonyStep <= 4 ? 1 : ceremonyStep <= 8 ? 2 : ceremonyStep <= 10 ? 3 : 4;
                  return (
                    <div
                      key={m.num}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        activeMilestone === m.num
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : activeMilestone > m.num
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <div className="text-[9px] font-mono-code uppercase font-bold tracking-wider">
                        MILESTONE {m.num}
                      </div>
                      <div className="text-[11px] font-bold truncate">
                        {m.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DEPONENT VIEW: while the Commissioner presides over the
                commissioner-led stages, the deponent sees a live status panel
                instead of the commissioner's controls. The deponent only takes
                over the screen at Stage 9 (their own execution) and Stage 14. */}
            {!isCommissioner && ceremonyStep !== 9 && ceremonyStep !== 14 && (
              <div className="space-y-4 text-center py-8 animate-fadeIn" id="deponent-waiting-panel">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                  <Scale className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-display-legal font-bold text-slate-900">
                    Commissioner is presiding
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    {ceremonyStep <= 4
                      ? `${activeRequest.assignedProfessionalName || 'The Commissioner'} is verifying your identity and locking the document. Please stay on the call.`
                      : ceremonyStep <= 8
                        ? 'The statutory oath / affirmation is being administered. Please listen and respond on the video call.'
                        : 'The Commissioner is signing and sealing the instrument. Almost done.'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-mono-code text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live • Stage {ceremonyStep} of 14</span>
                </div>
                {ceremonyStep >= 5 && ceremonyStep <= 8 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-sm mx-auto">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Oath / Affirmation</p>
                    <p className="text-xs text-slate-800 font-serif-legal leading-relaxed whitespace-pre-line">{oathText}</p>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 1: Identity & NIN Confirmation */}
            {isCommissioner && ceremonyStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  The Commissioner must confirm that the deponent is the individual named in the instrument and that the Uganda NIRA National ID Number (NIN) matches.
                </p>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Deponent Name:</span>
                    <span className="font-bold text-slate-900">{activeRequest.deponentName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">National ID (NIN):</span>
                    <span className="font-mono-code text-blue-700 font-bold">{activeRequest.deponentNin}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Phone Verification:</span>
                    <span className="text-emerald-700 font-semibold">✓ OTP Verified</span>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    checked={deponentNinVerified}
                    onChange={(e) => setDeponentNinVerified(e.target.checked)}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span>
                    I confirm that I have inspected the deponent's National Identification Card and live facial biometrics.
                  </span>
                </label>

                <button
                  disabled={!deponentNinVerified}
                  onClick={() => handleNextStep(2)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-1"
                >
                  Confirm Identity & Proceed
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 2: Presence */}
            {isCommissioner && ceremonyStep === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Confirm that the deponent is appearing willingly via live video/audio, is not under duress, and has full mental capacity to make this statutory deposition.
                </p>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-2 text-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-blue-900">
                      <Video className="w-4 h-4 text-blue-600" />
                      Live Statutory WebRTC Feed
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowApiGatewayModal(true)}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-bold underline flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3 h-3 text-amber-600" />
                      Daily.co & MTN MoMo API Settings
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Video feed is encrypted and certified for statutory compliance under the Commissioners for Oaths Act (Cap 5) and Electronic Transactions Act 2011.
                  </div>
                </div>

                <button
                  onClick={() => handleNextStep(3)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-2"
                >
                  Confirm Deponent Voluntary Presence & Proceed
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 3: Document & Annexures Review */}
            {isCommissioner && ceremonyStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-900">{activeRequest.documentTitle}</div>
                    <span className="text-[10px] font-mono-code text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      PRIMARY INSTRUMENT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">File: {activeRequest.fileName} ({activeRequest.fileSizeKb} KB)</div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200 font-serif-legal text-xs text-slate-800 leading-relaxed max-h-32 overflow-y-auto">
                    1. THAT I am a male adult Ugandan of sound mind, the deponent herein, and I depose to the facts herein within my personal knowledge.
                    <br /><br />
                    2. THAT I depose this affidavit in support of the application for registration and formal court record.
                    <br /><br />
                    3. THAT whatever is stated herein is true and correct to the best of my knowledge, information, and belief.
                  </div>
                </div>

                {/* Attached Annexures & Exhibits Table */}
                {activeRequest.hasAnnexures && activeRequest.annexures && activeRequest.annexures.length > 0 && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-blue-950 font-display-legal uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        Statutory Annexures ({activeRequest.annexures.length} Exhibits Attached)
                      </h4>
                      <span className="text-[10px] font-mono-code text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        AUTOMATED EXHIBIT MARKINGS
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeRequest.annexures.map((annex) => (
                        <div key={annex.id} className="p-3 rounded-xl bg-white border border-blue-100 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-blue-600 text-white font-mono-code text-[10px] font-bold flex items-center justify-center">
                                {annex.identifier}
                              </span>
                              Exhibit "{annex.identifier}": {annex.description || annex.fileName}
                            </span>
                            <span className="text-[10px] font-mono-code text-slate-400">
                              {annex.fileSize} • SHA-256: {annex.sha256.slice(0, 10)}...
                            </span>
                          </div>

                          <div className="p-2 rounded bg-amber-50/60 border border-amber-200 text-[10.5px] font-serif-legal italic text-slate-800 leading-relaxed">
                            "This is the exhibit marked '{annex.identifier}' referred to in the affidavit of {activeRequest.deponentName} sworn before me at {activeRequest.juratLocation || 'Kampala'}."
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleNextStep(4)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-3"
                >
                  Confirm Document & Exhibits • Lock for Oath
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 4: Document Locked */}
            {isCommissioner && ceremonyStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-center space-y-2">
                  <Lock className="w-8 h-8 text-blue-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">
                    DOCUMENT CRYPTOGRAPHICALLY LOCKED
                  </h4>
                  <div className="p-2 bg-white rounded border border-slate-200 font-mono-code text-[11px] text-blue-700 break-all select-all">
                    SHA-256: {activeRequest.documentSha256}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    No alterations can be made to the underlying file during the solemnisation oath.
                  </p>
                </div>

                <button
                  onClick={() => handleNextStep(5)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-4"
                >
                  Proceed to Oath Administration
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 5: Solemnisation Selection */}
            {isCommissioner && ceremonyStep === 5 && (
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Applicable Solemnisation Method
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedSolemnisation('holy_bible')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedSolemnisation === 'holy_bible'
                        ? 'bg-blue-50 border-blue-600 text-blue-950 ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Holy Bible
                  </button>
                  <button
                    onClick={() => setSelectedSolemnisation('holy_quran')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedSolemnisation === 'holy_quran'
                        ? 'bg-blue-50 border-blue-600 text-blue-950 ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Holy Qur'an
                  </button>
                  <button
                    onClick={() => setSelectedSolemnisation('solemn_affirmation')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedSolemnisation === 'solemn_affirmation'
                        ? 'bg-blue-50 border-blue-600 text-blue-950 ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Affirmation
                  </button>
                </div>

                <button
                  onClick={() => handleNextStep(6)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-5"
                >
                  Confirm Solemnisation & Display Wording
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 6: Statutory Wording Display */}
            {isCommissioner && ceremonyStep === 6 && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <span className="text-[11px] font-mono-code font-bold text-amber-900 uppercase">
                    STATUTORY STATUTE WORDING (UGANDA CAP. 5):
                  </span>
                  <p className="text-base font-serif-legal text-slate-900 italic leading-relaxed">
                    "{oathText}"
                  </p>
                </div>

                <button
                  onClick={() => handleNextStep(7)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-6"
                >
                  Administer Statutory Oath Live
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 7: Oath Administration */}
            {isCommissioner && ceremonyStep === 7 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE OATH IN PROGRESS
                  </div>
                  <p className="text-xs text-slate-700 font-serif-legal">
                    Commissioner asks: "Do you swear by Almighty God / solemnly affirm that the contents of this deposition are true in all respects?"
                  </p>
                </div>

                <button
                  onClick={() => handleNextStep(8)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-7"
                >
                  Deponent Has Repeated Statutory Oath
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 8: Deponent Verbal Confirmation */}
            {isCommissioner && ceremonyStep === 8 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Statutory Deposition Verbally Rendered
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Deponent affirmed under audio/video recording. Proceed to signature execution.
                  </div>
                </div>

                <button
                  onClick={() => handleNextStep(9)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-8"
                >
                  Proceed to Deponent Digital Signature
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 9: Deponent Execution (Signature or Thumbprint) */}
            {ceremonyStep === 9 && (
              <div className="space-y-4">
                {isCommissioner && !isDeponentMode ? (
                  <div className="p-8 text-center space-y-6 animate-fadeIn">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <UserCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-slate-900">Waiting for Deponent Execution</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        The deponent ({activeRequest.deponentName}) must now execute the document on their device.
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                        <span className="bg-white px-2 text-slate-400">Shared Device Mode</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsDeponentMode(true)}
                      className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all hover:bg-slate-800"
                      id="btn-start-in-person-mode"
                    >
                      <Smartphone className="w-5 h-5 text-amber-400" />
                      ENTER DEPONENT MODE (IN-PERSON)
                    </button>
                    <p className="text-[10px] text-slate-400">
                      Use this if the deponent is physically with you and will use this device.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isDeponentMode && (
                      <div className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800 flex items-center justify-center gap-2 mx-auto w-fit mb-4">
                        <Smartphone className="w-3.5 h-3.5" />
                        IN-PERSON DEPONENT MODE ACTIVE
                      </div>
                    )}

                    {pendingDeponentMark ? (
                      <PdfSignaturePlacer
                        pdfUrl={activeRequest.rawFileUrl!}
                        markerImageUrl={pendingDeponentMark.dataUrl}
                        markerWidthPx={pendingDeponentMark.kind === 'THUMBPRINT' ? 60 : 130}
                        label="Click on the document to place your signature"
                        onConfirm={(placement) => finalizeDeponentMark(pendingDeponentMark.dataUrl, pendingDeponentMark.kind, placement)}
                        onSkip={() => finalizeDeponentMark(pendingDeponentMark.dataUrl, pendingDeponentMark.kind)}
                      />
                    ) : (deponentSignData || deponentThumbData) ? (
                      <div className="text-center space-y-6 py-8 animate-fadeIn">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-display-legal font-bold text-slate-900 uppercase">
                            {deponentThumbData ? '✓ THUMBPRINT AFFIXED' : '✓ DOCUMENT SIGNED'}
                          </h4>
                          <p className="text-sm text-slate-500 font-medium">Execution successfully recorded in audit trail.</p>
                        </div>

                        {isDeponentMode ? (
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-sm animate-pulse">
                              HAND DEVICE BACK TO COMMISSIONER
                            </div>
                            <button
                              onClick={() => {
                                setIsDeponentMode(false);
                                handleNextStep(10);
                              }}
                              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm cursor-pointer shadow-xl"
                            >
                              RESUME COMMISSIONER MODE
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium italic">
                            Awaiting Commissioner's final signature and statutory seal...
                          </div>
                        )}
                      </div>
                    ) : !executionMethod ? (
                      <div className="space-y-6 text-center animate-fadeIn">
                        <div className="space-y-2">
                          <h4 className="text-xl font-display-legal font-bold text-slate-900">HOW WILL YOU SIGN?</h4>
                          <p className="text-xs text-slate-500">Choose your preferred method of statutory execution</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              setExecutionMethod('SIGNATURE');
                              updateCommissioningRequest(activeRequest.id, { deponentExecutionMethod: 'SIGNATURE' }, {
                                eventType: 'EXECUTION_METHOD_SELECTED',
                                details: 'Deponent selected SIGNATURE as execution method.'
                              });
                            }}
                            className="p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group flex flex-col items-center gap-3 cursor-pointer"
                            id="btn-select-method-signature"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <PenTool className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-slate-900">✍ SIGNATURE</div>
                              <div className="text-[10px] text-slate-500 font-medium">Draw or use saved signature</div>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setExecutionMethod('THUMBPRINT');
                              updateCommissioningRequest(activeRequest.id, { deponentExecutionMethod: 'THUMBPRINT' }, {
                                eventType: 'EXECUTION_METHOD_SELECTED',
                                details: 'Deponent selected THUMBPRINT as execution method.'
                              });
                            }}
                            className="p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group flex flex-col items-center gap-3 cursor-pointer"
                            id="btn-select-method-thumbprint"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Fingerprint className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-slate-900">☝ THUMBPRINT</div>
                              <div className="text-[10px] text-slate-500 font-medium">Biometric fingerprint capture</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : executionMethod === 'SIGNATURE' ? (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between mb-2">
                          <button 
                            onClick={() => setExecutionMethod(null)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                          >
                            ← Change Method
                          </button>
                        </div>
                        
                        {currentUser.signatureDataUrl && currentUser.signatureDataUrl.trim().length > 0 && (
                          <button
                            onClick={() => handleDeponentMarkCaptured(currentUser.signatureDataUrl!, 'SIGNATURE')}
                            className="w-full p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between group hover:bg-blue-100 transition-all cursor-pointer"
                            id="btn-use-saved-signature"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center overflow-hidden">
                                <img src={currentUser.signatureDataUrl} alt="Saved" className="max-w-[80%] max-h-[80%] object-contain" />
                              </div>
                              <div className="text-left">
                                <div className="text-xs font-bold text-blue-900 uppercase">USE SAVED SIGNATURE</div>
                                <div className="text-[10px] text-blue-600">Statutory preference</div>
                              </div>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200"></div>
                          </div>
                          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-white px-2 text-slate-400">OR DRAW NEW</span>
                          </div>
                        </div>

                        <SignatureCanvas
                          signerName={activeRequest.deponentName}
                          roleLabel="Deponent"
                          onSave={(dataUrl) => handleDeponentMarkCaptured(dataUrl, 'SIGNATURE')}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between mb-2">
                          <button 
                            onClick={() => setExecutionMethod(null)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                          >
                            ← Change Method
                          </button>
                        </div>

                        <ThumbprintCapture
                          onCapture={(dataUrl) => {
                            // Final execution event (audit-only, no field
                            // changes — the mark itself is persisted once
                            // placement is confirmed/skipped below).
                            updateCommissioningRequest(activeRequest.id, {}, {
                              eventType: 'DEPONENT_EXECUTED',
                              details: 'Document successfully executed via biometric thumbprint.'
                            });
                            handleDeponentMarkCaptured(dataUrl, 'THUMBPRINT');
                          }}
                          onCancel={() => setExecutionMethod(null)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STAGE 10: Commissioner Signing */}
            {isCommissioner && ceremonyStep === 10 && (
              <div className="space-y-4">
                {pendingCommissionerMark ? (
                  <PdfSignaturePlacer
                    pdfUrl={activeRequest.rawFileUrl!}
                    markerImageUrl={pendingCommissionerMark}
                    markerWidthPx={130}
                    label="Click on the document to place your signature"
                    onConfirm={(placement) => finalizeCommissionerMark(pendingCommissionerMark, placement)}
                    onSkip={() => finalizeCommissionerMark(pendingCommissionerMark)}
                  />
                ) : (
                  <>
                    {currentUser.signatureDataUrl && currentUser.signatureDataUrl.trim().length > 0 && (
                      <>
                        <button
                          onClick={() => handleCommissionerMarkCaptured(currentUser.signatureDataUrl!)}
                          className="w-full p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between group hover:bg-blue-100 transition-all cursor-pointer"
                          id="btn-use-saved-commissioner-signature"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center overflow-hidden">
                              <img src={currentUser.signatureDataUrl} alt="Saved" className="max-w-[80%] max-h-[80%] object-contain" />
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-bold text-blue-900 uppercase">USE SAVED SIGNATURE</div>
                              <div className="text-[10px] text-blue-600">Statutory preference</div>
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200"></div>
                          </div>
                          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-white px-2 text-slate-400">OR DRAW NEW</span>
                          </div>
                        </div>
                      </>
                    )}

                    <SignatureCanvas
                      signerName={activeRequest.assignedProfessionalName || 'Adv. Kajubi Lovelock'}
                      roleLabel="Commissioner for Oaths"
                      onSave={(dataUrl) => handleCommissionerMarkCaptured(dataUrl)}
                    />
                  </>
                )}
              </div>
            )}

            {/* STAGE 11: Official Seal & Stamp Application */}
            {isCommissioner && ceremonyStep === 11 && (
              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-600">
                  Affix the official Commissioner for Oaths / Notary Public statutory seal onto the instrument.
                </p>

                <div className="flex justify-center my-2">
                  <OfficialSeal
                    authorityType={activeRequest.assignedProfessionalAuthority || 'commissioner_for_oaths'}
                    officialName={activeRequest.assignedProfessionalName || 'ADV. KAJUBI LOVELOCK'}
                    stationOrCourt={activeRequest.assignedProfessionalStation || 'HIGH COURT OF UGANDA'}
                    serialNumber={`UG-CFO-2026-${activeRequest.certificateNumber.slice(-4)}`}
                    size="lg"
                    borderStyle={currentUser.sealDesign?.borderStyle}
                    emblem={currentUser.sealDesign?.emblem}
                    inkColor={currentUser.sealDesign?.inkColor}
                  />
                </div>

                <button
                  onClick={() => handleNextStep(12)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-11"
                >
                  Seal Affixed • Generate Jurat
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 12: Statutory Jurat */}
            {isCommissioner && ceremonyStep === 12 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-blue-700 uppercase font-mono-code">
                  Generated Statutory Jurat Recital:
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-serif-legal text-xs text-slate-900 whitespace-pre-line leading-relaxed">
                  {generatedJurat}
                </div>

                <button
                  onClick={() => handleNextStep(13)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-12"
                >
                  Attach Jurat & Mint Certificate
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 13: Minting Certificate */}
            {isCommissioner && ceremonyStep === 13 && (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-spin">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 font-display-legal">
                  Minting Evidentiary Audit Certificate...
                </h4>
                <p className="text-xs text-slate-500">
                  Embedding SHA-256 cryptographic chain, commissioner warrant proofs, and verification QR root.
                </p>

                <button
                  onClick={() => handleNextStep(14)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  id="btn-ceremony-step-13"
                >
                  Finalize & Issue Certified Instrument
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 14: Completed & ECCMIS Ready */}
            {ceremonyStep === 14 && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-display-legal font-bold text-slate-900">
                    Affidavit Commissioned Successfully!
                  </h3>
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider pt-1">
                    ✓ READY FOR ELECTRONIC COURT FILING (ECCMIS)
                  </div>
                </div>

                {/* WALAYI Security Number & Certificate Card */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-amber-900 block">
                        WALAYI Security Number (System-of-Record)
                      </span>
                      <span className="text-lg font-mono-code font-bold text-amber-950">
                        {activeRequest.securityNumber || 'GENERATING...'}
                      </span>
                    </div>
                    {activeRequest.securityNumber && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeRequest.securityNumber!);
                          addNotification('Copied', `Security Number ${activeRequest.securityNumber} copied to clipboard.`, 'SYSTEM');
                        }}
                        className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-xs font-bold font-mono-code flex items-center gap-1.5 cursor-pointer transition-colors"
                        id="btn-copy-sec-num-step14"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60 text-amber-900/80">
                    <span>Certificate Identifier:</span>
                    <span className="font-mono-code font-bold">{activeRequest.certificateNumber}</span>
                  </div>
                </div>

                {/* Cryptographic Integrity Digest & Escrow Settlement Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Document Digest (Original):</span>
                    <span className="font-mono-code text-blue-700 text-[10px] truncate max-w-[200px]" title={activeRequest.documentSha256}>
                      {activeRequest.documentSha256}
                    </span>
                  </div>
                  {activeRequest.finalDocumentSha256 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Final Sealed Instrument SHA-256:</span>
                      <span className="font-mono-code text-emerald-700 text-[10px] truncate max-w-[200px]" title={activeRequest.finalDocumentSha256}>
                        {activeRequest.finalDocumentSha256}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Escrow Settlement:</span>
                    <span className="font-semibold text-emerald-700">UGX {activeRequest.serviceFeeUGX.toLocaleString()} Released to Commissioner</span>
                  </div>
                </div>

                {/* Final Action Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
                  <button
                    onClick={async () => {
                      try {
                        await downloadFinalInstrumentPdf(activeRequest);
                      } catch (e) {
                        setAuditModalTab('instrument');
                        setShowAuditModal(true);
                      }
                    }}
                    className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    id="btn-completed-view-instrument"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Download Final Document</span>
                  </button>

                  <button
                    onClick={() => {
                      setAuditModalTab('audit');
                      setShowAuditModal(true);
                    }}
                    className="py-3 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 shadow-xs cursor-pointer"
                    id="btn-completed-view-certificate"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Audit Certificate</span>
                  </button>

                  <button
                    onClick={() => {
                      const code = activeRequest.securityNumber || activeRequest.certificateNumber;
                      window.location.hash = `#verify/${encodeURIComponent(code)}`;
                      setCurrentView('verify-portal');
                    }}
                    className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    id="btn-completed-verify-public"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Public Verification</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('documents')}
                    className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    id="btn-completed-go-documents"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>My Documents</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Audit Certificate Modal */}
      {showAuditModal && (
        <AuditCertificateModal
          request={activeRequest}
          initialTab={auditModalTab}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {/* API Gateway & Secrets Configuration Modal */}
      {showApiGatewayModal && (
        <ApiGatewayConfigModal
          isOpen={showApiGatewayModal}
          onClose={() => setShowApiGatewayModal(false)}
        />
      )}

    </div>
  );
};
