import React from "react";
import { useTranslation } from "react-i18next";
import { User, View, Conversation } from "../../types";
import { api, getImageUrl } from "../../api";
import {
  Sparkles,
  DollarSign,
  Shield,
  Star,
  User as UserIcon,
  Trash,
  Calendar,
  Zap,
  Pin,
  Edit2,
  Check,
  X,
  Home,
  Gift,
  LogOut
} from "lucide-react";
import ConfirmModal from "../ConfirmModal";
import Toast from "../Toast";

interface MobileSidebarProps {
  user: User | null;
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  siteConfig?: { logo_url: string; site_title: string; [key: string]: any };
  conversations?: Conversation[];
  setChatHistory?: React.Dispatch<any>;
  setCurrentConversationId?: (id: number | null) => void;
  currentConversationId?: number | null;
  createNewChat?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
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
  isOpen,
  onClose
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const siteTitle = React.useMemo(() => {
    if (!siteConfig) return 'Zodiac Whisper';
    const localizedKey = `site_title_${currentLang}`;
    return (siteConfig as any)[localizedKey] || siteConfig.site_title || 'Zodiac Whisper';
  }, [siteConfig, currentLang]);
  const [imgError, setImgError] = React.useState(false);
  const [logoImgError, setLogoImgError] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const toastTimeout = React.useRef<any>(null);

  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");
  const [contextMenuId, setContextMenuId] = React.useState<number | null>(null);

  React.useEffect(() => {
    setLogoImgError(false);
  }, [siteConfig?.logo_url]);

  React.useEffect(() => {
    setImgError(false);
  }, [user?.picture_url]);

  const menuItems = [
    { id: "landing" as View, label: t("chat.home", "Trang Chủ"), icon: Home },
    { id: "chat" as View, label: t("chat.astrology", "Chiêm Tinh"), icon: Star },
    { id: "calendar" as View, label: t("chat.calendar", "Lịch Cát Tường"), icon: Calendar },
    { id: "prediction" as View, label: t("chat.daily", "Vận Trình Ngày"), icon: Zap },
    { id: "rewards" as View, label: t("chat.buyTokens", "Nhận Token"), icon: Gift },
    { id: "payment" as View, label: t("chat.depositTokens", "Nạp Tokens"), icon: DollarSign },
    ...(user?.is_admin
      ? [
          {
            id: "admin" as View,
            label: t("chat.admin", "ADMIN"),
            icon: Shield
          }
        ]
      : []),
    { id: "profile" as View, label: t("chat.profile", "Hồ Sơ"), icon: UserIcon }
  ];

  const handleMenuClick = (view: View) => {
    onViewChange(view);
    if (view !== "chat") {
      setCurrentConversationId?.(null);
      setChatHistory?.([]);
    }
    onClose();
  };

  const handleNewChatClick = () => {
    setChatHistory?.([]);
    setCurrentConversationId?.(null);
    onViewChange("chat");
    window.dispatchEvent(new Event("NEW_CHAT_RESET"));
    createNewChat?.();
    onClose();
  };

  const loadConversation = async (convId: number) => {
    try {
      const res = await api.getChatHistory();
      const filtered = res.history
        .filter((m: any) => m.conversation_id === convId)
        .map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));

      setChatHistory?.(filtered);
      setCurrentConversationId?.(convId);

