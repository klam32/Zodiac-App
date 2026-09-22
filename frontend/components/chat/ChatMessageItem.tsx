import React from 'react';
import { ChatMessage } from '../../types';
import { User, Sparkles, BookOpen, ChevronDown, Orbit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AstrologyInterpretationResult from './AstrologyInterpretationResult';
import LoveAnalysisResult from './LoveAnalysisResult';
import { api } from '../../api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const RagSourceItem = ({ source, idx }: { source: any; idx: number }) => {
  const { t } = useTranslation();
  const [formattedContent, setFormattedContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

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
    <details className="group bg-[#0a0a12]/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors select-none">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-3 py-1 rounded-lg border border-white/10 shadow-lg flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-200" />
            <span className="text-xs font-bold text-white tracking-wide">Rank #{source.rank_position}</span>
          </div>
          <span className="text-sm font-semibold text-gray-200 group-open:text-purple-300 transition-colors">
            {source.section_name}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end" title={`Semantic: ${source.semantic_score?.toFixed(4)}\nRerank: ${source.rerank_score?.toFixed(4)}`}>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">{t('chat.message.relevance', 'Độ liên quan')}</span>
            <span className="text-xs font-mono text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
              {(source.final_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors border border-transparent group-hover:border-purple-500/30">
            <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform duration-300 group-open:text-purple-300" />
          </div>
        </div>
      </summary>
      <div className="p-5 pt-2 text-sm text-gray-300/90 leading-relaxed border-t border-white/5 bg-black/20">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('chat.message.excerpt', 'Đoạn trích')}</span>
          {!formattedContent && (
            <button
              onClick={handleFormat}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 text-xs font-bold hover:from-amber-500/30 hover:to-orange-500/30 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              {isLoading ? t('chat.message.processing', 'Đang xử lý...') : t('chat.message.aiRewrite', '✨ Sửa chữ bằng AI')}
            </button>
          )}
        </div>
        <div className="pl-4 border-l-2 border-purple-500/30">
          {formattedContent ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{formattedContent}</ReactMarkdown>
            </div>
          ) : (
            source.content
          )}
        </div>
      </div>
    </details>
  );
};

interface ChatMessageItemProps {
  msg: ChatMessage;
  userAvatar?: string;
  botAvatar?: string;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ msg, userAvatar, botAvatar }) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = React.useState(false);
  const avatar = msg.role === 'user' ? userAvatar : botAvatar;
  const username = msg.role === 'user' ? t('chat.message.userRole', 'Gia chủ') : t('chat.message.botRole', 'Bậc thầy Chiêm tinh');

  const isLove = !!(msg as any).partner_chart_svg;

  if (isLove) {
    return (
      <LoveAnalysisResult
        chart1={(msg as any).chart_svg}
        chart2={(msg as any).partner_chart_svg}
        label={(msg as any).label}
        interpretation={
          (msg as any).analysis ||
          (msg as any).chart ||
          (msg as any).answer ||
          ""
        }
        percent={Number((msg as any).compatibility || 0)}
        sources={msg.sources}
      />
    );
  }

  // 🔮 ASTROLOGY
  if (msg.role === 'assistant') {
    const isFollowUp = !!(msg as any).isFollowUp || (!(msg as any).chart && !(msg as any).analysis && !(msg as any).sections);
    const hasContent = !!(msg.answer || msg.content || (msg as any).analysis);

    if (isFollowUp && !hasContent) {
      return (
        <div className="flex flex-col items-center py-12 animate-pulse w-full max-w-4xl mx-auto">
          <div className="w-16 h-16 border border-purple-500/30 rounded-full flex items-center justify-center bg-purple-950/20 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <Orbit className="animate-spin text-purple-400 w-8 h-8" />
          </div>
          <span className="text-xs text-purple-300/60 mt-4 tracking-wider uppercase font-medium">{t('chat.message.connectingUniverse', 'Đang kết nối vũ trụ...')}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <AstrologyInterpretationResult 
          id={msg.id}
          isStreaming={msg.isStreaming}
          content={(msg as any).analysis || (msg as any).chart || msg.content}    
          analysis={(msg as any).analysis} 
          answer={(msg as any).answer}
          chartSummary={(msg as any).chart_summary} 
          chart_svg={(msg as any).chart_svg}
          isFollowUp={isFollowUp}
          sources={msg.sources}
        />
      </div>
    );  
  }

  // 👤 USER
  return (
    <div className="flex flex-col items-center gap-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
        {avatar && !imgError ? (
          <img 
            src={avatar} 
            alt={username} 
            className="w-6 h-6 rounded-full border border-purple-500/30 object-cover" 
            onError={() => setImgError(true)}
          />
        ) : (
          <User className="w-4 h-4 text-purple-400" />
        )}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200/50">
          {t('chat.message.requestFrom', 'Yêu cầu từ')} {username}
        </span>
        <div className="w-1 h-1 rounded-full bg-white/20"></div>
        <span className="text-[10px] font-medium text-white/30">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      <div className="max-w-2xl text-center">
        <p className="text-xl font-medium text-purple-100/80 italic leading-relaxed">
          {msg.content || msg.answer}
        </p>
      </div>
    </div>
  );
};

export default React.memo(ChatMessageItem);