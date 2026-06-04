import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface ContactSectionProps {
  siteConfig: any;
  currentLang: string;
}

const ContactSection: React.FC<ContactSectionProps> = ({ siteConfig, currentLang }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t('landing.contact.error_fill', 'Vui lòng điền đầy đủ thông tin.'));
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      toast.success(t('landing.contact.success_send', 'Lời nhắn của bạn đã được gửi thành công!'));
      setFormData({ name: '', email: '', message: '' });
      setIsSubmitting(false);
    }, 1200);
  };

  const companyName = getVal('about_company_name', 'Zodiac Whisper AI');
  const address = getVal('about_address', '123 Đường Vũ Trụ, Phường Chiêm Tinh, Quận 1, TP. Hồ Chí Minh');
  const hotline = siteConfig.about_hotline || '0946 413 212';
  const email = siteConfig.company_email || 'nguyenkhoalamgh2003@gmail.com';
  const workingTime = getVal('about_working_time', '8:00 - 18:00, Thứ 2 - Chủ Nhật');

  return (
    <section id="contact-section-embedded" className="contact-section-embedded reveal active">
      <div className="section-container">
        <div className="section-header">
          <div className="badge">✦ {t('landing.contact.label', 'KẾT NỐI VỚI VŨ TRỤ')}</div>
          <h2>{getVal('contact_title', t('landing.contact.title', 'Liên hệ với chúng tôi'))}</h2>
          <p className="section-subtitle">
            {t('landing.contact.subtitle', 'Đội ngũ hỗ trợ của Zodiac Whisper luôn sẵn sàng lắng nghe và đồng hành cùng bạn.')}
          </p>
        </div>

        <div className="contact-embedded-grid">
          {/* Left Column: Info Card */}
          <div className="contact-info-card">
            <h3>{companyName}</h3>
            <p className="contact-info-intro">
              {t('landing.contact.intro_desc', 'Hãy liên hệ qua các cổng thông tin chính thức của chúng tôi hoặc gửi trực tiếp lời nhắn bên cạnh để nhận giải đáp.')}
            </p>

            <div className="contact-info-list">
              <div className="contact-info-item">
                <div className="info-icon-circle">
                  <MapPin size={18} />
                </div>
                <div className="info-item-text">
                  <h4>{t('common.address', 'Địa chỉ')}</h4>
                  <p>{address}</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="info-icon-circle">
                  <Phone size={18} />
                </div>
                <div className="info-item-text">
                  <h4>{t('common.hotline', 'Hotline / Zalo')}</h4>
                  <p className="hotline-highlight">{hotline}</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="info-icon-circle">
                  <Mail size={18} />
                </div>
                <div className="info-item-text">
                  <h4>Email</h4>
                  <p>{email}</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="info-icon-circle">
                  <Clock size={18} />
                </div>
                <div className="info-item-text">
                  <h4>{t('common.workingTime', 'Thời gian hoạt động')}</h4>
                  <p>{workingTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Message Box */}
          <div className="contact-message-card">
            <h3>{t('landing.contact.message_title', 'Gửi lời nhắn')}</h3>
            <form onSubmit={handleSubmit} className="contact-embedded-form">
              <div className="form-group-embedded">
                <label htmlFor="contact-name">{t('landing.contact.field_name', 'Họ tên')}</label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t('landing.contact.placeholder_name', 'Nhập họ tên của bạn...')}
                  required
                />
              </div>

              <div className="form-group-embedded">
                <label htmlFor="contact-email">Email</label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t('landing.contact.placeholder_email', 'Nhập địa chỉ email...')}
                  required
                />
              </div>

              <div className="form-group-embedded">
                <label htmlFor="contact-message">{t('landing.contact.field_message', 'Lời nhắn')}</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder={t('landing.contact.placeholder_message', 'Bạn cần hỗ trợ gì từ Zodiac Whisper...')}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-send-message"
              >
                {isSubmitting ? (
                  <span>{t('landing.contact.sending', 'Đang gửi...')}</span>
                ) : (
                  <>
                    <span>{t('landing.contact.btn_send', 'Gửi ngay')}</span>
                    <Send size={16} style={{ marginLeft: 8 }} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
