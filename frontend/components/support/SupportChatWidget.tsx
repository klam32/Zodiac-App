import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_ROOT } from '../../api';
import { MessageSquare, X, Send, Cpu, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  conversation_id: number;
  sender_type: 'user' | 'admin' | 'ai';
  sender_id: number | null;
  message: string;
  created_at: string;
  is_read: number;
}

interface SupportChatWidgetProps {
  user: any;
}

const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [adminOnline, setAdminOnline] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const isApp = typeof window !== 'undefined' && (
    (window as any).FlutterBridge !== undefined ||
    document.cookie.includes('viewappmobie=true') ||
    /wv|WebView|FBAN|FBAV/i.test(navigator.userAgent)
  );

  // Draggable position state (offset from bottom-right corner)
  const [pos, setPos] = useState({ right: 20, bottom: 20 });
  const isDragging = useRef(false);
  const isPointerDown = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, right: 20, bottom: 20 });
  const fabRef = useRef<HTMLButtonElement>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);

  // ── Draggable FAB logic ────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isApp) return;
    e.preventDefault();
    isPointerDown.current = true;
    isDragging.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      right: pos.right,
      bottom: pos.bottom,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {
      console.error(err);
    }
  }, [pos, isApp]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isApp || !isPointerDown.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      isDragging.current = true;
    }
    if (!isDragging.current) return;

    const newRight = Math.max(8, Math.min(window.innerWidth - 68, dragStart.current.right - dx));
    const newBottom = Math.max(8, Math.min(window.innerHeight - 68, dragStart.current.bottom - dy));
    setPos({ right: newRight, bottom: newBottom });
  }, [isApp]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isApp) {
      setIsOpen(true);
      return;
    }
    if (isPointerDown.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        console.error(err);
      }
    }
    isPointerDown.current = false;
    if (!isDragging.current) {
      setIsOpen(true); // treat as tap
    }
    isDragging.current = false;
  }, [isApp]);



  // ── Conversation init ──────────────────────────────────────────────
  const initConversation = async () => {
    try {
      const res = await api.getSupportConversation();
      setConversationId(res.conversation_id);
      setAdminOnline(res.admin_online);
      const msgs = await api.getSupportMessages(res.conversation_id);
      setMessages(msgs || []);
    } catch (err: any) {
      console.error('Failed to init support conversation', err);
    }
  };

  useEffect(() => {
    if (user) initConversation();
  }, [user]);

  // ── WebSocket ──────────────────────────────────────────────────────
  const connectWebSocket = () => {
    if (!conversationId) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsProto = API_ROOT.startsWith('https') ? 'wss' : 'ws';
    const cleanHost = API_ROOT.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProto}://${cleanHost}/api/v1/ws/support?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 10000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence_update') {
          setAdminOnline(data.admin_online);
        } else if (data.type === 'message') {
          setMessages((prev) => {
            const idx = prev.findIndex((m) =>
              m.id === data.id ||
              (m.id >= 1000000000000 && m.sender_type === data.sender_type && m.message === data.message)
            );
            if (idx !== -1) return prev.map((m, i) => (i === idx ? data : m));
            return [...prev, data];
          });
          if (data.sender_type === 'ai') setIsAiTyping(false);
        } else if (data.type === 'status') {
          setIsAiTyping(data.status === 'ai_typing');
        } else if (data.type === 'conversation_resolved') {
          toast.success(t('support.resolved', 'Cuộc trò chuyện đã được giải quyết.'));
          initConversation();
        }
      } catch (e) {
        console.error('[WS Support] parse error', e);
      }
    };

    ws.onclose = (event) => {
      if (heartbeatIntervalRef.current) { clearInterval(heartbeatIntervalRef.current); heartbeatIntervalRef.current = null; }
      if (event.code === 4001) return;
      reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(), 5000);
    };
  };

  useEffect(() => {
    if (conversationId) connectWebSocket();
    return () => {
      socketRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [conversationId]);

  // ── Polling fallback ───────────────────────────────────────────────
  useEffect(() => {
    let id: any = null;
    if (isOpen && conversationId) {
      id = setInterval(async () => {
        if (!(socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
          try { setMessages((await api.getSupportMessages(conversationId)) || []); } catch {}
        }
      }, 4000);
    }
    return () => { if (id) clearInterval(id); };
  }, [isOpen, conversationId]);

  // ── Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, isOpen, isAiTyping]);

  // ── Send message ───────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversationId) return;
    const text = inputText.trim();
    setInputText('');

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: text, language: i18n.language || 'vi' }));
    } else {
      try {
        const temp: Message = { id: Date.now(), conversation_id: conversationId, sender_type: 'user', sender_id: user.id, message: text, created_at: new Date().toISOString(), is_read: 0 };
        setMessages((p) => [...p, temp]);
        const res = await api.sendSupportMessage(conversationId, text, i18n.language || 'vi');
        if (res?.status === 'ai_replied' && res.message) {
          const ai: Message = { id: Date.now() + 1, conversation_id: conversationId, sender_type: 'ai', sender_id: null, message: res.message, created_at: new Date().toISOString(), is_read: 0 };
          setMessages((p) => [...p, ai]);
        }
      } catch (err: any) { toast.error(err.message || t('support.sendFailed', 'Gửi tin thất bại')); }
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── Dialog dimensions (responsive) ─────────────────────────────────
  const isMobile = window.innerWidth <= 480;
  const dialogW = isMobile ? Math.min(340, window.innerWidth - 32) : 380;
  const dialogH = isMobile ? 420 : 520;

  // ── Dialog position (keep inside screen) ───────────────────────────
  const fabSize = 60;
  // dialog sits at bottom position
  const dialogBottom = pos.bottom;
  const dialogRight = Math.max(8, Math.min(pos.right, window.innerWidth - dialogW - 8));

  return (
    <>
      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes scw-in { from { opacity:0; transform:translateY(16px) scale(.95) } to { opacity:1; transform:none } }
        @keyframes scw-dot { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-4px) } }
      `}</style>

      {/* ── FAB (draggable) ── */}
      {!isOpen && (
        <button
          ref={fabRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'fixed',
            right: pos.right,
            bottom: pos.bottom,
            zIndex: 9999,
            width: fabSize,
            height: fabSize,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            color: '#fff',
            border: 'none',
            cursor: isApp ? 'grab' : 'pointer',
            boxShadow: '0 4px 20px rgba(59,130,246,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            userSelect: 'none',
            transition: 'box-shadow .2s',
          }}
          aria-label="Mở hỗ trợ"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* ── Expanded dialog ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: dialogRight,
            bottom: dialogBottom,
            zIndex: 9999,
            width: dialogW,
            height: dialogH,
            borderRadius: 20,
            background: 'rgba(15,23,42,.97)',
            border: '1px solid rgba(255,255,255,.1)',
            boxShadow: '0 16px 48px rgba(0,0,0,.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(16px)',
            animation: 'scw-in .3s cubic-bezier(.16,1,.3,1)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,rgba(59,130,246,.2),rgba(30,41,59,.4))', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={19} color="#3b82f6" />
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: adminOnline ? '#10b981' : '#f59e0b', border: '2px solid #0f172a' }} />
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#f3f4f6', fontSize: 14, fontWeight: 600 }}>{t('support.title', 'Hỗ trợ trực tuyến')}</h4>
                <span style={{ fontSize: 11, color: adminOnline ? '#10b981' : '#9ca3af' }}>
                  {adminOnline ? t('support.adminOnline', 'Admin trực tuyến') : t('support.aiMode', 'Trợ lý AI hỗ trợ')}
                </span>
              </div>
            </div>

            {/* Drag hint + close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {isApp && (
                <span style={{ color: '#4b5563', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <GripVertical size={12} /> kéo FAB
                </span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: 10, textAlign: 'center', padding: '0 16px' }}>
                <Cpu size={34} style={{ opacity: .5, color: '#3b82f6' }} />
                <span style={{ fontSize: 12 }}>{t('support.welcome', 'Xin chào! Hãy gửi câu hỏi nếu bạn gặp sự cố.')}</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender_type === 'user';
                const isAi = msg.sender_type === 'ai';
                return (
                  <div key={msg.id} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{ padding: '9px 13px', borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px', background: isUser ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'rgba(255,255,255,.05)', color: '#fff', fontSize: 13, lineHeight: 1.45, border: isAi ? '1px dashed rgba(59,130,246,.3)' : 'none', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: 9, color: '#6b7280', marginTop: 3, padding: '0 2px' }}>{fmt(msg.created_at)}</span>
                  </div>
                );
              })
            )}

            {isAiTyping && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{ padding: '9px 13px', borderRadius: '14px 14px 14px 2px', background: 'rgba(255,255,255,.05)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, .2, .4].map((delay, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: `scw-dot 1s infinite ${delay}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.05)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('support.placeholder', 'Nhập câu hỏi...')}
              style={{ flex: 1, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontSize: 13, outline: 'none' }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              style={{ width: 34, height: 34, borderRadius: 10, background: inputText.trim() ? '#3b82f6' : 'rgba(255,255,255,.05)', color: '#fff', border: 'none', cursor: inputText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}


    </>
  );
};

export default SupportChatWidget;
