import { useContext } from 'react';
import { TextToSpeechContext } from '../contexts/TextToSpeechContext';

export const useTextToSpeech = () => {
  const context = useContext(TextToSpeechContext);

  if (!context) {
    throw new Error('useTextToSpeech must be used within a TextToSpeechProvider');
  }

  return {
    isSupported: context.isSupported,
    currentSpeakingId: context.currentSpeakingId,
    isSpeaking: context.isSpeaking,
    isPaused: context.isPaused,
    speak: context.speak,
    stop: context.stop,
    pause: context.pause,
    resume: context.resume,
  };
};
