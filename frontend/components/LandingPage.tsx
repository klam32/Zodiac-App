import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import { View, User } from '../types';
import { getImageUrl } from '../api';
import ContactModal from './ContactModal';
import InfoModal from './InfoModal';
import AboutModal from './AboutModal';
import BlogSection from './BlogSection';
import GuideVideoSection from './landing/GuideVideoSection';
import StatsSection from './landing/StatsSection';
import IntroSection from './landing/IntroSection';
import BenefitsSection from './landing/BenefitsSection';
import FeaturesSection from './landing/FeaturesSection';
import HowItWorksSection from './landing/HowItWorksSection';
import ServiceChoiceSection from './landing/ServiceChoiceSection';
import PricingSection from './landing/PricingSection';
import FAQSection from './landing/FAQSection';
import AboutCompanySection from './landing/AboutCompanySection';
import Footer from './landing/Footer';
import PolicyModal from './landing/PolicyModal';
import LanguageSwitcher from './common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';


interface LandingPageProps {
  user: User | null;
  onViewChange: (view: View) => void;
  onLoginClick: () => void;
  onArticleClick: (articleId: string) => void;
  siteConfig: {
    logo_url: string;
    site_title: string;
    background_url?: string;
    favicon_url?: string;
    no_answer_fallback?: string;

    // Hero
    hero_title?: string;
    hero_highlight_text?: string;
    hero_subtitle?: string;
    hero_primary_button_text?: string;
    hero_secondary_button_text?: string;
    hero_background_url?: string;
    hero_chart_image_url?: string;

    // Stats
    stat_users_label?: string;
    stat_users_value?: string;
    stat_charts_label?: string;
    stat_charts_value?: string;
    stat_accuracy_label?: string;
    stat_accuracy_value?: string;
    stat_support_label?: string;
    stat_support_value?: string;

    // Intro
    intro_label?: string;
    intro_title?: string;
    intro_content?: string;

    // Video Guide
    guide_video_label?: string;
    guide_video_title?: string;
    guide_video_subtitle?: string;
    guide_video_url?: string;
    guide_video_poster_url?: string;
    guide_video_enabled?: string;

    // Choice
    choice_window_title?: string;
    choice_title?: string;
    choice_subtitle?: string;
    choice_button_text?: string;
    choice_option_1_title?: string;
    choice_option_1_description?: string;
    choice_option_2_title?: string;
    choice_option_2_description?: string;
    choice_option_3_title?: string;
    choice_option_3_description?: string;

    // About
    about_label?: string;
    about_title?: string;
    about_company_name?: string;
    about_content?: string;
    about_address?: string;
    about_hotline?: string;
    about_working_time?: string;
    company_name?: string;
    company_description?: string;
    company_tax_code?: string;
    company_representative?: string;
    company_address?: string;
    company_hotline?: string;
    company_email?: string;
    company_active_date?: string;

    // Blog
    blog_section_title?: string;
    blog_section_enabled?: string;

    // Footer
    footer_description?: string;
    footer_column_1_title?: string;
    footer_column_2_title?: string;
    footer_column_3_title?: string;
    footer_address?: string;
    footer_hotline?: string;
    footer_working_time?: string;
    footer_copyright?: string;

    blog_posts?: any[];
  };
}

