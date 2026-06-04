import React from 'react';
import Modal from './Modal';
import './Modal.css';
import { useTranslation } from 'react-i18next';
import { Hash, User, MapPin, Phone, Mail, Calendar, Sparkles } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteConfig?: Record<string, any>;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, siteConfig = {} }) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language && i18n.language.startsWith('en')) ? 'en' : 'vi';

  const getVal = (key: string, defaultValue: string = '', defaultValueEn: string = '') => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultValueEn || siteConfig[key] || defaultValue;
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultValue;
  };

  const companyName = getVal('company_name', 'CÔNG TY TNHH MỘT THÀNH VIÊN CÔNG NGHỆ KỸ THUẬT TIÊN PHONG', 'PIONEER ENGINEERING TECHNOLOGY ONE MEMBER COMPANY LIMITED');
  const companyDesc = getVal('company_description', 'Chuyên cung cấp giải pháp công nghệ kỹ thuật cao và xuất nhập khẩu các mặt hàng công nghệ tiên tiến.', 'Specializing in high-tech solutions and importing/exporting advanced technology products.');
  const taxCode = getVal('company_tax_code', '1801526082');
  const representative = getVal('company_representative', 'NGÔ HỒ ANH KHÔI');
  const address = getVal('company_address', 'P16, Đường số 8, KDC lô 49, Khu đô thị Nam Cần Thơ, Phường Cái Răng, TP. Cần Thơ', 'P16, Street 8, Block 49, Nam Can Tho Urban Area, Cai Rang Ward, Can Tho City');
  const hotline = getVal('company_hotline', '0916 416 409');
  const email = getVal('company_email', 'info@tienphongtech.com');
  const activeDate = getVal('company_active_date', '05/04/2017', 'April 5, 2017');

  const infoItems = [
    {
      key: 'taxCode',
      icon: <Hash className="info-icon-svg" size={18} />,
      label: t('landing.aboutModal.taxCode', 'Mã số thuế'),
      value: taxCode,
    },
    {
      key: 'representative',
      icon: <User className="info-icon-svg" size={18} />,
      label: t('landing.aboutModal.representative', 'Người đại diện'),
      value: representative,
    },
    {
      key: 'address',
      icon: <MapPin className="info-icon-svg" size={18} />,
      label: t('landing.aboutModal.address', 'Địa chỉ'),
      value: address,
    },
    {
      key: 'hotline',
      icon: <Phone className="info-icon-svg" size={18} />,
      label: t('landing.aboutModal.hotline', 'Hotline'),
      value: hotline,
    },
    {
      key: 'email',
      icon: <Mail className="info-icon-svg" size={18} />,
      label: t('landing.aboutModal.email', 'Email'),
      value: email,
    },
    {
      key: 'activeDate',
      icon: <Calendar className="info-icon-svg" size={18} />,
      label: t('landing.aboutModal.activeDate', 'Ngày hoạt động'),
      value: activeDate,
    },
  ].filter(item => item.value && item.value.trim() !== '');

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="" 
      showCloseButton={false}
      className="about-us-dark-modal"
    >
      <div className="about-modal-dark-content">
        {/* Header */}
        <div className="about-modal-dark-header">
          <div className="about-modal-title-wrapper">
            <Sparkles className="about-sparkle-icon" size={20} />
            <h2>{t('landing.aboutModal.title', 'Về Chúng Tôi')}</h2>
          </div>
          <button className="about-modal-close-button" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="about-modal-dark-body">
          <div className="about-modal-intro-section">
            <h3 className="about-company-name-title">{companyName}</h3>
            <p className="about-company-desc-text">{companyDesc}</p>
          </div>

          <div className="about-modal-grid">
            {infoItems.map((item) => (
              <div key={item.key} className="about-info-grid-card">
                <div className="about-grid-card-icon-box">
                  {item.icon}
                </div>
                <div className="about-grid-card-details">
                  <span className="about-grid-card-label">{item.label}</span>
                  <span className="about-grid-card-value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="about-modal-dark-footer">
          <button className="about-modal-primary-btn" onClick={onClose}>
            {t('common.gotItClose', 'Đã hiểu & Đóng')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;
