import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import UserAvatar from '../common/UserAvatar';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface AdminTopbarProps {
  onToggleSidebar: () => void;
  pageTitle: string;
  adminName?: string;
  onBackToSite: () => void;
  user?: User | null;
}

const AdminTopbar: React.FC<AdminTopbarProps> = ({ onToggleSidebar, pageTitle, adminName, onBackToSite, user }) => {
  const { t } = useTranslation();
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button className="admin-topbar-toggle" onClick={onToggleSidebar} title={t('admin.collapseSidebar', 'Thu gọn sidebar')}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="admin-topbar-title">{pageTitle}</h1>
      </div>
      <div className="admin-topbar-right">
        <LanguageSwitcher variant="compact" />
        <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={onBackToSite} title={t('common.back')}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.back')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <UserAvatar user={user} size="sm" className="admin-user-avatar" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user?.full_name || user?.username || adminName || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
