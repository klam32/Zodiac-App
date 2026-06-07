import React, { useState } from 'react';
import Modal from './Modal';
import './Modal.css';
import { useTranslation } from 'react-i18next';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'faq' | 'guide' | 'privacy';
  siteConfig?: any;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, type, siteConfig }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

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
      q: 'How do I create a birth chart?',
      a: 'To create a birth chart, you need to provide your exact date, time, and place of birth. With just this information, the system will automatically generate a detailed chart for you.'
    },
    {
      q: 'What is the significance of the Ascendant?',
      a: 'The Ascendant (Rising sign) is a crucial factor in your astrology chart. It represents how you present yourself to the world, the first impression you make on others, and how you initiate action in life.'
    },
    {
      q: 'Can I look up my birth chart for free?',
      a: 'Yes. You can create your birth chart completely free of charge on this website. Each new account is gifted 10 free tokens upon registration. Simply enter your birth details, and the system will compute and display your chart in seconds.'
    },
    {
      q: 'What can an astrology chart tell me?',
      a: 'An astrology chart helps you better understand your personality, behavioral tendencies, strengths, challenges, and growth potential in life based on planetary positions.'
    },
    {
      q: 'Can I create a birth chart if I do not know my exact birth time?',
      a: 'You can still generate a birth chart without an exact birth time. However, some elements will be imprecise, particularly the Ascendant and house placements. Planetary positions by zodiac signs remain highly accurate, but detailed analysis of life areas may be limited.'
    },
    {
      q: 'Why does my birth chart contain seemingly contradictory information, and how should I analyze it?',
      a: 'In a birth chart, elements like planets, zodiac signs, and aspects represent different facets of your personality and life. Therefore, they can sometimes appear contradictory. This is not a system error, but rather reflects the natural complexity of human nature, where multiple psychological patterns coexist.'
    }
  ] : [
    {
      q: 'Làm thế nào để tạo bản đồ sao?',
      a: 'Để tạo bản đồ sao, bạn cần cung cấp ngày, giờ và nơi sinh. Chỉ với những thông tin này, hệ thống sẽ tự động tạo biểu đồ chi tiết cho bạn.'
    },
    {
      q: 'Xem cung Mọc có ý nghĩa gì?',
      a: 'Cung Mọc (Ascendant) là một yếu tố rất quan trọng trong lá số chiêm tinh. Nó thể hiện cách bạn xuất hiện trước thế giới, ấn tượng ban đầu bạn tạo ra với người khác, và cách bạn bắt đầu hành động trong cuộc sống.'
    },
    {
      q: 'Tôi có thể tra cứu bản đồ sao miễn phí không?',
      a: 'Có. Bạn có thể tạo bản đồ sao hoàn toàn miễn phí trên trang web này. Chỉ cần đăng ký lần đầu mỗi tài khoản mới đều được nhập 10 tokens miễn phí. Nhập thông tin sinh, hệ thống sẽ tính toán và hiển thị lá số trong vài giây.'
    },
    {
      q: 'Lá số chiêm tinh có thể cho biết điều gì?',
      a: 'Lá số chiêm tinh giúp bạn hiểu rõ hơn về tính cách, xu hướng hành vi, điểm mạnh, thách thức và tiềm năng phát triển trong cuộc sống qua vị trí các hành tinh.'
    },
    {
      q: 'Tôi có thể tạo bản đồ sao không khi không biết chính xác giờ sinh?',
      a: 'Bạn vẫn có thể tạo bản đồ sao nếu không biết giờ sinh. Tuy nhiên, một số yếu tố sẽ không chính xác, đặc biệt là cung Mọc và các nhà chiêm tinh. Vị trí của các hành tinh theo cung hoàng đạo vẫn gần như chính xác, nhưng việc phân tích chi tiết về các lĩnh vực cuộc sống có thể bị hạn chế.'
    },
    {
      q: 'Vì sao trong bản đồ sao có nhiều thông tin mâu thuẫn nhau, và tôi nên phân tích chúng như thế nào?',
      a: 'Trong bản đồ sao, các yếu tố như hành tinh, cung hoàng đạo và các góc chiếu thường thể hiện những xu hướng khác nhau trong tính cách và cuộc sống. Vì vậy đôi khi chúng có thể tạo ra những biểu hiện tưởng như mâu thuẫn. Điều này không phải là lỗi của hệ thống, mà phản ánh sự phức tạp tự nhiên của con người, nơi nhiều xu hướng tâm lý cùng tồn tại và cần được hiểu trong bối cảnh tổng thể của lá số.'
    }
  ];

  const renderContent = () => {
    switch (type) {
      case 'privacy':
        return (
          <div className="info-modal-content">
            <h1 className="modal-h3" style={{ fontSize: '1.5rem', textAlign: 'center' }}>
              {isEn ? 'Privacy Policy' : 'Chính Sách Bảo Mật'}
            </h1>
            <div className="terms-scroll-area" style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.6', marginBottom: '20px' }}>
                {isEn 
                  ? replaceBrand('Welcome to Zodiac Whisper. We are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.')
                  : replaceBrand('Chào mừng bạn đến với Zodiac Whisper. Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chính Sách Bảo Mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.')}
              </p>

              <div className="modal-terms-section">
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '1. Information We Collect' : '1. Thông Tin Chúng Tôi Thu Thập'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn ? (
                    <>
                      <strong>Personal Information:</strong> Name (to personalize experience) and Astrological details (Date, time, and place of birth to generate readings).
                      <br /><strong>Technical Information:</strong> IP address, browser type, cookies to enhance user experience.
                    </>
                  ) : (
                    <>
                      <strong>Thông Tin Cá Nhân:</strong> Tên (để cá nhân hóa trải nghiệm) và Chi tiết chiêm tinh (Ngày sinh, giờ sinh, nơi sinh để tạo bài đọc).
                      <br /><strong>Thông Tin Kỹ Thuật:</strong> Địa chỉ IP, loại trình duyệt, cookie để cải thiện trải nghiệm.
                    </>
                  )}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '2. How We Use Your Information' : '2. Cách Chúng Tôi Sử Dụng Thông Tin'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? 'To provide personalized astrology readings, improve website functionality, and send newsletters (if you opt-in).'
                    : 'Cung cấp các bài đọc chiêm tinh cá nhân hóa, cải thiện chức năng trang web và gửi bản tin (nếu bạn đồng ý).'}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '3. Sharing of Information' : '3. Chia Sẻ Thông Tin'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? 'We do not sell or trade your data. Data is only shared with hosting providers or when required by law.'
                    : 'Chúng tôi không bán hay trao đổi dữ liệu của bạn. Dữ liệu chỉ được chia sẻ với nhà cung cấp dịch vụ lưu trữ hoặc khi có yêu cầu pháp lý.'}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '4. Your Rights' : '4. Quyền Của Bạn'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? 'You have the right to access, edit, request deletion of, or object to the processing of your personal data.'
                    : 'Bạn có quyền truy cập, chỉnh sửa, yêu cầu xóa hoặc phản đối việc xử lý dữ liệu cá nhân của mình.'}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '5. Security' : '5. Bảo Mật'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? 'We implement standard security measures to protect your data as safely as possible.'
                    : 'Chúng tôi triển khai các biện pháp bảo mật tiêu chuẩn để bảo vệ dữ liệu của bạn an toàn nhất có thể.'}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '6. Contact' : '6. Liên Hệ'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Email: nguyenkhoalamgh2003@gmail.com
                </p>
              </div>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="info-modal-content">
            <h1 className="modal-h3" style={{ fontSize: '1.5rem', textAlign: 'center' }}>
              {isEn ? 'Terms of Service' : 'Điều Khoản Sử Dụng'}
            </h1>
            <div className="terms-scroll-area" style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              <div className="modal-terms-section">
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '1. Acceptance of Terms' : '1. Chấp Nhận Điều Khoản'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? replaceBrand('By using Zodiac Whisper, you agree to these Terms of Service and our Privacy Policy.')
                    : replaceBrand('Bằng cách sử dụng Zodiac Whisper, bạn đồng ý với các Điều Khoản Sử Dụng và Chính Sách Bảo Mật của chúng tôi.')}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '2. Changes to Terms' : '2. Thay Đổi Điều Khoản'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? 'We reserve the right to update these terms at any time without prior notice.'
                    : 'Chúng tôi có quyền cập nhật các điều khoản này bất kỳ lúc nào mà không cần thông báo trước.'}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '3. Use of the Site' : '3. Sử Dụng Trang Web'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? 'For personal, non-commercial use only. Do not copy content without permission.'
                    : 'Sử dụng cho mục đích cá nhân, phi thương mại. Không sao chép nội dung khi chưa được phép.'}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '4. Content Disclaimer' : '4. Miễn Trừ Trách Nhiệm'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? 'All content is for informational and entertainment purposes only, not replacing professional advice.'
                    : 'Nội dung chỉ mang tính chất tham khảo và giải trí, không thay thế lời khuyên chuyên môn.'}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '5. Intellectual Property' : '5. Quyền Sở Hữu Trí Tuệ'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? replaceBrand('All text, images, and algorithms are the intellectual property of Zodiac Whisper.')
                    : replaceBrand('Mọi văn bản, hình ảnh, thuật toán đều là tài sản trí tuệ của Zodiac Whisper.')}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '6. Limitation of Liability' : '6. Giới Hạn Trách Nhiệm'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  {isEn 
                    ? 'We are not liable for any damages arising from your use or inability to use the service.'
                    : 'Chúng tôi không chịu trách nhiệm về các thiệt hại phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.'}
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>
                  {isEn ? '7. Contact' : '7. Liên Hệ'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Email: nguyenkhoalamgh2003@gmail.com
                </p>
              </div>
            </div>
          </div>
        );
      case 'faq':
        return (
          <div className="info-modal-content">
            <h1 className="modal-h3" style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '30px' }}>
              {isEn ? 'Frequently Asked Questions' : 'Câu hỏi thường gặp'}
            </h1>
            <div className="modal-faq-accordion">
              {faqs.map((faq, index) => (
                <div key={index} className={`modal-faq-item ${openIndex === index ? 'active' : ''}`}>
                  <div className="modal-faq-header" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                    <span>{faq.q}</span>
                    <span className="faq-toggle-icon">{openIndex === index ? '−' : '+'}</span>
                  </div>
                  {openIndex === index && (
                    <div className="modal-faq-body">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'guide':
        return (
          <div className="info-modal-content">
            <h1 className="modal-h3" style={{ fontSize: '1.5rem', textAlign: 'center' }}>
              {isEn ? 'User Guide' : 'Hướng dẫn sử dụng'}
            </h1>
            <div className="guide-steps" style={{ marginTop: '20px' }}>
              {(isEn ? [
                { s: "Step 1", d: "Register an account and receive 10 free tokens." },
                { s: "Step 2", d: "Enter your exact birth date and time to generate your birth chart." },
                { s: "Step 3", d: "Ask the AI Chatbot about any aspect you are curious about." }
              ] : [
                { s: "Bước 1", d: "Đăng ký tài khoản và nhận 10 token miễn phí." },
                { s: "Bước 2", d: "Nhập thông tin ngày giờ sinh chính xác để lập bản đồ sao." },
                { s: "Bước 3", d: "Đặt câu hỏi cho Chatbot AI về bất kỳ khía cạnh nào bạn quan tâm." }
              ]).map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ background: '#6e2cf2', color: 'white', minWidth: '70px', height: '30px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', padding: '0 10px' }}>
                    {step.s}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#4a5568', paddingTop: '4px' }}>{step.d}</div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'terms': return isEn ? 'Terms of Service' : 'Điều Khoản Sử Dụng';
      case 'privacy': return isEn ? 'Privacy Policy' : 'Chính Sách Bảo Mật';
      case 'faq': return isEn ? 'Frequently Asked Questions' : 'Câu Hỏi Thường Gặp';
      case 'guide': return isEn ? 'User Guide' : 'Hướng Dẫn Sử Dụng';
      default: return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="info-modal-wrapper">
        {renderContent()}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button className="modal-footer-btn" onClick={onClose}>
            {isEn ? 'Got it & Close' : 'Đã hiểu & Đóng'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InfoModal;
