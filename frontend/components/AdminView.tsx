import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { User } from '../types';
import toast from 'react-hot-toast';
import { confirmDestructive, promptInput, confirmAction, promptTokenAdjustment } from '../utils/swal';
import AdminSidebar, { AdminPage } from './admin/AdminSidebar';
import AdminTopbar from './admin/AdminTopbar';
import DashboardPage from './admin/DashboardPage';
import UsersTab from './admin/UsersTab';
import PackagesTab from './admin/PackagesTab';
import HistoryTab from './admin/HistoryTab';
import PaymentsTab from './admin/PaymentsTab';
import ChatLogsTab from './admin/ChatLogsTab';
import SettingsTab from './admin/SettingsTab';
import LoginsTab from './admin/LoginsTab';
import ReportsTab from './admin/ReportsTab';
import SupportTab from './admin/SupportTab';
import ChatLogDetailModal from './admin/ChatLogDetailModal';
import UserDetailModal from './admin/UserDetailModal';
import BlogTab from './admin/BlogTab';
import './admin/admin.css';

interface AdminViewProps {
  onBackToSite?: () => void;
  onLogout?: () => void;
  adminName?: string;
  user?: User | null;
}

const AdminView: React.FC<AdminViewProps> = ({ onBackToSite, onLogout, adminName, user }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const pageTitles: Record<AdminPage, string> = {
    dashboard: t('admin.dashboard'),
    users: t('admin.userManagement'),
    packages: t('admin.packages'),
    history: t('admin.payments'),
    payments: t('admin.invoices'),
    invoices: t('admin.invoices'),
    chatlogs: t('admin.chatLogs'),
    settings: t('admin.systemSettings'),
    logins: t('admin.loginLogs'),
    reports: t('admin.reports'),
    blog: t('admin.blogs'),
    support: t('admin.liveSupport', 'Hỗ trợ trực tuyến'),
  };

  const [activePage, setActivePage] = useState<AdminPage>(
    (localStorage.getItem('adminActivePage') as AdminPage) || 'dashboard'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'completed' | 'failed'>('completed');

  const [data, setData] = useState<{
    users: any[]; packages: any[]; history: any[]; payments: any[];
    chatlogs: any[]; rate: number; logins: any[]; reports: any[];
    logo_url: string; background_url: string; site_title: string;
    seo_description: string; seo_keywords: string; seo_author: string;
    favicon_url: string; no_answer_fallback: string;
    hero_title: string; hero_subtitle: string; about_title: string; about_content: string;
  }>({
    users: [], packages: [], history: [], payments: [], chatlogs: [],
    rate: 1.0, logins: [], reports: [],
    logo_url: '', background_url: '', site_title: '',
    seo_description: '', seo_keywords: '', seo_author: '', favicon_url: '',
    no_answer_fallback: '', hero_title: '', hero_subtitle: '', about_title: '', about_content: ''
  });

  const siteTitle = React.useMemo(() => {
    if (!data) return 'Zodiac Whisper';
    const localizedKey = `site_title_${currentLang}`;
    return data[localizedKey] || data.site_title || 'Zodiac Whisper';
  }, [data, currentLang]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);

  useEffect(() => {
    const loadInitSettings = async () => {
      try {
        const res = await api.adminGetSettings();
        setData(prev => ({
          ...prev,
          ...res,
          rate: res.rate_per_1000
        }));
      } catch (err) {
        console.error('Failed to load initial settings', err);
      }
    };
    loadInitSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem('adminActivePage', activePage);
    if (activePage !== 'dashboard') fetchData();
  }, [activePage]);

  const handleNavigate = (page: AdminPage) => {
    setActivePage(page);
  };

  const handleViewUserDetail = async (userId: number) => {
    try {
      const res = await api.adminGetUserDetail(userId);
      setSelectedUserDetail(res);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEditUser = async (userId: number, field: 'full_name' | 'password', currentVal?: string) => {
    const title = field === 'full_name' ? t('admin.editName') : t('admin.changePassword');
    const label = field === 'full_name' ? t('admin.enterNewName') : t('admin.enterNewPassword');
    const newVal = await promptInput(title, label, currentVal || '');
    if (newVal) {
      try {
        await api.adminUpdateUser(userId, { [field]: newVal });
        toast.success(t('admin.updateUserSuccess'));
        if (activePage === 'users') fetchData();
        if (selectedUserDetail) handleViewUserDetail(userId);
      } catch (err: any) { toast.error(err.message); }
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activePage === 'users') {
        const res = await api.adminGetUsers();
        setData(prev => ({ ...prev, users: res?.users || [] }));
      } else if (activePage === 'packages') {
        const res = await api.adminGetPackages();
        setData(prev => ({ ...prev, packages: res?.packages || [] }));
      } else if (activePage === 'history') {
        const res = await api.adminGetTokenHistory();
        setData(prev => ({ ...prev, history: res?.history || [] }));
      } else if (activePage === 'payments') {
        const res = await api.adminGetPayments();
        setData(prev => ({ ...prev, payments: res?.payments || [] }));
      } else if (activePage === 'chatlogs') {
        const res = await api.adminGetChatLogs();
        setData(prev => ({ ...prev, chatlogs: res?.logs || [] }));
      } else if (activePage === 'settings') {
        const res = await api.adminGetSettings();
        setData(prev => ({
          ...prev,
          ...res,
          rate: res.rate_per_1000
        }));
      } else if (activePage === 'logins') {
        const res = await api.adminGetActiveUsers();
        setData(prev => ({ ...prev, logins: res?.logins || [] }));
      } else if (activePage === 'reports') {
        const res = await api.adminGetPaymentReports();
        setData(prev => ({ ...prev, reports: res?.reports || [] }));
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleUpdateBalance = async (userId: number, _currentBalance: number) => {
    const user = data.users.find((u: any) => u.id === userId);
    const adjustment = await promptTokenAdjustment(t('admin.adjustBalance', 'Điều chỉnh số dư'), user?.username || 'N/A');
    if (adjustment) {
      try {
        await api.adminUpdateUserBalance(userId, adjustment);
        toast.success(t('admin.adjustBalanceSuccess'));
        fetchData();
      } catch (err: any) { toast.error(err.message); }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const user = data.users.find((u: any) => u.id === userId);
    if (user?.is_admin) { toast.error(t('admin.cannotDeleteAdmin')); return; }
    const confirmed = await confirmDestructive(t('admin.deleteUser'), t('admin.deleteUserConfirm'));
    if (confirmed) {
      try {
        await api.adminDeleteUser(userId);
        toast.success(t('admin.deleteUserSuccess'));
        fetchData();
      } catch (err: any) { toast.error(err.message); }
    }
  };

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    const action = currentStatus ? t('admin.demote') : t('admin.promote');
    const title = currentStatus ? t('admin.demoteAdminTitle') : t('admin.promoteAdminTitle');
    const desc = currentStatus ? t('admin.demoteAdminConfirm') : t('admin.promoteAdminConfirm');
    const confirmed = await confirmAction(title, desc);
    if (confirmed) {
      try {
        await api.adminUpdateUser(userId, { is_admin: currentStatus ? 0 : 1 });
        toast.success(currentStatus ? t('admin.demoteSuccess') : t('admin.promoteSuccess'));
        fetchData();
      } catch (err: any) { toast.error(err.message); }
    }
  };

  const handleCreatePackage = async () => {
    const name = await promptInput(t('admin.createPackage'), t('admin.packageNameLabel'));
    if (!name) return;
    const tokens = await promptInput(t('admin.createPackage'), t('admin.packageTokensLabel'));
    if (!tokens) return;
    const amount = await promptInput(t('admin.createPackage'), t('admin.packageAmountLabel'));
    if (name && tokens && amount) {
      try {
        await api.adminCreatePackage({ name, tokens: parseInt(tokens), amount_vnd: parseInt(amount) });
        toast.success(t('admin.createPackageSuccess'));
        fetchData();
      } catch (err: any) { toast.error(err.message); }
    }
  };

  const handleDeletePackage = async (id: number) => {
    const confirmed = await confirmDestructive(t('admin.deletePackage'), t('admin.deletePackageConfirm'));
    if (confirmed) {
      try {
        await api.adminDeletePackage(id);
        toast.success(t('admin.deletePackageSuccess'));
        fetchData();
      } catch (err: any) { toast.error(err.message); }
    }
  };

  const handleUpdatePackage = async (pkg: any) => {
    const name = await promptInput(t('admin.editPackage'), t('admin.packageNameLabel'), pkg.name);
    if (!name) return;
    const tokens = await promptInput(t('admin.editPackage'), t('admin.packageTokensLabel'), pkg.tokens.toString());
    if (!tokens) return;
    const amount = await promptInput(t('admin.editPackage'), t('admin.packageAmountLabel'), pkg.amount_vnd.toString());
    if (name && tokens && amount) {
      try {
        await api.adminUpdatePackage(pkg.id, { name, tokens: parseInt(tokens), amount_vnd: parseInt(amount) });
        toast.success(t('admin.updatePackageSuccess'));
        fetchData();
      } catch (err: any) { toast.error(err.message); }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const settings: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (key === 'rate') {
        settings['rate_per_1000'] = parseFloat(value as string) || 0;
      } else {
        settings[key] = value;
      }
    }
    try {
      await api.adminUpdateSettings(settings);
      toast.success(t('admin.updateSettingsSuccess'));
      window.location.reload();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSyncFromFile = async () => {
    try {
      const loadingToast = toast.loading(t('admin.syncingFromHtml'));
      const res = await api.adminSyncFromHtml();
      setData(prev => ({ ...prev, ...res }));
      toast.dismiss(loadingToast);
      toast.success(t('admin.syncHtmlSuccess'));
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (file: File, field: string) => {
    try {
      const loadingToast = toast.loading(t('admin.uploading'));
      const res = await api.adminUploadLogo(file, field);
      toast.dismiss(loadingToast);
      toast.success(t('admin.uploadSuccess'));
      setData(prev => ({ ...prev, [field]: res.logo_url }));
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUploadVideo = async (file: File, field: string) => {
    try {
      const loadingToast = toast.loading(t('admin.uploadingVideo'));
      const res = await api.adminUploadVideo(file);
      toast.dismiss(loadingToast);
      toast.success(t('admin.uploadVideoSuccess'));
      setData(prev => ({ ...prev, [field]: res.url }));
    } catch (err: any) { toast.error(err.message); }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'users':
        return <UsersTab users={data.users} isLoading={isLoading} onViewDetail={handleViewUserDetail} onUpdateBalance={handleUpdateBalance} onToggleAdmin={handleToggleAdmin} onDeleteUser={handleDeleteUser} />;
      case 'packages':
        return <PackagesTab packages={data.packages} onCreatePackage={handleCreatePackage} onUpdatePackage={handleUpdatePackage} onDeletePackage={handleDeletePackage} />;
      case 'history':
        return <HistoryTab history={data.history} />;
      case 'payments':
        return <PaymentsTab payments={data.payments} paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter} />;
      case 'chatlogs':
        return <ChatLogsTab chatlogs={data.chatlogs} onSelectChat={setSelectedChat} />;
      case 'settings':
        return (
          <SettingsTab
            data={data}
            onSave={handleSaveSettings}
            onSync={handleSyncFromFile}
            onChange={handleSettingChange}
            onUploadLogo={(f) => handleUpload(f, 'logo_url')}
            onUploadFavicon={(f) => handleUpload(f, 'favicon_url')}
            onUploadBackground={(f) => handleUpload(f, 'background_url')}
            onUploadAppBackground={(f) => handleUpload(f, 'background_app_url')}
            onUploadHeroBg={(f) => handleUpload(f, 'hero_background_url')}
            onUploadHeroChartImg={(f) => handleUpload(f, 'hero_chart_image_url')}
            onUploadVideoGuide={(f) => handleUploadVideo(f, 'guide_video_url')}
            onUploadVideoPoster={(f) => handleUpload(f, 'guide_video_poster_url')}
          />
        );
      case 'logins':
        return <LoginsTab logins={data.logins} />;
      case 'reports':
        return <ReportsTab reports={data.reports} onRefresh={fetchData} />;
      case 'support':
        return <SupportTab adminUser={user} />;
      case 'blog':
        return <BlogTab onShowToast={(msg, type) => type === 'success' ? toast.success(msg) : toast.error(msg)} />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="admin-root">
      <AdminSidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        adminName={adminName}
        onLogout={onLogout || (() => onBackToSite?.())}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        logoUrl={data.logo_url}
        siteTitle={siteTitle}
        user={user}
      />
      <div className="admin-main">
        <AdminTopbar
          onToggleSidebar={() => {
            if (window.innerWidth <= 768) setMobileOpen(!mobileOpen);
            else setSidebarCollapsed(!sidebarCollapsed);
          }}
          pageTitle={pageTitles[activePage] || 'Admin'}
          adminName={adminName}
          onBackToSite={() => onBackToSite?.()}
          user={user}
        />
        <div className="admin-content">
          {renderPage()}
        </div>
      </div>

      {/* Modals */}
      {selectedChat && <ChatLogDetailModal chat={selectedChat} onClose={() => setSelectedChat(null)} />}
      {selectedUserDetail && <UserDetailModal userDetail={selectedUserDetail} onClose={() => setSelectedUserDetail(null)} onEditUser={handleEditUser} onViewChatDetail={setSelectedChat} />}
    </div>
  );
};

export default AdminView;
