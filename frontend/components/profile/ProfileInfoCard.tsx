import React from 'react';
import { User } from '../../types';
import { useTranslation } from 'react-i18next';
import UserAvatar from '../common/UserAvatar';

interface ProfileInfoCardProps {
  user: User;
  onUpdateName: () => void;
  onChangePassword: () => void;
}

const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ user, onUpdateName, onChangePassword }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 transition-all">
      {/* Header Profile Inside the Card */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-purple-500/10 shadow-md">
            <UserAvatar user={user} size="lg" className="w-24 h-24" />
          </div>
          {Boolean(user.is_admin) && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-2 border-white shadow-sm tracking-wider">
              ADMIN
            </div>
          )}
        </div>

        {/* Name and Edit Button Row */}
        <div className="w-full mt-6 pb-6 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-stone-800 tracking-tight">
                {user.full_name || user.username}
              </h3>
              <p className="text-stone-400 text-sm">{user.email}</p>
            </div>
            <button
              onClick={onUpdateName}
              className="px-4 py-2 bg-stone-50 hover:bg-purple-50 text-purple-700 hover:text-purple-800 text-xs font-bold uppercase rounded-xl transition-all border border-stone-200 hover:border-purple-200 shadow-sm active:scale-95"
            >
              {t('common.edit') || 'SỬA'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Body */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-50">
            <label className="text-stone-400 text-[10px] block mb-1 uppercase tracking-widest font-black">
              {t('profile.createdAt') || 'Ngày tạo'}
            </label>
            <p className="text-stone-700 text-sm font-semibold">
              {user.created_at ? new Date(user.created_at).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'vi-VN') : '—'}
            </p>
          </div>

          <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-50">
            <label className="text-stone-400 text-[10px] block mb-1 uppercase tracking-widest font-black">
              {t('auth.username') || 'Tên đăng nhập'}
            </label>
            <p className="text-stone-700 text-sm font-semibold">{user.username}</p>
          </div>

          <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-50">
            <label className="text-stone-400 text-[10px] block mb-1 uppercase tracking-widest font-black">
              {t('profile.email') || 'Email'}
            </label>
            <p className="text-stone-700 text-sm font-semibold truncate" title={user.email}>{user.email}</p>
          </div>

          <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-50">
            <label className="text-stone-400 text-[10px] block mb-1 uppercase tracking-widest font-black">
              {t('profile.role') || 'Vai trò'}
            </label>
            <div className="mt-0.5">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${user.is_admin ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-stone-100 text-stone-600'}`}>
                {user.is_admin ? (currentLang === 'en' ? 'ADMINISTRATOR' : 'QUẢN TRỊ VIÊN') : (currentLang === 'en' ? 'USER' : 'NGƯỜI DÙNG')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-50">
          <label className="text-stone-400 text-[10px] block mb-1 uppercase tracking-widest font-black">
            {currentLang === 'en' ? 'Account Type' : 'Loại tài khoản'}
          </label>
          <p className="text-stone-700 text-sm font-semibold">
            {user.picture_url?.includes('googleusercontent.com')
              ? (currentLang === 'en' ? 'Google Account' : 'Liên kết Google')
              : (currentLang === 'en' ? 'System Account' : 'Tài khoản Hệ thống')}
          </p>
        </div>

        {/* Token and Change Password Row */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <label className="text-stone-400 text-[10px] block mb-1 uppercase tracking-widest font-black">
              {t('profile.tokenBalance') || 'Số dư token'}
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-purple-700">{(user.token_balance ?? 0).toFixed(2)}</span>
              <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Tokens</span>
            </div>
          </div>

          <button
            onClick={onChangePassword}
            className="sm:self-end px-5 py-3 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-center"
          >
            {t('profile.changePassword') || 'Đổi mật khẩu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
