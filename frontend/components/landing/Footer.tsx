import React from 'react';
import { getImageUrl } from '../../api';
import { Facebook, Instagram, PhoneCall, Globe, Shield, FileText, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface FooterProps {
  siteConfig: any;
  currentLang: string;
  onAction: (view: string) => void;
  onPolicyOpen: (type: 'privacy' | 'terms' | 'payment') => void;
  setShowZaloModal: (show: boolean) => void;
}

const Footer: React.FC<FooterProps> = ({ siteConfig, currentLang, onAction, onPolicyOpen, setShowZaloModal }) => {
  const { t } = useTranslation();

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const logoUrl = siteConfig.logo_url;
  const siteTitle = getVal('site_title', 'Zodiac Whisper');
  const footerDesc = getVal('footer_description', t('landing.footer.description', 'Zodiac Whisper là người bạn đồng hành chiêm tinh thông thái của bạn, kết hợp cổ học huyền học và công nghệ AI để khai mở con đường vận mệnh của mỗi linh hồn.'));
  const footerColumn1 = getVal('footer_column_1_title', t('landing.footer.explore', 'Dịch Vụ Nổi Bật'));
  const footerColumn2 = getVal('footer_column_2_title', t('landing.footer.support', 'Liên Kết Chính'));
  const footerColumn3 = getVal('footer_column_3_title', t('landing.footer.connect', 'Thông Tin Liên Hệ'));

  const address = getVal('footer_address', getVal('company_address', getVal('about_address', 'P16, Đường số 8, KDC lô 49, Khu đô thị Nam Cần Thơ, Phường Cái Răng, TP. Cần Thơ')));
  const hotline = siteConfig.footer_hotline || siteConfig.company_hotline || siteConfig.about_hotline || '0916 416 409';
  const email = siteConfig.company_email || 'nguyenkhoalamgh2003@gmail.com';
  const workingTime = getVal('footer_working_time', getVal('company_active_date', getVal('about_working_time', '8:00 - 18:00, Thứ 2 - Chủ Nhật')));
  const copyright = getVal('footer_copyright', t('landing.footer.copyright', '© 2026 Zodiac Whisper. Bảo lưu mọi quyền.'));

  return (
    <footer className="footer-v2 reveal active">
      <div className="footer-top-v2">
        {/* Brand Column */}
        <div className="footer-brand-v2">
          <div className="footer-logo-title-v2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {logoUrl ? (
              <img
                src={getImageUrl(logoUrl)}
                alt="Logo"
                className="footer-logo-img-v2"
              />
            ) : (
              <span className="footer-logo-sparkle-v2">✨</span>
            )}
            <h3>{siteTitle}</h3>
          </div>
          <p className="footer-desc-v2">{footerDesc}</p>
          
          <div className="social-links-v3">
            <a href="https://www.facebook.com/share/1Nmf3mz9Qv/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="social-item-v3">
              <Facebook size={16} />
              <span>Facebook</span>
            </a>

            <a href="https://www.instagram.com/taolalam_?igsh=MXE1OXBsa2hiNHA2cg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="social-item-v3">
              <Instagram size={16} />
              <span>Instagram</span>
            </a>
            
            <div onClick={() => setShowZaloModal(true)} className="social-item-v3 cursor-pointer">
              <span className="zalo-letter-icon-v3">Z</span>
              <span>Zalo</span>
            </div>
          </div>

          {/* Android APK Download Widget */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(109, 93, 252, 0.08)',
            border: '1px solid rgba(109, 93, 252, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            maxWidth: '300px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
            textAlign: 'left'
          }}>
            {(() => {
              const getApkFallback = () => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'https://frontend-omega-pink-49.vercel.app';
                return `${origin}/zodiac_whisper_33552dac.apk`;
              };
              const targetApkUrl = getImageUrl(siteConfig.apk_download_url) || getApkFallback();
              return (
                <>
                  <img
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(targetApkUrl)}&size=80&margin=1`}
                    alt="QR Code Tải App"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: 'white',
                      padding: '4px',
                      borderRadius: '8px',
                      border: '1px solid rgba(109, 93, 252, 0.3)',
                      boxShadow: '0 4px 12px rgba(109, 93, 252, 0.15)'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t('landing.footer.appTitle', 'Ứng dụng di động')}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                      {t('landing.footer.scanToDownload', 'Quét QR tải APK')}
                    </span>
                    <a
                      href={targetApkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #6d5dfc, #a855f7)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 10px rgba(109, 93, 252, 0.3)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(109, 93, 252, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(109, 93, 252, 0.3)';
                }}
              >
                {t('landing.footer.downloadApk', 'Tải APK trực tiếp')}
              </a>
            </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Column 1: Services */}
        <div className="footer-column-v2">
          <h4>{footerColumn1}</h4>
          <ul>
            <li><span onClick={() => onAction('chat')}>{t('landing.footer.birthChart', 'Bản đồ sao cá nhân')}</span></li>
            <li><span onClick={() => onAction('chat')}>{t('landing.footer.synastry', 'Tương hợp đôi lứa')}</span></li>
            <li><span onClick={() => onAction('chat')}>{t('landing.footer.dream', 'Giải mã giấc mơ')}</span></li>
            <li><span onClick={() => onAction('prediction')}>{t('landing.footer.dailyForecast', 'Dự báo hằng ngày')}</span></li>
          </ul>
        </div>

        {/* Column 2: Links */}
        <div className="footer-column-v2">
          <h4>{footerColumn2}</h4>
          <ul>
            <li><span onClick={() => onAction('support')}>{t('landing.footer.guide', 'Hướng dẫn sử dụng')}</span></li>
            <li><span onClick={() => onAction('support')}>{t('landing.footer.faq', 'Câu hỏi thường gặp')}</span></li>
            <li><span onClick={() => onPolicyOpen('privacy')}>{t('landing.footer.privacy', 'Chính sách bảo mật')}</span></li>
            <li><span onClick={() => onPolicyOpen('terms')}>{t('landing.footer.terms', 'Điều khoản sử dụng')}</span></li>
            <li><span onClick={() => onPolicyOpen('data_deletion' as any)}>{currentLang === 'en' ? 'Data Deletion Policy' : 'Chính sách xóa dữ liệu'}</span></li>
            <li><span onClick={() => onPolicyOpen('payment')}>{t('landing.footer.payment', 'Chính sách thanh toán')}</span></li>
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div className="footer-column-v2">
          <h4>{footerColumn3}</h4>
          <ul className="contact-info-v2">
            <li>
              <strong>{t('landing.footer.address', 'Địa chỉ')}:</strong>
              <span>{address}</span>
            </li>
            <li>
              <strong>{t('common.hotline', 'Hotline')}:</strong>
              <span className="hotline-text-v2">{hotline}</span>
            </li>
            <li>
              <strong>Email:</strong>
              <span>{email}</span>
            </li>
            <li>
              <strong>{t('landing.footer.workingTime', 'Giờ làm việc')}:</strong>
              <span>{workingTime}</span>
            </li>
          </ul>
          <button
            type="button"
            className="btn-support-v2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAction('support');
            }}
          >
            <PhoneCall size={14} />
            <span>{t('landing.footer.contactSupport', 'Liên hệ hỗ trợ')}</span>
          </button>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom-v2">
        <div>{copyright}</div>
        <div className="footer-bottom-links-v2">
          <span onClick={() => onPolicyOpen('privacy')}>{t('landing.footer.privacy', 'Chính sách bảo mật')}</span>
          <span onClick={() => onPolicyOpen('terms')}>{t('landing.footer.terms', 'Điều khoản sử dụng')}</span>
          <span onClick={() => onPolicyOpen('data_deletion' as any)}>{currentLang === 'en' ? 'Data Deletion' : 'Xóa dữ liệu'}</span>
          <span onClick={() => onPolicyOpen('payment')}>{t('landing.footer.payment', 'Chính sách thanh toán')}</span>
          <LanguageSwitcher variant="light" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
