import React from 'react';
import { useTranslation } from 'react-i18next';

interface PackagesTabProps {
  packages: any[];
  onCreatePackage: () => void;
  onUpdatePackage: (pkg: any) => void;
  onDeletePackage: (id: number) => void;
}

const PackagesTab: React.FC<PackagesTabProps> = ({ packages, onCreatePackage, onUpdatePackage, onDeletePackage }) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">{t('admin.packageList')}</div>
          <button className="admin-btn admin-btn-primary" onClick={onCreatePackage}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            {t('admin.createPackage')}
          </button>
        </div>
        <div className="admin-card-body">
          {packages.length === 0 ? (
            <div className="admin-empty"><div className="admin-empty-text">{t('admin.noPackages')}</div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {packages.map((p: any) => (
                <div key={p.id} style={{ background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                    <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => onUpdatePackage(p)} title={t('common.edit')}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => onDeletePackage(p.id)} title={t('common.delete')}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#7c3aed', fontWeight: 700, fontSize: 18 }}>✦</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#6d5dfc', marginBottom: 8 }}>
                    {p.tokens.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>tokens</span>
                  </div>
                  <span className="admin-badge blue">{p.amount_vnd.toLocaleString()} VNĐ</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackagesTab;
