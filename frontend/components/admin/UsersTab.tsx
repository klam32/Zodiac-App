import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import UserAvatar from '../common/UserAvatar';

interface UsersTabProps {
  users: any[];
  isLoading: boolean;
  onViewDetail: (userId: number) => void;
  onUpdateBalance: (userId: number, currentBalance: number) => void;
  onToggleAdmin: (userId: number, currentStatus: boolean) => void;
  onDeleteUser: (userId: number) => void;
}

const ITEMS_PER_PAGE = 15;

const UsersTab: React.FC<UsersTabProps> = ({ users, isLoading, onViewDetail, onUpdateBalance, onToggleAdmin, onDeleteUser }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'token_balance'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    if (roleFilter === 'admin') list = list.filter(u => u.is_admin);
    if (roleFilter === 'user') list = list.filter(u => !u.is_admin);
    list.sort((a, b) => {
      const va = a[sortBy] ?? 0; const vb = b[sortBy] ?? 0;
      if (sortBy === 'created_at') return sortDir === 'desc' ? new Date(vb).getTime() - new Date(va).getTime() : new Date(va).getTime() - new Date(vb).getTime();
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return list;
  }, [users, search, roleFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const toggleSort = (field: 'created_at' | 'token_balance') => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="admin-search" style={{ flex: 1, minWidth: 200 }}>
            <svg className="admin-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input placeholder={t('admin.searchPlaceholder')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="admin-filter-bar">
            <button className={`admin-filter-btn ${roleFilter === 'all' ? 'active' : ''}`} onClick={() => { setRoleFilter('all'); setPage(1); }}>{t('admin.all')}</button>
            <button className={`admin-filter-btn ${roleFilter === 'admin' ? 'active' : ''}`} onClick={() => { setRoleFilter('admin'); setPage(1); }}>{t('admin.adminRole', 'Admin')}</button>
            <button className={`admin-filter-btn ${roleFilter === 'user' ? 'active' : ''}`} onClick={() => { setRoleFilter('user'); setPage(1); }}>{t('admin.userRole', 'User')}</button>
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>{filtered.length} {t('admin.users')}</span>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.username')}</th>
                <th>{t('admin.email')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('token_balance')}>
                  Tokens {sortBy === 'token_balance' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th>{t('admin.role')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('created_at')}>
                  {t('admin.createdAt')} {sortBy === 'created_at' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="admin-skeleton" style={{ width: 120, height: 16 }} /></td>
                    <td><div className="admin-skeleton" style={{ width: 150, height: 16 }} /></td>
                    <td><div className="admin-skeleton" style={{ width: 60, height: 16 }} /></td>
                    <td><div className="admin-skeleton" style={{ width: 50, height: 20 }} /></td>
                    <td><div className="admin-skeleton" style={{ width: 80, height: 16 }} /></td>
                    <td><div className="admin-skeleton" style={{ width: 180, height: 24 }} /></td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={6}><div className="admin-empty"><div className="admin-empty-text">{t('admin.noUsersFound')}</div></div></td></tr>
              ) : paged.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <UserAvatar user={u} size="sm" className="admin-user-avatar" />
                      <span style={{ fontWeight: 600 }}>{u.username}</span>
                    </div>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 15, color: (u.token_balance ?? 0) < 5 ? '#ef4444' : '#6d5dfc' }}>
                      {(u.token_balance ?? 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.is_admin ? 'purple' : 'gray'}`}>{u.is_admin ? t('admin.adminRole', 'ADMIN') : t('admin.userRole', 'USER')}</span>
                  </td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'vi-VN') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => onViewDetail(u.id)}>{t('common.detail')}</button>
                      <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => onUpdateBalance(u.id, u.token_balance)}>{t('admin.balance')}</button>
                      <button className={`admin-btn admin-btn-sm ${u.is_admin ? 'admin-btn-outline' : 'admin-btn-primary'}`} onClick={() => onToggleAdmin(u.id, !!u.is_admin)}>
                        {u.is_admin ? t('admin.demote') : t('admin.promote')}
                      </button>
                      {!u.is_admin && (
                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => onDeleteUser(u.id)}>{t('common.delete')}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <span>{t('common.page')} {page}/{totalPages} ({filtered.length} {t('common.results')})</span>
            <div className="admin-pagination-btns">
              <button className="admin-pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const p = i + 1;
                return <button key={p} className={`admin-pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button className="admin-pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersTab;
