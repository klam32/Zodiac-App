import React from 'react';
import { X, ShieldAlert, FileText, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PolicyModalProps {
  isOpen: boolean;
  type: 'privacy' | 'terms' | 'payment';
  onClose: () => void;
  siteConfig: any;
  currentLang: string;
}

const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, type, onClose, siteConfig, currentLang }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const getContent = () => {
    if (type === 'privacy') {
      const defaultPrivacy = currentLang === 'en' ? `
<h3>1. Commitment to Personal Data Protection</h3>
<p>We understand that your personal information is priceless and commit to protecting it with state-of-the-art security measures. Zodiac Whisper never shares, sells, or provides user information to any third party without written consent from the owner.</p>

<h3>2. Purpose of Data Collection</h3>
<p>The date of birth, time of birth, and geographic coordinates you input into the system are used for the sole purpose of calculating personalized astrological charts and generating corresponding insights from AI agents. Your conversation history is fully encrypted on our servers.</p>

<h3>3. User Rights</h3>
<p>Users have full rights to view, export, edit, or permanently delete their personal data from the system at any time by contacting our administrator team or using the delete feature in account settings.</p>
      ` : `
<h3>1. Cam kết bảo vệ thông tin cá nhân</h3>
<p>Chúng tôi hiểu rằng thông tin cá nhân của bạn là tài sản vô giá và cam kết bảo vệ nó bằng các biện pháp an ninh tối tân nhất. Zodiac Whisper không bao giờ tự ý chia sẻ, mua bán hay cung cấp thông tin người dùng cho bất kỳ bên thứ ba nào khi chưa được sự đồng ý bằng văn bản của chính chủ sở hữu.</p>

<h3>2. Mục đích thu thập dữ liệu</h3>
<p>Dữ liệu về ngày sinh, giờ sinh và tọa độ địa lý mà bạn nhập vào hệ thống chỉ được dùng cho mục đích duy nhất: tính toán bản đồ sao chiêm tinh cá nhân hóa và cung cấp câu trả lời tương ứng từ các tác tử trí tuệ nhân tạo. Lịch sử cuộc hội thoại của bạn được mã hóa hoàn toàn trên hệ thống máy chủ của chúng tôi.</p>

<h3>3. Quyền hạn của người dùng</h3>
<p>Người dùng có toàn quyền xem, xuất file, yêu cầu chỉnh sửa hoặc xóa vĩnh viễn toàn bộ dữ liệu cá nhân của mình khỏi hệ thống bất kỳ lúc nào bằng cách liên hệ với đội ngũ quản trị viên hoặc sử dụng tính năng xóa trong phần cài đặt tài khoản.</p>
      `;
      return {
        title: getVal('policy_privacy_title', t('landing.footer.privacy', 'Chính sách bảo mật')),
        icon: <ShieldAlert size={24} style={{ color: '#8a2be2' }} />,
        body: getVal('policy_privacy_body', defaultPrivacy)
      };
    } else if (type === 'terms') {
      const defaultTerms = currentLang === 'en' ? `
<h3>1. Legitimate Service Usage</h3>
<p>Users commit to using Zodiac Whisper services only for lawful, personal, non-commercial purposes, and not to abuse the system, exploit vulnerabilities, or send malicious queries that disrupt the AI server infrastructure.</p>

<h3>2. Content Liability Disclaimer</h3>
<p>All insights, predictions, and advice from AI agents on the system are for reference, contemplation, and entertainment purposes only. These interpretations do not substitute for professional medical, psychological, legal, financial investment, or educational advice.</p>

<h3>3. Copyright & Intellectual Property</h3>
<p>All system resources, including user interface, source code, birth chart icons, and analysis algorithms, are the exclusive intellectual property of Zodiac Whisper. Redistribution, duplication, or modification in any form is strictly prohibited.</p>
      ` : `
<h3>1. Sử dụng dịch vụ hợp lệ</h3>
<p>Người dùng cam kết chỉ sử dụng dịch vụ của Zodiac Whisper cho các mục đích hợp pháp, phi thương mại cá nhân, và không lạm dụng hệ thống, khai thác lỗ hổng hay gửi các truy vấn độc hại làm gián đoạn hạ tầng máy chủ AI.</p>

<h3>2. Giới hạn trách nhiệm nội dung</h3>
<p>Mọi nội dung luận giải, dự báo và tư vấn từ trí tuệ nhân tạo (AI) trên hệ thống chỉ mang tính chất tham khảo, chiêm nghiệm và giải trí. Những luận giải này hoàn toàn không thay thế cho các tư vấn chuyên môn về y tế, tâm lý, pháp lý, đầu tư tài chính hoặc giáo dục.</p>

<h3>3. Bản quyền & Sở hữu trí tuệ</h3>
<p>Toàn bộ tài nguyên hệ thống, bao gồm giao diện người dùng, mã nguồn, biểu tượng bản đồ sao và các thuật toán phân tích thuộc quyền sở hữu trí tuệ độc quyền của Zodiac Whisper. Nghiêm cấm sao chép, phân phối lại hoặc chỉnh sửa dưới mọi hình thức.</p>
      `;
      return {
        title: getVal('policy_terms_title', t('landing.footer.terms', 'Điều khoản sử dụng')),
        icon: <FileText size={24} style={{ color: '#ffd700' }} />,
        body: getVal('policy_terms_body', defaultTerms)
      };
    } else {
      const defaultPayment = currentLang === 'en' ? `
<h3>1. Flexible Token Packages</h3>
<p>Tokens are the internal payment units used to access advanced artificial intelligence features (such as AI Chatbots, Compatibility Insights, Auspicious Calendar, or Voice Out). You can choose token packages that match your usage needs.</p>

<h3>2. Payment Process & Token Crediting</h3>
<p>Upon a successful purchase through the displayed payment gateways, the corresponding amount of tokens will be automatically credited to your account immediately. In case of network errors or banking delays, please submit a support ticket with your transaction invoice for manual approval.</p>

<h3>3. Refund & Conversion Policy</h3>
<p>Tokens purchased and credited to your account are non-refundable, non-convertible to cash, and non-transferable to other accounts, except during special programs and policies officially announced in writing by system administrators.</p>
      ` : `
<h3>1. Gói nạp Token linh hoạt</h3>
<p>Token là đơn vị thanh toán nội bộ được sử dụng để duy trì hoạt động cho các tính năng trí tuệ nhân tạo chuyên sâu (như Chatbot AI, Luận giải tương hợp, Lịch cát tường, hay Voice Out). Bạn có thể chọn các gói token phù hợp với nhu cầu sử dụng của mình.</p>

<h3>2. Quy trình thanh toán & cộng Token</h3>
<p>Khi thực hiện nạp token thành công thông qua các cổng thanh toán hiển thị trong hệ thống, số lượng token tương ứng sẽ được tự động cộng vào tài khoản của bạn ngay lập tức. Trong trường hợp xảy ra sự cố nghẽn mạng hay chậm trễ từ ngân hàng, vui lòng gửi báo cáo kèm hóa đơn giao dịch tại phần Hỗ trợ để Admin duyệt thủ công.</p>

<h3>3. Chính sách hoàn trả & quy đổi</h3>
<p>Token đã nạp vào tài khoản sẽ không thể quy đổi ngược thành tiền mặt hoặc chuyển nhượng cho tài khoản khác, trừ khi có các chương trình và chính sách đặc biệt được thông báo bằng văn bản từ ban điều hành hệ thống.</p>
      `;
      return {
        title: getVal('policy_payment_title', t('landing.footer.payment', 'Chính sách thanh toán & Token')),
        icon: <Wallet size={24} style={{ color: '#ff00ff' }} />,
        body: getVal('policy_payment_body', defaultPayment)
      };
    }
  };

  const data = getContent();

  return (
    <div className="policy-modal-overlay" onClick={onClose}>
      <div className="policy-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="policy-modal-header">
          <div className="policy-modal-title">
            {data.icon}
            <h2>{data.title}</h2>
          </div>
          <button
            type="button"
            className="policy-modal-close-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="policy-modal-body">
          <div dangerouslySetInnerHTML={{ __html: data.body }} />
        </div>

        <div className="policy-modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            {t('common.close', 'Đóng lại')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
