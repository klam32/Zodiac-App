import React from 'react';
import './SubPage.css';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

interface DataDeletionPageProps {
  onBack: () => void;
  onLogin: () => void;
  user?: User | null;
  siteConfig?: any;
}

const DataDeletionPage: React.FC<DataDeletionPageProps> = ({ onBack, onLogin, user, siteConfig }) => {
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
          <h1 className="subpage-title">{isEn ? 'Data Deletion Policy' : 'Chính Sách Xóa Dữ Liệu'}</h1>
          <p className="subpage-subtitle">
            {isEn 
              ? 'Learn how to request deletion of your account and personal data from our systems.' 
              : 'Hướng dẫn chi tiết cách yêu cầu xóa tài khoản và dữ liệu cá nhân khỏi hệ thống.'}
          </p>

          <div className="terms-list text-gray-300">
            {isEn ? (
              <>
                <section className="terms-section">
                  <h3>1. Introduction</h3>
                  <p>
                    At {siteTitle}, we respect your right to privacy and control over your personal information. Under global privacy guidelines (including Google Play Store and Apple App Store compliance), users are allowed to delete their accounts and wipe all associated personal data from our active services.
                  </p>
                </section>

                <section className="terms-section">
                  <h3>2. What Data Will Be Deleted?</h3>
                  <p>
                    When you delete your account or request data deletion, the following categories of information will be <strong>permanently and irreversibly removed</strong> from our databases:
                  </p>
                  <ul>
                    <li><strong>Profile & Credentials:</strong> Your username, email address, display name, and avatar picture.</li>
                    <li><strong>Astrological Configuration:</strong> Saved birth date, exact birth time, birth town/city, and geographical coordinates.</li>
                    <li><strong>AI Chat History:</strong> All conversation logs, questions, and insights generated with our AI Astrologer chatbots.</li>
                    <li><strong>Token Balances:</strong> Remaining token coins and promotional balances will be deleted and cannot be refunded or restored.</li>
                  </ul>
                </section>

                <section className="terms-section">
                  <h3>3. How to Request Deletion</h3>
                  <p>You can request your data deletion through two convenient channels:</p>
                  
                  <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: '#a78bfa', margin: '0 0 0.5rem 0' }}>Method A: Self-Deletion Inside the Application (Recommended)</h4>
                    <ol>
                      <li>Open the app and log in to your account.</li>
                      <li>Navigate to the <strong>Profile (Trang cá nhân)</strong> tab in the navigation menu.</li>
                      <li>Find the <strong>Account Settings</strong> section.</li>
                      <li>Click on the <strong>Delete Account (Xóa tài khoản)</strong> button.</li>
                      <li>Confirm your choice. The deletion will be queued instantly.</li>
                    </ol>
                  </div>

                  <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: '#a78bfa', margin: '0 0 0.5rem 0' }}>Method B: Email Request</h4>
                    <p>
                      If you cannot access the application or prefer to request manually, please send an email to:
                    </p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>nguyenkhoalamgh2003@gmail.com</p>
                    <ul>
                      <li><strong>Email Subject:</strong> Request Account Deletion - [Your Username]</li>
                      <li><strong>Required Info:</strong> The email address linked to your account and your username.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>4. Processing Timeframe</h3>
                  <ul>
                    <li><strong>Live Database:</strong> Once you click delete or your email request is verified, access to your account is disabled immediately. Your profile details and active records are erased within <strong>24 to 48 hours</strong>.</li>
                    <li><strong>Backups & Archival Logs:</strong> For security and integrity, backup databases will be fully overwritten and purged <strong>within 30 days</strong>.</li>
                    <li><strong>Exceptions:</strong> We may retain highly anonymized analytical logs (which do not identify you) or transaction receipts strictly required by tax/financial regulations.</li>
                  </ul>
                </section>

                <section className="terms-section">
                  <h3>5. Reversibility</h3>
                  <p style={{ color: '#fc8181', fontWeight: 'bold' }}>
                    Warning: Once your deletion request is fully processed, the data is gone forever. We cannot recover birth charts, previous token balances, or conversation history. If you wish to use the service again, you will have to create a brand-new account.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="terms-section">
                  <h3>1. Giới thiệu</h3>
                  <p>
                    Tại {siteTitle}, chúng tôi tôn trọng quyền riêng tư và quyền tự kiểm soát dữ liệu cá nhân của bạn. Theo các quy định bảo mật ứng dụng toàn cầu (bao gồm tuân thủ chính sách Google Play Store và Apple App Store), người dùng có toàn quyền yêu cầu xóa tài khoản và loại bỏ mọi dữ liệu liên quan khỏi các dịch vụ hoạt động của chúng tôi.
                  </p>
                </section>

                <section className="terms-section">
                  <h3>2. Dữ liệu nào sẽ bị xóa?</h3>
                  <p>
                    Khi bạn xóa tài khoản hoặc gửi yêu cầu xóa dữ liệu, các loại thông tin sau sẽ bị <strong>xóa vĩnh viễn và không thể khôi phục</strong>:
                  </p>
                  <ul>
                    <li><strong>Hồ sơ & Đăng nhập:</strong> Tên người dùng, địa chỉ email, tên hiển thị và hình ảnh đại diện.</li>
                    <li><strong>Thông tin chiêm tinh:</strong> Ngày sinh, giờ sinh chính xác, địa điểm sinh (thành phố, quốc gia) đã lưu.</li>
                    <li><strong>Lịch sử hội thoại AI:</strong> Tất cả nhật ký trò chuyện, câu hỏi và câu trả lời của các tác tử AI.</li>
                    <li><strong>Số dư Token:</strong> Số token hiện có trong tài khoản sẽ bị hủy và không được quy đổi ngược thành tiền mặt hay khôi phục lại.</li>
                  </ul>
                </section>

                <section className="terms-section">
                  <h3>3. Hướng dẫn các bước yêu cầu xóa</h3>
                  <p>Bạn có thể thực hiện xóa tài khoản và dữ liệu qua 2 cách:</p>
                  
                  <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: '#a78bfa', margin: '0 0 0.5rem 0' }}>Cách A: Tự xóa trong ứng dụng (Khuyên dùng)</h4>
                    <ol>
                      <li>Mở ứng dụng và đăng nhập vào tài khoản của bạn.</li>
                      <li>Truy cập mục <strong>Trang cá nhân</strong> trên thanh điều hướng.</li>
                      <li>Tìm mục <strong>Cài đặt tài khoản</strong>.</li>
                      <li>Nhấn chọn nút <strong>Xóa tài khoản</strong>.</li>
                      <li>Xác nhận đồng ý. Tài khoản của bạn sẽ bị vô hiệu hóa ngay lập tức và đưa vào hàng đợi xóa dữ liệu.</li>
                    </ol>
                  </div>

                  <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: '#a78bfa', margin: '0 0 0.5rem 0' }}>Cách B: Yêu cầu thủ công qua Email</h4>
                    <p>
                      Nếu không thể truy cập ứng dụng, bạn có thể gửi yêu cầu xóa qua hòm thư hỗ trợ:
                    </p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>nguyenkhoalamgh2003@gmail.com</p>
                    <ul>
                      <li><strong>Tiêu đề email:</strong> Yêu cầu xóa tài khoản - [Tên đăng nhập của bạn]</li>
                      <li><strong>Nội dung:</strong> Địa chỉ email đã dùng để đăng ký tài khoản và tên người dùng.</li>
                    </ul>
                  </div>
                </section>

                <section className="terms-section">
                  <h3>4. Thời gian xử lý</h3>
                  <ul>
                    <li><strong>Cơ sở dữ liệu chính:</strong> Ngay sau khi bạn nhấn nút xóa hoặc yêu cầu qua email được xác thực, tài khoản của bạn sẽ bị khóa. Dữ liệu hoạt động sẽ được xóa sạch trong vòng <strong>24 đến 48 giờ</strong>.</li>
                    <li><strong>Bản sao lưu dự phòng:</strong> Để đảm bảo tính toàn vẹn hệ thống, các bản sao lưu dự phòng sẽ được ghi đè và làm sạch hoàn toàn <strong>trong vòng 30 ngày</strong>.</li>
                    <li><strong>Trường hợp ngoại lệ:</strong> Chúng tôi có thể giữ lại các hóa đơn giao dịch nạp tiền để đối soát kế toán theo luật pháp tài chính hiện hành (tất cả thông tin cá nhân liên quan vẫn được bảo mật tối đa).</li>
                  </ul>
                </section>

                <section className="terms-section">
                  <h3>5. Khả năng khôi phục</h3>
                  <p style={{ color: '#fc8181', fontWeight: 'bold' }}>
                    Lưu ý quan trọng: Sau khi quá trình xóa dữ liệu hoàn tất, hành động này không thể đảo ngược. Chúng tôi không thể khôi phục lại bản đồ sao, lịch sử chat hay số dư token. Nếu muốn dùng lại dịch vụ, bạn bắt buộc phải đăng ký một tài khoản mới.
                  </p>
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

export default DataDeletionPage;
