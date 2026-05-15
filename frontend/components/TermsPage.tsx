import React from 'react';
import './SubPage.css';
import { User } from '../types';

interface TermsPageProps {
  onBack: () => void;
  onLogin: () => void;
  user?: User | null;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack, onLogin, user }) => {
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
          <h1 className="subpage-title">Điều Khoản Sử Dụng</h1>
          <p className="subpage-subtitle">
            Chào mừng bạn đến với <strong>Zodiac Whisper</strong>. Bằng cách truy cập hoặc sử dụng trang web này, bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều Khoản Sử Dụng dưới đây.
          </p>

          <div className="terms-list">
            <section className="terms-section">
              <h3>1. Chấp Nhận Điều Khoản</h3>
              <p>Khi truy cập hoặc sử dụng trang web này, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý với các Điều Khoản Sử Dụng này cũng như Chính Sách Bảo Mật của chúng tôi.</p>
            </section>

            <section className="terms-section">
              <h3>2. Thay Đổi Điều Khoản</h3>
              <p>Chúng tôi có quyền thay đổi hoặc cập nhật Điều Khoản Sử Dụng bất kỳ lúc nào mà không cần thông báo trước. Việc bạn tiếp tục sử dụng trang web sau khi có thay đổi nghĩa là bạn đồng ý với các điều khoản mới.</p>
            </section>

            <section className="terms-section">
              <h3>3. Sử Dụng Trang Web</h3>
              <ul>
                <li>Bạn chỉ được sử dụng trang web này cho mục đích cá nhân, không mang tính thương mại.</li>
                <li>Bạn đồng ý không:
                  <ul>
                    <li>Tham gia vào các hoạt động bất hợp pháp, lừa đảo hoặc độc hại khi sử dụng trang web.</li>
                    <li>Cố gắng phá hoại hoặc làm gián đoạn hoạt động của trang web thông qua hacking, khai thác dữ liệu hoặc các hoạt động trái phép khác.</li>
                    <li>Sao chép, phân phối hoặc chỉnh sửa bất kỳ nội dung nào trên trang web mà không có sự cho phép bằng văn bản từ chúng tôi.</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className="terms-section">
              <h3>4. Tuyên Bố Miễn Trừ Nội Dung</h3>
              <p>Tất cả nội dung trên Zodiac Whisper, bao gồm các bản đồ sao, bài viết, báo cáo và các nội dung chiêm tinh, đều mang tính chất tham khảo và giải trí.</p>
              <ul>
                <li>Chúng tôi không đảm bảo tính chính xác, đầy đủ hoặc độ tin cậy của bất kỳ thông tin nào được cung cấp.</li>
                <li>Nội dung trên trang web không nhằm thay thế lời khuyên chuyên nghiệp, bao gồm tư vấn pháp lý, y tế, tài chính hoặc tâm lý.</li>
              </ul>
            </section>

            <section className="terms-section">
              <h3>5. Nội Dung Người Dùng Gửi</h3>
              <p>Nếu bạn gửi bất kỳ nội dung nào (ví dụ: bình luận, phản hồi hoặc đánh giá) đến trang web:</p>
              <ul>
                <li>Bạn cấp cho chúng tôi quyền không độc quyền, trên toàn cầu, miễn phí bản quyền để sử dụng, tái sản xuất và hiển thị nội dung của bạn liên quan đến trang web.</li>
                <li>Bạn đồng ý không gửi bất kỳ nội dung nào mang tính xúc phạm, độc hại hoặc vi phạm pháp luật.</li>
              </ul>
            </section>

            <section className="terms-section">
              <h3>6. Liên Kết Bên Thứ Ba</h3>
              <p>Trang web của chúng tôi có thể chứa liên kết đến các trang web của bên thứ ba nhằm mục đích thuận tiện. Chúng tôi không đảm bảo hoặc chịu trách nhiệm về nội dung hoặc thực tiễn của các trang web đó. Việc sử dụng các liên kết bên thứ ba là rủi ro của bạn.</p>
            </section>

            <section className="terms-section">
              <h3>7. Quyền Sở Hữu Trí Tuệ</h3>
              <p>Tất cả nội dung trên trang web này, bao gồm văn bản, hình ảnh, logo và phần mềm, đều là tài sản trí tuệ của Zodiac Whisper, trừ khi có ghi chú khác. Bạn không được phép sao chép, phân phối hoặc sử dụng bất kỳ nội dung nào trên trang web mà không có sự cho phép bằng văn bản.</p>
            </section>

            <section className="terms-section">
              <h3>8. Giới Hạn Trách Nhiệm</h3>
              <p>Trong phạm vi pháp luật cho phép, Zodiac Whisper không chịu trách nhiệm đối với bất kỳ thiệt hại nào phát sinh từ việc bạn sử dụng hoặc không thể sử dụng trang web, hoặc bất kỳ lỗi/thiếu sót nào trong nội dung.</p>
            </section>

            <section className="terms-section">
              <h3>9. Bồi Thường</h3>
              <p>Bạn đồng ý bồi thường và bảo vệ Zodiac Whisper khỏi bất kỳ khiếu nại, tổn thất hoặc thiệt hại nào phát sinh từ việc bạn sử dụng trang web hoặc vi phạm các Điều Khoản Sử Dụng này.</p>
            </section>

            <section className="terms-section">
              <h3>10. Chấm Dứt</h3>
              <p>Chúng tôi có quyền chấm dứt hoặc đình chỉ quyền truy cập của bạn vào trang web theo quyết định của chúng tôi mà không cần thông báo trước nếu bạn vi phạm các điều khoản.</p>
            </section>

            <section className="terms-section">
              <h3>11. Luật Áp Dụng</h3>
              <p>Các Điều Khoản Sử Dụng này được điều chỉnh và giải thích theo luật pháp hiện hành tại Việt Nam.</p>
            </section>

            <section className="terms-section">
              <h3>12. Liên Hệ Chúng Tôi</h3>
              <p>Nếu bạn có bất kỳ câu hỏi nào về các Điều Khoản Sử Dụng, vui lòng liên hệ với chúng tôi qua:</p>
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

export default TermsPage;
