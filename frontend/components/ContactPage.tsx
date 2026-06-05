import React from 'react';
import './SubPage.css';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

interface ContactPageProps {
  onBack: () => void;
  onLogin: () => void;
  user?: User | null;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack, onLogin, user }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  return (
    <div className="subpage-container">
      <header className="subpage-header">
        <div className="subpage-logo" onClick={onBack} style={{ cursor: 'pointer' }}>
          <span>✨</span> Zodiac Whisper
        </div>
        {user ? (
          <button className="btn btn-outline" onClick={onBack}>Hi, {user.full_name || user.username}</button>
        ) : (
          <button className="btn btn-primary" onClick={onLogin}>{isEn ? 'Login' : 'Đăng nhập'}</button>
        )}
      </header>

      <main className="subpage-content">
        <div className="subpage-card">
          <h1 className="subpage-title">
            {isEn ? 'Contact Support & About Zodiac Whisper Team' : 'Liên hệ hỗ trợ & Về đội ngũ Zodiac Whisper'}
          </h1>
          <p className="subpage-subtitle">
            {isEn ? 'Last updated: April 20, 2026' : 'Cập nhật lần cuối: 20/4/2026'}
          </p>

          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              {isEn ? 'About Zodiac Whisper Team' : 'Về Đội Ngũ Zodiac Whisper'}
            </h2>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {isEn ? (
                <>
                  At <strong>Zodiac Whisper AI</strong>, we help you discover yourself and guide your future through the most advanced astrological algorithms. Save <strong>90% of research time</strong> and receive profound insights from the universe.
                </>
              ) : (
                <>
                  Tại <strong>Zodiac Whisper AI</strong>, chúng tôi giúp bạn khám phá bản thân và định hướng tương lai qua các thuật toán chiêm tinh tiên tiến nhất. Tiết kiệm <strong>90% thời gian nghiên cứu</strong> và mang lại những lời khuyên sâu sắc từ vũ trụ.
                </>
              )}
            </p>
          </div>

          <div className="contact-grid">
            <div className="info-box">
              <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>
                {isEn ? 'Contact Information' : 'Thông tin liên hệ'}
              </h3>
              
              <div className="info-item">
                <div className="info-label">Email</div>
                <div className="info-value">nguyenkhoalamgh2003@gmail.com</div>
              </div>

              <div className="info-item">
                <div className="info-label">Hotline / Zalo</div>
                <div className="info-value">0946 413 212</div>
              </div>

              <div className="info-item">
                <div className="info-label">Facebook</div>
                <div className="info-value">
                  <a 
                    href="https://www.facebook.com/share/1Nmf3mz9Qv/?mibextid=wwXIfr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#6e2cf2', textDecoration: 'none' }}
                  >
                    {isEn ? 'Join community' : 'Tham gia cộng đồng'}
                  </a>
                </div>
              </div>
            </div>

            <div className="message-box">
              <h3 style={{ marginBottom: '1rem' }}>{isEn ? 'Send Message' : 'Gửi lời nhắn'}</h3>
              <p style={{ color: '#cbd5e0', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {isEn 
                  ? 'Need support or partnership? Please contact us through the channels above.' 
                  : 'Cần hỗ trợ hoặc hợp tác? Hãy liên hệ với chúng tôi qua các kênh trên.'}
              </p>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <p style={{ color: '#ecc94b', fontSize: '0.9rem', margin: 0 }}>
                  💡 <strong>{isEn ? 'Tip:' : 'Mẹo:'}</strong> {isEn 
                    ? 'When contacting Zalo, please attach the support details for the fastest response.' 
                    : 'Khi liên hệ Zalo, hãy gửi kèm nội dung cần hỗ trợ để được phản hồi nhanh nhất.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="subpage-footer">
        <div>
          {isEn ? '© 2026 Zodiac Whisper. All rights reserved. ' : '© 2026 Zodiac Whisper. Đã đăng ký bản quyền. '}
          <span style={{ color: '#e53e3e', fontWeight: 'bold' }}>BETA</span>
        </div>
        <div style={{ marginTop: '0.5rem', color: '#cbd5e0' }}>
          {isEn 
            ? 'The system is in the beta phase. All transactions serve technological testing purposes.' 
            : 'Hệ thống đang trong giai đoạn thử nghiệm. Mọi giao dịch phục vụ mục đích trải nghiệm công nghệ.'}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <span onClick={onBack} style={{ cursor: 'pointer', color: '#6e2cf2' }}>{isEn ? 'Home' : 'Trang chủ'}</span>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
