import React from "react"
import { User, View, Conversation } from "../types"
import { api, getImageUrl } from "../api"
import { Sparkles, DollarSign, Shield, Star, User as UserIcon, Trash, Calendar, Zap, Pin, Edit2, Check, X, Home, Gift } from "lucide-react"
import ConfirmModal from "./ConfirmModal"
import Toast from "./Toast"

interface SidebarProps {
  user: User | null
  currentView: View
  onViewChange: (view: View) => void
  onLogout: () => void
  siteConfig?: { logo_url: string; site_title: string }

  conversations?: Conversation[]
  setChatHistory?: React.Dispatch<any>
  setCurrentConversationId?: (id: number | null) => void
  currentConversationId?: number | null
  createNewChat?: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
  isNative?: boolean
  isVisible?: boolean
  onToggleVisible?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
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
  isMobileOpen,
  onCloseMobile,
  isNative,
  isVisible = true,
  onToggleVisible,
}) => {
  const [imgError, setImgError] = React.useState(false)
  const [logoImgError, setLogoImgError] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [showToast, setShowToast] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState("")
  const toastTimeout = React.useRef<any>(null)

  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editingTitle, setEditingTitle] = React.useState("")
  const [contextMenuId, setContextMenuId] = React.useState<number | null>(null)

  React.useEffect(() => {
    setLogoImgError(false)
  }, [siteConfig?.logo_url])

  const navItems = [
    { id: "landing" as View, label: "Trang Chủ", icon: Home },
    { id: "chat" as View, label: "Chiêm Tinh", icon: Star },
    { id: "calendar" as View, label: "Lịch Cát Tường", icon: Calendar },
    { id: "prediction" as View, label: "Vận Trình Ngày", icon: Zap },
    { id: "rewards" as View, label: "Nhận Token", icon: Gift },
    { id: "payment" as View, label: "Nạp Tokens", icon: DollarSign },
    ...(user?.is_admin
      ? [
        {
          id: "admin" as View,
          label: "ADMIN",
          icon: Shield,
        },
      ]
      : []),
    { id: "profile" as View, label: "Hồ Sơ", icon: UserIcon },
  ]

  // =========================
  // LOAD CONVERSATION
  // =========================

  const loadConversation = async (convId: number) => {
    try {
      const res = await api.getChatHistory()

      const filtered = res.history
        .filter((m: any) => m.conversation_id === convId)
        .map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))

      setChatHistory?.(filtered)
      setCurrentConversationId?.(convId)

      // 🔥 KIỂM TRA TIÊU ĐỀ ĐỂ CHỌN VIEW PHÙ HỢP
      const conv = conversations?.find(c => c.id === convId)
      if (conv?.title?.startsWith("[Lịch Cát Tường]")) {
        onViewChange("calendar")
      } else if (conv?.title?.startsWith("[Vận Trình Ngày]")) {
        onViewChange("prediction")
      } else {
        onViewChange("chat")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handlePin = async (e: React.MouseEvent, convId: number, currentPinned: boolean) => {
    e.stopPropagation()
    try {
      await api.toggleConversationPin(convId, !currentPinned)
      window.dispatchEvent(new Event("reload_conversations"))
      setToastMessage(!currentPinned ? "Đã ghim đoạn chat" : "Đã bỏ ghim đoạn chat")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  const startEditing = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditingTitle(conv.title)
  }

  const saveTitle = async (e: React.MouseEvent | React.KeyboardEvent, convId: number) => {
    if (e.type === "click" || (e as React.KeyboardEvent).key === "Enter") {
      try {
        await api.updateConversationTitle(convId, editingTitle)
        setEditingId(null)
        window.dispatchEvent(new Event("reload_conversations"))
        setToastMessage("Đã đổi tên đoạn chat")
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
  }

  const handleContextMenu = (e: React.MouseEvent, convId: number) => {
    e.preventDefault()
    setContextMenuId(contextMenuId === convId ? null : convId)
  }

  // Click outside to hide context menu
  React.useEffect(() => {
    const handleClick = () => setContextMenuId(null)
    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
  }, [])

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        ${isMobileOpen ? 'fixed inset-y-0 left-0 z-[100] flex shadow-2xl' : 'hidden md:flex'} 
        ${isVisible || isMobileOpen ? 'w-[280px]' : 'w-[72px]'} 
        bg-[#0a0a0f]/80 backdrop-blur-2xl border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)] flex-col h-screen transition-all duration-400 overflow-hidden relative
      `}>
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

        {/* MAIN */}
        <div className="flex flex-col flex-1 overflow-hidden px-3 pt-4 pb-2">

          {/* HEADER */}
          <div className="flex items-center gap-2 px-2 mb-4 shrink-0">

            {isVisible && siteConfig?.logo_url && !logoImgError ? (
              <img
                src={getImageUrl(siteConfig.logo_url)}
                className="w-10 h-10 object-contain rounded-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                alt="Logo"
                onError={() => setLogoImgError(true)}
              />
            ) : (
              isVisible && (
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
              )
            )}

            {isVisible && (
              <h1 className="text-base font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent tracking-wide flex-1 truncate drop-shadow-sm">
                {siteConfig?.site_title || "Zodiac Whisper"}
              </h1>
            )}

            {/* TOGGLE BUTTON */}
            {!isNative && onToggleVisible && (
              <button
                onClick={onToggleVisible}
                className={`p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-all ${!isVisible ? 'mx-auto' : ''}`}
                title={isVisible ? "Đóng sidebar" : "Mở sidebar"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>
            )}

          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-2">
            {/* NAVIGATION */}
            {!isNative && (
              <nav className="space-y-1 mb-4 shrink-0">
              {navItems.map((item) => {
                const isItemActive = currentView === item.id && (item.id !== "chat" || currentConversationId !== null);

                return (
                  <React.Fragment key={item.id}>
                    <button
                      onClick={() => {
                        onViewChange(item.id)
                        if (item.id !== "chat") {
                          setCurrentConversationId?.(null)
                          setChatHistory?.([])
                        }
                        if (isMobileOpen) onCloseMobile?.()
                      }}
                      className={`flex items-center ${isVisible ? 'gap-3 w-full px-4' : 'justify-center w-11 h-11 mx-auto'} py-2.5 text-sm rounded-xl transition-all duration-300 relative group ${isItemActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      title={!isVisible ? item.label : ""}
                    >
                      <item.icon size={isVisible ? 20 : 24} className={`transition-transform duration-300 ${isItemActive ? 'text-purple-300' : 'group-hover:scale-110'}`} />
                      {isVisible && <span className="tracking-wide">{item.label}</span>}
                    </button>

                    {/* NEW CHAT BUTTON - Below Trang Chủ */}
                    {item.id === "landing" && user && (
                      <button
                        onClick={() => {
                          setChatHistory?.([])
                          setCurrentConversationId?.(null)
                          onViewChange("chat")
                          // 🔥 RESET UI CHATVIEW
                          window.dispatchEvent(new Event("NEW_CHAT_RESET"))
                          createNewChat?.()
                        }}
                        className={`flex items-center ${isVisible ? 'gap-3 w-full px-4 mt-2' : 'justify-center w-11 h-11 mx-auto mt-2'} py-2.5 text-sm rounded-xl transition-all duration-300 tracking-wide group ${currentView === "chat" && currentConversationId === null
                          ? "bg-white/10 text-white font-medium"
                          : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                          }`}
                        title={!isVisible ? "Đoạn chat mới" : ""}
                      >
                        <Sparkles size={isVisible ? 20 : 24} className={currentView === "chat" && currentConversationId === null ? "text-purple-300" : "text-purple-400 group-hover:text-purple-300"} />
                        {isVisible && "Đoạn chat mới"}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          {/* CONVERSATION HISTORY */}
          {isVisible && conversations && conversations.length > 0 && (
            <div className="flex flex-col mt-2">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gray-500 px-4 mb-3 shrink-0">
                Các đoạn chat của bạn
              </p>
              <div className="flex flex-col space-y-1.5 px-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onContextMenu={(e) => handleContextMenu(e, conv.id)}
                    className={`flex items-center justify-between group rounded-xl transition-all duration-200 px-2 py-0.5 border ${currentConversationId === conv.id
                      ? "bg-white/10 border-white/10 shadow-sm backdrop-blur-md"
                      : "border-transparent hover:bg-white/5 hover:border-white/5"
                      }`}
                  >
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-1 w-full py-1">
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => saveTitle(e, conv.id)}
                          className="flex-1 bg-[#0f0f11] text-sm text-white px-2 py-1 rounded border border-blue-500 outline-none"
                        />
                        <button onClick={(e) => saveTitle(e, conv.id)} className="text-green-400 hover:text-green-300">
                          <Check size={16} />
                        </button>
                        <button onClick={cancelEditing} className="text-red-400 hover:text-red-300">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            loadConversation(conv.id)
                            if (isMobileOpen) onCloseMobile?.()
                          }}
                          className={`flex-1 text-left px-1 py-2 text-sm truncate transition flex items-center gap-2 ${currentConversationId === conv.id
                            ? "text-white font-medium"
                            : "text-gray-400 hover:text-gray-200"
                            }`}
                        >
                          {!!conv.is_pinned && <Pin size={12} className="text-yellow-500 fill-yellow-500" />}
                          <span className="truncate">
                            {(() => {
                              const t = (conv.title || "").trim().toLowerCase()
                              if (!t || t === "mới") return "Đoạn chat mới"
                              return conv.title
                            })()}
                          </span>
                        </button>

                        {contextMenuId === conv.id && (
                          <div className="flex items-center gap-1 transition-opacity">
                            <button
                              onClick={(e) => handlePin(e, conv.id, !!conv.is_pinned)}
                              className={`${conv.is_pinned ? "text-yellow-500" : "text-gray-500 hover:text-yellow-500"}`}
                              title={conv.is_pinned ? "Bỏ ghim" : "Ghim"}
                            >
                              <Pin size={16} />
                            </button>
                            <button
                              onClick={(e) => startEditing(e, conv)}
                              className="text-gray-500 hover:text-blue-400"
                              title="Đổi tên"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteId(conv.id)
                              }}
                              className="text-gray-500 hover:text-red-500"
                              title="Xóa"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* USER FOOTER */}
        <div className="border-t border-white/10 px-3 py-2">

          {user ? (
            <>
              <div
                onClick={() => onViewChange("profile")}
                className={`flex items-center ${isVisible ? 'gap-2.5 mb-1 p-1.5' : 'justify-center mb-2 p-0'} cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl transition-all duration-300 group`}
                title={!isVisible ? (user.full_name || user.username) : ""}
              >
                <div className="relative">
                  {user.picture_url && !imgError ? (
                    <img
                      src={user.picture_url}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:ring-purple-400 transition-all"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-2 ring-purple-500/50">
                      {(user.username || "U")[0].toUpperCase()}
                    </div>
                  )}
                  {/* Online Indicator */}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0f0f11] rounded-full"></div>
                </div>

                {isVisible && (
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-[10px] font-medium text-purple-400/80 truncate">
                      {user.is_admin
                        ? "ADMIN"
                        : (user.token_balance ?? 0).toFixed(2) + " Tokens"}
                    </p>
                  </div>
                )}
              </div>

              {isVisible && (
                <button
                  onClick={onLogout}
                  className="w-full py-1.5 text-[11px] font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                >
                  Đăng xuất
                </button>
              )}
            </>
          ) : (
            <div className="text-center p-2">
              <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-3 font-medium">
                Lưu trữ vận mệnh
              </p>
              <button
                onClick={() => onViewChange("profile")}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2.5 rounded-xl text-sm shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 transition-all"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

        </div>
      </aside>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return

          await api.deleteConversation(deleteId)

          setCurrentConversationId?.(null)
          setChatHistory?.([])

          setDeleteId(null)

          window.dispatchEvent(new Event("reload_conversations"))

          setToastMessage("Đã xóa đoạn chat")
          setShowToast(true)

          if (toastTimeout.current) {
            clearTimeout(toastTimeout.current)
          }

          toastTimeout.current = setTimeout(() => {
            setShowToast(false)
          }, 2500)
        }}
        title="Xóa lịch sử?"
        description="Bạn có chắc muốn xóa toàn bộ lịch sử?"
      />
      <Toast message={toastMessage} show={showToast} />
    </>
  )
}

export default Sidebar
