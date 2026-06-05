import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_ROOT } from '../../api';
import { MessageSquare, X, Send, ShieldAlert, Cpu } from 'lucide-react';
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
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);

  // Initialize or fetch conversation
  const initConversation = async () => {
    try {
      const res = await api.getSupportConversation();
      setConversationId(res.conversation_id);
      setAdminOnline(res.admin_online);
      
      // Fetch messages
      const msgs = await api.getSupportMessages(res.conversation_id);
      setMessages(msgs || []);
    } catch (err: any) {
      console.error('Failed to init support conversation', err);
    }
  };

  useEffect(() => {
    if (user) {
      initConversation();
    }
  }, [user]);

  // Connect to WebSocket
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
      console.log('[WS Support] Connected');
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 10000); // Send ping every 10 seconds to keep connection alive
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'presence_update') {
          setAdminOnline(data.admin_online);
        } else if (data.type === 'message') {
          // If we receive our own message back or an admin/AI message
          setMessages((prev) => {
            const existingIndex = prev.findIndex((m) => {
              if (m.id === data.id) return true;
              if (m.id >= 1000000000000 && m.sender_type === data.sender_type && m.message === data.message) return true;
              return false;
            });
            if (existingIndex !== -1) {
              return prev.map((m, idx) => idx === existingIndex ? data : m);
            }
            return [...prev, data];
          });
          
          if (data.sender_type === 'ai') {
            setIsAiTyping(false);
          }
        } else if (data.type === 'status') {
          if (data.status === 'ai_typing') {
            setIsAiTyping(true);
          } else {
            setIsAiTyping(false);
          }
        } else if (data.type === 'conversation_resolved') {
          toast.success(t('support.resolved', 'Cuộc trò chuyện đã được đánh dấu giải quyết bởi admin.'));
          // Reload conversation history
          initConversation();
        }
      } catch (e) {
        console.error('[WS Support] Error parsing message', e);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS Support] Closed with code:', event.code);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (event.code === 4001) {
        console.warn('[WS Support] Closed due to expired or invalid token. Stopping reconnect loop.');
        return;
      }
      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };
  };

  useEffect(() => {
    if (conversationId) {
      connectWebSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [conversationId]);

  // Polling fallback when WebSocket is not connected
  useEffect(() => {
    let intervalId: any = null;

    if (isOpen && conversationId) {
      intervalId = setInterval(async () => {
        const isWsConnected = socketRef.current && socketRef.current.readyState === WebSocket.OPEN;
        if (!isWsConnected) {
          try {
            const msgs = await api.getSupportMessages(conversationId);
            setMessages(msgs || []);
          } catch (e) {
            console.error('[WS Support] Polling messages failed', e);
          }
        }
      }, 4000); // Poll every 4 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, conversationId]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen, isAiTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversationId) return;

    const messageText = inputText.trim();
    setInputText('');

    // If WebSocket is open, send via WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        message: messageText,
        language: i18n.language || 'vi'
      }));
    } else {
      // Fallback to HTTP API
      try {
        const tempMsg: Message = {
          id: Date.now(),
          conversation_id: conversationId,
          sender_type: 'user',
          sender_id: user.id,
          message: messageText,
          created_at: new Date().toISOString(),
          is_read: 0
        };
        setMessages(prev => [...prev, tempMsg]);
        
        const res = await api.sendSupportMessage(conversationId, messageText, i18n.language || 'vi');
        
        if (res && res.status === 'ai_replied' && res.message) {
          const aiMsg: Message = {
            id: Date.now() + 1,
            conversation_id: conversationId,
            sender_type: 'ai',
            sender_id: null,
            message: res.message,
            created_at: new Date().toISOString(),
            is_read: 0
          };
          setMessages(prev => [...prev, aiMsg]);
        }
      } catch (err: any) {
        toast.error(err.message || t('support.sendFailed', 'Gửi tin thất bại'));
      }
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'system-ui, sans-serif' }}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            outline: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Expanded Widget */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            height: '520px',
            borderRadius: '20px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            animation: 'widget-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 41, 59, 0.4) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={20} color="#3b82f6" />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: adminOnline ? '#10b981' : '#f59e0b',
                    border: '2px solid #0f172a'
                  }}
                />
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#f3f4f6', fontSize: '15px', fontWeight: '600' }}>
                  {t('support.title', 'Hỗ trợ trực tuyến')}
                </h4>
                <span style={{ fontSize: '11px', color: adminOnline ? '#10b981' : '#9ca3af' }}>
                  {adminOnline ? t('support.adminOnline', 'Admin trực tuyến') : t('support.aiMode', 'Trợ lý AI hỗ trợ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages scroll content */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: '10px', textAlign: 'center', padding: '0 20px' }}>
                <Cpu size={36} style={{ opacity: 0.5, color: '#3b82f6' }} />
                <span style={{ fontSize: '13px' }}>
                  {t('support.welcome', 'Xin chào! Hãy gửi câu hỏi nếu bạn gặp bất kỳ sự cố nào. Admin hoặc Trợ lý AI sẽ hỗ trợ bạn ngay.')}
                </span>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender_type === 'user';
                const isAi = msg.sender_type === 'ai';
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isUser ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        fontSize: '13px',
                        lineHeight: '1.45',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: isAi ? '1px dashed rgba(59, 130, 246, 0.3)' : 'none',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.message}
                    </div>
                    <span style={{ fontSize: '9px', color: '#6b7280', marginTop: '3px', padding: '0 2px' }}>
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                );
              })
            )}

            {isAiTyping && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '75%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 2px', background: 'rgba(255, 255, 255, 0.05)', color: '#9ca3af', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animation: 'typing-dots 1s infinite' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animation: 'typing-dots 1s infinite 0.2s' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animation: 'typing-dots 1s infinite 0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('support.placeholder', 'Nhập câu hỏi tại đây...')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: inputText.trim() ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: 'none',
                cursor: inputText.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Local keyframe animations style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes widget-slide-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes typing-dots {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      ` }} />
    </div>
  );
};

export default SupportChatWidget;
