import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FAQSectionProps {
  siteConfig: any;
  currentLang: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ siteConfig, currentLang }) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const getVal = (key: string, defaultVal: string) => {
    const localizedKey = `${key}_${currentLang}`;
    if (currentLang === 'en') {
      return siteConfig[localizedKey] || defaultVal || siteConfig[key];
    }
    return siteConfig[localizedKey] || siteConfig[key] || defaultVal;
  };

  const faqs = [
    {
      q: t('landing.faq.q1', 'Zodiac Whisper có miễn phí không?'),
      a: t('landing.faq.a1', 'Có, chúng tôi cung cấp lượt trải nghiệm miễn phí khi bạn mới đăng ký tài khoản. Bạn cũng có thể nhận được token miễn phí qua điểm danh hằng ngày. Với các tính năng AI luận giải chuyên sâu hơn, bạn có thể nạp thêm token thông qua các gói nạp linh hoạt.')
    },
    {
      q: t('landing.faq.q2', 'Token dùng để làm gì?'),
      a: t('landing.faq.a2', 'Token được sử dụng làm chi phí cho mỗi lượt đặt câu hỏi với AI, tạo bản đồ sao nâng cao, giải mã giấc mơ, xem lịch cát tường hoặc tra cứu vận trình ngày. Số lượng token tiêu hao sẽ được thông báo rõ ràng trước mỗi tính năng.')
    },
    {
      q: t('landing.faq.q3', 'Bản đồ sao có chính xác không?'),
      a: t('landing.faq.a3', 'Rất chính xác. Bản đồ sao được xây dựng dựa trên thuật toán tính toán thiên văn học chuẩn quốc tế, định vị chính xác vị trí của Mặt Trời, Mặt Trăng và các hành tinh tại đúng thời điểm và địa điểm sinh mà bạn cung cấp.')
    },
    {
      q: t('landing.faq.q4', 'Tôi có thể hỏi AI những gì?'),
      a: t('landing.faq.a4', 'Bạn có thể hỏi tất cả những thắc mắc xoay quanh cuộc sống của mình như: Điểm mạnh sự nghiệp của tôi là gì? Tình duyên của tôi trong năm nay ra sao? Giấc mơ thấy bay lên trời có ý nghĩa gì? AI chiêm tinh sẽ kết hợp dữ liệu bản đồ sao của bạn để đưa ra câu trả lời cá nhân hóa sâu sắc nhất.')
    },
    {
      q: t('landing.faq.q5', 'Dữ liệu cá nhân của tôi có được bảo mật không?'),
      a: t('landing.faq.a5', 'Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của bạn. Ngày sinh, giờ sinh và lịch sử các cuộc hội thoại chỉ được sử dụng để tạo bản đồ sao và cá nhân hóa câu trả lời của AI cho riêng bạn, không bao giờ được chia sẻ với bất kỳ bên thứ ba nào.')
    },
    {
      q: t('landing.faq.q6', 'Tôi có thể đổi ngôn ngữ không?'),
      a: t('landing.faq.a6', 'Có, Zodiac Whisper hỗ trợ hoàn toàn song ngữ Tiếng Việt và Tiếng Anh. Bạn có thể dễ dàng chuyển đổi ngôn ngữ hiển thị của toàn bộ hệ thống ngay tại menu trên thanh điều hướng đầu trang.')
    },
    {
      q: t('landing.faq.q7', 'Nếu nạp token bị lỗi thì phải làm sao?'),
      a: t('landing.faq.a7', 'Nếu bạn gặp lỗi trong quá trình nạp token, hãy liên hệ với bộ phận hỗ trợ khách hàng qua nút Zalo/Hotline hoặc gửi email cho chúng tôi. Chúng tôi sẽ kiểm tra giao dịch và cộng token cho bạn trong vòng 5-10 phút.')
    }
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq-section" className="faq-section-v2 reveal active">
      <div className="section-container">
        <div className="section-header">
          <div className="badge">✦ {t('landing.faq.label', 'GIẢI ĐÁP THẮC MẮC')}</div>
          <h2>{getVal('faq_title', t('landing.faq.title', 'Câu hỏi thường gặp'))}</h2>
          <p className="section-subtitle">
            {t('landing.faq.subtitle', 'Tìm câu trả lời nhanh chóng cho những thắc mắc phổ biến về hệ thống chiêm tinh AI.')}
          </p>
        </div>

        <div className="faq-accordion-list">
          {faqs.map((faq, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <div key={idx} className={`faq-accordion-item ${isOpen ? 'active' : ''}`}>
                <button
                  type="button"
                  className="faq-accordion-header"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFAQ(idx);
                  }}
                >
                  <div className="faq-question-title">
                    <HelpCircle size={18} className="faq-icon-prefix" />
                    <span>{faq.q}</span>
                  </div>
                  <ChevronDown size={18} className={`faq-chevron ${isOpen ? 'rotate' : ''}`} />
                </button>
                <div className="faq-accordion-body" style={{ maxHeight: isOpen ? '500px' : '0' }}>
                  <div className="faq-answer-content">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
