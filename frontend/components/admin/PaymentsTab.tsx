import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface PaymentsTabProps {
  payments: any[];
  paymentFilter: 'completed' | 'failed';
  setPaymentFilter: (filter: 'completed' | 'failed') => void;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ payments, paymentFilter, setPaymentFilter }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const filtered = useMemo(() => payments.filter((p: any) => p.status === paymentFilter), [payments, paymentFilter]);

  const stats = useMemo(() => {
    const completed = payments.filter((p: any) => p.status === 'completed');
    return {
      totalRevenue: completed.reduce((s: number, p: any) => s + (p.amount_vnd || 0), 0),
      successCount: completed.length,
      failedCount: payments.filter((p: any) => p.status === 'failed').length,
    };
  }, [payments]);

  const statusLabel = (status: string) => {
    if (status === 'completed') return t('admin.completed') || 'Thành công';
    return t('admin.failed') || 'Thất bại';
  };

  return (
    <div>
      <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1"/></svg></div>
          <div className="admin-stat-info"><div className="admin-stat-label">{t('admin.totalRevenueStat') || 'Tổng doanh thu'}</div><div className="admin-stat-value" style={{fontSize:18}}>{stats.totalRevenue.toLocaleString()}đ</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></div>
          <div className="admin-stat-info"><div className="admin-stat-label">{t('admin.successStat') || 'Thành công'}</div><div className="admin-stat-value" style={{fontSize:18}}>{stats.successCount}</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon red"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></div>
          <div className="admin-stat-info"><div className="admin-stat-label">{t('admin.failedStat') || 'Thất bại'}</div><div className="admin-stat-value" style={{fontSize:18}}>{stats.failedCount}</div></div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">{t('admin.paymentInvoice') || 'Hóa đơn thanh toán'}</div>
          <div className="admin-filter-bar">
            {(['completed', 'failed'] as const).map(f => (
              <button key={f} className={`admin-filter-btn ${paymentFilter === f ? 'active' : ''}`} onClick={() => setPaymentFilter(f)}>
                {statusLabel(f)}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-card-body no-padding">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr>
                <th>{t('admin.code') || 'Mã'}</th>
                <th>{t('common.user') || 'Người dùng'}</th>
                <th style={{textAlign:'right'}}>{t('common.amount') || 'Số tiền'}</th>
                <th>Tokens</th>
                <th>{t('common.status') || 'Trạng thái'}</th>
                <th>{t('common.date') || 'Ngày tạo'}</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="admin-empty"><div className="admin-empty-text">{t('admin.noInvoices') || 'Không có hóa đơn'}</div></div></td></tr>
                ) : filtered.map((pm: any) => (
                  <tr key={pm.id}>
                    <td style={{ fontFamily: 'monospace', color: '#64748b' }}>#{pm.id}</td>
                    <td><strong>{pm.username}</strong><div style={{ fontSize: 11, color: '#94a3b8' }}>{pm.email}</div></td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{pm.amount_vnd?.toLocaleString()}đ</td>
                    <td><span style={{ fontWeight: 700, color: '#6d5dfc' }}>+{pm.tokens}</span></td>
                    <td>
                      <span className={`admin-badge ${pm.status === 'completed' ? 'green' : 'red'}`}>
                        {statusLabel(pm.status)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>{(() => {
                      if (!pm.created_at) return '—';
                      const d = new Date(pm.created_at);
                      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'vi-VN');
                    })()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;
