import React, { useState } from 'react';
import { User } from '../../types';
import { API_ROOT, getImageUrl } from '../../api';

interface UserAvatarProps {
  user?: any;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  shape?: 'circle' | 'square';
  style?: React.CSSProperties;
}

export const getAvatarUrl = (user?: any): string | null => {
  if (!user) return null;
  const url = user.picture_url || user.avatar_url || user.avatar || user.photo_url || user.profile_image;
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  
  const resolved = getImageUrl(url);
  if (resolved.startsWith('/') && !resolved.startsWith('//')) {
    return `${API_ROOT}${resolved}`;
  }
  return resolved;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  shape = 'circle',
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = getAvatarUrl(user);

  React.useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-[10px]';

  const getInitial = (name?: string, email?: string): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      const lastPart = parts[parts.length - 1];
      return lastPart ? lastPart[0].toUpperCase() : '?';
    }
    if (email && email.trim()) {
      return email.trim()[0].toUpperCase();
    }
    return 'U';
  };

  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={user?.full_name || user?.username || 'User Avatar'}
        onError={() => setImageError(true)}
        className={`${roundedClass} object-cover border border-purple-500/20 shadow-md ${sizeClasses[size]} ${className}`}
        style={style}
      />
    );
  }

  // Fallback design
  const initial = getInitial(user?.full_name || user?.username || user?.name, user?.email);
  return (
    <div
      className={`${roundedClass} border border-purple-500/30 bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold flex items-center justify-center shadow-lg uppercase select-none ${sizeClasses[size]} ${className}`}
      style={style}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;
