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
            <li><span onClick={() => onAction('guide')}>{t('landing.footer.guide', 'Hướng dẫn sử dụng')}</span></li>
            <li><span onClick={() => onAction('faq')}>{t('landing.footer.faq', 'Câu hỏi thường gặp')}</span></li>
            <li><span onClick={() => onPolicyOpen('privacy')}>{t('landing.footer.privacy', 'Chính sách bảo mật')}</span></li>
            <li><span onClick={() => onPolicyOpen('terms')}>{t('landing.footer.terms', 'Điều khoản sử dụng')}</span></li>
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
              onAction('contact');
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
          <span onClick={() => onPolicyOpen('payment')}>{t('landing.footer.payment', 'Chính sách thanh toán')}</span>
          <LanguageSwitcher variant="light" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
