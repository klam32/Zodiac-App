import React from 'react';
import { UserPlus, Calendar, Compass, MessageSquare, ListTodo } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HowItWorksSectionProps {
  siteConfig: any;
  currentLang: string;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ siteConfig, currentLang }) => {
  const { t } = useTranslation();

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const steps = [
    {
      icon: <UserPlus size={24} />,
      title: t('landing.steps.step1.title', 'Bước 1: Đăng ký tài khoản'),
      desc: t('landing.steps.step1.desc', 'Tạo tài khoản nhanh chóng chỉ bằng email hoặc liên kết Google để lưu trữ thông tin.')
    },
    {
      icon: <ListTodo size={24} />,
      title: t('landing.steps.step2.title', 'Bước 2: Nhập thông tin ngày giờ sinh'),
      desc: t('landing.steps.step2.desc', 'Cung cấp ngày, giờ và địa điểm sinh chính xác để tính toán chính xác bản đồ sao cá nhân.')
    },
    {
      icon: <Compass size={24} />,
      title: t('landing.steps.step3.title', 'Bước 3: Tạo bản đồ sao cá nhân'),
      desc: t('landing.steps.step3.desc', 'Hệ thống tự động dựng lập bản đồ sao hoàng đạo trực quan cùng các góc hợp thiên thể.')
    },
    {
      icon: <MessageSquare size={24} />,
      title: t('landing.steps.step4.title', 'Bước 4: Đặt câu hỏi với AI'),
      desc: t('landing.steps.step4.desc', 'Trò chuyện trực tiếp với tác tử AI để luận giải chi tiết lá số, tình cảm, sự nghiệp.')
    },
    {
      icon: <Calendar size={24} />,
      title: t('landing.steps.step5.title', 'Bước 5: Theo dõi vận trình và lịch cát tường'),
      desc: t('landing.steps.step5.desc', 'Cập nhật dự báo hằng ngày và tra cứu ngày tốt lành để đưa ra kế hoạch hành động tối ưu.')
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works-section reveal active">
      <div className="section-container">
        <div className="section-header">
          <div className="badge">✦ {t('landing.steps.label', 'QUY TRÌNH ĐƠN GIẢN')}</div>
          <h2>{getVal('steps_title', t('landing.steps.title', 'Bắt đầu chỉ với vài bước'))}</h2>
          <p className="section-subtitle">
            {t('landing.steps.subtitle', 'Trải nghiệm chiêm tinh AI đỉnh cao chỉ với quy trình đơn giản và nhanh gọn.')}
          </p>
        </div>

        <div className="steps-timeline">
          {steps.map((step, idx) => (
            <div key={idx} className="step-card-v2">
              <div className="step-badge-number">{idx + 1}</div>
              <div className="step-icon-outer">
                <div className="step-icon-inner">
                  {step.icon}
                </div>
              </div>
              <div className="step-content-text">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {idx < steps.length - 1 && <div className="step-connector-line"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
