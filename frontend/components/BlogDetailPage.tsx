import React from 'react';
import './SubPage.css';
import { User } from '../types';
import { getImageUrl } from '../api';

interface BlogDetailPageProps {
  articleId: string;
  onBack: () => void;
  onLogin: () => void;
  onArticleChange: (id: string) => void;
  user?: User | null;
  siteConfig: {
    blog_posts?: any[];
  };
}

const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ articleId, onBack, onLogin, onArticleChange, user, siteConfig }) => {
  const defaultArticles: any = {
    'nghiep-qua': {
      title: 'Nghiệp Quả Trong Chiêm Tinh Học: Hành Trình Linh Hồn Qua La Hầu, Kế Đô Và Chiron',
      date: 'May 7, 2025',
      image: '/blog-karma.png',
      content: 'Trong chiêm tinh học, có những điểm trên bản đồ sao tuy không phải là hành tinh, nhưng lại ẩn chứa những bài học nghiệp quả sâu sắc. Đó chính là La Hầu, Kế Đô và "người chữa lành bị thương" Chiron.'
    },
    'xich-vi': {
      title: 'Xích Vĩ Trong Bản Đồ Sao',
      date: 'April 5, 2025',
      image: '/blog-declination.png',
      content: 'Khi xem bản đồ sao, chúng ta không chỉ nhìn vào các yếu tố quan trọng như cung Mọc (AC), cung Mặt Trời, Mặt Trăng mà còn cần quan tâm đến Xích Vĩ (Declination) – một chiều kích khác của vị trí các hành tinh.'
    },
    'huong-nghiep': {
      title: 'Phân Tích Hướng Nghiệp Trong Chiêm Tinh',
      date: 'April 1, 2025',
      image: '/blog-career.png',
      content: 'Phân tích định hướng nghề nghiệp qua các cung nhà 2, 6 và 10 trong lá số chiêm tinh.'
    }
  };

  const dynamicPosts = siteConfig.blog_posts || [];
  
  let currentArticle: any = null;
  let prevArticleId = '';
  let nextArticleId = '';
  let prevArticleTitle = '';
  let nextArticleTitle = '';

  if (dynamicPosts.length > 0) {
    const currentIndex = dynamicPosts.findIndex(p => p.slug === articleId || p.id.toString() === articleId);
    if (currentIndex !== -1) {
      const post = dynamicPosts[currentIndex];
      currentArticle = {
        title: post.title,
        date: new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        image: post.image_url,
        content: post.content
      };

      if (currentIndex > 0) {
        prevArticleId = dynamicPosts[currentIndex - 1].slug || dynamicPosts[currentIndex - 1].id.toString();
        prevArticleTitle = dynamicPosts[currentIndex - 1].title;
      }
      if (currentIndex < dynamicPosts.length - 1) {
        nextArticleId = dynamicPosts[currentIndex + 1].slug || dynamicPosts[currentIndex + 1].id.toString();
        nextArticleTitle = dynamicPosts[currentIndex + 1].title;
      }
    }
  }

  if (!currentArticle) {
    currentArticle = defaultArticles[articleId] || defaultArticles['nghiep-qua'];
    const articleKeys = Object.keys(defaultArticles);
    const currentIndex = articleKeys.indexOf(articleId);
    if (currentIndex > 0) {
      prevArticleId = articleKeys[currentIndex - 1];
      prevArticleTitle = defaultArticles[prevArticleId].title;
    }
    if (currentIndex < articleKeys.length - 1 && currentIndex !== -1) {
      nextArticleId = articleKeys[currentIndex + 1];
      nextArticleTitle = defaultArticles[nextArticleId].title;
    }
  }

  return (
    <div className="subpage-container blog-detail-page">
      <header className="subpage-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button className="back-button" onClick={onBack}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>
        <div className="subpage-title">Tin tức Chiêm tinh</div>
        <div className="header-actions">
          {!user && <button className="btn btn-primary btn-sm" onClick={onLogin}>Tham gia ngay</button>}
        </div>
      </header>

      <main className="subpage-main">
        <article className="blog-article blog-article-container">
          <div className="article-header">
            <div className="article-breadcrumb">
              <span onClick={onBack}>Trang chủ</span>
              <svg className="w-3 h-3 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" /></svg>
              <span className="active">Bài viết chi tiết</span>
            </div>
            <h1 className="article-title">{currentArticle.title}</h1>
            <div className="article-meta-v2">
              <div className="meta-author">
                <div className="author-avatar">ZW</div>
                <div>
                  <div className="author-name">Zodiac Whisper AI</div>
                  <div className="author-info">Chuyên gia Chiêm tinh học • {currentArticle.date}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="article-hero">
            <img 
               src={getImageUrl(currentArticle.image)} 
               alt={currentArticle.title} 
            />
          </div>

          <div className="article-content">
            {typeof currentArticle.content === 'string' ? (
              currentArticle.content.split('\n').map((para: string, i: number) => {
                if (para.startsWith('###')) {
                    return (
                      <div key={i} className="content-heading-box">
                        <h3>{para.replace('###', '').trim()}</h3>
                      </div>
                    );
                }
                return <p key={i}>{para}</p>
              })
            ) : (
              currentArticle.content
            )}
          </div>

          <footer className="article-footer">
             <div className="article-tags">
                <span>#ChiêmTinh</span>
                <span>#VậnMệnh</span>
                <span>#TâmLinh</span>
             </div>
             
             <div className="article-navigation">
                {prevArticleId ? (
                  <div className="nav-item prev" onClick={() => onArticleChange(prevArticleId)}>
                    <div className="nav-label">Bài trước</div>
                    <div className="nav-link-title">{prevArticleTitle}</div>
                  </div>
                ) : <div />}

                {nextArticleId ? (
                  <div className="nav-item next" onClick={() => onArticleChange(nextArticleId)}>
                    <div className="nav-label">Bài tiếp theo</div>
                    <div className="nav-link-title">{nextArticleTitle}</div>
                  </div>
                ) : <div />}
             </div>
          </footer>
        </article>
      </main>

      <style>{`
        .blog-detail-page {
          background: #0a0a0f;
          color: #e2e8f0;
          min-height: 100vh;
        }
        .blog-article {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .blog-article-container {
          max-width: 850px;
          margin: 0 auto;
        }
        
        .article-breadcrumb {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #718096;
          margin-bottom: 25px;
        }
        .article-breadcrumb span { cursor: pointer; transition: color 0.3s; }
        .article-breadcrumb span:hover { color: #f6ad55; }
        .article-breadcrumb .active { color: #f6ad55; }

        .article-meta-v2 {
          margin-top: 30px;
          padding-bottom: 30px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 50px;
        }
        .meta-author {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .author-avatar {
          width: 45px;
          height: 45px;
          background: linear-gradient(135deg, #f6ad55 0%, #e67e22 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: white;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(246, 173, 85, 0.3);
        }
        .author-name {
          font-weight: 700;
          color: white;
          font-size: 1rem;
          margin-bottom: 2px;
        }
        .author-info {
          font-size: 0.8rem;
          color: #718096;
        }
        
        .article-title {
          font-size: 3.5rem;
          line-height: 1.1;
          font-weight: 800;
          margin-bottom: 15px;
          color: white;
          text-shadow: 0 10px 20px rgba(0,0,0,0.8);
        }
        .article-hero {
          border-radius: 30px;
          overflow: hidden;
          margin-bottom: 50px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .article-hero img { width: 100%; height: auto; display: block; }
        .article-content {
          font-size: 1.15rem;
          line-height: 1.8;
          color: #cbd5e0;
        }
        .article-content p { 
          margin-bottom: 25px; 
          text-align: justify;
        }
        
        .content-heading-box {
          background: rgba(246, 173, 85, 0.03);
          border-left: 5px solid #f6ad55;
          padding: 24px 30px;
          margin-top: 60px;
          margin-bottom: 35px;
          border-radius: 4px 16px 16px 4px;
          box-shadow: inset 0 0 20px rgba(246, 173, 85, 0.05);
          position: relative;
          overflow: hidden;
        }
        
        .content-heading-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, rgba(246, 173, 85, 0.08), transparent);
          pointer-events: none;
        }
        
        .content-heading-box h3 {
          margin: 0;
          color: white;
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          position: relative;
          z-index: 1;
        }
        
        .article-footer {
          margin-top: 60px;
          padding-top: 40px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .article-tags { display: flex; gap: 15px; margin-bottom: 40px; }
        .article-tags span {
          background: rgba(246, 173, 85, 0.1);
          color: #f6ad55;
          padding: 5px 15px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .article-navigation {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .nav-item {
          padding: 25px;
          background: rgba(255,255,255,0.03);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.07);
          border-color: #f6ad55;
          transform: translateY(-5px);
        }
        .nav-item.next { text-align: right; }
        .nav-label {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #f6ad55;
          margin-bottom: 10px;
        }
        .nav-link-title {
          font-weight: 700;
          font-size: 1rem;
          line-height: 1.4;
          color: white;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @media (max-width: 768px) {
          .article-title { font-size: 2rem; }
          .article-navigation { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default BlogDetailPage;
