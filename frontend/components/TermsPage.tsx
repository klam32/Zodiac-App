import React from 'react';
import './SubPage.css';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

interface TermsPageProps {
  onBack: () => void;
  onLogin: () => void;
  user?: User | null;
  siteConfig?: any;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack, onLogin, user, siteConfig }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const getVal = (key: string, defaultVal: string) => {
    if (!siteConfig) return defaultVal;
    const currentLang = isEn ? 'en' : 'vi';
    const localizedKey = `${key}_${currentLang}`;
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const siteTitle = getVal('site_title', 'Zodiac Whisper');
  const replaceBrand = (text: string) => {
    return text.replace(/Zodiac Whisper/g, siteTitle);
  };

  return (
    <div className="subpage-container dark-theme">
      <header className="subpage-header dark">
        <div className="subpage-logo" onClick={onBack} style={{ cursor: 'pointer' }}>
          <span>✨</span> {siteTitle}
        </div>
        {user ? (
          <button className="btn btn-outline" onClick={onBack}>Hi, {user.full_name || user.username}</button>
        ) : (
          <button className="btn btn-primary" onClick={onLogin}>{isEn ? 'Login' : 'Đăng nhập'}</button>
        )}
      </header>

      <main className="subpage-content">
        <div className="subpage-card faq-card-v2">
          <h1 className="subpage-title">{isEn ? 'Terms of Service' : 'Điều Khoản Sử Dụng'}</h1>
          <p className="subpage-subtitle">
            {isEn 
              ? replaceBrand('Welcome to Zodiac Whisper. By accessing or using our platform and mobile applications, you agree to comply with and be bound by the following Terms of Service.')
              : replaceBrand('Chào mừng bạn đến với Zodiac Whisper. Bằng cách truy cập hoặc sử dụng nền tảng và ứng dụng di động của chúng tôi, bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều Khoản Sử Dụng dưới đây.')}
          </p>

          <div className="terms-list text-gray-300">
            {isEn ? (
              <>
                <section className="terms-section">
                  <h3>1. Conditions of Use & Eligibility</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>By registering or using the platform, you acknowledge and represent that:</p>
                    <ul>
                      <li>You are at least 13 years of age. If you are under 18, you must use our services only under the supervision of a parent or legal guardian.</li>
                      <li>All birth chart information (date, time, and city) and profile information you provide is accurate and truthful.</li>
                      <li>You will use the platform only for personal, non-commercial self-discovery and entertainment.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>2. User Rights & Responsibilities</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>When interacting with the platform, you agree to the following responsibilities:</p>
                    <ul>
                      <li>You must maintain the confidentiality of your account credentials (e.g. Google Login, Facebook Login, or custom credentials) and are fully responsible for all activities under your account.</li>
                      <li>You are granted a non-transferable, personal license to view astrological charts, download PDFs of your reports, and read AI explanations.</li>
                      <li>You must not sell, redistribute, license, or commercially exploit any content from the site.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>3. Prohibited Activities & Content</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>You are strictly prohibited from engaging in any of the following activities:</p>
                    <ul>
                      <li>Attempting to bypass paywalls, exploit bugs, or gain unauthorized access to token databases.</li>
                      <li>Sending automated queries, scrapers, bots, or reverse-engineering our proprietary astrological algorithms and database structures.</li>
                      <li>Submitting offensive, harassing, obscene, hateful, or illegal content to our AI chatbots or feedback modules.</li>
                      <li>Using the chatbot in a way that overwhelms or damages our AI API servers (such as DDOS or flood attacks).</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>4. AI Assistant & Chatbot Policy</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0', padding: '1.2rem', background: 'rgba(138, 43, 226, 0.15)', border: '1px solid rgba(138, 43, 226, 0.3)', borderRadius: '12px' }}>
                    <p style={{ color: '#ecc94b', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>⚠️ IMPORTANT AI CONTENT DISCLAIMER</p>
                    <p>Our platform uses advanced Artificial Intelligence (including Gemini and other Large Language Models) to deliver interactive interpretations. By using our AI services, you agree that:</p>
                    <ul>
                      <li><strong>No 100% Accuracy Guarantee:</strong> AI-generated content represents astrological interpretations and language model calculations. It may not always be 100% accurate, complete, or scientifically factual.</li>
                      <li><strong>No Professional Advice:</strong> The AI responses, birth chart analyses, and suggestions are for contemplation and self-awareness only. Under no circumstances should they be used for, or substitute for, <strong>professional medical diagnosis, legal counsel, or financial/investment advice</strong>.</li>
                      <li><strong>User Responsibility:</strong> You assume full responsibility for how you interpret and act upon the information provided by the AI. The developers hold no liability for any life decisions or actions based on chatbot interactions.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>5. Limitation of Liability</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>To the maximum extent permitted by law, the developers and team of {siteTitle} shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from:</p>
                    <ul>
                      <li>Your use of, or inability to use, the platform or AI features.</li>
                      <li>Any errors, omissions, or inaccuracies in the calculated charts or astrological readings.</li>
                      <li>Service interruptions, security breaches, or data losses outside of our direct control.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>6. Account Rules & Termination</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>We reserve the right to suspend or permanently terminate your account and forfeit all remaining tokens without prior notice if:</p>
                    <ul>
                      <li>You violate any provisions of these Terms of Service.</li>
                      <li>You engage in fraudulent transactions or attempt to manipulate payment records.</li>
                      <li>You abuse our AI servers or engage in harmful security testing on our infrastructure.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>7. Modifications & Governing Law</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>We reserve the right to update these Terms of Service at any time. Changes will be posted on this page with an updated effective date. Your continued use of the platform constitutes agreement to the updated terms.</p>
                    <p>These terms are governed by and construed in accordance with the laws of the Socialist Republic of Vietnam.</p>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>8. Contact Us</h3>
                  <p>If you have any questions regarding these Terms, please reach out to our team at:</p>
                  <p style={{ fontWeight: 'bold' }}>Email: nguyenkhoalamgh2003@gmail.com</p>
                </section>
              </>
            ) : (
              <>
                <section className="terms-section">
                  <h3>1. Điều Kiện Sử Dụng & Đối Tượng</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Bằng việc đăng ký tài khoản hoặc sử dụng ứng dụng, bạn cam kết rằng:</p>
                    <ul>
                      <li>Bạn ít nhất từ 13 tuổi trở lên. Nếu dưới 18 tuổi, bạn chỉ được sử dụng ứng dụng dưới sự giám sát của cha mẹ hoặc người giám hộ hợp pháp.</li>
                      <li>Mọi thông tin chi tiết sinh học (ngày, giờ, nơi sinh) và thông tin hồ sơ bạn cung cấp là chính xác và trung thực.</li>
                      <li>Bạn sử dụng dịch vụ cho mục đích cá nhân, phi thương mại để thấu hiểu bản thân và giải trí.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>2. Quyền & Trách Nhiệm Của Người Dùng</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Khi tương tác với ứng dụng, bạn đồng ý với các điều khoản trách nhiệm sau:</p>
                    <ul>
                      <li>Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình (như Google Login, Facebook Login, Apple Sign-In hoặc tài khoản tự tạo) và chịu trách nhiệm cho tất cả các hoạt động diễn ra dưới tài khoản của bạn.</li>
                      <li>Bạn được cấp quyền cá nhân, không thể chuyển nhượng để xem bản đồ sao, tải tệp PDF luận giải và trò chuyện với AI.</li>
                      <li>Nghiêm cấm hành vi bán lại, sao chép hoặc phân phối thương mại nội dung và tài nguyên của hệ thống mà không có sự cho phép bằng văn bản từ quản trị viên.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>3. Các Hành Vi Bị Nghiêm Cấm</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Người dùng tuyệt đối không được thực hiện các hành vi sau:</p>
                    <ul>
                      <li>Cố ý hack hệ thống, khai thác lỗ hổng bảo mật, thay đổi trái phép dữ liệu token hoặc số dư tài khoản.</li>
                      <li>Sử dụng các công cụ tự động, robot cào dữ liệu, hoặc dịch ngược mã nguồn của ứng dụng và các thuật toán chiêm tinh.</li>
                      <li>Gửi các nội dung quấy rối, tục tĩu, đe dọa, xúc phạm hoặc vi phạm pháp luật vào khung chat với AI.</li>
                      <li>Gửi các yêu cầu tấn công từ chối dịch vụ (DDOS) hoặc spam tin nhắn làm quá tải hệ thống máy chủ của chúng tôi.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>4. Chính Sách Chatbot AI & Tác Tử Trí Tuệ Nhân Tạo</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0', padding: '1.2rem', background: 'rgba(138, 43, 226, 0.15)', border: '1px solid rgba(138, 43, 226, 0.3)', borderRadius: '12px' }}>
                    <p style={{ color: '#ecc94b', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>⚠️ TUYÊN BỐ MIỄN TRỪ QUAN TRỌNG VỀ AI</p>
                    <p>Ứng dụng của chúng tôi sử dụng Trí Tuệ Nhân Tạo tiên tiến (Gemini và các mô hình ngôn ngữ lớn khác) để phân tích chiêm tinh và phản hồi người dùng. Bạn đồng ý rằng:</p>
                    <ul>
                      <li><strong>Không đảm bảo chính xác 100%:</strong> Nội dung do AI tạo ra là kết quả phân tích ngôn ngữ và thiên văn chiêm tinh học. Nó có thể không luôn chính xác 100%, không phải là sự thật khoa học hay chân lý tuyệt đối.</li>
                      <li><strong>Không thay thế tư vấn chuyên môn:</strong> Các câu trả lời của AI và bản đồ sao chỉ dùng cho mục đích chiêm nghiệm và giải trí. Bạn tuyệt đối không được sử dụng thông tin này để thay thế cho <strong>chẩn đoán y khoa, tư vấn pháp lý hoặc lời khuyên đầu tư tài chính</strong> chuyên nghiệp.</li>
                      <li><strong>Người dùng tự chịu trách nhiệm:</strong> Bạn hoàn toàn chịu trách nhiệm cho các quyết định và hành động cá nhân dựa trên câu trả lời của AI. Chúng tôi không chịu trách nhiệm cho bất kỳ tổn thất hay thiệt hại nào phát sinh từ các quyết định của bạn.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>5. Giới Hạn Trách Nhiệm Của Nhà Phát Triển</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Trong giới hạn tối đa pháp luật cho phép, nhà phát triển của {siteTitle} không chịu trách nhiệm đối với bất kỳ thiệt hại trực tiếp hay gián tiếp nào phát sinh từ:</p>
                    <ul>
                      <li>Việc bạn sử dụng hoặc không thể truy cập các tính năng AI của trang web.</li>
                      <li>Bất kỳ sai sót, thiếu sót hoặc chậm trễ nào trong việc tính toán và giải mã bản đồ sao.</li>
                      <li>Sự cố ngắt quãng dịch vụ, rò rỉ bảo mật hoặc mất mát dữ liệu do các nguyên nhân khách quan nằm ngoài tầm kiểm soát trực tiếp của chúng tôi.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>6. Quy Định Tài Khoản & Chấm Dứt Quyền Sử Dụng</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Chúng tôi bảo lưu toàn quyền đình chỉ hoặc xóa vĩnh viễn tài khoản của bạn và hủy bỏ số dư token hiện có mà không cần thông báo trước nếu:</p>
                    <ul>
                      <li>Bạn vi phạm bất kỳ điều khoản nào trong Điều Khoản Sử Dụng này.</li>
                      <li>Bạn có hành vi lừa đảo thanh toán hoặc nạp token không hợp lệ.</li>
                      <li>Bạn lạm dụng hệ thống chatbot AI hoặc thực hiện các hành động phá hoại an ninh mạng.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>7. Thay Đổi Điều Khoản & Luật Áp Dụng</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Chúng tôi có thể cập nhật các Điều Khoản này theo thời gian. Mọi thay đổi sẽ được cập nhật trên trang này. Việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận các điều khoản mới.</p>
                    <p>Các điều khoản này được điều chỉnh và giải thích theo luật pháp hiện hành của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.</p>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>8. Liên Hệ Với Chúng Tôi</h3>
                  <p>Nếu bạn có bất kỳ câu hỏi nào về các Điều Khoản này, vui lòng liên hệ:</p>
                  <p style={{ fontWeight: 'bold' }}>Email: nguyenkhoalamgh2003@gmail.com</p>
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="subpage-footer dark">
        <div>{isEn ? `© 2026 ${siteTitle}. All rights reserved.` : `© 2026 ${siteTitle}. Hệ thống AI Chiêm tinh Chuyên nghiệp.`}</div>
        <div style={{ marginTop: '1.5rem' }}>
          <span onClick={onBack} style={{ cursor: 'pointer', color: '#a78bfa', fontWeight: 'bold' }}>{isEn ? 'Home' : 'Trang chủ'}</span>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
