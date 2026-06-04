import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
  variant?: 'dark' | 'light' | 'compact';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'dark' }) => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language && i18n.language.startsWith('en')) ? 'en' : 'vi';

  const toggleLanguage = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextLang = currentLang === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('zodiac_language', nextLang);
  };

  const isLight = variant === 'light';

  // Inline SVG for Vietnam Flag
  const VietnamFlag = () => (
    <svg viewBox="0 0 30 20" className="flag-svg">
      <rect width="30" height="20" fill="#da251d"/>
      <polygon points="15,4 16.176,7.618 20,7.618 16.912,9.854 18.088,13.472 15,11.236 11.912,13.472 13.088,9.854 10,7.618 13.824,7.618" fill="#ffff00"/>
    </svg>
  );

  // Inline SVG for UK Flag (Union Jack) — using React-compatible camelCase attributes
  const UKFlag = () => (
    <svg viewBox="0 0 60 30" className="flag-svg">
      <rect width="60" height="30" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" strokeWidth="4"/>
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 V30 M0,15 H60" stroke="#c8102e" strokeWidth="6"/>
    </svg>
  );

  return (
    <button
      onClick={toggleLanguage}
      className={`language-toggle-btn ${isLight ? 'light' : ''}`}
      title={currentLang === 'vi' ? 'Tiếng Việt — Click to switch to English' : 'English — Click to switch to Vietnamese'}
      aria-label="Toggle Language"
    >
      <span className="flag-wrapper">
        {currentLang === 'vi' ? <VietnamFlag /> : <UKFlag />}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
