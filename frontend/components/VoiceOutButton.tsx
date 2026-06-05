import React from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Volume2, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VoiceOutButtonProps {
  text: string;
  id: string;
  disabled?: boolean;
  className?: string;
}

export const VoiceOutButton: React.FC<VoiceOutButtonProps> = ({
  text,
  id,
  disabled = false,
  className = '',
}) => {
  const { isSupported, currentSpeakingId, isSpeaking, speak, stop } = useTextToSpeech();
  const { t } = useTranslation();

  if (!isSupported) {
    return null;
  }

  const isCurrent = currentSpeakingId === id;
  const isPlaying = isCurrent && isSpeaking;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;

    if (isPlaying) {
      stop();
    } else {
      speak(text, id);
    }
  };

  const tooltipText = disabled
    ? t('chat.voiceWait', 'Vui lòng đợi câu trả lời hoàn tất')
    : isPlaying
    ? t('chat.voiceStop', 'Dừng đọc (Stop)')
    : t('chat.voiceStart', 'Đọc thành tiếng (Voice Out)');

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`voice-out-button ${isPlaying ? 'is-speaking' : ''} ${className}`}
      title={tooltipText}
      aria-label={tooltipText}
    >
      {isPlaying ? (
        <Square className="w-4 h-4 text-white animate-pulse" />
      ) : (
        <Volume2 className="w-4 h-4 text-purple-200" />
      )}
    </button>
  );
};

export default VoiceOutButton;
