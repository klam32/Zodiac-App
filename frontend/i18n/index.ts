import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viTranslation from './locales/vi.json';
import enTranslation from './locales/en.json';

// Only use zodiac_language key — no other key to avoid conflicts
const savedLanguage = localStorage.getItem('zodiac_language') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        translation: viTranslation
      },
      en: {
        translation: enTranslation
      }
    },
    lng: savedLanguage,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

// Sync language change to localStorage (single key only)
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('zodiac_language', lng);
  // Remove any legacy keys that could conflict
  localStorage.removeItem('language');
  localStorage.removeItem('lang');
  // Note: i18nextLng is written by i18next internally, we override with zodiac_language
});

export default i18n;
