import React, { createContext, useState, useEffect, useRef } from 'react';
import { cleanTextForSpeech } from '../utils/ttsTextCleaner';

interface TextToSpeechContextType {
  isSupported: boolean;
  currentSpeakingId: string | null;
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (text: string, id: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export const TextToSpeechContext = createContext<TextToSpeechContextType>({
  isSupported: false,
  currentSpeakingId: null,
  isSpeaking: false,
  isPaused: false,
  speak: () => {},
  stop: () => {},
  pause: () => {},
  resume: () => {},
});

export const TextToSpeechProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  // Ref to store active utterance and prevent garbage collection issues in Chrome
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = () => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSpeakingId(null);
  };

  const pause = () => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resume = () => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const speak = (text: string, id: string) => {
    if (!isSupported) return;

    // 1. Cancel previous speech to prevent overlap
    window.speechSynthesis.cancel();

    // 2. If clicking on the currently speaking id, we stop it
    if (currentSpeakingId === id && isSpeaking) {
      stop();
      return;
    }

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    // 3. Create SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Persist ref to avoid GC
    utteranceRef.current = utterance;

    // 4. Try to load Vietnamese voice
    const voices = window.speechSynthesis.getVoices();
    const vietnameseVoice = voices.find(v => v.lang === 'vi-VN' || v.lang.startsWith('vi'));
    if (vietnameseVoice) {
      utterance.voice = vietnameseVoice;
    }

    // 5. Wire events
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentSpeakingId(id);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSpeakingId(null);
      utteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.error('SpeechSynthesisUtterance error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSpeakingId(null);
      utteranceRef.current = null;
    };

    // 6. Speak
    window.speechSynthesis.speak(utterance);
  };

  return (
    <TextToSpeechContext.Provider
      value={{
        isSupported,
        currentSpeakingId,
        isSpeaking,
        isPaused,
        speak,
        stop,
        pause,
        resume,
      }}
    >
      {children}
    </TextToSpeechContext.Provider>
  );
};
