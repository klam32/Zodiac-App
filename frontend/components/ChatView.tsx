// 

import React, { useState, useRef, useEffect, useMemo, useCallback, useDeferredValue } from 'react'
import { User, ChatMessage } from '../types'
import { api, API_ROOT } from '../api'
import AuthModal from './AuthModal'
import toast from 'react-hot-toast'
import { confirmDestructive } from '../utils/swal'
import ChatMessageItem from './chat/ChatMessageItem'
import AstrologyReadingForm from './chat/AstrologyReadingForm'
import LoveForm from './chat/LoveForm'
import { Trash2, Orbit, Send } from 'lucide-react'

const FIELD_AGENT_MAP: Record<string, string> = {
  "general": "astrology",
  "personality": "personality",
  "love": "love",
  "career": "career",
  "health": "health"
}

interface ChatViewProps {
  user: User | null
  onAuthRequired: () => void
  history: ChatMessage[]
  setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  onBalanceUpdate: (balance: number) => void
  siteConfig?: { logo_url: string, site_title: string }

  conversationId?: number | null
  setConversationId?: (id: number | null) => void
}

const ChatView: React.FC<ChatViewProps> = ({
  user,
  history,
  setHistory,
  onBalanceUpdate,
  siteConfig,
  conversationId,
  setConversationId: externalSetConversationId
}) => {

  const [isLoading, setIsLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [input, setInput] = useState("")
  const [selectedField, setSelectedField] = useState("general")
  const [userBirthData, setUserBirthData] = useState<any>(null)
  const deferredInput = useDeferredValue(input)
  const [isLoveMode, setIsLoveMode] = useState(false)
  const [showLoveForm, setShowLoveForm] = useState(false)
  const loveFormRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isComposing, setIsComposing] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, isLoading])

  useEffect(() => {
    if (!user) return
    if (conversationId) return
    loadLatestConversation()
  }, [user])

  useEffect(() => {
    const handleReset = () => {
      setSelectedField("general")
      setIsLoveMode(false)
      setShowLoveForm(false)
      setUserBirthData(null)
      setInput("")
    }

    window.addEventListener("NEW_CHAT_RESET", handleReset)

    return () => {
      window.removeEventListener("NEW_CHAT_RESET", handleReset)
    }
  }, [])
  const loadLatestConversation = async () => {
    try {
      const convRes = await api.getConversations()
      if (!convRes.conversations?.length) return
      const latest = convRes.conversations[0]
      externalSetConversationId?.(latest.id)
      loadConversationMessages(latest.id)
    } catch (err) {
      console.error(err)
    }
  }

  const loadConversationMessages = async (convId: number) => {
    try {
      const res = await api.getChatHistory()
      if (!res.history) return
      const filtered = res.history
        .filter((m: any) => m.conversation_id === convId)
        .map((m: any) => ({
          ...m,
          analysis: m.analysis || m.chart,
        }))
      setHistory(filtered)
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearHistory = async () => {
    if (!user) return
    const confirmed = await confirmDestructive(
      "Xóa lịch sử?",
      "Bạn có chắc muốn xóa toàn bộ lịch sử?"
    )
    if (!confirmed) return

    try {
      await api.deleteChatHistory()
      setHistory([])
      externalSetConversationId?.(null)
      window.dispatchEvent(new Event("reload_conversations"))
      toast.success("Đã xóa đoạn chat", {
        icon: "✅",
        style: {
          background: "#111",
          color: "#fff",
          border: "1px solid #333"
        }
      })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // =========================
  // 🔥 FIRST MESSAGE
  // =========================
  const handleAstrologySubmit = async (data: any) => {
    if (isLoading) return
    if (!user) {
      setShowAuthModal(true)
      return
    }

    setUserBirthData(data)
    if (data.partner) {
      setIsLoveMode(true)
    }
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: `Luận giải cho ${data.name}`,
      timestamp: new Date()
    }

    setHistory(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const response = await api.sendMessage({
        ...data,
        field: FIELD_AGENT_MAP[data.field] || "astrology",
        conversation_id: conversationId ?? undefined
      })

      externalSetConversationId?.(response.conversation_id ?? null)

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",

        // 🔥 FIX QUAN TRỌNG NHẤT
        content: response.chart || "",

        // 🔥 INIT không có answer → để rỗng
        answer: response.answer || "",

        chart: response.chart,
        timestamp: new Date(),
        tokens_charged: response.tokens_charged
      }

      if (response.sections && response.sections.length > 0) {
        (botMsg as any).sections = response.sections
      }

      if (response.chart_summary) (botMsg as any).chart_summary = response.chart_summary
      if (response.chart_svg) (botMsg as any).chart_svg = response.chart_svg
      if (response.partner_chart_svg) (botMsg as any).partner_chart_svg = response.partner_chart_svg

      // if (response.compatibility !== null && response.compatibility !== undefined) {
      // if (response.mode === "love") {
      //   (botMsg as any).compatibility = response.compatibility
      //   ;(botMsg as any).label = response.label
      //   ;(botMsg as any).partner_chart_svg = response.partner_chart_svg

      //   setShowLoveForm(false)
      // }
      if (response.partner_chart_svg) {
        (botMsg as any).compatibility = response.compatibility
          ; (botMsg as any).label = response.label
          ; (botMsg as any).partner_chart_svg = response.partner_chart_svg

        setShowLoveForm(false) // 🔥 CHẮC CHẮN CHẠY
      }

      setHistory(prev => [...prev, botMsg])
      onBalanceUpdate(response.user_token_balance)
      window.dispatchEvent(new Event("reload_conversations"))

    } catch (err: any) {
      toast.error(err.message)
      setHistory(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setIsLoading(false)
    }
  }

  // =========================
  // 🔥 FOLLOW-UP (FIXED)
  // =========================
  const sendChat = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    if (!conversationId) {
      toast.error("Chưa có cuộc trò chuyện")
      return
    }

    const message = input || "Phân tích thêm"

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date()
    }

    setHistory(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const response = await api.sendChatFollowup({
        conversation_id: conversationId,
        field: FIELD_AGENT_MAP[selectedField] || "astrology",
        question: message
      })

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.analysis || response.answer || "",
        answer: response.answer,
        chart: null,
        analysis: response.analysis,
        timestamp: new Date(),
        tokens_charged: response.tokens_charged,
        sources: response.sources
      }
      
      console.log("RAG Sources received from API:", response.sources);

      if (response.sections && response.sections.length > 0) {
        (botMsg as any).sections = response.sections
      }
      if (response.mode === "love") {
        (botMsg as any).compatibility = response.compatibility
          ; (botMsg as any).label = response.label
          ; (botMsg as any).partner_chart_svg = response.partner_chart_svg
      }

      setHistory(prev => [...prev, botMsg])
      onBalanceUpdate(response.user_token_balance)
      window.dispatchEvent(new Event("reload_conversations"))

    } catch (err: any) {
      toast.error(err.message)
      setInput(message === "Phân tích thêm" ? "" : message)
    } finally {
      setIsLoading(false)
    }

  }, [input, selectedField, conversationId, user])

  // =========================
  // 🔥 TAB SELECT (CLEAN)
  // =========================
  const selectField = useCallback((field: string) => {
    setSelectedField(field)

    const isLove = field === "love"

    setIsLoveMode(isLove)
    setShowLoveForm(isLove)
  }, [])

  const filteredHistory = history.filter(msg => {
    if (!msg.sections) return true

    return msg.sections.some(s =>
      s.agent === FIELD_AGENT_MAP[selectedField]
    )
  })

  const renderedMessages = useMemo(() => {
    return filteredHistory.map(msg => (
      <ChatMessageItem
        key={msg.id}
        msg={msg}
        userAvatar={user?.picture_url}
        botAvatar={
          siteConfig?.logo_url
            ? (siteConfig.logo_url.startsWith("/")
              ? `${API_ROOT}${siteConfig.logo_url}`
              : siteConfig.logo_url)
            : undefined
        }
      />
    ))
  }, [filteredHistory])//[filteredHistory, user?.picture_url, siteConfig?.logo_url])

  return (
    // <div className="flex-1 flex flex-col h-full bg-[#0a0a0f] text-white">
    <div className="flex-1 flex flex-col h-full bg-transparent text-white">

      <header className="h-12 border-b border-white/10 bg-transparent flex items-center justify-between px-4">
        <h2 className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          {siteConfig?.site_title || "Zodiac Whisper"}
        </h2>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-300">
              {(user.token_balance ?? 0).toFixed(2)} Tokens
            </span>

            <button
              onClick={handleClearHistory}
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">

        {!isLoveMode && history.length === 0 && (
          <AstrologyReadingForm
            onSubmit={handleAstrologySubmit}
            isLoading={isLoading}
            isLoggedIn={!!user}
            onAuthRequired={() => setShowAuthModal(true)}
          />
        )}

        {renderedMessages}

        {isLoveMode && showLoveForm && (
          <div ref={loveFormRef} className="mt-6">
            <LoveForm
              onSubmit={handleAstrologySubmit}
              isLoading={isLoading}
              userData={userBirthData}
            />
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center py-16">
            <div className="w-20 h-20 border border-blue-500 rounded-full flex items-center justify-center">
              <Orbit className="animate-spin text-blue-300" />
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="border-t border-white/5 bg-transparent p-2 sm:p-3 z-10 relative">

          {/* INPUT BOX */}
          <div className="relative group max-w-4xl mx-auto">
            {/* Animated Glow Background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-md opacity-20 group-focus-within:opacity-60 transition duration-1000 group-focus-within:duration-200"></div>

            <div className="relative flex items-end gap-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-2 pl-6 focus-within:border-purple-500/50 focus-within:bg-[#0a0a16]/80 transition-all duration-500 shadow-2xl">

              <textarea
                rows={1}
                value={input}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(e) => {
                  setIsComposing(false)
                  setInput(e.currentTarget.value)
                }}
                onChange={(e) => {
                  if (!isComposing) {
                    setInput(e.target.value)
                  }
                }}
                onKeyDown={(e) => {
                  if (isComposing) return
                  if (e.key === 'Enter') {
                    if (e.ctrlKey || e.shiftKey) return
                    e.preventDefault()
                    if (input.trim() && !isLoading) sendChat()
                  }
                }}
                placeholder="Hỏi về vận mệnh của bạn..."
                className="flex-1 min-h-[48px] max-h-32 py-3.5 bg-transparent border-none text-[15px] text-gray-100 placeholder:text-gray-500 focus:ring-0 resize-none no-scrollbar font-medium"
              />

              <button
                onClick={sendChat}
                disabled={isLoading || !input.trim()}
                className={`flex items-center justify-center min-w-[50px] h-[50px] rounded-2xl transition-all duration-300 transform ${input.trim() && !isLoading
                  ? "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-100 hover:scale-105 active:scale-95 opacity-100"
                  : "bg-white/5 text-gray-600 scale-95 opacity-50 cursor-not-allowed"
                  }`}
              >
                <Send className={`${isLoading ? "animate-pulse" : ""} w-5 h-5 ml-0.5`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(userData, token) => {
            setShowAuthModal(false)
            localStorage.setItem("access_token", token)
            window.location.reload()
          }}
        />
      )}

    </div>
  )
}

export default ChatView