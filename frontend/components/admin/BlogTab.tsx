import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../../api';

interface BlogTabProps {
    onShowToast: (msg: string, type: 'success' | 'error') => void;
}

const BlogTab: React.FC<BlogTabProps> = ({ onShowToast }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPost, setEditingPost] = useState<any>(null);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const res = await api.adminGetBlogPosts();
            setPosts(res.posts);
        } catch (error) {
            onShowToast('Không thể tải danh sách bài viết', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
        try {
            await api.adminDeleteBlogPost(id);
            onShowToast('Đã xóa bài viết', 'success');
            fetchPosts();
        } catch (error) {
            onShowToast('Xóa bài viết thất bại', 'error');
        }
    };

    const handleEdit = (post: any) => {
        setEditingPost({ ...post });
        setIsEditing(true);
    };

    const handleCreate = () => {
        setEditingPost({
            title: '',
            excerpt: '',
            content: '',
            image_url: '',
            slug: ''
        });
        setIsEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPost.id) {
                await api.adminUpdateBlogPost(editingPost.id, editingPost);
                onShowToast('Cập nhật bài viết thành công. Đang tải lại trang...', 'success');
            } else {
                await api.adminCreateBlogPost(editingPost);
                onShowToast('Tạo bài viết thành công. Đang tải lại trang...', 'success');
            }
            setIsEditing(false);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            onShowToast('Lưu bài viết thất bại', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Đang tải...</div>;

    if (isEditing) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                        {editingPost.id ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
                    </h3>
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        Đóng
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-2 block">Tiêu đề</label>
                        <input
                            required
                            value={editingPost.title}
                            onChange={e => setEditingPost({...editingPost, title: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-2 block">Slug (Đường dẫn)</label>
                        <input
                            required
                            value={editingPost.slug}
                            onChange={e => setEditingPost({...editingPost, slug: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
                            placeholder="vi-du-duong-dan"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-2 block">Tóm tắt</label>
                        <textarea
                            required
                            value={editingPost.excerpt}
                            onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})}
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:border-indigo-600 text-sm text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-2 block">Link ảnh bài viết</label>
                        <div className="flex gap-2">
                            <input
                                value={editingPost.image_url}
                                onChange={e => setEditingPost({...editingPost, image_url: e.target.value})}
                                className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:border-indigo-600 text-sm text-slate-900"
                                placeholder="/blog-career.png hoặc URL ảnh..."
                            />
                            <button
                                type="button"
                                onClick={() => document.getElementById('blog-image-upload')?.click()}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-xl text-xs font-bold transition-all"
                            >
                                TẢI ẢNH
                            </button>
                            <input
                                id="blog-image-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        try {
                                            const res = await api.adminUploadBlogImage(file);
                                            setEditingPost({ ...editingPost, image_url: res.image_url });
                                            onShowToast('Tải ảnh thành công', 'success');
                                        } catch (error) {
                                            onShowToast('Tải ảnh thất bại', 'error');
                                        }
                                    }
                                }}
                            />
                        </div>
                        {editingPost.image_url && (
                            <div className="mt-2 h-20 w-32 rounded-lg overflow-hidden border border-slate-100">
                                <img 
                                    src={getImageUrl(editingPost.image_url)} 
                                    className="w-full h-full object-cover" 
                                    alt="Preview" 
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-2 block">Nội dung chi tiết (Markdown)</label>
                        <textarea
                            required
                            value={editingPost.content}
                            onChange={e => setEditingPost({...editingPost, content: e.target.value})}
                            rows={10}
                            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:outline-none focus:border-indigo-600 font-mono text-sm text-slate-900"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                    >
                        LƯU BÀI VIẾT
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Quản lý Bài viết (Blog)</h3>
                    <p className="text-sm text-slate-400">Các tin tức hiển thị tại mục "Tin tức mới nhất" trên Landing Page</p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all"
                >
                    + THÊM BÀI VIẾT
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="h-40 bg-slate-100 relative">
                            <img 
                                src={getImageUrl(post.image_url)} 
                                className="w-full h-full object-cover"
                                alt={post.title} 
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button 
                                    onClick={() => handleEdit(post)}
                                    className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-indigo-600 shadow-sm hover:bg-white transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => handleDelete(post.id)}
                                    className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-rose-600 shadow-sm hover:bg-white transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h4 className="font-bold text-slate-800 line-clamp-1 mb-2">{post.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2 mb-4">{post.excerpt}</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                                <span>{post.slug}</span>
                                <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BlogTab;
