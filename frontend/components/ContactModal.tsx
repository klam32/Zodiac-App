
import React from 'react';
import Modal from './Modal';
import './Modal.css';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thông Tin Liên Hệ">
      <div className="contact-modal-v2">
        <div className="contact-grid-v2">
          {/* Left Column: Info */}
          <div className="contact-info-card-v2">
            <h4>Thông tin liên hệ</h4>
            
            <div className="contact-item-v2">
              <label>EMAIL</label>
              <div className="value">nguyenkhoalamgh2003@gmail.com</div>
            </div>

            <div className="contact-item-v2">
              <label>HOTLINE / ZALO</label>
              <div className="value">0946 413 212</div>
            </div>

            <div className="contact-item-v2">
              <label>FACEBOOK</label>
              <div className="value">
                <a 
                  href="https://www.facebook.com/share/1Nmf3mz9Qv/?mibextid=wwXIfr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="fb-link"
                >
                  Tham gia cộng đồng
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Message */}
          <div className="contact-message-card-v2">
            <h4>Gửi lời nhắn</h4>
            <p>
              Cần hỗ trợ hoặc hợp tác? Hãy liên hệ với chúng tôi qua các kênh trên.
            </p>
            
            <div className="tip-box-v2">
              <div className="tip-icon">💡</div>
              <p>
                <strong>Mẹo:</strong> Khi liên hệ Zalo, hãy gửi kèm nội dung cần hỗ trợ để được phản hồi nhanh nhất.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button className="modal-footer-btn" onClick={onClose}>
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ContactModal;
