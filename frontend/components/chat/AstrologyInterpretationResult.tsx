import React, { useState } from 'react';
import { formatText } from "../../utils/formatText";
import { Download, Star, Orbit, BookOpen, Sparkles, X } from "lucide-react";
import VoiceOutButton from '../VoiceOutButton';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

interface Props {
  id?: string;
  isStreaming?: boolean;
  content?: string;
  analysis?: string;
  answer?: string;
  chart_svg?: string;
  chartSummary?: any;
  isFollowUp?: boolean;
  sources?: any[];
}

// 🔥 mapping zodiac
const zodiacFullName: Record<string, string> = {
  Ari: "Aries",
  Tau: "Taurus",
  Gem: "Gemini",
  Can: "Cancer",
  Leo: "Leo",
  Vir: "Virgo",
  Lib: "Libra",
  Sco: "Scorpio",
  Sag: "Sagittarius",
  Cap: "Capricorn",
  Aqu: "Aquarius",
  Pis: "Pisces"
};

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

const AstrologyInterpretationResult: React.FC<Props> = ({
  id,
  isStreaming,
  content,
  analysis,
  answer,
  chart_svg,
  chartSummary,
  isFollowUp: isFollowUpProp,
  sources
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';
  const [selectedSource, setSelectedSource] = useState<any | null>(null);

  let safeContent = analysis || content || "";
  let safeAnswer = answer || "";

  // 🔥 FOLLOWUP toggle
  const [showDetail, setShowDetail] = React.useState(false);
  const isFollowUp = isFollowUpProp !== undefined ? isFollowUpProp : !!safeAnswer;

  // 🔥 DOWNLOAD
  const downloadChart = () => {
    if (!chart_svg) return;

    const blob = new Blob([chart_svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "astrology-chart.svg";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-700">

      {/* 🌌 BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10">

        {/* 🔮 CHART */}
        {chart_svg && (
          <div className="w-full max-w-5xl mx-auto group">
            <div className="relative bg-[#0d0d16]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_0_100px_rgba(0,0,0,0.6)] transition duration-500 group-hover:shadow-[0_0_140px_rgba(100,0,255,0.3)]">

              {/* DOWNLOAD */}
              <button
                onClick={downloadChart}
                className="absolute top-5 right-5 z-20 p-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-xl text-blue-300 transition-all hover:scale-105"
              >
                <Download className="w-5 h-5" />
              </button>

              <div 
                className="astrology-chart-svg w-full flex justify-center mt-6 transition duration-500 group-hover:scale-[1.03]"
                dangerouslySetInnerHTML={{ __html: chart_svg }} 
                onClick={(e) => {
                  const target = e.target as SVGElement;
                  if (target.tagName === 'text') {
                    const text = target.textContent?.trim();
                    if (text) {
                      const customEvent = new CustomEvent("ASK_ASTROLOGY_QUESTION", { detail: text });
                      window.dispatchEvent(customEvent);
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* 🔥 CHART SUMMARY */}
        {chartSummary && (
          <div className="w-full max-w-4xl space-y-3">

            {[
              { label: t("chat.sun", "Mặt Trời"), value: chartSummary.sun },
              { label: t("chat.moon", "Mặt Trăng"), value: chartSummary.moon },
              { label: t("chat.ascendant", "Cung Mọc"), value: chartSummary.ascendant }
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center"
              >
                <div className="text-sm text-gray-300">{item.label}</div>
                <div className="text-sm font-semibold text-purple-300">
                  {zodiacFullName[item.value] || item.value}
                </div>
              </div>
            ))}

          </div>
        )}

        {/* 🔵 ANSWER (BỰ NHƯ LOVE) */}
        {safeAnswer && (
          <div className="w-full max-w-4xl mx-auto 
                          p-8 md:p-12 
                          bg-gradient-to-br from-[#1a1a2e]/80 via-[#16213e]/80 to-[#0f3460]/80
                          border border-white/10 
                          rounded-[2rem] 
                          shadow-[0_0_80px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.02)]
                          backdrop-blur-2xl 
                          transition duration-500 hover:shadow-[0_0_100px_rgba(120,0,255,0.1)]
                          relative overflow-hidden group">
            
            <VoiceOutButton
              id={`answer-${id || 'tts'}`}
              text={safeAnswer}
              disabled={isStreaming}
            />
            
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700"></div>

            <div className="flex items-center gap-3 mb-8 opacity-60">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-purple-400"></div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-black text-purple-300">
                {t("chat.universeMessage", "Lời nhắn từ Vũ trụ")}
              </span>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-purple-400"></div>
            </div>

            <div className="relative z-10 text-gray-100 mb-6">
              {formatText(safeAnswer)}
            </div>

            {/* TÀI LIỆU THAM KHẢO (RAG) */}
            {sources && sources.length > 0 && !isStreaming && (
              <div className="relative z-10 mt-8 pt-6 border-t border-white/10 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-3.5 bg-purple-500 rounded-full"></div>
                  <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
                    {t('chat.message.ragReferences', 'Tài liệu tham khảo (RAG)')}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sources.map((source, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSource(source)}
                      className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors shrink-0">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-200 truncate group-hover:text-purple-300 transition-colors">
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
          </div>
        )}

        {!isFollowUp && (
          <div className="w-full max-w-5xl mx-auto p-8 md:p-12 rounded-[2.5rem] border border-white/5 bg-[#050508]/60 backdrop-blur-xl transition-all duration-1000 relative">
            <VoiceOutButton
              id={`analysis-${id || 'tts'}`}
              text={safeContent}
              disabled={isStreaming}
            />

            <div className="flex items-center gap-4 mb-10">
               <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Star className="w-5 h-5 text-white fill-white" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{t("chat.decodeChart", "Giải Mã Bản Đồ Sao")}</h3>
                  <div className="h-1 w-12 bg-purple-500 mt-1 rounded-full opacity-50"></div>
               </div>
            </div>

            <div className="pro-text text-gray-200/90 font-light tracking-wide leading-relaxed mb-8">
              {formatText(
                (safeContent || "")
                  .replace(/```json/g, "")
                  .replace(/```/g, "")
                  .replace(/\*\*\*/g, "")
              )}
            </div>

            {/* TÀI LIỆU THAM KHẢO (RAG) */}
            {sources && sources.length > 0 && !isStreaming && (
              <div className="mt-8 pt-6 border-t border-white/5 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-3.5 bg-purple-500 rounded-full"></div>
                  <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
                    {t('chat.message.ragReferences', 'Tài liệu tham khảo (RAG)')}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sources.map((source, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSource(source)}
                      className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors shrink-0">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-200 truncate group-hover:text-purple-300 transition-colors">
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

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-white/30 uppercase tracking-[0.2em] font-medium">
                <Orbit className="w-3 h-3" />
                {t("chat.planetaryPositionData", "Dữ liệu dựa trên vị trí thực của các hành tinh")}
              </div>
              <div className="text-[11px] text-white/20 italic">
                {t("chat.lastUpdated", "Cập nhật lần cuối")}: {currentLang === 'en' ? new Date().toLocaleDateString('en-US') : new Date().toLocaleDateString('vi-VN')}
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
  );
};

export default AstrologyInterpretationResult;