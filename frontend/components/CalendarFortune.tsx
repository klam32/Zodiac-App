import React, { useState, useRef } from 'react';
import { formatText } from '../utils/formatText';
import { Download, Star, AlertCircle, Info, Calendar as CalendarIcon, User as UserIcon, MapPin, Sparkles, ArrowLeft } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';

interface DayData {
  day: number;
  quality: 'good' | 'bad' | 'neutral';
  reason: string;
}

interface CalendarFortuneProps {
  user: User | null;
  onBalanceUpdate: (b: number) => void;
  conversationId?: number | null;
  history?: any[];
}

const CalendarFortune: React.FC<CalendarFortuneProps> = ({ user, onBalanceUpdate, conversationId, history }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const CATEGORIES = [
    t('calendar.categories.overview'),
    t('calendar.categories.love'),
    t('calendar.categories.career'),
    t('calendar.categories.health'),
    t('calendar.categories.wealth'),
  ];

  const WEEKDAYS = currentLang === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const [view, setView] = useState<'input' | 'result'>('input');
  const [selectedField, setSelectedField] = useState(CATEGORIES[0]);
  const [birthInfo, setBirthInfo] = useState({
    name: user?.full_name || '',
    day: 1, month: 1, year: 1990, hour: 12, minute: 0, city: ''
  });
  const [targetDate, setTargetDate] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [chartSvg, setChartSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (conversationId && history && history.length > 0) {
      const calendarMsg = history.find(m => m.chart === 'calendar' || m.chart_summary);
      if (calendarMsg && calendarMsg.chart_summary) {
        const data = calendarMsg.chart_summary;
        setCalendarData(data.days || []);
        setSummary(data.summary || '');
        setChartSvg(calendarMsg.chart_svg || data.chart_svg || '');
        setSelectedField(data.field || CATEGORIES[0]);
        setTargetDate({ month: data.month || targetDate.month, year: data.year || targetDate.year });
        if (data.birth_info) setBirthInfo(data.birth_info);
        setView('result');
      }
    } else {
      setTargetDate({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      setView('input');
    }
  }, [conversationId, history]);

  const fetchCalendarData = async () => {
    if (!user) { toast.error(t('calendar.loginRequired')); return; }
    if (!birthInfo.name || !birthInfo.city) { toast.error(t('calendar.fillRequired')); return; }
    setIsLoading(true);
    try {
      const res = await api.getGoodBadDays({
        month: targetDate.month,
        year: targetDate.year,
        field: selectedField,
        language: currentLang,
        birth_info: { ...birthInfo, language: currentLang },
        conversation_id: conversationId ? Number(conversationId) : undefined
      });
      setCalendarData(res.days);
      setSummary(res.summary || '');
      setChartSvg(res.chart_svg || '');
      onBalanceUpdate(res.user_token_balance);
      setView('result');
      window.dispatchEvent(new Event("reload_conversations"));
      toast.success(t('calendar.successMessage'));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!calendarRef.current) return;
    setIsLoading(true);
    try {
      const canvas = await html2canvas(calendarRef.current, { backgroundColor: '#0a0a0f', scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Calendar_${birthInfo.name}_M${targetDate.month}_${targetDate.year}.pdf`);
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const daysInMonth = new Date(targetDate.year, targetDate.month, 0).getDate();
  const firstDayOfMonth = new Date(targetDate.year, targetDate.month - 1, 1).getDay();

  if (view === 'input') {
    return (
      <div className="flex-1 p-6 overflow-y-auto bg-black/40 backdrop-blur-md text-white">
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              {t('calendar.title')}
            </h1>
            <p className="text-gray-400">{t('calendar.subtitle')}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <UserIcon size={16} className="text-orange-500" /> {t('calendar.fullName')}
                </label>
                <input type="text" value={birthInfo.name} onChange={e => setBirthInfo({ ...birthInfo, name: e.target.value })}
                  placeholder={t('calendar.namePlaceholder')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <MapPin size={16} className="text-orange-500" /> {t('calendar.birthPlace')}
                </label>
                <input type="text" value={birthInfo.city} onChange={e => setBirthInfo({ ...birthInfo, city: e.target.value })}
                  placeholder={t('calendar.cityPlaceholder')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <CalendarIcon size={16} className="text-orange-500" /> {t('calendar.birthDate')}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <select value={birthInfo.day} onChange={e => setBirthInfo({ ...birthInfo, day: parseInt(e.target.value) })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition appearance-none">
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-gray-900 text-white">{t('calendar.day')} {i + 1}</option>
                    ))}
                  </select>
                  <select value={birthInfo.month} onChange={e => setBirthInfo({ ...birthInfo, month: parseInt(e.target.value) })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition appearance-none">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-gray-900 text-white">{t('calendar.month')} {i + 1}</option>
                    ))}
                  </select>
                  <input type="number" value={birthInfo.year} onChange={e => setBirthInfo({ ...birthInfo, year: parseInt(e.target.value) })}
                    placeholder={t('calendar.year')}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Sparkles size={16} className="text-orange-500" /> {t('calendar.birthTime')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="23" value={birthInfo.hour} onChange={e => setBirthInfo({ ...birthInfo, hour: parseInt(e.target.value) })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition"
                      placeholder={t('calendar.hour')} />
                    <span className="text-gray-500">{t('calendar.hour')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="59" value={birthInfo.minute} onChange={e => setBirthInfo({ ...birthInfo, minute: parseInt(e.target.value) })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition"
                      placeholder={t('calendar.minute')} />
                    <span className="text-gray-500">{t('calendar.minute')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/10 my-4" />

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400">{t('calendar.selectMonth')}</label>
              <div className="grid grid-cols-2 gap-4">
                <select value={targetDate.month} onChange={e => setTargetDate({ ...targetDate, month: parseInt(e.target.value) })}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition appearance-none">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1} className="bg-gray-900 text-white">{t('calendar.month')} {i + 1}</option>
                  ))}
                </select>
                <select value={targetDate.year} onChange={e => setTargetDate({ ...targetDate, year: parseInt(e.target.value) })}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition appearance-none">
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y} className="bg-gray-900 text-white">{t('calendar.year')} {y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400">{t('calendar.selectField')}</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setSelectedField(cat)}
                    className={`px-4 py-2 rounded-full text-xs transition ${selectedField === cat ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={fetchCalendarData} disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(234,88,12,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
              <Sparkles size={20} />
              {isLoading ? t('calendar.calculating') : t('calendar.viewCalendar')}
            </button>
            <p className="text-center text-[10px] text-gray-500">{t('calendar.tokenNote')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-black/40 backdrop-blur-md text-white">
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('input')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                {t('calendar.resultTitle')}
              </h1>
              <p className="text-gray-400">{t('calendar.forUser')} {birthInfo.name} - {t('calendar.month')} {targetDate.month}/{targetDate.year}</p>
            </div>
          </div>
          <button onClick={downloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95">
            <Download size={20} />
            {t('calendar.downloadPDF')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info size={18} className="text-blue-400" />
              <h3 className="font-medium">{t('calendar.fieldAnalysis')}: {selectedField}</h3>
            </div>
            <p className="text-sm text-gray-400">
              {t('calendar.whyBirthChartDesc')}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
              <span className="text-sm">{t('calendar.goodDay')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-black border border-white/20"></div>
              <span className="text-sm">{t('calendar.badDay')}</span>
            </div>
          </div>
        </div>

        {chartSvg && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Star className="text-yellow-500" size={20} />
                <h2 className="text-xl font-bold">{t('calendar.birthChart')}</h2>
              </div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-[10px] font-bold border border-orange-500/30">Natal Chart</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-orange-500/10 blur-[60px] rounded-full group-hover:bg-orange-500/20 transition-all duration-700" />
                <div className="relative z-10 w-full aspect-square natal-chart-svg" dangerouslySetInnerHTML={{ __html: chartSvg }} />
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                    <Info size={18} /> {t('calendar.whyBirthChart')}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{t('calendar.whyBirthChartDesc')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                    <div className="text-xs text-gray-500 uppercase mb-1">{t('calendar.strength')}</div>
                    <div className="text-white font-bold">{currentLang === 'en' ? 'Natal' : 'Bản nguyên'}</div>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                    <div className="text-xs text-gray-500 uppercase mb-1">{t('calendar.opportunity')}</div>
                    <div className="text-white font-bold">{currentLang === 'en' ? 'Potential' : 'Tiềm năng'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={calendarRef} className="space-y-6 bg-[#0a0a0f] p-2 md:p-4 rounded-2xl">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 shadow-xl relative">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white uppercase tracking-widest">{t('calendar.month')} {targetDate.month} / {targetDate.year}</h2>
              <p className="text-orange-500 text-[10px] mt-1">{t('calendar.astrologyCalendar')}</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-center text-[10px] md:text-xs font-bold text-gray-500 py-1 border-b border-white/5">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const data = calendarData.find(d => d.day === day);
                  const isGood = data?.quality === 'good';
                  const isBad = data?.quality === 'bad';
                  const colIndex = (firstDayOfMonth + i) % 7;
                  let tooltipPositionClass = "left-1/2 -translate-x-1/2";
                  if (colIndex === 0 || colIndex === 1) tooltipPositionClass = "left-0";
                  else if (colIndex === 5 || colIndex === 6) tooltipPositionClass = "right-0";
                  return (
                    <div key={day}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer group ${isGood ? 'bg-red-500/20 border-red-500/50 text-red-100 hover:bg-red-500/30 ring-1 ring-red-500/20' : isBad ? 'bg-black/60 border-white/5 text-gray-400 hover:bg-white/5' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
                      <span className="text-base md:text-lg font-bold">{day}</span>
                      {isGood && <Star size={10} className="text-yellow-400 fill-yellow-400 mt-0.5 animate-pulse" />}
                      {isBad && <AlertCircle size={10} className="text-gray-600 mt-0.5" />}
                      {data?.reason && (
                        <div className={`absolute bottom-full ${tooltipPositionClass} mb-3 w-56 p-3 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl text-[10px] opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-center leading-relaxed origin-bottom`}>
                          <div className="text-orange-400 font-bold mb-1">{t('calendar.interpretation')}</div>
                          {data.reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-6 text-center border-t border-white/5 pt-4">
              <p className="text-[10px] text-gray-600 italic">{t('calendar.analyzedByAI')} - {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {summary && (
            <div className="bg-[#0f0f15] border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-yellow-400" size={20} />
                <h2 className="text-lg font-bold text-orange-400 uppercase tracking-wider">
                  {t('calendar.detailedInterpretation')} {targetDate.month}
                </h2>
              </div>
              <div className="prose prose-invert max-w-none mb-6">
                <div className="text-gray-300 leading-relaxed text-base whitespace-pre-wrap">{summary}</div>
              </div>
              <div className="space-y-3 border-t border-white/10 pt-6">
                <h3 className="text-base font-bold text-white mb-3">{t('calendar.specialDates')}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {calendarData.filter(d => d.quality !== 'neutral').map(d => (
                    <div key={d.day} className="flex gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${d.quality === 'good' ? 'bg-red-500/20 border-red-500/50 text-red-100' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                        <span className="text-base font-bold">{d.day}</span>
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-bold mb-0.5 ${d.quality === 'good' ? 'text-red-400' : 'text-gray-400'}`}>
                          {d.quality === 'good' ? t('calendar.auspiciousDay') : t('calendar.cautionDay')}
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{d.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 p-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                <div className="flex items-start gap-4">
                  <Info className="text-orange-400 mt-1 flex-shrink-0" size={20} />
                  <p className="text-sm text-orange-200/80 italic">{t('calendar.note')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-orange-500/20 rounded-full"></div>
              <div className="absolute top-0 w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-orange-500 text-xl font-bold animate-pulse">{t('calendar.calculating')}</p>
              <p className="text-gray-400 text-sm">{currentLang === 'en' ? 'AI is scanning your birth chart and planetary positions' : 'AI đang quét lá số và vị trí các vì sao'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarFortune;
