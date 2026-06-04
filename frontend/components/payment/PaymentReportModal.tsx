import React, { useState } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';

interface PaymentReportModalProps {
  user: any;
  onClose: () => void;
}

const PaymentReportModal: React.FC<PaymentReportModalProps> = ({ user, onClose }) => {
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('payment_not_received');
  const [invoiceCode, setInvoiceCode] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Ảnh minh chứng không được vượt quá 5MB.');
      return;
    }

    setSelectedFile(file);
    setFileSizeStr(formatFileSize(file.size));

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setIsUploaded(false);
    try {
      const res = await api.uploadReportEvidence(file);
      setAttachmentUrl(res.url);
      setIsUploaded(true);
      toast.success('Tải lên ảnh minh chứng thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải lên ảnh minh chứng.');
      setSelectedFile(null);
      setFilePreview(null);
      setAttachmentUrl('');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setAttachmentUrl('');
    setIsUploaded(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề sự cố.');
      return;
    }
    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết.');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('Mô tả sự cố phải dài ít nhất 10 ký tự.');
      return;
    }
    if (uploading) {
      toast.error('Vui lòng đợi ảnh minh chứng tải lên xong.');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Đang gửi báo cáo sự cố...');
    try {
      await api.createPaymentReport({
        title: title.trim(),
        report_type: reportType,
        invoice_code: invoiceCode.trim() || undefined,
        transaction_code: transactionCode.trim() || undefined,
        description: description.trim(),
        attachment_url: attachmentUrl.trim() || undefined,
      });

      toast.success('Gửi báo cáo thành công! Ban quản trị sẽ kiểm tra sớm và gửi email phản hồi.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi báo cáo');
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <style>{`
        .custom-modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-modal-scroll::-webkit-scrollbar-thumb {
          background: #4a4944;
          border-radius: 4px;
        }
        .custom-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #6a6964;
        }
      `}</style>
      
      <div className="bg-[#1e1d1b] border border-stone-800 rounded-[28px] max-w-xl w-[92%] md:w-full relative shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-stone-200">
        
        {/* Header (Fixed) */}
        <div className="p-6 pb-4 flex justify-between items-start border-b border-stone-800/60 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-amber-500">Báo cáo sự cố & thanh toán</h3>
            <p className="text-stone-400 text-xs mt-1">Cung cấp chi tiết sự cố để ban quản trị xử lý nhanh nhất.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-rose-500 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 pr-4 custom-modal-scroll text-sm">
          
          {/* User Info Box */}
          <div className="bg-stone-950/50 border border-stone-800/80 rounded-2xl p-4 grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-stone-500 block uppercase font-bold tracking-wider text-[9px] mb-0.5">Tài khoản</span>
              <span className="text-stone-200 font-semibold truncate block" title={user?.username}>{user?.username || 'N/A'}</span>
            </div>
            <div>
              <span className="text-stone-500 block uppercase font-bold tracking-wider text-[9px] mb-0.5">Email</span>
              <span className="text-stone-200 font-semibold truncate block" title={user?.email}>{user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-stone-500 block uppercase font-bold tracking-wider text-[9px] mb-0.5">Số dư</span>
              <span className="text-amber-400 font-bold block truncate">{user?.token_balance?.toFixed(2) || '0.00'} Tokens</span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1.5">
              Tiêu đề sự cố <span className="text-amber-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="Ví dụ: Đã chuyển khoản nhưng chưa nhận token..."
              className="w-full bg-[#2a2926] border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Issue Type */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1.5">
              Loại sự cố / Yêu cầu <span className="text-amber-500">*</span>
            </label>
            <select
              className="w-full bg-[#2a2926] border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="payment_not_received">Đã thanh toán nhưng chưa nhận token</option>
              <option value="wrong_token_amount">Sai số token nhận được</option>
              <option value="payment_failed">Thanh toán thất bại / Lỗi cổng thanh toán</option>
              <option value="duplicate_payment">Thanh toán bị trùng lặp giao dịch</option>
              <option value="other">Vấn đề khác</option>
            </select>
          </div>

          {/* Invoice Code and Transaction Code Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                Mã hóa đơn (nếu có)
              </label>
              <input 
                type="text"
                placeholder="Ví dụ: #71"
                className="w-full bg-[#2a2926] border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-all"
                value={invoiceCode}
                onChange={(e) => setInvoiceCode(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                Mã giao dịch / Transaction
              </label>
              <input 
                type="text"
                placeholder="Ví dụ: FT260529..."
                className="w-full bg-[#2a2926] border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-all"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1.5">
              Mô tả chi tiết sự cố <span className="text-amber-500">*</span>
            </label>
            <textarea 
              rows={4}
              placeholder="Vui lòng cung cấp thêm thông tin chi tiết (thời gian, hình thức thanh toán, số tiền chuyển khoản...)"
              className="w-full bg-[#2a2926] border border-stone-700 rounded-xl p-4 text-sm text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
            <span className="text-[10px] text-stone-500 block mt-1 px-1">
              Tối thiểu 10 ký tự. Đã nhập: {description.trim().length} ký tự.
            </span>
          </div>

          {/* Attachment Upload Zone */}
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-0.5">
              Ảnh minh chứng (nếu có)
            </label>
            <p className="text-[11px] text-stone-400 mb-2">
              Bạn có thể tải lên ảnh chụp màn hình giao dịch hoặc biên lai thanh toán.
            </p>

            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px]
                  ${dragActive 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-stone-700 hover:border-amber-500/50 hover:bg-stone-800/20'
                  }`}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  disabled={isSubmitting || uploading}
                />
                
                {/* Upload Icon */}
                <svg className="w-10 h-10 text-stone-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>

                <p className="text-sm font-medium text-stone-200">
                  Bấm để chọn ảnh hoặc kéo thả ảnh vào đây
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.
                </p>
              </div>
            ) : (
              <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {filePreview && (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-xl object-cover border border-stone-800 bg-stone-950 flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-stone-200 truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {fileSizeStr}
                    </p>
                    {uploading ? (
                      <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1 mt-1">
                        <svg className="animate-spin h-3.5 w-3.5 mr-1 inline-block" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang tải lên...
                      </span>
                    ) : isUploaded ? (
                      <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Đã tải lên
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteFile}
                  disabled={isSubmitting || uploading}
                  className="bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 hover:text-rose-350 p-2.5 rounded-xl transition-all cursor-pointer flex-shrink-0"
                  title="Xóa ảnh"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer (Fixed) */}
        <div className="p-6 border-t border-stone-800/60 flex gap-4 flex-shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 py-3 rounded-xl font-bold transition-all"
            disabled={isSubmitting || uploading}
          >
            Hủy Bỏ
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || uploading}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentReportModal;
