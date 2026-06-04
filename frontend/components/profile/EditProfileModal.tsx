import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import UserAvatar from '../common/UserAvatar';

interface EditProfileModalProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, user, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(user.full_name || '');
  const [pictureUrl, setPictureUrl] = useState(user.picture_url || '');
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await api.uploadFile(file);
      // Construct public URL
      const finalUrl = res.download_url;
      setPictureUrl(finalUrl);
      toast.success(t('profile.updateSuccess') || 'Tải ảnh lên thành công.');
    } catch (err: any) {
      console.error(err);
      toast.error(t('common.error') || 'Tải ảnh lên thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error(t('common.error') || 'Họ và tên không được để trống.');
      return;
    }
    try {
      await api.userProfileUpdate({
        full_name: fullName.trim(),
        picture_url: pictureUrl.trim(),
      });
      // Fetch fresh user data to trigger state updates elsewhere
      const freshUser = await api.checkAuth();
      onSuccess(freshUser);
      toast.success(t('profile.updateSuccess') || 'Cập nhật hồ sơ thành công.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('common.error') || 'Không thể cập nhật hồ sơ.');
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-600 p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight">
            {t('profile.updateFullName') || 'Chỉnh sửa hồ sơ'}
          </h3>
          <button onClick={onClose} className="hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('modal-avatar-file')?.click()}>
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-purple-500/20">
                <UserAvatar user={{ ...user, picture_url: pictureUrl }} size="lg" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[10px] font-bold uppercase">{t('profile.changeAvatar') || 'Đổi ảnh'}</span>
              </div>
              <input
                id="modal-avatar-file"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            {uploading && <p className="text-xs text-stone-500 animate-pulse">{t('common.processing') || 'Đang xử lý...'}</p>}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1 block">
                {t('auth.username') || 'Tên đăng nhập'}
              </label>
              <input
                type="text"
                disabled
                value={user.username || ''}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1 block">
                {t('profile.name') || 'Họ và tên'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('profile.enterNewName') || 'Nhập họ tên mới của bạn:'}
                className="w-full bg-stone-50 border border-stone-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-stone-800 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1 block">
                {t('profile.changeAvatar') || 'Đường dẫn ảnh (URL)'}
              </label>
              <input
                type="text"
                value={pictureUrl}
                onChange={(e) => setPictureUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-stone-50 border border-stone-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-stone-800 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-100 text-stone-600 font-bold py-3.5 rounded-xl hover:bg-stone-200 transition-colors text-sm"
            >
              {t('common.cancel') || 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-purple-700 text-white font-bold py-3.5 rounded-xl hover:bg-purple-800 transition-colors text-sm shadow-md disabled:opacity-50"
            >
              {t('common.save') || 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
