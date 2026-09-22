import React, { useState } from 'react';
import './SubPage.css';
import { User } from '../types';
import { useTranslation } from 'react-i18next';
import { HelpCircle, BookOpen, MessageSquare, Mail, Phone, ExternalLink } from 'lucide-react';

interface SupportPageProps {
  onBack: () => void;
  onLogin: () => void;
  user?: User | null;
  siteConfig?: any;
}

const SupportPage: React.FC<SupportPageProps> = ({ onBack, onLogin, user, siteConfig }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [activeTab, setActiveTab] = useState<'faq' | 'guide' | 'contact'>('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const getVal = (key: string, defaultVal: string) => {
    if (!siteConfig) return defaultVal;
    const currentLang = isEn ? 'en' : 'vi';
    const localizedKey = `${key}_${currentLang}`;
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const siteTitle = getVal('site_title', 'Zodiac Whisper');
  const replaceBrand = (text: string) => {
    return text.replace(/Zodiac Whisper/g, siteTitle);
  };

  const faqs = isEn ? [
    {
      q: 'How do I generate a birth chart?',
      a: 'To generate a birth chart, you need to provide your birth date, time, and location. With this information, the system will automatically generate a detailed chart for you.'
    },
    {
      q: 'What does the Ascendant sign mean?',
      a: 'The Ascendant (Rising sign) is a vital element of your natal chart. It represents your outer personality, the first impression you make on others, and how you initiate action in life. The Ascendant also determines the house placement distribution, so the more accurate your birth time, the more precise the Ascendant calculation will be.'
    },
    {
      q: 'Can I look up birth charts for free?',
      a: 'Yes. You can generate birth charts completely free on this site. Every new account is gifted 10 free tokens upon registration. Once birth details are entered, the system calculates and displays the chart in seconds.'
    },
    {
      q: 'What can a birth chart tell me?',
      a: 'A birth chart helps you understand your personality, behavioral tendencies, strengths, challenges, and growth potential. Through planetary positions and aspects, it provides deep insights into relationships, career, and personal development.'
    },
    {
      q: 'Can I generate a birth chart if I do not know my exact birth time?',
      a: 'Yes, you can still generate a birth chart without an exact birth time. However, some factors will be less accurate, especially the Ascendant and house distribution. While planetary zodiac signs remain mostly correct, detailed analysis of specific life areas may be limited.'
    },
    {
      q: 'Why are there conflicting details in my birth chart, and how should I analyze them?',
      a: 'In a birth chart, planets, zodiac signs, and aspects represent different facets of your personality and life. Therefore, they might sometimes produce seemingly contradictory tendencies. This is not a system error, but rather reflects the natural complexity of human nature, where multiple psychological traits coexist and should be understood within the overall context of your chart.'
    },
    {
      q: 'How do I top up tokens?',
      a: 'You can top up tokens via Momo or Bank Transfer in the Top Up section. Tokens will be credited automatically within 1-3 minutes.'
    }
  ] : [
    {
      q: 'Làm thế nào để tạo bản đồ sao?',
      a: 'Để tạo bản đồ sao, bạn cần cung cấp ngày, giờ và nơi sinh. Chỉ với những thông tin này, hệ thống sẽ tự động tạo biểu đồ chi tiết cho bạn.'
    },
    {
      q: 'Xem cung Mọc có ý nghĩa gì?',
      a: 'Cung Mọc (Ascendant) là một yếu tố rất quan trọng trong lá số chiêm tinh. Nó thể hiện cách bạn xuất hiện trước thế giới, ấn tượng ban đầu bạn tạo ra với người khác, và cách bạn bắt đầu hành động trong cuộc sống. Cung Mọc cũng quyết định cách các nhà chiêm tinh được phân bố trong bản đồ sao, vì vậy giờ sinh càng chính xác thì việc xác định cung Mọc càng chính xác.'
    },
    {
      q: 'Tôi có thể tra cứu bản đồ sao miễn phí không?',
      a: 'Có. Bạn có thể tạo bản đồ sao hoàn toàn miễn phí trên trang web này. Chỉ cần đăng ký lần đầu mỗi tài khoản mới đều được nhập 10 tokens miễn phí. Nhập thông tin sinh, hệ thống sẽ tính toán và hiển thị lá số trong vài giây.'
    },
    {
      q: 'Lá số chiêm tinh có thể cho biết điều gì?',
      a: 'Lá số chiêm tinh giúp bạn hiểu rõ hơn về tính cách, xu hướng hành vi, điểm mạnh, thách thức và tiềm năng phát triển trong cuộc sống. Thông qua vị trí các hành tinh và các góc chiếu, bản đồ sao có thể cung cấp góc nhìn sâu hơn về mối quan hệ, nghề nghiệp và hành trình phát triển cá nhân.'
    },
    {
      q: 'Tôi có thể tạo bản đồ sao không khi không biết chính xác giờ sinh?',
      a: 'Bạn vẫn có thể tạo bản đồ sao nếu không biết giờ sinh. Tuy nhiên, một số yếu tố sẽ không chính xác, đặc biệt là cung Mọc và các nhà chiêm tinh. Vị trí của các hành tinh theo cung hoàng đạo vẫn gần như chính xác, nhưng việc phân tích chi tiết về các lĩnh vực cuộc sống có thể bị hạn chế.'
    },
    {
      q: 'Vì sao trong bản đồ sao có nhiều thông tin mâu thuẫn nhau, và tôi nên phân tích chúng như thế nào?',
      a: 'Trong bản đồ sao, các yếu tố như hành tinh, cung hoàng đạo và các góc chiếu thường thể hiện những xu hướng khác nhau trong tính cách và cuộc sống. Vì vậy đôi khi chúng có thể tạo ra những biểu hiện tưởng như mâu thuẫn. Điều này không phải là lỗi của hệ thống, mà phản ánh sự phức tạp tự nhiên của con người, nơi nhiều xu hướng tâm lý cùng tồn tại và cần được hiểu trong bối cảnh tổng thể của lá số.'
    },
    {
      q: 'Làm sao để nạp Token?',
      a: 'Bạn có thể nạp Token qua Momo hoặc Chuyển khoản ngân hàng trong phần Nạp Token. Token sẽ được cộng tự động sau 1-3 phút.'
    }
  ];

  const steps = isEn ? [
    {
      title: 'Register & Get Free Tokens',
      description: replaceBrand('Simply register a new account and receive 10 free tokens immediately to experience all Zodiac Whisper AI features.')
    },
    {
      title: 'Choose Astrology Feature',
      description: 'On the main dashboard, choose your feature of interest: birth chart generation, love compatibility check, dream interpretation, or daily forecasts.'
    },
    {
      title: 'Enter Personal Details',
      description: 'Provide your precise birth date, time, and location. This is the crucial data used by AI to compute planetary coordinates at the exact moment of your birth.'
    },
    {
      title: 'Receive Insights from AI Expert',
      description: 'The system analyzes astronomical positions to deliver highly detailed, easy-to-understand, and hyper-personalized interpretations.'
    },
    {
      title: 'Save & Share',
      description: 'All reports are automatically saved under History. You can review them anytime or download a PDF to share with friends.'
    }
  ] : [
    {
      title: 'Đăng ký & Nhận Token miễn phí',
      description: replaceBrand('Chỉ cần đăng ký tài khoản mới, bạn sẽ nhận ngay 10 Token miễn phí để trải nghiệm toàn bộ tính năng của hệ thống Zodiac Whisper AI.')
    },
    {
      title: 'Chọn tính năng Chiêm tinh',
      description: 'Tại giao diện chính, hãy chọn tính năng bạn quan tâm: Lập bản đồ sao cá nhân, Xem độ hòa hợp tình duyên, Giải mã giấc mơ hoặc Dự báo hằng ngày.'
    },
    {
      title: 'Nhập thông tin cá nhân',
      description: 'Cung cấp ngày, giờ và địa điểm sinh chính xác nhất có thể. Đây là cơ sở dữ liệu quan trọng để AI tính toán vị trí các hành tinh tại thời điểm bạn chào đời.'
    },
    {
      title: 'Nhận lời tư vấn từ AI Chuyên gia',
      description: 'Hệ thống sẽ phân tích hàng ngàn dữ liệu thiên văn và gửi đến bạn lời giải mã chi tiết, dễ hiểu và mang tính cá nhân hóa cực cao.'
    },
    {
      title: 'Lưu trữ & Chia sẻ',
      description: 'Tất cả các bản phân tích sẽ được lưu trong mục Lịch sử. Bạn có thể xem lại bất cứ lúc nào hoặc tải về để chia sẻ với bạn bè.'
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="subpage-container dark-theme">
      <header className="subpage-header dark">
        <div className="subpage-logo" onClick={onBack} style={{ cursor: 'pointer' }}>
          <span>✨</span> {siteTitle}
        </div>
        {user ? (
          <button className="btn btn-outline" onClick={onBack}>Hi, {user.full_name || user.username}</button>
        ) : (
          <button className="btn btn-primary" onClick={onLogin}>{isEn ? 'Login' : 'Đăng nhập'}</button>
        )}
      </header>

      <main className="subpage-content">
        <div className="subpage-card faq-card-v2">
          <h1 className="subpage-title">{isEn ? 'Support Center' : 'Trung Tâm Hỗ Trợ'}</h1>
          <p className="subpage-subtitle">
            {isEn 
              ? 'Find answers, read user guides, or contact our support team.' 
              : 'Giải đáp thắc mắc, hướng dẫn sử dụng và liên hệ với đội ngũ hỗ trợ.'}
          </p>

          {/* Dynamic Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '3rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '1rem'
          }}>
            <button 
              onClick={() => setActiveTab('faq')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeTab === 'faq' ? 'linear-gradient(135deg, #6d5dfc, #a855f7)' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'faq' ? '0 4px 15px rgba(109, 93, 252, 0.4)' : 'none'
              }}
            >
              <HelpCircle size={18} />
              {isEn ? 'FAQ' : 'Câu hỏi thường gặp'}
            </button>
            <button 
              onClick={() => setActiveTab('guide')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeTab === 'guide' ? 'linear-gradient(135deg, #6d5dfc, #a855f7)' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'guide' ? '0 4px 15px rgba(109, 93, 252, 0.4)' : 'none'
              }}
            >
              <BookOpen size={18} />
              {isEn ? 'User Guide' : 'Hướng dẫn sử dụng'}
            </button>
            <button 
              onClick={() => setActiveTab('contact')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeTab === 'contact' ? 'linear-gradient(135deg, #6d5dfc, #a855f7)' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'contact' ? '0 4px 15px rgba(109, 93, 252, 0.4)' : 'none'
              }}
            >
              <MessageSquare size={18} />
              {isEn ? 'Contact Us' : 'Liên hệ'}
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content" style={{ minHeight: '300px' }}>
            {activeTab === 'faq' && (
              <div className="faq-accordion">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className={`faq-accordion-item ${openIndex === index ? 'active' : ''}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div
                      className="faq-accordion-header"
                      onClick={() => toggleAccordion(index)}
                      style={{ padding: '1.25rem 1.5rem' }}
                    >
                      <span className="faq-q-text" style={{ color: '#fff' }}>{faq.q}</span>
                      <span className="faq-icon" style={{ color: '#a78bfa' }}>{openIndex === index ? '−' : '+'}</span>
                    </div>
                    <div className="faq-accordion-body">
                      <div className="faq-accordion-content" style={{ color: '#cbd5e0', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        {faq.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'guide' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {steps.map((step, index) => (
                  <div key={index} className="guide-step">
                    <div className="step-number" style={{ background: 'linear-gradient(135deg, #6d5dfc, #a855f7)' }}>{index + 1}</div>
                    <div className="step-content">
                      <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{step.title}</h3>
                      <p style={{ color: '#cbd5e0', lineHeight: '1.6' }}>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="contact-grid" style={{ gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr' }}>
                <div className="info-box" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontWeight: '800', color: '#a78bfa' }}>
                    {isEn ? 'Direct Channels' : 'Kênh liên hệ trực tiếp'}
                  </h3>
                  
                  <div className="info-item" style={{ marginBottom: '1.5rem' }}>
                    <div className="info-label" style={{ color: '#a0aec0' }}><Mail size={14} style={{ display: 'inline', marginRight: '5px' }} /> Email</div>
                    <div className="info-value" style={{ color: '#fff' }}>nguyenkhoalamgh2003@gmail.com</div>
                  </div>

                  <div className="info-item" style={{ marginBottom: '1.5rem' }}>
                    <div className="info-label" style={{ color: '#a0aec0' }}><Phone size={14} style={{ display: 'inline', marginRight: '5px' }} /> Hotline / Zalo</div>
                    <div className="info-value" style={{ color: '#fff' }}>0946 413 212 / 0916 416 409</div>
                  </div>

                  <div className="info-item" style={{ marginBottom: '1.5rem' }}>
                    <div className="info-label" style={{ color: '#a0aec0' }}>Facebook</div>
                    <div className="info-value">
                      <a 
                        href="https://www.facebook.com/share/1Nmf3mz9Qv/?mibextid=wwXIfr" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#a78bfa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {isEn ? 'Join community' : 'Tham gia cộng đồng'} <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="message-box" style={{ background: 'rgba(109, 93, 252, 0.05)', border: '1px solid rgba(109, 93, 252, 0.2)' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#fff' }}>{isEn ? 'How can we help?' : 'Chúng tôi có thể giúp gì?'}</h3>
                  <p style={{ color: '#cbd5e0', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    {isEn 
                      ? 'Need assistance with your birth chart calculations, token purchases, or experiencing technical bugs? Please connect with us through the channels on the left. Zalo is typically the fastest response channel.' 
                      : 'Bạn cần hỗ trợ về cách lập bản đồ sao, lỗi giao dịch nạp token, hoặc gặp sự cố kỹ thuật? Hãy kết nối với chúng tôi qua các kênh bên trái. Liên hệ qua Zalo thường nhận được phản hồi nhanh nhất.'}
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                    <p style={{ color: '#ecc94b', fontSize: '0.9rem', margin: 0 }}>
                      💡 <strong>{isEn ? 'Tip:' : 'Mẹo:'}</strong> {isEn 
                        ? 'When reaching out via Zalo, please include your account email and a screenshot of the issue for speedier support.' 
                        : 'Khi nhắn tin hỗ trợ qua Zalo, vui lòng gửi kèm email tài khoản và ảnh chụp màn hình lỗi để được hỗ trợ nhanh nhất.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="subpage-footer dark">
        <div>{isEn ? replaceBrand('© 2026 Zodiac Whisper. All rights reserved.') : replaceBrand('© 2026 Zodiac Whisper. Hệ thống AI Chiêm tinh Chuyên nghiệp.')}</div>
        <div style={{ marginTop: '1.5rem' }}>
          <span onClick={onBack} style={{ cursor: 'pointer', color: '#a78bfa', fontWeight: 'bold' }}>{isEn ? 'Home' : 'Trang chủ'}</span>
        </div>
      </footer>
    </div>
  );
};

export default SupportPage;
