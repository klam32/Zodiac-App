import React, { useEffect, useRef, useState } from 'react';
import { Users, Compass, ShieldCheck, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StatsSectionProps {
  siteConfig: any;
  currentLang: string;
}

const CountUp: React.FC<{ end: number, duration?: number, start?: boolean, suffix?: string, decimals?: number }> = ({ end, duration = 2000, start = false, suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(progress * end);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);

  return <span>{count.toLocaleString('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

const StatsSection: React.FC<StatsSectionProps> = ({ siteConfig, currentLang }) => {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const renderStatValue = (valStr: string | undefined, defaultVal: number, suffix: string, defaultDecimals = 0) => {
    if (!valStr) return <CountUp end={defaultVal} start={started} suffix={suffix} decimals={defaultDecimals} />;
    const match = valStr.match(/^([\d.,]+)(.*)$/);
    if (match) {
      const numStr = match[1];
      const suf = match[2];
      let parsedNum = NaN;
      let dec = 0;

      if (numStr.includes('.') && numStr.includes(',')) {
        if (numStr.indexOf(',') < numStr.indexOf('.')) {
          parsedNum = parseFloat(numStr.replace(/,/g, ''));
          dec = 1;
        } else {
          parsedNum = parseFloat(numStr.replace(/\./g, '').replace(/,/g, '.'));
          dec = 1;
        }
      } else if (numStr.includes('.')) {
        const parts = numStr.split('.');
        if (parts.length === 2 && parts[1].length !== 3) {
          parsedNum = parseFloat(numStr);
          dec = parts[1].length;
        } else {
          parsedNum = parseFloat(numStr.replace(/\./g, ''));
          dec = 0;
        }
      } else if (numStr.includes(',')) {
        const parts = numStr.split(',');
        if (parts.length === 2 && parts[1].length !== 3) {
          parsedNum = parseFloat(numStr.replace(/,/g, '.'));
          dec = parts[1].length;
        } else {
          parsedNum = parseFloat(numStr.replace(/,/g, ''));
          dec = 0;
        }
      } else {
        parsedNum = parseFloat(numStr);
        dec = 0;
      }

      if (!isNaN(parsedNum)) {
        return <CountUp end={parsedNum} start={started} suffix={suf} decimals={dec} />;
      }
    }
    return <span>{valStr}</span>;
  };

  const stats = [
    {
      icon: <Users className="stat-card-icon" size={24} />,
      value: renderStatValue(siteConfig.stat_users_value, 500000, '+'),
      label: getVal('stat_users_label', t('landing.stats.users', 'Người dùng tin tưởng'))
    },
    {
      icon: <Compass className="stat-card-icon" size={24} />,
      value: renderStatValue(siteConfig.stat_charts_value, 1000000, '+'),
      label: getVal('stat_charts_label', t('landing.stats.charts', 'Bản đồ sao được tạo'))
    },
    {
      icon: <ShieldCheck className="stat-card-icon" size={24} />,
      value: renderStatValue(siteConfig.stat_accuracy_value, 99.8, '%', 1),
      label: getVal('stat_accuracy_label', t('landing.stats.accuracy', 'Độ chính xác AI'))
    },
    {
      icon: <Clock className="stat-card-icon" size={24} />,
      value: renderStatValue(siteConfig.stat_support_value, 24, '/7'),
      label: getVal('stat_support_label', t('landing.stats.support', 'Hỗ trợ chiêm tinh'))
    }
  ];

  return (
    <section ref={sectionRef} className="stats-section-v2 reveal active">
      <div className="stats-grid-v2">
        {stats.map((item, idx) => (
          <div key={idx} className="stat-card-v2">
            <div className="stat-icon-wrapper-v2">
              {item.icon}
            </div>
            <div className="stat-card-number-v2">
              {item.value}
            </div>
            <div className="stat-card-label-v2">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
