import React, { useState } from 'react';
import { Sparkles, Calendar, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ServiceChoiceSectionProps {
  siteConfig: any;
  currentLang: string;
  onAction: (view: string) => void;
}

const ServiceChoiceSection: React.FC<ServiceChoiceSectionProps> = ({ siteConfig, currentLang, onAction }) => {
  const { t } = useTranslation();
  const [selectedFeature, setSelectedFeature] = useState<'chat' | 'calendar' | 'prediction'>('chat');

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  return (
    <section className="report-selection reveal active">
      <div className="section-container">
        <div className="report-card-v3">
          <div className="report-header-v3">
            <h3>{getVal('choice_window_title', 'Zodiac Whisper')}</h3>
            <div className="window-controls">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
          </div>

          <div className="report-body-v3">
            <p className="question">{getVal('choice_title', t('landing.choice.title', 'Bạn muốn xem điều gì hôm nay?'))}</p>
            <p className="sub-question">{getVal('choice_subtitle', t('landing.choice.subtitle', 'Chọn dịch vụ mong muốn để kết nối trực tiếp với các vì tinh tú.'))}</p>

            <div className="report-options-grid">
              <div
                className={`report-option ${selectedFeature === 'chat' ? 'active' : ''}`}
                onClick={() => setSelectedFeature('chat')}
              >
                <div className="option-icon">✨</div>
                <div className="option-content">
                  <h4>{getVal('choice_option_1_title', t('landing.choice.astrology', 'Luận Giải Bản Đồ Sao'))}</h4>
                  <p>{getVal('choice_option_1_description', t('landing.choice.astrologyDesc', 'Phân tích tổng quan cung Hoàng đạo và các hành tinh.'))}</p>
                </div>
                <div className="radio-circle"></div>
              </div>

              <div
                className={`report-option ${selectedFeature === 'calendar' ? 'active' : ''}`}
                onClick={() => setSelectedFeature('calendar')}
              >
                <div className="option-icon">📅</div>
                <div className="option-content">
                  <h4>{getVal('choice_option_2_title', t('landing.choice.calendar', 'Lịch Cát Tường'))}</h4>
                  <p>{getVal('choice_option_2_description', t('landing.choice.calendarDesc', 'Tra cứu ngày lành tháng tốt, tránh hung tìm cát.'))}</p>
                </div>
                <div className="radio-circle"></div>
              </div>

              <div
                className={`report-option ${selectedFeature === 'prediction' ? 'active' : ''}`}
                onClick={() => setSelectedFeature('prediction')}
              >
                <div className="option-icon">☀️</div>
                <div className="option-content">
                  <h4>{getVal('choice_option_3_title', t('landing.choice.daily', 'Vận Trình Ngày'))}</h4>
                  <p>{getVal('choice_option_3_description', t('landing.choice.dailyDesc', 'Xem dự báo thời tiết năng lượng cá nhân hằng ngày.'))}</p>
                </div>
                <div className="radio-circle"></div>
              </div>
            </div>
          </div>

          <div className="report-footer-v3">
            <button
              type="button"
              className="btn-next"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAction(selectedFeature);
              }}
            >
              {getVal('choice_button_text', t('landing.choice.continue', 'Tiếp tục ngay'))} ✦
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceChoiceSection;
