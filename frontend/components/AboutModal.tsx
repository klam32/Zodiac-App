
import React from 'react';
import Modal from './Modal';
import './Modal.css';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Về Chúng Tôi">
      <div className="modal-content-centered about-modal-v2">
        <div className="modal-icon-wrapper" style={{ background: '#6e2cf2' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>

        <h3 className="modal-h3" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          CÔNG TY TNHH MỘT THÀNH VIÊN<br />CÔNG NGHỆ KỸ THUẬT TIÊN PHONG
        </h3>

        <p className="modal-subtitle" style={{ fontSize: '1.1rem', color: '#4a5568', marginBottom: '2.5rem' }}>
          Chuyên cung cấp giải pháp công nghệ kỹ thuật cao và xuất nhập khẩu các mặt hàng công nghệ tiên tiến.
        </p>

        <div className="info-card-list">
          <div className="info-card">
            <div className="info-card-icon">🏷️</div>
            <div className="info-card-content">
              <div className="info-card-label">Mã số thuế</div>
              <div className="info-card-value">1801526082</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-icon">👤</div>
            <div className="info-card-content">
              <div className="info-card-label">Người đại diện</div>
              <div className="info-card-value">NGÔ HỒ ANH KHÔI</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-icon">📍</div>
            <div className="info-card-content">
              <div className="info-card-label">Địa chỉ</div>
              <div className="info-card-value" style={{ fontSize: '0.9rem' }}>
                P16, Đường số 8, KDC lô 49, Khu đô thị Nam Cần Thơ, Phường Cái Răng, TP. Cần Thơ
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-icon">📞</div>
            <div className="info-card-content">
              <div className="info-card-label">Số điện thoại</div>
              <div className="info-card-value">0916 416 409</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-icon">📅</div>
            <div className="info-card-content">
              <div className="info-card-label">Ngày hoạt động</div>
              <div className="info-card-value">05/04/2017</div>
            </div>
          </div>
        </div>

        <button className="modal-footer-btn" onClick={onClose} style={{ background: '#6e2cf2' }}>
          Đã hiểu & Đóng
        </button>
      </div>
    </Modal>
  );
};

export default AboutModal;
