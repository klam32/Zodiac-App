//API.TS
import { AuthResponse, ChatResponse, PaymentPackage, PaymentInvoice, PaymentStatus, User } from './types';

const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

const getApiRoot = (): string => {
  // Hardcode Cloudflare/Ngrok tunnel for production (Vercel)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://railcar-frostbite-alumni.ngrok-free.dev';
  }
  
  // Ưu tiên env var (dùng khi deploy Vercel)
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.trim();
  // Native Android emulator
  if (isNative) return 'http://10.0.2.2:2643';
  // Tự động dùng cùng hostname với trang web:
  // - localhost:3000 → gọi localhost:2643
  // - 192.168.1.22:3000 → gọi 192.168.1.22:2643 (LAN)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:2643`;
};

export const API_ROOT = getApiRoot().trim();
const BASE_URL = `${API_ROOT}/api/v1`;

export const getImageUrl = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const fullUrl = path.startsWith('/') ? `${API_ROOT}${path}` : path;
  if (fullUrl.includes('ngrok-free')) {
    return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}ngrok-skip-browser-warning=69420`;
  }
  return fullUrl;
};

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'ngrok-skip-browser-warning': '69420', // Bypass ngrok warning page
  };
};

export const api = {
  // Auth
  async login(formData: FormData): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Đăng nhập thất bại');
    return response.json();
  },

  async register(formData: FormData): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Đăng ký thất bại');
    return response.json();
  },

  async checkAuth(): Promise<User> {
    const response = await fetch(`${BASE_URL}/auth/check`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Phiên làm việc hết hạn');
    const data = await response.json();
    return data.user;
  },

  async getGoogleLoginUrl(): Promise<string> {
    const response = await fetch(`${BASE_URL}/auth/google/login`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    return data.auth_url;
  },

  // =========================
  // CHAT
  // =========================

  // 🔥 FIX: thêm conversation_id
  async sendMessage(request: {
    conversation_id?: number | null,
    name: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    city: string,
    country: string,
    field: string,
    context: string
  }): Promise<ChatResponse> {

    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Không thể gửi tin nhắn');
    }

    return response.json();
  },

  // 🔥 FIX: giữ conversation_id trong history
  async getChatHistory(): Promise<{ history: any[] }> {

    const response = await fetch(`${BASE_URL}/history`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Không thể tải lịch sử chat');

    const data = await response.json();

    return {
      history: data.history || []
    };
  },

  async deleteChatHistory(): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/history`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể xóa lịch sử chat');
    return response.json();
  },

  async getSiteConfig(): Promise<{ 
    logo_url: string, 
    site_title: string, 
    background_url: string, 
    favicon_url?: string,
    hero_title?: string,
    hero_subtitle?: string,
    about_title?: string,
    about_content?: string,
    blog_posts?: any[]
  }> {
    const response = await fetch(`${BASE_URL}/config`);
    if (!response.ok) throw new Error('Không thể tải cấu hình website');
    return response.json();
  },

  // 🔥 FIX: chat followup có conversation_id
  async sendChatFollowup(data: {
    conversation_id: number,
    field: string,
    question?: string
  }) {

    const res = await fetch(`${BASE_URL}/chat-followup`, {
      method: "POST",
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || "Chat lỗi")
    }

    return res.json()

  },

  async formatRagText(text: string): Promise<{ formatted_text: string }> {
    const res = await fetch(`${BASE_URL}/format-rag-text`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Không thể format text');
    }
    return res.json();
  },

  // =========================
  // PAYMENT
  // =========================

  async getPackages(): Promise<{ packages: PaymentPackage[] }> {
    const response = await fetch(`${BASE_URL}/payment/packages`);
    if (!response.ok) throw new Error('Không thể tải gói nạp');
    return response.json();
  },

  async createInvoice(packageId: number): Promise<PaymentInvoice> {
    const formData = new FormData();
    formData.append('package_id', packageId.toString());
    const response = await fetch(`${BASE_URL}/payment/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Không thể tạo hóa đơn');
    return response.json();
  },

  async getPaymentStatus(paymentId: number): Promise<PaymentStatus> {
    const response = await fetch(`${BASE_URL}/payment/status/${paymentId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể kiểm tra trạng thái');
    return response.json();
  },

  async getTokenHistory(): Promise<{ history: any[] }> {
    const response = await fetch(`${BASE_URL}/auth/tokens/history`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải lịch sử giao dịch');
    return response.json();
  },

  // =========================
  // ADMIN
  // =========================

  async adminGetUsers(): Promise<{ users: any[] }> {
    const response = await fetch(`${BASE_URL}/admin/users`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải danh sách người dùng');
    return response.json();
  },

  async adminUpdateUserBalance(userId: number, adjustment: number | { type: string, amount: number }): Promise<any> {
    const body = typeof adjustment === 'number' ? { token_balance: adjustment } : adjustment;
    const response = await fetch(`${BASE_URL}/admin/users/${userId}/balance`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Cập nhật số dư thất bại');
    return response.json();
  },

  async adminDeleteUser(userId: number): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Xóa người dùng thất bại');
    return response.json();
  },

  async adminGetUserDetail(userId: number): Promise<{ user: any, token_history: any[], chat_logs: any[] }> {
    const response = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải chi tiết người dùng');
    return response.json();
  },

  async adminUpdateUser(userId: number, data: { full_name?: string, password?: string, token_balance?: number, is_admin?: number }): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Cập nhật người dùng thất bại');
    return response.json();
  },

  async userProfileUpdate(data: { full_name?: string, picture_url?: string, current_password?: string, new_password?: string }): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'Cập nhật hồ sơ thất bại');
    }
    return response.json();
  },

  async adminGetPackages(): Promise<{ packages: PaymentPackage[] }> {
    const response = await fetch(`${BASE_URL}/admin/packages`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải danh sách gói nạp');
    return response.json();
  },

  async adminCreatePackage(pkg: { name: string, tokens: number, amount_vnd: number }): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/packages`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    if (!response.ok) throw new Error('Tạo gói nạp thất bại');
    return response.json();
  },

  async adminDeletePackage(packageId: number): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/packages/${packageId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Xóa gói nạp thất bại');
    return response.json();
  },

  async adminUpdatePackage(packageId: number, pkg: { name: string, tokens: number, amount_vnd: number }): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/packages/${packageId}`, {
      method: 'PUT',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    if (!response.ok) throw new Error('Cập nhật gói nạp thất bại');
    return response.json();
  },

  async adminGetTokenHistory(): Promise<{ history: any[] }> {
    const response = await fetch(`${BASE_URL}/admin/token-history`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải lịch sử token toàn hệ thống');
    return response.json();
  },

  async adminGetPayments(): Promise<{ payments: any[] }> {
    const response = await fetch(`${BASE_URL}/admin/payments`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải lịch sử thanh toán');
    return response.json();
  },

  async adminGetChatLogs(): Promise<{ logs: any[] }> {
    const response = await fetch(`${BASE_URL}/admin/chat-logs`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải lịch sử chat');
    return response.json();
  },

  async adminGetSettings(): Promise<{
    rate: number,
    logo_url: string,
    background_url: string,
    site_title: string,
    seo_description: string,
    seo_keywords: string,
    seo_author: string,
    favicon_url: string,
    no_answer_fallback: string,
    rate_per_1000: number,
    hero_title: string,
    hero_subtitle: string,
    about_title: string,
    about_content: string
  }> {
    const response = await fetch(`${BASE_URL}/admin/settings`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải cấu hình hệ thống');
    return response.json();
  },

  async adminSyncFromHtml(): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/sync-from-html`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Đồng bộ từ link HTML thất bại');
    return response.json();
  },

  async adminUpdateSettings(settings: {
    rate_per_1000?: number,
    logo_url?: string,
    background_url?: string,
    favicon_url?: string,
    site_title?: string,
    seo_description?: string,
    seo_keywords?: string,
    seo_author?: string,
    no_answer_fallback?: string,
    hero_title?: string,
    hero_subtitle?: string,
    about_title?: string,
    about_content?: string
  }): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Cập nhật cấu hình thất bại');
    return response.json();
  },

  async adminUploadLogo(file: File): Promise<{ logo_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/admin/upload-logo`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Tải lên logo thất bại');
    return response.json();
  },

  async adminGetActiveUsers(): Promise<{ logins: any[] }> {
    const response = await fetch(`${BASE_URL}/admin/active-users`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải danh sách người dùng online');
    return response.json();
  },

  async adminGetPaymentReports(): Promise<{ reports: any[] }> {
    const response = await fetch(`${BASE_URL}/admin/payment-reports`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải danh sách báo cáo thanh toán');
    return response.json();
  },
  
  // BLOG
  async adminGetBlogPosts(): Promise<{ posts: any[] }> {
    const response = await fetch(`${BASE_URL}/admin/blog`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể tải danh sách bài viết');
    return response.json();
  },

  async adminCreateBlogPost(data: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/blog`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Tạo bài viết thất bại');
    return response.json();
  },

  async adminUpdateBlogPost(postId: number, data: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/blog/${postId}`, {
      method: 'PUT',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Cập nhật bài viết thất bại');
    return response.json();
  },

  async adminDeleteBlogPost(postId: number): Promise<any> {
    const response = await fetch(`${BASE_URL}/admin/blog/${postId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Xóa bài viết thất bại');
    return response.json();
  },

  async adminUploadBlogImage(file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/admin/upload-blog-image`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Tải lên ảnh bài viết thất bại');
    return response.json();
  },

  async createPaymentReport(description: string): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('description', description);

    const response = await fetch(`${BASE_URL}/payment/report`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'Không thể gửi báo cáo thanh toán');
    }

    return response.json();
  },
  // =========================
  // CONVERSATIONS
  // =========================

  async getConversations() {

    const res = await fetch(`${BASE_URL}/conversations`, {
      headers: getHeaders()
    })

    if (!res.ok) {
      throw new Error("Không tải được conversations")
    }

    return res.json()

  },

  async createConversation() {

    const res = await fetch(`${BASE_URL}/conversations`, {
      method: "POST",
      headers: getHeaders()
    })

    if (!res.ok) {
      throw new Error("Không tạo được conversation")
    }

    return res.json()

  },
  async deleteConversation(id: number) {

    const res = await fetch(`${BASE_URL}/conversations/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    })

    if (!res.ok) {
      throw new Error("Xóa conversation lỗi")
    }

    return res.json()

  },

  async updateConversationTitle(id: number, title: string) {
    const res = await fetch(`${BASE_URL}/conversations/${id}/title`, {
      method: "PUT",
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    })

    if (!res.ok) {
      throw new Error("Cập nhật tiêu đề lỗi")
    }

    return res.json()
  },

  async toggleConversationPin(id: number, is_pinned: boolean) {
    const res = await fetch(`${BASE_URL}/conversations/${id}/pin`, {
      method: "PUT",
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_pinned }),
    })

    if (!res.ok) {
      throw new Error("Cập nhật ghim lỗi")
    }

    return res.json()
  },

  async getGoodBadDays(data: {
    month: number,
    year: number,
    field: string,
    birth_info?: any,
    conversation_id?: number
  }): Promise<{
    days: { day: number, quality: 'good' | 'bad' | 'neutral', reason: string }[],
    user_token_balance: number,
    tokens_charged: number,
    summary: string,
    chart_svg: string
  }> {
    const response = await fetch(`${BASE_URL}/calendar/good-bad-days`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Không thể lấy dữ liệu lịch');
    }
    return response.json();
  },

  async getDailyPrediction(data: {
    date: string,
    field: string,
    birth_info: any,
    conversation_id?: number
  }): Promise<{
    prediction: { score: number, content: string, cosmic_message: string },
    user_token_balance: number,
    tokens_charged: number,
    chart_svg?: string
  }> {
    const response = await fetch(`${BASE_URL}/prediction/daily`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Không thể lấy dự đoán hàng ngày');
    }
    return response.json();
  }
};
