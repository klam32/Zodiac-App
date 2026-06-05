import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_ROOT, getImageUrl } from '../../api';
import toast from 'react-hot-toast';

interface Conversation {
  id: number;
  user_id: number;
  status: 'open' | 'resolved';
  assigned_admin_id: number | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  username: string;
  email: string;
  full_name: string | null;
  picture_url: string | null;
  is_online?: boolean;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_type: 'user' | 'admin' | 'ai';
  sender_id: number | null;
  message: string;
  created_at: string;
  is_read: number;
}

interface SupportTabProps {
  adminUser: any;
}

const SupportTab: React.FC<SupportTabProps> = ({ adminUser }) => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('open');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const selectedConvRef = useRef<Conversation | null>(null);
  const heartbeatIntervalRef = useRef<any>(null);

  // Sync ref with state
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await api.adminGetSupportConversations();
      setConversations(res || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load conversations');
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsProto = API_ROOT.startsWith('https') ? 'wss' : 'ws';
    const cleanHost = API_ROOT.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProto}://${cleanHost}/api/v1/ws/support?token=${token}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[WS Admin] Connected');
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 10000); // Send ping every 10 seconds
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          const currentSelected = selectedConvRef.current;
          if (currentSelected && data.conversation_id === currentSelected.id) {
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
          }
          loadConversations();
        } else if (data.type === 'conversation_resolved') {
          const currentSelected = selectedConvRef.current;
          if (currentSelected && currentSelected.id === data.conversation_id) {
            setSelectedConv((prev) => prev ? { ...prev, status: 'resolved' } : null);
          }
          loadConversations();
        }
      } catch (e) {
        console.error('[WS Admin] Error parsing message', e);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS Admin] Closed with code:', event.code);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (event.code === 4001) {
        console.warn('[WS Admin] Closed due to expired or invalid token. Stopping reconnect loop.');
        return;
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };
  };

  useEffect(() => {
    loadConversations();
    connectWebSocket();

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
  }, []);

  // Polling fallback when WebSocket is not connected
  useEffect(() => {
    let intervalId: any = null;

    if (selectedConv) {
      intervalId = setInterval(async () => {
        const isWsConnected = socketRef.current && socketRef.current.readyState === WebSocket.OPEN;
        if (!isWsConnected) {
          try {
            const res = await api.adminGetSupportMessages(selectedConv.id);
            setMessages(res || []);
            loadConversations();
          } catch (e) {
            console.error('[WS Admin] Polling messages failed', e);
          }
        }
      }, 4000); // Poll every 4 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedConv]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConv) {
      const loadMessages = async () => {
        try {
          const res = await api.adminGetSupportMessages(selectedConv.id);
          setMessages(res || []);
        } catch (err: any) {
          toast.error(err.message || 'Failed to load messages');
        }
      };
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [selectedConv]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      // Optimistic message update
      const tempMsg: Message = {
        id: Date.now(),
        conversation_id: selectedConv.id,
        sender_type: 'admin',
        sender_id: adminUser?.id || 0,
        message: messageText,
        created_at: new Date().toISOString(),
        is_read: 0,
      };
      setMessages((prev) => [...prev, tempMsg]);

      // Call API
      await api.adminSendSupportMessage(selectedConv.id, messageText);
      loadConversations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    }
  };

  const handleResolve = async () => {
    if (!selectedConv) return;
    try {
      await api.adminResolveSupportConversation(selectedConv.id);
      toast.success(t('admin.resolvedSuccess', 'Đã đánh dấu giải quyết!'));
      setSelectedConv((prev) => prev ? { ...prev, status: 'resolved' } : null);
      loadConversations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve conversation');
    }
  };

  // Filter conversations
  const filteredConvs = conversations.filter((c) => {
    const matchesSearch =
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.full_name && c.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && c.status === filterStatus;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="support-dashboard-container" style={{ display: 'flex', height: 'calc(100vh - 130px)', background: '#0e121a', borderRadius: '16px', overflow: 'hidden', border: '1px solid #1f2937' }}>
      
      {/* Left pane: Conversation List */}
      <div className="support-sidebar-pane" style={{ width: '350px', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', background: '#111827', flexShrink: 0 }}>
        {/* Filters */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1f2937' }}>
          <input
            type="text"
            placeholder={t('admin.searchUser', 'Tìm người dùng...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f9fafb',
              outline: 'none',
              fontSize: '14px',
              marginBottom: '12px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['open', 'resolved', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: filterStatus === status ? '#3b82f6' : '#1f2937',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textTransform: 'capitalize',
                  fontWeight: filterStatus === status ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                {status === 'open' ? t('admin.statusOpen', 'Chưa xử lý') : status === 'resolved' ? t('admin.statusResolved', 'Đã xử lý') : t('admin.statusAll', 'Tất cả')}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list scroll area */}
        <div className="conv-scroll-list" style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConvs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              {t('admin.noConversations', 'Không có hội thoại nào')}
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #1f2937',
                    cursor: 'pointer',
                    background: isSelected ? '#1e293b' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background 0.2s ease'
                  }}
                  className="conv-item-hover"
                >
                  <div style={{ position: 'relative' }}>
                    {conv.picture_url ? (
                      <img
                        src={getImageUrl(conv.picture_url)}
                        alt={conv.username}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {conv.username[0].toUpperCase()}
                      </div>
                    )}
                    {conv.status === 'open' && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#10b981',
                          border: '2px solid #111827'
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#f3f4f6', fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {conv.full_name || conv.username}
                      </span>
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                        {formatDate(conv.last_message_at || conv.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {conv.last_message || t('admin.noMessages', 'Chưa có tin nhắn')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right pane: Chat Area */}
      <div className="support-chat-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
        {selectedConv ? (
          <>
            {/* Chat header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827' }}>
              <div>
                <h4 style={{ margin: 0, color: '#f3f4f6', fontSize: '16px', fontWeight: '600' }}>
                  {selectedConv.full_name || selectedConv.username}
                </h4>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{selectedConv.email}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: selectedConv.status === 'open' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                    color: selectedConv.status === 'open' ? '#10b981' : '#9ca3af',
                    border: `1px solid ${selectedConv.status === 'open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`
                  }}
                >
                  {selectedConv.status === 'open' ? t('admin.statusOpen', 'Chưa xử lý') : t('admin.statusResolved', 'Đã xử lý')}
                </span>
                {selectedConv.status === 'open' && (
                  <button
                    onClick={handleResolve}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      transition: 'background 0.2s'
                    }}
                    className="btn-hover-resolve"
                  >
                    {t('admin.markResolved', 'Đánh dấu đã xử lý')}
                  </button>
                )}
              </div>
            </div>

            {/* Message Area */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg) => {
                const isAdminMsg = msg.sender_type === 'admin';
                const isAiMsg = msg.sender_type === 'ai';
                
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isAdminMsg ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAdminMsg ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: isAdminMsg
                          ? '#3b82f6'
                          : isAiMsg
                          ? '#1e293b'
                          : '#374151',
                        color: '#fff',
                        border: isAiMsg ? '1px dashed #4b5563' : 'none',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.message}
                    </div>
                    <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', padding: '0 4px' }}>
                      {formatDate(msg.created_at)} {isAiMsg && '(AI Support)'}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSend}
              style={{
                padding: '20px 24px',
                borderTop: '1px solid #1f2937',
                background: '#111827',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  selectedConv.status === 'resolved'
                    ? t('admin.chatResolvedDisabled', 'Hội thoại đã hoàn thành. Hãy mở lại để chat tiếp.')
                    : t('admin.chatInputPlaceholder', 'Nhập câu trả lời...')
                }
                disabled={selectedConv.status === 'resolved'}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: '1px solid #374151',
                  background: selectedConv.status === 'resolved' ? '#1f2937' : '#1f2937',
                  color: selectedConv.status === 'resolved' ? '#9ca3af' : '#f9fafb',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || selectedConv.status === 'resolved'}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: !inputText.trim() || selectedConv.status === 'resolved' ? '#374151' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  cursor: !inputText.trim() || selectedConv.status === 'resolved' ? 'default' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'background 0.2s'
                }}
              >
                {t('admin.send', 'Gửi')}
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: '16px' }}>
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span style={{ fontSize: '15px' }}>
              {t('admin.selectConvToStart', 'Chọn một hội thoại bên trái để bắt đầu hỗ trợ')}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default SupportTab;
