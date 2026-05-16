//APP.TSX
import React, { useState, useEffect, useCallback } from 'react';
import { User, View, ChatMessage, Conversation } from './types';
import { api } from './api';
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
import LandingPage from './components/LandingPage';
import ContactPage from './components/ContactPage';
import TermsPage from './components/TermsPage';
import FAQPage from './components/FAQPage';
import GuidePage from './components/GuidePage';
import PrivacyPage from './components/PrivacyPage';
import BlogDetailPage from './components/BlogDetailPage';
import AstrologyDetailsPage from './components/AstrologyDetailsPage';
import { API_ROOT } from './api'

import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
const App: React.FC = () => {

  const [user, setUser] = useState<User | null>(null);

  const [currentView, setCurrentView] = useState<View>('landing');

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

      const config = await api.getSiteConfig()

      setSiteConfig(config)

      if (config.site_title) {
        document.title = config.site_title
      }
      // 🔥 SET FAVICON
      if (config.favicon_url) {
        const faviconUrl = config.favicon_url.startsWith('/api/')
          ? `${API_ROOT}${config.favicon_url}`
          : config.favicon_url;

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

      fetchUser().then(() => {
        setCurrentView('chat');
      });

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

    setCurrentView('chat')

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

      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        Loading...
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
      </div>
    );
  }

  return (
    <div
      key="app-main"
      className="flex flex-col md:flex-row h-screen overflow-hidden view-transition"
      style={{
        background: siteConfig.background_url
          ? `url(${siteConfig.background_url?.startsWith('/api/')
            ? `${API_ROOT}${siteConfig.background_url}`
            : siteConfig.background_url
          }) center/100% 100% no-repeat`
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

              <PaymentView onBalanceUpdate={updateBalance} />

            )}

            {currentView === 'admin' && user?.is_admin && (

              <AdminView />

            )}

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
          </>
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      {isNative && (
        <BottomNav
          user={user}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      )}

    </div>
  );

}

export default App