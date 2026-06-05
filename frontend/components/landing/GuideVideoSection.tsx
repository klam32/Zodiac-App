import React from 'react';
import { getImageUrl } from '../../api';
import { useTranslation } from 'react-i18next';

interface GuideVideoSectionProps {
  siteConfig?: {
    guide_video_label?: string;
    guide_video_title?: string;
    guide_video_subtitle?: string;
    guide_video_url?: string;
    guide_video_poster_url?: string;
  };
  currentLang: string;
}

const GuideVideoSection: React.FC<GuideVideoSectionProps> = ({ siteConfig, currentLang }) => {
  const { t } = useTranslation();

  const getVal = (key: string, defaultVal: string) => {
    if (!siteConfig) return defaultVal;
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return (siteConfig as any)[localizedKey] || defaultVal || (siteConfig as any)[key];
    }
    return (siteConfig as any)[localizedKey] || (siteConfig as any)[key] || defaultVal;
  };

  const label = getVal('guide_video_label', t('landing.video.label', 'VIDEO HƯỚNG DẪN'));
  const title = getVal('guide_video_title', t('landing.video.title', 'Hướng dẫn sử dụng Zodiac Whisper'));
  const subtitle = getVal(
    'guide_video_subtitle',
    t('landing.video.subtitle', 'Xem video ngắn để biết cách tạo bản đồ sao, đặt câu hỏi với AI và khám phá các tính năng chiêm tinh.')
  );
  const videoUrl = siteConfig?.guide_video_url || "/videos/zodiac-whisper-guide.mp4";
  const posterUrl = siteConfig?.guide_video_poster_url ? getImageUrl(siteConfig.guide_video_poster_url) : undefined;

  // Convert Google Drive link to preview embed link
  const getGoogleDriveEmbed = (url: string): string | null => {
    if (!url || !url.includes('drive.google.com')) return null;
    if (url.includes('/file/d/')) {
      const match = url.match(/\/file\/d\/([^/]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    if (url.includes('id=')) {
      const match = url.match(/id=([^&]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return null;
  };

  const gdEmbedUrl = getGoogleDriveEmbed(videoUrl);

  return (
    <section id="guide-video" className="guide-video-section reveal active">
      <div className="guide-video-container">
        <div className="badge">
          ✦ {label}
        </div>

        <h2>{title}</h2>

        <p className="guide-video-desc">
          {subtitle}
        </p>

        <div className="video-wrapper">
          {gdEmbedUrl ? (
            <iframe
              src={gdEmbedUrl}
              className="guide-video-player"
              width="100%"
              style={{ border: 'none', borderRadius: '12px', minHeight: '360px', background: '#000' }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <video
              controls
              preload="metadata"
              src={getImageUrl(videoUrl)}
              poster={posterUrl}
              className="guide-video-player"
            >
              {t('landing.video.unsupported', 'Trình duyệt của bạn không hỗ trợ phát video.')}
            </video>
          )}
          <div className="video-glow-shadow"></div>
        </div>
      </div>
    </section>
  );
};

export default GuideVideoSection;
