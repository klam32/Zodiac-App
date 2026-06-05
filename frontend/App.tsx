import React, { useState, useEffect, useCallback } from 'react';
import { User, View, ChatMessage, Conversation } from './types';
import { api, getImageUrl } from './api';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import DraggableMenuButton from './components/DraggableMenuButton';
import ChatView from './components/ChatView';
import AuthView from './components/AuthView';
import PaymentView from './components/PaymentView';
import ProfileView from './components/ProfileView';
import AdminView from './components/AdminView';
import CalendarFortune from './components/CalendarFortune';
import DailyPrediction from './components/DailyPrediction';
import RewardsView from './components/RewardsView';
import LandingPage from './components/LandingPage';
import ContactPage from './components/ContactPage';
import TermsPage from './components/TermsPage';
import FAQPage from './components/FAQPage';
import GuidePage from './components/GuidePage';
import PrivacyPage from './components/PrivacyPage';
import BlogDetailPage from './components/BlogDetailPage';
import AstrologyDetailsPage from './components/AstrologyDetailsPage';
import SupportChatWidget from './components/support/SupportChatWidget';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';

import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
const App: React.FC = () => {
  const { stop } = useTextToSpeech();
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Detect Native App (Capacitor / Flutter WebView) or just Mobile Screen
  const isNative = typeof window !== 'undefined' && (
    ((window as any).Capacitor?.isNativePlatform?.()) ||
    ((window as any).FlutterBridge !== undefined) ||
    window.innerWidth <= 768
  );

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('landing');

  useEffect(() => {
    stop();
  }, [currentView, currentConversationId]);

  // const [siteConfig, setSiteConfig] = useState<{ logo_url: string, site_title: string }>({
  //   logo_url: '',
  //   site_title: 'Zodiac Whisper'
  // });
  const [siteConfig, setSiteConfig] = useState<{
    logo_url: string,
    site_title: string,
    background_url?: string,
    favicon_url?: string,
    hero_title?: string,
    hero_subtitle?: string,
    about_title?: string,
    about_content?: string,
    blog_posts?: any[]
  }>({
    logo_url: '',
    site_title: 'Zodiac Whisper',
    background_url: '',
    favicon_url: '',
    hero_title: '',
    hero_subtitle: '',
    about_title: '',
    about_content: '',
    blog_posts: []
  });

  // =========================
  // LOAD CONVERSATIONS
  // =========================

  const loadConversations = async () => {

    try {

      const res = await api.getConversations()

      if (res.conversations) {

        setConversations(
          res.conversations.map((c: any) => ({
            ...c,
            title:
              !c.title || c.title.toLowerCase() === "mới"
                ? "Đoạn chat mới"
                : c.title
          }))
        )

      }

    } catch (err) {

      console.error(err)

    }

  }

  // =========================
  // CREATE NEW CHAT
  // =========================

  const createNewChat = async () => {

    // 🔥 tạo fake chat trước (QUAN TRỌNG)
    const tempId = Date.now()

    setConversations(prev => [
      {
        id: tempId,
        title: "Đoạn chat mới",
        messages: [],
        created_at: new Date().toISOString()
      },
      ...prev
    ])

    setCurrentConversationId(tempId)
    setChatHistory([])

    try {

      const res = await api.createConversation()

      const realId = res.conversation_id

      // 🔥 update lại ID thật
      setCurrentConversationId(realId)

      // 🔥 reload sau (không phá UI)
      await loadConversations()

    } catch (err) {
      console.error(err)
    }

  }
  // =========================
  // LOAD SITE CONFIG
  // =========================

  const fetchSiteConfig = async () => {

    try {

      const params = new URLSearchParams(window.location.search);
      const isPreviewDraft = params.get('preview_draft') === '1';

      if (isPreviewDraft) {
        const draftStr = sessionStorage.getItem("zodiac_landing_preview_draft");
        if (draftStr) {
          const draftConfig = JSON.parse(draftStr);
          setSiteConfig(draftConfig);
          if (draftConfig.site_title) {
            document.title = draftConfig.site_title;
          }
          if (draftConfig.favicon_url) {
            const faviconUrl = getImageUrl(draftConfig.favicon_url);
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.type = 'image/png';
            link.href = faviconUrl + '?v=' + new Date().getTime();
          }
          return;
        }
      }

      const config = await api.getSiteConfig()

      setSiteConfig(config)

      if (config.site_title) {
        document.title = config.site_title
      }
      // 🔥 SET FAVICON
      if (config.favicon_url) {
        const faviconUrl = getImageUrl(config.favicon_url);

        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }

        link.type = 'image/png';
        link.href = faviconUrl + '?v=' + new Date().getTime();
      }

    } catch (err) {

      console.error('Failed to fetch site config', err)

    }

  }

  useEffect(() => {

    fetchSiteConfig()

  }, [])

  // =========================
  // LISTEN RELOAD SIDEBAR
  // =========================

  useEffect(() => {

    const reload = () => {

      loadConversations()

      // // 🔥 reset conversation khi DB bị xóa
      // setCurrentConversationId(null)

      // setChatHistory([])

    }

    window.addEventListener("reload_conversations", reload)

    return () => window.removeEventListener("reload_conversations", reload)

  }, [])

  // =========================
  // AUTH CHECK
  // =========================

  const fetchUser = useCallback(async () => {

    try {

      const userData = await api.checkAuth()

      setUser(userData)

      await loadConversations()

      const params = new URLSearchParams(window.location.search);
      const isPreviewDraft = params.get('preview_draft') === '1';

      if (isPreviewDraft) {
        setCurrentView('landing');
      } else {
        const role = userData.role?.toUpperCase();
        if (userData.is_admin || role === 'ADMIN') {
          setCurrentView('admin');
        } else {
          setCurrentView('chat');
        }
      }

    } catch (error) {

      setUser(null)

      localStorage.removeItem('access_token')

    } finally {

      setIsAuthLoading(false)

    }

  }, [])

  useEffect(() => {

    const params = new URLSearchParams(window.location.search)

    const tokenFromUrl = params.get('token')

    if (tokenFromUrl) {

      localStorage.setItem('access_token', tokenFromUrl)

      window.history.replaceState({}, document.title, window.location.pathname)

      fetchUser();

    } else {

      const token = localStorage.getItem('access_token')

      if (token) fetchUser()
      else setIsAuthLoading(false)

    }

  }, [fetchUser])

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {

    localStorage.removeItem('access_token')

    setUser(null)

    setCurrentView('landing')

    setChatHistory([])

    setConversations([])

    setCurrentConversationId(null)

  }

  const handleLoginSuccess = (userData: User, token: string) => {

    localStorage.setItem('access_token', token)

    setUser(userData)

    const role = userData.role?.toUpperCase();
    if (userData.is_admin || role === 'ADMIN') {
      setCurrentView('admin');
    } else {
      setCurrentView('chat');
    }

    loadConversations()

  }

  const updateBalance = (newBalance: number) => {

    if (user) {

      setUser({ ...user, token_balance: newBalance })

    }

  }

  // =========================
  // LOADING SCREEN
  // =========================

  if (isAuthLoading) {

    return (

      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-stone-400 font-serif italic">
        {t('common.loading', 'Đang tải...')}
      </div>

    )

  }

  if (currentView === 'contact') {
    return <div key="contact" className="view-transition"><ContactPage onBack={() => setCurrentView('landing')} onLogin={() => setCurrentView('profile')} user={user} /></div>;
  }

  if (currentView === 'terms') {
    return <div key="terms" className="view-transition"><TermsPage onBack={() => setCurrentView('landing')} onLogin={() => setCurrentView('profile')} user={user} /></div>;
  }

  if (currentView === 'privacy') {
    return <div key="privacy" className="view-transition"><PrivacyPage onBack={() => setCurrentView('landing')} onLogin={() => setCurrentView('profile')} user={user} /></div>;
  }

  if (currentView === 'faq') {
    return <div key="faq" className="view-transition"><FAQPage onBack={() => setCurrentView('landing')} onLogin={() => setCurrentView('profile')} onContact={() => setCurrentView('contact')} user={user} /></div>;
  }

  if (currentView === 'guide') {
    return <div key="guide" className="view-transition"><GuidePage onBack={() => setCurrentView('landing')} onLogin={() => setCurrentView('profile')} onStart={() => setCurrentView('chat')} /></div>;
  }

  if (currentView === 'details') {
    return <div key="details" className="view-transition"><AstrologyDetailsPage onBack={() => setCurrentView('landing')} /></div>;
  }

  if (currentView === 'blog_detail' && selectedArticleId) {
    return (
      <div key="blog_detail" className="view-transition">
        <BlogDetailPage
          articleId={selectedArticleId}
          onBack={() => setCurrentView('landing')}
          onLogin={() => setCurrentView('profile')}
          onArticleChange={setSelectedArticleId}
          user={user}
          siteConfig={siteConfig}
        />
      </div>
    );
  }

  // ===== ADMIN: Full-screen standalone layout =====
  if (currentView === 'admin') {
    const role = user?.role?.toUpperCase();
    if (user && (user.is_admin || role === 'ADMIN')) {
      return (
        <div key="admin" className="view-transition" style={{ height: '100vh', width: '100vw' }}>
          <Toaster position="top-right" />
          <AdminView
            onBackToSite={() => setCurrentView('chat')}
            onLogout={handleLogout}
            adminName={user.username || user.full_name || 'Admin'}
            user={user}
          />
        </div>
      );
    } else {
      setTimeout(() => setCurrentView(user ? 'chat' : 'landing'), 0);
      return null;
    }
  }

  if (currentView === 'landing') {
    return (
      <div key="landing" className="view-transition">
        <LandingPage
          user={user}
          onViewChange={setCurrentView}
          siteConfig={siteConfig}
          onArticleClick={(id) => {
            setSelectedArticleId(id);
            setCurrentView('blog_detail');
          }}
          onLoginClick={() => {
            if (!user) {
              setCurrentView('profile'); // Any view other than 'chat' and 'landing' will show AuthView
            } else {
              setCurrentView('chat');
            }
          }}
        />
        {user && <SupportChatWidget user={user} />}
      </div>
    );
  }

  return (
    <div
      key="app-main"
      className="flex flex-col md:flex-row h-screen overflow-hidden view-transition"
      style={{
        background: siteConfig.background_url
          ? `url("${getImageUrl(siteConfig.background_url)}") center/100% 100% no-repeat`
          : '#0a0a0f'
      }}
    >
      <Toaster position="top-right" />

      <Sidebar
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
        siteConfig={siteConfig}
        isVisible={isSidebarVisible}
        onToggleVisible={() => setIsSidebarVisible(!isSidebarVisible)}
        conversations={conversations}
        setChatHistory={setChatHistory}
        setCurrentConversationId={setCurrentConversationId}
        currentConversationId={currentConversationId}
        createNewChat={createNewChat}
        isMobileOpen={showMobileSidebar}
        onCloseMobile={() => setShowMobileSidebar(false)}
        isNative={isNative}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden pb-16 md:pb-0 transition-all duration-300">
        {isNative && (
          <DraggableMenuButton onClick={() => setShowMobileSidebar(true)} />
        )}

        {!user ? (

          <AuthView onSuccess={handleLoginSuccess} />

        ) : (

          <>
            {currentView === 'chat' && (

              <ChatView
                user={user}
                onAuthRequired={() => setCurrentView('chat')}
                history={chatHistory}
                setHistory={setChatHistory}
                onBalanceUpdate={updateBalance}
                siteConfig={siteConfig}

                conversationId={currentConversationId}
                setConversationId={setCurrentConversationId}
              />

            )}

            {currentView === 'payment' && (

              <PaymentView user={user} onBalanceUpdate={updateBalance} />

            )}

            {/* Admin view is now standalone - see above */}

            {currentView === 'profile' && user && (

              <ProfileView user={user} onUpdateUser={setUser} />

            )}

            {currentView === 'calendar' && (
              <CalendarFortune
                user={user}
                onBalanceUpdate={updateBalance}
                conversationId={currentConversationId}
                history={chatHistory}
              />
            )}

             {currentView === 'prediction' && (
              <DailyPrediction
                user={user}
                onBalanceUpdate={updateBalance}
                conversationId={currentConversationId}
                history={chatHistory}
              />
            )}

            {currentView === 'rewards' && (
              <RewardsView
                user={user}
                onBalanceUpdate={updateBalance}
              />
            )}
          </>
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      {isNative && (
        <BottomNav
          user={user}
          currentView={currentView}
          onViewChange={setCurrentView}
          setCurrentConversationId={setCurrentConversationId}
          setChatHistory={setChatHistory}
        />
      )}

      {user && (
        <SupportChatWidget user={user} />
      )}
    </div>
  );

}

export default App
