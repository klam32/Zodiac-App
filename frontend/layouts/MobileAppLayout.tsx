import React, { useState } from 'react';
import { User, View, Conversation } from '../types';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileSidebar from '../components/mobile/MobileSidebar';
import BottomNav from '../components/BottomNav';
import SupportChatWidget from '../components/support/SupportChatWidget';

import { getImageUrl } from '../api';

interface MobileAppLayoutProps {
  user: User | null;
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  siteConfig: any;
  conversations: Conversation[];
  setChatHistory: React.Dispatch<any>;
  setCurrentConversationId: (id: number | null) => void;
  currentConversationId: number | null;
  createNewChat: () => void;
  children: React.ReactNode;
}

const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({
  user,
  currentView,
  onViewChange,
  onLogout,
  siteConfig,
  conversations,
  setChatHistory,
  setCurrentConversationId,
  currentConversationId,
  createNewChat,
  children
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getMobileBackgroundStyle = () => {
    const useAppBg = siteConfig?.use_app_background === '1' || siteConfig?.use_app_background === 1 || siteConfig?.use_app_background === true;
    const appBgUrl = siteConfig?.background_app_url;
    const webBgUrl = siteConfig?.background_url;

    if (useAppBg && appBgUrl) {
      return {
        backgroundImage: `url("${getImageUrl(appBgUrl)}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      };
    }

    if (webBgUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(10, 8, 28, 0.84), rgba(7, 5, 20, 0.94)), url("${getImageUrl(webBgUrl)}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      };
    }

    return {
      background: 'radial-gradient(circle at 50% 15%, #0d0921 0%, #040308 100%)',
    };
  };

  const bgStyle = getMobileBackgroundStyle();

  return (
    <div 
      className="flex flex-col min-h-screen w-full text-slate-200 overflow-x-hidden relative"
      style={bgStyle}
    >
      {/* Header */}
      <MobileHeader
        user={user}
        onMenuClick={() => setIsSidebarOpen(true)}
        onViewChange={onViewChange}
        siteConfig={siteConfig}
      />

      {/* Sidebar Drawer */}
      <MobileSidebar
        user={user}
        currentView={currentView}
        onViewChange={onViewChange}
        onLogout={onLogout}
        siteConfig={siteConfig}
        conversations={conversations}
        setChatHistory={setChatHistory}
        setCurrentConversationId={setCurrentConversationId}
        currentConversationId={currentConversationId}
        createNewChat={createNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main 
        className="flex-1 flex flex-col w-full min-h-screen box-border transition-all duration-300"
        style={{
          paddingTop: 'calc(64px + max(20px, env(safe-area-inset-top)))',
          paddingBottom: 'calc(80px + max(16px, env(safe-area-inset-bottom)))'
        }}
      >
        {children}
      </main>

      {/* Bottom Nav */}
      <BottomNav
        user={user}
        currentView={currentView}
        onViewChange={onViewChange}
        setCurrentConversationId={setCurrentConversationId}
        setChatHistory={setChatHistory}
      />

      {/* Support Chat Widget */}
      {user && <SupportChatWidget user={user} />}
    </div>
  );
};

export default MobileAppLayout;
