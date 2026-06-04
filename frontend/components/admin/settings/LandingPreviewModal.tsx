import React from 'react';
import LandingPreview from './LandingPreview';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LandingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  activeSection?: string;
  isDirty?: boolean;
}

const LandingPreviewModal: React.FC<LandingPreviewModalProps> = ({
  isOpen,
  onClose,
  settings,
  activeSection,
  isDirty = false
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="preview-modal-overlay">
      <style>{`
        .preview-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(4, 4, 6, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fade-in 0.2s ease;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .preview-modal-card {
          width: 100%;
          max-width: 1000px;
          height: 90vh;
          background: #0f0f15;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .preview-modal-header {
          padding: 16px 24px;
          background: #151520;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .preview-modal-title {
          font-size: 16px;
          font-weight: 700;
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .preview-modal-close {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-modal-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.4);
        }

        .preview-modal-content {
          flex: 1;
          background: #06060a;
          overflow: hidden;
          padding: 24px;
        }

        /* Adjustments for LandingPreview inside modal to look like actual desktop */
        .preview-modal-content .landing-preview-container {
          border: none;
          box-shadow: none;
          height: 100%;
        }
      `}</style>,StartLine:106,TargetContent:

      <div className="preview-modal-card">
        <div className="preview-modal-header">
          <div className="preview-modal-title">
            <span>{t('admin.settings.expandedPreview', '✨ Chế độ xem trước mở rộng (Realtime)')}</span>
            {isDirty && (
              <span style={{
                background: '#e11d48',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                marginLeft: '12px'
              }}>
                {t('admin.settings.unsavedChangesShort', 'Có thay đổi chưa lưu')}
              </span>
            )}
          </div>
          <button
            type="button"
            className="preview-modal-close"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="preview-modal-content">
          <LandingPreview
            settings={settings}
            activeSection={activeSection}
            isDirty={isDirty}
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPreviewModal;
