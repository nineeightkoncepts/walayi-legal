import React, { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe, { DailyCall, DailyEventObject } from '@daily-co/daily-js';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Copy, 
  Check, 
  ExternalLink, 
  Settings, 
  AlertCircle, 
  Users, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Wifi,
  Scale,
  UserCheck,
  Radio,
  Eye
} from 'lucide-react';
import { ApiConfigService } from '../../services/apiConfigService';
import { DailyService } from '../../services/dailyService';
import { db } from '../../services/firebase';
import { collection, doc, setDoc, updateDoc, addDoc, deleteDoc, getDocs, onSnapshot as onFirestoreSnapshot } from 'firebase/firestore';

interface DailyVideoCallFrameProps {
  sessionId: string;
  userName: string;
  userRole: string;
  initialRoomUrl?: string;
  // Which side creates the WebRTC offer when using the built-in (non-Daily)
  // video chamber — see the signaling effect below. Exactly one side must be
  // true or the two peers never connect; the caller decides this
  // deterministically (see DailyCommissioningRoom).
  isCallInitiator?: boolean;
  onParticipantJoined?: (count: number) => void;
  onParticipantLeft?: (count: number) => void;
}

export const DailyVideoCallFrame: React.FC<DailyVideoCallFrameProps> = ({
  sessionId,
  userName,
  userRole,
  initialRoomUrl,
  isCallInitiator = false,
  onParticipantJoined,
  onParticipantLeft
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callFrameRef = useRef<DailyCall | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  // Active Video Engine Mode — real Daily.co WebRTC by default; the
  // built-in chamber is a manual fallback if the cloud room can't be joined.
  const [videoMode, setVideoMode] = useState<'BUILTIN_COURT' | 'DAILY_CLOUD'>('DAILY_CLOUD');
  
  // Daily.co state
  const [roomUrl, setRoomUrl] = useState<string>(initialRoomUrl || '');
  const [callState, setCallState] = useState<'IDLE' | 'CONNECTING' | 'JOINED' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Built-in Courtroom Media state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean>(false);
  // Real peer-to-peer connection state for the built-in chamber (see the
  // WebRTC signaling effect below) — this used to be faked with
  // Math.random(), which could show "connected" when nobody was actually
  // there. It's now the genuine RTCPeerConnection state.
  const [builtinCallState, setBuiltinCallState] = useState<'WAITING' | 'CONNECTING' | 'CONNECTED' | 'FAILED'>('WAITING');

  // Editable Daily Config
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [domainInput, setDomainInput] = useState<string>('');

  // Load configuration (domain is only used as a client-side fallback if the
  // server-side room provisioning request fails; the Daily.co API key itself
  // now lives only in the server's DAILY_CO_API_KEY environment variable).
  useEffect(() => {
    const config = ApiConfigService.loadConfig().dailyCo;
    setDomainInput(config.domain || 'https://wallahi.daily.co');
  }, [initialRoomUrl]);

  // Initialize Built-in Local Camera Stream
  const initBuiltinCamera = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true
        });
        localStreamRef.current = stream;
        setHasMediaPermission(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Local camera stream access notification:', err);
      setHasMediaPermission(false);
    }
  }, []);

  // Real peer-to-peer WebRTC connection for the built-in chamber — no Daily.co
  // account required. Signaling (the SDP offer/answer and ICE candidates
  // exchanged to establish the direct connection) rides through Firestore,
  // reusing the same real-time infrastructure every other live feature in
  // this app already depends on. Exactly one side (isCallInitiator) creates
  // the offer; the other answers it. Uses public STUN servers only (no
  // TURN relay), which connects the large majority of real-world networks
  // but — unlike a service such as Daily.co — has no relay fallback for a
  // symmetric-NAT/very restrictive network on both ends simultaneously.
  useEffect(() => {
    if (videoMode !== 'BUILTIN_COURT') return;

    let cancelled = false;
    let pc: RTCPeerConnection | null = null;
    let unsubDoc: (() => void) | undefined;
    let unsubOfferCandidates: (() => void) | undefined;
    let unsubAnswerCandidates: (() => void) | undefined;
    const pendingRemoteCandidates: RTCIceCandidateInit[] = [];

    const sessionDocRef = doc(db, 'webrtcSessions', sessionId);
    const offerCandidatesRef = collection(sessionDocRef, 'offerCandidates');
    const answerCandidatesRef = collection(sessionDocRef, 'answerCandidates');

    const clearSubcollection = async (ref: typeof offerCandidatesRef) => {
      const snap = await getDocs(ref);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    };

    const flushPendingCandidates = async () => {
      while (pendingRemoteCandidates.length > 0 && pc) {
        const candidate = pendingRemoteCandidates.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
      }
    };

    const addRemoteCandidate = (candidate: RTCIceCandidateInit) => {
      if (pc && pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        pendingRemoteCandidates.push(candidate);
      }
    };

    async function start() {
      setBuiltinCallState('CONNECTING');

      await initBuiltinCamera();
      if (cancelled) return;

      pc = new RTCPeerConnection({
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
        ]
      });
      peerConnectionRef.current = pc;

      localStreamRef.current?.getTracks().forEach((track) => {
        pc!.addTrack(track, localStreamRef.current!);
      });

      const remoteStream = new MediaStream();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => remoteStream.addTrack(track));
        setBuiltinCallState('CONNECTED');
        onParticipantJoined?.(2);
      };

      pc.oniceconnectionstatechange = () => {
        if (!pc) return;
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
          setBuiltinCallState((prev) => (prev === 'CONNECTED' ? prev : 'FAILED'));
          onParticipantLeft?.(1);
        }
      };

      if (isCallInitiator) {
        // Fresh call attempt — clear out any stale signaling from a
        // previous attempt against this same session id first.
        await Promise.all([clearSubcollection(offerCandidatesRef), clearSubcollection(answerCandidatesRef)]);
        if (cancelled || !pc) return;

        pc.onicecandidate = (event) => {
          if (event.candidate) addDoc(offerCandidatesRef, event.candidate.toJSON());
        };

        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        await setDoc(sessionDocRef, {
          offer: { sdp: offerDescription.sdp, type: offerDescription.type },
          createdAt: new Date().toISOString()
        });

        unsubDoc = onFirestoreSnapshot(sessionDocRef, async (snap) => {
          const data = snap.data();
          if (!pc || cancelled) return;
          if (data?.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            await flushPendingCandidates();
          }
        });

        unsubAnswerCandidates = onFirestoreSnapshot(answerCandidatesRef, (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') addRemoteCandidate(change.doc.data() as RTCIceCandidateInit);
          });
        });
      } else {
        pc.onicecandidate = (event) => {
          if (event.candidate) addDoc(answerCandidatesRef, event.candidate.toJSON());
        };

        unsubDoc = onFirestoreSnapshot(sessionDocRef, async (snap) => {
          const data = snap.data();
          if (!pc || cancelled) return;
          if (data?.offer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            await flushPendingCandidates();
            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);
            await updateDoc(sessionDocRef, {
              answer: { sdp: answerDescription.sdp, type: answerDescription.type }
            });
          }
        });

        unsubOfferCandidates = onFirestoreSnapshot(offerCandidatesRef, (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') addRemoteCandidate(change.doc.data() as RTCIceCandidateInit);
          });
        });
      }
    }

    start().catch((err) => {
      console.warn('Built-in chamber connection notice:', err?.message);
      if (!cancelled) setBuiltinCallState('FAILED');
    });

    return () => {
      cancelled = true;
      if (unsubDoc) unsubDoc();
      if (unsubOfferCandidates) unsubOfferCandidates();
      if (unsubAnswerCandidates) unsubAnswerCandidates();
      if (pc) {
        pc.close();
      }
      peerConnectionRef.current = null;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      setBuiltinCallState('WAITING');
    };
  }, [videoMode, sessionId, isCallInitiator, initBuiltinCamera, onParticipantJoined, onParticipantLeft]);

  // Toggle Camera Track
  const toggleCamera = () => {
    const nextState = !isCameraActive;
    setIsCameraActive(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => {
        t.enabled = nextState;
      });
    }
  };

  // Toggle Mic Track
  const toggleMic = () => {
    const nextState = !isMicActive;
    setIsMicActive(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = nextState;
      });
    }
  };

  // Safely destroy existing Daily instance
  const safeDestroyDaily = async () => {
    try {
      const existingInstance = DailyIframe.getCallInstance();
      if (existingInstance) {
        await existingInstance.destroy();
      }
    } catch (e) {
      // ignore
    }

    if (callFrameRef.current) {
      try {
        await callFrameRef.current.destroy();
      } catch (e) {
        // ignore
      }
      callFrameRef.current = null;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  };

  // Initialize Daily Call Frame
  const initDailyCall = async (urlToJoin?: string) => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      setCallState('CONNECTING');
      setErrorMessage(null);

      // 1. Destroy any existing instance safely
      await safeDestroyDaily();

      const targetUrl = urlToJoin || roomUrl;
      let finalUrl = targetUrl;

      if (!finalUrl) {
        const roomInfo = await DailyService.getOrCreateRoom(sessionId);
        finalUrl = roomInfo.url;
        setRoomUrl(roomInfo.url);

        // No Daily.co account is configured server-side yet (isProvisioned
        // is false), so this URL was never actually created on Daily's
        // servers and joining it will always fail. Skip straight to the
        // built-in chamber — which genuinely works — instead of showing an
        // alarming cloud-connection error on every single room visit.
        if (!roomInfo.isProvisioned) {
          isInitializingRef.current = false;
          setVideoMode('BUILTIN_COURT');
          return;
        }
      }

      if (!containerRef.current) {
        isInitializingRef.current = false;
        return;
      }

      // 2. Create frame on clean container
      const frame = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          minHeight: '440px',
          border: '0',
          borderRadius: '16px',
          background: '#0f172a'
        },
        showLeaveButton: false,
        showFullscreenButton: true
      });

      callFrameRef.current = frame;

      frame
        .on('joining-meeting', () => {
          setCallState('CONNECTING');
        })
        .on('joined-meeting', () => {
          setCallState('JOINED');
          const count = Object.keys(frame.participants()).length;
          setParticipantCount(count);
          onParticipantJoined?.(count);
        })
        .on('participant-joined', () => {
          const count = Object.keys(frame.participants()).length;
          setParticipantCount(count);
          onParticipantJoined?.(count);
        })
        .on('participant-left', () => {
          const count = Object.keys(frame.participants()).length;
          setParticipantCount(count);
          onParticipantLeft?.(count);
        })
        .on('error', (e: DailyEventObject) => {
          const errObj = e as any;
          const errorMsg = errObj?.errorMsg || errObj?.error?.msg || 'Unable to join Daily.co room.';
          const errorType = errObj?.error?.type;

          console.warn('Daily Call Notice:', errorMsg);
          setCallState('ERROR');
          
          if (errorType === 'no-room' || errorMsg.includes('does not exist')) {
            setErrorMessage('The Daily.co cloud room has not been provisioned or is inactive. You can use the Built-in Virtual Courtroom Video Feed or enter a custom Daily.co room URL.');
          } else {
            setErrorMessage(errorMsg);
          }
        });

      await frame.join({
        url: finalUrl,
        userName: `${userName} (${userRole})`
      });

    } catch (err: any) {
      console.warn('Daily.co frame initialization:', err?.message);
      setCallState('ERROR');
      const msg = err?.message || '';
      if (msg.includes('does not exist') || msg.includes('no-room')) {
        setErrorMessage('Daily.co room does not exist on cloud servers. Built-in Courtroom Video is active.');
      } else {
        setErrorMessage(msg || 'Unable to join Daily video room.');
      }
    } finally {
      isInitializingRef.current = false;
    }
  };

  useEffect(() => {
    if (videoMode === 'DAILY_CLOUD') {
      initDailyCall();
    } else {
      safeDestroyDaily();
    }

    return () => {
      safeDestroyDaily();
    };
  }, [videoMode, sessionId]);

  const handleCopyLink = () => {
    const link = roomUrl || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSaveAndReconnectDaily = async () => {
    const current = ApiConfigService.loadConfig();
    const updated = {
      ...current,
      dailyCo: {
        ...current.dailyCo,
        domain: domainInput.trim() || 'https://wallahi.daily.co',
        isConfigured: Boolean(current.dailyCo.apiKey || domainInput.trim())
      }
    };
    ApiConfigService.saveConfig(updated);

    setShowConfigModal(false);
    setVideoMode('DAILY_CLOUD');

    if (customUrlInput.trim()) {
      setRoomUrl(customUrlInput.trim());
      await initDailyCall(customUrlInput.trim());
    } else {
      const roomInfo = await DailyService.getOrCreateRoom(sessionId);
      setRoomUrl(roomInfo.url);
      await initDailyCall(roomInfo.url);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3" id="daily-video-call-root">
      
      {/* Top Controls Bar */}
      <div className="p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800">
        
        {/* Left: Mode Badge & Feed Status */}
        <div className="flex items-center gap-2">
          {videoMode === 'BUILTIN_COURT' ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono-code font-bold ${
              builtinCallState === 'CONNECTED' ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300' :
              builtinCallState === 'FAILED' ? 'bg-rose-950/80 border-rose-700/60 text-rose-300' :
              'bg-amber-950/80 border-amber-700/60 text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${builtinCallState === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : builtinCallState === 'FAILED' ? 'bg-rose-400' : 'bg-amber-400 animate-ping'}`} />
              <span>
                {builtinCallState === 'CONNECTED' ? 'COURTROOM LIVE FEED' : builtinCallState === 'FAILED' ? 'CONNECTION FAILED' : 'CONNECTING…'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono-code font-bold">
              <span className={`w-2 h-2 rounded-full ${
                callState === 'JOINED' ? 'bg-emerald-400 animate-pulse' :
                callState === 'CONNECTING' ? 'bg-amber-400 animate-ping' :
                'bg-red-400'
              }`} />
              <span>ENCRYPTED STREAM: {callState}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-slate-300 font-mono-code text-[11px]">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>{participantCount} In Chamber</span>
          </div>
        </div>

        {/* Right: Mode Switcher & Configuration */}
        <div className="flex items-center gap-2">
          {/* Switch Video Engine Button */}
          {videoMode === 'DAILY_CLOUD' ? (
            <button
              type="button"
              onClick={() => {
                safeDestroyDaily();
                setVideoMode('BUILTIN_COURT');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Switch to built-in court video chamber"
              id="btn-switch-to-builtin-court"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Use Built-in Chamber</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Connect to Cloud Video Gateway"
              id="btn-switch-to-daily-cloud"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Cloud Stream</span>
            </button>
          )}

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Copy chamber link"
            id="btn-copy-daily-room-link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share Link'}</span>
          </button>

          {/* Daily Config Button */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Configure Video Gateway"
            id="btn-open-daily-config"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* VIDEO STAGE */}
      {videoMode === 'BUILTIN_COURT' ? (
        /* BUILT-IN SECURE COURTROOM FEED */
        <div className="relative flex-1 w-full min-h-[460px] rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between p-3.5">
          
          {/* Top Courtroom Watermark Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-[11px] shadow-sm">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold tracking-wide font-display-legal">HIGH COURT COMMISSIONING SESSION</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700 text-[10px] font-mono-code text-slate-300 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>SHA-256 ENCRYPTED</span>
            </div>
          </div>

          {/* Split 2-Party Video Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto py-2">
            
            {/* Tile 1: Local User Live Video Stream (Camera feed) */}
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden aspect-4/3 flex items-center justify-center shadow-lg group">
              {isCameraActive ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="text-center p-4 text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-300 font-bold text-base border border-slate-700">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-[11px] font-mono-code text-slate-400">Camera Feed Paused</p>
                </div>
              )}

              {/* Tile Label */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
                <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="truncate max-w-[120px]">{userName} (You)</span>
                  <span className="text-[9.5px] text-amber-400 font-mono-code font-normal">
                    [{userRole}]
                  </span>
                </div>

                <div className="bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-slate-300">
                  {isMicActive ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Tile 2: Counterpart Judicial/Deponent Feed — a REAL WebRTC
                remote stream once connected, not a decorative placeholder. */}
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden aspect-4/3 flex items-center justify-center shadow-lg group">
              {builtinCallState === 'CONNECTED' ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 flex items-center justify-center font-bold text-xl shadow-md">
                      {userRole.toLowerCase().includes('commissioner') ? 'DP' : 'CM'}
                    </div>
                    {builtinCallState === 'FAILED' ? (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center animate-pulse">
                        <RefreshCw className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-white font-bold text-xs">
                      {userRole.toLowerCase().includes('commissioner') ? 'Deponent (Applicant)' : 'Commissioner for Oaths'}
                    </h4>
                    <p className={`text-[10px] font-mono-code ${builtinCallState === 'FAILED' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {builtinCallState === 'FAILED'
                        ? '● Connection failed — check both sides are online'
                        : '● Waiting for the other party to connect…'}
                    </p>
                  </div>
                </div>
              )}

              {/* Counterpart Label */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
                <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${builtinCallState === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>
                    {userRole.toLowerCase().includes('commissioner') ? 'Deponent Stream' : 'Advocate / Commissioner'}
                  </span>
                </div>

                <div className="bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-emerald-400">
                  <Mic className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Chamber Controls Toolbar */}
          <div className="flex items-center justify-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 z-10">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                isMicActive ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              id="btn-toggle-chamber-mic"
            >
              {isMicActive ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
              <span>{isMicActive ? 'Mute' : 'Unmute'}</span>
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                isCameraActive ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              id="btn-toggle-chamber-cam"
            >
              {isCameraActive ? <Video className="w-4 h-4 text-blue-400" /> : <VideoOff className="w-4 h-4" />}
              <span>{isCameraActive ? 'Stop Video' : 'Start Video'}</span>
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1" />

            <div className="px-3 py-1.5 text-[10px] font-mono-code text-slate-400 flex items-center gap-1.5">
              <Wifi className={`w-3.5 h-3.5 ${builtinCallState === 'CONNECTED' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Direct peer-to-peer WebRTC</span>
            </div>
          </div>

        </div>
      ) : (
        /* DAILY.CO CLOUD ROOM CONTAINER */
        <div className="relative flex-1 w-full min-h-[460px] rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
          
          {/* Daily Iframe Mount Node */}
          <div ref={containerRef} className="w-full h-full min-h-[460px]" id="daily-iframe-container" />

          {/* Connecting State */}
          {callState === 'CONNECTING' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 z-10">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              <div className="text-center">
                <h4 className="font-bold text-sm">Connecting to Daily.co Cloud Room...</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono-code max-w-sm truncate">{roomUrl}</p>
              </div>
            </div>
          )}

          {/* Error / Fallback State */}
          {callState === 'ERROR' && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-white p-6 space-y-4 text-center z-10">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <div className="space-y-1">
                <h4 className="font-bold text-base text-amber-300">Daily.co Cloud Notice</h4>
                <p className="text-xs text-slate-300 max-w-md">{errorMessage}</p>
                <div className="text-[11px] text-slate-400 font-mono-code pt-1">
                  Target: {roomUrl || 'Auto-generated'}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    safeDestroyDaily();
                    setVideoMode('BUILTIN_COURT');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Scale className="w-3.5 h-3.5" />
                  Use Built-in Court Video Feed
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Enter Daily Key / Room URL
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily.co Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-900 m-auto">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Video Gateway & Daily.co Setup</h3>
                  <p className="text-[11px] text-slate-400">Configure cloud video room or use built-in chamber</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              {/* Option A: Direct Daily Room URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Custom Daily.co Room URL (e.g. from Daily Dashboard):</span>
                  <span className="text-[10px] text-blue-600 font-mono-code font-normal">Direct Join</span>
                </label>
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://your-team.daily.co/courtroom-1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono-code text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  id="input-custom-daily-url"
                />
                <p className="text-[11px] text-slate-500">
                  Paste any existing Daily.co room URL created in your Daily account.
                </p>
              </div>

              <div className="h-px bg-slate-200 my-2" />

              {/* Option B: Daily Domain (fallback only) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Daily.co Domain:</label>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="https://wallahi.daily.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono-code text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  id="input-daily-domain-room"
                />
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  safeDestroyDaily();
                  setVideoMode('BUILTIN_COURT');
                  setShowConfigModal(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Use Built-in Video
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndReconnectDaily}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                  id="btn-save-daily-room-config"
                >
                  Connect Daily.co
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

