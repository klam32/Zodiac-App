import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import { View, User } from '../types';
import { API_ROOT } from '../api';
import ContactModal from './ContactModal';
import InfoModal from './InfoModal';
import AboutModal from './AboutModal';
import BlogSection from './BlogSection';

interface LandingPageProps {
  user: User | null;
  onViewChange: (view: View) => void;
  onLoginClick: () => void;
  onArticleClick: (articleId: string) => void;
  siteConfig: {
    logo_url: string;
    site_title: string;
    hero_title?: string;
    hero_subtitle?: string;
    about_title?: string;
    about_content?: string;
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
  const [bgIndex, setBgIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [fadeText, setFadeText] = useState(true);
  const [activeModal, setActiveModal] = useState<'contact' | 'terms' | 'faq' | 'guide' | 'about' | 'privacy' | null>(null);
  const [statsStarted, setStatsStarted] = useState(false);
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<View>('chat');

  const backgrounds = [
    '/hero-bg.png',
    '/hero-bg-2.png',
    '/hero-bg-3.png',
    '/hero-bg-4.png',
    '/hero-bg-5.jpg',
    '/hero-bg-6.jpg',
    '/hero-bg-7.jpg'
  ];

  const cyclingWords = ['vũ trụ', 'vận mệnh', 'tâm hồn', 'tương lai'];

  useEffect(() => {
    const bgInterval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);

    const textInterval = setInterval(() => {
      setFadeText(false);
      setTimeout(() => {
        setTextIndex((prev) => (prev + 1) % cyclingWords.length);
        setFadeText(true);
      }, 500);
    }, 3000);

    return () => {
      clearInterval(bgInterval);
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

  const zodiacSigns = [
    { name: 'Bạch Dương', icon: '♈' }, { name: 'Kim Ngưu', icon: '♉' },
    { name: 'Song Tử', icon: '♊' }, { name: 'Cự Giải', icon: '♋' },
    { name: 'Sư Tử', icon: '♌' }, { name: 'Xử Nữ', icon: '♍' },
    { name: 'Thiên Bình', icon: '♎' }, { name: 'Bọ Cạp', icon: '♏' },
    { name: 'Nhân Mã', icon: '♐' }, { name: 'Ma Kết', icon: '♑' },
    { name: 'Bảo Bình', icon: '♒' }, { name: 'Song Ngư', icon: '♓' }
  ];

  const planets = [
    { name: 'Mặt Trời', icon: '☀️' }, { name: 'Mặt Trăng', icon: '🌙' },
    { name: 'Sao Thủy', icon: '☿' }, { name: 'Sao Kim', icon: '♀' },
    { name: 'Sao Hỏa', icon: '♂' }, { name: 'Sao Mộc', icon: '♃' },
    { name: 'Sao Thổ', icon: '♄' }, { name: 'Thiên Vương', icon: '♅' },
    { name: 'Hải Vương', icon: '♆' }, { name: 'Diêm Vương', icon: '♇' }
  ];

  const handleAction = (view: View) => {
    const modalViews: View[] = ['contact', 'terms', 'faq', 'guide', 'about', 'privacy'];

    if (modalViews.includes(view)) {
      setActiveModal(view as any);
      return;
    }

    if (!user && view === 'chat') {
      onLoginClick();
    } else {
      onViewChange(view);
    }
  };

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {siteConfig.logo_url ? (
            <img 
              src={siteConfig.logo_url.startsWith('/api/') ? `${API_ROOT}${siteConfig.logo_url}` : siteConfig.logo_url} 
              alt="Logo" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
            />
          ) : (
            <span>✨</span>
          )}
          {siteConfig.site_title || "Zodiac Whisper"}
        </div>
        <nav className="nav-links">
          <a href="#features">Tính năng</a>
          <span onClick={() => handleAction('about')} style={{ cursor: 'pointer' }}>Về chúng tôi</span>
          <span onClick={() => handleAction('contact')} style={{ cursor: 'pointer' }}>Liên hệ</span>
        </nav>
        <div className="auth-buttons">
          {user ? (
            <button className="btn btn-outline" onClick={() => handleAction('profile')}>
              Hi, {user.full_name || user.username}
            </button>
          ) : (
            <button className="btn btn-outline" onClick={onLoginClick}>Đăng nhập</button>
          )}
          <button className="btn btn-primary" onClick={() => handleAction('chat')}>Bắt đầu ngay</button>
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
            <div className="badge pulse">✦ Công nghệ AI tiên tiến</div>
            <h1>
              Khám phá <span className={`cycling-text ${fadeText ? 'text-fade-in' : 'text-fade-out'}`}>
                {cyclingWords[textIndex]}
              </span><br />bên trong bạn
            </h1>
            <p>
              Phân tích tinh vân, thấu hiểu bản thân qua các công cụ Chiêm tinh AI chuyên sâu nhất.
              Bắt đầu hành trình tìm kiếm sự bình an và định hướng tương lai.
            </p>
            <div className="auth-buttons hero-btns">
              <button className="btn btn-primary main-cta" onClick={() => handleAction('chat')}>
                Bắt đầu ngay ✦
              </button>
              <button className="btn btn-outline" onClick={() => handleAction('about')}>
                Tìm hiểu thêm
              </button>
            </div>
          </div>

          <div className="hero-decoration">
            <div className="wheel-wrapper">
              <img src="/zodiac-wheel.png" alt="Rotating Zodiac Wheel" className="rotating-wheel" />
              <div className="wheel-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section reveal">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">
              <CountUp end={500000} start={statsStarted} suffix="+" />
            </div>
            <div className="stat-label">Người dùng tin tưởng</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              <CountUp end={1000000} start={statsStarted} suffix="+" />
            </div>
            <div className="stat-label">Bản đồ sao được tạo</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              <CountUp end={99.8} start={statsStarted} suffix="%" decimals={1} />
            </div>
            <div className="stat-label">Độ chính xác AI</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              <CountUp end={24} start={statsStarted} suffix="/7" />
            </div>
            <div className="stat-label">Hỗ trợ chiêm tinh</div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section reveal">
        <div className="section-container">
          <div className="section-header">
            <div className="badge">✦ VỀ ZODIAC WHISPER</div>
            <h2>Nền tảng Chiêm tinh AI hàng đầu</h2>
            <p style={{ maxWidth: '800px', margin: '0 auto', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', fontSize: '1.1rem' }}>
              Zodiac Whisper là hệ sinh thái công nghệ giúp bạn khám phá chiều sâu tâm hồn qua các thuật toán Chiêm tinh AI tiên tiến nhất.
              Chúng tôi kết hợp trí tuệ cổ xưa với công nghệ hiện đại để mang lại những lời khuyên chính xác và thấu hiểu vũ trụ bên trong bạn.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section reveal" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="section-header">
          <div className="badge">Tính năng nổi bật</div>
          <h2>Kiến thức Chiêm Tinh Toàn Diện</h2>
          <button
            className="btn btn-outline"
            style={{ marginTop: '1.5rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
            onClick={() => handleAction('details')}
          >
            Xem chi tiết toàn tập ✦
          </button>
        </div>
        <div className="features-grid">
          <div className="feature-card" onClick={() => handleAction('details')}>
            <span className="feature-icon">🗺️</span>
            <h3>Bản Đồ Sao</h3>
            <p>Vị trí các hành tinh, Ascendant & Midheaven tại thời điểm bạn chào đời.</p>
          </div>
          <div className="feature-card" onClick={() => handleAction('details')}>
            <span className="feature-icon">☀️</span>
            <h3>Mặt Trời & Mặt Trăng</h3>
            <p>Thấu hiểu linh hồn, cảm xúc và cách bạn thể hiện bản thân ra thế giới.</p>
          </div>
          <div className="feature-card" onClick={() => handleAction('details')}>
            <span className="feature-icon">🏠</span>
            <h3>12 Nhà</h3>
            <p>Khám phá các khía cạnh cuộc sống: tài chính, sự nghiệp, tình yêu...</p>
          </div>
          <div className="feature-card" onClick={() => handleAction('details')}>
            <span className="feature-icon">💖</span>
            <h3>Synastry</h3>
            <p>So sánh hai bản đồ sao để đánh giá mức độ hòa hợp trong tình duyên.</p>
          </div>
          <div className="feature-card" onClick={() => handleAction('details')}>
            <span className="feature-icon">🔮</span>
            <h3>Giải Mã Giấc Mơ</h3>
            <p>Giải mã các tín hiệu từ tiềm thức qua những giấc mộng của bạn.</p>
          </div>
          <div className="feature-card" onClick={() => handleAction('details')}>
            <span className="feature-icon">📅</span>
            <h3>Dự Báo Hằng Ngày</h3>
            <p>Cập nhật xu hướng năng lượng và lời khuyên cho mỗi ngày mới.</p>
          </div>
        </div>
      </section>

      {/* Image 3: Choose Report Section - Replacing Zodiac */}
      <section className="report-selection reveal">
        <div className="section-container">
          <div className="report-card-v3">
            <div className="report-header-v3">
              <h3>Chọn báo cáo phù hợp</h3>
              <div className="window-controls">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>

            <div className="report-body-v3">
              <p className="question">Bạn muốn xem điều gì?</p>
              <p className="sub-question">Chọn một mục tiêu chính</p>

              <div className="report-options-grid">
                <div 
                  className={`report-option ${selectedFeature === 'chat' ? 'active' : ''}`}
                  onClick={() => setSelectedFeature('chat')}
                >
                  <div className="option-icon">✨</div>
                  <div className="option-content">
                    <h4>Chiêm Tinh</h4>
                    <p>Phân tích bản đồ sao, giải mã vận mệnh qua trí tuệ nhân tạo AI.</p>
                  </div>
                  <div className="radio-circle"></div>
                </div>

                <div 
                  className={`report-option ${selectedFeature === 'calendar' ? 'active' : ''}`}
                  onClick={() => setSelectedFeature('calendar')}
                >
                  <div className="option-icon">📅</div>
                  <div className="option-content">
                    <h4>Lịch Cát Tường</h4>
                    <p>Xem ngày tốt xấu, giờ hoàng đạo và các việc nên làm trong ngày.</p>
                  </div>
                  <div className="radio-circle"></div>
                </div>

                <div 
                  className={`report-option ${selectedFeature === 'prediction' ? 'active' : ''}`}
                  onClick={() => setSelectedFeature('prediction')}
                >
                  <div className="option-icon">☀️</div>
                  <div className="option-content">
                    <h4>Vận Trình Ngày</h4>
                    <p>Dự báo xu hướng năng lượng và lời khuyên cá nhân cho riêng bạn.</p>
                  </div>
                  <div className="radio-circle"></div>
                </div>
              </div>
            </div>

            <div className="report-footer-v3">
              <button className="btn-next" onClick={() => handleAction(selectedFeature)}>Tiếp tục ngay ✦</button>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="section cta-premium-section reveal" style={{ background: '#6e2cf2', textAlign: 'center', padding: '6rem 10%' }}>
        <div className="cta-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="badge" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', marginBottom: '2rem' }}>✦ VỀ CHÚNG TÔI</div>
          <h2 style={{ color: 'white', fontSize: '3.5rem', marginBottom: '2rem', fontWeight: '800', lineHeight: '1.2' }}>
            Zodiac Whisper, hệ thống chuyên gia chiêm tinh AI thấu hiểu vận mệnh
          </h2>
          
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            CÔNG TY TNHH MỘT THÀNH VIÊN CÔNG NGHỆ KỸ THUẬT TIÊN PHONG — chuyên cung cấp giải<br />
            pháp công nghệ kỹ thuật cao và xuất nhập khẩu các mặt hàng công nghệ tiên tiến.
          </p>

          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '3rem', lineHeight: '1.8' }}>
            MST: 1801526082 · Người đại diện: NGÔ HỒ ANH KHÔI<br />
            P16, Đường số 8, KDC lô 49, Khu đô thị Nam Cần Thơ, Phường Cái Răng, TP. Cần Thơ<br />
            0916 416 409 · Hoạt động từ 05/04/2017
          </div>

        </div>
      </section>

      <BlogSection onArticleClick={onArticleClick} posts={siteConfig.blog_posts} />

      {/* Footer */}
      <footer className="footer reveal">
        <div className="footer-top">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
               {siteConfig.logo_url ? (
                 <img 
                   src={siteConfig.logo_url.startsWith('/api/') ? `${API_ROOT}${siteConfig.logo_url}` : siteConfig.logo_url} 
                   alt="Logo" 
                   style={{ height: '40px', width: 'auto', objectFit: 'contain' }} 
                 />
               ) : (
                 <span style={{ fontSize: '2rem' }}>✨</span>
               )}
               <h2 style={{ margin: 0 }}>{siteConfig.site_title || "Zodiac Whisper"}</h2>
            </div>
            <p>
              Bộ công cụ công nghệ AI toàn diện giúp bạn thấu hiểu bản thân và định hướng tương lai qua ngôn ngữ của các vì sao.
              Dẫn đầu xu hướng chiêm tinh số tại Việt Nam.
            </p>
            <div className="social-links-v2">
              <a href="https://www.facebook.com/share/1Nmf3mz9Qv/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="social-item">
                <div className="social-icon fb"></div>
                <span>Facebook</span>
              </a>
              <a href="https://www.instagram.com/taolalam_?igsh=MXE1OXBsa2hiNHA2cg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="social-item">
                <div className="social-icon ig"></div>
                <span>Instagram</span>
              </a>
              <div onClick={() => setShowZaloModal(true)} className="social-item" style={{ cursor: 'pointer' }}>
                <div className="social-icon zalo"></div>
                <span>Zalo</span>
              </div>
            </div>
          </div>

          <div className="footer-column">
            <h4>Khám phá</h4>
            <ul>
              <li><a href="#features">Bản đồ sao</a></li>
              <li><a href="#features">Tình yêu & Synastry</a></li>
              <li><a href="#features">Giải mã giấc mơ</a></li>
              <li><a href="#features">Dự báo hằng ngày</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Hỗ trợ</h4>
            <ul>
              <li><span onClick={() => handleAction('guide')}>Hướng dẫn sử dụng</span></li>
              <li><span onClick={() => handleAction('faq')}>Câu hỏi thường gặp</span></li>
              <li><span onClick={() => handleAction('terms')}>Điều khoản dịch vụ</span></li>
              <li><span onClick={() => handleAction('privacy')}>Chính sách bảo mật</span></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Kết nối với chúng tôi</h4>
            <ul className="contact-info">
              <li><strong>Địa chỉ:</strong> P16, Đường số 8, KDC lô 49, Khu đô thị Nam Cần Thơ, Phường Cái Răng, TP. Cần Thơ</li>
              <li><strong>Hotline:</strong> <span className="hotline-text">0916 416 409</span></li>
              <li><strong>Thời gian:</strong> 08:00 - 21:00 (Mỗi ngày)</li>
            </ul>
            <button className="btn btn-support" onClick={() => handleAction('contact')}>
              💬 Liên hệ hỗ trợ
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 Zodiac Whisper - Một sản phẩm của Tiên Phong Tech.</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span onClick={() => handleAction('privacy')} style={{ cursor: 'pointer' }}>Privacy</span>
            <span onClick={() => handleAction('terms')} style={{ cursor: 'pointer' }}>Terms</span>
            <span>English (US) 🌐</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ContactModal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
      />

      <InfoModal
        type="terms"
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
      />

      <InfoModal
        type="faq"
        isOpen={activeModal === 'faq'}
        onClose={() => setActiveModal(null)}
      />

      <InfoModal
        type="guide"
        isOpen={activeModal === 'guide'}
        onClose={() => setActiveModal(null)}
      />

      <InfoModal
        type="privacy"
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
      />

      <AboutModal
        isOpen={activeModal === 'about'}
        onClose={() => setActiveModal(null)}
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
