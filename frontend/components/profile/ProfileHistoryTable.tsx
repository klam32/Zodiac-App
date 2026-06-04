import React from 'react';
import { useTranslation } from 'react-i18next';

interface ProfileHistoryTableProps {
  transactions: any[];
  loading: boolean;
  onViewTx: (tx: any) => void;
}

const ProfileHistoryTable: React.FC<ProfileHistoryTableProps> = ({ transactions, loading, onViewTx }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-50 bg-stone-50/50">
        <h3 className="font-bold text-stone-800">{t('profile.transactionHistory')}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-400">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left font-medium uppercase tracking-wider">{t('profile.createdAt')}</th>
              <th className="px-4 md:px-6 py-3 text-left font-medium uppercase tracking-wider">{t('profile.type')}</th>
              <th className="px-4 md:px-6 py-3 text-right font-medium uppercase tracking-wider">{t('profile.amount')}</th>
              <th className="hidden md:table-cell px-6 py-3 text-left font-medium uppercase tracking-wider">{t('profile.description')}</th>
              <th className="px-4 md:px-6 py-3 text-center font-medium uppercase tracking-wider">{currentLang === 'en' ? 'Actions' : 'Thao tác'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-stone-400 italic">{t('common.loading')}</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-stone-400 italic">{t('profile.noHistory')}</td>
              </tr>
            ) : (
              transactions.map((h, i) => (
                <tr
                  key={i}
                  onClick={() => onViewTx(h)}
                  className="hover:bg-amber-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-stone-500">
                    {new Date(h.created_at).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'vi-VN')}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${h.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {h.type === 'in'
                        ? (currentLang === 'en' ? 'Receive' : 'Nhận')
                        : (currentLang === 'en' ? 'Spend' : 'Chi')}
                    </span>
                  </td>
                  <td className={`px-4 md:px-6 py-4 text-right font-bold ${h.type === 'in' ? 'text-green-600' : 'text-amber-600'}`}>
                    {h.type === 'in' ? '+' : '-'}{h.amount}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-stone-600 max-w-[150px] truncate">
                    {h.description}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    <button className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded hover:bg-amber-600 hover:text-white transition-all">
                      {currentLang === 'en' ? 'View' : 'Xem'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfileHistoryTable;
