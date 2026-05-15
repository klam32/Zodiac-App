import React from 'react';
import { View, User } from '../types';
import { Sparkles, DollarSign, Shield, Star, User as UserIcon, Calendar, Zap } from 'lucide-react';

interface BottomNavProps {
  user: User | null;
  currentView: View;
  onViewChange: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ user, currentView, onViewChange }) => {
  const navItems = [
    { id: 'landing' as View, label: 'Trang Chủ', icon: Star },
    { id: 'chat' as View, label: 'Chiêm Tinh', icon: Sparkles },
    { id: 'calendar' as View, label: 'Lịch Tường', icon: Calendar },
    { id: 'prediction' as View, label: 'Vận Trình', icon: Zap },
    { id: 'payment' as View, label: 'Nạp Điểm', icon: DollarSign },
    ...(user?.is_admin ? [{ id: 'admin' as View, label: 'Admin', icon: Shield }] : []),
    { id: 'profile' as View, label: 'Hồ Sơ', icon: UserIcon }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f11]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-1 z-50 overflow-x-auto hide-scrollbar" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center justify-center py-2 px-2 min-w-[60px] flex-shrink-0 transition-colors ${
              isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <item.icon size={22} className={isActive ? 'fill-purple-400/20' : ''} />
            <span className="text-[10px] mt-1 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
