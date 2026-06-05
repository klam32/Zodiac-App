import React, { useState } from 'react';
import './SubPage.css';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

interface FAQPageProps {
  onBack: () => void;
  onLogin: () => void;
  onContact: () => void;
  user?: User | null;
}

const FAQPage: React.FC<FAQPageProps> = ({ onBack, onLogin, onContact, user }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="subpage-container">
      <header className="subpage-header">
        <div className="subpage-logo" onClick={onBack} style={{ cursor: 'pointer' }}>
          <span>✨</span> Zodiac Whisper
        </div>
        {user ? (
          <button className="btn btn-outline" onClick={onBack}>Hi, {user.full_name || user.username}</button>
        ) : (
          <button className="btn btn-primary" onClick={onLogin}>{isEn ? 'Login' : 'Đăng nhập'}</button>
        )}
      </header>

      <main className="subpage-content">
        <div className="subpage-card">
          <h1 className="subpage-title">{isEn ? 'Frequently Asked Questions' : 'Câu hỏi thường gặp'}</h1>
          <p className="subpage-subtitle">
            {isEn ? 'Find answers to all your questions about Astrology & the Platform' : 'Giải đáp mọi thắc mắc của bạn về Chiêm tinh & Hệ thống'}
          </p>

          <div className="faq-accordion">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-accordion-item ${openIndex === index ? 'active' : ''}`}
              >
                <div
                  className="faq-accordion-header"
                  onClick={() => toggleAccordion(index)}
                >
                  <span className="faq-q-text">{faq.q}</span>
                  <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
                </div>
                <div className="faq-accordion-body">
                  <div className="faq-accordion-content">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="faq-footer-cta">
            <h3>{isEn ? 'Still have questions?' : 'Vẫn còn thắc mắc khác?'}</h3>
            <p>{isEn ? 'Our support team is always ready to assist you 24/7.' : 'Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7.'}</p>
            <button className="btn btn-primary" onClick={onContact}>{isEn ? 'Contact Us Now ✦' : 'Liên hệ ngay ✦'}</button>
          </div>
        </div>
      </main>

      <footer className="subpage-footer">
        <div>{isEn ? '© 2026 Zodiac Whisper. All rights reserved.' : '© 2026 Zodiac Whisper. Đã đăng ký bản quyền. BETA'}</div>
        <div style={{ marginTop: '1.5rem' }}>
          <span onClick={onBack} style={{ cursor: 'pointer', color: '#6e2cf2' }}>{isEn ? 'Home' : 'Trang chủ'}</span>
          <span style={{ margin: '0 1rem', opacity: 0.3 }}>|</span>
          <span onClick={onContact} style={{ cursor: 'pointer', color: '#6e2cf2' }}>{isEn ? 'Support' : 'Hỗ trợ'}</span>
        </div>
      </footer>
    </div>
  );
};

export default FAQPage;
