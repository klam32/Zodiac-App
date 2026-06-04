import React from 'react';
import { useTranslation } from 'react-i18next';

interface ChatLogDetailModalProps {
  chat: any;
  onClose: () => void;
}

const ChatLogDetailModal: React.FC<ChatLogDetailModalProps> = ({ chat, onClose }) => {
  const { t } = useTranslation();
  const renderContent = () => {
    if (chat.answer && chat.answer.trim() !== "") return chat.answer;
    if (chat.chart && chat.chart.trim() !== "") return chat.chart;
    return t('common.noData');
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal xl">
        <div className="admin-modal-header" style={{ background: '#1e1b4b', color: 'white', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(109,93,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✨</div>
            <div>
              <div className="admin-modal-title" style={{ color: 'white' }}>{t('admin.chatDetail')}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>ID: #{chat.id} • {chat.username} ({chat.email})</div>
            </div>
          </div>
          <button className="admin-modal-close" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }} onClick={onClose}>✕</button>
        </div>

        <div className="admin-modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="admin-input-label">{t('admin.userRequest')}</div>
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', fontStyle: 'italic' }}>"{chat.question}"</div>
              </div>
              <div>
                <div className="admin-input-label">{t('admin.detailedInterpretation')}</div>
                <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: 14, borderRadius: 8, fontSize: 13, color: '#475569', maxHeight: 400, overflowY: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {renderContent()}
                </div>
              </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {chat.chart_svg ? (
                <div>
                  <div className="admin-input-label">{t('admin.birthChart')}</div>
                  <div style={{ background: '#0f172a', padding: 16, borderRadius: 10, display: 'flex', justifyContent: 'center' }}>
                    <div className="admin-chart-svg-preview" dangerouslySetInnerHTML={{ __html: chat.chart_svg }} style={{ width: '100%', maxWidth: 340 }} />
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0', borderRadius: 10, padding: 40 }}>
                  <span style={{ color: '#cbd5e1', fontSize: 13 }}>{t('admin.noBirthChart')}</span>
                </div>
              )}

              {chat.partner_chart_svg && (
                <div>
                  <div className="admin-input-label" style={{ color: '#db2777' }}>{t('admin.partnerChart')}</div>
                  <div style={{ background: '#fdf2f8', padding: 16, borderRadius: 10, display: 'flex', justifyContent: 'center' }}>
                    <div dangerouslySetInnerHTML={{ __html: chat.partner_chart_svg }} style={{ width: '100%', maxWidth: 340 }} />
                  </div>
                </div>
              )}

              {chat.chart_summary && (
                <div style={{ background: '#ede9fe', padding: 14, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 8 }}>{t('admin.planetSummary')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: '#334155' }}>
                    <div><strong>{t('astrology.sun', 'Mặt Trời')}:</strong> {chat.chart_summary.sun}</div>
                    <div><strong>{t('astrology.moon', 'Mặt Trăng')}:</strong> {chat.chart_summary.moon}</div>
                    <div style={{ gridColumn: 'span 2' }}><strong>{t('astrology.ascendant', 'Cung Mọc')}:</strong> {chat.chart_summary.ascendant}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginTop: 20, borderTop: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{t('admin.tokensUsed')}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#6d5dfc' }}>{chat.tokens_charged}</div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{t('admin.recordedAt')} {new Date(chat.created_at).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLogDetailModal;