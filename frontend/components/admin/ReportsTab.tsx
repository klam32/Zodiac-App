import React, { useState, useMemo } from 'react';
import { api, getImageUrl } from '../../api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ReportsTabProps {
  reports: any[];
  onRefresh?: () => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ reports, onRefresh }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'none'>('add');
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [adminNote, setAdminNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'rejected'>('all');
  const [showLargeImage, setShowLargeImage] = useState<string | null>(null);

  const reportTypeLabels: Record<string, string> = {
    payment_not_received: t('admin.reportType.payment_not_received', 'Chưa nhận token'),
    wrong_token_amount: t('admin.reportType.wrong_token_amount', 'Sai số token'),
    payment_failed: t('admin.reportType.payment_failed', 'Thanh toán lỗi'),
    duplicate_payment: t('admin.reportType.duplicate_payment', 'Thanh toán trùng'),
    other: t('admin.reportType.other', 'Khác')
  };

  const handleOpenProcessModal = (rep: any) => {
    setSelectedReport(rep);
    setActionType('approve');
    setAdjustType('add');
    setTokenAmount(0);
    setAdminNote('');
  };

  const handleCloseModals = () => {
    setSelectedReport(null);
    setShowDetailModal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      const res = await api.adminResolvePaymentReport(selectedReport.id, {
        action: actionType,
        adjustment_type: actionType === 'approve' ? adjustType : 'none',
        token_amount: actionType === 'approve' && adjustType !== 'none' ? tokenAmount : 0,
        admin_note: adminNote,
      });

      if (res.warning) {
        toast.success(`${res.message}. ${res.warning}`);
      } else {
        toast.success(res.message || t('admin.resolveReportSuccess', 'Xử lý báo cáo thành công.'));
      }
      handleCloseModals();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || t('admin.resolveReportFailed', 'Xử lý báo cáo thất bại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and Search logic
  const filteredReports = useMemo(() => {
    let list = [...reports];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(rep => {
        if (statusFilter === 'pending') return rep.status === 'pending';
        if (statusFilter === 'resolved') return rep.status === 'resolved';
        if (statusFilter === 'rejected') return rep.status === 'rejected';
        return true;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(rep => 
        (rep.report_code || '').toLowerCase().includes(q) ||
        (rep.username || '').toLowerCase().includes(q) ||
        (rep.email || '').toLowerCase().includes(q) ||
        (rep.title || '').toLowerCase().includes(q)
      );
    }

    // Sort by created_at desc
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return list;
  }, [reports, statusFilter, searchQuery]);

  return (
    <div>
      {/* Header Cards & Filter Bar */}
      <div className="admin-card" style={{ marginBottom: '16px' }}>
        <div className="admin-card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '16px 20px' }}>
          
          {/* Search bar styled after default admin */}
          <div className="admin-search" style={{ flex: 1, minWidth: '240px' }}>
            <svg className="admin-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              placeholder={t('admin.searchReportPlaceholder')} 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>

          {/* Status filters */}
          <div className="admin-filter-bar">
            <button 
              className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`} 
              onClick={() => setStatusFilter('all')}
            >
              {t('admin.all', 'Tất cả')}
            </button>
            <button 
              className={`admin-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`} 
              onClick={() => setStatusFilter('pending')}
            >
              {t('admin.pending')}
            </button>
            <button 
              className={`admin-filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`} 
              onClick={() => setStatusFilter('resolved')}
            >
              {t('admin.resolved')}
            </button>
            <button 
              className={`admin-filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`} 
              onClick={() => setStatusFilter('rejected')}
            >
              {t('admin.rejected')}
            </button>
          </div>

          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            {filteredReports.length} {t('admin.reportsCountLabel')}
          </span>
        </div>
      </div>

      {/* Reports Table Wrapper */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">{t('admin.reportListTitle')}</div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table" style={{ width: '100%', minWidth: '1100px' }}>
            <thead>
              <tr>
                <th style={{ width: '120px' }}>{t('admin.time')}</th>
                <th style={{ width: '130px' }}>{t('admin.reportCode')}</th>
                <th style={{ width: '200px' }}>{t('admin.sender')}</th>
                <th style={{ width: '220px' }}>{t('admin.title')}</th>
                <th style={{ width: '140px' }}>{t('admin.reportTypeLabel')}</th>
                <th style={{ width: '160px' }}>{t('admin.invoiceTx')}</th>
                <th style={{ width: '110px' }}>{t('common.status')}</th>
                <th style={{ width: '120px', textAlign: 'center' }}>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontStyle: 'italic' }}>
                    {t('admin.noReportsFound')}
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep: any) => (
                  <tr key={rep.id}>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(rep.created_at).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'vi-VN')}
                      <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(rep.created_at).toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>
                      {rep.report_code || `RPT-${rep.id}`}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={rep.username}>
                        {rep.username}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={rep.email}>
                        {rep.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#334155' }} title={rep.title}>
                        {rep.title || t('admin.noTitle')}
                      </div>
                      {rep.attachment_url && (
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            fontSize: '10px', 
                            fontWeight: 700, 
                            color: '#1d4ed8', 
                            backgroundColor: '#eff6ff', 
                            border: '1px solid #bfdbfe', 
                            padding: '2px 6px', 
                            borderRadius: '4px' 
                          }}>
                            📸 Có ảnh
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ color: '#334155', fontWeight: 500 }}>
                      {reportTypeLabels[rep.report_type] || rep.report_type || t('admin.reportType.other')}
                    </td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>
                      {rep.invoice_code && (
                        <div style={{ maxWidth: '140px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {t('admin.invoiceShort')}: <strong style={{ color: '#334155' }}>{rep.invoice_code}</strong>
                        </div>
                      )}
                      {rep.transaction_code && (
                        <div style={{ maxWidth: '140px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '11px', color: '#64748b' }} title={rep.transaction_code}>
                          {t('admin.transactionShort')}: {rep.transaction_code}
                        </div>
                      )}
                      {!rep.invoice_code && !rep.transaction_code && <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td>
                      <span className={`admin-badge ${
                        rep.status === 'resolved' 
                          ? 'green' 
                          : rep.status === 'rejected'
                          ? 'red'
                          : 'yellow'
                      }`}>
                        {rep.status === 'resolved' ? t('admin.resolved') : rep.status === 'rejected' ? t('admin.rejected') : t('admin.pending')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => setShowDetailModal(rep)}
                          className="admin-btn admin-btn-sm admin-btn-outline"
                        >
                          {t('common.detail')}
                        </button>
                        {rep.status === 'pending' ? (
                          <button
                            onClick={() => handleOpenProcessModal(rep)}
                            className="admin-btn admin-btn-sm admin-btn-primary"
                          >
                            {t('admin.process')}
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', alignSelf: 'center', padding: '0 4px' }}>
                            {t('admin.processed')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal md">
            
            {/* Header */}
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{t('admin.reportDetailTitle')}</h3>
              <button onClick={handleCloseModals} className="admin-modal-close">
                <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Meta details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>{t('admin.sender')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{showDetailModal.username}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>{t('admin.email')}</span>
                    <span style={{ color: 'var(--admin-text)', wordBreak: 'break-all' }}>{showDetailModal.email}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>{t('admin.sentTime')}</span>
                    <span style={{ color: 'var(--admin-text)' }}>{new Date(showDetailModal.created_at).toLocaleString(currentLang === 'en' ? 'en-US' : 'vi-VN')}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>{t('admin.tokensBalanceLabel')}</span>
                    <span style={{ color: 'var(--admin-primary)', fontWeight: 700 }}>
                      {showDetailModal.token_balance !== undefined ? `${showDetailModal.token_balance.toFixed(2)} Tokens` : t('admin.unknown')}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <span className="admin-input-label">{t('admin.title')}</span>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--admin-border)', fontWeight: 600, color: 'var(--admin-text)' }}>
                    {showDetailModal.title || t('admin.noTitle')}
                  </div>
                </div>

                {/* Sub info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span className="admin-input-label">{t('admin.reportTypeLabel')}</span>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                      {reportTypeLabels[showDetailModal.report_type] || showDetailModal.report_type || t('admin.reportType.other')}
                    </div>
                  </div>
                  <div>
                    <span className="admin-input-label">{t('admin.invoiceTx')}</span>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                      {showDetailModal.invoice_code && <span style={{ display: 'block' }}>{t('admin.invoiceShort')}: {showDetailModal.invoice_code}</span>}
                      {showDetailModal.transaction_code && <span style={{ display: 'block', fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{t('admin.transactionShort')}: {showDetailModal.transaction_code}</span>}
                      {!showDetailModal.invoice_code && !showDetailModal.transaction_code && '—'}
                    </div>
                  </div>
                </div>

                {/* Detailed description */}
                <div>
                  <span className="admin-input-label">{t('admin.reportDescLabel')}</span>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {showDetailModal.description || t('admin.noDescription')}
                  </div>
                </div>

                {/* Image upload preview */}
                {showDetailModal.attachment_url ? (
                  <div>
                    <span className="admin-input-label">{t('admin.attachmentLabel', 'Ảnh minh chứng')}</span>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid var(--admin-border)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setShowLargeImage(getImageUrl(showDetailModal.attachment_url))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--admin-border)',
                            background: '#fff',
                            color: 'var(--admin-text)'
                          }}
                        >
                          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Xem ảnh lớn
                        </button>
                        <a 
                          href={getImageUrl(showDetailModal.attachment_url)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--admin-border)',
                            background: '#fff',
                            color: 'var(--admin-primary)'
                          }}
                        >
                          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Mở trong tab mới
                        </a>
                      </div>
                      <img 
                        src={getImageUrl(showDetailModal.attachment_url)} 
                        alt={t('admin.attachmentAlt', 'Ảnh minh chứng')} 
                        style={{ maxHeight: '200px', margin: '0 auto', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--admin-border)', background: '#fff', display: 'block', cursor: 'zoom-in' }}
                        onClick={() => setShowLargeImage(getImageUrl(showDetailModal.attachment_url))}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="admin-input-label">{t('admin.attachmentLabel', 'Ảnh minh chứng')}</span>
                    <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', padding: '4px 8px' }}>
                      Không có ảnh minh chứng.
                    </div>
                  </div>
                )}

                {/* Status and notes for processed ones */}
                {showDetailModal.status !== 'pending' && (
                  <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '16px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>{t('admin.processingResult')}</span>
                        <span className={`admin-badge ${showDetailModal.status === 'resolved' ? 'green' : 'red'}`}>
                          {showDetailModal.status === 'resolved' ? t('admin.resolved') : t('admin.rejected')}
                        </span>
                      </div>
                      {showDetailModal.status === 'resolved' && showDetailModal.adjustment_type !== 'none' && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>{t('admin.adjustTokenLabel')}</span>
                          <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                            {showDetailModal.adjustment_type === 'add' ? '+' : '-'}{showDetailModal.token_amount || 0} Tokens
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="admin-input-label">{t('admin.adminNoteLabel')}</span>
                      <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontStyle: 'italic' }}>
                        {showDetailModal.admin_note || t('admin.noNotes')}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="admin-modal-footer">
              <button onClick={handleCloseModals} className="admin-btn admin-btn-outline">
                {t('common.close')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PROCESS MODAL */}
      {selectedReport && (
        <div className="admin-modal-overlay">
          <div className="admin-modal sm">
            
            {/* Header */}
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{t('admin.processReportTitle')}</h3>
              <button onClick={handleCloseModals} className="admin-modal-close">
                <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body" style={{ color: 'var(--admin-text)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Action choice using standard button states */}
                  <div>
                    <label className="admin-input-label">{t('admin.processDecision')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setActionType('approve')}
                        className={`admin-btn ${actionType === 'approve' ? 'admin-btn-success' : 'admin-btn-outline'}`}
                        style={{ padding: '12px', width: '100%' }}
                      >
                        {t('admin.approve')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionType('reject')}
                        className={`admin-btn ${actionType === 'reject' ? 'admin-btn-danger' : 'admin-btn-outline'}`}
                        style={{ padding: '12px', width: '100%' }}
                      >
                        {t('admin.reject')}
                      </button>
                    </div>
                  </div>

                  {/* Approve details */}
                  {actionType === 'approve' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label className="admin-input-label">{t('admin.adjustTypeLabel')}</label>
                        <select
                          className="admin-input"
                          value={adjustType}
                          onChange={(e: any) => setAdjustType(e.target.value)}
                        >
                          <option value="add">{t('admin.adjustAdd')}</option>
                          <option value="subtract">{t('admin.adjustSubtract')}</option>
                          <option value="none">{t('admin.adjustNone')}</option>
                        </select>
                      </div>

                      {adjustType !== 'none' && (
                        <div>
                          <label className="admin-input-label">{t('admin.tokensAmountLabel')}</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            className="admin-input"
                            value={tokenAmount}
                            onChange={(e) => setTokenAmount(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin notes */}
                  <div>
                    <label className="admin-input-label">
                      {t('admin.adminNoteLabel')} {actionType === 'reject' && <span style={{ color: 'var(--admin-danger)' }}>*</span>}
                    </label>
                    <textarea
                      required={actionType === 'reject'}
                      className="admin-textarea"
                      placeholder={actionType === 'reject' ? t('admin.rejectPlaceholder') : t('admin.approvePlaceholder')}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  onClick={handleCloseModals} 
                  className="admin-btn admin-btn-outline" 
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className={`admin-btn ${actionType === 'approve' ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                  style={{ minWidth: '100px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('common.processing') : t('common.confirm')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ZOOM LARGE IMAGE MODAL */}
      {showLargeImage && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            cursor: 'zoom-out'
          }}
          onClick={() => setShowLargeImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowLargeImage(null); }}
              style={{
                position: 'absolute',
                top: '-44px',
                right: 0,
                color: '#fff',
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Đóng
            </button>
            <img 
              src={showLargeImage} 
              alt="Ảnh minh chứng kích thước lớn" 
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
