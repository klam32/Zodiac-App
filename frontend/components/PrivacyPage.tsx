import React from 'react';
import './SubPage.css';
import { User } from '../types';

interface PrivacyPageProps {
  onBack: () => void;
  onLogin: () => void;
  user?: User | null;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack, onLogin, user }) => {
  return (
    <div className="subpage-container">
      <header className="subpage-header">
        <div className="subpage-logo" onClick={onBack} style={{ cursor: 'pointer' }}>
          <span>✨</span> Zodiac Whisper
        </div>
        {user ? (
          <button className="btn btn-outline" onClick={onBack}>Hi, {user.full_name || user.username}</button>
        ) : (
          <button className="btn btn-primary" onClick={onLogin}>Đăng nhập</button>
        )}
      </header>

      <main className="subpage-content">
        <div className="subpage-card">
          <h1 className="subpage-title">Chính Sách Bảo Mật</h1>
          <p className="subpage-subtitle">Cập nhật lần cuối: 26/4/2026</p>

          <div className="privacy-intro" style={{ marginBottom: '2rem', lineHeight: '1.8', color: '#4a5568' }}>
            Chào mừng bạn đến với <strong>Zodiac Whisper</strong> (“chúng tôi”). Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chính Sách Bảo Mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn khi bạn sử dụng dịch vụ của chúng tôi.
          </div>

          <div className="terms-list">
            <section className="terms-section">
              <h3>1. Thông Tin Chúng Tôi Thu Thập</h3>
              <div style={{ marginLeft: '1rem' }}>
                <h4>1.1 Thông Tin Cá Nhân</h4>
                <p>Chúng tôi có thể thu thập các loại thông tin cá nhân sau:</p>
                <ul>
                  <li><strong>Tên:</strong> Dùng để cá nhân hóa trải nghiệm và các bài đọc chiêm tinh của bạn.</li>
                  <li><strong>Chi Tiết Chiêm Tinh:</strong> Ngày sinh, giờ sinh, và thành phố nơi bạn sinh ra để tạo ra các bài đọc chiêm tinh cá nhân hóa.</li>
                </ul>

                <h4>1.2 Thông Tin Kỹ Thuật</h4>
                <p>Địa chỉ IP, loại trình duyệt, hệ điều hành và nhật ký truy cập có thể được thu thập để phân tích và xử lý sự cố.</p>

                <h4>1.3 Cookie</h4>
                <p>Chúng tôi sử dụng cookie để cải thiện trải nghiệm duyệt web của bạn và thu thập dữ liệu sử dụng. Bạn có thể quản lý cookie qua cài đặt trình duyệt.</p>
              </div>
            </section>

            <section className="terms-section">
              <h3>2. Cách Chúng Tôi Sử Dụng Thông Tin Của Bạn</h3>
              <p>Chúng tôi sử dụng thông tin của bạn để:</p>
              <ul>
                <li>Cung cấp các bài đọc chiêm tinh cá nhân hóa trên Trang Web.</li>
                <li>Cải thiện trải nghiệm người dùng và chức năng của Trang Web.</li>
                <li>Gửi bản tin hoặc cập nhật từ Trang Web, nhưng chỉ khi bạn đã đồng ý.</li>
              </ul>
            </section>

            <section className="terms-section">
              <h3>3. Chia Sẻ Thông Tin Của Bạn</h3>
              <p>Chúng tôi không bán, cho thuê hoặc trao đổi thông tin cá nhân của bạn. Dữ liệu của bạn có thể được chia sẻ với:</p>
              <ul>
                <li><strong>Nhà Cung Cấp Dịch Vụ:</strong> Các bên thứ ba đáng tin cậy như nhà cung cấp lưu trữ và dịch vụ phân tích.</li>
                <li><strong>Cơ Quan Pháp Lý:</strong> Khi được yêu cầu bởi pháp luật hoặc để bảo vệ quyền lợi hợp pháp của chúng tôi.</li>
              </ul>
            </section>

            <section className="terms-section">
              <h3>4. Quyền Của Bạn</h3>
              <p>Tùy thuộc vào vị trí của bạn, bạn có thể có các quyền sau:</p>
              <ul>
                <li><strong>Truy Cập:</strong> Yêu cầu truy cập dữ liệu cá nhân mà chúng tôi lưu trữ về bạn.</li>
                <li><strong>Chỉnh Sửa:</strong> Yêu cầu chỉnh sửa thông tin không chính xác hoặc không đầy đủ.</li>
                <li><strong>Xóa Dữ Liệu:</strong> Yêu cầu xóa dữ liệu của bạn (tuân theo các nghĩa vụ pháp lý).</li>
                <li><strong>Phản Đối:</strong> Phản đối việc xử lý dữ liệu cho mục đích tiếp thị hoặc các mục đích khác.</li>
              </ul>
            </section>

            <section className="terms-section">
              <h3>5. Bảo Mật Dữ Liệu</h3>
              <p>Chúng tôi triển khai các biện pháp bảo mật tiêu chuẩn để bảo vệ dữ liệu của bạn. Tuy nhiên, không có phương pháp truyền qua Internet hoặc lưu trữ điện tử nào là hoàn toàn an toàn.</p>
            </section>

            <section className="terms-section">
              <h3>6. Liên Kết Bên Thứ Ba</h3>
              <p>Trang Web của chúng tôi có thể chứa liên kết đến các trang web của bên thứ ba. Chúng tôi không chịu trách nhiệm về thực tiễn bảo mật của các trang web đó.</p>
            </section>

            <section className="terms-section">
              <h3>7. Quyền Riêng Tư Của Trẻ Em</h3>
              <p>Trang Web Zodiac Whisper không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập dữ liệu cá nhân từ trẻ em.</p>
            </section>

            <section className="terms-section">
              <h3>8. Cập Nhật Chính Sách Bảo Mật</h3>
              <p>Chúng tôi có thể cập nhật Chính Sách Bảo Mật này theo thời gian. Các thay đổi sẽ được đăng trên trang này kèm theo ngày hiệu lực cập nhật.</p>
            </section>

            <section className="terms-section">
              <h3>9. Liên Hệ Với Chúng Tôi</h3>
              <p>Nếu bạn có bất kỳ câu hỏi nào về Chính Sách Bảo Mật, vui lòng liên hệ với chúng tôi qua:</p>
              <p style={{ fontWeight: 'bold' }}>Email: nguyenkhoalamgh2003@gmail.com</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="subpage-footer">
        <div>© 2026 Zodiac Whisper. Professional Astrology AI System.</div>
        <div style={{ marginTop: '1.5rem' }}>
          <span onClick={onBack} style={{ cursor: 'pointer', color: '#6e2cf2' }}>Trang chủ</span>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
