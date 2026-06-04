import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Orbit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatText } from '../../utils/formatText'

interface Props {
  content: string
  isDone?: boolean
  onComplete?: () => void
}

// Tốc độ typewriter: 1 char / 55ms ≈ 18 chars/s — cực chậm, mượt nhất
const TICK_MS = 55

const StreamingBotMessage: React.FC<Props> = ({ content, isDone = false, onComplete }) => {
  const { t } = useTranslation();
  const [displayText, setDisplayText] = useState('')
  const queueRef      = useRef('')
  const displayRef    = useRef('')
  const isDoneRef     = useRef(isDone)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => { isDoneRef.current = isDone },       [isDone])
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  // Enqueue phần mới
  useEffect(() => {
    const already = displayRef.current.length + queueRef.current.length
    const diff = content.slice(already)
    if (diff) queueRef.current += diff
  }, [content])

  // Typewriter loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (queueRef.current.length > 0) {
        const n = isDoneRef.current ? 8 : 1  // flush nhanh khi xong
        const toAdd = queueRef.current.slice(0, n)
        queueRef.current = queueRef.current.slice(n)
        displayRef.current += toAdd
        setDisplayText(displayRef.current)
      } else if (isDoneRef.current) {
        clearInterval(timer)
        onCompleteRef.current?.()
      }
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const rendered = useMemo(() => formatText(displayText), [displayText])
  const showSpinner = displayText.length === 0 && content.length === 0

  if (showSpinner) {
    return (
      <div className="flex flex-col items-center py-10 animate-pulse">
        <div className="w-16 h-16 border border-purple-500/30 rounded-full flex items-center justify-center bg-purple-950/20 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.1)]">
          <Orbit className="animate-spin text-purple-400 w-8 h-8" />
        </div>
        <span className="text-xs text-purple-300/60 mt-4 tracking-wider uppercase font-medium">{t('chat.message.connectingUniverse', 'Đang kết nối vũ trụ...')}</span>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto py-8 px-4">
      <div className="w-full max-w-4xl mx-auto p-8 md:p-12
                      bg-gradient-to-br from-[#1a1a2e]/80 via-[#16213e]/80 to-[#0f3460]/80
                      border border-white/10 rounded-[2rem]
                      shadow-[0_0_80px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.02)]
                      backdrop-blur-2xl relative overflow-hidden">

        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="flex items-center gap-3 mb-8 opacity-60">
          <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-purple-400" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-black text-purple-300">{t('chat.universeMessage', 'Lời nhắn từ Vũ trụ')}</span>
          <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-purple-400" />
        </div>

        <div className="relative z-10">
          {rendered}
          {!isDone && <span className="stream-cursor" aria-hidden="true" />}
        </div>
      </div>

      <style>{`
        .stream-cursor {
          display: inline-block; width: 2px; height: 1.1em;
          background: #c084fc; margin-left: 2px;
          vertical-align: text-bottom; border-radius: 1px;
          animation: blink 0.6s step-start infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}

export default StreamingBotMessage
