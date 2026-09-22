import React, { useState } from "react"
import { Download, Star, Orbit, BookOpen, Sparkles, X } from "lucide-react"
import { formatText } from "../../utils/formatText";
import { useTranslation } from "react-i18next";
import { api } from '../../api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const SourceDetailModal = ({
  source,
  onClose,
  t
}: {
  source: any;
  onClose: () => void;
  t: any;
}) => {
  const [formattedContent, setFormattedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormat = async () => {
    if (formattedContent) return;
    try {
      setIsLoading(true);
      const res = await api.formatRagText(source.content);
      setFormattedContent(res.formatted_text);
      toast.success(t('chat.message.formatSuccess', 'Đã sửa format văn bản!'));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || t('chat.message.formatError', 'Lỗi khi format văn bản'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0d0d16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-bold text-gray-100 truncate pr-4">
            {source.section_name}
          </h3>
          
          <div className="flex items-center gap-3">
            {!formattedContent && (
              <button
                onClick={handleFormat}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 text-xs font-bold hover:from-amber-500/30 hover:to-orange-500/30 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 animate-pulse" />
                {isLoading ? t('chat.message.processing', 'Đang xử lý...') : t('chat.message.aiRewrite', '✨ Sửa chữ bằng AI')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="text-xs text-gray-400">
            Tài liệu: <span className="text-purple-300 font-semibold">{source.section_name}</span>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-xs text-gray-500 font-medium uppercase tracking-wider">[Đoạn trích]</h4>
            <div className="pl-4 border-l-2 border-purple-500/30 text-sm text-gray-200 leading-relaxed font-light">
              {formattedContent ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{formattedContent}</ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-line">{source.content}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoveAnalysisResult = ({
  chart1,
  chart2,
  percent,
  label,
  interpretation,
  name1,
  name2,
  sources
}: any) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';
  const [selectedSource, setSelectedSource] = useState<any | null>(null);

  const safePercent = percent ?? 0

  // ✅ VALIDATE SVG
  const isValidSVG = (svg: string) =>
    typeof svg === "string" && svg.includes("<svg")

  // 🔥 DOWNLOAD FUNCTION
  const downloadChart = (svg: string, name: string) => {
    if (!isValidSVG(svg)) return

    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${name}-${Date.now()}.svg`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-700">

      {/* 🌌 BACKGROUND EFFECTS (SYNCED WITH ASTROLOGY) */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-pink-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10">

        {/* 💘 COMPATIBILITY HEADER */}
        <div className="text-center space-y-4 mb-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 backdrop-blur-md">
            <Star className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span className="text-sm font-bold text-pink-300 uppercase tracking-widest">{t('chat.loveAnalysis.title', 'Tương Hợp Tình Duyên')}</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-pink-400 via-red-400 to-pink-500 bg-clip-text text-transparent tracking-tighter animate-pulse">
            {safePercent}%
          </h2>

          {label && (
            <div className="flex flex-col items-center">
              <div className="h-1 w-20 bg-pink-500/30 mb-3 rounded-full"></div>
              <p className="text-gray-400 text-lg font-medium italic tracking-wide">
                "{label}"
              </p>
            </div>
          )}
        </div>

        {/* 🌌 2 CHART GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto">

          {/* PERSON 1 */}
          <div className="group relative bg-[#0d0d16]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl transition duration-500 hover:shadow-pink-500/5">
            {isValidSVG(chart1) && (
              <button
                onClick={() => downloadChart(chart1, `chart-${name1}`)}
                className="absolute top-6 right-6 z-20 p-2.5 bg-pink-500/20 hover:bg-pink-500/40 border border-pink-400/30 rounded-xl text-pink-300 transition-all hover:scale-105"
              >
                <Download className="w-5 h-5" />
              </button>
            )}

            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-pink-400/70 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
              {t('chat.loveAnalysis.birthChartOf', 'Bản đồ sao')}: {name1}
            </h3>

            {isValidSVG(chart1) ? (
              <div
                className="astrology-chart-svg w-full flex justify-center transition duration-500 group-hover:scale-[1.02]"
                dangerouslySetInnerHTML={{ __html: chart1 }}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 italic">{t('chat.loveAnalysis.noChartData', 'Không có dữ liệu biểu đồ')}</div>
            )}
          </div>

          {/* PERSON 2 */}
          <div className="group relative bg-[#0d0d16]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl transition duration-500 hover:shadow-red-500/5">
            {isValidSVG(chart2) && (
              <button
                onClick={() => downloadChart(chart2, `chart-${name2}`)}
                className="absolute top-6 right-6 z-20 p-2.5 bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 rounded-xl text-red-300 transition-all hover:scale-105"
              >
                <Download className="w-5 h-5" />
              </button>
            )}

            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-red-400/70 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              {t('chat.loveAnalysis.birthChartOf', 'Bản đồ sao')}: {name2}
            </h3>

            {isValidSVG(chart2) ? (
              <div
                className="astrology-chart-svg w-full flex justify-center transition duration-500 group-hover:scale-[1.02]"
                dangerouslySetInnerHTML={{ __html: chart2 }}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 italic">{t('chat.loveAnalysis.noChartData', 'Không có dữ liệu biểu đồ')}</div>
            )}
          </div>

        </div>

        {/* 📊 COMPATIBILITY BAR */}
        <div className="w-full max-w-4xl px-4">
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden backdrop-blur-md border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-pink-600 via-red-500 to-pink-600 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(236,72,153,0.5)]"
              style={{ width: `${safePercent}%` }}
            />
          </div>
        </div>

        {/* 📜 AI ANALYSIS (SYNCED WITH ASTROLOGY STYLE) */}
        {interpretation && (
          <div className="w-full max-w-5xl mx-auto p-8 md:p-12 rounded-[2.5rem] border border-white/5 bg-[#050508]/60 backdrop-blur-xl transition-all duration-1000 shadow-2xl shadow-pink-900/10">

            <div className="flex items-center gap-4 mb-10">
               <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Star className="w-5 h-5 text-white fill-white" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white tracking-tight uppercase">{t('chat.loveAnalysis.detailedAnalysis', 'Phân tích chi tiết')}</h3>
                  <div className="h-1 w-12 bg-pink-500 mt-1 rounded-full opacity-50"></div>
               </div>
            </div>

            <div className="pro-text text-gray-200/90 font-light tracking-wide leading-relaxed space-y-6 mb-8">
              {formatText(
                (interpretation || "")
                  .replace(/```json/g, "")
                  .replace(/```/g, "")
                  .replace(/\*\*\*/g, "")
              )}
            </div>

            {/* TÀI LIỆU THAM KHẢO (RAG) */}
            {sources && sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-3.5 bg-pink-500 rounded-full"></div>
                  <h4 className="text-[11px] font-bold text-pink-400 uppercase tracking-widest">
                    {t('chat.message.ragReferences', 'Tài liệu tham khảo (RAG)')}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sources.map((source: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSource(source)}
                      className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/30 rounded-xl transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20 group-hover:bg-pink-500/20 transition-colors shrink-0">
                        <BookOpen className="w-4 h-4 text-pink-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-200 truncate group-hover:text-pink-300 transition-colors">
                          {source.section_name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Rank #{source.rank_position} • {(source.final_score * 100).toFixed(1)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 🛡️ FOOTER (SYNCED WITH ASTROLOGY) */}
            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-white/30 uppercase tracking-[0.2em] font-medium">
                <Orbit className="w-3 h-3" />
                {t('chat.loveAnalysis.basisInfo', 'Phân tích dựa trên vị trí tương đối giữa hai bản đồ sao')}
              </div>
              <div className="text-[11px] text-white/20 italic">
                {t('chat.lastUpdated', 'Cập nhật lần cuối')}: {currentLang === 'en' ? new Date().toLocaleDateString('en-US') : new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        )}

      </div>

      {selectedSource && (
        <SourceDetailModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
          t={t}
        />
      )}
    </div>
  )
}

export default LoveAnalysisResult