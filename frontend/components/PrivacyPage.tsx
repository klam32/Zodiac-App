import React from 'react';
import './SubPage.css';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

interface PrivacyPageProps {
  onBack: () => void;
  onLogin: () => void;
  user?: User | null;
  siteConfig?: any;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack, onLogin, user, siteConfig }) => {
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
          <h1 className="subpage-title">{isEn ? 'Privacy Policy' : 'Chính Sách Bảo Mật'}</h1>
          <p className="subpage-subtitle">
            {isEn ? 'Last updated: June 22, 2026' : 'Cập nhật lần cuối: 22/06/2026'}
          </p>

          <div className="privacy-intro" style={{ marginBottom: '2rem', lineHeight: '1.8', color: '#a0aec0' }}>
            {isEn
              ? replaceBrand('Welcome to Zodiac Whisper. We are deeply committed to protecting your personal information and privacy rights. This Privacy Policy outlines how we collect, process, utilize, and safeguard your data when you use our platform, services, and mobile applications.')
              : replaceBrand('Chào mừng bạn đến với Zodiac Whisper. Chúng tôi đặc biệt cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn. Chính Sách Bảo Mật này mô tả cách chúng tôi thu thập, xử lý, sử dụng và bảo vệ dữ liệu của bạn khi bạn sử dụng nền tảng, dịch vụ và ứng dụng di động của chúng tôi.')}
          </div>

          <div className="terms-list text-gray-300">
            {isEn ? (
              <>
                <section className="terms-section">
                  <h3>1. Developer & Company Information</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p><strong>Developer/Company Name:</strong> {siteTitle} Team / Nguyen Khoa Lam</p>
                    <p><strong>Website:</strong> <a href="https://zodiacwhisper.adhightech.com" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>https://zodiacwhisper.adhightech.com</a></p>
                    <p><strong>Contact Support Email:</strong> <a href="mailto:nguyenkhoalamgh2003@gmail.com" style={{ color: '#a78bfa' }}>nguyenkhoalamgh2003@gmail.com</a></p>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>2. What Data We Collect</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>To provide accurate calculations and a personalized astrological experience, we collect the following categories of data:</p>
                    <ul>
                      <li><strong>Account Information:</strong> If you sign up or log in (via Google, Facebook, Apple Sign-In, or email registration), we collect your name, email address, username, and profile picture URL.</li>
                      <li><strong>Astrological Details (Mandatory for Charts):</strong> Date of birth, exact time of birth, and location (city, country) of birth. This data is essential for computing planetary houses and alignments.</li>
                      <li><strong>AI Interaction History:</strong> Chat messages and prompts that you send to our AI agents (Astrologers, Health/Personality Chatbots) are stored securely so you can resume conversations and retrieve history.</li>
                      <li><strong>Payment Information:</strong> Transaction status, token packages purchased, and invoice records. We do not store full credit card details; all financial transactions are processed through secure, third-party payment gateways.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>3. Purpose of Using Data</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>We process your data for the following specific purposes:</p>
                    <ul>
                      <li>To calculate and render your natal chart, transit charts, and love compatibility scores.</li>
                      <li>To enable interactive chat sessions with specialized AI astrology agents.</li>
                      <li>To track and verify token balance transactions and package purchases.</li>
                      <li>To diagnose system errors, improve user experience, and protect against security threats or abuse.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>4. Sharing of Data with Third Parties</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>We prioritize your privacy and <strong>do not sell, rent, or trade your personal data</strong>. We only share information with third parties in the following limited circumstances:</p>
                    <ul>
                      <li><strong>Service Providers:</strong> Trusted platform hosts, cloud database providers (such as Firebase, Supabase), and payment gateways to execute transaction and application operations.</li>
                      <li><strong>Integration & Analytics:</strong> Anonymous, aggregated statistics through analytics services (e.g. Google Analytics) to optimize software responsiveness.</li>
                      <li><strong>Legal Compliance:</strong> When required by law, subpoena, or to protect the safety and legal rights of the developers and users.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>5. Cookies, Analytics & Firebase</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>We use local storage, session cookies, and third-party integrations (such as Google Analytics and Firebase) to:</p>
                    <ul>
                      <li>Keep you logged in securely across page reloads.</li>
                      <li>Save your language settings and display preferences.</li>
                      <li>Analyze web traffic patterns to improve our server responsiveness and application loading speed.</li>
                    </ul>
                    <p>You can choose to disable cookies through your browser settings, though some features of the platform may not function correctly as a result.</p>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>6. User Rights</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>As a user, you hold full ownership of your personal data. You have the right to:</p>
                    <ul>
                      <li><strong>Access:</strong> Request to view all information we store about your profile.</li>
                      <li><strong>Rectify:</strong> Update or correct your profile details, name, or birth charts inside the Profile section.</li>
                      <li><strong>Export:</strong> Export your astrological charts or chat history.</li>
                      <li><strong>Delete:</strong> Request the complete and permanent deletion of your profile and data.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>7. How to Request Data Deletion</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>If you want to permanently delete your account and all associated records, you have two primary options:</p>
                    <ol>
                      <li><strong>In-App Deletion:</strong> Log in, navigate to your <strong>Profile (Trang cá nhân)</strong>, find the Account Settings, and click the <strong>Delete Account (Xóa tài khoản)</strong> button. This triggers an immediate data deletion sequence.</li>
                      <li><strong>Email Request:</strong> Send an email from your registered email address to <a href="mailto:nguyenkhoalamgh2003@gmail.com" style={{ color: '#a78bfa' }}>nguyenkhoalamgh2003@gmail.com</a> with the subject "Request Account Deletion". Please provide your account username and registration email.</li>
                    </ol>
                    <p><strong>Timeline:</strong> Once requested, all your personal data (including email, birth info, chat messages, and token balances) will be fully purged from our live database and backups <strong>within 30 days</strong>. This process is irreversible.</p>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>8. Contact Information</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>For any privacy-related inquiries, data requests, or complaints, please reach out to us:</p>
                    <p><strong>Email:</strong> nguyenkhoalamgh2003@gmail.com</p>
                    <p><strong>Address:</strong> P16, Road 8, Nam Can Tho Residential Area, Cai Rang Dist, Can Tho City, Vietnam.</p>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="terms-section">
                  <h3>1. Thông Tin Nhà Phát Triển & Công Ty</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p><strong>Đơn vị phát triển:</strong> Đội ngũ {siteTitle} / Nguyễn Khoa Lam</p>
                    <p><strong>Trang web chính thức:</strong> <a href="https://frontend-omega-pink-49.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>https://zodiacwhisper.adhightech.com</a></p>
                    <p><strong>Email Hỗ Trợ:</strong> <a href="mailto:nguyenkhoalamgh2003@gmail.com" style={{ color: '#a78bfa' }}>nguyenkhoalamgh2003@gmail.com</a></p>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>2. Dữ Liệu Nào Được Thu Thập</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Để tính toán bản đồ sao chính xác và cung cấp trải nghiệm chiêm tinh cá nhân hóa sâu sắc, chúng tôi thu thập các loại dữ liệu sau:</p>
                    <ul>
                      <li><strong>Thông tin tài khoản:</strong> Khi đăng ký/đăng nhập (qua Google Sign-In, Facebook Login, Apple Sign-In hoặc đăng ký qua email), chúng tôi thu thập họ tên, địa chỉ email, tên đăng nhập và hình ảnh đại diện của bạn.</li>
                      <li><strong>Chi tiết sinh học (Bắt buộc để lập bản đồ sao):</strong> Ngày sinh, giờ sinh chính xác, và nơi sinh (thành phố, quốc gia). Đây là thông tin thiết yếu để tính toán vị trí tọa độ của các hành tinh và cung Mọc.</li>
                      <li><strong>Lịch sử hội thoại AI:</strong> Các tin nhắn và câu hỏi bạn gửi cho các tác tử AI (nhà chiêm tinh học, chatbot sức khỏe/tính cách) sẽ được lưu trữ an toàn để bạn có thể xem lại lịch sử trò chuyện.</li>
                      <li><strong>Thông tin giao dịch:</strong> Lịch sử nạp token, gói token đã mua, trạng thái thanh toán và hóa đơn giao dịch. Chúng tôi không lưu trữ thông tin thẻ tín dụng của bạn; mọi giao dịch được thực hiện qua các cổng thanh toán trung gian an toàn.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>3. Mục Đích Sử Dụng Dữ Liệu</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Chúng tôi sử dụng dữ liệu của bạn cho các mục đích cụ thể sau:</p>
                    <ul>
                      <li>Tính toán và vẽ bản đồ sao cá nhân, bản đồ sao dịch chuyển (transits) và chỉ số tương hợp tình duyên.</li>
                      <li>Cung cấp tính năng trò chuyện, luận giải chiêm tinh tương tác thời gian thực với các tác tử AI.</li>
                      <li>Quản lý số dư token, xác thực và thực hiện cộng token cho tài khoản khi nạp tiền thành công.</li>
                      <li>Phát hiện lỗi kỹ thuật, bảo vệ hệ thống khỏi các hành vi lạm dụng, phá hoại và cải thiện hiệu năng ứng dụng.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>4. Chia Sẻ Dữ Liệu Với Bên Thứ Ba</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Chúng tôi cam kết tôn trọng quyền riêng tư của bạn và <strong>không bao giờ bán, cho thuê hoặc trao đổi dữ liệu cá nhân của bạn</strong>. Dữ liệu chỉ được chia sẻ trong các trường hợp giới hạn sau:</p>
                    <ul>
                      <li><strong>Nhà cung cấp dịch vụ:</strong> Các bên thứ ba cung cấp dịch vụ lưu trữ đám mây (như Firebase, Supabase) và các cổng thanh toán để thực thi vận hành ứng dụng.</li>
                      <li><strong>Dịch vụ Phân Tích:</strong> Số liệu thống kê ẩn danh thông qua các công cụ phân tích (như Google Analytics) để cải thiện tốc độ và giao diện người dùng.</li>
                      <li><strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu bằng văn bản từ cơ quan chức năng có thẩm quyền theo quy định của pháp luật Việt Nam.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>5. Cookies, Analytics & Firebase</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Chúng tôi sử dụng bộ nhớ cục bộ (Local Storage), cookies phiên làm việc và dịch vụ bên thứ ba (Google Analytics, Firebase) để:</p>
                    <ul>
                      <li>Duy trì trạng thái đăng nhập của bạn sau khi tải lại trang.</li>
                      <li>Lưu trữ cài đặt ngôn ngữ và các tùy chọn cá nhân khác.</li>
                      <li>Theo dõi lưu lượng truy cập ẩn danh để nâng cấp máy chủ và tăng tốc độ phản hồi của AI.</li>
                    </ul>
                    <p>Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên điều này có thể ảnh hưởng đến khả năng hoạt động bình thường của một số tính năng trên ứng dụng.</p>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>6. Quyền Của Người Dùng</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Với tư cách là chủ sở hữu dữ liệu cá nhân, bạn có toàn quyền:</p>
                    <ul>
                      <li><strong>Truy cập:</strong> Yêu cầu xem lại tất cả các thông tin cá nhân của bạn đang lưu trữ trên hệ thống.</li>
                      <li><strong>Chỉnh sửa:</strong> Tự cập nhật hoặc sửa đổi thông tin hồ sơ, thông tin ngày giờ sinh trực tiếp trong phần Trang Cá Nhân.</li>
                      <li><strong>Xuất dữ liệu:</strong> Xuất file bản đồ sao hoặc lịch sử luận giải chiêm tinh của bạn.</li>
                      <li><strong>Xóa bỏ:</strong> Yêu cầu xóa vĩnh viễn và hoàn toàn tài khoản cũng như dữ liệu cá nhân của bạn.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>7. Cách Yêu Cầu Xóa Dữ Liệu</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Nếu muốn xóa tài khoản và mọi dữ liệu liên quan vĩnh viễn, bạn có thể thực hiện theo 2 cách:</p>
                    <ol>
                      <li><strong>Xóa trực tiếp trong app:</strong> Đăng nhập vào tài khoản, truy cập mục <strong>Trang cá nhân</strong>, nhấn vào cài đặt tài khoản và chọn <strong>Xóa tài khoản</strong>. Quá trình xóa dữ liệu tự động sẽ được kích hoạt ngay lập tức.</li>
                      <li><strong>Yêu cầu qua Email:</strong> Gửi email từ địa chỉ email đăng ký tài khoản của bạn tới hộp thư <a href="mailto:nguyenkhoalamgh2003@gmail.com" style={{ color: '#a78bfa' }}>nguyenkhoalamgh2003@gmail.com</a> với tiêu đề "Yêu cầu xóa tài khoản". Vui lòng cung cấp tên đăng nhập và email của bạn.</li>
                    </ol>
                    <p><strong>Thời gian xử lý:</strong> Sau khi nhận được yêu cầu, toàn bộ dữ liệu cá nhân (email, ngày giờ sinh, lịch sử trò chuyện AI và số dư token) của bạn sẽ được xóa sạch khỏi cơ sở dữ liệu chính thức và các bản sao lưu <strong>trong vòng 30 ngày</strong>. Hành động này không thể hoàn tác.</p>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>8. Thông Tin Liên Hệ</h3>
                  <div style={{ marginLeft: '1rem', color: '#cbd5e0' }}>
                    <p>Nếu có câu hỏi hay thắc mắc nào liên quan đến Chính Sách Bảo Mật này, vui lòng liên hệ:</p>
                    <p><strong>Email:</strong> nguyenkhoalamgh2003@gmail.com</p>
                    <p><strong>Địa chỉ:</strong> P16, Đường số 8, KDC lô 49, Khu đô thị Nam Cần Thơ, Phường Cái Răng, TP. Cần Thơ, Việt Nam.</p>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="subpage-footer dark">
        <div>{isEn ? replaceBrand('© 2026 Zodiac Whisper. All rights reserved.') : replaceBrand('© 2026 Zodiac Whisper. Hệ thống AI Chiêm tinh Chuyên nghiệp.')}</div>
        <div style={{ marginTop: '1.5rem' }}>
          <span onClick={onBack} style={{ cursor: 'pointer', color: '#a78bfa', fontWeight: 'bold' }}>{isEn ? 'Home' : 'Trang chủ'}</span>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
