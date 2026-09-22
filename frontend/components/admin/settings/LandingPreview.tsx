import React from 'react';
import { getImageUrl } from '../../../api';
import { Maximize2, Minimize2, EyeOff, ExternalLink } from 'lucide-react';

interface LandingPreviewProps {
  settings: any;
  activeSection?: string;
  onClose?: () => void;
  onExpand?: () => void;
  expanded?: boolean;
  isDirty?: boolean;
  previewLanguage?: 'vi' | 'en';
  onLanguageChange?: (lang: 'vi' | 'en') => void;
  hideControlBar?: boolean;
}

const LandingPreview: React.FC<LandingPreviewProps> = ({
  settings,
  activeSection,
  onClose,
  onExpand,
  expanded = false,
  isDirty = false,
  previewLanguage,
  onLanguageChange,
  hideControlBar = false
}) => {
  const [localLang, setLocalLang] = React.useState<'vi' | 'en'>('vi');
  const previewLang = previewLanguage || localLang;
  const setPreviewLang = onLanguageChange || setLocalLang;

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  const sectionRefs = {
    seo: React.useRef<HTMLDivElement>(null),
    hero: React.useRef<HTMLDivElement>(null),
    stats: React.useRef<HTMLDivElement>(null),
    intro: React.useRef<HTMLDivElement>(null),
    video: React.useRef<HTMLDivElement>(null),
    choice: React.useRef<HTMLDivElement>(null),
    about: React.useRef<HTMLDivElement>(null),
    blog: React.useRef<HTMLDivElement>(null),
    footer: React.useRef<HTMLDivElement>(null)
  };

  React.useEffect(() => {
    if (!activeSection) return;
    
    // Normalize activeSection to match the keys in sectionRefs
    let targetKey: string = activeSection;
    if (targetKey === 'platform') targetKey = 'intro';
    if (targetKey === 'services') targetKey = 'choice';
    
    const targetElement = sectionRefs[targetKey as keyof typeof sectionRefs]?.current;
    const container = scrollContainerRef.current;
    
    if (targetElement && container) {
      const containerTop = container.getBoundingClientRect().top;
      const targetTop = targetElement.getBoundingClientRect().top;
      const relativeTop = targetTop - containerTop;
      const targetScrollTop = container.scrollTop + relativeTop - (container.clientHeight / 2) + (targetElement.clientHeight / 2);
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  }, [activeSection]);

  const getBGStyle = (url: string) => {
    if (!url) return { backgroundColor: '#0a0a0f' };
    return {
      backgroundImage: `url(${getImageUrl(url)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  };

  const resolveImage = (url: string) => {
    return url ? getImageUrl(url) : '';
  };

  const getVal = (key: string, defaultValue: string = '', defaultValueEn: string = '') => {
    const localizedKey = `${key}_${previewLang}`;
    if (previewLang === 'en') {
      return settings[localizedKey] || defaultValueEn || settings[key] || defaultValue;
    }
    return settings[localizedKey] || settings[key] || defaultValue;
  };

  return (
    <div className={`landing-preview-container ${expanded ? 'expanded' : ''}`}>
      <style>{`
        .landing-preview-container {
          background: #0f0f15;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 500px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          position: relative;
          color: #f1f5f9;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        .landing-preview-container.expanded {
          border-radius: 0;
          box-shadow: none;
          border: none;
        }

        .preview-bar {
          background: #151520;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          user-select: none;
        }

        .preview-bar-title {
          font-size: 13px;
          font-weight: 700;
          color: #a78bfa;
          display: flex;
          align-items: center;
          gap: 12px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .dirty-badge {
          background: #e11d48;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 999px;
          animation: pulse-badge 2s infinite;
        }

        @keyframes pulse-badge {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .preview-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .preview-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .preview-btn:hover {
          background: rgba(109, 93, 252, 0.2);
          color: #fff;
          border-color: rgba(109, 93, 252, 0.4);
        }

        .preview-scroll {
          flex: 1;
          overflow-y: auto;
          background: #06060a;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Micro Mini Landing styles */
        .mini-sec {
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 12px;
          background: #0c0c14;
          transition: all 0.3s ease;
          position: relative;
        }

        .mini-sec.active-highlight {
          border-color: #6d5dfc;
          box-shadow: 0 0 16px rgba(109, 93, 252, 0.4);
          background: #0e0e1a;
        }

        .active-preview-section {
          outline: 2px solid rgba(139, 92, 246, 0.95) !important;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.18), 0 0 25px rgba(139, 92, 246, 0.35) !important;
          border-radius: 14px;
          transition: all 0.25s ease;
        }

        .mini-sec.active-highlight::before {
          content: 'ĐANG CHỈNH SỬA';
          position: absolute;
          top: -10px;
          right: 12px;
          background: #6d5dfc;
          color: white;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
          z-index: 10;
        }

        /* Header */
        .mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mini-logo-area {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mini-logo-img {
          width: 18px;
          height: 18px;
          object-fit: contain;
          border-radius: 4px;
        }

        .mini-site-title {
          font-size: 11px;
          font-weight: 700;
          color: white;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mini-nav-links {
          display: flex;
          gap: 8px;
          font-size: 9px;
          color: #94a3b8;
        }

        /* Hero */
        .mini-hero {
          position: relative;
          padding: 24px 12px;
          text-align: center;
          overflow: hidden;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .mini-hero-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(10,10,15,0.85) 100%);
          z-index: 1;
        }

        .mini-hero-content {
          position: relative;
          z-index: 2;
          max-width: 100%;
        }

        .mini-hero h1 {
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 6px;
          line-height: 1.2;
          color: white;
        }

        .mini-hero h1 span {
          color: #a78bfa;
        }

        .mini-hero p {
          font-size: 9px;
          color: #cbd5e1;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .mini-hero-btns {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .mini-btn {
          font-size: 8px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
        }

        .mini-btn-primary {
          background: linear-gradient(135deg, #6d5dfc 0%, #3b82f6 100%);
          color: white;
        }

        .mini-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mini-hero-chart {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          margin-top: 10px;
          object-fit: contain;
          animation: spin 20s linear infinite;
          opacity: 0.8;
          border: 1px solid rgba(255,255,255,0.1);
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        /* Stats */
        .mini-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .mini-stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 8px;
          border-radius: 8px;
          text-align: center;
        }

        .mini-stat-val {
          font-size: 12px;
          font-weight: 800;
          color: #a78bfa;
        }

        .mini-stat-lbl {
          font-size: 7px;
          color: #64748b;
          text-transform: uppercase;
          margin-top: 2px;
          letter-spacing: 0.05em;
        }

        /* Intro */
        .mini-badge {
          background: rgba(109, 93, 252, 0.1);
          color: #8b5cf6;
          border: 1px solid rgba(109, 93, 252, 0.2);
          font-size: 7px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 4px;
        }

        .mini-intro h3 {
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 4px;
          color: white;
        }

        .mini-intro p {
          font-size: 8px;
          color: #94a3b8;
          line-height: 1.4;
        }

        /* Video */
        .mini-video {
          text-align: center;
        }

        .mini-video-player {
          width: 100%;
          height: 90px;
          border-radius: 8px;
          background: #000;
          margin-top: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          object-fit: cover;
        }

        /* Choice */
        .mini-choice-window {
          background: #11111b;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
        }

        .mini-win-hdr {
          background: rgba(255, 255, 255, 0.03);
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 8px;
          color: #64748b;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mini-win-dots {
          display: flex;
          gap: 3px;
        }

        .mini-win-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
        }

        .mini-win-body {
          padding: 10px;
        }

        .mini-win-q {
          font-size: 10px;
          font-weight: 700;
          color: white;
          margin-bottom: 2px;
        }

        .mini-win-sub {
          font-size: 7px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .mini-opts {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mini-opt {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mini-opt.active {
          border-color: #6d5dfc;
          background: rgba(109, 93, 252, 0.05);
        }

        .mini-opt-icon {
          font-size: 10px;
        }

        .mini-opt-info {
          flex: 1;
        }

        .mini-opt-title {
          font-size: 8px;
          font-weight: 700;
          color: white;
        }

        .mini-opt-desc {
          font-size: 6px;
          color: #64748b;
        }

        .mini-opt-circle {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .mini-opt.active .mini-opt-circle {
          border-color: #6d5dfc;
          background: #6d5dfc;
        }

        /* About */
        .mini-about {
          background: linear-gradient(135deg, #1b0a3a 0%, #0c051a 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: white;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 12px;
        }

        .mini-about h3 {
          font-size: 11px;
          font-weight: 800;
          color: white;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .mini-about p {
          font-size: 7.5px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }

        /* Blog */
        .mini-blog-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 6px;
        }

        .mini-blog-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
        }

        .mini-blog-img {
          width: 100%;
          height: 40px;
          background: #222;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #444;
        }

        .mini-blog-title {
          font-size: 8px;
          font-weight: 700;
          padding: 6px;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Footer */
        .mini-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 12px;
        }

        .mini-footer-cols {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          font-size: 7px;
          color: #64748b;
        }

        .mini-footer-col h5 {
          font-size: 8px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }

        .mini-footer-copy {
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          margin-top: 12px;
          padding-top: 8px;
          text-align: center;
          font-size: 6px;
          color: #475569;
        }
      `}</style>

      {/* Control bar */}
      {!hideControlBar && (
        <div className="preview-bar">
          <div className="preview-bar-title">
            <span>✨ Xem trước</span>
            {isDirty && <span className="dirty-badge">Chưa lưu</span>}
            <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPreviewLang('vi');
                }}
                style={{
                  background: previewLang === 'vi' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  color: previewLang === 'vi' ? '#fff' : '#94a3b8'
                }}
                title="Xem giao diện Tiếng Việt"
              >
                🇻🇳 VI
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPreviewLang('en');
                }}
                style={{
                  background: previewLang === 'en' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  color: previewLang === 'en' ? '#fff' : '#94a3b8'
                }}
                title="Preview English layout"
              >
                🇬🇧 EN
              </button>
            </div>
          </div>
          <div className="preview-actions">
            <button
              type="button"
              className="preview-btn"
              title="Trang thật chỉ cập nhật sau khi bạn lưu cấu hình. Bấm để xem bản nháp chưa lưu trong tab mới."
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  sessionStorage.setItem(
                    "zodiac_landing_preview_draft",
                    JSON.stringify(settings)
                  );
                  window.open("/?preview_draft=1", "_blank", "noopener,noreferrer");
                } catch (err) {
                  console.error(err);
                  window.open("/", "_blank", "noopener,noreferrer");
                }
              }}
            >
              <ExternalLink size={12} />
            </button>
            {onExpand && (
              <button
                type="button"
                className="preview-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onExpand();
                }}
                title={expanded ? "Thu nhỏ" : "Phóng to"}
              >
                {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            )}
            {onClose && (
              <button
                type="button"
                className="preview-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                title="Ẩn xem trước"
              >
                <EyeOff size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Preview Container */}
      <div ref={scrollContainerRef} className="preview-scroll custom-scrollbar">
        
        {/* Header Preview */}
        <div 
          ref={sectionRefs.seo}
          id="preview-header"
          className={`mini-sec mini-header ${activeSection === 'seo' ? 'active-highlight active-preview-section' : ''}`}
        >
          <div className="mini-logo-area">
            {settings.logo_url ? (
              <img src={resolveImage(settings.logo_url)} className="mini-logo-img" alt="Logo" />
            ) : (
              <span>✨</span>
            )}
            <span className="mini-site-title">{getVal('site_title', 'Zodiac Whisper', 'Zodiac Whisper')}</span>
          </div>
          <div className="mini-nav-links">
            <span>{previewLang === 'en' ? 'Features' : 'Tính năng'}</span>
            <span>{previewLang === 'en' ? 'About Us' : 'Về chúng tôi'}</span>
            <span>{previewLang === 'en' ? 'Contact' : 'Liên hệ'}</span>
          </div>
        </div>

        {/* Hero Section Preview */}
        <div 
          ref={sectionRefs.hero}
          id="preview-hero"
          className={`mini-sec mini-hero ${activeSection === 'hero' ? 'active-highlight active-preview-section' : ''}`}
          style={getBGStyle(settings.hero_background_url || settings.background_url)}
        >
          <div className="mini-hero-overlay"></div>
          <div className="mini-hero-content">
            <h1>
              {getVal('hero_title', 'Khai mở vận mệnh cùng', 'Discover destiny with')}{' '}
              <span>{getVal('hero_highlight_text', 'AI', 'AI')}</span>
            </h1>
            <p>{getVal('hero_subtitle', 'Khám phá bản đồ sao cá nhân thấu hiểu vận mệnh...', 'Explore personal birth charts to understand destiny...')}</p>
            <div className="mini-hero-btns">
              <button
                type="button"
                className="mini-btn mini-btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {getVal('hero_primary_button_text', 'Bắt đầu ngay', 'Get Started')}
              </button>
              <button
                type="button"
                className="mini-btn mini-btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {getVal('hero_secondary_button_text', 'Tìm hiểu thêm', 'Learn More')}
              </button>
            </div>
            {settings.hero_chart_image_url && (
              <img src={resolveImage(settings.hero_chart_image_url)} className="mini-hero-chart" alt="Chart" />
            )}
          </div>
        </div>

        {/* Stats Section Preview */}
        <div 
          ref={sectionRefs.stats}
          id="preview-stats"
          className={`mini-sec ${activeSection === 'stats' ? 'active-highlight active-preview-section' : ''}`}
        >
          <div className="mini-stats-grid">
            <div className="mini-stat-card">
              <div className="mini-stat-val">{settings.stat_users_value || '500.000+'}</div>
              <div className="mini-stat-lbl">{getVal('stat_users_label', 'Người dùng tin tưởng', 'Trusted Users')}</div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-stat-val">{settings.stat_charts_value || '1.000.000+'}</div>
              <div className="mini-stat-lbl">{getVal('stat_charts_label', 'Bản đồ sao đã tạo', 'Birth Charts Created')}</div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-stat-val">{settings.stat_accuracy_value || '99.8%'}</div>
              <div className="mini-stat-lbl">{getVal('stat_accuracy_label', 'Độ chính xác AI', 'AI Accuracy')}</div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-stat-val">{settings.stat_support_value || '24/7'}</div>
              <div className="mini-stat-lbl">{getVal('stat_support_label', 'Hỗ trợ chiêm tinh', 'Astrology Support')}</div>
            </div>
          </div>
        </div>

        {/* Intro Section Preview */}
        <div 
          ref={sectionRefs.intro}
          id="preview-platform"
          className={`mini-sec mini-intro ${activeSection === 'intro' || activeSection === 'platform' ? 'active-highlight active-preview-section' : ''}`}
        >
          <div className="mini-badge">{getVal('intro_label', 'CHỈ NĂNG NĂNG LỰC', 'PLATFORM STRENGTH')}</div>
          <h3>{getVal('intro_title', 'Nền tảng Chiêm tinh AI hàng đầu', 'Leading AI Astrology Platform')}</h3>
          <p>{getVal('intro_content', 'Zodiac Whisper kết hợp công nghệ AI tiên tiến với học thuyết chiêm tinh truyền thống...', 'Zodiac Whisper combines advanced AI technology with traditional astrological principles...')}</p>
        </div>

        {/* Video Section Preview */}
        {(!settings.guide_video_enabled || settings.guide_video_enabled === 'true') && (
          <div 
            ref={sectionRefs.video}
            id="preview-video"
            className={`mini-sec mini-video ${activeSection === 'video' ? 'active-highlight active-preview-section' : ''}`}
          >
            <div className="mini-badge">{getVal('guide_video_label', 'VIDEO HƯỚNG DẪN', 'VIDEO GUIDE')}</div>
            <h3>{getVal('guide_video_title', 'Video Hướng dẫn sử dụng', 'Video User Guide')}</h3>
            <p style={{ fontSize: '8px', color: '#64748b' }}>{getVal('guide_video_subtitle', 'Thấu hiểu chỉ trong 2 phút', 'Understand in just 2 minutes')}</p>
            {(() => {
              if (!settings.guide_video_url) return null;
              const url = settings.guide_video_url;
              let gdEmbedUrl = null;
              if (url.includes('drive.google.com')) {
                if (url.includes('/file/d/')) {
                  const match = url.match(/\/file\/d\/([^/]+)/);
                  if (match) gdEmbedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
                } else if (url.includes('id=')) {
                  const match = url.match(/id=([^&]+)/);
                  if (match) gdEmbedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
                }
              }
              if (gdEmbedUrl) {
                return (
                  <iframe
                    src={gdEmbedUrl}
                    className="mini-video-player"
                    style={{ border: 'none', background: '#000' }}
                    allowFullScreen
                  />
                );
              }
              return (
                <video
                  src={resolveImage(settings.guide_video_url)}
                  poster={resolveImage(settings.guide_video_poster_url)}
                  className="mini-video-player"
                  muted
                  playsInline
                  loop
                  autoPlay
                />
              );
            })()}
          </div>
        )}

        {/* Choice Section Preview */}
        <div 
          ref={sectionRefs.choice}
          id="preview-services"
          className={`mini-sec ${activeSection === 'choice' || activeSection === 'services' ? 'active-highlight active-preview-section' : ''}`}
        >
          <div className="mini-choice-window">
            <div className="mini-win-hdr">
              <span>{getVal('choice_window_title', 'Zodiac Whisper', 'Zodiac Whisper')}</span>
              <div className="mini-win-dots">
                <span className="mini-win-dot"></span>
                <span className="mini-win-dot"></span>
                <span className="mini-win-dot"></span>
              </div>
            </div>
            <div className="mini-win-body">
              <div className="mini-win-q">{getVal('choice_title', 'Bạn muốn xem điều gì?', 'What would you like to explore?')}</div>
              <div className="mini-win-sub">{getVal('choice_subtitle', 'Chọn một trong các tính năng bên dưới.', 'Choose one of our features below.')}</div>
              <div className="mini-opts">
                <div className="mini-opt active">
                  <div className="mini-opt-icon">✨</div>
                  <div className="mini-opt-info">
                    <div className="mini-opt-title">{getVal('choice_option_1_title', 'Chiêm Tinh', 'Astrology')}</div>
                    <div className="mini-opt-desc">{getVal('choice_option_1_description', 'Phân tích bản đồ sao AI.', 'AI birth chart analysis.')}</div>
                  </div>
                  <div className="mini-opt-circle"></div>
                </div>
                <div className="mini-opt">
                  <div className="mini-opt-icon">📅</div>
                  <div className="mini-opt-info">
                    <div className="mini-opt-title">{getVal('choice_option_2_title', 'Lịch Cát Tường', 'Auspicious Calendar')}</div>
                    <div className="mini-opt-desc">{getVal('choice_option_2_description', 'Xem ngày hoàng đạo.', 'View auspicious days.')}</div>
                  </div>
                  <div className="mini-opt-circle"></div>
                </div>
                <div className="mini-opt">
                  <div className="mini-opt-icon">☀️</div>
                  <div className="mini-opt-info">
                    <div className="mini-opt-title">{getVal('choice_option_3_title', 'Vận Trình Ngày', 'Daily Forecast')}</div>
                    <div className="mini-opt-desc">{getVal('choice_option_3_description', 'Năng lượng cá nhân.', 'Personal daily energy.')}</div>
                  </div>
                  <div className="mini-opt-circle"></div>
                </div>
              </div>
              <button
                type="button"
                className="mini-btn mini-btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {getVal('choice_button_text', 'Tiếp tục ngay', 'Continue Now')} ✦
              </button>
            </div>
          </div>
        </div>

        {/* About Section Preview */}
        <div 
          ref={sectionRefs.about}
          id="preview-about"
          className={`mini-sec mini-about ${activeSection === 'about' ? 'active-highlight active-preview-section' : ''}`}
        >
          <div className="mini-badge" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
            {getVal('about_label', 'VỀ CHÚNG TÔI', 'ABOUT US')}
          </div>
          <h3>{getVal('about_title', 'Zodiac Whisper, hệ thống chuyên gia chiêm tinh AI thấu hiểu vận mệnh', 'Zodiac Whisper, the AI astrology expert system that understands your destiny')}</h3>
          <p style={{ fontWeight: 'bold', fontSize: '7px', marginBottom: '4px', color: '#c084fc' }}>
            {getVal('company_name', getVal('about_company_name', 'CÔNG TY TNHH MỘT THÀNH VIÊN CÔNG NGHỆ KỸ THUẬT TIÊN PHONG'), 'PIONEER ENGINEERING TECHNOLOGY ONE MEMBER COMPANY LIMITED')}
          </p>
          <p style={{ marginBottom: '6px' }}>
            {getVal('company_description', getVal('about_content', 'Chuyên cung cấp giải pháp công nghệ kỹ thuật cao...', 'Specializing in high-tech solutions and importing/exporting advanced technology products.'))}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '6.5px', color: '#94a3b8', alignItems: 'center' }}>
            <span>📍 {getVal('company_address', getVal('about_address', 'P16, Đường số 8, KDC lô 49...'), 'P16, Street 8, Block 49, Nam Can Tho Urban Area, Cai Rang Ward, Can Tho City')}</span>
            <span>📞 {settings.company_hotline || settings.about_hotline || '0916 416 409'} | 📅 {getVal('company_active_date', getVal('about_working_time', '05/04/2017'), '05/04/2017')}</span>
          </div>
        </div>

        {/* Blog Section Preview */}
        {(!settings.blog_section_enabled || settings.blog_section_enabled === 'true') && (
          <div 
            ref={sectionRefs.blog}
            id="preview-blog"
            className={`mini-sec ${activeSection === 'blog' ? 'active-highlight active-preview-section' : ''}`}
          >
            <h4 style={{ fontSize: '10px', fontWeight: '700', color: 'white' }}>{getVal('blog_section_title', 'Bài viết mới nhất', 'Latest Posts')}</h4>
            <div className="mini-blog-grid">
              <div className="mini-blog-card">
                <div className="mini-blog-img">🪐</div>
                <div className="mini-blog-title">{previewLang === 'en' ? 'Mercury Retrograde' : 'Sao Thủy nghịch hành'}</div>
              </div>
              <div className="mini-blog-card">
                <div className="mini-blog-img">🌟</div>
                <div className="mini-blog-title">{previewLang === 'en' ? 'Rising Sign' : 'Nhận diện Cung Mọc'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Preview */}
        <div 
          ref={sectionRefs.footer}
          id="preview-footer"
          className={`mini-sec mini-footer ${activeSection === 'footer' ? 'active-highlight active-preview-section' : ''}`}
        >
          <div className="mini-footer-cols">
            <div className="mini-footer-col">
              <h5>Zodiac Whisper</h5>
              <p>{getVal('footer_description', 'Hệ sinh thái Chiêm tinh AI hàng đầu.', 'Leading AI Astrology ecosystem.')}</p>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
                <img
                  src={`https://quickchart.io/qr?text=${encodeURIComponent(getImageUrl(settings.apk_download_url) || 'https://github.com/klam32/Zodiac-App/releases')}&size=40&margin=1`}
                  alt="QR"
                  style={{ width: 32, height: 32, borderRadius: 4, background: 'white', padding: 1 }}
                />
                <span style={{ fontSize: 9, color: '#a78bfa' }}>Scan APK QR</span>
              </div>
            </div>
            <div className="mini-footer-col">
              <h5>{getVal('footer_column_1_title', 'DỊCH VỤ', 'SERVICES')}</h5>
              <p>{previewLang === 'en' ? 'Birth Chart' : 'Bản đồ sao'}<br />{previewLang === 'en' ? 'Auspicious Calendar' : 'Lịch Hoàng Đạo'}</p>
            </div>
            <div className="mini-footer-col">
              <h5>{getVal('footer_column_3_title', 'LIÊN HỆ', 'CONTACT')}</h5>
              <p>{getVal('footer_address', 'TP. Hồ Chí Minh', 'Ho Chi Minh City')}<br />Hotline: {settings.footer_hotline || '1900-xxx'}</p>
            </div>
          </div>
          <div className="mini-footer-copy">
            {getVal('footer_copyright', '© 2026 Zodiac Whisper.', '© 2026 Zodiac Whisper.')}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LandingPreview;