const CountUp: React.FC<{ end: number, duration?: number, start?: boolean, suffix?: string, decimals?: number }> = ({ end, duration = 2000, start = false, suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(progress * end);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);

  return <span>{count.toLocaleString('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

const LandingPage: React.FC<LandingPageProps> = ({ user, onViewChange, onLoginClick, onArticleClick, siteConfig }) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language && i18n.language.startsWith('en')) ? 'en' : 'vi';

  const getLocalizedConfig = (key: string, defaultValue: string = '') => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey as keyof typeof siteConfig] 
        || defaultValue
        || siteConfig[key as keyof typeof siteConfig];
    }
    return siteConfig[localizedKey as keyof typeof siteConfig] 
      || siteConfig[key as keyof typeof siteConfig] 
      || defaultValue;
  };

  const [bgIndex, setBgIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [fadeText, setFadeText] = useState(true);
  const [activeModal, setActiveModal] = useState<'contact' | 'terms' | 'faq' | 'guide' | 'about' | 'privacy' | null>(null);
  const [policyModalType, setPolicyModalType] = useState<'privacy' | 'terms' | 'payment' | null>(null);
  const [statsStarted, setStatsStarted] = useState(false);
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<View>('chat');

  const backgrounds = siteConfig.hero_background_url
    ? [getImageUrl(siteConfig.hero_background_url)]
    : [
      '/hero-bg.png',
      '/hero-bg-2.png',
      '/hero-bg-3.png',
      '/hero-bg-4.png',
      '/hero-bg-5.jpg',
      '/hero-bg-6.jpg',
      '/hero-bg-7.jpg'
    ];

  const cyclingWords = currentLang === 'en'
    ? ['universe', 'destiny', 'soul', 'future']
    : ['vũ trụ', 'vận mệnh', 'tâm hồn', 'tương lai'];

  useEffect(() => {
    if (backgrounds.length <= 1) return;
    const bgInterval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(bgInterval);
  }, [backgrounds]);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setFadeText(false);
      setTimeout(() => {
        setTextIndex((prev) => (prev + 1) % cyclingWords.length);
        setFadeText(true);
      }, 500);
    }, 3000);

    return () => {
      clearInterval(textInterval);
    };
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          if (entry.target.classList.contains('stats-section')) {
            setStatsStarted(true);
          }
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal, .stats-section');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleAction = (view: View) => {
    const modalViews: View[] = ['contact', 'terms', 'faq', 'guide', 'about', 'privacy'];

    if (modalViews.includes(view)) {
      setActiveModal(view as any);
      return;
    }

    if (user && (user.is_admin || user.role?.toUpperCase() === 'ADMIN')) {
      onViewChange('admin');
      return;
    }

    if (!user && (view === 'chat' || view === 'calendar' || view === 'prediction')) {
      onLoginClick();
    } else {
      onViewChange(view);
    }
  };

  const renderStatValue = (valStr: string | undefined, defaultVal: number, suffix: string, decimals = 0) => {
    if (!valStr) return <CountUp end={defaultVal} start={statsStarted} suffix={suffix} decimals={decimals} />;

    // Check if dynamic val contains numbers
    const match = valStr.match(/^([\d.,]+)(.*)$/);
    if (match) {
      const num = parseFloat(match[1].replace(/\./g, '').replace(/,/g, '.'));
      const suf = match[2];
      if (!isNaN(num)) {
        return <CountUp end={num} start={statsStarted} suffix={suf} decimals={valStr.includes('.') || valStr.includes(',') ? 1 : 0} />;
      }
    }
    return <span>{valStr}</span>;
  };

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {siteConfig.logo_url ? (
            <img
              src={getImageUrl(siteConfig.logo_url)}
              alt="Logo"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          ) : (
            <span>✨</span>
          )}
          {getLocalizedConfig('site_title', 'Zodiac Whisper')}
        </div>
        <nav className="nav-links">
          <a href="#features">{t('landing.nav.features')}</a>
          <span onClick={() => handleAction('about')} style={{ cursor: 'pointer' }}>{t('landing.nav.about')}</span>
          <span onClick={() => handleAction('contact')} style={{ cursor: 'pointer' }}>{t('landing.nav.contact')}</span>
        </nav>
        <div className="auth-buttons">
          <LanguageSwitcher variant="light" />
          {user ? (
            <button className="btn btn-outline" onClick={() => handleAction('profile')}>
              Hi, {user.full_name || user.username}
            </button>
          ) : (
            <button className="btn btn-outline" onClick={onLoginClick}>{t('common.login')}</button>
          )}
          <button className="btn btn-primary" onClick={() => handleAction('chat')}>{t('landing.nav.start')}</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-container">
          {backgrounds.map((bg, index) => (
            <img
              key={index}
              src={bg}
              alt="Cosmic Background"
              className={`hero-bg ${index === bgIndex ? 'active' : ''}`}
            />
          ))}
        </div>
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="hero-text">
            <div className="badge pulse">{t('landing.hero.label')}</div>
            <h1>
              {getLocalizedConfig('hero_title') ? (
                <>
                  {getLocalizedConfig('hero_title')}{' '}
                  {getLocalizedConfig('hero_highlight_text') && (
                    <span className="cycling-text active">{getLocalizedConfig('hero_highlight_text')}</span>
                  )}
                </>
              ) : (
                <>
                  {t('landing.hero.discover')} <span className={`cycling-text ${fadeText ? 'text-fade-in' : 'text-fade-out'}`}>
                    {cyclingWords[textIndex]}
                  </span><br />{t('landing.hero.insideYou')}
                </>
              )}
            </h1>
            <p>
              {getLocalizedConfig('hero_subtitle') || t('landing.hero.subtitle')}
            </p>
            <div className="auth-buttons hero-btns">
              <button className="btn btn-primary main-cta" onClick={() => handleAction('chat')}>
                {getLocalizedConfig('hero_primary_button_text') || t('landing.hero.primaryButton')} ✦
              </button>
              <button className="btn btn-outline" onClick={() => handleAction('about')}>
                {getLocalizedConfig('hero_secondary_button_text') || t('landing.hero.secondaryButton')}
              </button>
            </div>
          </div>

          <div className="hero-decoration">
            <div className="wheel-wrapper">
              <img
                src={siteConfig.hero_chart_image_url ? getImageUrl(siteConfig.hero_chart_image_url) : "/zodiac-wheel.png"}
                alt="Rotating Zodiac Wheel"
                className="rotating-wheel"
              />
              <div className="wheel-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Statistics Section */}
      <StatsSection siteConfig={siteConfig} currentLang={currentLang} />

      {/* 3. Intro Section */}
      <IntroSection siteConfig={siteConfig} currentLang={currentLang} />

      {/* 4. Benefits Section */}
      <BenefitsSection siteConfig={siteConfig} currentLang={currentLang} />

      {/* 5. Features Section */}
      <FeaturesSection siteConfig={siteConfig} currentLang={currentLang} />

      {/* 6. Guide Video Section */}
      {(!siteConfig.guide_video_enabled || siteConfig.guide_video_enabled === 'true') && (
        <GuideVideoSection
          siteConfig={{
            guide_video_label: String(getLocalizedConfig('guide_video_label')),
            guide_video_title: String(getLocalizedConfig('guide_video_title')),
            guide_video_subtitle: String(getLocalizedConfig('guide_video_subtitle')),
            guide_video_url: siteConfig.guide_video_url,
            guide_video_poster_url: siteConfig.guide_video_poster_url
          }}
          currentLang={currentLang}
        />
      )}

      {/* 7. How It Works Section */}
      <HowItWorksSection siteConfig={siteConfig} currentLang={currentLang} />

      {/* 8. Service Choice Section */}
      <ServiceChoiceSection siteConfig={siteConfig} currentLang={currentLang} onAction={handleAction} />

      {/* About Company Section */}
      <AboutCompanySection siteConfig={siteConfig} currentLang={currentLang} />

      {/* 9. Pricing/Token Section */}
      <PricingSection siteConfig={siteConfig} currentLang={currentLang} onAction={handleAction} />

      {/* 10. Blog Section */}
      {(!siteConfig.blog_section_enabled || siteConfig.blog_section_enabled === 'true') && (
        <BlogSection onArticleClick={onArticleClick} posts={siteConfig.blog_posts} title={String(getLocalizedConfig('blog_section_title'))} />
      )}

      {/* 11. FAQ Section */}
      <FAQSection siteConfig={siteConfig} currentLang={currentLang} />

      {/* 14. Footer */}
      <Footer
        siteConfig={siteConfig}
        currentLang={currentLang}
        onAction={handleAction}
        onPolicyOpen={(type) => setPolicyModalType(type)}
        setShowZaloModal={setShowZaloModal}
      />

      {/* Policy Modal Overlay */}
      <PolicyModal
        isOpen={policyModalType !== null}
        type={policyModalType || 'privacy'}
        onClose={() => setPolicyModalType(null)}
        siteConfig={siteConfig}
        currentLang={currentLang}
      />

      {/* Modals */}
      <ContactModal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
      />

      <InfoModal
        type="terms"
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        siteConfig={siteConfig}
      />

      <InfoModal
        type="faq"
        isOpen={activeModal === 'faq'}
        onClose={() => setActiveModal(null)}
        siteConfig={siteConfig}
      />

      <InfoModal
        type="guide"
        isOpen={activeModal === 'guide'}
        onClose={() => setActiveModal(null)}
        siteConfig={siteConfig}
      />

      <InfoModal
        type="privacy"
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        siteConfig={siteConfig}
      />

      <AboutModal
        isOpen={activeModal === 'about'}
        onClose={() => setActiveModal(null)}
        siteConfig={siteConfig}
      />

      {/* Zalo QR Modal - Separate as requested */}
      {showZaloModal && (
        <div className="modal-overlay" onClick={() => setShowZaloModal(false)} style={{ zIndex: 2000 }}>
          <div className="modal-content zalo-modal-v3" onClick={e => e.stopPropagation()}>
            <div className="zalo-qr-card">
              <img src="/zalo-qr.png" alt="Zalo QR Code" className="main-qr-img" />
            </div>
            <button className="modal-close-v3" onClick={() => setShowZaloModal(false)}>&times;</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
