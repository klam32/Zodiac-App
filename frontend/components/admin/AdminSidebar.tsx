import React from 'react';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../../api';
import { User } from '../../types';
import UserAvatar from '../common/UserAvatar';

export type AdminPage = 'dashboard' | 'users' | 'packages' | 'history' | 'payments' | 'invoices' | 'chatlogs' | 'settings' | 'logins' | 'reports' | 'blog' | 'support';

interface AdminSidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  collapsed: boolean;
  onToggle: () => void;
  adminName?: string;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  logoUrl?: string;
  siteTitle?: string;
  user?: User | null;
}

const getIcon = (name: string) => {
  const icons: Record<string, React.ReactNode> = {
    dashboard: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
    users: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
    package: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
    history: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    invoice: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>,
    chat: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
    settings: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    login: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>,
    report: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
    blog: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>,
    logout: <svg className="admin-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
  };
  return icons[name] || icons.dashboard;
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activePage, onNavigate, collapsed, onToggle, adminName, onLogout, isMobileOpen, onCloseMobile, logoUrl, siteTitle, user
}) => {
  const { t } = useTranslation();
  const groups = [
    t('admin.groupOverview', 'TỔNG QUAN'),
    t('admin.groupManage', 'QUẢN LÝ'),
    t('admin.groupSystem', 'HỆ THỐNG'),
    t('admin.groupContent', 'NỘI DUNG')
  ];

  const menuItems: { id: AdminPage; label: string; icon: string; group: string }[] = [
    { id: 'dashboard', label: t('admin.dashboard', 'Dashboard'), icon: 'dashboard', group: t('admin.groupOverview', 'TỔNG QUAN') },
    { id: 'users', label: t('admin.users', 'Người dùng'), icon: 'users', group: t('admin.groupManage', 'QUẢN LÝ') },
    { id: 'packages', label: t('admin.packages', 'Gói nạp'), icon: 'package', group: t('admin.groupManage', 'QUẢN LÝ') },
    { id: 'history', label: t('admin.payments', 'Lịch sử tiền'), icon: 'history', group: t('admin.groupManage', 'QUẢN LÝ') },
    { id: 'payments', label: t('admin.invoices', 'Hóa đơn'), icon: 'invoice', group: t('admin.groupManage', 'QUẢN LÝ') },
    { id: 'support', label: t('admin.liveSupport', 'Hỗ trợ trực tuyến'), icon: 'chat', group: t('admin.groupManage', 'QUẢN LÝ') },
    { id: 'chatlogs', label: t('admin.chatLogs', 'Nhật ký chat'), icon: 'chat', group: t('admin.groupSystem', 'HỆ THỐNG') },
    { id: 'settings', label: t('admin.settingsMenu', 'Cấu hình'), icon: 'settings', group: t('admin.groupSystem', 'HỆ THỐNG') },
    { id: 'logins', label: t('admin.loginLogs', 'Đăng nhập'), icon: 'login', group: t('admin.groupSystem', 'HỆ THỐNG') },
    { id: 'reports', label: t('admin.reports', 'Báo cáo TT'), icon: 'report', group: t('admin.groupSystem', 'HỆ THỐNG') },
    { id: 'blog', label: t('admin.blogs', 'Quản lý Blog'), icon: 'blog', group: t('admin.groupContent', 'NỘI DUNG') },
  ];

  return (
    <>
      {isMobileOpen && <div className="admin-mobile-overlay" onClick={onCloseMobile} />}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        {collapsed ? (
          <div className="admin-sidebar-brand" style={{ justifyContent: 'center', padding: '18px 0', cursor: 'pointer' }} onClick={onToggle} title={t('admin.expandSidebar', 'Mở rộng sidebar')}>
            {logoUrl ? (
              <img src={getImageUrl(logoUrl)} alt={siteTitle} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
            ) : (
              <div className="admin-sidebar-brand-logo" style={{ margin: 0 }}>{(siteTitle || 'Z')[0].toUpperCase()}</div>
            )}
          </div>
        ) : (
          <div className="admin-sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              {logoUrl ? (
                <img src={getImageUrl(logoUrl)} alt={siteTitle} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div className="admin-sidebar-brand-logo">{(siteTitle || 'Z')[0].toUpperCase()}</div>
              )}
              <span className="admin-sidebar-brand-text" style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{siteTitle || 'Zodiac Admin'}</span>
            </div>
            <button className="admin-sidebar-toggle-btn" onClick={onToggle} title={t('admin.collapseSidebar', 'Thu gọn sidebar')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}

        {/* Profile */}
        <div className="admin-sidebar-profile" style={collapsed ? { padding: '16px 0', justifyContent: 'center' } : undefined}>
          <div className="admin-sidebar-avatar" style={{ background: 'none', border: 'none' }}>
            <UserAvatar user={user} size="sm" shape="square" className="w-[38px] h-[38px] rounded-[10px]" />
          </div>
          <div className="admin-sidebar-profile-info">
            <div className="admin-sidebar-profile-name">{user?.full_name || user?.username || adminName || 'Admin'}</div>
            <div className="admin-sidebar-profile-role">{t('admin.administrator', 'Quản trị viên')}</div>
          </div>
        </div>

        {/* Menu */}
        <nav className="admin-sidebar-menu">
          {groups.map(group => {
            const items = menuItems.filter(m => m.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <div className="admin-menu-label">{group}</div>
                {items.map(item => (
                  <button
                    key={item.id}
                    className={`admin-menu-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile?.();
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {getIcon(item.icon)}
                    <span className="admin-menu-text">{item.label}</span>
                  </button>
                ))}
              </div>
            );
          })}

          <div className="admin-menu-label">{t('admin.groupAccount', 'TÀI KHOẢN')}</div>
          <button className="admin-menu-item danger" onClick={onLogout} title={collapsed ? t('chat.logout') : undefined}>
            {getIcon('logout')}
            <span className="admin-menu-text">{t('chat.logout')}</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
