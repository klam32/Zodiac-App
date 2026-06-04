import React from 'react';
import { User, Heart, Briefcase, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BenefitsSectionProps {
  siteConfig: any;
  currentLang: string;
}

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ siteConfig, currentLang }) => {
  const { t } = useTranslation();

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const benefits = [
    {
      icon: <User className="benefit-card-icon" size={32} />,
      title: t('landing.benefits.self.title', 'Hiểu rõ bản thân'),
      desc: t('landing.benefits.self.desc', 'Khám phá tiềm năng ẩn giấu, tính cách cốt lõi và con đường phát triển linh hồn qua bản đồ sao chi tiết.')
    },
    {
      icon: <Heart className="benefit-card-icon" size={32} />,
      title: t('landing.benefits.love.title', 'Định hướng tình duyên'),
      desc: t('landing.benefits.love.desc', 'Phân tích mức độ tương hợp giữa hai người (Synastry), giúp kết nối thấu hiểu và nuôi dưỡng tình yêu lâu bền.')
    },
    {
      icon: <Briefcase className="benefit-card-icon" size={32} />,
      title: t('landing.benefits.career.title', 'Khám phá sự nghiệp'),
      desc: t('landing.benefits.career.desc', 'Xác định lĩnh vực thế mạnh, thiên hướng phát triển tài chính và thời điểm đột phá trên chặng đường công danh.')
    },
    {
      icon: <Calendar className="benefit-card-icon" size={32} />,
      title: t('landing.benefits.daily.title', 'Theo dõi vận trình mỗi ngày'),
      desc: t('landing.benefits.daily.desc', 'Nhận dự báo thời tiết năng lượng cá nhân hóa theo từng ngày, tối ưu hóa các quyết định quan trọng.')
    }
  ];

  return (
    <section id="benefits" className="benefits-section reveal active">
      <div className="section-container">
        <div className="section-header">
          <div className="badge">✦ {t('landing.benefits.label', 'LỢI ÍCH VƯỢT TRỘI')}</div>
          <h2>{getVal('benefits_title', t('landing.benefits.title', 'Vì sao nên chọn Zodiac Whisper?'))}</h2>
          <p className="section-subtitle">
            {t('landing.benefits.subtitle', 'Chúng tôi đồng hành cùng bạn trên hành trình khám phá những bí ẩn tinh tú và làm chủ cuộc sống.')}
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="benefit-card">
              <div className="benefit-icon-wrapper">
                {benefit.icon}
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.desc}</p>
              <div className="benefit-glow"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
