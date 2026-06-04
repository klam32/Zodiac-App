import React from 'react';
import { useTranslation } from 'react-i18next';
import UserAvatar from '../common/UserAvatar';

interface UserDetailModalProps {
  userDetail: any;
  onClose: () => void;
  onEditUser: (userId: number, field: 'full_name' | 'password', currentVal?: string) => void;
  onViewChatDetail: (log: any) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ userDetail, onClose, onEditUser, onViewChatDetail }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal xl">
        <div className="admin-modal-header" style={{ background: '#4f46e5', color: 'white', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <UserAvatar 
              user={userDetail.user} 
              size="sm" 
              shape="square" 
              style={{ width: 44, height: 44, borderRadius: 12, fontSize: 18, border: 'none', background: 'rgba(255,255,255,0.2)' }} 
            />
            <div>
              <div className="admin-modal-title" style={{ color: 'white' }}>{userDetail.user.username}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{userDetail.user.email}</div>
            </div>
          </div>
          <button className="admin-modal-close" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }} onClick={onClose}>✕</button>
        </div>

        <div className="admin-modal-body">
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{t('admin.currentBalance', 'Số dư hiện tại')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#6d5dfc' }}>{userDetail.user.token_balance?.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>Tokens</span></div>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{t('admin.joinDate', 'Ngày tham gia')}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{(() => {
                if (!userDetail.user.created_at) return '—';
                const d = new Date(userDetail.user.created_at);
                return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'vi-VN');
              })()}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{t('admin.fullName')}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{userDetail.user.full_name || t('admin.notUpdated', 'Chưa cập nhật')}</span>
                <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => onEditUser(userDetail.user.id, 'full_name', userDetail.user.full_name)}>{t('common.edit')}</button>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => onEditUser(userDetail.user.id, 'password')}>{t('profile.changePassword')}</button>
          </div>

          {/* Token History + Chat Logs side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 4, height: 14, background: '#6d5dfc', borderRadius: 4 }} /> {t('admin.tokenFluctuations', 'Biến động token')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {userDetail.token_history.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{t('admin.noTransactions', 'Chưa có giao dịch')}</div>
                ) : userDetail.token_history.slice(0, 10).map((h: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #f1f5f9', fontSize: 12 }}>
                    <div><div style={{ fontWeight: 600, color: '#334155' }}>{h.description}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{(() => {
                      if (!h.created_at) return '—';
                      const d = new Date(h.created_at);
                      return isNaN(d.getTime()) ? '—' : (currentLang === 'en' ? d.toLocaleString('en-US') : d.toLocaleString('vi-VN'));
                    })()}</div></div>
                    <span style={{ fontWeight: 700, color: h.type === 'in' ? '#16a34a' : '#6d5dfc' }}>{h.type === 'in' ? '+' : '-'}{h.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 4, height: 14, background: '#0f172a', borderRadius: 4 }} /> {t('admin.chatLogs')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {userDetail.chat_logs.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{t('admin.noLogs', 'Chưa có chat')}</div>
                ) : userDetail.chat_logs.slice(0, 10).map((log: any, i: number) => (
                  <div key={i} onClick={() => onViewChatDetail(log)} style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.15s', fontSize: 12 }}>
                    <div style={{ fontWeight: 500, color: '#334155', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{log.question}"</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
                      <span>{(() => {
                        if (!log.created_at) return '—';
                        const d = new Date(log.created_at);
                        return isNaN(d.getTime()) ? '—' : (currentLang === 'en' ? d.toLocaleDateString('en-US') : d.toLocaleDateString('vi-VN'));
                      })()}</span>
                      <span style={{ color: '#6d5dfc', fontWeight: 600 }}>{t('admin.viewLink', 'Xem →')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-outline" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
