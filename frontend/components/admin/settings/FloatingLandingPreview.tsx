import React from 'react';
import { Maximize2, Minimize2, EyeOff, ExternalLink, Move, RefreshCw, Eye } from 'lucide-react';
import LandingPreview from './LandingPreview';
import { useDraggablePreview } from './useDraggablePreview';

interface FloatingLandingPreviewProps {
  settings: any;
  activeSection: string;
  isDirty: boolean;
  visible: boolean;
  collapsed: boolean;
  previewLanguage: 'vi' | 'en';
  onLanguageChange: (lang: 'vi' | 'en') => void;
  onToggleVisible: (visible: boolean) => void;
  onToggleCollapsed: (collapsed: boolean) => void;
  onExpand: () => void;
}

const FloatingLandingPreview: React.FC<FloatingLandingPreviewProps> = ({
  settings,
  activeSection,
  isDirty,
  visible,
  collapsed,
  previewLanguage,
  onLanguageChange,
  onToggleVisible,
  onToggleCollapsed,
  onExpand
}) => {
  const { position, widgetRef, headerRef, resetPosition, isDragging } = useDraggablePreview({ x: 0, y: 0 });

  if (!visible) {
    return (
      <button
        type="button"
        className="preview-hidden-trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleVisible(true);
        }}
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 1000,
          background: 'linear-gradient(135deg, #6d5dfc 0%, #5b4cf4 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 20px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 10px 25px rgba(109, 93, 252, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fade-in 0.3s ease',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <Eye size={16} />
        <span>Xem trước</span>
      </button>
    );
  }

  const transformStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
  };

  return (
    <div
      ref={widgetRef}
      className={`preview-floating-container ${collapsed ? 'collapsed' : ''}`}
      style={transformStyle}
    >
      <style>{`
        .preview-floating-container {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 360px;
          height: 520px;
          z-index: 1000;
          border-radius: 20px;
          overflow: hidden;
          background: #080812;
          border: 1px solid rgba(139, 92, 246, 0.35);
          box-shadow: 0 20px 60px rgba(0,0,0,0.55);
          display: flex;
          flex-direction: column;
          color: #fff;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        .preview-floating-container.collapsed {
          height: 48px;
          width: 280px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
          background: #0d0d1e;
        }

        .preview-floating-header {
          height: 48px;
          background: #111122;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          user-select: none;
        }

        .preview-floating-container.collapsed .preview-floating-header {
          border-bottom: none;
          height: 100%;
        }

        .preview-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 13px;
          color: #c084fc;
          flex: 1;
          min-width: 0;
        }

        .drag-handle-icon {
          color: rgba(255, 255, 255, 0.35);
          cursor: grab;
          flex-shrink: 0;
        }

        .drag-handle-icon:active {
          cursor: grabbing;
        }

        .preview-header-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dirty-dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 8px #ef4444;
          flex-shrink: 0;
        }

        .preview-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .lang-toggle-container {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 2px;
        }

        .lang-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .lang-btn.active {
          background: rgba(139, 92, 246, 0.25);
          color: #fff;
        }

        .action-icon-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-icon-btn:hover {
          background: rgba(139, 92, 246, 0.2);
          color: #fff;
          border-color: rgba(139, 92, 246, 0.4);
        }

        .preview-floating-body {
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .preview-floating-body .landing-preview-container {
          height: 100%;
          border-radius: 0;
          border: none;
          box-shadow: none;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Header bar (Click/touch to drag) */}
      <div
        ref={headerRef}
        className="preview-floating-header"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="preview-header-left">
          <Move size={12} className="drag-handle-icon" />
          <span className="preview-header-title">
            {collapsed ? '👁 Xem trước Landing Page' : '✨ Xem trước'}
          </span>
          {isDirty && <span className="dirty-dot" title="Thay đổi chưa lưu" />}
        </div>
        <div className="preview-header-actions">
          {/* Language Switch */}
          {!collapsed && (
            <div className="lang-toggle-container">
              <button
                type="button"
                className={`lang-btn ${previewLanguage === 'vi' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLanguageChange('vi');
                }}
                title="Tiếng Việt"
              >
                VI
              </button>
              <button
                type="button"
                className={`lang-btn ${previewLanguage === 'en' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLanguageChange('en');
                }}
                title="English"
              >
                EN
              </button>
            </div>
          )}

          {/* Reset position button (Only when dragged from 0,0) */}
          {(position.x !== 0 || position.y !== 0) && !collapsed && (
            <button
              type="button"
              className="action-icon-btn"
              title="Đặt lại vị trí mặc định"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                resetPosition();
              }}
            >
              <RefreshCw size={11} />
            </button>
          )}

          {/* Open in new tab button */}
          {!collapsed && (
            <button
              type="button"
              className="action-icon-btn"
              title="Mở landing page ở tab mới (Trang thật chỉ cập nhật sau khi lưu)"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open("/", "_blank", "noopener,noreferrer");
              }}
            >
              <ExternalLink size={12} />
            </button>
          )}

          {/* Maximize to full modal */}
          {!collapsed && (
            <button
              type="button"
              className="action-icon-btn"
              title="Phóng to"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onExpand();
              }}
            >
              <Maximize2 size={12} />
            </button>
          )}

          {/* Toggle collapsed/expanded state */}
          <button
            type="button"
            className="action-icon-btn"
            title={collapsed ? "Mở rộng" : "Thu gọn"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCollapsed(!collapsed);
            }}
          >
            {collapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>

          {/* Hide preview button */}
          <button
            type="button"
            className="action-icon-btn"
            title="Ẩn xem trước"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleVisible(false);
            }}
          >
            <EyeOff size={12} />
          </button>
        </div>
      </div>

      {/* Preview Content (Only visible when expanded) */}
      {!collapsed && (
        <div className="preview-floating-body">
          <LandingPreview
            settings={settings}
            activeSection={activeSection}
            isDirty={isDirty}
            previewLanguage={previewLanguage}
            onLanguageChange={onLanguageChange}
            hideControlBar={true}
          />
        </div>
      )}
    </div>
  );
};

export default FloatingLandingPreview;
