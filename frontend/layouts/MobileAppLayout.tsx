import React, { useState } from 'react';
import { User, View, Conversation } from '../types';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileSidebar from '../components/mobile/MobileSidebar';
import BottomNav from '../components/BottomNav';
import SupportChatWidget from '../components/support/SupportChatWidget';

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

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#05050c] text-slate-200 overflow-x-hidden relative">
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
          paddingTop: 'calc(64px + env(safe-area-inset-top))',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
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
