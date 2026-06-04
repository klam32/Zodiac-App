import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../api';
import LandingPreview from './settings/LandingPreview';
import LandingPreviewModal from './settings/LandingPreviewModal';
import { Eye, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SettingsTabProps {
    data: any;
    onSave: (e: React.FormEvent) => void;
    onSync: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onUploadLogo: (file: File) => Promise<void>;
    onUploadFavicon: (file: File) => Promise<void>;
    onUploadBackground: (file: File) => Promise<void>;
    onUploadHeroBg: (file: File) => Promise<void>;
    onUploadHeroChartImg: (file: File) => Promise<void>;
    onUploadVideoGuide: (file: File) => Promise<void>;
    onUploadVideoPoster: (file: File) => Promise<void>;
}

type SettingsSection = 'seo' | 'hero' | 'stats' | 'intro' | 'video' | 'choice' | 'about' | 'blog' | 'footer' | 'system';

const SettingsTab: React.FC<SettingsTabProps> = ({
    data,
    onSave,
    onSync,
    onChange,
    onUploadLogo,
    onUploadFavicon,
    onUploadBackground,
    onUploadHeroBg,
    onUploadHeroChartImg,
    onUploadVideoGuide,
    onUploadVideoPoster
}) => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<SettingsSection>('seo');
    const [showPreview, setShowPreview] = useState(true);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const initialRef = useRef<any>(null);

    useEffect(() => {
        if (data && data.site_title && !initialRef.current) {
            initialRef.current = { ...data };
        }
    }, [data]);

    useEffect(() => {
        if (!initialRef.current) {
            setIsDirty(false);
            return;
        }

        const baseKeys = [
            'site_title', 'seo_description', 'seo_keywords', 'seo_author', 'logo_url',
            'favicon_url', 'background_url', 'hero_title', 'hero_highlight_text', 'hero_subtitle',
            'hero_primary_button_text', 'hero_secondary_button_text', 'hero_background_url',
            'hero_chart_image_url', 'stat_users_label', 'stat_users_value', 'stat_charts_label',
            'stat_charts_value', 'stat_accuracy_label', 'stat_accuracy_value', 'stat_support_label',
            'stat_support_value', 'intro_label', 'intro_title', 'intro_content', 'guide_video_label',
            'guide_video_enabled', 'guide_video_title', 'guide_video_subtitle', 'guide_video_url',
            'guide_video_poster_url', 'choice_window_title', 'choice_title', 'choice_subtitle',
            'choice_button_text', 'choice_option_1_title', 'choice_option_1_description',
            'choice_option_2_title', 'choice_option_2_description', 'choice_option_3_title',
            'choice_option_3_description', 'about_label', 'about_title', 'about_company_name',
            'about_content', 'about_address', 'about_hotline', 'about_working_time',
            'company_name', 'company_description', 'company_address', 'company_hotline', 'company_active_date',
            'blog_section_title', 'blog_section_enabled', 'footer_description', 'footer_column_1_title',
            'footer_column_2_title', 'footer_column_3_title', 'footer_address', 'footer_hotline',
            'footer_working_time', 'footer_copyright', 'rate', 'no_answer_fallback'
        ];

        const localizableKeys = [
            'site_title', 'seo_description', 'seo_keywords', 'seo_author', 'no_answer_fallback',
            'hero_title', 'hero_highlight_text', 'hero_subtitle', 'hero_primary_button_text', 'hero_secondary_button_text',
            'stat_users_label', 'stat_charts_label', 'stat_accuracy_label', 'stat_support_label',
            'intro_label', 'intro_title', 'intro_content', 'guide_video_label', 'guide_video_title', 'guide_video_subtitle',
            'choice_window_title', 'choice_title', 'choice_subtitle', 'choice_button_text',
            'choice_option_1_title', 'choice_option_1_description', 'choice_option_2_title', 'choice_option_2_description',
            'choice_option_3_title', 'choice_option_3_description', 'about_label', 'about_title', 'about_company_name',
            'about_content', 'about_address', 'about_working_time', 'blog_section_title', 'footer_description',
            'footer_column_1_title', 'footer_column_2_title', 'footer_column_3_title', 'footer_address', 'footer_working_time',
            'footer_copyright', 'company_name', 'company_description', 'company_address', 'company_active_date'
        ];

        const CONFIG_KEYS = [...baseKeys];
        localizableKeys.forEach(key => {
            CONFIG_KEYS.push(`${key}_vi`);
            CONFIG_KEYS.push(`${key}_en`);
        });

        const dirty = CONFIG_KEYS.some(key => {
            const currentVal = data[key] === undefined || data[key] === null ? '' : String(data[key]);
            const initialVal = initialRef.current[key] === undefined || initialRef.current[key] === null ? '' : String(initialRef.current[key]);
            return currentVal !== initialVal;
        });
        setIsDirty(dirty);
    }, [data]);

    const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
        {
            id: 'seo',
            label: t('admin.settings.seoLabel', 'SEO & Thương hiệu'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9c1.657 0 3 4.03 3 9s-1.343 9-3 9m0-18c-1.657 0-3 4.03-3 9s1.343 9 3 9m-9-9a9 9 0 019-9" />
                </svg>
            )
        },
        {
            id: 'hero',
            label: t('admin.settings.heroLabel', 'Hero Banner'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            id: 'stats',
            label: t('admin.settings.statsLabel', 'Số liệu thống kê'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            id: 'intro',
            label: t('admin.settings.introLabel', 'Nền tảng Chiêm tinh AI'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            )
        },
        {
            id: 'video',
            label: t('admin.settings.videoLabel', 'Video Hướng dẫn'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            id: 'choice',
            label: t('admin.settings.choiceLabel', 'Dịch vụ Chiêm tinh'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8v4" />
                </svg>
            )
        },
        {
            id: 'about',
            label: t('admin.settings.aboutLabel', 'Về chúng tôi / Công ty'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            id: 'blog',
            label: t('admin.settings.blogLabel', 'Cấu hình Blog'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            )
        },
        {
            id: 'footer',
            label: t('admin.settings.footerLabel', 'Chân trang (Footer)'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            id: 'system',
            label: t('admin.settings.systemLabel', 'Hệ thống & AI'),
            icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1350, margin: '0 auto', padding: '0 12px' }}>
            <style>{`
                @media (max-width: 1100px) {
                    .settings-form-layout {
                        flex-direction: column !important;
                    }
                    .preview-desktop-wrapper {
                        display: none !important;
                    }
                    .show-preview-mobile-btn {
                        display: inline-flex !important;
                    }
                }
            `}</style>

            <LandingPreviewModal
                isOpen={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                settings={data}
                activeSection={activeSection}
                isDirty={isDirty}
            />

            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
                {/* Header */}
                <div className="admin-card-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="admin-card-title" style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                                {t('admin.settings.title', 'Cấu hình hệ thống & Landing Page')}
                            </div>
                            {isDirty && (
                                <span style={{
                                    background: '#e11d48',
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}>
                                    <ShieldAlert size={10} />
                                    {t('admin.settings.unsavedChanges', 'Thay đổi chưa lưu')}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{t('admin.settings.subtitle', 'Tùy biến nội dung đa ngôn ngữ hiển thị ở giao diện và cài đặt AI.')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button
                             className="admin-btn admin-btn-sm admin-btn-outline"
                             type="button"
                             onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 onSync();
                             }}
                        >
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {t('admin.settings.syncBtn', 'Đồng bộ từ index.html')}
                        </button>

                        <button
                            className={`admin-btn admin-btn-sm ${showPreview ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowPreview(!showPreview);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <Eye size={14} />
                            {showPreview ? t('admin.settings.hidePreview', 'Ẩn xem trước') : t('admin.settings.showPreview', 'Xem trước')}
                        </button>
                    </div>
                </div>

                {/* Dashboard layout */}
                <form onSubmit={onSave} className="settings-form-layout" style={{ display: 'flex', minHeight: 560 }}>
                    {/* Left tabs menu */}
                    <div style={{ width: 260, backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {sections.map((sec) => {
                            const isActive = activeSection === sec.id;
                            return (
                                <button
                                    key={sec.id}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveSection(sec.id);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: 8,
                                        border: 'none',
                                        fontSize: 13,
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? '#fff' : '#475569',
                                        backgroundColor: isActive ? '#6d5dfc' : 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#fff' : '#64748b' }}>{sec.icon}</span>
                                    {sec.label}
                                </button>
                            );
                        })}

                        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                            <button
                                type="submit"
                                className="admin-btn"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    background: isDirty ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' : 'linear-gradient(135deg, #6d5dfc 0%, #5b4cf4 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    boxShadow: isDirty ? '0 4px 12px rgba(225, 29, 72, 0.3)' : '0 4px 12px rgba(109, 93, 252, 0.3)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {isDirty ? t('admin.settings.saveUnsaved', 'LƯU THAY ĐỔI CHƯA LƯU') : t('admin.settings.saveAll', 'LƯU TẤT CẢ CẤU HÌNH')}
                            </button>
                        </div>
                    </div>

                    {/* Right fields panel */}
                    <div style={{ flex: 1, padding: '24px 32px', maxHeight: 600, overflowY: 'auto' }}>
                        {/* Section: SEO & Brand */}
                        <div style={{ display: activeSection === 'seo' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.seoHeading', 'SEO & Thương hiệu')}</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.siteTitleVi', 'Tiêu đề Website (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="site_title_vi" value={data.site_title_vi || ''} onChange={onChange} placeholder="Tiêu đề tiếng Việt..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.siteTitleEn', 'Tiêu đề Website (English)')}</label>
                                    <input className="admin-input" name="site_title_en" value={data.site_title_en || ''} onChange={onChange} placeholder="Tiêu đề tiếng Anh..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.seoDescVi', 'Mô tả SEO (Tiếng Việt)')}</label>
                                    <textarea className="admin-textarea" name="seo_description_vi" value={data.seo_description_vi || ''} onChange={onChange} rows={3} placeholder="Mô tả tóm tắt tiếng Việt..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.seoDescEn', 'Mô tả SEO (English)')}</label>
                                    <textarea className="admin-textarea" name="seo_description_en" value={data.seo_description_en || ''} onChange={onChange} rows={3} placeholder="Mô tả tóm tắt tiếng Anh..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.seoKeywordsVi', 'Từ khóa SEO (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="seo_keywords_vi" value={data.seo_keywords_vi || ''} onChange={onChange} placeholder="chiêm tinh, ai chatbot..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.seoKeywordsEn', 'Từ khóa SEO (English)')}</label>
                                    <input className="admin-input" name="seo_keywords_en" value={data.seo_keywords_en || ''} onChange={onChange} placeholder="astrology, ai..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.seoAuthorVi', 'Tác giả (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="seo_author_vi" value={data.seo_author_vi || ''} onChange={onChange} placeholder="Zodiac Whisper Team" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.seoAuthorEn', 'Tác giả (English)')}</label>
                                    <input className="admin-input" name="seo_author_en" value={data.seo_author_en || ''} onChange={onChange} placeholder="Zodiac Whisper Team" />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8 }}>
                                <label className="admin-input-label">{t('admin.settings.siteLogo', 'Logo Website')}</label>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <input className="admin-input" name="logo_url" value={data.logo_url || ''} onChange={onChange} placeholder="Đường dẫn ảnh logo..." />
                                        <label className="admin-btn admin-btn-sm admin-btn-outline" style={{ marginTop: 8, cursor: 'pointer', display: 'inline-flex' }}>
                                            {t('admin.settings.uploadLogo', 'Tải ảnh Logo lên')}
                                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadLogo(f); }} />
                                        </label>
                                    </div>
                                    {data.logo_url && <img src={getImageUrl(data.logo_url)} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'contain', border: '1px solid #cbd5e1', padding: 4 }} alt="Logo Preview" />}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                <label className="admin-input-label">{t('admin.settings.siteFavicon', 'Favicon Website')}</label>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <input className="admin-input" name="favicon_url" value={data.favicon_url || ''} onChange={onChange} placeholder="Đường dẫn favicon.ico hoặc favicon.svg..." />
                                        <label className="admin-btn admin-btn-sm admin-btn-outline" style={{ marginTop: 8, cursor: 'pointer', display: 'inline-flex' }}>
                                            {t('admin.settings.uploadFavicon', 'Tải Favicon lên')}
                                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadFavicon(f); }} />
                                        </label>
                                    </div>
                                    {data.favicon_url && <img src={getImageUrl(data.favicon_url)} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'contain', border: '1px solid #cbd5e1' }} alt="Favicon Preview" />}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                <label className="admin-input-label">{t('admin.settings.siteBg', 'Ảnh nền Website (Background)')}</label>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <input className="admin-input" name="background_url" value={data.background_url || ''} onChange={onChange} placeholder="Đường dẫn ảnh nền hệ thống..." />
                                        <label className="admin-btn admin-btn-sm admin-btn-outline" style={{ marginTop: 8, cursor: 'pointer', display: 'inline-flex' }}>
                                            {t('admin.settings.uploadBg', 'Tải ảnh nền lên')}
                                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadBackground(f); }} />
                                        </label>
                                    </div>
                                    {data.background_url && <img src={getImageUrl(data.background_url)} style={{ width: 120, height: 60, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }} alt="Background Preview" />}
                                </div>
                            </div>
                        </div>

                        {/* Section: Hero Banner */}
                        <div style={{ display: activeSection === 'hero' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.heroHeading', 'Cấu hình Hero Banner (Đầu trang Landing)')}</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroTitleVi', 'Tiêu đề chính (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="hero_title_vi" value={data.hero_title_vi || ''} onChange={onChange} placeholder="Ví dụ: Khai mở vận mệnh cùng AI" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroTitleEn', 'Tiêu đề chính (English)')}</label>
                                    <input className="admin-input" name="hero_title_en" value={data.hero_title_en || ''} onChange={onChange} placeholder="Example: Unlock destiny with AI" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroHighlightVi', 'Văn bản nổi bật (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="hero_highlight_text_vi" value={data.hero_highlight_text_vi || ''} onChange={onChange} placeholder="Ví dụ: AI hàng đầu" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroHighlightEn', 'Văn bản nổi bật (English)')}</label>
                                    <input className="admin-input" name="hero_highlight_text_en" value={data.hero_highlight_text_en || ''} onChange={onChange} placeholder="Example: Leading AI" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroSubtitleVi', 'Tiêu đề phụ / Mô tả (Tiếng Việt)')}</label>
                                    <textarea className="admin-textarea" name="hero_subtitle_vi" value={data.hero_subtitle_vi || ''} onChange={onChange} rows={3} placeholder="Ví dụ: Khám phá bản đồ sao cá nhân để thấu hiểu vận mệnh..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroSubtitleEn', 'Tiêu đề phụ / Mô tả (English)')}</label>
                                    <textarea className="admin-textarea" name="hero_subtitle_en" value={data.hero_subtitle_en || ''} onChange={onChange} rows={3} placeholder="Example: Discover personal birth chart to understand destiny..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroPrimaryBtnVi', 'Văn bản nút chính (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="hero_primary_button_text_vi" value={data.hero_primary_button_text_vi || ''} onChange={onChange} placeholder="Tạo bản đồ sao" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroPrimaryBtnEn', 'Văn bản nút chính (English)')}</label>
                                    <input className="admin-input" name="hero_primary_button_text_en" value={data.hero_primary_button_text_en || ''} onChange={onChange} placeholder="Create Birth Chart" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroSecondaryBtnVi', 'Văn bản nút phụ (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="hero_secondary_button_text_vi" value={data.hero_secondary_button_text_vi || ''} onChange={onChange} placeholder="Tìm hiểu thêm" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.heroSecondaryBtnEn', 'Văn bản nút phụ (English)')}</label>
                                    <input className="admin-input" name="hero_secondary_button_text_en" value={data.hero_secondary_button_text_en || ''} onChange={onChange} placeholder="Learn More" />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                <label className="admin-input-label">{t('admin.settings.heroBg', 'Hình nền Hero (Hero Background Image)')}</label>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <input className="admin-input" name="hero_background_url" value={data.hero_background_url || ''} onChange={onChange} placeholder="Đường dẫn ảnh nền khu vực hero..." />
                                        <label className="admin-btn admin-btn-sm admin-btn-outline" style={{ marginTop: 8, cursor: 'pointer', display: 'inline-flex' }}>
                                            {t('admin.settings.uploadHeroBg', 'Tải ảnh nền Hero lên')}
                                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadHeroBg(f); }} />
                                        </label>
                                    </div>
                                    {data.hero_background_url && <img src={getImageUrl(data.hero_background_url)} style={{ width: 120, height: 60, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }} alt="Hero BG Preview" />}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                <label className="admin-input-label">{t('admin.settings.heroChartImg', 'Ảnh đồ thị/Minh họa bản đồ sao (Hero Chart Image)')}</label>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <input className="admin-input" name="hero_chart_image_url" value={data.hero_chart_image_url || ''} onChange={onChange} placeholder="Đường dẫn ảnh vòng tròn bản đồ sao minh họa..." />
                                        <label className="admin-btn admin-btn-sm admin-btn-outline" style={{ marginTop: 8, cursor: 'pointer', display: 'inline-flex' }}>
                                            {t('admin.settings.uploadHeroChartImg', 'Tải ảnh minh họa lên')}
                                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadHeroChartImg(f); }} />
                                        </label>
                                    </div>
                                    {data.hero_chart_image_url && <img src={getImageUrl(data.hero_chart_image_url)} style={{ width: 80, height: 80, borderRadius: 80, objectFit: 'contain', border: '1px solid #cbd5e1' }} alt="Chart Img Preview" />}
                                </div>
                            </div>
                        </div>

                        {/* Section: Stats Counter */}
                        <div style={{ display: activeSection === 'stats' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.statsHeading', 'Số liệu thống kê (Stats Section)')}</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.stat1LabelVi', 'Thống kê 1: Nhãn (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="stat_users_label_vi" value={data.stat_users_label_vi || ''} onChange={onChange} placeholder="NGƯỜI DÙNG TIN TƯỞNG" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.stat1LabelEn', 'Thống kê 1: Nhãn (English)')}</label>
                                    <input className="admin-input" name="stat_users_label_en" value={data.stat_users_label_en || ''} onChange={onChange} placeholder="TRUSTED USERS" />
                                </div>
                            </div>
                            <div>
                                <label className="admin-input-label">{t('admin.settings.stat1Value', 'Thống kê 1: Giá trị (Dùng chung)')}</label>
                                <input className="admin-input" name="stat_users_value" value={data.stat_users_value || ''} onChange={onChange} placeholder="Ví dụ: 500.000+" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.stat2LabelVi', 'Thống kê 2: Nhãn (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="stat_charts_label_vi" value={data.stat_charts_label_vi || ''} onChange={onChange} placeholder="BẢN ĐỒ SAO ĐƯỢC TẠO" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.stat2LabelEn', 'Thống kê 2: Nhãn (English)')}</label>
                                    <input className="admin-input" name="stat_charts_label_en" value={data.stat_charts_label_en || ''} onChange={onChange} placeholder="CHARTS CREATED" />
                                </div>
                            </div>
                            <div>
                                <label className="admin-input-label">{t('admin.settings.stat2Value', 'Thống kê 2: Giá trị (Dùng chung)')}</label>
                                <input className="admin-input" name="stat_charts_value" value={data.stat_charts_value || ''} onChange={onChange} placeholder="Ví dụ: 1.000.000+" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.stat3LabelVi', 'Thống kê 3: Nhãn (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="stat_accuracy_label_vi" value={data.stat_accuracy_label_vi || ''} onChange={onChange} placeholder="ĐỘ CHÍNH XÁC AI" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.stat3LabelEn', 'Thống kê 3: Nhãn (English)')}</label>
                                    <input className="admin-input" name="stat_accuracy_label_en" value={data.stat_accuracy_label_en || ''} onChange={onChange} placeholder="AI ACCURACY" />
                                </div>
                            </div>
                            <div>
                                <label className="admin-input-label">{t('admin.settings.stat3Value', 'Thống kê 3: Giá trị (Dùng chung)')}</label>
                                <input className="admin-input" name="stat_accuracy_value" value={data.stat_accuracy_value || ''} onChange={onChange} placeholder="Ví dụ: 99.8%" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.stat4LabelVi', 'Thống kê 4: Nhãn (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="stat_support_label_vi" value={data.stat_support_label_vi || ''} onChange={onChange} placeholder="HỖ TRỢ CHIÊM TINH" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.stat4LabelEn', 'Thống kê 4: Nhãn (English)')}</label>
                                    <input className="admin-input" name="stat_support_label_en" value={data.stat_support_label_en || ''} onChange={onChange} placeholder="ASTROLOGY SUPPORT" />
                                </div>
                            </div>
                            <div>
                                <label className="admin-input-label">{t('admin.settings.stat4Value', 'Thống kê 4: Giá trị (Dùng chung)')}</label>
                                <input className="admin-input" name="stat_support_value" value={data.stat_support_value || ''} onChange={onChange} placeholder="Ví dụ: 24/7" />
                            </div>
                        </div>

                        {/* Section: Intro Section */}
                        <div style={{ display: activeSection === 'intro' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.introHeading', 'Nền tảng Chiêm tinh AI')}</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.introLabelVi', 'Nhãn tiêu đề nhỏ (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="intro_label_vi" value={data.intro_label_vi || ''} onChange={onChange} placeholder="VỀ ZODIAC WHISPER" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.introLabelEn', 'Nhãn tiêu đề nhỏ (English)')}</label>
                                    <input className="admin-input" name="intro_label_en" value={data.intro_label_en || ''} onChange={onChange} placeholder="ABOUT ZODIAC WHISPER" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.introTitleVi', 'Tiêu đề lớn (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="intro_title_vi" value={data.intro_title_vi || ''} onChange={onChange} placeholder="Nền tảng Chiêm tinh AI hàng đầu" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.introTitleEn', 'Tiêu đề lớn (English)')}</label>
                                    <input className="admin-input" name="intro_title_en" value={data.intro_title_en || ''} onChange={onChange} placeholder="Leading AI Astrology Platform" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.introContentVi', 'Nội dung giới thiệu chi tiết (Tiếng Việt)')}</label>
                                    <textarea className="admin-textarea" name="intro_content_vi" value={data.intro_content_vi || ''} onChange={onChange} rows={6} placeholder="Zodiac Whisper là hệ sinh thái kết hợp chiêm tinh..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.introContentEn', 'Nội dung giới thiệu chi tiết (English)')}</label>
                                    <textarea className="admin-textarea" name="intro_content_en" value={data.intro_content_en || ''} onChange={onChange} rows={6} placeholder="Zodiac Whisper is a technology ecosystem combining..." />
                                </div>
                            </div>
                        </div>

                        {/* Section: Video Guide Section */}
                        <div style={{ display: activeSection === 'video' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.videoHeading', 'Video Hướng dẫn sử dụng')}</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.videoLabelVi', 'Nhãn phần video (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="guide_video_label_vi" value={data.guide_video_label_vi || ''} onChange={onChange} placeholder="VIDEO HƯỚNG DẪN" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.videoLabelEn', 'Nhãn phần video (English)')}</label>
                                    <input className="admin-input" name="guide_video_label_en" value={data.guide_video_label_en || ''} onChange={onChange} placeholder="VIDEO GUIDE" />
                                </div>
                            </div>

                            <div>
                                <label className="admin-input-label">{t('admin.settings.videoEnabled', 'Trạng thái hiển thị phần video')}</label>
                                <select className="admin-input" name="guide_video_enabled" value={data.guide_video_enabled || 'true'} onChange={onChange}>
                                    <option value="true">{t('admin.settings.showVideoArea', 'Hiển thị khu vực Video')}</option>
                                    <option value="false">{t('admin.settings.hideVideoArea', 'Ẩn khu vực Video')}</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.videoTitleVi', 'Tiêu đề video (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="guide_video_title_vi" value={data.guide_video_title_vi || ''} onChange={onChange} placeholder="Hướng dẫn sử dụng Zodiac Whisper" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.videoTitleEn', 'Tiêu đề video (English)')}</label>
                                    <input className="admin-input" name="guide_video_title_en" value={data.guide_video_title_en || ''} onChange={onChange} placeholder="How to use Zodiac Whisper" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.videoSubtitleVi', 'Mô tả ngắn dưới tiêu đề (Tiếng Việt)')}</label>
                                    <textarea className="admin-textarea" name="guide_video_subtitle_vi" value={data.guide_video_subtitle_vi || ''} onChange={onChange} rows={2} placeholder="Xem video ngắn..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.videoSubtitleEn', 'Mô tả ngắn dưới tiêu đề (English)')}</label>
                                    <textarea className="admin-textarea" name="guide_video_subtitle_en" value={data.guide_video_subtitle_en || ''} onChange={onChange} rows={2} placeholder="Watch a short video..." />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                <label className="admin-input-label">{t('admin.settings.videoUrl', 'Đường dẫn Video (.mp4)')}</label>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <input className="admin-input" name="guide_video_url" value={data.guide_video_url || ''} onChange={onChange} placeholder="Ví dụ: /videos/guide.mp4 hoặc link URL..." />
                                        <label className="admin-btn admin-btn-sm admin-btn-outline" style={{ marginTop: 8, cursor: 'pointer', display: 'inline-flex' }}>
                                            {t('admin.settings.uploadVideo', 'Tải Video .mp4 lên (tối đa 100MB)')}
                                            <input type="file" style={{ display: 'none' }} accept="video/mp4" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadVideoGuide(f); }} />
                                        </label>
                                    </div>
                                </div>
                                {data.guide_video_url && (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{t('admin.settings.videoPreview', 'Xem trước video:')}</div>
                                        <video
                                            src={getImageUrl(data.guide_video_url)}
                                            controls
                                            style={{ width: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #cbd5e1', backgroundColor: '#000' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                <label className="admin-input-label">{t('admin.settings.videoPoster', 'Ảnh bìa video (Video Poster Image)')}</label>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <input className="admin-input" name="guide_video_poster_url" value={data.guide_video_poster_url || ''} onChange={onChange} placeholder="Đường dẫn ảnh bìa khi video chưa chạy..." />
                                        <label className="admin-btn admin-btn-sm admin-btn-outline" style={{ marginTop: 8, cursor: 'pointer', display: 'inline-flex' }}>
                                            {t('admin.settings.uploadPoster', 'Tải ảnh bìa lên')}
                                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadVideoPoster(f); }} />
                                        </label>
                                    </div>
                                    {data.guide_video_poster_url && <img src={getImageUrl(data.guide_video_poster_url)} style={{ width: 120, height: 68, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }} alt="Poster Preview" />}
                                </div>
                            </div>
                        </div>

                        {/* Section: Choice Section */}
                        <div style={{ display: activeSection === 'choice' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.choiceHeading', 'Lựa chọn dịch vụ (Bạn muốn xem điều gì?)')}</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.choiceChatTitleVi', 'Tiêu đề khung chat (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="choice_window_title_vi" value={data.choice_window_title_vi || ''} onChange={onChange} placeholder="Zodiac Whisper" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.choiceChatTitleEn', 'Tiêu đề khung chat (English)')}</label>
                                    <input className="admin-input" name="choice_window_title_en" value={data.choice_window_title_en || ''} onChange={onChange} placeholder="Zodiac Whisper" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.choiceTitleVi', 'Tiêu đề chính (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="choice_title_vi" value={data.choice_title_vi || ''} onChange={onChange} placeholder="Bạn muốn xem điều gì?" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.choiceTitleEn', 'Tiêu đề chính (English)')}</label>
                                    <input className="admin-input" name="choice_title_en" value={data.choice_title_en || ''} onChange={onChange} placeholder="What do you want to see?" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.choiceSubtitleVi', 'Tiêu đề phụ / Mô tả (Tiếng Việt)')}</label>
                                    <textarea className="admin-textarea" name="choice_subtitle_vi" value={data.choice_subtitle_vi || ''} onChange={onChange} rows={2} placeholder="Hãy chọn một trong những..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.choiceSubtitleEn', 'Tiêu đề phụ / Mô tả (English)')}</label>
                                    <textarea className="admin-textarea" name="choice_subtitle_en" value={data.choice_subtitle_en || ''} onChange={onChange} rows={2} placeholder="Select one of our special..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.choiceStartBtnVi', 'Văn bản nút bắt đầu (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="choice_button_text_vi" value={data.choice_button_text_vi || ''} onChange={onChange} placeholder="Trò chuyện ngay" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.choiceStartBtnEn', 'Văn bản nút bắt đầu (English)')}</label>
                                    <input className="admin-input" name="choice_button_text_en" value={data.choice_button_text_en || ''} onChange={onChange} placeholder="Chat Now" />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 12 }}>{t('admin.settings.choiceCustomLabel', 'Tùy biến các gói dịch vụ hiển thị')}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    
                                    <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 600, fontSize: 12, color: '#6d5dfc', marginBottom: 8 }}>{t('admin.settings.service1Label', 'DỊCH VỤ 1: BẢN ĐỒ SAO CÁ NHÂN')}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <input className="admin-input" name="choice_option_1_title_vi" value={data.choice_option_1_title_vi || ''} onChange={onChange} placeholder={t('admin.settings.optionTitleVi', 'Tiêu đề (Tiếng Việt)')} />
                                                <input className="admin-input" name="choice_option_1_title_en" value={data.choice_option_1_title_en || ''} onChange={onChange} placeholder={t('admin.settings.optionTitleEn', 'Title (English)')} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <textarea className="admin-textarea" name="choice_option_1_description_vi" value={data.choice_option_1_description_vi || ''} onChange={onChange} rows={2} placeholder={t('admin.settings.optionDescVi', 'Mô tả (Tiếng Việt)')} />
                                                <textarea className="admin-textarea" name="choice_option_1_description_en" value={data.choice_option_1_description_en || ''} onChange={onChange} rows={2} placeholder={t('admin.settings.optionDescEn', 'Description (English)')} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 600, fontSize: 12, color: '#6d5dfc', marginBottom: 8 }}>{t('admin.settings.service2Label', 'DỊCH VỤ 2: ĐỘ HỢP NHAU CẶP ĐÔI')}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <input className="admin-input" name="choice_option_2_title_vi" value={data.choice_option_2_title_vi || ''} onChange={onChange} placeholder={t('admin.settings.optionTitleVi', 'Tiêu đề (Tiếng Việt)')} />
                                                <input className="admin-input" name="choice_option_2_title_en" value={data.choice_option_2_title_en || ''} onChange={onChange} placeholder={t('admin.settings.optionTitleEn', 'Title (English)')} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <textarea className="admin-textarea" name="choice_option_2_description_vi" value={data.choice_option_2_description_vi || ''} onChange={onChange} rows={2} placeholder={t('admin.settings.optionDescVi', 'Mô tả (Tiếng Việt)')} />
                                                <textarea className="admin-textarea" name="choice_option_2_description_en" value={data.choice_option_2_description_en || ''} onChange={onChange} rows={2} placeholder={t('admin.settings.optionDescEn', 'Description (English)')} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 600, fontSize: 12, color: '#6d5dfc', marginBottom: 8 }}>{t('admin.settings.service3Label', 'DỊCH VỤ 3: DỰ ĐOÁN HÀNG NGÀY / THÁNG')}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <input className="admin-input" name="choice_option_3_title_vi" value={data.choice_option_3_title_vi || ''} onChange={onChange} placeholder={t('admin.settings.optionTitleVi', 'Tiêu đề (Tiếng Việt)')} />
                                                <input className="admin-input" name="choice_option_3_title_en" value={data.choice_option_3_title_en || ''} onChange={onChange} placeholder={t('admin.settings.optionTitleEn', 'Title (English)')} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <textarea className="admin-textarea" name="choice_option_3_description_vi" value={data.choice_option_3_description_vi || ''} onChange={onChange} rows={2} placeholder={t('admin.settings.optionDescVi', 'Mô tả (Tiếng Việt)')} />
                                                <textarea className="admin-textarea" name="choice_option_3_description_en" value={data.choice_option_3_description_en || ''} onChange={onChange} rows={2} placeholder={t('admin.settings.optionDescEn', 'Description (English)')} />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Section: About Section */}
                        <div style={{ display: activeSection === 'about' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.aboutHeading', 'Về chúng tôi (About Company)')}</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.aboutLabelVi', 'Nhãn phụ tiêu đề (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="about_label_vi" value={data.about_label_vi || ''} onChange={onChange} placeholder="VỀ CHÚNG TÔI" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.aboutLabelEn', 'Nhãn phụ tiêu đề (English)')}</label>
                                    <input className="admin-input" name="about_label_en" value={data.about_label_en || ''} onChange={onChange} placeholder="ABOUT US" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.aboutTitleVi', 'Tiêu đề chính (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="about_title_vi" value={data.about_title_vi || ''} onChange={onChange} placeholder="Đội ngũ Zodiac Whisper" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.aboutTitleEn', 'Tiêu đề chính (English)')}</label>
                                    <input className="admin-input" name="about_title_en" value={data.about_title_en || ''} onChange={onChange} placeholder="Zodiac Whisper Team" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.companyNameVi', 'Tên công ty hiển thị (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="company_name_vi" value={data.company_name_vi || data.about_company_name_vi || ''} onChange={onChange} placeholder="CÔNG TY TNHH MỘT THÀNH VIÊN CÔNG NGHỆ KỸ THUẬT TIÊN PHONG" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.companyNameEn', 'Tên công ty hiển thị (English)')}</label>
                                    <input className="admin-input" name="company_name_en" value={data.company_name_en || data.about_company_name_en || ''} onChange={onChange} placeholder="PIONEER ENGINEERING TECHNOLOGY ONE MEMBER COMPANY LIMITED" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.companyDescVi', 'Nội dung giới thiệu về công ty (Tiếng Việt)')}</label>
                                    <textarea className="admin-textarea" name="company_description_vi" value={data.company_description_vi || data.about_content_vi || ''} onChange={onChange} rows={5} placeholder="Chuyên cung cấp giải pháp công nghệ kỹ thuật cao..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.companyDescEn', 'Nội dung giới thiệu về công ty (English)')}</label>
                                    <textarea className="admin-textarea" name="company_description_en" value={data.company_description_en || data.about_content_en || ''} onChange={onChange} rows={5} placeholder="Specializing in high-tech solutions..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.companyAddressVi', 'Địa chỉ trụ sở công ty (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="company_address_vi" value={data.company_address_vi || data.about_address_vi || ''} onChange={onChange} placeholder="P16, Đường số 8, KDC lô 49..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.companyAddressEn', 'Địa chỉ trụ sở công ty (English)')}</label>
                                    <input className="admin-input" name="company_address_en" value={data.company_address_en || data.about_address_en || ''} onChange={onChange} placeholder="P16, Street 8, Block 49..." />
                                </div>
                            </div>

                            <div>
                                <label className="admin-input-label">{t('admin.settings.companyHotline', 'Đường dây nóng (Hotline - Dùng chung)')}</label>
                                <input className="admin-input" name="company_hotline" value={data.company_hotline || data.about_hotline || ''} onChange={onChange} placeholder="0916 416 409" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.companyActiveDateVi', 'Ngày hoạt động (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="company_active_date_vi" value={data.company_active_date_vi || data.about_working_time_vi || ''} onChange={onChange} placeholder="05/04/2017" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.companyActiveDateEn', 'Ngày hoạt động (English)')}</label>
                                    <input className="admin-input" name="company_active_date_en" value={data.company_active_date_en || data.about_working_time_en || ''} onChange={onChange} placeholder="05/04/2017" />
                                </div>
                            </div>
                        </div>

                        {/* Section: Blog Section */}
                        <div style={{ display: activeSection === 'blog' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.blogHeading', 'Cấu hình Hiển thị Blog')}</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.blogTitleVi', 'Tiêu đề khu vực Blog (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="blog_section_title_vi" value={data.blog_section_title_vi || ''} onChange={onChange} placeholder="Bài viết mới nhất" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.blogTitleEn', 'Tiêu đề khu vực Blog (English)')}</label>
                                    <input className="admin-input" name="blog_section_title_en" value={data.blog_section_title_en || ''} onChange={onChange} placeholder="Latest Posts" />
                                </div>
                            </div>

                            <div>
                                <label className="admin-input-label">{t('admin.settings.blogEnabled', 'Trạng thái hiển thị danh sách bài viết')}</label>
                                <select className="admin-input" name="blog_section_enabled" value={data.blog_section_enabled || 'true'} onChange={onChange}>
                                    <option value="true">{t('admin.settings.showBlogLanding', 'Hiển thị Blog ở Landing Page')}</option>
                                    <option value="false">{t('admin.settings.hideBlogLanding', 'Ẩn Blog ở Landing Page')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Section: Footer Settings */}
                        <div style={{ display: activeSection === 'footer' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.footerHeading', 'Chân trang (Footer)')}</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerDescVi', 'Mô tả ngắn ở Footer (Tiếng Việt)')}</label>
                                    <textarea className="admin-textarea" name="footer_description_vi" value={data.footer_description_vi || ''} onChange={onChange} rows={3} placeholder="Hệ thống chuyên gia chiêm tinh AI..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerDescEn', 'Mô tả ngắn ở Footer (English)')}</label>
                                    <textarea className="admin-textarea" name="footer_description_en" value={data.footer_description_en || ''} onChange={onChange} rows={3} placeholder="AI astrology expert system..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerCol1Vi', 'Tiêu đề Cột 1 (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="footer_column_1_title_vi" value={data.footer_column_1_title_vi || ''} onChange={onChange} placeholder="DỊCH VỤ" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerCol1En', 'Tiêu đề Cột 1 (English)')}</label>
                                    <input className="admin-input" name="footer_column_1_title_en" value={data.footer_column_1_title_en || ''} onChange={onChange} placeholder="SERVICES" />
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerCol2Vi', 'Tiêu đề Cột 2 (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="footer_column_2_title_vi" value={data.footer_column_2_title_vi || ''} onChange={onChange} placeholder="LIÊN KẾT CHÍNH" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerCol2En', 'Tiêu đề Cột 2 (English)')}</label>
                                    <input className="admin-input" name="footer_column_2_title_en" value={data.footer_column_2_title_en || ''} onChange={onChange} placeholder="QUICK LINKS" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerCol3Vi', 'Tiêu đề Cột 3 (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="footer_column_3_title_vi" value={data.footer_column_3_title_vi || ''} onChange={onChange} placeholder="THÔNG TIN LIÊN HỆ" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerCol3En', 'Tiêu đề Cột 3 (English)')}</label>
                                    <input className="admin-input" name="footer_column_3_title_en" value={data.footer_column_3_title_en || ''} onChange={onChange} placeholder="CONTACT INFO" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerAddressVi', 'Địa chỉ liên hệ (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="footer_address_vi" value={data.footer_address_vi || ''} onChange={onChange} placeholder="Khu Công nghệ cao, Quận 9..." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerAddressEn', 'Địa chỉ liên hệ (English)')}</label>
                                    <input className="admin-input" name="footer_address_en" value={data.footer_address_en || ''} onChange={onChange} placeholder="High-Tech Park..." />
                                </div>
                            </div>

                            <div>
                                <label className="admin-input-label">{t('admin.settings.footerHotline', 'Hotline liên hệ (Dùng chung)')}</label>
                                <input className="admin-input" name="footer_hotline" value={data.footer_hotline || ''} onChange={onChange} placeholder="1900-123-456" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerWorkingTimeVi', 'Thời gian hoạt động (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="footer_working_time_vi" value={data.footer_working_time_vi || ''} onChange={onChange} placeholder="8:00 - 18:00 (Thứ 2 - Thứ 6)" />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerWorkingTimeEn', 'Thời gian hoạt động (English)')}</label>
                                    <input className="admin-input" name="footer_working_time_en" value={data.footer_working_time_en || ''} onChange={onChange} placeholder="8:00 AM - 6:00 PM (Monday - Friday)" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerCopyrightVi', 'Bản quyền (Tiếng Việt)')}</label>
                                    <input className="admin-input" name="footer_copyright_vi" value={data.footer_copyright_vi || ''} onChange={onChange} placeholder="© 2026 Zodiac Whisper. All rights reserved." />
                                </div>
                                <div>
                                    <label className="admin-input-label">{t('admin.settings.footerCopyrightEn', 'Bản quyền (English)')}</label>
                                    <input className="admin-input" name="footer_copyright_en" value={data.footer_copyright_en || ''} onChange={onChange} placeholder="© 2026 Zodiac Whisper. All rights reserved." />
                                </div>
                            </div>
                        </div>

                        {/* Section: Token System & AI */}
                        <div style={{ display: activeSection === 'system' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #6d5dfc', paddingBottom: 8, marginBottom: 4 }}>{t('admin.settings.systemHeading', 'Cấu hình Token & AI Chatbot')}</h3>
                            <div>
                                <label className="admin-input-label">{t('admin.settings.tokensRate', 'Số Tokens / 1000 tokens xử lý')}</label>
                                <input className="admin-input" name="rate" type="number" step="0.01" value={data.rate || 0} onChange={onChange} />
                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>{t('admin.settings.tokensRateNote', 'Mức phí áp dụng cho mỗi 1000 tokens xử lý qua AI')}</div>
                            </div>
                            
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="admin-input-label">{t('admin.settings.aiErrorFallbackVi', 'Câu trả lời mặc định khi AI lỗi (Tiếng Việt)')}</label>
                                        <textarea className="admin-textarea" name="no_answer_fallback_vi" value={data.no_answer_fallback_vi || ''} onChange={onChange} rows={4} placeholder="Câu trả lời khi AI không tìm được kết quả..." />
                                    </div>
                                    <div>
                                        <label className="admin-input-label">{t('admin.settings.aiErrorFallbackEn', 'Câu trả lời mặc định khi AI lỗi (English)')}</label>
                                        <textarea className="admin-textarea" name="no_answer_fallback_en" value={data.no_answer_fallback_en || ''} onChange={onChange} rows={4} placeholder="Default response on AI error..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Realtime Preview Panel */}
                    {showPreview && (
                        <div className="preview-desktop-wrapper" style={{ width: 380, borderLeft: '1px solid #e2e8f0', background: '#06060a', padding: 12, display: 'flex', flexDirection: 'column' }}>
                            <LandingPreview
                                settings={data}
                                activeSection={activeSection}
                                onClose={() => setShowPreview(false)}
                                onExpand={() => setPreviewModalOpen(true)}
                                isDirty={isDirty}
                            />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default SettingsTab;
