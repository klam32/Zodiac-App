import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface ChatLogsTabProps {
  chatlogs: any[];
  onSelectChat: (log: any) => void;
}

const PER_PAGE = 20;

const ChatLogsTab: React.FC<ChatLogsTabProps> = ({ chatlogs, onSelectChat }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return chatlogs;
    const q = search.toLowerCase();
    return chatlogs.filter(l => l.username?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.question?.toLowerCase().includes(q));
  }, [chatlogs, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-title">{t('admin.chatLogsTitle')} ({filtered.length})</div>
        <div className="admin-search">
          <svg className="admin-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder={t('admin.chatLogsSearch')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="admin-card-body no-padding">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr>
              <th>{t('admin.time')}</th>
              <th>{t('admin.questioner')}</th>
              <th>{t('admin.question')}</th>
              <th style={{textAlign:'right'}}>{t('admin.fee')}</th>
              <th>{t('admin.operation')}</th>
            </tr></thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={5}><div className="admin-empty"><div className="admin-empty-text">{t('admin.noLogs')}</div></div></td></tr>
              ) : paged.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td><strong>{log.username}</strong></td>
                  <td style={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b', fontStyle: 'italic', fontSize: 13 }}>"{log.question}"</td>
                  <td style={{ textAlign: 'right' }}><span className="admin-badge purple">-{log.tokens_charged}</span></td>
                  <td><button className="admin-btn admin-btn-sm admin-btn-primary" onClick={() => onSelectChat(log)}>{t('common.detail')}</button></td>
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

export default ChatLogsTab;
