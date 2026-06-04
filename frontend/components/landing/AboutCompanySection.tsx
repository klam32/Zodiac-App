import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Calendar } from 'lucide-react';

interface AboutCompanySectionProps {
  siteConfig: any;
  currentLang: string;
}

const AboutCompanySection: React.FC<AboutCompanySectionProps> = ({ siteConfig, currentLang }) => {
  const { t } = useTranslation();

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const aboutLabel = getVal('about_label', t('landing.about.label', 'VỀ CHÚNG TÔI'));
  const aboutTitle = getVal('about_title', t('landing.about.title', 'Zodiac Whisper, hệ thống chuyên gia chiêm tinh AI thấu hiểu vận mệnh'));
  const companyName = getVal('company_name', getVal('about_company_name', t('landing.about.companyName', 'CÔNG TY TNHH MỘT THÀNH VIÊN CÔNG NGHỆ KỸ THUẬT TIÊN PHONG')));
  const companyDesc = getVal('company_description', getVal('about_content', t('landing.about.companyDesc', 'Chuyên cung cấp giải pháp công nghệ kỹ thuật cao và xuất nhập khẩu các mặt hàng công nghệ tiên tiến.')));
  
  const companyAddress = getVal('company_address', getVal('about_address', t('landing.about.address', 'P16, Đường số 8, KDC lô 49, Khu đô thị Nam Cần Thơ, Phường Cái Răng, TP. Cần Thơ')));
  const companyHotline = siteConfig.company_hotline || siteConfig.about_hotline || '0916 416 409';
  const companyActiveDate = getVal('company_active_date', getVal('about_working_time', t('landing.about.activeDate', '05/04/2017')));

  return (
    <section className="about-company-section reveal active">
      <div className="about-glow-effect"></div>
      <div className="about-stars-layer"></div>
      
      <div className="about-container">
        <div className="about-badge-wrapper">
          <span className="about-badge">✦ {aboutLabel}</span>
        </div>

        <h2 className="about-section-title">
          {aboutTitle}
        </h2>

        <h3 className="about-company-name">
          {companyName}
        </h3>

        <p className="about-company-desc">
          {companyDesc}
        </p>

        <div className="company-meta-v2">
          <div className="meta-item-v2">
            <MapPin size={18} className="meta-icon-v2" />
            <span><strong>{t('landing.about.labelAddress', 'Địa chỉ')}:</strong> {companyAddress}</span>
          </div>
          <div className="meta-item-v2">
            <Phone size={18} className="meta-icon-v2" />
            <span><strong>{t('landing.about.labelHotline', 'Hotline')}:</strong> {companyHotline}</span>
          </div>
          <div className="meta-item-v2">
            <Calendar size={18} className="meta-icon-v2" />
            <span><strong>{t('landing.about.labelActiveDate', 'Ngày hoạt động')}:</strong> {companyActiveDate}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutCompanySection;
