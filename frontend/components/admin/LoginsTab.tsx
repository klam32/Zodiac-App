import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface LoginsTabProps { logins: any[]; }
const PER_PAGE = 20;

const LoginsTab: React.FC<LoginsTabProps> = ({ logins }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return logins;
    const q = search.toLowerCase();
    return logins.filter(l => l.username?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q));
  }, [logins, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-title">{t('admin.loginLogsTitle', 'Lịch sử đăng nhập')} ({filtered.length})</div>
        <div className="admin-search">
          <svg className="admin-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder={t('admin.searchPlaceholder')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="admin-card-body no-padding">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>{t('admin.time')}</th><th>{t('common.user')}</th><th>{t('admin.email')}</th><th>IP</th><th>User Agent</th></tr></thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={5}><div className="admin-empty"><div className="admin-empty-text">{t('admin.noLogins', 'Chưa có lượt đăng nhập')}</div></div></td></tr>
              ) : paged.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td><strong>{log.username}</strong></td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{log.email}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{log.ip_address}</td>
                  <td style={{ fontSize: 11, color: '#94a3b8', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user_agent}>{log.user_agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <span>{t('common.page')} {page}/{totalPages}</span>
            <div className="admin-pagination-btns">
              <button className="admin-pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              <button className="admin-pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p - 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginsTab;
