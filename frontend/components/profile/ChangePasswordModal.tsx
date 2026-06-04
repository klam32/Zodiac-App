import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ChangePasswordModalProps {
  open: boolean;
  user: User;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, user, onClose }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const isGoogleAccount = user.picture_url?.includes('googleusercontent.com');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error(currentLang === 'en' ? 'New password is required.' : 'Mật khẩu mới không được rỗng.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error(currentLang === 'en' ? 'Password must be at least 6 characters.' : 'Mật khẩu mới tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(currentLang === 'en' ? 'Confirm password does not match.' : 'Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      await api.userProfileUpdate({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success(t('profile.passwordChanged') || 'Đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('common.error') || 'Không thể đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-600 p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight">
            {t('profile.changePassword') || 'Đổi mật khẩu'}
          </h3>
          <button onClick={onClose} className="hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {isGoogleAccount && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-4 leading-relaxed font-medium">
              {currentLang === 'en'
                ? 'Google Account detected. If you have not set up a password yet, you can leave the current password field blank.'
                : 'Tài khoản Google có thể không cần mật khẩu hiện tại. Nếu bạn chưa đặt mật khẩu, hãy để trống trường mật khẩu hiện tại.'}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1 block">
                {currentLang === 'en' ? 'Current Password' : 'Mật khẩu hiện tại'}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={currentLang === 'en' ? 'Enter current password' : 'Nhập mật khẩu hiện tại'}
                className="w-full bg-stone-50 border border-stone-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-stone-800 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1 block">
                {currentLang === 'en' ? 'New Password' : 'Mật khẩu mới'}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={currentLang === 'en' ? 'Minimum 6 characters' : 'Tối thiểu 6 ký tự'}
                className="w-full bg-stone-50 border border-stone-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-stone-800 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1 block">
                {currentLang === 'en' ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={currentLang === 'en' ? 'Confirm new password' : 'Xác nhận mật khẩu mới'}
                className="w-full bg-stone-50 border border-stone-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-stone-800 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-100 text-stone-600 font-bold py-3.5 rounded-xl hover:bg-stone-200 transition-colors text-sm"
              disabled={loading}
            >
              {t('common.cancel') || 'Hủy'}
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-700 text-white font-bold py-3.5 rounded-xl hover:bg-purple-800 transition-colors text-sm shadow-md disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (t('common.processing') || 'Đang xử lý...') : (t('profile.changePassword') || 'Đổi mật khẩu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