      const conv = conversations?.find((c) => c.id === convId);
      const ttl = conv?.title || "";
      if (ttl.startsWith("[Lịch Cát Tường]") || ttl.startsWith("[Auspicious Calendar]")) {
        onViewChange("calendar");
      } else if (
        ttl.startsWith("[Vận Trình Ngày]") ||
        ttl.startsWith("[Daily Forecast]") ||
        ttl.startsWith("[Daily Cosmic Quest]")
      ) {
        onViewChange("prediction");
      } else {
        onViewChange("chat");
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePin = async (e: React.MouseEvent, convId: number, currentPinned: boolean) => {
    e.stopPropagation();
    try {
      await api.toggleConversationPin(convId, !currentPinned);
      window.dispatchEvent(new Event("reload_conversations"));
      setToastMessage(!currentPinned ? t("chat.pinned", "Đã ghim") : t("chat.unpinned", "Đã bỏ ghim"));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveTitle = async (e: React.MouseEvent | React.KeyboardEvent, convId: number) => {
    if (e.type === "click" || (e as React.KeyboardEvent).key === "Enter") {
      try {
        await api.updateConversationTitle(convId, editingTitle);
        setEditingId(null);
        window.dispatchEvent(new Event("reload_conversations"));
        setToastMessage(t("chat.renamed", "Đã đổi tên"));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, convId: number) => {
    e.preventDefault();
    setContextMenuId(contextMenuId === convId ? null : convId);
  };

  React.useEffect(() => {
    const handleClick = () => setContextMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/75 z-[990] transition-opacity duration-300 backdrop-blur-sm ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-[290px] bg-[#07070d]/95 backdrop-blur-xl z-[995] border-r border-white/5 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/5 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            {siteConfig?.logo_url && !logoImgError ? (
              <img
                src={getImageUrl(siteConfig.logo_url)}
                alt="Logo"
                className="h-9 w-auto object-contain rounded-xl drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                onError={() => setLogoImgError(true)}
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <Sparkles size={18} />
              </div>
            )}
             <h1 className="text-base font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent tracking-wide truncate max-w-[150px] font-title">
              {siteTitle}
             </h1>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-5 z-10 pb-24">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-98 ${
                    isActive
                      ? "bg-purple-600/20 border border-purple-500/30 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent"
                  }`}
                >
                  <item.icon size={18} className={isActive ? "text-purple-400" : "text-gray-500"} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* New Chat Button (For Logged in user) */}
            {user && (
              <button
                onClick={handleNewChatClick}
                className={`flex items-center gap-3 w-full px-4 py-3 mt-2 text-sm font-semibold rounded-xl transition-all duration-200 bg-gradient-to-r from-purple-600/30 to-blue-600/30 hover:from-purple-600/40 hover:to-blue-600/40 text-purple-200 border border-purple-500/20 active:scale-98`}
              >
                <Sparkles size={18} className="text-purple-400" />
                <span>{t("chat.newChat", "Đoạn chat mới")}</span>
              </button>
            )}
          </nav>

          {/* Conversation History */}
          {user && conversations && conversations.length > 0 && (
            <div className="flex flex-col pt-4 border-t border-white/5">
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 px-3 mb-2 shrink-0">
                {t("chat.chatHistory", "Lịch sử trò chuyện")}
              </p>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onContextMenu={(e) => handleContextMenu(e, conv.id)}
                    className={`flex items-center justify-between rounded-xl transition-all duration-200 px-2.5 py-0.5 border ${
                      currentConversationId === conv.id
                        ? "bg-white/5 border-white/10 shadow-sm"
                        : "border-transparent hover:bg-white/5"
                    }`}
                  >
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-1 w-full py-1">
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => saveTitle(e, conv.id)}
                          className="flex-1 bg-[#0b0b12] text-xs text-white px-2 py-1 rounded border border-purple-500 outline-none"
                        />
                        <button onClick={(e) => saveTitle(e, conv.id)} className="text-green-400 hover:text-green-300">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEditing} className="text-red-400 hover:text-red-300">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => loadConversation(conv.id)}
                          className={`flex-1 text-left py-2 text-xs truncate transition flex items-center gap-2 ${
                            currentConversationId === conv.id
                              ? "text-purple-200 font-semibold"
                              : "text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          {!!conv.is_pinned && <Pin size={10} className="text-yellow-500 fill-yellow-500" />}
                          <span className="truncate">
                            {(() => {
                              const ttl = (conv.title || "").trim();
                              const ttlLower = ttl.toLowerCase();
                              if (
                                !ttl ||
                                ttlLower === "mới" ||
                                ttlLower === "new" ||
                                ttlLower === "đoạn chat mới" ||
                                ttlLower === "new chat"
                              ) {
                                return t("chat.newChatDefault", "Đoạn chat mới");
                              }
                              if (ttl.startsWith("[Lịch Cát Tường]") || ttl.startsWith("[Auspicious Calendar]")) {
                                const match = ttl.match(/(\d+)\/(\d+)/);
                                if (match) {
                                  const [_, month, year] = match;
                                  return currentLang === 'en'
                                    ? `[${t('chat.calendar')}] - Month ${month}/${year}`
                                    : `[${t('chat.calendar')}] - Tháng ${month}/${year}`;
                                }
                                return `[${t('chat.calendar')}]`;
                              }
                              if (ttl.startsWith("[Vận Trình Ngày]") || ttl.startsWith("[Daily Forecast]")) {
                                const match = ttl.match(/(\d{4}-\d{2}-\d{2})/);
                                if (match) {
                                  const dateStr = match[1];
                                  return currentLang === 'en'
                                    ? `[${t('chat.daily')}] - Date ${dateStr}`
                                    : `[${t('chat.daily')}] - Ngày ${dateStr}`;
                                }
                                return `[${t('chat.daily')}]`;
                              }
                              return conv.title;
                            })()}
                          </span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handlePin(e, conv.id, !!conv.is_pinned)}
                            className={`${conv.is_pinned ? "text-yellow-500" : "text-gray-600 hover:text-yellow-500"}`}
                            title={conv.is_pinned ? t("chat.unpin") : t("chat.pin")}
                          >
                            <Pin size={12} />
                          </button>
                          <button
                            onClick={(e) => startEditing(e, conv)}
                            className="text-gray-600 hover:text-blue-400"
                            title={t("chat.rename")}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(conv.id);
                            }}
                            className="text-gray-600 hover:text-red-500"
                            title={t("common.delete")}
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#05050a] border-t border-white/5 shrink-0 z-20">
          {user ? (
            <div className="space-y-3">
              {/* User Profiling Card */}
              <div
                onClick={() => handleMenuClick("profile")}
                className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-purple-500/20 transition-all cursor-pointer"
              >
                {user.picture_url && !imgError ? (
                  <img
                    src={getImageUrl(user.picture_url)}
                    alt="Avatar"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/40"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner">
                    {(user.username || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-[10px] text-purple-400 font-medium truncate">
                    {user.is_admin ? "ADMIN" : `${(user.token_balance ?? 0).toFixed(1)} Tokens`}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-gray-400 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-xl transition-all"
              >
                <LogOut size={14} />
                <span>{t("chat.logout", "Đăng xuất")}</span>
              </button>
            </div>
          ) : (
            <div className="text-center p-1">
              <button
                onClick={() => handleMenuClick("profile")}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
              >
                {t("common.login", "Đăng nhập")}
              </button>
            </div>
          )}
        </div>
      </aside>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await api.deleteConversation(deleteId);
          setCurrentConversationId?.(null);
          setChatHistory?.([]);
          setDeleteId(null);
          window.dispatchEvent(new Event("reload_conversations"));
          setToastMessage(t("chat.deleteSuccess", "Đã xóa đoạn chat"));
          setShowToast(true);
          if (toastTimeout.current) {
            clearTimeout(toastTimeout.current);
          }
          toastTimeout.current = setTimeout(() => {
            setShowToast(false);
          }, 2500);
        }}
        title={t("chat.deleteHistory", "Xóa lịch sử?")}
        description={t("chat.deleteHistoryConfirm", "Bạn có chắc muốn xóa?")}
      />
      <Toast message={toastMessage} show={showToast} />
    </>
  );
};

export default MobileSidebar;
