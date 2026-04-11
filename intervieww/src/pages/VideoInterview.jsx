import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { scoreAnswerLocal } from '../utils/scoreAnswerLocal';
import { finalizeSessionBehavior } from '../utils/behavioralScoring';
import {
  Sparkles, Mic, MicOff, Video, VideoOff,
  ChevronRight, CheckCircle, Volume2, VolumeX,
  AlertCircle, Star, RotateCcw, PhoneOff,
  ShieldAlert, Eye, EyeOff, Smartphone, MonitorOff,
  Upload, FileText, Briefcase, Loader, CornerDownRight
} from 'lucide-react';

const API = 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS BANK
// ─────────────────────────────────────────────────────────────────────────────
const ALL_QUESTIONS = {
  behavioral: [
    { text: "Tell me about a time you worked effectively under pressure.", ideal: "situation task action result STAR deadline pressure calm prioritized focused delivered outcome", keywords: ["pressure","deadline","result","calm","situation","outcome"] },
    { text: "Describe a situation where you resolved a conflict with a teammate.", ideal: "communication empathy listening conflict resolution teamwork common ground professional", keywords: ["conflict","communication","teamwork","resolution","empathy"] },
    { text: "Give an example of a goal you set and achieved.", ideal: "specific measurable goal planning steps obstacles overcome result achievement milestone", keywords: ["goal","planning","achievement","result","overcome"] },
    { text: "Tell me about a time you demonstrated leadership.", ideal: "took initiative guided team responsibility decision making motivated others positive outcome", keywords: ["leadership","initiative","team","decision","outcome"] },
    { text: "Describe a time you had to learn something new quickly.", ideal: "adaptability resourceful fast learning methods applied growth picked up practiced", keywords: ["learning","adaptability","fast","growth","skill"] },
  ],
  technical: [
    { text: "Explain the difference between authentication and authorization.", ideal: "authentication verify identity login credentials authorization permissions roles access control", keywords: ["authentication","authorization","permissions","roles","login"] },
    { text: "What are the four pillars of object-oriented programming?", ideal: "encapsulation inheritance polymorphism abstraction OOP class object", keywords: ["encapsulation","inheritance","polymorphism","abstraction"] },
    { text: "How does a RESTful API work?", ideal: "REST HTTP GET POST PUT DELETE stateless client server URL resources JSON response", keywords: ["REST","HTTP","stateless","JSON","response","endpoint"] },
    { text: "What is the difference between SQL and NoSQL databases?", ideal: "SQL relational structured tables schema NoSQL non-relational flexible document unstructured scalability", keywords: ["SQL","NoSQL","relational","schema","flexible"] },
    { text: "Explain how JWT authentication works end to end.", ideal: "user login server creates JWT header payload signature secret key client stores Authorization Bearer verify stateless", keywords: ["JWT","token","signature","stateless","header","verify"] },
  ],
  hr: [
    { text: "Why do you want to work at our company?", ideal: "researched company mission values culture product specific reasons align career goals motivated", keywords: ["company","mission","culture","motivation","fit"] },
    { text: "Where do you see yourself in 5 years?", ideal: "career growth develop skills leadership responsibility contribute aligned company vision ambitious", keywords: ["goals","growth","career","future","development"] },
    { text: "What are your greatest strengths?", ideal: "specific strengths concrete examples data stories achievements relevant skills demonstrate", keywords: ["strengths","skills","examples","achievements"] },
    { text: "How do you handle receiving critical feedback?", ideal: "welcome feedback growth listen openly not defensive clarify reflect action plan improve professional", keywords: ["feedback","growth","listening","improvement","professional"] },
    { text: "What motivates you at work?", ideal: "genuine motivation challenging problems impact growth collaboration recognition purpose", keywords: ["motivation","passion","growth","impact","challenge"] },
  ],
  mixed: [
    { text: "Tell me about yourself.", ideal: "professional background key skills experience career goals relevant role summary", keywords: ["background","experience","skills","goals","professional"] },
    { text: "What is your biggest professional achievement?", ideal: "STAR specific achievement quantify impact results initiative actions outcome", keywords: ["achievement","impact","result","initiative","quantify"] },
    { text: "Describe a challenging project you worked on.", ideal: "challenge context specific role responsibilities actions obstacles overcome outcome delivered", keywords: ["challenge","project","role","solution","outcome"] },
    { text: "How do you handle tight deadlines?", ideal: "prioritize urgent tasks communicate proactively break smaller steps focused stress deliver quality", keywords: ["deadline","prioritization","communication","focus","deliver"] },
    { text: "What makes you the best candidate for this role?", ideal: "skills experience match requirements unique value enthusiasm commitment contribute team", keywords: ["skills","experience","value","fit","contribute"] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// ROBOT FACE
// ─────────────────────────────────────────────────────────────────────────────
function RobotFace({ speaking, size=170 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <defs>
        <radialGradient id="rbg" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#0369a1"/><stop offset="100%" stopColor="#0f172a"/></radialGradient>
        <radialGradient id="reye" cx="40%" cy="30%" r="70%"><stop offset="0%" stopColor="#e0f2fe"/><stop offset="100%" stopColor="#0284c7"/></radialGradient>
        <filter id="rglow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <line x1="100" y1="10" x2="100" y2="32" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="100" cy="8" r="7" fill={speaking?"#bae6fd":"#0369a1"} filter="url(#rglow)">
        {speaking&&<><animate attributeName="r" values="7;11;7" dur="0.7s" repeatCount="indefinite"/><animate attributeName="fill" values="#bae6fd;#f0f9ff;#bae6fd" dur="0.7s" repeatCount="indefinite"/></>}
      </circle>
      <rect x="12" y="52" width="16" height="36" rx="8" fill="url(#rbg)" stroke="#0284c7" strokeWidth="1.5"/>
      <rect x="172" y="52" width="16" height="36" rx="8" fill="url(#rbg)" stroke="#0284c7" strokeWidth="1.5"/>
      <rect x="15" y="62" width="10" height="16" rx="4" fill="#7dd3fc" opacity="0.7">
        {speaking&&<animate attributeName="opacity" values="0.7;0.3;0.7" dur="0.4s" repeatCount="indefinite"/>}
      </rect>
      <rect x="175" y="62" width="10" height="16" rx="4" fill="#7dd3fc" opacity="0.7">
        {speaking&&<animate attributeName="opacity" values="0.3;0.7;0.3" dur="0.4s" repeatCount="indefinite"/>}
      </rect>
      <rect x="28" y="32" width="144" height="116" rx="28" fill="url(#rbg)" stroke="#0284c7" strokeWidth="2.5"/>
      <ellipse cx="72" cy="90" rx="22" ry="23" fill="#0f0a1e"/>
      <ellipse cx="128" cy="90" rx="22" ry="23" fill="#0f0a1e"/>
      <ellipse cx="72" cy="90" rx="16" ry="17" fill="url(#reye)" filter="url(#rglow)"/>
      <ellipse cx="128" cy="90" rx="16" ry="17" fill="url(#reye)" filter="url(#rglow)"/>
      <ellipse cx="72" cy="90" rx="8" ry="9" fill="#0f0a1e"/>
      <ellipse cx="128" cy="90" rx="8" ry="9" fill="#0f0a1e"/>
      <circle cx="76" cy="84" r="4" fill="white" opacity="0.9"/>
      <circle cx="132" cy="84" r="4" fill="white" opacity="0.9"/>
      {speaking&&<>
        <ellipse cx="72" cy="90" rx="18" ry="19" fill="#7dd3fc" opacity="0"><animate attributeName="opacity" values="0;0.25;0" dur="0.5s" repeatCount="indefinite"/></ellipse>
        <ellipse cx="128" cy="90" rx="18" ry="19" fill="#7dd3fc" opacity="0"><animate attributeName="opacity" values="0;0.25;0" dur="0.5s" begin="0.25s" repeatCount="indefinite"/></ellipse>
      </>}
      <circle cx="100" cy="112" r="4" fill="#075985"/>
      {speaking?(
        <rect x="72" y="122" width="56" height="12" rx="6" fill="#7dd3fc">
          <animate attributeName="height" values="12;20;7;17;10;14;12" dur="0.35s" repeatCount="indefinite"/>
          <animate attributeName="y" values="122;118;125;119;123;121;122" dur="0.35s" repeatCount="indefinite"/>
        </rect>
      ):(
        <path d="M74 128 Q100 142 126 128" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" fill="none"/>
      )}
      <circle cx="60" cy="144" r="4" fill="#075985" stroke="#0369a1" strokeWidth="1"/>
      <circle cx="140" cy="144" r="4" fill="#075985" stroke="#0369a1" strokeWidth="1"/>
    </svg>
  );
}

function ScoreBar({ score }) {
  const g=score>=70?'from-green-500 to-emerald-400':score>=45?'from-yellow-500 to-amber-400':'from-red-500 to-rose-400';
  const t=score>=70?'text-green-400':score>=45?'text-yellow-400':'text-red-400';
  const l=score>=70?'Excellent':score>=55?'Good':score>=40?'Fair':'Needs Work';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${g} rounded-full transition-all duration-1000`} style={{width:`${score}%`}}/>
      </div>
      <span className={`text-sm font-bold w-10 text-right ${t}`}>{score}%</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold bg-white/5 ${t}`}>{l}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WARNING OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function WarningOverlay({ type, countdown, onDismiss }) {
  if (!type) return null;
  const cfg = {
    tab:    { icon:<MonitorOff className="w-14 h-14 text-red-400"/>,    title:'Tab Switch Detected!',      sub:'You left the interview window.',            border:'border-red-500/50',    bg:'bg-red-950/90'    },
    face:   { icon:<Eye className="w-14 h-14 text-orange-400"/>,        title:'Look At The Screen!',        sub:'Keep your eyes on the camera.',              border:'border-orange-500/50', bg:'bg-orange-950/90' },
    noface: { icon:<EyeOff className="w-14 h-14 text-orange-400"/>,     title:'Face Not Visible!',          sub:'Please sit in front of the camera.',         border:'border-orange-500/50', bg:'bg-orange-950/90' },
    phone:  { icon:<Smartphone className="w-14 h-14 text-red-400"/>,    title:'Phone Detected!',            sub:'Put your mobile device away immediately.',   border:'border-red-500/50',    bg:'bg-red-950/90'    },
    mobile: { icon:<Smartphone className="w-14 h-14 text-red-400"/>,    title:'Mobile Device Detected!',   sub:'This interview must be taken on a computer.', border:'border-red-500/50',    bg:'bg-red-950/90'    },
  };
  const c = cfg[type] || cfg.tab;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className={`border-2 ${c.border} ${c.bg} backdrop-blur rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl`}>
        <div className="flex justify-center mb-4 animate-bounce">{c.icon}</div>
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <ShieldAlert className="w-4 h-4 text-red-400"/>
          <span className="text-red-400 text-xs font-black uppercase tracking-wider">Proctoring Violation</span>
        </div>
        <h2 className="text-white text-2xl font-black mb-2">{c.title}</h2>
        <p className="text-gray-300 text-sm mb-5">{c.sub}</p>
        <div className="text-red-400 text-5xl font-black mb-1">{countdown}</div>
        <div className="text-gray-500 text-xs mb-5">auto-dismissing in seconds</div>
        <button onClick={onDismiss} className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white transition-all">
          I Understand — Resume Interview
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISQUALIFIED SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function Disqualified({ log, onRetry }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-red-500/20 border-2 border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-12 h-12 text-red-400"/>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
          <span className="text-red-400 font-black text-xs uppercase tracking-widest">DISQUALIFIED</span>
        </div>
        <h1 className="text-4xl font-black mb-2">Interview Terminated</h1>
        <p className="text-gray-400 mb-6">You exceeded the maximum allowed violations.</p>
        <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-5 mb-6 text-left space-y-2">
          <div className="text-red-400 text-xs font-bold uppercase mb-3 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/>Violation Log</div>
          {log.map((v,i)=>(
            <div key={i} className="flex gap-2 text-sm text-gray-300">
              <span className="text-red-400 font-bold flex-shrink-0">#{i+1}</span><span>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard" className="flex-1 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white text-center text-sm">Dashboard</Link>
          <button onClick={onRetry} className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4"/>Retry
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const MAX_V = 3;

export default function VideoInterview() {
  // ── Interview state ──────────────────────────────────────────────────────
  const [phase, setPhase]               = useState('lobby');
  const [interviewType, setInterviewType] = useState('behavioral');
  const [questions, setQuestions]       = useState([]);
  const [qIndex, setQIndex]             = useState(0);
  const [transcript, setTranscript]     = useState('');
  const [interim, setInterim]           = useState('');
  const [isListening, setIsListening]   = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [isCamOn, setIsCamOn]           = useState(true);
  const [results, setResults]           = useState([]);
  const [speechError, setSpeechError]   = useState('');
  const [voiceOn, setVoiceOn]           = useState(true);
  const [camError, setCamError]         = useState('');
  const [aiCaption, setAiCaption]       = useState('');
  const [timer, setTimer]               = useState(0);

  // ── CV + Role state ───────────────────────────────────────────────────────
  const [jobRole, setJobRole]           = useState('');
  const [cvFile, setCvFile]             = useState(null);
  const [cvData, setCvData]             = useState(null);
  const [cvLoading, setCvLoading]       = useState(false);
  const [cvError, setCvError]           = useState('');
  const [currentFollowup, setCurrentFollowup] = useState(null); // followup question object or null
  const [mainQCount, setMainQCount]     = useState(5);   // total MAIN questions (never changes)
  const [mainQIndex, setMainQIndex]     = useState(0);   // which main question we're on
  const [loadingQs, setLoadingQs]       = useState(false);
  const [dashboardSyncError, setDashboardSyncError] = useState('');
  const [backendInterviewId, setBackendInterviewId] = useState(null);
  /** Always use this in async callbacks — React state can be stale after await. */
  const backendInterviewIdRef = useRef(null);
  const token = localStorage.getItem('token');

  // ── Proctoring UI state (display only — truth lives in P ref below) ──────
  const [warning, setWarning]     = useState(null);   // current warning type shown
  const [warnCD, setWarnCD]       = useState(8);      // countdown seconds
  const [vCount, setVCount]       = useState(0);      // violations shown in header
  const [vLog, setVLog]           = useState([]);     // log shown in results
  const [disqualified, setDisq]   = useState(false);

  // ── ALL proctoring truth in ONE mutable ref — ZERO stale closure bugs ───
  // Never read P.current in render, only in callbacks/effects
  const P = useRef({
    active:    false,  // proctoring running
    inWarning: false,  // warning overlay currently visible (blocks new violations)
    micGrace:  false,  // mic permission dialog may be open — suppress tab violations
    vCount:    0,
    vLog:      [],
    lastViolation: 0,  // timestamp — debounce duplicate violations
    lastByType: {},    // per-violation cooldown memory
  });

  // ── DOM / media refs ─────────────────────────────────────────────────────
  const lobbyVidRef     = useRef(null);
  const interviewVidRef = useRef(null);
  const streamRef       = useRef(null);
  const recogRef        = useRef(null);
  const isListeningRef  = useRef(false);  // ← MUST be declared BEFORE startListening
  const hasSpokenRef    = useRef(false);
  const timerRef        = useRef(null);
  const warnTimerRef    = useRef(null);
  const rafRef          = useRef(null);
  const faceCounters    = useRef({ noface: 0, lookaway: 0, phone: 0, faceSeen: 0 });

  /** Camera + mic signals for communication / confidence scoring */
  const behaviorAccumRef = useRef({ faceFrames: [], voiceSegments: [] });
  const audioContextRef   = useRef(null);
  const mediaSourceRef    = useRef(null);
  const analyserRef       = useRef(null);
  const voiceSampleIntervalRef = useRef(null);
  const voiceRmsScratchRef = useRef([]);

  const ttsOk = 'speechSynthesis' in window;

  // ─────────────────────────────────────────────────────────────────────────
  // CAMERA
  // ─────────────────────────────────────────────────────────────────────────
  const tearDownVoiceGraph = useCallback(() => {
    if (voiceSampleIntervalRef.current) {
      clearInterval(voiceSampleIntervalRef.current);
      voiceSampleIntervalRef.current = null;
    }
    voiceRmsScratchRef.current = [];
    try {
      mediaSourceRef.current?.disconnect();
    } catch {}
    mediaSourceRef.current = null;
    analyserRef.current = null;
    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch(() => {});
    }
  }, []);

  const initVoiceGraph = useCallback((stream) => {
    tearDownVoiceGraph();
    if (!stream?.getAudioTracks || stream.getAudioTracks().length === 0) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const source = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      an.smoothingTimeConstant = 0.55;
      source.connect(an);
      audioContextRef.current = ctx;
      mediaSourceRef.current = source;
      analyserRef.current = an;
    } catch {
      tearDownVoiceGraph();
    }
  }, [tearDownVoiceGraph]);

  const flushVoiceRmsToSegment = useCallback(() => {
    const arr = voiceRmsScratchRef.current;
    voiceRmsScratchRef.current = [];
    if (!arr || arr.length < 4) return;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const v = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(arr.length - 1, 1);
    const sd = Math.sqrt(Math.max(0, v));
    behaviorAccumRef.current.voiceSegments.push({
      meanRms: mean,
      rmsStd: sd,
      sampleCount: arr.length,
    });
  }, []);

  const stopVoiceMetering = useCallback(
    (flush) => {
      if (voiceSampleIntervalRef.current) {
        clearInterval(voiceSampleIntervalRef.current);
        voiceSampleIntervalRef.current = null;
      }
      if (flush) flushVoiceRmsToSegment();
      else voiceRmsScratchRef.current = [];
    },
    [flushVoiceRmsToSegment]
  );

  const startVoiceMetering = useCallback(() => {
    stopVoiceMetering(false);
    const an = analyserRef.current;
    if (!an) return;
    voiceRmsScratchRef.current = [];
    voiceSampleIntervalRef.current = setInterval(() => {
      const buf = new Uint8Array(an.fftSize);
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const x = (buf[i] - 128) / 128;
        sum += x * x;
      }
      voiceRmsScratchRef.current.push(Math.sqrt(sum / buf.length));
    }, 110);
  }, [stopVoiceMetering]);

  const startCam = async () => {
    try {
      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = s;
      initVoiceGraph(s);
      if (lobbyVidRef.current) lobbyVidRef.current.srcObject = s;
      if (interviewVidRef.current) interviewVidRef.current.srcObject = s;
      setCamError('');
    } catch {
      setCamError('Camera denied — allow access and reload.');
    }
  };
  const stopCam = () => {
    tearDownVoiceGraph();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  const toggleCam= () => { streamRef.current?.getVideoTracks().forEach(t=>{t.enabled=!t.enabled;}); setIsCamOn(p=>!p); };

  useEffect(()=>{ startCam(); }, []);
  useEffect(()=>{
    if (phase==='interview') setTimeout(()=>{ if(interviewVidRef.current&&streamRef.current) interviewVidRef.current.srcObject=streamRef.current; }, 150);
  }, [phase]);

  // ─────────────────────────────────────────────────────────────────────────
  // VIOLATION ENGINE — single function, reads P ref only
  // FIX: violation count now correctly increments because we always read
  //      from P.current.vCount (mutable ref), never from stale state
  // ─────────────────────────────────────────────────────────────────────────
  const fireViolation = useCallback((type, msg) => {
    const p = P.current;

    // Guards
    if (!p.active)    return;
    if (p.inWarning)  return;   // already showing a warning — don't stack
    if (p.micGrace)   return;   // mic permission dialog open — suppress

    // Debounce: same violation within 2 seconds = ignore duplicate event
    const now = Date.now();
    if (now - p.lastViolation < 2000) return;
    // Per-type cooldowns to prevent repeated false positives
    const cooldownMs = {
      phone: 18000,
      noface: 12000,
      face: 12000,
      tab: 3000,
      mobile: 30000,
    };
    const lastTypeTs = p.lastByType?.[type] || 0;
    if (now - lastTypeTs < (cooldownMs[type] || 8000)) return;
    p.lastViolation = now;
    p.lastByType = { ...(p.lastByType || {}), [type]: now };

    // Increment violation counter IN THE REF (never loses value between renders)
    p.vCount += 1;
    p.vLog    = [...p.vLog, msg];
    p.inWarning = true;

    const currentCount = p.vCount;  // capture for closure

    // Sync to React state so UI re-renders
    setVCount(currentCount);
    setVLog([...p.vLog]);
    setWarning(type);
    setWarnCD(8);

    // Speak warning aloud
    const speechMap = {
      tab:    'Warning! You switched tabs. This is a violation.',
      face:   'Warning! Please look at the screen.',
      noface: 'Warning! Your face is not visible. Please face the camera.',
      phone:  'Warning! Mobile phone detected. Put your device away.',
      mobile: 'Warning! You are using a mobile device. Please use a computer.',
    };
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speechMap[type] || speechMap.tab);
    u.rate = 1.05; u.volume = 1.0;
    window.speechSynthesis.speak(u);

    // Countdown timer — uses a local var (not state) so it never goes stale
    let cd = 8;
    clearInterval(warnTimerRef.current);
    warnTimerRef.current = setInterval(() => {
      cd -= 1;
      setWarnCD(cd);
      if (cd <= 0) {
        clearInterval(warnTimerRef.current);
        if (currentCount >= MAX_V) {
          // DISQUALIFY
          p.active    = false;
          p.inWarning = false;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(new SpeechSynthesisUtterance('You have been disqualified due to repeated violations.'));
          setDisq(true);
          setWarning(null);
          clearInterval(timerRef.current);
          stopCam();
          stopListening();
        } else {
          // Dismiss and allow next violation
          setWarning(null);
          p.inWarning = false;  // ← CRITICAL: re-enables violation detection
        }
      }
    }, 1000);
  }, []); // no deps — reads P ref directly

  const dismissWarning = useCallback(() => {
    if (P.current.vCount >= MAX_V) return; // can't dismiss on disqualification
    clearInterval(warnTimerRef.current);
    setWarning(null);
    P.current.inWarning = false;  // ← CRITICAL: re-enables violation detection
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB SWITCH DETECTION
  // Only uses visibilitychange (NOT window.blur — blur fires for mic dialog,
  // devtools, address bar, etc. and causes false positives on Speak click)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'interview') return;
    const onVis = () => {
      if (document.hidden) {
        fireViolation('tab', `Tab switch at ${new Date().toLocaleTimeString()}`);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [phase, fireViolation]);

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE DEVICE CHECK — runs on interview start
  // FIX: was defined but never called before. Now called in handleStart.
  // ─────────────────────────────────────────────────────────────────────────
  const checkMobileDevice = useCallback(() => {
    const ua = navigator.userAgent;
    // Check both user agent AND viewport size (catches tablets, small screens)
    const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const isMobileScreen = window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024);
    const isMobile = isMobileUA || isMobileScreen;
    if (!isMobile) return;
    // Fire immediately — bypasses active/inWarning guards since it's a boot check
    const p = P.current;
    if (p.inWarning) return;
    p.inWarning   = true;
    p.vCount     += 1;
    p.vLog        = [...p.vLog, `Mobile device detected (${ua.slice(0,40)}...)`];
    setVCount(p.vCount);
    setVLog([...p.vLog]);
    setWarning('mobile');
    setWarnCD(8);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance('Warning! Mobile device detected. This interview must be taken on a desktop computer.'));
    let cd = 8;
    clearInterval(warnTimerRef.current);
    warnTimerRef.current = setInterval(() => {
      cd -= 1; setWarnCD(cd);
      if (cd <= 0) {
        clearInterval(warnTimerRef.current);
        if (p.vCount >= MAX_V) {
          p.active=false; setDisq(true); setWarning(null); p.inWarning=false;
        } else {
          setWarning(null); p.inWarning=false;
        }
      }
    }, 1000);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FACE / GAZE DETECTION — canvas pixel analysis every 2.5 seconds
  // Checks: skin ratio (no face), center skin ratio (looking away)
  // ─────────────────────────────────────────────────────────────────────────
  const runFaceAnalysis = useCallback(() => {
    const vid = interviewVidRef.current;
    if (!P.current.active) return;
    if (!vid || vid.readyState < 2) {
      setTimeout(() => { if (P.current.active) rafRef.current = requestAnimationFrame(runFaceAnalysis); }, 2500);
      return;
    }
    const W=128, H=96;
    const cv = document.createElement('canvas');
    cv.width=W; cv.height=H;
    const ctx = cv.getContext('2d');
    ctx.drawImage(vid, 0, 0, W, H);
    try {
      const { data } = ctx.getImageData(0, 0, W, H);
      let totalSkin=0, centerSkin=0;
      // center region where face should be
      const [cx1,cx2,cy1,cy2] = [W*.2, W*.8, H*.08, H*.75];
      for (let i=0; i<data.length; i+=4) {
        const r=data[i], g=data[i+1], b=data[i+2];
        // Broad skin heuristic covering many skin tones
        const isSkin = r>50 && g>25 && b>10 && r>b && (r-Math.min(g,b))>10 && r<252;
        if (isSkin) {
          totalSkin++;
          const idx=i/4, px=idx%W, py=Math.floor(idx/W);
          if (px>cx1&&px<cx2&&py>cy1&&py<cy2) centerSkin++;
        }
      }
      const totalRatio  = totalSkin / (W*H);
      const centerRatio = centerSkin / ((cx2-cx1)*(cy2-cy1));

      let lsq = 0;
      let ls = 0;
      let ln = 0;
      const x1 = Math.max(0, Math.floor(cx1));
      const x2 = Math.min(W, Math.ceil(cx2));
      const y1 = Math.max(0, Math.floor(cy1));
      const y2 = Math.min(H, Math.ceil(cy2));
      for (let py = y1; py < y2; py++) {
        for (let px = x1; px < x2; px++) {
          const ii = (py * W + px) * 4;
          const r = data[ii];
          const g = data[ii + 1];
          const b = data[ii + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          ls += lum;
          lsq += lum * lum;
          ln++;
        }
      }
      const lmean = ln > 0 ? ls / ln : 0;
      const centerLumaStd =
        ln > 2 ? Math.sqrt(Math.max(0, lsq / ln - lmean * lmean)) : 0;

      if (P.current.active) {
        const b = behaviorAccumRef.current;
        b.faceFrames.push({ totalRatio, centerRatio, centerLumaStd });
        if (b.faceFrames.length > 400) b.faceFrames.shift();
      }

      const fc = faceCounters.current;
      const p  = P.current;

      if (!p.inWarning && p.active) {
        // ── PHONE IN CAMERA DETECTION ──────────────────────────────────────
        // A phone held up = dark glassy rectangle in the lower half of frame
        // Strategy: scan for a rectangular region with very uniform dark pixels
        // AND very low skin ratio (no face visible around it)
        let phoneScore = 0;
        // Check center-lower region for phone-like rectangular mass.
        // Detect both dark (screen off) and bright (screen on) phones.
        let darkCenter = 0;
        let brightCenter = 0;
        let brightTop = 0;
        const [px1,px2,py1,py2] = [W*.2, W*.8, H*.25, H*.85];
        const [tx1,tx2,ty1,ty2] = [W*.2, W*.8, H*.02, H*.22];
        const phonePix = (px2-px1)*(py2-py1);
        const topPix = Math.max((tx2-tx1)*(ty2-ty1), 1);
        for (let i=0; i<data.length; i+=4) {
          const brightness = (data[i]+data[i+1]+data[i+2])/3;
          const idx=i/4, ppx=idx%W, ppy=Math.floor(idx/W);
          if (ppx>px1&&ppx<px2&&ppy>py1&&ppy<py2) {
            if (brightness < 60) darkCenter++;
            if (brightness > 205) brightCenter++;
          }
          if (ppx>tx1&&ppx<tx2&&ppy>ty1&&ppy<ty2&&brightness>205) {
            brightTop++;
          }
        }
        const darkRatio = darkCenter / phonePix;
        const brightRatio = brightCenter / phonePix;
        const brightTopRatio = brightTop / topPix;
        // Balanced thresholds: still catches real phones, reduces no-phone noise.
        const brightPhoneLike = brightRatio > 0.18 && (brightRatio - brightTopRatio) > 0.07;
        const darkPhoneLike = darkRatio > 0.52 && totalRatio < 0.07;
        if (brightPhoneLike || darkPhoneLike) phoneScore = 1;

        // Track whether a real face was seen recently; phone checks require this.
        if (totalRatio > 0.03 && centerRatio > 0.012) {
          fc.faceSeen = Math.min((fc.faceSeen || 0) + 1, 8);
        } else {
          fc.faceSeen = Math.max((fc.faceSeen || 0) - 1, 0);
        }

        if (phoneScore > 0 && (fc.faceSeen || 0) >= 1) {
          fc.phone    = Math.min((fc.phone||0)+1, 10);
          fc.noface   = 0; fc.lookaway = 0;
          // Require sustained evidence across multiple checks (~7.5s).
          if (fc.phone >= 3) {
            fc.phone=0;
            fireViolation('phone', `Phone detected in camera at ${new Date().toLocaleTimeString()}`);
          }
        } else if (totalRatio < 0.02) {
          // Almost no skin — face missing
          fc.phone    = Math.max((fc.phone||0)-1, 0);
          fc.noface   = Math.min(fc.noface+1, 10);
          fc.lookaway = Math.max(fc.lookaway-1, 0);
          if (fc.noface >= 5) {
            fc.noface=0; fc.lookaway=0;
            fireViolation('noface', `Face not visible at ${new Date().toLocaleTimeString()}`);
          }
        } else if (centerRatio < 0.012 && totalRatio > 0.025) {
          // Skin exists but not in center — looking away
          fc.phone    = Math.max((fc.phone||0)-1, 0);
          fc.lookaway = Math.min(fc.lookaway+1, 10);
          fc.noface   = Math.max(fc.noface-1, 0);
          if (fc.lookaway >= 5) {
            fc.lookaway=0; fc.noface=0;
            fireViolation('face', `Eyes off screen at ${new Date().toLocaleTimeString()}`);
          }
        } else {
          // All good — decay counters
          fc.phone    = Math.max((fc.phone||0)-2, 0);
          fc.noface   = Math.max(fc.noface-2, 0);
          fc.lookaway = Math.max(fc.lookaway-2, 0);
        }
      }
    } catch {}
    setTimeout(() => { if (P.current.active) rafRef.current = requestAnimationFrame(runFaceAnalysis); }, 2500);
  }, [fireViolation]);

  // Start/stop face analysis with phase
  useEffect(() => {
    if (phase === 'interview') {
      P.current.active = true;
      faceCounters.current = { noface: 0, lookaway: 0, phone: 0, faceSeen: 0 };
      // Delay start so camera has time to stream
      setTimeout(() => { if (P.current.active) rafRef.current = requestAnimationFrame(runFaceAnalysis); }, 4000);
    } else {
      P.current.active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [phase, runFaceAnalysis]);

  // ─────────────────────────────────────────────────────────────────────────
  // TTS
  // ─────────────────────────────────────────────────────────────────────────
  const speakText = (text) => new Promise(res => {
    setAiCaption(text);
    if (!ttsOk || !voiceOn) { setTimeout(res, 300); return; }
    window.speechSynthesis.cancel(); setIsSpeaking(true);
    const u = new SpeechSynthesisUtterance(text);
    u.rate=0.9; u.pitch=1.0;
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v=>v.name.includes('Google')&&v.lang.startsWith('en-')) || voices.find(v=>v.lang.startsWith('en-'));
    if (best) u.voice = best;
    u.onend  = ()=>{ setIsSpeaking(false); res(); };
    u.onerror= ()=>{ setIsSpeaking(false); res(); };
    window.speechSynthesis.speak(u);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STT — FIXED
  // BUG 1: isListeningRef was declared AFTER startListening → always undefined
  //        FIX: isListeningRef declared at top, before this function
  // BUG 2: Speak button triggered tab-switch violation because Chrome opens
  //        a mic permission dialog which briefly hides the page
  //        FIX: micGrace=true BEFORE rec.start(), cleared in rec.onstart
  //        We use visibilitychange (NOT blur) so permission dialog doesn't count
  // BUG 3: No transcript appearing because rec.onend was killing the recognizer
  //        FIX: restart recognizer in onend while isListeningRef is true
  // ─────────────────────────────────────────────────────────────────────────
  // ── STT ─────────────────────────────────────────────────────────────────
  // Uses a ref to hold the "spawn next session" function so it never goes stale.
  // isListeningRef is the gate — set it TRUE before spawning, FALSE to stop.
  const spawnRef = useRef(null);

  spawnRef.current = () => {
    if (!isListeningRef.current) return;          // stopped — do nothing

    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) return;

    const rec = new SpeechAPI();
    rec.continuous     = true;   // keep alive as long as possible
    rec.interimResults = true;
    rec.lang           = 'en-US';

    rec.onresult = (e) => {
      let finals = '', interims = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finals  += e.results[i][0].transcript + ' ';
        else                      interims += e.results[i][0].transcript;
      }
      if (finals.trim()) setTranscript(prev => prev + finals);
      setInterim(interims);
    };

    rec.onerror = (ev) => {
      if (ev.error === 'aborted' || ev.error === 'no-speech') return;
      if (ev.error === 'not-allowed') {
        setSpeechError('Microphone blocked — click the lock icon in your browser bar and allow mic access.');
        isListeningRef.current = false;
        setIsListening(false);
      }
      // other errors: onend will fire next and restart
    };

    rec.onend = () => {
      setInterim('');
      if (isListeningRef.current) {
        // Use spawnRef.current so we always call the latest version (no stale closure)
        setTimeout(() => spawnRef.current?.(), 150);
      } else {
        setIsListening(false);
      }
    };

    recogRef.current = rec;
    try {
      rec.start();
    } catch {
      setTimeout(() => spawnRef.current?.(), 300);
    }
  };

  const startListening = () => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      setSpeechError('Speech recognition requires Chrome or Edge.');
      return;
    }
    // Kill any existing session
    if (recogRef.current) {
      try { recogRef.current.abort(); } catch {}
      recogRef.current = null;
    }

    P.current.micGrace = true;
    setTimeout(() => { P.current.micGrace = false; }, 3000);

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeechError('');

    // Set BEFORE calling spawn — spawn checks this immediately
    isListeningRef.current = true;
    setIsListening(true);
    audioContextRef.current?.resume?.().catch(() => {});
    startVoiceMetering();

    spawnRef.current();   // kick off first session
  };

  const stopListening = () => {
    stopVoiceMetering(true);
    isListeningRef.current = false;
    P.current.micGrace = false;
    if (recogRef.current) {
      try { recogRef.current.abort(); } catch {}
      recogRef.current = null;
    }
    setIsListening(false);
    setInterim('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TIMER
  // ─────────────────────────────────────────────────────────────────────────
  const startTimer = () => {
    setTimer(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimer(t=>t+1), 1000);
  };
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ─────────────────────────────────────────────────────────────────────────
  // INTERVIEW FLOW
  // ─────────────────────────────────────────────────────────────────────────
  const fetchQuestions = async () => {
    // If CV uploaded — use CV-based questions from backend
    if (cvData) {
      return cvData.questions || [];
    }
    // Otherwise fetch role-based shuffled questions from backend
    try {
      const res = await fetch(`${API}/api/interview/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: jobRole, category: interviewType, count: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.questions || [];
      }
    } catch {}
    // Fallback: build bigger pool from all categories then shuffle
    const allQ = [
      ...ALL_QUESTIONS.behavioral,
      ...ALL_QUESTIONS.hr,
      ...(interviewType === 'technical' ? ALL_QUESTIONS.technical : []),
    ];
    // Shuffle Fisher-Yates
    for (let i = allQ.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQ[i], allQ[j]] = [allQ[j], allQ[i]];
    }
    // Deduplicate by text and take 5
    const seen = new Set();
    const unique = allQ.filter(q => {
      if (seen.has(q.text)) return false;
      seen.add(q.text); return true;
    });
    return unique.slice(0, 5);
  };

  const startBackendInterview = async () => {
    if (!token) return { ok: false, detail: 'You are not signed in. Open Dashboard and sign in as a candidate.' };
    try {
      const res = await fetch(`${API}/api/candidate/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interview_type: interviewType,
          difficulty: 'medium',
          job_title: jobRole || cvData?.cv?.job_titles?.[0] || 'General Interview',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          typeof data.detail === 'string'
            ? data.detail
            : Array.isArray(data.detail)
              ? data.detail.map((e) => e.msg || e).join('; ')
              : `Server error (${res.status}). Is the API running?`;
        return { ok: false, detail };
      }
      const id = data.id ?? null;
      if (!id) return { ok: false, detail: 'Interview created but no id returned — check API version.' };
      return { ok: true, id };
    } catch (e) {
      return { ok: false, detail: 'Cannot reach the server. Check that the backend is running on port 8000.' };
    }
  };

  const buildBehaviorPayload = useCallback((overall, violationsLog) => {
    return finalizeSessionBehavior({
      faceFrames: behaviorAccumRef.current.faceFrames,
      voiceSegments: behaviorAccumRef.current.voiceSegments,
      violations: violationsLog || [],
      overallScore: overall,
    });
  }, []);

  const persistVideoInterview = async (
    status,
    score = null,
    resultsSnapshot = null,
    violationsLog = null,
    behaviorMetrics = null
  ) => {
    const interviewId = backendInterviewIdRef.current;
    if (!token || !interviewId) {
      console.warn('[InterviewIQ] Skipped save: missing token or interview id');
      return false;
    }
    const body = { status: String(status), overall_score: score };
    if (behaviorMetrics && typeof behaviorMetrics === 'object') {
      body.behavior_metrics = behaviorMetrics;
    }
    if (Array.isArray(resultsSnapshot) && resultsSnapshot.length > 0) {
      body.questions = resultsSnapshot.map((r) => ({
        question: r.question,
        answer: r.answer,
        score: r.score,
        feedback: r.feedback || null,
        followup_question: r.followupQ || null,
        followup_answer: r.followupA || null,
        followup_score: r.followupScore ?? null,
        followup_feedback: r.followupFeedback || null,
      }));
    }
    if (Array.isArray(violationsLog) && violationsLog.length > 0) {
      body.proctoring_violations = violationsLog;
    }
    try {
      const res = await fetch(`${API}/api/candidate/interviews/${interviewId}/video-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[InterviewIQ] video-complete failed:', res.status, err);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[InterviewIQ] video-complete network error:', e);
      return false;
    }
  };

  const handleStart = async () => {
    setLoadingQs(true);
    setCvError('');
    setDashboardSyncError('');
    const qs = await fetchQuestions();
    setLoadingQs(false);
    if (!qs.length) { setCvError('Failed to load questions. Please try again.'); return; }
    const started = await startBackendInterview();
    if (!started.ok) {
      setCvError(
        `${started.detail} Your session was not saved to history until this succeeds.`
      );
      return;
    }
    const startedInterviewId = started.id;
    backendInterviewIdRef.current = startedInterviewId;
    setBackendInterviewId(startedInterviewId);
    try {
      await fetch(`${API}/api/candidate/interviews/${startedInterviewId}/video-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'in_progress' }),
      });
    } catch {
      /* non-fatal */
    }
    setQuestions(qs); setQIndex(0); setResults([]); setTranscript(''); setInterim('');
    setCurrentFollowup(null);
    setMainQCount(qs.length);
    setMainQIndex(0);
    // Reset proctoring
    P.current = { active:false, inWarning:false, micGrace:false, vCount:0, vLog:[], lastViolation:0, lastByType:{} };
    setVCount(0); setVLog([]); setWarning(null); setDisq(false);
    hasSpokenRef.current = false;
    behaviorAccumRef.current = { faceFrames: [], voiceSegments: [] };
    if (!streamRef.current) await startCam();
    startTimer();
    setPhase('interview');
    setTimeout(() => checkMobileDevice(), 500);
  };

  useEffect(() => {
    backendInterviewIdRef.current = backendInterviewId;
  }, [backendInterviewId]);

  // Auto-speak current question when it changes
  useEffect(() => {
    if (phase!=='interview' || questions.length===0 || hasSpokenRef.current) return;
    if (qIndex >= questions.length) return;
    hasSpokenRef.current = true;
    const q = questions[qIndex];
    speakText(`Question ${mainQIndex+1}. ${q.text}`);
  }, [phase, qIndex, questions, mainQIndex]);

  const handleSubmit = async () => {
    stopListening();
    window.speechSynthesis.cancel(); setIsSpeaking(false);
    const ans = (transcript + (interim?' '+interim:'')).trim();
    if (!ans) { setSpeechError('Please speak your answer before continuing.'); return; }

    // What question is currently being answered?
    const isAnsweringFollowup = currentFollowup !== null;
    const q = isAnsweringFollowup ? currentFollowup : questions[mainQIndex];

    // ── Score answer (backend first, local fallback) ───────────────────────
    let score = 50, feedback = '', breakdown = {};
    try {
      const res = await fetch(`${API}/api/interview/score-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.text, answer: ans }),
      });
      if (res.ok) {
        const data = await res.json();
        score    = data.score;
        feedback = data.feedback;
        breakdown = data.breakdown || {};
      } else throw new Error();
    } catch {
      const local = scoreAnswerLocal(ans, q.ideal || '', q.keywords || [], q.text || '');
      score    = local.score;
      feedback = local.feedback;
    }

    // ── Save to results ────────────────────────────────────────────────────
    // Follow-up answer attaches to the last main result entry
    let newResults;
    if (isAnsweringFollowup && results.length > 0) {
      newResults = results.map((r, i) =>
        i === results.length - 1
          ? { ...r, followupQ: q.text, followupA: ans, followupScore: score, followupFeedback: feedback }
          : r
      );
    } else {
      newResults = [...results, { question: q.text, answer: ans, score, feedback }];
    }
    setResults(newResults);
    setTranscript(''); setInterim('');
    setCurrentFollowup(null); // clear followup state

    // ── Score-based spoken response ────────────────────────────────────────
    const verbal = score >= 70
      ? ["Excellent answer!", "Strong response, well structured.", "Great example, very detailed."][Math.floor(Math.random()*3)]
      : score >= 45
      ? ["Good attempt, let's continue.", "Noted, moving on.", "Thanks for that."][Math.floor(Math.random()*3)]
      : ["I see, let's move on.", "Understood, next question.", "Thank you."][Math.floor(Math.random()*3)];

    // ── Decide: follow-up or next main question or finish ─────────────────
    // After a follow-up answer — always move to next main question
    if (isAnsweringFollowup) {
      const nextMain = mainQIndex + 1;
      if (nextMain >= mainQCount) {
        // All done
        clearInterval(timerRef.current);
        P.current.active = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const finalAvg = newResults.length
          ? Math.round(newResults.reduce((s, r) => s + (r.score || 0), 0) / newResults.length)
          : 0;
        const bm = buildBehaviorPayload(finalAvg, P.current.vLog);
        const saved = await persistVideoInterview('completed', finalAvg, newResults, P.current.vLog, bm);
        if (!saved) {
          setDashboardSyncError(
            'Could not save completion to your dashboard (check API / DB). Your scores are shown below.'
          );
        }
        await speakText('You have completed all questions. Excellent work!');
        stopCam(); setPhase('results');
      } else {
        await speakText(verbal);
        setMainQIndex(nextMain);
        setQIndex(nextMain);
        hasSpokenRef.current = false;
      }
      return;
    }

    // After a main question answer — try to get a follow-up
    // Ask backend whether to follow up — backend decides based on answer content
    let followup = null;
    try {
      const fRes = await fetch(`${API}/api/interview/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previous_question: q.text, previous_answer: ans, score, breakdown }),
      });
      if (fRes.ok) {
        const fData = await fRes.json();
        if (fData.has_followup) followup = fData.followup;
      }
    } catch {}

    if (followup) {
      // Ask follow-up — don't advance mainQIndex yet
      await speakText(verbal);
      setCurrentFollowup(followup);
      hasSpokenRef.current = true;
      await speakText(followup.text); // speak the follow-up question directly
    } else {
      // Move to next main question
      const nextMain = mainQIndex + 1;
      if (nextMain >= mainQCount) {
        clearInterval(timerRef.current);
        P.current.active = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const finalAvg = newResults.length
          ? Math.round(newResults.reduce((s, r) => s + (r.score || 0), 0) / newResults.length)
          : 0;
        const bm = buildBehaviorPayload(finalAvg, P.current.vLog);
        const saved = await persistVideoInterview('completed', finalAvg, newResults, P.current.vLog, bm);
        if (!saved) {
          setDashboardSyncError(
            'Could not save completion to your dashboard (check API / DB). Your scores are shown below.'
          );
        }
        await speakText('You have completed all questions. Excellent work!');
        stopCam(); setPhase('results');
      } else {
        await speakText(verbal);
        setMainQIndex(nextMain);
        setQIndex(nextMain);
        hasSpokenRef.current = false;
      }
    }
  };

  const handleEnd = async () => {
    stopListening();
    window.speechSynthesis.cancel();
    clearInterval(timerRef.current);
    P.current.active = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stopCam();
    if (results.length > 0) {
      const partialAvg = Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length);
      const bm = buildBehaviorPayload(partialAvg, P.current.vLog);
      const saved = await persistVideoInterview('completed', partialAvg, results, P.current.vLog, bm);
      if (!saved) {
        setDashboardSyncError(
          'Could not save this session to your dashboard. Check that the backend is running and try again from Dashboard.'
        );
      }
    } else {
      await persistVideoInterview('abandoned', null);
    }
    setPhase(results.length>0?'results':'lobby');
  };

  const handleRetry = () => {
    P.current = { active:false, inWarning:false, micGrace:false, vCount:0, vLog:[], lastViolation:0, lastByType:{} };
    setDisq(false); setVCount(0); setVLog([]); setWarning(null);
    setResults([]); setPhase('lobby');
    setDashboardSyncError('');
    backendInterviewIdRef.current = null;
    setBackendInterviewId(null);
    behaviorAccumRef.current = { faceFrames: [], voiceSegments: [] };
  };

  // Cleanup
  useEffect(()=>()=>{ window.speechSynthesis.cancel(); stopListening(); stopCam(); clearInterval(timerRef.current); clearInterval(warnTimerRef.current); if(rafRef.current) cancelAnimationFrame(rafRef.current); },[]);

  useEffect(() => {
    if (disqualified) {
      persistVideoInterview('abandoned', null);
    }
  }, [disqualified]);

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED
  // ─────────────────────────────────────────────────────────────────────────
  const fullText  = (transcript+(interim?' '+interim:'')).trim();
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const avgScore  = results.length ? Math.round(results.reduce((s,r)=>s+r.score,0)/results.length) : 0;
  const q         = questions[Math.min(qIndex, questions.length-1)];
  const progress  = mainQCount>0 ? Math.round((mainQIndex/mainQCount)*100) : 0;

  // ══════════════════════════════════════════════════════════════════════════
  if (disqualified) return <Disqualified log={vLog} onRetry={handleRetry}/>;

  // ══ LOBBY ════════════════════════════════════════════════════════════════
  if (phase==='lobby') return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg flex items-center justify-center"><Sparkles className="w-3 h-3 text-white"/></div>
          <span className="font-bold">InterviewIQ</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
          <ShieldAlert className="w-3.5 h-3.5 text-yellow-400"/>
          <span className="text-yellow-400 text-xs font-semibold">AI Proctored</span>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-lg w-full">
          <h1 className="text-4xl font-black text-center mb-2">Video Interview</h1>
          <p className="text-gray-400 text-center mb-6">AI-proctored. Face the camera, stay on this tab, no phones allowed.</p>
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-4 border border-white/10" style={{aspectRatio:'16/9'}}>
            <video ref={lobbyVidRef} autoPlay muted playsInline className="w-full h-full object-cover"/>
            {camError&&(
              <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center gap-3 p-6">
                <VideoOff className="w-12 h-12 text-gray-600"/>
                <p className="text-gray-400 text-sm text-center">{camError}</p>
                <button onClick={startCam} className="text-sky-400 text-sm underline">Retry camera</button>
              </div>
            )}
            <div className="absolute bottom-2 left-3 bg-black/50 rounded px-2 py-0.5 text-xs text-white">📷 Preview</div>
          </div>
          {/* CV Upload Section */}
          <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-sky-400"/>
              <span className="text-sm font-semibold text-white">Upload CV</span>
              <span className="text-xs text-gray-500 ml-auto">PDF, DOCX, TXT</span>
            </div>
            <p className="text-xs text-yellow-500/80 mb-2">⚠️ ATS-friendly resumes only — no assignments, reports, or academic documents</p>
            {!cvData ? (
              <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer transition-all ${cvLoading ? 'border-sky-500/50 bg-sky-500/5' : 'border-white/10 hover:border-sky-500/40 hover:bg-sky-500/5'}`}>
                <input type="file" className="hidden" accept=".pdf,.docx,.txt"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCvFile(file); setCvError(''); setCvLoading(true);
                    const form = new FormData();
                    form.append('file', file);
                    try {
                      const res = await fetch(`${API}/api/interview/upload-cv`, { method:'POST', body: form });
                      const data = await res.json();
                      if (!res.ok || data.cv?.is_valid === false || data.error) {
                        setCvError(data.detail || data.cv?.error || data.error || 'Failed to parse CV.');
                        setCvFile(null);
                      } else {
                        setCvData(data);
                        if (data.cv?.warnings?.length > 0) {
                          setCvError('⚠️ ' + data.cv.warnings[0]); // show first warning non-blocking
                        }
                      }
                    } catch {
                      setCvError('Backend not reachable. Questions will be role-based instead.');
                    }
                    setCvLoading(false);
                  }}
                />
                {cvLoading
                  ? <><Loader className="w-5 h-5 text-sky-400 animate-spin mb-1"/><span className="text-xs text-sky-400">Parsing & validating CV...</span></>
                  : <><Upload className="w-5 h-5 text-gray-500 mb-1"/><span className="text-xs text-gray-500">ATS resume only · Drop or click to upload</span></>
                }
              </label>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"/>
                <div className="flex-1 min-w-0">
                  <div className="text-green-400 text-xs font-bold mb-1">CV Parsed Successfully</div>
                  {cvData.cv?.name && <div className="text-white text-xs font-semibold">{cvData.cv.name}</div>}
                  {cvData.cv?.skills?.length > 0 && <div className="text-gray-400 text-xs truncate">Skills: {cvData.cv.skills.slice(0,6).join(', ')}</div>}
                  {cvData.cv?.job_titles?.length > 0 && <div className="text-gray-400 text-xs">Roles: {cvData.cv.job_titles.slice(0,2).join(', ')}</div>}
                  {cvData.cv?.experience_years > 0 && <div className="text-gray-400 text-xs">{cvData.cv.experience_years} years experience</div>}
                  <div className="text-sky-400 text-xs mt-1">✓ {cvData.questions?.length || 5} custom questions generated from your CV{cvData.cv?.word_count ? ` · ${cvData.cv.word_count} words parsed` : ''}</div>
                </div>
                <button onClick={() => { setCvData(null); setCvFile(null); }} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
              </div>
            )}
            {cvError && (
              <p className={`text-xs mt-2 ${cvError.startsWith('⚠️') ? 'text-yellow-400' : 'text-red-400'}`}>
                {cvError}
              </p>
            )}
          </div>

          {/* Job Role Input — shown only if no CV */}
          {!cvData && (
            <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-sky-400"/>
                <span className="text-sm font-semibold text-white">Job Role</span>
                <span className="text-xs text-gray-500 ml-auto">optional</span>
              </div>
              <input
                type="text"
                value={jobRole}
                onChange={e => setJobRole(e.target.value)}
                placeholder="e.g. React Developer, Data Scientist, Product Manager..."
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/50 transition-all"
              />
              <p className="text-gray-600 text-xs mt-1.5">Questions will be tailored to this role. Leave blank for generic questions.</p>
            </div>
          )}

          {/* Interview Type — shown only if no CV */}
          {!cvData && (
            <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-4 mb-3">
              <div className="text-sm text-gray-400 mb-2">Question Focus</div>
              <div className="grid grid-cols-2 gap-2">
                {['behavioral','technical','hr','mixed'].map(t=>(
                  <button key={t} onClick={()=>setInterviewType(t)}
                    className={`py-2 px-3 rounded-xl border capitalize text-sm font-medium transition-all ${interviewType===t?'border-sky-500 bg-sky-500/15 text-white':'border-white/10 text-gray-400 hover:border-white/20'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-3 mb-4">
            <div className="text-yellow-400 text-xs font-bold uppercase flex items-center gap-1.5 mb-1.5"><ShieldAlert className="w-3.5 h-3.5"/>Rules — {MAX_V} violations = disqualified</div>
            {['🚫 Do NOT switch tabs','👁️ Keep face visible at all times','📵 No phones allowed'].map((r,i)=><div key={i} className="text-gray-400 text-xs">{r}</div>)}
          </div>

          <button onClick={handleStart} disabled={loadingQs}
            className="w-full py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 rounded-2xl font-black text-lg transition-all transform hover:scale-[1.02] shadow-2xl shadow-sky-500/20 flex items-center justify-center gap-3">
            {loadingQs ? <><Loader className="w-5 h-5 animate-spin"/>Preparing Questions...</> : <><Video className="w-5 h-5"/> Begin Proctored Interview</>}
          </button>
        </div>
      </div>
    </div>
  );

  // ══ RESULTS ══════════════════════════════════════════════════════════════
  if (phase==='results') {
    const sc=avgScore>=70?'text-green-400':avgScore>=45?'text-yellow-400':'text-red-400';
    return (
      <div className="min-h-screen bg-zinc-950 text-white px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-sky-500/30"><CheckCircle className="w-10 h-10 text-white"/></div>
            <h1 className="text-4xl font-black mb-1">Interview Complete!</h1>
            <p className="text-gray-400">Your AI performance report</p>
          </div>
          <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-6 mb-5 text-center">
            <div className="text-gray-400 text-sm mb-2">Overall Score</div>
            <div className={`text-7xl font-black mb-1 ${sc}`}>{avgScore}<span className="text-3xl">%</span></div>
            <div className="text-gray-500 text-sm">{results.length} questions · {vLog.length} violation(s)</div>
          </div>
          {dashboardSyncError ? (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-left">
              {dashboardSyncError}
            </div>
          ) : null}
          {vLog.length>0&&(
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 mb-5">
              <div className="text-yellow-400 text-xs font-bold uppercase mb-2 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/>Proctoring Log</div>
              {vLog.map((v,i)=><div key={i} className="text-gray-400 text-xs py-0.5">⚠️ {v}</div>)}
            </div>
          )}
          <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-6 mb-5 space-y-5">
            <h2 className="font-bold text-lg flex items-center gap-2"><Star className="w-5 h-5 text-sky-400"/>Question Breakdown</h2>
            {results.map((r,i)=>(
              <div key={i} className="border-b border-white/5 pb-5 last:border-0 last:pb-0">
                <div className="text-sky-400 text-xs font-bold uppercase mb-1">Q{i+1}</div>
                <p className="text-gray-300 text-sm mb-2">{r.question}</p>
                <div className="bg-white/5 rounded-xl p-3 text-sm text-white mb-2 italic">"{r.answer}"</div>
                <ScoreBar score={r.score}/>
                {r.feedback&&<p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{r.feedback}</p>}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard" className="flex-1 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all text-center font-medium text-sm">Dashboard</Link>
            <button onClick={handleRetry} className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4"/>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  // ══ INTERVIEW SCREEN ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col overflow-hidden relative">

      {/* WARNING OVERLAY — absolute positioned over everything */}
      <WarningOverlay type={warning} countdown={warnCD} onDismiss={dismissWarning}/>

      {/* TOP BAR */}
      <div className="bg-gray-900/80 border-b border-white/10 backdrop-blur px-5 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg flex items-center justify-center"><Sparkles className="w-3 h-3 text-white"/></div>
          <span className="font-bold text-sm">InterviewIQ</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>
            <span className="text-red-400 text-xs font-medium">LIVE</span>
          </div>
          <span className="text-gray-500 text-sm font-mono">{fmt(timer)}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Live violation counter — updates every time */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
            vCount===0?'border-green-500/30 bg-green-500/10 text-green-400':
            vCount===1?'border-yellow-500/30 bg-yellow-500/10 text-yellow-400':
                       'border-red-500/30 bg-red-500/10 text-red-400'}`}>
            <ShieldAlert className="w-3 h-3"/>{vCount}/{MAX_V} violations
          </div>
          <span className="text-gray-500 text-sm">Q<span className="text-white font-bold">{mainQIndex+1}</span>/{mainQCount}</span>
          {currentFollowup && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
              <CornerDownRight className="w-3 h-3 text-blue-400"/>
              <span className="text-blue-400 text-xs font-medium">Follow-up</span>
            </div>
          )}
          <button onClick={()=>{setVoiceOn(v=>!v); window.speechSynthesis.cancel(); setIsSpeaking(false);}}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-all ${voiceOn?'border-sky-500/40 bg-sky-500/10 text-sky-400':'border-white/10 text-gray-500'}`}>
            {voiceOn?<Volume2 className="w-3 h-3"/>:<VolumeX className="w-3 h-3"/>}{voiceOn?'Voice On':'Off'}
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="h-0.5 bg-gray-800 z-10">
        <div className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-700" style={{width:`${progress}%`}}/>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-2 gap-3 p-3 min-h-0">

        {/* LEFT — AI Robot */}
        <div className="relative bg-gradient-to-br from-zinc-950 to-zinc-900 rounded-2xl border border-sky-700/40 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-sky-600/10 rounded-full blur-3xl"/>
          </div>
          <div className="relative flex items-center justify-center mb-4">
            {isSpeaking&&<div className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping scale-125 pointer-events-none"/>}
            <RobotFace speaking={isSpeaking} size={170}/>
          </div>
          <div className="w-full px-5 pb-5">
            <div className="bg-black/30 backdrop-blur border border-sky-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {currentFollowup
                  ? <div className="text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CornerDownRight className="w-3 h-3"/>Follow-up</div>
                  : <div className="text-sky-400 text-xs font-bold uppercase tracking-wider">Question {mainQIndex+1} of {mainQCount}</div>
                }
                {isSpeaking&&<div className="flex gap-0.5 items-end h-3">{[0,1,2,3].map(i=><div key={i} className="w-0.5 rounded-full bg-sky-400 animate-bounce" style={{height:`${5+(i%2)*4}px`,animationDelay:`${i*0.08}s`}}/>)}</div>}
              </div>
              <p className="text-white text-sm leading-relaxed font-medium">{currentFollowup ? currentFollowup.text : q?.text}</p>
              {aiCaption&&<div className="mt-2 pt-2 border-t border-sky-700/20 flex items-start gap-1.5"><Volume2 className="w-3 h-3 text-sky-400 flex-shrink-0 mt-0.5"/><p className="text-sky-300/60 text-xs italic truncate">{aiCaption}</p></div>}
            </div>
            <button onClick={()=>{stopListening(); hasSpokenRef.current=true; speakText(`Question ${qIndex+1}. ${q.text}`);}} disabled={isSpeaking}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-sky-400/60 hover:text-sky-300 disabled:opacity-30 py-1.5">
              <Volume2 className="w-3 h-3"/>Repeat question
            </button>
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"/>
            <span className="text-white text-xs font-semibold">AI Interviewer</span>
          </div>
        </div>

        {/* RIGHT — Candidate Camera */}
        <div className="relative bg-gray-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="flex-1 relative">
            <video ref={interviewVidRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!isCamOn?'invisible':''}`}/>
            {!isCamOn&&<div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-3"><VideoOff className="w-16 h-16 text-gray-700"/><span className="text-gray-500 text-sm">Camera off</span></div>}
            {camError&&<div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-3 p-6"><AlertCircle className="w-12 h-12 text-yellow-500"/><p className="text-gray-400 text-sm text-center">{camError}</p><button onClick={startCam} className="text-sky-400 text-sm">Retry</button></div>}

            {/* Labels */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur rounded-lg px-3 py-1.5">
              <div className={`w-2 h-2 rounded-full ${isListening?'bg-red-500 animate-pulse':'bg-green-500'}`}/>
              <span className="text-white text-xs font-semibold">You</span>
            </div>
            {isListening&&(
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 backdrop-blur rounded-lg px-2 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                <span className="text-red-400 text-xs font-bold">REC</span>
              </div>
            )}
            {/* Violation strip */}
            {vCount>0&&(
              <div className={`absolute bottom-0 left-0 right-0 py-1 text-center text-xs font-bold ${vCount>=MAX_V-1?'bg-red-500/80':'bg-yellow-500/70'} text-white`}>
                ⚠️ {vCount}/{MAX_V} violations — {MAX_V-vCount} left before disqualification
              </div>
            )}
          </div>

          {/* Live transcript strip */}
          <div className={`border-t px-4 py-3 transition-colors ${isListening?'border-red-500/30 bg-red-950/20':'border-white/5 bg-gray-900'}`} style={{minHeight:80}}>
            {(transcript || interim) ? (
              <p className="text-white text-xs leading-relaxed break-words">
                <span>{transcript}</span>
                {interim && <span className="text-sky-300 italic"> {interim}</span>}
              </p>
            ) : (
              <p className={`text-xs italic ${isListening ? 'text-red-400/70' : 'text-gray-600'}`}>
                {isListening
                  ? '🎤 Mic active — start speaking and your words will appear here...'
                  : 'Click Speak below to record your answer'}
              </p>
            )}
            <div className="flex items-center justify-between mt-1.5">
              {wordCount>0
                ? <span className="text-gray-500 text-xs">{wordCount} words{wordCount<20&&<span className="text-yellow-500 ml-1">— say more for a higher score</span>}</span>
                : <span/>
              }
              {isListening && (
                <span className="text-xs text-red-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse inline-block"/>
                  Recording
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="bg-gray-900/90 border-t border-white/10 backdrop-blur px-6 py-3 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2">
          <button onClick={toggleCam}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-all ${isCamOn?'bg-gray-800 hover:bg-gray-700 text-white':'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
            {isCamOn?<Video className="w-4 h-4"/>:<VideoOff className="w-4 h-4"/>}
            {isCamOn?'Cam On':'Cam Off'}
          </button>
          <button onClick={isListening?stopListening:startListening}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-all ${isListening?'bg-red-500 text-white animate-pulse':'bg-gray-800 hover:bg-gray-700 text-white'}`}>
            {isListening?<><MicOff className="w-4 h-4"/>Stop</>:<><Mic className="w-4 h-4"/>Speak</>}
          </button>
        </div>
        <div className="flex-1 text-center">
          {speechError?(
            <div className="inline-flex items-center gap-1.5 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
              <AlertCircle className="w-3.5 h-3.5"/>{speechError}
            </div>
          ):(
            <p className="text-gray-600 text-xs">{isListening?'Listening — click Stop when done, then Next':'Click Speak, answer aloud, then click Next'}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleEnd}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-medium transition-all">
            <PhoneOff className="w-4 h-4"/>End
          </button>
          <button onClick={handleSubmit} disabled={!fullText.trim()||isSpeaking}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all hover:scale-105">
            {(!currentFollowup && mainQIndex+1>=mainQCount)?<><CheckCircle className="w-4 h-4"/>Finish</>:<>Next<ChevronRight className="w-4 h-4"/></>}
          </button>
        </div>
      </div>
    </div>
  );
}
