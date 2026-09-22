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
import DataDeletionPage from './components/DataDeletionPage';
import SupportPage from './components/SupportPage';
import BlogDetailPage from './components/BlogDetailPage';
import AstrologyDetailsPage from './components/AstrologyDetailsPage';
import SupportChatWidget from './components/support/SupportChatWidget';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';

// Mobile/App Layout & Components
import LanguageWelcomeScreen from './components/mobile/LanguageWelcomeScreen';
import MobileLandingPage from './components/mobile/MobileLandingPage';
import MobileAppLayout from './layouts/MobileAppLayout';

import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
const App: React.FC = () => {
  const { stop } = useTextToSpeech();
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState<User | null>(null);

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const [isMobileSize, setIsMobileSize] = useState(() => 
    typeof window !== 'undefined' && (
      ((window as any).Capacitor?.isNativePlatform?.()) ||
      ((window as any).FlutterBridge !== undefined) ||
      document.cookie.includes('viewappmobie=true') ||
      window.innerWidth <= 768
    )
  );

  const [languageSelected, setLanguageSelected] = useState(() => 
    localStorage.getItem("zodiac_language_selected") === "true"
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileSize(
        ((window as any).Capacitor?.isNativePlatform?.()) ||
        ((window as any).FlutterBridge !== undefined) ||
        document.cookie.includes('viewappmobie=true') ||
        window.innerWidth <= 768
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isNative = isMobileSize;

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('landing');

  const navigateTo = (view: View, path: string) => {
    window.history.pushState({}, '', path);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewChange = (view: View) => {
    if (view === 'privacy') {
      navigateTo('privacy', '/privacy-policy');
    } else if (view === 'terms') {
      navigateTo('terms', '/terms-of-service');
    } else if (view === 'data_deletion' || view === 'data-deletion' as any) {
      navigateTo('data_deletion', '/data-deletion');
    } else if (view === 'support') {
      navigateTo('support', '/support');
    } else if (view === 'contact') {
      navigateTo('contact', '/contact');
    } else if (view === 'landing') {
      navigateTo('landing', '/');
    } else {
      setCurrentView(view);
    }
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/privacy-policy') {
        setCurrentView('privacy');
      } else if (path === '/terms-of-service') {
        setCurrentView('terms');
      } else if (path === '/data-deletion') {
        setCurrentView('data_deletion');
      } else if (path === '/support') {
        setCurrentView('support');
      } else if (path === '/contact') {
        setCurrentView('contact');
      } else if (path === '/' || path === '') {
        if (['privacy', 'terms', 'data_deletion', 'support', 'contact'].includes(currentView)) {
          setCurrentView('landing');
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    
    // Initial routing
    const initialPath = window.location.pathname;
    if (initialPath === '/privacy-policy') {
      setCurrentView('privacy');
    } else if (initialPath === '/terms-of-service') {
      setCurrentView('terms');
    } else if (initialPath === '/data-deletion') {
      setCurrentView('data_deletion');
    } else if (initialPath === '/support') {
      setCurrentView('support');
    } else if (initialPath === '/contact') {
      setCurrentView('contact');
    }

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [currentView]);

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
    blog_posts?: any[],
    [key: string]: any
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

  useEffect(() => {
    if (!siteConfig) return;

    const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';
    const siteTitle = (currentLang === 'en' 
      ? (siteConfig.site_title_en || siteConfig.site_title) 
      : (siteConfig.site_title_vi || siteConfig.site_title)) || 'Zodiac Whisper';

    let viewTitle = '';
    switch (currentView) {
      case 'admin':
        viewTitle = currentLang === 'en' ? 'Admin Panel' : 'Quản trị';
        break;
      case 'chat':
        viewTitle = currentLang === 'en' ? 'Astrology Chat' : 'Trò chuyện Chiêm tinh';
        break;
      case 'calendar':
        viewTitle = currentLang === 'en' ? 'Auspicious Calendar' : 'Lịch Cát Tường';
        break;
      case 'prediction':
        viewTitle = currentLang === 'en' ? 'Daily Forecast' : 'Dự báo vận trình ngày';
        break;
      case 'profile':
        viewTitle = currentLang === 'en' ? 'Profile' : 'Trang cá nhân';
        break;
      case 'terms':
        viewTitle = currentLang === 'en' ? 'Terms of Service' : 'Điều khoản sử dụng';
        break;
      case 'privacy':
        viewTitle = currentLang === 'en' ? 'Privacy Policy' : 'Chính sách bảo mật';
        break;
      case 'faq':
        viewTitle = currentLang === 'en' ? 'FAQ' : 'Câu hỏi thường gặp';
        break;
      case 'guide':
        viewTitle = currentLang === 'en' ? 'User Guide' : 'Hướng dẫn sử dụng';
        break;
      case 'contact':
        viewTitle = currentLang === 'en' ? 'Contact Us' : 'Liên hệ';
        break;
      default:
        break;
    }

    if (viewTitle) {
      document.title = `${viewTitle} | ${siteTitle}`;
    } else {
      document.title = siteTitle;
    }
  }, [siteConfig, currentView, i18n.language]);

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
        const path = window.location.pathname;
        const isLegalPath = ['/privacy-policy', '/terms-of-service', '/data-deletion', '/support', '/contact'].includes(path);
        if (!isLegalPath) {
          const role = userData.role?.toUpperCase();
          if (userData.is_admin || role === 'ADMIN') {
            setCurrentView('admin');
          } else {
            setCurrentView('chat');
          }
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

    if (typeof window !== 'undefined' && (window as any).FlutterBridge) {
      try {
        (window as any).FlutterBridge.postMessage('LOGOUT');
      } catch (err) {
        console.error('Failed to post LOGOUT message to FlutterBridge', err);
      }
    }

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

  if (isMobileSize && !languageSelected) {
    return (
      <LanguageWelcomeScreen
        onLanguageSelected={() => setLanguageSelected(true)}
        logoUrl={siteConfig?.logo_url}
        siteTitle={siteConfig ? (i18n.language?.startsWith('en') ? siteConfig.site_title_en || siteConfig.site_title : siteConfig.site_title_vi || siteConfig.site_title) : 'Zodiac Whisper'}
      />
    );
  }

  if (currentView === 'contact') {
    return <div key="contact" className="view-transition"><ContactPage onBack={() => navigateTo('landing', '/')} onLogin={() => setCurrentView('profile')} user={user} siteConfig={siteConfig} /></div>;
  }

  if (currentView === 'terms') {
    return <div key="terms" className="view-transition"><TermsPage onBack={() => navigateTo('landing', '/')} onLogin={() => setCurrentView('profile')} user={user} siteConfig={siteConfig} /></div>;
  }

  if (currentView === 'privacy') {
    return <div key="privacy" className="view-transition"><PrivacyPage onBack={() => navigateTo('landing', '/')} onLogin={() => setCurrentView('profile')} user={user} siteConfig={siteConfig} /></div>;
  }

  if (currentView === 'data_deletion') {
    return <div key="data_deletion" className="view-transition"><DataDeletionPage onBack={() => navigateTo('landing', '/')} onLogin={() => setCurrentView('profile')} user={user} siteConfig={siteConfig} /></div>;
  }

  if (currentView === 'support') {
    return <div key="support" className="view-transition"><SupportPage onBack={() => navigateTo('landing', '/')} onLogin={() => setCurrentView('profile')} user={user} siteConfig={siteConfig} /></div>;
  }

  if (currentView === 'faq') {
    return <div key="faq" className="view-transition"><FAQPage onBack={() => navigateTo('landing', '/')} onLogin={() => setCurrentView('profile')} onContact={() => navigateTo('support', '/support')} user={user} siteConfig={siteConfig} /></div>;
  }

  if (currentView === 'guide') {
    return <div key="guide" className="view-transition"><GuidePage onBack={() => navigateTo('landing', '/')} onLogin={() => setCurrentView('profile')} onStart={() => setCurrentView('chat')} siteConfig={siteConfig} /></div>;
  }

  if (currentView === 'details') {
    return <div key="details" className="view-transition"><AstrologyDetailsPage onBack={() => setCurrentView('landing')} siteConfig={siteConfig} /></div>;
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

  // ===== MOBILE/APP EXPERIENCE =====
  if (isMobileSize) {
    const isStandaloneSubpage = [
      'contact', 'terms', 'privacy', 'faq', 'guide', 'details', 'blog_detail', 'admin'
    ].includes(currentView);

    if (!isStandaloneSubpage) {
      return (
        <MobileAppLayout
          user={user}
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
          siteConfig={siteConfig}
          conversations={conversations}
          setChatHistory={setChatHistory}
          setCurrentConversationId={setCurrentConversationId}
          currentConversationId={currentConversationId}
          createNewChat={createNewChat}
        >
          {currentView === 'landing' ? (
            <MobileLandingPage
              user={user}
              onViewChange={handleViewChange}
              onLoginClick={() => {
                if (!user) {
                  setCurrentView('profile');
                } else {
                  setCurrentView('chat');
                }
              }}
              siteConfig={siteConfig}
            />
          ) : !user ? (
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
              {currentView === 'profile' && (
                <ProfileView user={user} onUpdateUser={setUser} onLogout={handleLogout} />
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
        </MobileAppLayout>
      );
    }
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
          onViewChange={handleViewChange}
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
        onViewChange={handleViewChange}
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

              <ProfileView user={user} onUpdateUser={setUser} onLogout={handleLogout} />

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
          onViewChange={handleViewChange}
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
