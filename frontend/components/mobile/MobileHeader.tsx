import React from 'react';
import { Menu, Sparkles, User as UserIcon } from 'lucide-react';
import { User, View } from '../../types';
import { getImageUrl } from '../../api';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface MobileHeaderProps {
  user: User | null;
  onMenuClick: () => void;
  onViewChange: (view: View) => void;
  siteConfig: {
    logo_url: string;
    site_title: string;
  };
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  onMenuClick,
  onViewChange,
  siteConfig
}) => {
  const [imgError, setImgError] = React.useState(false);
  const [logoImgError, setLogoImgError] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#07070c]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-[99] box-border select-none" style={{ height: 'calc(64px + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Left: Hamburger menu, Logo & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-purple-200 hover:text-white active:scale-95 transition-all hover:bg-white/5 rounded-xl"
          aria-label="Open Sidebar"
        >
          <Menu size={22} />
        </button>

        <div
          onClick={() => onViewChange('landing')}
          className="flex items-center gap-2 cursor-pointer active:scale-98 transition-all"
        >
          {siteConfig.logo_url && !logoImgError ? (
            <img
              src={getImageUrl(siteConfig.logo_url)}
              alt="Logo"
              className="h-8 w-8 object-contain rounded-lg drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
              onError={() => setLogoImgError(true)}
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles size={16} className="text-white" />
            </div>
          )}
          <span className="text-base font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent tracking-wide max-w-[120px] truncate font-title">
            {siteConfig.site_title || 'Zodiac Whisper'}
          </span>
        </div>
      </div>

      {/* Right: Language, Token balance, Avatar / Login */}
      <div className="flex items-center gap-2.5">
        <LanguageSwitcher variant="light" />

        {user ? (
          <div className="flex items-center gap-2">
            {/* Token Balance Pill */}
            {!user.is_admin && (
              <div
                onClick={() => onViewChange('payment')}
                className="flex items-center px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/20 active:scale-95 transition-all text-xs font-semibold text-purple-300 cursor-pointer"
              >
                {(user.token_balance ?? 0).toFixed(0)} <span className="text-[10px] ml-0.5 opacity-80">🪙</span>
              </div>
            )}

            {/* Profile Avatar */}
            <div
              onClick={() => onViewChange('profile')}
              className="relative cursor-pointer active:scale-95 transition-all group"
            >
              {user.picture_url && !imgError ? (
                <img
                  src={user.picture_url}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/40 shadow-sm"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-purple-500/40">
                  {(user.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#07070c] rounded-full" />
            </div>
          </div>
        ) : (
          <button
            onClick={() => onViewChange('profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            <UserIcon size={14} />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
