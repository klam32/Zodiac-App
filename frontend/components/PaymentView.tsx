import React, { useState, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { PaymentPackage, PaymentInvoice } from '../types';

import PackageCard from './payment/PackageCard';
import PaymentReportModal from './payment/PaymentReportModal';
import PaymentInvoiceModal from './payment/PaymentInvoiceModal';

interface PaymentViewProps {
  onBalanceUpdate: (balance: number) => void;
  user: any;
}

const PaymentView: React.FC<PaymentViewProps> = ({ onBalanceUpdate, user }) => {
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoice | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await api.getPackages();
        setPackages(data.packages);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  // Poll for payment status
  useEffect(() => {
    let interval: any;
    if (selectedInvoice) {
      interval = setInterval(async () => {
        try {
          const res = await api.getPaymentStatus(selectedInvoice.payment_id);
          if (res.status === 'completed') {
            handlePaymentSuccess(res.tokens);
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Status check error', err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedInvoice, onBalanceUpdate]);

  const handlePaymentSuccess = async (tokens: number) => {
    toast.success(t('payment.successMsg', 'Chúc mừng! Bạn đã nạp thành công {{tokens}} tokens!', { tokens }), { duration: 5000 });
    setStatusMsg(t('payment.successStatus', 'Nạp thành công {{tokens}} tokens!', { tokens }));
    
    // Lấy lại thông tin user mới nhất để cập nhật số dư tổng
    try {
      const updatedUser = await api.checkAuth();
      onBalanceUpdate(updatedUser.token_balance);
    } catch (authErr) {
      console.error('Failed to refresh user after payment', authErr);
    }

    setTimeout(() => {
        setSelectedInvoice(null);
        setStatusMsg('');
    }, 5000);
  };

  const handleCreateInvoice = async (packageId: number) => {
    setIsProcessing(true);
    try {
      const invoice = await api.createInvoice(packageId);
      setSelectedInvoice(invoice);
    } catch (err: any) {
      toast.error(err.message || t('payment.invoiceError', 'Lỗi tạo hóa đơn'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-stone-400 font-serif italic">{t('payment.loadingPackages', 'Đang tải danh sách gói nạp...')}</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto flex flex-col custom-scrollbar">
      <header className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8 text-white pb-4 tracking-wide leading-snug border-b border-white/10">{t('payment.summonEnergy', 'Triệu Hồi Năng Lượng')}</h2>
        <p className="text-purple-300/50 italic font-medium">{t('payment.summonSubtitle', 'Tiếp thêm năng lượng vũ trụ để tiếp tục hành trình khai mở những bí mật của vạn mệnh.')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <PackageCard 
            key={pkg.id} 
            pkg={pkg} 
            onSelect={handleCreateInvoice}
            isProcessing={isProcessing}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <button 
          onClick={() => setShowReportForm(true)}
          className="text-white/50 text-xs hover:text-red-400 transition-colors flex items-center gap-2 mx-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('payment.reportIssue', 'Bạn gặp sự cố nạp tiền? Nhấn vào đây để báo cáo')}
        </button>
      </div>

      {showReportForm && (
        <PaymentReportModal user={user} onClose={() => setShowReportForm(false)} />
      )}

      {selectedInvoice && (
        <PaymentInvoiceModal 
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default PaymentView;
