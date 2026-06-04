import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../../api';
import { useTranslation } from 'react-i18next';
import { confirmDestructive } from '../../utils/swal';

interface BlogTabProps {
    onShowToast: (msg: string, type: 'success' | 'error') => void;
}

const BlogTab: React.FC<BlogTabProps> = ({ onShowToast }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPost, setEditingPost] = useState<any>(null);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const res = await api.adminGetBlogPosts();
            setPosts(res.posts);
        } catch { onShowToast(t('admin.loadPostFailed'), 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPosts(); }, []);

    const handleDelete = async (id: number) => {
        const confirmed = await confirmDestructive(
            t('admin.deletePostConfirmTitle') || 'Xóa bài viết',
            t('admin.deletePostConfirm') || 'Bạn có chắc chắn muốn xóa bài viết này?'
        );
        if (!confirmed) return;
        try { await api.adminDeleteBlogPost(id); onShowToast(t('admin.deleteSuccess'), 'success'); fetchPosts(); }
        catch { onShowToast(t('admin.deleteFailed'), 'error'); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPost.id) { await api.adminUpdateBlogPost(editingPost.id, editingPost); onShowToast(t('admin.updateSuccess'), 'success'); }
            else { await api.adminCreateBlogPost(editingPost); onShowToast(t('admin.createSuccess'), 'success'); }
            setIsEditing(false);
            setTimeout(() => window.location.reload(), 800);
        } catch { onShowToast(t('admin.savePostFailed'), 'error'); }
    };

    if (loading) return (
        <div className="admin-card"><div className="admin-card-body" style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>{t('common.loading')}</div></div>
    );

    if (isEditing) {
        return (
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <div className="admin-card">
                    <div className="admin-card-header">
                        <div className="admin-card-title">{editingPost.id ? t('admin.editPost') : t('admin.newPost')}</div>
                        <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => setIsEditing(false)}>← {t('common.back')}</button>
                    </div>
                    <div className="admin-card-body">
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div><label className="admin-input-label">{t('admin.postTitle')}</label><input className="admin-input" required value={editingPost.title} onChange={e => setEditingPost({ ...editingPost, title: e.target.value })} /></div>
                            <div><label className="admin-input-label">{t('admin.postSlug')}</label><input className="admin-input" required value={editingPost.slug} onChange={e => setEditingPost({ ...editingPost, slug: e.target.value })} placeholder="vi-du-duong-dan" /></div>
                            <div><label className="admin-input-label">{t('admin.postExcerpt')}</label><textarea className="admin-textarea" required value={editingPost.excerpt} onChange={e => setEditingPost({ ...editingPost, excerpt: e.target.value })} rows={3} /></div>
                            <div>
                                <label className="admin-input-label">{t('admin.postImage')}</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="admin-input" value={editingPost.image_url} onChange={e => setEditingPost({ ...editingPost, image_url: e.target.value })} placeholder={t('admin.imageUrlPlaceholder', 'URL ảnh...')} style={{ flex: 1 }} />
                                    <label className="admin-btn admin-btn-sm admin-btn-outline" style={{ cursor: 'pointer' }}>
                                        {t('admin.uploadImage')}
                                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={async e => {
                                            const f = e.target.files?.[0];
                                            if (f) { try { const res = await api.adminUploadBlogImage(f); setEditingPost({ ...editingPost, image_url: res.image_url }); onShowToast(t('admin.uploadSuccess', 'Tải lên thành công.'), 'success'); } catch { onShowToast(t('common.error'), 'error'); } }
                                        }} />
                                    </label>
                                </div>
                                {editingPost.image_url && <img src={getImageUrl(editingPost.image_url)} style={{ height: 80, borderRadius: 8, marginTop: 8, objectFit: 'cover' }} alt="Preview" />}
                            </div>
                            <div><label className="admin-input-label">{t('admin.postContent')}</label><textarea className="admin-textarea" required value={editingPost.content} onChange={e => setEditingPost({ ...editingPost, content: e.target.value })} rows={10} style={{ fontFamily: 'monospace' }} /></div>
                            <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', padding: 12 }}>{t('admin.savePost')}</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="admin-card" style={{ marginBottom: 16 }}>
                <div className="admin-card-header">
                    <div><div className="admin-card-title">{t('admin.managePost')}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{t('admin.postSubtitle')}</div></div>
                    <button className="admin-btn admin-btn-primary" onClick={() => { setEditingPost({ title: '', excerpt: '', content: '', image_url: '', slug: '' }); setIsEditing(true); }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                        {t('admin.addPost')}
                    </button>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="admin-card"><div className="admin-card-body"><div className="admin-empty"><div className="admin-empty-text">{t('admin.noPost')}</div></div></div></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {posts.map(post => (
                        <div key={post.id} className="admin-card" style={{ marginBottom: 0 }}>
                            <div style={{ height: 160, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                                <img src={getImageUrl(post.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={post.title} />
                                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                                    <button className="admin-btn admin-btn-sm admin-btn-outline" style={{ background: 'rgba(255,255,255,0.9)' }} onClick={() => { setEditingPost({ ...post }); setIsEditing(true); }}>
                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                    </button>
                                    <button className="admin-btn admin-btn-sm admin-btn-danger" style={{ background: 'rgba(255,255,255,0.9)' }} onClick={() => handleDelete(post.id)}>
                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: 16 }}>
                                <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</h4>
                                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', fontWeight: 600 }}>
                                    <span>{post.slug}</span>
                                    <span>{(() => {
                                        if (!post.created_at) return '—';
                                        const d = new Date(post.created_at);
                                        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'vi-VN');
                                    })()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogTab;
