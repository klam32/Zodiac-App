import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { getImageUrl } from '../../api';

interface LanguageWelcomeScreenProps {
  onLanguageSelected: () => void;
  logoUrl?: string;
  siteTitle?: string;
}

const LanguageWelcomeScreen: React.FC<LanguageWelcomeScreenProps> = ({
  onLanguageSelected,
  logoUrl,
  siteTitle = 'Zodiac Whisper'
}) => {
  const { i18n } = useTranslation();

  const handleSelectLanguage = (lang: 'vi' | 'en') => {
    localStorage.setItem('zodiac_language', lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('zodiac_language_selected', 'true');
    onLanguageSelected();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#05050c] text-white p-6 relative overflow-hidden font-sans select-none">
      {/* Mystical Background Cosmic Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Tiny floating stars background effect */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-ping" />
        <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-purple-300 rounded-full opacity-60" />
        <div className="absolute bottom-[30%] left-[10%] w-0.5 h-0.5 bg-blue-200 rounded-full" />
        <div className="absolute bottom-[15%] right-[25%] w-1 h-1 bg-white rounded-full animate-pulse" />
      </div>

      <div className="z-10 flex flex-col items-center max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full scale-125" />
          {logoUrl ? (
            <img
              src={getImageUrl(logoUrl)}
              alt="Logo"
              className="w-24 h-24 object-contain rounded-2xl drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] relative z-10 border border-white/10"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.4)] border border-purple-400/30 relative z-10">
              <Sparkles size={48} className="text-purple-100" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-wide mb-2 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow-md font-title">
          {siteTitle}
        </h1>

        <div className="mt-8 mb-6">
          <h2 className="text-lg font-medium text-purple-200/90 tracking-wide mb-1">
            Chọn ngôn ngữ
          </h2>
          <p className="text-sm text-gray-400">
            Choose your language
          </p>
        </div>

        {/* Language Selection Cards */}
        <div className="grid grid-cols-1 gap-4 w-full px-4 mb-10">
          {/* Vietnamese Button */}
          <button
            onClick={() => handleSelectLanguage('vi')}
            className="group relative flex items-center justify-between w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/30 transition-all duration-300 active:scale-[0.98] shadow-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-4 relative z-10">
              <span className="text-3xl" role="img" aria-label="Vietnamese Flag">🇻🇳</span>
              <div className="text-left">
                <span className="block text-base font-semibold text-white tracking-wide">Tiếng Việt</span>
                <span className="block text-xs text-purple-300/70">Tiếp tục bằng tiếng Việt</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-purple-500/20 flex items-center justify-center text-purple-300 group-hover:text-purple-200 transition-colors relative z-10">
              ➔
            </div>
          </button>

          {/* English Button */}
          <button
            onClick={() => handleSelectLanguage('en')}
            className="group relative flex items-center justify-between w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/30 transition-all duration-300 active:scale-[0.98] shadow-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-4 relative z-10">
              <span className="text-3xl" role="img" aria-label="English Flag">🇬🇧</span>
              <div className="text-left">
                <span className="block text-base font-semibold text-white tracking-wide">English</span>
                <span className="block text-xs text-purple-300/70">Continue in English</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-purple-500/20 flex items-center justify-center text-purple-300 group-hover:text-purple-200 transition-colors relative z-10">
              ➔
            </div>
          </button>
        </div>

        {/* Footer info message */}
        <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed relative z-10">
          Vui lòng chọn ngôn ngữ để tiếp tục trải nghiệm.
          <span className="block mt-1 text-gray-600">Please select a language to continue the experience.</span>
        </p>
      </div>
    </div>
  );
};

export default LanguageWelcomeScreen;
