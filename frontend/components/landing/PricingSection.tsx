import React, { useEffect, useState } from 'react';
import { Sparkles, Check, Zap } from 'lucide-react';
import { api } from '../../api';
import { useTranslation } from 'react-i18next';

interface PricingSectionProps {
  siteConfig: any;
  currentLang: string;
  onAction: (view: string) => void;
}

interface PaymentPackage {
  id: number;
  name: string;
  tokens: number;
  amount_vnd: number;
}

const PricingSection: React.FC<PricingSectionProps> = ({ siteConfig, currentLang, onAction }) => {
  const { t } = useTranslation();
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        console.error('Failed to load packages', err);
        setPackages(getDefaultPackages());
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

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
        t('landing.pricing.feature.cal_lookup', 'Tra cứu lịch cát tường đầy đủ'),
        t('landing.pricing.feature.duration_pro', 'Ưu tiên phản hồi tốc độ cao')
      ];
    } else {
      return [
        t('landing.pricing.feature.vip_chat', 'Tất cả tính năng cao cấp nhất'),
        t('landing.pricing.feature.voice_out', 'Hỗ trợ Voice Out đọc to luận giải'),
        t('landing.pricing.feature.unlimited_history', 'Lưu trữ lịch sử chat trọn đời'),
        t('landing.pricing.feature.custom_agent', 'Trải nghiệm không quảng cáo/chờ'),
        t('landing.pricing.feature.vip_badge', 'Hỗ trợ VIP 24/7 từ quản trị viên')
      ];
    }
  };

  return (
    <section id="pricing" className="pricing-section reveal active">
      <div className="section-container">
        <div className="section-header">
          <div className="badge">✦ {t('landing.pricing.label', 'BẢNG GIÁ LINH HOẠT')}</div>
          <h2>{getVal('pricing_title', t('landing.pricing.title', 'Gói token linh hoạt'))}</h2>
          <p className="section-subtitle">
            {getVal('pricing_description', t('landing.pricing.description', 'Chọn gói nạp token phù hợp để trải nghiệm tất cả tính năng AI chiêm tinh chuyên sâu.'))}
          </p>
        </div>

        <div className="pricing-grid">
          {packages.map((pkg) => {
            const isPopular = pkg.tokens > 150 && pkg.tokens <= 500;
            const features = getPackageFeatures(pkg.tokens);

            return (
              <div key={pkg.id} className={`pricing-card ${isPopular ? 'popular' : ''}`}>
                {isPopular && (
                  <div className="popular-badge">
                    <Zap size={12} style={{ marginRight: 4 }} />
                    {t('landing.pricing.popular', 'Bán chạy nhất')}
                  </div>
                )}
                <div className="pricing-card-header">
                  <h3>{pkg.name}</h3>
                  <div className="price-container">
                    <span className="amount">{pkg.amount_vnd.toLocaleString('vi-VN')}</span>
                    <span className="currency">VNĐ</span>
                  </div>
                  <div className="token-amount">
                    <Sparkles size={16} className="token-icon" />
                    <span>{pkg.tokens} Tokens</span>
                  </div>
                </div>

                <div className="pricing-card-divider"></div>

                <ul className="pricing-features-list">
                  {features.map((feat, fidx) => (
                    <li key={fidx}>
                      <Check size={16} className="check-icon" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`btn-purchase ${isPopular ? 'btn-popular' : 'btn-normal'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAction('payment');
                  }}
                >
                  {t('landing.pricing.buy_now', 'Nạp ngay')} ✦
                </button>
                <div className="card-glow-bg"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
