import React from 'react';
import { getImageUrl } from '../api';

interface BlogSectionProps {
  onArticleClick: (articleId: string) => void;
  posts?: any[];
  title?: string;
}

const BlogSection: React.FC<BlogSectionProps> = ({ onArticleClick, posts, title }) => {
  const defaultArticles = [
    {
      slug: 'nghiep-qua',
      title: 'Nghiệp Quả Trong Chiêm Tinh Học: Hành Trình Linh Hồn Qua La Hầu, Kế Đô Và Chiron',
      created_at: '2025-05-07',
      image_url: '/blog-karma.png',
      excerpt: 'Trong chiêm tinh học, có những điểm trên bản đồ sao tuy không phải là hành tinh, nhưng lại ẩn...'
    },
    {
      slug: 'xich-vi',
      title: 'Xích Vĩ Trong Bản Đồ Sao',
      created_at: '2025-04-05',
      image_url: '/blog-declination.png',
      excerpt: 'Khi xem bản đồ sao, chúng ta không chỉ nhìn vào các yếu tố quan trọng như cung Mọc (AC),...'
    },
    {
      slug: 'huong-nghiep',
      title: 'Phân Tích Hướng Nghiệp Trong Chiêm Tinh',
      created_at: '2025-04-01',
      image_url: '/blog-career.png',
      excerpt: 'Phân tích định hướng nghề nghiệp qua các cung nhà 2, 6 và 10 trong lá số chiêm tinh.'
    }
  ];

  const displayPosts = posts && posts.length > 0 ? posts : defaultArticles;

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'MAY 7, 2025';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'MAY 7, 2025';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  return (
    <section className="blog-section" id="blog">
      <div className="section-header">
        <h2 className="section-title">{title || "BÀI VIẾT MỚI NHẤT"}</h2>
        <div className="section-underline"></div>
      </div>

      <div className="blog-grid">
        {displayPosts.map((article) => (
          <div key={article.slug || article.id} className="blog-card" onClick={() => onArticleClick(article.slug || article.id)}>
            <div className="blog-image-wrapper">
              <img src={getImageUrl(article.image_url || article.image)} alt={article.title} />
              <div className="blog-date">{formatDate(article.created_at || article.date)}</div>
            </div>
            <div className="blog-content">
              <h3 className="blog-title">{article.title}</h3>
              <p className="blog-excerpt">{article.excerpt}</p>
            </div>

          </div>
        ))}
      </div>

      <style>{`
        .blog-section {
          padding: 80px 20px;
          background: #0a0a0f;
          color: white;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 15px;
        }

        .section-underline {
          width: 60px;
          height: 3px;
          background: #f6ad55;
          margin: 0 auto;
        }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .blog-card {
          background: #12121a;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .blog-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .blog-image-wrapper {
          position: relative;
          height: 220px;
          overflow: hidden;
        }

        .blog-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .blog-card:hover .blog-image-wrapper img {
          transform: scale(1.1);
        }

        .blog-date {
          position: absolute;
          bottom: 15px;
          right: 15px;
          background: #f6ad55;
          color: white;
          padding: 5px 15px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .blog-content {
          padding: 25px;
        }

        .blog-title {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 15px;
          color: #fff;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .blog-excerpt {
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default BlogSection;
