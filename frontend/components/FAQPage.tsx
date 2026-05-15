import React, { useState } from 'react';
import './SubPage.css';
import { User } from '../types';

interface FAQPageProps {
  onBack: () => void;
  onLogin: () => void;
  onContact: () => void;
  user?: User | null;
}

const FAQPage: React.FC<FAQPageProps> = ({ onBack, onLogin, onContact, user }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
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
          <button className="btn btn-primary" onClick={onLogin}>Đăng nhập</button>
        )}
      </header>

      <main className="subpage-content">
        <div className="subpage-card">
          <h1 className="subpage-title">Câu hỏi thường gặp</h1>
          <p className="subpage-subtitle">Giải đáp mọi thắc mắc của bạn về Chiêm tinh & Hệ thống</p>

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
            <h3>Vẫn còn thắc mắc khác?</h3>
            <p>Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7.</p>
            <button className="btn btn-primary" onClick={onContact}>Liên hệ ngay ✦</button>
          </div>
        </div>
      </main>

      <footer className="subpage-footer">
        <div>© 2026 Zodiac Whisper. Professional Astrology AI System.</div>
        <div style={{ marginTop: '1.5rem' }}>
          <span onClick={onBack} style={{ cursor: 'pointer', color: '#6e2cf2' }}>Trang chủ</span>
          <span style={{ margin: '0 1rem', opacity: 0.3 }}>|</span>
          <span onClick={onContact} style={{ cursor: 'pointer', color: '#6e2cf2' }}>Hỗ trợ</span>
        </div>
      </footer>
    </div>
  );
};

export default FAQPage;
