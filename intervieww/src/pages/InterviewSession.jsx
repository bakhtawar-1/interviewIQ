import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sparkles, ChevronRight, CheckCircle, AlertCircle, Mic, MicOff, Volume2, VolumeX, Loader, Star } from 'lucide-react';
import { API_URL } from '../config';
import { speak, stopSpeaking, startListening, stopListening, isTTSSupported, isSTTSupported } from '../services/speechService';
import { scoreAnswerLocal } from '../utils/scoreAnswerLocal';

// ── Questions with ideal answers for LOCAL scoring ────────────────────────────
const SAMPLE_QUESTIONS = {
  behavioral: [
    { text: "Tell me about a time you worked effectively under pressure.", ideal: "situation task action result STAR method deadline pressure remained calm prioritized focused delivered outcome", keywords: ["pressure","deadline","result","action","situation","calm","outcome"] },
    { text: "Describe a situation where you resolved a conflict with a teammate.", ideal: "communication empathy listening conflict resolution teamwork common ground professional respected both sides", keywords: ["conflict","communication","teamwork","resolution","empathy","listened"] },
    { text: "Give an example of a goal you set and achieved.", ideal: "specific measurable goal planning steps obstacles overcome result achievement milestone", keywords: ["goal","planning","achievement","result","overcome","accomplished"] },
    { text: "Tell me about a time you demonstrated leadership.", ideal: "took initiative guided team responsibility decision making motivated others positive outcome led", keywords: ["leadership","initiative","team","decision","outcome","motivated"] },
    { text: "Describe a time you had to learn something new quickly.", ideal: "adaptability resourceful fast learning methods applied growth picked up quickly practiced", keywords: ["learning","adaptability","fast","growth","skill","practiced"] },
  ],
  technical: [
    { text: "Explain the difference between authentication and authorization.", ideal: "authentication verify who you are identity login credentials password authorization permissions roles what user can do access control", keywords: ["authentication","authorization","permissions","roles","login","identity"] },
    { text: "What are the four pillars of object-oriented programming?", ideal: "encapsulation inheritance polymorphism abstraction OOP class object hide data reuse code", keywords: ["encapsulation","inheritance","polymorphism","abstraction","OOP"] },
    { text: "How does a RESTful API work?", ideal: "REST representational state transfer HTTP GET POST PUT DELETE stateless client server URL resources JSON response request", keywords: ["REST","HTTP","stateless","JSON","request","response","endpoint"] },
    { text: "What is the difference between SQL and NoSQL databases?", ideal: "SQL relational structured tables schema joins NoSQL non-relational flexible document unstructured scalability MongoDB PostgreSQL", keywords: ["SQL","NoSQL","relational","schema","structured","flexible"] },
    { text: "Explain how JWT authentication works end to end.", ideal: "user logs in server creates JWT token header payload signature secret key client stores localStorage sends Authorization Bearer header server verifies signature stateless", keywords: ["JWT","token","signature","stateless","header","verify","payload"] },
  ],
  hr: [
    { text: "Why do you want to work at our company?", ideal: "researched company mission values culture product specific reasons align personal career goals motivated passionate", keywords: ["company","mission","culture","motivation","fit","researched"] },
    { text: "Where do you see yourself in 5 years?", ideal: "career growth develop skills leadership responsibility contribute aligned company vision ambitious", keywords: ["goals","growth","career","future","development","contribute"] },
    { text: "What are your greatest strengths?", ideal: "specific strengths concrete examples data stories achievements relevant skills demonstrate", keywords: ["strengths","skills","examples","achievements","demonstrate"] },
    { text: "How do you handle receiving critical feedback?", ideal: "welcome feedback opportunity growth listen openly not defensive ask clarifying questions reflect action plan improve professional", keywords: ["feedback","growth","listening","improvement","professional","reflect"] },
    { text: "What motivates you at work?", ideal: "genuine authentic motivation challenging problems making impact growth collaboration recognition purpose meaning", keywords: ["motivation","passion","growth","impact","challenge","purpose"] },
  ],
  mixed: [
    { text: "Tell me about yourself.", ideal: "professional background key skills experience career journey goals relevant role concise summary", keywords: ["background","experience","skills","goals","professional"] },
    { text: "What is your biggest professional achievement?", ideal: "STAR specific achievement quantify impact measure results initiative actions taken outcome", keywords: ["achievement","impact","result","initiative","quantify"] },
    { text: "Describe a challenging project you worked on.", ideal: "challenge context specific role responsibilities actions taken obstacles overcome final outcome delivered learned", keywords: ["challenge","project","role","solution","outcome","delivered"] },
    { text: "How do you handle tight deadlines?", ideal: "prioritize urgent tasks communicate proactively break into smaller steps stay focused manage stress deliver quality", keywords: ["deadline","prioritization","communication","focus","deliver"] },
    { text: "What makes you the best candidate for this role?", ideal: "skills experience directly match requirements unique value enthusiasm commitment contribute team", keywords: ["skills","experience","value","fit","contribute","match"] },
  ],
};

