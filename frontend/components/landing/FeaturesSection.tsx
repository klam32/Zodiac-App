import React from 'react';
import { Sparkles, Compass, Heart, Activity, Calendar, Flame, MessageSquare, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeaturesSectionProps {
  siteConfig: any;
  currentLang: string;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ siteConfig, currentLang }) => {
  const { t } = useTranslation();

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const features = [
    {
      icon: <Compass className="feature-card-icon" size={28} />,
      title: t('landing.features.chart.title', 'Giải mã bản đồ sao cá nhân'),
      desc: t('landing.features.chart.desc', 'Tạo và phân tích chi tiết bản đồ sao hoàng đạo dựa trên thông tin chính xác ngày giờ sinh.')
    },
    {
      icon: <Heart className="feature-card-icon" size={28} />,
      title: t('landing.features.compatibility.title', 'Tư vấn tình duyên & tương hợp'),
      desc: t('landing.features.compatibility.desc', 'So sánh đối chiếu lá số cặp đôi để khám phá mức độ hòa hợp và giải quyết mâu thuẫn.')
    },
    {
      icon: <Sparkles className="feature-card-icon" size={28} />,
      title: t('landing.features.career.title', 'Định hướng sự nghiệp'),
      desc: t('landing.features.career.desc', 'Xem phân tích nhà 10, nhà 2 và nhà 6 để tìm ra định hướng nghề nghiệp và tài lộc.')
    },
    {
      icon: <Activity className="feature-card-icon" size={28} />,
      title: t('landing.features.health.title', 'Phân tích sức khỏe & năng lượng'),
      desc: t('landing.features.health.desc', 'Theo dõi sự dịch chuyển của các hành tinh ảnh hưởng trực tiếp đến thể chất và tinh thần.')
    },
    {
      icon: <Calendar className="feature-card-icon" size={28} />,
      title: t('landing.features.calendar.title', 'Lịch cát tường'),
      desc: t('landing.features.calendar.desc', 'Lựa chọn các ngày lành tháng tốt cho các hoạt động lớn như ký hợp đồng, cưới hỏi, xuất hành.')
    },
    {
      icon: <Flame className="feature-card-icon" size={28} />,
      title: t('landing.features.daily.title', 'Vận trình ngày'),
      desc: t('landing.features.daily.desc', 'Nhận dự báo năng lượng chi tiết từng ngày cùng lời khuyên hành động thông thái.')
    },
    {
      icon: <MessageSquare className="feature-card-icon" size={28} />,
      title: t('landing.features.chatbot.title', 'Chatbot AI hỏi đáp chiêm tinh'),
      desc: t('landing.features.chatbot.desc', 'Trò chuyện thời gian thực với trợ lý AI chiêm tinh am hiểu sâu rộng kiến thức huyền học.')
    },
    {
      icon: <Volume2 className="feature-card-icon" size={28} />,
      title: t('landing.features.voice.title', 'Voice Out đọc luận giải'),
      desc: t('landing.features.voice.desc', 'Nghe trợ lý ảo đọc to các bản luận giải chi tiết bằng công nghệ chuyển văn bản thành giọng nói.')
    }
  ];

  return (
    <section id="features-detail" className="features-detail-section reveal active">
      <div className="section-container">
        <div className="section-header">
          <div className="badge">✦ {t('landing.features.label', 'TÍNH NĂNG VƯỢT TRỘI')}</div>
          <h2>{getVal('features_title', t('landing.features.title', 'Tính năng nổi bật'))}</h2>
          <p className="section-subtitle">
            {t('landing.features.subtitle', 'Trải nghiệm trọn bộ công cụ chiêm tinh tích hợp trí tuệ nhân tạo chuyên sâu.')}
          </p>
        </div>

        <div className="features-detail-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-detail-card">
              <div className="feature-detail-icon-wrapper">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <div className="card-border-glow"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
