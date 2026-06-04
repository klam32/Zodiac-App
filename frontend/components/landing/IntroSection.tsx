import React from 'react';
import { Compass, Cpu, Share2, Globe, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IntroSectionProps {
  siteConfig: any;
  currentLang: string;
}

const IntroSection: React.FC<IntroSectionProps> = ({ siteConfig, currentLang }) => {
  const { t } = useTranslation();

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const highlights = [
    {
      icon: <Compass className="highlight-icon" size={20} />,
      title: t('landing.intro.highlight1.title', 'Cá nhân hóa theo ngày giờ sinh'),
      desc: t('landing.intro.highlight1.desc', 'Phân tích chính xác dựa trên tọa độ thiên thể tại thời điểm bạn chào đời.')
    },
    {
      icon: <Cpu className="highlight-icon" size={20} />,
      title: t('landing.intro.highlight2.title', 'Trả lời bằng AI chuyên sâu'),
      desc: t('landing.intro.highlight2.desc', 'Hệ thống tác tử AI thông minh luận giải tức thì các khía cạnh cuộc sống.')
    },
    {
      icon: <Share2 className="highlight-icon" size={20} />,
      title: t('landing.intro.highlight3.title', 'Kết hợp RAG & GraphRAG'),
      desc: t('landing.intro.highlight3.desc', 'Truy xuất tri thức từ kho tài liệu chiêm tinh cổ học kết hợp đồ thị tri thức.')
    },
    {
      icon: <Globe className="highlight-icon" size={20} />,
      title: t('landing.intro.highlight4.title', 'Hỗ trợ song ngữ Anh - Việt'),
      desc: t('landing.intro.highlight4.desc', 'Trải nghiệm mượt mà, chuyển đổi ngôn ngữ dễ dàng giữa Tiếng Việt và Tiếng Anh.')
    },
    {
      icon: <Heart className="highlight-icon" size={20} />,
      title: t('landing.intro.highlight5.title', 'Giao diện dễ sử dụng'),
      desc: t('landing.intro.highlight5.desc', 'Thiết kế trực quan, sinh động, mang đến trải nghiệm chiêm tinh hiện đại nhất.')
    }
  ];

  return (
    <section id="intro-platform" className="intro-section reveal active">
      <div className="intro-container">
        {/* Left Column */}
        <div className="intro-content-left">
          <div className="badge">✦ {getVal('intro_label', t('landing.intro.label', 'GIỚI THIỆU NỀN TẢNG'))}</div>
          <h2>{getVal('intro_title', t('landing.intro.title', 'Nền tảng Chiêm tinh AI hàng đầu'))}</h2>
          <p className="intro-paragraph">
            {getVal(
              'intro_content',
              t(
                'landing.intro.content',
                'Zodiac Whisper là hệ thống đột phá kết hợp giữa chiêm tinh học cổ đại và trí tuệ nhân tạo hiện đại. Chúng tôi giúp bạn khám phá chiều sâu bản ngã thông qua bản đồ sao cá nhân, tìm câu trả lời cho tình duyên, sự nghiệp, sức khỏe, định hướng lịch cát tường và dự báo vận trình ngày một cách nhanh chóng và chính xác nhất.'
              )
            )}
          </p>
        </div>

        {/* Right Column */}
        <div className="intro-content-right">
          <div className="highlights-card">
            <div className="highlights-card-header">
              <span className="window-dot red"></span>
              <span className="window-dot yellow"></span>
              <span className="window-dot green"></span>
              <span className="card-title">Zodiac Whisper AI Engine</span>
            </div>
            <div className="highlights-list">
              {highlights.map((item, idx) => (
                <div key={idx} className="highlight-item">
                  <div className="highlight-icon-wrapper">
                    {item.icon}
                  </div>
                  <div className="highlight-text">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
