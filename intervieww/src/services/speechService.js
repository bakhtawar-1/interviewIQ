/**
 * speechService.js - Browser Speech APIs
 * ========================================
 * Handles both:
 * 1. Text-to-Speech (TTS) — AI speaks questions aloud
 * 2. Speech-to-Text (STT) — Candidate speaks answers, we transcribe
 *
 * Uses the FREE built-in browser Web Speech API.
 * Works in Chrome, Edge. Limited in Firefox/Safari.
 * No API keys needed. No cost.
 */

// ─── TEXT TO SPEECH (AI speaks questions) ────────────────────────────────────

/**
 * Speak a piece of text aloud using the browser's TTS engine.
 * @param {string} text - The text to speak
 * @param {object} options - Optional settings
 * @returns {Promise} - Resolves when speech is finished
 */
export const speak = (text, options = {}) => {
  return new Promise((resolve, reject) => {
    // Stop anything currently being spoken
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Voice settings — tweak these for best sound
    utterance.rate = options.rate || 0.9;      // Speed: 0.5 (slow) to 2 (fast)
    utterance.pitch = options.pitch || 1.0;    // Pitch: 0 (low) to 2 (high)
    utterance.volume = options.volume || 1.0;  // Volume: 0 to 1

    // Try to pick a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google') && v.lang.startsWith('en')
    ) || voices.find(v =>
      v.lang.startsWith('en') && !v.name.includes('Microsoft')
    ) || voices[0];

    if (preferred) utterance.voice = preferred;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Stop any currently playing speech immediately.
 */
export const stopSpeaking = () => {
  window.speechSynthesis.cancel();
};

/**
 * Check if Text-to-Speech is available in this browser.
 */
export const isTTSSupported = () => {
  return 'speechSynthesis' in window;
};


// ─── SPEECH TO TEXT (Candidate speaks answers) ───────────────────────────────

let recognition = null;

/**
 * Start listening to the microphone and convert speech to text.
 *
 * @param {function} onResult   - Called with (transcript, isFinal) as words come in
 * @param {function} onEnd      - Called when listening stops
 * @param {function} onError    - Called with error message if something goes wrong
 */
export const startListening = (onResult, onEnd, onError) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return;
  }

  // Stop any existing session
  if (recognition) {
    recognition.stop();
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;       // Keep listening until we stop it
  recognition.interimResults = true;   // Show words as they're being spoken
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Pass both interim (live) and final results to the callback
    onResult(finalTranscript || interimTranscript, !!finalTranscript);
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.onerror = (event) => {
    const messages = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not found. Please check your microphone.',
      'not-allowed': 'Microphone access denied. Please allow microphone access in your browser.',
      'network': 'Network error. Please check your connection.',
    };
    onError(messages[event.error] || `Error: ${event.error}`);
  };

  recognition.start();
};

/**
 * Stop listening to the microphone.
 */
export const stopListening = () => {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
};

/**
 * Check if Speech-to-Text is available in this browser.
 */
export const isSTTSupported = () => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};
