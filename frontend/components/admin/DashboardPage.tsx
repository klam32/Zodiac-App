import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  summary: {
    total_users: number;
    total_tokens_recharged: number;
    total_revenue: number;
    total_chats: number;
    active_packages: number;
    total_invoices: number;
    total_reports: number;
    total_blogs: number;
  };
  revenue_by_month: { month: string; revenue: number }[];
  token_usage_by_day: { date: string; tokens: number }[];
  new_users_by_day: { date: string; users: number }[];
  top_token_users: {
    user_id: number;
    name: string;
    email: string;
    tokens_used: number;
    tokens_remaining: number;
  }[];
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    chartId: string; index: number; x: number; y: number; label: string; value: string;
  } | null>(null);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetDashboardStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div>
        <div className="admin-stats-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="admin-stat-card" key={i}>
              <div className="admin-stat-icon admin-skeleton" style={{ width: 44, height: 44 }} />
              <div className="admin-stat-info" style={{ width: '100%' }}>
                <div className="admin-skeleton" style={{ width: '60%', height: 12, marginBottom: 8 }} />
                <div className="admin-skeleton" style={{ width: '80%', height: 24 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 20, marginTop: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="admin-chart-card" key={i}>
              <div className="admin-skeleton" style={{ width: '40%', height: 16, marginBottom: 16 }} />
              <div className="admin-skeleton" style={{ height: 220, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { summary, revenue_by_month, token_usage_by_day, new_users_by_day, top_token_users } = data;

  const statCards = [
    { label: t('admin.totalUsers'), value: summary.total_users.toLocaleString(), color: 'purple', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) },
    { label: t('admin.tokensRecharged'), value: summary.total_tokens_recharged.toLocaleString(), color: 'blue', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>) },
    { label: t('admin.totalRevenue'), value: `${summary.total_revenue.toLocaleString()}đ`, color: 'green', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
    { label: t('admin.totalChats'), value: summary.total_chats.toLocaleString(), color: 'orange', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>) },
    { label: t('admin.activePackages'), value: summary.active_packages.toLocaleString(), color: 'cyan', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>) },
    { label: t('admin.totalInvoices'), value: summary.total_invoices.toLocaleString(), color: 'pink', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>) },
    { label: t('admin.totalReports'), value: summary.total_reports.toLocaleString(), color: 'red', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>) },
    { label: t('admin.totalBlogs'), value: summary.total_blogs.toLocaleString(), color: 'yellow', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>) },
  ];

  const renderAreaChart = (chartId: string, dataList: { label: string; value: number }[], color: string, gradientId: string, valSuffix: string = '') => {
    if (!dataList || dataList.length === 0) return <div className="admin-chart-placeholder">{t('admin.noData')}</div>;
    const width = 600, height = 240, paddingX = 45, paddingY = 30;
    const chartWidth = width - paddingX * 2, chartHeight = height - paddingY * 2;
    const maxVal = Math.max(...dataList.map(d => d.value), 1), minVal = 0, range = maxVal - minVal;
    const points = dataList.map((d, i) => ({
      x: paddingX + (i / (dataList.length - 1 || 1)) * chartWidth,
      y: paddingY + chartHeight - ((d.value - minVal) / range) * chartHeight,
      label: d.label, value: d.value
    }));
    const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
    return (
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + ratio * chartHeight;
            return (<g key={idx}><line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(226,232,240,0.7)" strokeWidth="1" strokeDasharray="3 3" /><text x={paddingX - 8} y={y + 4} textAnchor="end" style={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}>{Math.round(maxVal - ratio * maxVal).toLocaleString()}</text></g>);
          })}
          {points.map((p, idx) => {
            const shouldShow = points.length <= 7 || idx === 0 || idx === points.length - 1 || idx === Math.floor(points.length / 2) || (points.length > 14 && idx % Math.floor(points.length / 4) === 0);
            if (!shouldShow) return null;
            return <text key={idx} x={p.x} y={height - 8} textAnchor="middle" style={{ fontSize: 9.5, fill: '#64748b', fontWeight: 500 }}>{p.label}</text>;
          })}
          <path d={areaD} fill={`url(#${gradientId})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="12" fill="transparent" style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredTooltip({ chartId, index: idx, x: p.x, y: p.y - 12, label: p.label, value: `${p.value.toLocaleString()}${valSuffix}` })}
                onMouseLeave={() => setHoveredTooltip(null)} />
              <circle cx={p.x} cy={p.y} r={hoveredTooltip?.chartId === chartId && hoveredTooltip?.index === idx ? "5" : "3.5"}
                fill={hoveredTooltip?.chartId === chartId && hoveredTooltip?.index === idx ? color : "white"} stroke={color} strokeWidth="2" style={{ pointerEvents: 'none', transition: 'all 0.1s' }} />
            </g>
          ))}
          {hoveredTooltip && hoveredTooltip.chartId === chartId && (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={hoveredTooltip.x - 70} y={hoveredTooltip.y - 40} width="140" height="34" rx="6" fill="#0f172a" opacity="0.95" />
              <text x={hoveredTooltip.x} y={hoveredTooltip.y - 26} textAnchor="middle" fill="#ffffff" style={{ fontSize: 9.5, fontWeight: 500 }}>{hoveredTooltip.label}</text>
              <text x={hoveredTooltip.x} y={hoveredTooltip.y - 12} textAnchor="middle" fill="#38bdf8" style={{ fontSize: 11, fontWeight: 700 }}>{hoveredTooltip.value}</text>
            </g>
          )}
        </svg>
      </div>
    );
  };

  const renderBarChart = (chartId: string, dataList: { label: string; value: number }[], color: string, gradientId: string, valSuffix: string = '') => {
    if (!dataList || dataList.length === 0) return <div className="admin-chart-placeholder">{t('admin.noData')}</div>;
    const width = 600, height = 240, paddingX = 45, paddingY = 30;
    const chartWidth = width - paddingX * 2, chartHeight = height - paddingY * 2;
    const maxVal = Math.max(...dataList.map(d => d.value), 1), range = maxVal;
    const barCount = dataList.length;
    const barWidth = (chartWidth * 0.6) / barCount;
    const barSpacing = (chartWidth * 0.4) / (barCount - 1 || 1);
    const bars = dataList.map((d, i) => ({
      x: paddingX + i * (barWidth + barSpacing),
      y: paddingY + chartHeight - (d.value / range) * chartHeight,
      w: barWidth, h: (d.value / range) * chartHeight, label: d.label, value: d.value
    }));
    return (
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + ratio * chartHeight;
            return (<g key={idx}><line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(226,232,240,0.7)" strokeWidth="1" strokeDasharray="3 3" /><text x={paddingX - 8} y={y + 4} textAnchor="end" style={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}>{Math.round(maxVal - ratio * maxVal).toLocaleString()}</text></g>);
          })}
          {bars.map((bar, idx) => {
            const shouldShow = bars.length <= 8 || idx === 0 || idx === bars.length - 1 || idx % Math.ceil(bars.length / 5) === 0;
            if (!shouldShow) return null;
            return <text key={idx} x={bar.x + bar.w / 2} y={height - 8} textAnchor="middle" style={{ fontSize: 9.5, fill: '#64748b', fontWeight: 500 }}>{bar.label}</text>;
          })}
          {bars.map((bar, idx) => (
            <g key={idx}>
              <rect x={bar.x} y={bar.y} width={bar.w} height={Math.max(bar.h, 2)} rx="4" fill={`url(#${gradientId})`}
                style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={() => setHoveredTooltip({ chartId, index: idx, x: bar.x + bar.w / 2, y: bar.y - 8, label: bar.label, value: `${bar.value.toLocaleString()}${valSuffix}` })}
                onMouseLeave={() => setHoveredTooltip(null)} />
            </g>
          ))}
          {hoveredTooltip && hoveredTooltip.chartId === chartId && (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={hoveredTooltip.x - 70} y={hoveredTooltip.y - 40} width="140" height="34" rx="6" fill="#0f172a" opacity="0.95" />
              <text x={hoveredTooltip.x} y={hoveredTooltip.y - 26} textAnchor="middle" fill="#ffffff" style={{ fontSize: 9.5, fontWeight: 500 }}>{hoveredTooltip.label}</text>
              <text x={hoveredTooltip.x} y={hoveredTooltip.y - 12} textAnchor="middle" fill="#22c55e" style={{ fontSize: 11, fontWeight: 700 }}>{hoveredTooltip.value}</text>
            </g>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div>
      <div className="admin-stats-grid">
        {statCards.map((card, i) => (
          <div className="admin-stat-card" key={i}>
            <div className={`admin-stat-icon ${card.color}`}>{card.icon}</div>
            <div className="admin-stat-info">
              <div className="admin-stat-label">{card.label}</div>
              <div className="admin-stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 20 }}>
        <div className="admin-chart-card">
          <div className="admin-chart-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('admin.monthlyRevenue')}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 12 }}>VNĐ</span>
          </div>
          <div className="admin-chart-svg-preview">{renderBarChart('rev_month', revenue_by_month.map(r => ({ label: r.month, value: r.revenue })), '#10b981', 'gradRev', 'đ')}</div>
        </div>

        <div className="admin-chart-card">
          <div className="admin-chart-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('admin.tokenUsage')}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#4f46e5', background: '#ede9fe', padding: '2px 8px', borderRadius: 12 }}>Tokens</span>
          </div>
          <div className="admin-chart-svg-preview">{renderAreaChart('token_day', token_usage_by_day.map(t => ({ label: t.date.substring(5), value: t.tokens })), '#6366f1', 'gradToken')}</div>
        </div>

        <div className="admin-chart-card">
          <div className="admin-chart-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('admin.newUsers')}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#0ea5e9', background: '#e0f2fe', padding: '2px 8px', borderRadius: 12 }}>{t('admin.members')}</span>
          </div>
          <div className="admin-chart-svg-preview">{renderAreaChart('users_day', new_users_by_day.map(u => ({ label: u.date.substring(5), value: u.users })), '#0ea5e9', 'gradUsers')}</div>
        </div>

        <div className="admin-chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="admin-chart-title" style={{ marginBottom: 12 }}>{t('admin.topUsers')}</div>
          <div style={{ flex: 1, overflowX: 'auto' }}>
            {top_token_users && top_token_users.length > 0 ? (
              <table className="admin-table" style={{ minWidth: '100%', fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px' }}>{t('admin.rank')}</th>
                    <th style={{ padding: '8px 12px' }}>{t('common.user')}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('admin.used')}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('admin.remaining')}</th>
                  </tr>
                </thead>
                <tbody>
                  {top_token_users.map((item, idx) => (
                    <tr key={item.user_id}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{item.email}</div>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{item.tokens_used.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>{item.tokens_remaining.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-chart-placeholder">{t('admin.noTokenData')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