const ScoreBar = ({ score }) => {
  const color = score >= 70 ? 'from-green-500 to-green-400' : score >= 45 ? 'from-yellow-500 to-yellow-400' : 'from-red-500 to-red-400';
  const label = score >= 70 ? 'Excellent' : score >= 55 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-bold text-white w-10 text-right">{score}%</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${score >= 70 ? 'bg-green-500/20 text-green-400' : score >= 45 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{label}</span>
    </div>
  );
};

const InterviewSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState(null);
  const [completingInterview, setCompletingInterview] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [interimText, setInterimText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const ttsSupported = isTTSSupported();
  const sttSupported = isSTTSupported();
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    loadInterview();
    return () => { stopSpeaking(); stopListening(); };
  }, [id]);

  useEffect(() => {
    if (questions.length > 0 && voiceEnabled && ttsSupported && !hasSpoken.current) {
      hasSpoken.current = true;
      speakQuestion(currentIndex);
    }
  }, [questions]);

  const loadInterview = async () => {
    try {
      const res = await fetch(`${API_URL}/api/candidate/interviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { navigate('/dashboard'); return; }
      const data = await res.json();
      setInterview(data);

      // Try DB questions
      const qRes = await fetch(
        `${API_URL}/api/questions?interview_type=${data.interview_type}&difficulty=${data.difficulty}&page_size=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      let qs = [];
      if (qRes.ok) {
        const qData = await qRes.json();
        if (qData.questions?.length > 0) {
          qs = qData.questions.map(q => ({
            id: q.id, text: q.question_text,
            ideal: q.ideal_answer || '', keywords: (q.keywords || '').split(',').map(k => k.trim()).filter(Boolean),
            fromDB: true
          }));
        }
      }
      // Fallback to sample questions (with ideal answers for scoring!)
      if (qs.length === 0) {
        const samples = SAMPLE_QUESTIONS[data.interview_type] || SAMPLE_QUESTIONS.behavioral;
        qs = samples.map(q => ({ id: null, ...q, fromDB: false }));
      }
      setQuestions(qs.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const speakQuestion = async (index) => {
    if (!voiceEnabled || !ttsSupported) return;
    const q = questions[index];
    if (!q) return;
    setIsSpeaking(true);
    try { await speak(`Question ${index + 1}. ${q.text}`); } catch (e) {}
    setIsSpeaking(false);
  };

  const handleToggleMic = () => {
    if (isListening) { stopListening(); setIsListening(false); setInterimText(''); return; }
    if (!sttSupported) { setSpeechError('Use Chrome or Edge for speech recognition.'); return; }
    stopSpeaking(); setIsSpeaking(false); setSpeechError('');
    startListening(
      (transcript, isFinal) => {
        if (isFinal) { setAnswer(prev => (prev ? prev + ' ' : '') + transcript); setInterimText(''); }
        else setInterimText(transcript);
      },
      () => { setIsListening(false); setInterimText(''); },
      (err) => { setSpeechError(err); setIsListening(false); setInterimText(''); }
    );
    setIsListening(true);
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    stopListening(); stopSpeaking();
    setIsListening(false); setIsSpeaking(false); setInterimText('');
    setSubmitting(true);

    const currentQ = questions[currentIndex];
    let aiScore = null;
    let aiFeedback = null;

    if (currentQ.fromDB && currentQ.id) {
      // ── Backend AI scoring for DB questions ──
      try {
        const res = await fetch(`${API_URL}/api/candidate/interviews/${id}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ question_id: currentQ.id, response_text: answer }),
        });
        if (res.ok) {
          const data = await res.json();
          aiScore = data.score;
          aiFeedback = data.feedback;
        }
      } catch (err) { console.error(err); }
    } else {
      // ── Local scoring for sample questions (FIXES the 0 score bug) ──
      const { score, feedback } = scoreAnswerLocal(answer, currentQ.ideal || '', currentQ.keywords || [], currentQ.text || '');
      aiScore = score;
      aiFeedback = feedback;
    }

    const newSubmitted = [...submitted, { question: currentQ.text, answer, score: aiScore, feedback: aiFeedback }];
    setSubmitted(newSubmitted);
    setAnswer('');
    setSubmitting(false);

    if (currentIndex + 1 >= questions.length) {
      setCompletingInterview(true);
      // Try to complete on backend if it was a DB interview
      try {
        const completeRes = await fetch(`${API_URL}/api/candidate/interviews/${id}/complete`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (completeRes.ok) setSummary(await completeRes.json());
      } catch (err) { console.error(err); }
      setCompletingInterview(false);
      if (voiceEnabled && ttsSupported) await speak("Excellent! You have completed all questions. Here are your results.");
      setFinished(true);
    } else {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      hasSpoken.current = false;
      setTimeout(() => {
        hasSpoken.current = true;
        speakQuestion(next);
      }, 400);
    }
  };

  const avgScore = submitted.length > 0 && submitted.some(s => s.score != null)
    ? Math.round(submitted.filter(s => s.score != null).reduce((sum, s) => sum + s.score, 0) / submitted.filter(s => s.score != null).length)
    : null;

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Results screen ────────────────────────────────────────────────────────
  if (finished) {
    const scoreColor = avgScore >= 70 ? 'text-green-400' : avgScore >= 45 ? 'text-yellow-400' : 'text-red-400';
    const scoreLabel = avgScore >= 70 ? 'Excellent' : avgScore >= 55 ? 'Good' : avgScore >= 40 ? 'Fair' : 'Needs Practice';
    return (
      <div className="min-h-screen bg-zinc-950 text-white px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-sky-500/40">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Interview Complete!</h1>
          </div>

          {avgScore !== null && (
            <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-6 mb-6 text-center">
              <div className="text-gray-400 text-sm mb-1">Overall Score</div>
              <div className={`text-7xl font-black mb-1 ${scoreColor}`}>{avgScore}<span className="text-3xl">%</span></div>
              <div className={`text-lg font-medium ${scoreColor}`}>{scoreLabel}</div>
            </div>
          )}

          {summary && (
            <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-sky-400" /> AI Performance Analysis
              </h2>
              <div><div className="text-green-400 text-xs font-semibold uppercase mb-1">Strengths</div><p className="text-gray-300 text-sm">{summary.strengths}</p></div>
              <div><div className="text-red-400 text-xs font-semibold uppercase mb-1">Areas to Improve</div><p className="text-gray-300 text-sm">{summary.weaknesses}</p></div>
              <div><div className="text-blue-400 text-xs font-semibold uppercase mb-1">Recommendations</div><p className="text-gray-300 text-sm">{summary.recommendations}</p></div>
            </div>
          )}

          <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-6 mb-6 space-y-5">
            <h2 className="text-white font-bold text-lg">Question Breakdown</h2>
            {submitted.map((s, i) => (
              <div key={i} className="border-b border-white/5 pb-5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sky-400 text-xs font-semibold uppercase">Q{i + 1}</div>
                </div>
                <p className="text-gray-300 text-sm mb-2">{s.question}</p>
                <div className="bg-white/5 rounded-lg p-3 text-sm text-white mb-3">"{s.answer}"</div>
                {s.score != null && <ScoreBar score={s.score} />}
                {s.feedback && <p className="text-gray-500 text-xs mt-2">{s.feedback}</p>}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link to="/dashboard" className="flex-1 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all text-center">Dashboard</Link>
            <Link to="/interview/new" className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl font-semibold text-center">New Interview</Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = Math.round((currentIndex / questions.length) * 100);
  const currentQ = questions[currentIndex];

  // ── Interview screen ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <nav className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg flex items-center justify-center"><Sparkles className="w-3 h-3 text-white" /></div>
            <span className="font-bold">InterviewIQ</span>
          </div>
          <div className="flex items-center gap-3">
            {ttsSupported && (
              <button onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${voiceEnabled ? 'border-sky-500/50 bg-sky-500/10 text-sky-400' : 'border-white/10 text-gray-500'}`}>
                {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </button>
            )}
            <span className="text-gray-400 text-sm"><span className="text-white font-medium">{currentIndex + 1}</span> / <span className="text-white font-medium">{questions.length}</span></span>
          </div>
        </div>
        <div className="h-1 bg-gray-800">
          <div className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </nav>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-sky-500/20 text-sky-400 rounded-full text-xs capitalize">{interview?.interview_type}</span>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs capitalize">{interview?.difficulty}</span>
          {interview?.job_title && <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs">{interview.job_title}</span>}
        </div>

        <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3">Question {currentIndex + 1}</div>
              <p className="text-white text-xl leading-relaxed">{currentQ?.text}</p>
            </div>
            {ttsSupported && voiceEnabled && (
              <button onClick={() => { stopListening(); setIsListening(false); speakQuestion(currentIndex); }}
                disabled={isSpeaking}
                className="flex-shrink-0 w-9 h-9 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-xl flex items-center justify-center transition-all disabled:opacity-50">
                {isSpeaking ? <Loader className="w-4 h-4 text-sky-400 animate-spin" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
              </button>
            )}
          </div>
          {isSpeaking && (
            <div className="mt-4 flex items-center gap-2 text-sky-400 text-sm">
              <div className="flex gap-0.5">{[0,1,2].map(i => <div key={i} className="w-1 bg-sky-400 rounded-full animate-bounce" style={{ height: '12px', animationDelay: `${i*0.15}s` }} />)}</div>
              AI is speaking...
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <textarea
              value={answer + (interimText ? (answer ? ' ' : '') + interimText : '')}
              onChange={e => { if (!isListening) setAnswer(e.target.value); }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmitAnswer(); }}
              placeholder={isListening ? "🎤 Listening — speak your answer..." : "Type your answer or use the mic... (Ctrl+Enter to submit)"}
              rows={6}
              className={`w-full bg-gray-900/60 border rounded-2xl p-5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all resize-none text-base leading-relaxed ${isListening ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30 bg-red-500/5' : 'border-white/10 focus:border-sky-500 focus:ring-sky-500'}`}
            />
            {isListening && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-xs font-medium">Recording</span>
              </div>
            )}
          </div>

          {speechError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {speechError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {sttSupported && (
                <button onClick={handleToggleMic}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${isListening ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/10 bg-gray-800/50 text-gray-300 hover:border-sky-500/50 hover:text-sky-400'}`}>
                  {isListening ? <><MicOff className="w-4 h-4" />Stop Mic</> : <><Mic className="w-4 h-4" />Use Mic</>}
                </button>
              )}
              <span className="text-gray-600 text-xs">
                {answer.trim().split(/\s+/).filter(Boolean).length} words
                {answer.length > 0 && answer.trim().split(/\s+/).filter(Boolean).length < 20 && <span className="text-yellow-500 ml-2">— try to say more</span>}
              </span>
            </div>
            <button onClick={handleSubmitAnswer} disabled={!answer.trim() || submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all transform hover:scale-105">
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : (
                <>{currentIndex + 1 >= questions.length ? 'Finish' : 'Next'}{currentIndex + 1 >= questions.length ? <CheckCircle className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
