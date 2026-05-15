import React, { useState } from 'react';
import Modal from './Modal';
import './Modal.css';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'faq' | 'guide' | 'privacy';
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, type }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
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
            <h1 className="modal-h3" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Chính Sách Bảo Mật</h1>
            <div className="terms-scroll-area" style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.6', marginBottom: '20px' }}>
                Chào mừng bạn đến với <strong>Zodiac Whisper</strong>. Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chính Sách Bảo Mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.
              </p>

              <div className="modal-terms-section">
                <h4 style={{ color: '#6e2cf2' }}>1. Thông Tin Chúng Tôi Thu Thập</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  <strong>Thông Tin Cá Nhân:</strong> Tên (để cá nhân hóa trải nghiệm) và Chi tiết chiêm tinh (Ngày sinh, giờ sinh, nơi sinh để tạo bài đọc).
                  <br /><strong>Thông Tin Kỹ Thuật:</strong> Địa chỉ IP, loại trình duyệt, cookie để cải thiện trải nghiệm.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>2. Cách Chúng Tôi Sử Dụng Thông Tin</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Cung cấp các bài đọc chiêm tinh cá nhân hóa, cải thiện chức năng trang web và gửi bản tin (nếu bạn đồng ý).
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>3. Chia Sẻ Thông Tin</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Chúng tôi không bán hay trao đổi dữ liệu của bạn. Dữ liệu chỉ được chia sẻ với nhà cung cấp dịch vụ lưu trữ hoặc khi có yêu cầu pháp lý.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>4. Quyền Của Bạn</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Bạn có quyền truy cập, chỉnh sửa, yêu cầu xóa hoặc phản đối việc xử lý dữ liệu cá nhân của mình.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>5. Bảo Mật</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Chúng tôi triển khai các biện pháp bảo mật tiêu chuẩn để bảo vệ dữ liệu của bạn an toàn nhất có thể.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>6. Liên Hệ</h4>
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
            <h1 className="modal-h3" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Điều Khoản Sử Dụng</h1>
            <div className="terms-scroll-area" style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              <div className="modal-terms-section">
                <h4 style={{ color: '#6e2cf2' }}>1. Chấp Nhận Điều Khoản</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Bằng cách sử dụng Zodiac Whisper, bạn đồng ý với các Điều Khoản Sử Dụng và Chính Sách Bảo Mật của chúng tôi.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>2. Thay Đổi Điều Khoản</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Chúng tôi có quyền cập nhật các điều khoản này bất kỳ lúc nào mà không cần thông báo trước.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>3. Sử Dụng Trang Web</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Sử dụng cho mục đích cá nhân, phi thương mại. Không sao chép nội dung khi chưa được phép.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>4. Miễn Trừ Trách Nhiệm</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Nội dung chỉ mang tính chất tham khảo và giải trí, không thay thế lời khuyên chuyên môn.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>5. Quyền Sở Hữu Trí Tuệ</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Mọi văn bản, hình ảnh, thuật toán đều là tài sản trí tuệ của Zodiac Whisper.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>6. Giới Hạn Trách Nhiệm</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Chúng tôi không chịu trách nhiệm về các thiệt hại phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
                </p>
              </div>

              <div className="modal-terms-section" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6e2cf2' }}>7. Liên Hệ</h4>
                <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.5' }}>
                  Email hỗ trợ: nguyenkhoalamgh2003@gmail.com
                </p>
              </div>
            </div>
          </div>
        );
      case 'faq':
        return (
          <div className="info-modal-content">
            <h1 className="modal-h3" style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '30px' }}>Câu hỏi thường gặp</h1>
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
            <h1 className="modal-h3" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Hướng dẫn sử dụng</h1>
            <div className="guide-steps" style={{ marginTop: '20px' }}>
              {[
                { s: "Bước 1", d: "Đăng ký tài khoản và nhận 10 token miễn phí." },
                { s: "Bước 2", d: "Nhập thông tin ngày giờ sinh chính xác để lập bản đồ sao." },
                { s: "Bước 3", d: "Đặt câu hỏi cho Chatbot AI về bất kỳ khía cạnh nào bạn quan tâm." }
              ].map((step, i) => (
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
      case 'terms': return 'Điều Khoản Sử Dụng';
      case 'privacy': return 'Chính Sách Bảo Mật';
      case 'faq': return 'Câu Hỏi Thường Gặp';
      case 'guide': return 'Hướng Dẫn Sử Dụng';
      default: return '';
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="info-modal-wrapper">
        {renderContent()}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button className="modal-footer-btn" onClick={onClose}>
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InfoModal;
