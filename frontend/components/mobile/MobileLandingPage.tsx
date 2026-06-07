import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  Calendar, 
  Zap, 
  ChevronRight, 
  ShieldCheck, 
  MessageSquare, 
  Volume2, 
  DollarSign, 
  Check, 
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { User, View } from '../../types';
import { api, getImageUrl } from '../../api';

interface MobileLandingPageProps {
  user: User | null;
  onViewChange: (view: View) => void;
  onLoginClick: () => void;
  siteConfig: any;
}

interface PaymentPackage {
  id: number;
  name: string;
  tokens: number;
  amount_vnd: number;
}

const MobileLandingPage: React.FC<MobileLandingPageProps> = ({
  user,
  onViewChange,
  onLoginClick,
  siteConfig
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language && i18n.language.startsWith('en')) ? 'en' : 'vi';
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  // Helper to fetch localized config values
  const getVal = (key: string, defaultVal: string = '') => {
    if (!siteConfig) return defaultVal;
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const siteTitle = getVal('site_title', 'Zodiac Whisper');
  const replaceBrand = (text: string) => {
    return text.replace(/Zodiac Whisper/gi, siteTitle);
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.getPackages();
        if (res?.packages && res.packages.length > 0) {
          setPackages(res.packages);
        } else {
          setPackages(getDefaultPackages());
        }
      } catch (err) {
        console.error('Failed to load packages in mobile landing', err);
        setPackages(getDefaultPackages());
      } finally {
        setIsLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  const getDefaultPackages = (): PaymentPackage[] => [
    { id: 1, name: currentLang === 'en' ? 'Starter Pack' : 'Gói Khởi Đầu', tokens: 100, amount_vnd: 50000 },
    { id: 2, name: currentLang === 'en' ? 'Pro Pack' : 'Gói Chuyên Nghiệp', tokens: 300, amount_vnd: 120000 },
    { id: 3, name: currentLang === 'en' ? 'VIP Pack' : 'Gói VIP', tokens: 1000, amount_vnd: 350000 }
  ];

  const getPackageFeatures = (tokens: number) => {
    if (tokens <= 150) {
      return [
        t('landing.pricing.feature.basic_chat', 'Trò chuyện AI luận giải cơ bản'),
        t('landing.pricing.feature.chart_gen', 'Dựng bản đồ sao cá nhân'),
        t('landing.pricing.feature.duration_short', 'Hạn sử dụng: Vô thời hạn')
      ];
    } else if (tokens <= 500) {
      return [
        t('landing.pricing.feature.pro_chat', 'Hỏi đáp AI chiêm tinh nâng cao'),
        t('landing.pricing.feature.love_check', 'So sánh lá số đôi lứa (Synastry)'),
        t('landing.pricing.feature.cal_lookup', 'Tra cứu lịch cát tường đầy đủ')
      ];
    } else {
      return [
        t('landing.pricing.feature.vip_chat', 'Tất cả tính năng cao cấp nhất'),
        t('landing.pricing.feature.voice_out', 'Hỗ trợ Voice Out đọc to luận giải'),
        t('landing.pricing.feature.vip_badge', 'Hỗ trợ VIP 24/7 từ quản trị viên')
      ];
    }
  };

  const features = [
    {
      id: 'chat' as View,
      title: t('landing.features.chart.title', 'Giải mã bản đồ sao cá nhân'),
      desc: t('landing.features.chart.desc', 'Tạo và phân tích chi tiết bản đồ sao hoàng đạo dựa trên thông tin chính xác ngày giờ sinh.'),
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'calendar' as View,
      title: t('landing.features.calendar.title', 'Lịch cát tường'),
      desc: t('landing.features.calendar.desc', 'Lựa chọn các ngày lành tháng tốt cho các hoạt động lớn như ký hợp đồng, cưới hỏi, xuất hành.'),
      icon: Calendar,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'prediction' as View,
      title: t('landing.features.daily.title', 'Vận trình ngày'),
      desc: t('landing.features.daily.desc', 'Nhận dự báo năng lượng chi tiết từng ngày cùng lời khuyên hành động thông thái.'),
      icon: Zap,
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 'chat' as View,
      title: t('landing.features.chatbot.title', 'Chatbot AI hỏi đáp chiêm tinh'),
      desc: t('landing.features.chatbot.desc', 'Trò chuyện thời gian thực với trợ lý AI chiêm tinh am hiểu sâu rộng kiến thức huyền học.'),
      icon: MessageSquare,
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'chat' as View,
      title: t('landing.features.voice.title', 'Voice Out đọc luận giải'),
      desc: t('landing.features.voice.desc', 'Nghe trợ lý ảo đọc to các bản luận giải chi tiết bằng công nghệ chuyển văn bản thành giọng nói.'),
      icon: Volume2,
      color: 'from-teal-500 to-emerald-600'
    }
  ];

  const handleCta = (view: View) => {
    if (!user && (view === 'chat' || view === 'calendar' || view === 'prediction' || view === 'payment')) {
      onLoginClick();
    } else {
      onViewChange(view);
    }
  };

  const getMobileBackgroundStyle = () => {
    const useAppBg = siteConfig?.use_app_background === '1' || siteConfig?.use_app_background === 1 || siteConfig?.use_app_background === true;
    const appBgUrl = siteConfig?.background_app_url;
    const webBgUrl = siteConfig?.background_url;

    if (useAppBg && appBgUrl) {
      return {
        backgroundImage: `url("${getImageUrl(appBgUrl)}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      };
    }

    if (webBgUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(10, 8, 28, 0.84), rgba(7, 5, 20, 0.94)), url("${getImageUrl(webBgUrl)}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      };
    }

    return {
      background: 'radial-gradient(circle at 50% 15%, #0d0921 0%, #040308 100%)',
    };
  };

  const bgStyle = getMobileBackgroundStyle();

  return (
    <div 
      className="flex flex-col w-full text-white select-none"
      style={bgStyle}
    >
      {/* 1. HERO SECTION */}
      <section className="relative px-5 py-8 overflow-hidden flex flex-col items-center">
        {/* Starry background effect */}
        <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none" />
        <div className="absolute top-[10%] w-[180px] h-[180px] bg-purple-600/15 blur-[60px] rounded-full pointer-events-none" />

        {/* Floating Rotating Wheel background decoration */}
        <div className="w-48 h-48 my-2 relative flex items-center justify-center shrink-0">
          <img
            src={siteConfig.hero_chart_image_url ? getImageUrl(siteConfig.hero_chart_image_url) : "/zodiac-wheel.png"}
            alt="Zodiac Wheel"
            className="w-full h-full object-cover rounded-full animate-[spin_40s_linear_infinite] opacity-45 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050c] via-transparent to-transparent" />
        </div>

        {/* Hero Card */}
        <div className="w-full bg-[#0d0f21]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-[28px] text-center shadow-xl z-10 relative mt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold tracking-widest text-purple-300 uppercase mb-3">
            <Sparkles size={10} className="animate-pulse" />
            {t('landing.hero.label', '✦ CÔNG NGHỆ AI TIÊN TIẾN')}
          </div>

          <h2 className="text-2xl font-black tracking-wide mb-3 bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent font-title leading-tight">
            {getVal('hero_title') || t('landing.hero.title', 'Nền tảng Chiêm tinh AI')}
          </h2>

          <p className="text-xs text-gray-300 leading-relaxed mb-6 font-medium">
            {getVal('hero_subtitle') || t('landing.hero.subtitle', 'Lắng nghe lời thì thầm từ các vì sao. Khám phá bản đồ sao cá nhân để thấu hiểu vận mệnh của chính mình.')}
          </p>

          <button
            onClick={() => handleCta('chat')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>{t('landing.hero.primaryButton', 'Bắt đầu ngay')}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 2. STATS OVERVIEW */}
      <section className="px-5 py-4 grid grid-cols-2 gap-3 z-10">
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center backdrop-blur-md">
          <span className="block text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">100K+</span>
          <span className="block text-[10px] text-gray-400 mt-1 uppercase font-semibold tracking-wider">
            {t('landing.stats.users', 'Người dùng tin tưởng')}
          </span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center backdrop-blur-md">
          <span className="block text-xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">99.2%</span>
          <span className="block text-[10px] text-gray-400 mt-1 uppercase font-semibold tracking-wider">
            {t('landing.stats.accuracy', 'Độ chính xác AI')}
          </span>
        </div>
      </section>

      {/* 3. CORE FEATURES */}
      <section className="px-5 py-6 z-10">
        <div className="mb-4">
          <span className="text-[10px] font-bold text-purple-400 tracking-widest uppercase">
            {t('landing.features.label', 'TÍNH NĂNG VƯỢT TRỘI')}
          </span>
          <h3 className="text-xl font-extrabold tracking-wide mt-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {t('landing.features.title', 'Khám Phá Các Tính Năng')}
          </h3>
        </div>

        {/* Feature Cards Stack */}
        <div className="space-y-3">
          {features.map((feat, index) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={index}
                onClick={() => handleCta(feat.id)}
                className="group relative flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.05] transition-all cursor-pointer active:scale-98 overflow-hidden"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center shrink-0 shadow-md`}>
                  <IconComponent size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-600 mt-1 shrink-0 group-hover:text-purple-300 transition-colors" />
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ABOUT SECTION */}
      <section className="px-5 py-6 z-10">
        <div className="bg-[#0b0c16]/75 backdrop-blur-xl border border-white/5 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full pointer-events-none" />
          
          <span className="text-[9px] font-bold text-purple-400 tracking-widest uppercase">
            {replaceBrand(t('landing.about.label', '✦ VỀ ZODIAC WHISPER'))}
          </span>
          
          <h3 className="text-base font-extrabold tracking-wide mt-1 text-white mb-3">
            {getVal('about_title') || replaceBrand(t('landing.about.title', 'Nền tảng Chiêm tinh AI'))}
          </h3>

          <p className="text-[11px] text-gray-300 leading-relaxed mb-4">
            {getVal('about_content') || replaceBrand(t('landing.about.content', 'Zodiac Whisper là hệ sinh thái công nghệ giúp bạn khám phá chiều sâu tâm hồn qua các thuật toán Chiêm tinh AI tiên tiến nhất. Chúng tôi kết hợp trí tuệ cổ xưa với công nghệ hiện đại để mang lại những lời khuyên chính xác.'))}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-purple-400" />
              <span>Bảo mật tuyệt đối</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-purple-400" />
              <span>Dự báo cá nhân hóa</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING PACKAGES */}
      <section className="px-5 py-6 z-10">
        <div className="mb-4">
          <span className="text-[10px] font-bold text-purple-400 tracking-widest uppercase">
            {t('landing.pricing.label', 'BẢNG GIÁ LINH HOẠT')}
          </span>
          <h3 className="text-xl font-extrabold tracking-wide mt-1 text-white">
            {getVal('pricing_title', t('landing.pricing.title', 'Gói token linh hoạt'))}
          </h3>
        </div>

        {isLoadingPackages ? (
          <div className="py-8 text-center text-xs text-gray-500 italic">
            {t('common.loading', 'Đang tải...')}
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg) => {
              const features = getPackageFeatures(pkg.tokens);
              const isPopular = pkg.tokens > 150 && pkg.tokens <= 500;

              return (
                <div
                  key={pkg.id}
                  className={`relative p-5 rounded-[22px] bg-slate-950/70 border backdrop-blur-md transition-all ${
                    isPopular 
                      ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' 
                      : 'border-white/5'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-purple-600 text-[8px] font-bold tracking-wider uppercase flex items-center gap-0.5">
                      <Award size={10} />
                      <span>{t('landing.pricing.popular', 'Bán chạy nhất')}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{pkg.name}</h4>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-400 font-semibold">
                        <Sparkles size={12} />
                        <span>{pkg.tokens} Tokens</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-base font-black text-white">{pkg.amount_vnd.toLocaleString('vi-VN')}</span>
                      <span className="block text-[9px] text-gray-500 uppercase font-semibold">VNĐ</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 my-3" />

                  <ul className="space-y-1.5 mb-4">
                    {features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 text-[10.5px] text-gray-400">
                        <Check size={12} className="text-purple-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCta('payment')}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide active:scale-95 transition-all ${
                      isPopular
                        ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-md'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 text-purple-300'
                    }`}
                  >
                    {t('landing.pricing.buy_now', 'Nạp ngay')} ✦
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. CALL TO ACTION FOOTER */}
      <section className="px-5 py-8 text-center shrink-0 z-10">
        <div className="bg-gradient-to-br from-purple-950/40 to-slate-950/60 border border-purple-500/20 p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full" />
          
          <h3 className="text-lg font-black text-white mb-2 leading-tight">
            Sẵn sàng khám phá vận mệnh?
          </h3>
          <p className="text-[11px] text-gray-400 leading-relaxed mb-5">
            {replaceBrand(t('landing.cta.description', 'Cung cấp ngày giờ sinh của bạn để Trợ lý AI Zodiac Whisper phân tích chi tiết lá số tử vi và bản đồ sao gốc của bạn ngay.'))}
          </p>

          {!user ? (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onLoginClick}
                className="w-full py-3 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-900/30 active:scale-95 transition-all"
              >
                {t('common.login', 'Đăng nhập')}
              </button>
              <button
                onClick={() => onViewChange('profile')} // Opens AuthView on registration mode
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold active:scale-95 transition-all"
              >
                {t('common.register', 'Đăng ký tài khoản')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleCta('chat')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              Vào ứng dụng ngay
            </button>
          )}

          <div className="mt-6 flex justify-center gap-4 text-[10px] text-gray-500 font-semibold">
            <span onClick={() => onViewChange('terms')} className="hover:text-purple-400 cursor-pointer">
              {t('footer.terms', 'Điều khoản')}
            </span>
            <span>•</span>
            <span onClick={() => onViewChange('privacy')} className="hover:text-purple-400 cursor-pointer">
              {t('footer.privacy', 'Bảo mật')}
            </span>
            <span>•</span>
            <span onClick={() => onViewChange('faq')} className="hover:text-purple-400 cursor-pointer">
              FAQ
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MobileLandingPage;
