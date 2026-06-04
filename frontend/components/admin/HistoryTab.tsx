import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface HistoryTabProps { history: any[]; }

const PER_PAGE = 20;

const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return history;
    const q = search.toLowerCase();
    return history.filter(h => h.username?.toLowerCase().includes(q) || h.email?.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q));
  }, [history, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-title">{t('admin.tokenHistoryTitle', 'Lịch sử biến động token')}</div>
        <div className="admin-search">
          <svg className="admin-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder={t('common.search') + '...'} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="admin-card-body no-padding">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>{t('admin.time')}</th><th>{t('common.user')}</th><th>{t('profile.type')}</th><th style={{textAlign:'right'}}>{t('common.amount')}</th><th>{t('profile.description')}</th></tr></thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={5}><div className="admin-empty"><div className="admin-empty-text">{t('common.noData')}</div></div></td></tr>
              ) : paged.map((h: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(h.created_at).toLocaleString()}</td>
                  <td><strong>{h.username}</strong><div style={{ fontSize: 11, color: '#94a3b8' }}>{h.email}</div></td>
                  <td><span className={`admin-badge ${h.type === 'in' ? 'green' : 'purple'}`}>{h.type === 'in' ? t('admin.receive', 'Nhận') : t('admin.spend', 'Chi')}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: h.type === 'in' ? '#16a34a' : '#6d5dfc' }}>{h.type === 'in' ? '+' : '-'}{h.amount}</td>
                  <td style={{ fontSize: 12, color: '#64748b', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.description}</td>
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
              <button className="admin-pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
