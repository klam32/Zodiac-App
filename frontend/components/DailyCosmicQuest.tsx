import React, { useMemo, useState } from 'react';
import {
  Award,
  BadgeCheck,
  Box,
  Calendar,
  CheckCircle2,
  CircleDot,
  Coins,
  Gift,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

type QuestId = 'checkin' | 'cosmic-chest';
type QuestAccent = 'purple' | 'fuchsia' | 'blue' | 'amber' | 'emerald';
type QuestStatus = 'idle' | 'in-progress' | 'completed';
type ChestStage = 'closed' | 'opening' | 'opened';

type Quest = {
  id: QuestId;
  title: string;
  description: string;
  actionLabel: string;
  icon: React.ElementType;
  accent: QuestAccent;
};

type MilestoneId = 'checkinRewardUnlocked' | 'chestRewardUnlocked';

type StoredQuestState = {
  version: number;
  date: string;
  completedQuestIds: QuestId[];
  completedCount: number;
  milestones: Record<MilestoneId, boolean>;
  questResults: Partial<Record<QuestId, string>>;
};

type ChestReward = {
  id: string;
  name: string;
  description: string;
  message: string;
  icon: React.ElementType;
  tone: string;
  tokenAmount: number;
};

type QuestModal = { type: 'chest'; stage: ChestStage; reward?: ChestReward };

interface DailyCosmicQuestProps {
  user: User | null;
  onBalanceUpdate: (balance: number) => void;
}

const STORAGE_VERSION = 3;

const QUESTS: Quest[] = [
  {
    id: 'checkin',
    title: 'Điểm danh hôm nay',
    description: 'Mở đầu ngày mới và nhận năng lượng vũ trụ.',
    actionLabel: 'Điểm danh',
    icon: Calendar,
    accent: 'purple',
  },
  {
    id: 'cosmic-chest',
    title: 'Mở rương vũ trụ',
    description: 'Mở rương bí ẩn để nhận phần thưởng ngẫu nhiên.',
    actionLabel: 'Mở rương',
    icon: Box,
    accent: 'emerald',
  },
];

const QUEST_ACCENT_CLASSES: Record<QuestAccent, string> = {
  purple: 'bg-purple-500/10 text-purple-300',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-300',
  blue: 'bg-blue-500/10 text-blue-300',
  amber: 'bg-amber-500/10 text-amber-300',
  emerald: 'bg-emerald-500/10 text-emerald-300',
};

const CHEST_REWARDS: ChestReward[] = [
  {
    id: 'token-1',
    name: '+1 Token',
    description: 'Một đồng năng lượng vũ trụ được cộng vào ví của bạn.',
    message: 'Bạn đã nhận được +1 Token!',
    icon: Coins,
    tone: 'text-amber-200',
    tokenAmount: 1,
  },
  {
    id: 'token-2',
    name: '+2 Tokens',
    description: 'Một luồng tinh quang hiếm đã nhân đôi phần thưởng nhiệm vụ.',
    message: 'Bạn đã nhận được +2 Tokens!',
    icon: Coins,
    tone: 'text-yellow-200',
    tokenAmount: 2,
  },
  {
    id: 'fortune-ticket',
    name: 'Vé quay vận mệnh',
    description: 'Một tấm vé tượng trưng cho may mắn và cơ hội mới.',
    message: 'Bạn đã nhận được Vé quay vận mệnh!',
    icon: RotateCcw,
    tone: 'text-blue-200',
    tokenAmount: 1,
  },
  {
    id: 'lucky-message',
    name: 'Thông điệp may mắn',
    description: 'Một lời nhắn nhỏ từ bầu trời: hãy tin vào nhịp đi của bạn.',
    message: 'Bạn đã nhận được Thông điệp may mắn!',
    icon: Star,
    tone: 'text-purple-200',
    tokenAmount: 1,
  },
  {
    id: 'mystery-gift',
    name: 'Quà bí ẩn',
    description: 'Một món quà huyền bí đang chờ được giải mã trong hành trình tiếp theo.',
    message: 'Bạn đã nhận được Quà bí ẩn!',
    icon: Gift,
    tone: 'text-emerald-200',
    tokenAmount: 1,
  },
  {
    id: 'badge-fragment',
    name: 'Mảnh huy hiệu Cosmic',
    description: 'Một mảnh ánh sáng nhỏ ghép vào huy hiệu vũ trụ của bạn.',
    message: 'Bạn đã nhận được mảnh huy hiệu Cosmic!',
    icon: BadgeCheck,
    tone: 'text-fuchsia-200',
    tokenAmount: 1,
  },
];

const getVietnamDateKey = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';

  return `${year}-${month}-${day}`;
};

const CHEST_SPARKLES = [
  { left: '12%', top: '26%', delay: '0ms' },
  { left: '22%', top: '8%', delay: '180ms' },
  { left: '40%', top: '18%', delay: '320ms' },
  { left: '62%', top: '6%', delay: '120ms' },
  { left: '78%', top: '24%', delay: '260ms' },
  { left: '86%', top: '54%', delay: '420ms' },
  { left: '18%', top: '62%', delay: '520ms' },
  { left: '48%', top: '2%', delay: '640ms' },
];

const pickRandom = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const getQuestById = (questId: QuestId) => QUESTS.find((quest) => quest.id === questId);

const createEmptyState = (date: string): StoredQuestState => ({
  version: STORAGE_VERSION,
  date,
  completedQuestIds: [],
  completedCount: 0,
  milestones: {
    checkinRewardUnlocked: false,
    chestRewardUnlocked: false,
  },
  questResults: {},
});

const loadQuestState = (storageKey: string, today: string): StoredQuestState => {
  if (typeof window === 'undefined') return createEmptyState(today);

  try {
    const rawState = window.localStorage.getItem(storageKey);
    if (!rawState) return createEmptyState(today);

    const parsed = JSON.parse(rawState) as Partial<StoredQuestState>;
    if (parsed.version !== STORAGE_VERSION || parsed.date !== today) {
      return createEmptyState(today);
    }

    const completedQuestIds = Array.isArray(parsed.completedQuestIds)
      ? parsed.completedQuestIds.filter((id): id is QuestId =>
          QUESTS.some((quest) => quest.id === id)
        )
      : [];

    return {
      version: STORAGE_VERSION,
      date: today,
      completedQuestIds,
      completedCount: completedQuestIds.length,
      milestones: {
        checkinRewardUnlocked: completedQuestIds.includes('checkin'),
        chestRewardUnlocked: completedQuestIds.includes('cosmic-chest'),
      },
      questResults: parsed.questResults ?? {},
    };
  } catch {
    return createEmptyState(today);
  }
};

const saveQuestState = (storageKey: string, state: StoredQuestState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
};

const getQuestStatus = (
  questId: QuestId,
  state: StoredQuestState,
  activeQuestId: QuestId | null
): QuestStatus => {
  if (state.completedQuestIds.includes(questId)) return 'completed';
  if (activeQuestId === questId) return 'in-progress';
  return 'idle';
};

const buildNextState = (
  state: StoredQuestState,
  questId: QuestId,
  todayKey: string,
  resultText: string
) => {
  const completedQuestIds = state.completedQuestIds.includes(questId)
    ? state.completedQuestIds
    : [...state.completedQuestIds, questId];
  const completedCount = completedQuestIds.length;

  const milestones = {
    checkinRewardUnlocked: completedQuestIds.includes('checkin'),
    chestRewardUnlocked: completedQuestIds.includes('cosmic-chest'),
  };

  const unlockedMessages: string[] = [];
  if (!state.milestones.chestRewardUnlocked && milestones.chestRewardUnlocked) {
    unlockedMessages.push('Bạn đã mở Rương Vũ Trụ!');
  }

  return {
    nextState: {
      ...state,
      version: STORAGE_VERSION,
      date: todayKey,
      completedQuestIds,
      completedCount,
      milestones,
      questResults: {
        ...state.questResults,
        [questId]: resultText,
      },
    },
    unlockedMessages,
  };
};

interface QuestCardProps {
  quest: Quest;
  status: QuestStatus;
  disabled: boolean;
  onAction: (quest: Quest) => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, status, disabled, onAction }) => {
  const { t } = useTranslation();
  const QuestIcon = quest.icon;
  const completed = status === 'completed';
  const inProgress = status === 'in-progress';

  return (
    <article
      className={`group bg-[#0d0d16]/65 backdrop-blur-xl border rounded-[1.75rem] p-5 min-h-[240px] flex flex-col justify-between transition-all duration-300 ${
        completed
          ? 'border-green-400/30 shadow-[0_0_26px_rgba(34,197,94,0.10)]'
          : 'border-white/10 hover:border-purple-400/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.14)]'
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className={`p-3 rounded-2xl border border-white/10 ${QUEST_ACCENT_CLASSES[quest.accent]}`}>
            <QuestIcon className="w-6 h-6" />
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${
              completed
                ? 'border-green-400/25 bg-green-500/10 text-green-300'
                : inProgress
                  ? 'border-blue-400/25 bg-blue-500/10 text-blue-300'
                  : 'border-white/10 bg-white/5 text-gray-400'
            }`}
          >
            {completed ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : inProgress ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CircleDot className="w-3.5 h-3.5" />
            )}
            {completed ? t('quests.completed', 'Đã hoàn thành') : inProgress ? t('quests.inProgress', 'Đang thực hiện') : t('quests.notStarted', 'Chưa thực hiện')}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-black text-white leading-snug">{t(`quests.${quest.id}.title`, quest.title)}</h3>
          <p className="text-sm text-gray-400 leading-relaxed mt-2">{t(`quests.${quest.id}.description`, quest.description)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAction(quest)}
        disabled={completed || disabled}
        className={`mt-6 w-full min-h-12 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
          completed
            ? 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-purple-500/25'
        }`}
      >
        {inProgress ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('quests.inProgress', 'Đang thực hiện')}
          </>
        ) : completed ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            {t('quests.completed', 'Đã hoàn thành')}
          </>
        ) : (
          t(`quests.${quest.id}.actionLabel`, quest.actionLabel)
        )}
      </button>
    </article>
  );
};

interface CosmicChestVisualProps {
  stage: ChestStage;
  size?: 'card' | 'modal';
}

const CosmicChestVisual: React.FC<CosmicChestVisualProps> = ({ stage, size = 'modal' }) => {
  const opening = stage === 'opening';
  const opened = stage === 'opened';
  const large = size === 'modal';

  return (
    <div className={`relative mx-auto overflow-hidden ${large ? 'h-32 w-44' : 'h-16 w-24'}`}>
      <div
        className={`absolute inset-3 rounded-full bg-purple-500/20 blur-2xl transition-all duration-700 ${
          opening || opened ? 'scale-110 opacity-90' : 'scale-90 opacity-45'
        }`}
      />
      <div
        className={`absolute left-1/2 top-1/2 rounded-full border border-blue-300/15 ${
          large ? 'h-28 w-28 -translate-x-1/2 -translate-y-1/2' : 'h-16 w-16 -translate-x-1/2 -translate-y-1/2'
        } ${opening ? 'animate-spin' : ''}`}
      />
      <div
        className={`absolute left-1/2 top-1/2 rounded-full border border-fuchsia-300/10 ${
          large ? 'h-36 w-36 -translate-x-1/2 -translate-y-1/2' : 'h-20 w-20 -translate-x-1/2 -translate-y-1/2'
        } ${opened ? 'opacity-100' : 'opacity-50'}`}
      />

      {CHEST_SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className={`absolute rounded-full bg-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.95)] transition-all ${
            large ? 'h-1 w-1' : 'h-0.5 w-0.5'
          } ${opening || opened ? 'opacity-100 animate-ping' : 'opacity-40'}`}
          style={{
            left: sparkle.left,
            top: sparkle.top,
            animationDelay: sparkle.delay,
          }}
        />
      ))}

      <div
        className={`absolute left-1/2 transform-gpu -translate-x-1/2 transition-all duration-500 ${
          large ? 'bottom-5 h-14 w-32' : 'bottom-2 h-7 w-[4.5rem]'
        } ${opening ? 'animate-bounce' : ''}`}
      >
        {opened && (
          <div
            className={`absolute left-1/2 bottom-[62%] -translate-x-1/2 rounded-full bg-gradient-to-t from-amber-200/80 via-fuchsia-300/50 to-blue-300/0 blur-lg ${
              large ? 'h-14 w-20' : 'h-8 w-10'
            }`}
          />
        )}

        <div
          className={`absolute left-1/2 z-20 -translate-x-1/2 rounded-t-[1.25rem] border border-amber-200/40 bg-gradient-to-br from-amber-300 via-fuchsia-500 to-purple-800 shadow-[0_0_30px_rgba(217,70,239,0.35)] transition-all duration-700 ${
            large ? 'bottom-[38px] h-8 w-24' : 'bottom-[18px] h-5 w-14'
          } ${
            opened
              ? '-translate-y-6 -rotate-12'
              : opening
                ? '-translate-y-2 rotate-3'
                : ''
          }`}
        >
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-black/20 ${large ? 'h-3 w-6' : 'h-2 w-4'}`} />
        </div>

        <div
          className={`absolute bottom-0 left-1/2 z-10 -translate-x-1/2 rounded-b-[1.5rem] rounded-t-lg border border-amber-200/35 bg-gradient-to-br from-purple-700 via-blue-900 to-[#070711] shadow-[0_0_35px_rgba(59,130,246,0.35)] ${
            large ? 'h-12 w-28' : 'h-7 w-16'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-2 rounded-t-lg bg-gradient-to-r from-amber-300/70 via-fuchsia-300/70 to-blue-300/70" />
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-amber-200/50 bg-gradient-to-b from-amber-200 to-amber-600 shadow-[0_0_14px_rgba(251,191,36,0.55)] ${large ? 'h-5 w-4' : 'h-3 w-2.5'}`} />
        </div>
      </div>
    </div>
  );
};

const CosmicChestCard: React.FC<QuestCardProps> = ({ quest, status, disabled, onAction }) => {
  const { t } = useTranslation();
  const completed = status === 'completed';
  const inProgress = status === 'in-progress';

  return (
    <article
      className={`group relative min-h-[220px] overflow-hidden rounded-[1.9rem] border p-5 backdrop-blur-xl transition-all duration-300 ${
        completed
          ? 'border-green-300/35 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.16)]'
          : 'border-amber-200/25 bg-gradient-to-br from-purple-950/70 via-[#101426]/80 to-blue-950/70 shadow-[0_0_40px_rgba(168,85,247,0.22)] hover:border-amber-200/45 hover:shadow-[0_0_48px_rgba(251,191,36,0.16)]'
      }`}
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">
              <Sparkles className="h-3.5 w-3.5" />
              Mystic Reward
            </div>
            <h3 className="text-xl font-black text-white">{t(`quests.${quest.id}.title`, quest.title)}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-purple-100/70">{t(`quests.${quest.id}.description`, quest.description)}</p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${
              completed
                ? 'border-green-400/25 bg-green-500/10 text-green-300'
                : inProgress
                  ? 'border-blue-400/25 bg-blue-500/10 text-blue-300'
                  : 'border-amber-200/20 bg-white/5 text-amber-100/80'
            }`}
          >
            {completed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : inProgress ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            {completed ? t('quests.completed', 'Đã hoàn thành') : inProgress ? t('quests.inProgress', 'Đang thực hiện') : t('quests.notStarted', 'Chưa thực hiện')}
          </span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-3">
          <div className="text-xs font-bold leading-relaxed text-gray-300">
            {t('quests.chestInfo', 'Rương chỉ mở một lần mỗi ngày. Phần thưởng sẽ hiện sau khi bạn bấm mở.')}
          </div>
          <div className="justify-self-end pr-1">
            <CosmicChestVisual stage={completed ? 'opened' : inProgress ? 'opening' : 'closed'} size="card" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAction(quest)}
          disabled={completed || disabled}
          className={`min-h-12 w-full rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            completed
              ? 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 via-fuchsia-500 to-blue-500 text-white shadow-[0_0_28px_rgba(217,70,239,0.24)] hover:brightness-110'
          }`}
        >
          {inProgress ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('quests.openingChest', 'Đang mở rương')}
            </>
          ) : completed ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {t('quests.completed', 'Đã hoàn thành')}
            </>
          ) : (
            <>
              <Gift className="h-4 w-4" />
              {t('quests.openChest', 'Mở rương')}
            </>
          )}
        </button>
      </div>
    </article>
  );
};

interface RewardMilestoneProps {
  translationKey: string;
  defaultTitle: string;
  unlocked: boolean;
  icon: React.ElementType;
  tone: string;
}

const RewardMilestone: React.FC<RewardMilestoneProps> = ({ translationKey, defaultTitle, unlocked, icon: Icon, tone }) => {
  const { t } = useTranslation();
  return (
    <div
      className={`bg-[#0d0d16]/65 backdrop-blur-xl rounded-[1.5rem] border p-5 transition-all duration-300 ${
        unlocked
          ? 'border-green-400/35 shadow-[0_0_28px_rgba(34,197,94,0.12)]'
          : 'border-white/10 opacity-85'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${unlocked ? tone : 'text-gray-500'}`}>
          {unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white leading-snug">{t(translationKey, defaultTitle)}</p>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-black mt-2 rounded-full border px-2.5 py-1 ${
              unlocked
                ? 'text-green-300 bg-green-500/10 border-green-400/20'
                : 'text-gray-400 bg-white/5 border-white/10'
            }`}
          >
            {unlocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {unlocked ? t('quests.unlocked', 'Đã mở khóa') : t('quests.locked', 'Đang khóa')}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ProgressPanelProps {
  completedCount: number;
  progressPercent: number;
  questState: StoredQuestState;
}

const ProgressPanel: React.FC<ProgressPanelProps> = ({ completedCount, progressPercent, questState }) => {
  const { t } = useTranslation();
  const panelMilestones = [
    { label: t('quests.checkin.label', 'Điểm danh'), value: t('quests.checkin.value', '+1 token'), unlocked: questState.milestones.checkinRewardUnlocked },
    { label: t('quests.chest.label', 'Rương vũ trụ'), value: t('quests.chest.value', 'Quà ngẫu nhiên'), unlocked: questState.milestones.chestRewardUnlocked },
  ];

  return (
    <aside className="lg:sticky lg:top-6 bg-[#0d0d16]/70 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] p-5 md:p-6 shadow-[0_0_38px_rgba(124,58,237,0.14)]">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <p className="text-xs uppercase font-black tracking-[0.18em] text-purple-300">{t('quests.progressTracking', 'Theo dõi tiến độ')}</p>
          <h2 className="text-2xl font-black text-white mt-1">{completedCount}/{QUESTS.length}</h2>
        </div>
        <Trophy className="w-9 h-9 text-amber-300" />
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex justify-between text-xs font-bold text-gray-400">
          <span>{t('quests.progressPercent', '{{percent}}% hoàn thành', { percent: progressPercent })}</span>
          <span>{t('quests.remainingCount', '{{count}} nhiệm vụ còn lại', { count: QUESTS.length - completedCount })}</span>
        </div>
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {panelMilestones.map((milestone) => (
          <div
            key={milestone.label}
            className={`flex items-center justify-between gap-3 rounded-2xl p-3 border ${
              milestone.unlocked
                ? 'bg-green-500/10 border-green-400/20'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div>
              <span className="text-sm font-bold text-gray-200">{milestone.label}</span>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">{milestone.value}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-black ${
                milestone.unlocked ? 'text-green-300' : 'text-gray-500'
              }`}
            >
              {milestone.unlocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {milestone.unlocked ? t('quests.unlocked', 'Đã mở khóa') : t('quests.locked', 'Đang khóa')}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
        {QUESTS.map((quest, index) => {
          const completed = questState.completedQuestIds.includes(quest.id);
          return (
            <div key={quest.id} className="flex items-center gap-3 text-sm">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                  completed
                    ? 'bg-green-500/15 border-green-400/30 text-green-300'
                    : 'bg-white/5 border-white/10 text-gray-500'
                }`}
              >
                {completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
              </div>
              <div className="min-w-0">
                <span className={completed ? 'text-gray-200 font-bold' : 'text-gray-500'}>
                  {t(`quests.${quest.id}.title`, quest.title)}
                </span>
                <p className={`text-[10px] font-black ${completed ? 'text-green-300' : 'text-gray-600'}`}>
                  {completed ? t('quests.completed', 'Đã hoàn thành') : t('quests.notStarted', 'Chưa thực hiện')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

interface RewardRevealProps {
  reward: ChestReward;
}

const RewardReveal: React.FC<RewardRevealProps> = ({ reward }) => {
  const { t } = useTranslation();
  const RewardIcon = reward.icon;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-amber-200/25 bg-gradient-to-br from-amber-300/15 via-fuchsia-500/10 to-blue-500/10 p-5 text-center shadow-[0_0_40px_rgba(251,191,36,0.12)]">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[0_0_30px_rgba(251,191,36,0.18)]">
        <RewardIcon className={`h-8 w-8 ${reward.tone}`} />
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">{t('quests.rewardUnlocked', 'Phần thưởng đã mở khóa')}</p>
      <h4 className="mt-2 text-2xl font-black text-white">{t(`rewards.${reward.id}.name`, reward.name)}</h4>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">{t(`rewards.${reward.id}.description`, reward.description)}</p>
      <div className="mt-5 rounded-2xl border border-amber-200/20 bg-black/25 px-4 py-3 text-sm font-black text-amber-100">
        {t(`rewards.${reward.id}.message`, reward.message)}
      </div>
    </div>
  );
};

interface CosmicChestModalProps {
  modal: Extract<QuestModal, { type: 'chest' }>;
  busy: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const CosmicChestModal: React.FC<CosmicChestModalProps> = ({ modal, busy, onOpen, onClose }) => {
  const { t } = useTranslation();
  const opened = modal.stage === 'opened' && modal.reward;
  const opening = modal.stage === 'opening';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2.25rem] border border-purple-400/30 bg-[#090912]/95 p-5 shadow-[0_0_70px_rgba(124,58,237,0.30)] md:p-6">
        <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -right-24 top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />

        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:text-white disabled:opacity-50"
          aria-label={t('common.close', 'Đóng')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-100">
            <Sparkles className="h-4 w-4" />
            Cosmic Reward
          </div>

          <h3 className="text-2xl font-black text-white md:text-3xl">{t('quests.openCosmicChest', 'Mở Rương Vũ Trụ')}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-purple-100/75">
            {t('quests.chestDesc', 'Một phần thưởng bí ẩn từ vũ trụ đang chờ bạn.')}
          </p>

          <div className="relative mt-1">
            {opening && (
              <div className="absolute inset-x-0 top-4 mx-auto h-32 w-32 rounded-full bg-amber-200/15 blur-2xl" />
            )}
            <CosmicChestVisual stage={modal.stage} size="modal" />
          </div>

          {opening && (
            <div className="mx-auto -mt-1 mb-4 max-w-sm rounded-2xl border border-blue-300/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-100">
              {t('quests.chestOpeningProgress', 'Rương đang rung lên, tinh quang bắt đầu tràn ra...')}
            </div>
          )}

          {opened ? (
            <div className="space-y-5">
              <RewardReveal reward={modal.reward} />
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-fuchsia-500 to-blue-500 px-5 py-4 text-sm font-black text-white shadow-[0_0_30px_rgba(217,70,239,0.22)] transition hover:brightness-110"
              >
                {t('quests.received', 'Đã nhận')}
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-xs font-bold leading-relaxed text-gray-300">
                {t('quests.chestOpenCondition', 'Chỉ mở một lần trong ngày. Nhiệm vụ sẽ hoàn thành sau khi rương hé mở và phần thưởng được ghi nhận.')}
              </div>
              <button
                type="button"
                onClick={onOpen}
                disabled={busy}
                className="min-h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-fuchsia-500 to-blue-500 px-7 text-sm font-black text-white shadow-[0_0_32px_rgba(251,191,36,0.20)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
              >
                {opening ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('quests.opening', 'Đang mở')}
                  </span>
                ) : (
                  t('quests.openNow', 'Mở ngay')
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DailyCosmicQuest: React.FC<DailyCosmicQuestProps> = ({ user, onBalanceUpdate }) => {
  const { t } = useTranslation();
  const [todayKey, setTodayKey] = useState(() => getVietnamDateKey());
  const storageKey = useMemo(
    () => `dailyCosmicQuest:${user?.id ?? 'guest'}`,
    [user?.id]
  );
  const [questState, setQuestState] = useState<StoredQuestState>(() =>
    loadQuestState(storageKey, todayKey)
  );
  const [activeQuestId, setActiveQuestId] = useState<QuestId | null>(null);
  const [questModal, setQuestModal] = useState<QuestModal | null>(null);
  const [completingQuestId, setCompletingQuestId] = useState<QuestId | null>(null);
  const [announcement, setAnnouncement] = useState('');

  React.useEffect(() => {
    const freshState = loadQuestState(storageKey, todayKey);
    setQuestState(freshState);
    saveQuestState(storageKey, freshState);
    setAnnouncement('');
    setActiveQuestId(null);
    setQuestModal(null);
    setCompletingQuestId(null);
  }, [storageKey, todayKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = window.setInterval(() => {
      const currentDateKey = getVietnamDateKey();
      setTodayKey((currentTodayKey) =>
        currentTodayKey === currentDateKey ? currentTodayKey : currentDateKey
      );
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const completedCount = questState.completedCount;
  const progressPercent = Math.round((completedCount / QUESTS.length) * 100);

  const completeQuest = async (questId: QuestId, resultText: string, tokenAmount = 1) => {
    const quest = getQuestById(questId);
    if (!user || !quest) {
      toast.error(t('quests.pleaseLogin', 'Vui lòng đăng nhập để nhận token nhiệm vụ.'));
      return false;
    }

    if (questState.completedQuestIds.includes(questId) || completingQuestId) return false;

    setCompletingQuestId(questId);
    setActiveQuestId(questId);
    try {
      const res = await api.createTokenTransaction(
        tokenAmount,
        t('quests.dailyQuestTitle', 'Nhiệm vụ hằng ngày: {{title}}', { title: t(`quests.${quest.id}.title`, quest.title) }),
        'in'
      );

      const { nextState, unlockedMessages } = buildNextState(
        questState,
        questId,
        todayKey,
        resultText
      );

      setQuestState(nextState);
      saveQuestState(storageKey, nextState);
      onBalanceUpdate(Number(res.new_balance));

      toast.success(t('quests.successToast', '{{title}}: +{{amount}} token', { title: t(`quests.${quest.id}.title`, quest.title), amount: tokenAmount }));
      if (unlockedMessages.length > 0) {
        const latestMessage = unlockedMessages[unlockedMessages.length - 1];
        setAnnouncement(latestMessage);
        unlockedMessages.forEach((message) => toast.success(message));
      }

      return true;
    } catch (err: any) {
      toast.error(err.message || t('quests.failToast', 'Không thể hoàn thành nhiệm vụ lúc này.'));
      return false;
    } finally {
      setCompletingQuestId(null);
      setActiveQuestId(null);
    }
  };

  const handleQuestAction = async (quest: Quest) => {
    if (questState.completedQuestIds.includes(quest.id) || activeQuestId || completingQuestId) return;

    if (quest.id === 'checkin') {
      setActiveQuestId(quest.id);
      await completeQuest(quest.id, t('quests.checkinSuccessText', 'Đã điểm danh và nhận năng lượng vũ trụ.'));
      return;
    }

    if (quest.id === 'cosmic-chest') {
      setActiveQuestId(quest.id);
      setQuestModal({ type: 'chest', stage: 'closed' });
    }
  };

  const handleOpenChest = () => {
    if (
      questState.completedQuestIds.includes('cosmic-chest') ||
      completingQuestId ||
      questModal?.type !== 'chest' ||
      questModal.stage !== 'closed'
    ) {
      return;
    }

    setActiveQuestId('cosmic-chest');
    setQuestModal({ type: 'chest', stage: 'opening' });

    window.setTimeout(async () => {
      const reward = pickRandom(CHEST_REWARDS);
      const completed = await completeQuest('cosmic-chest', t(`rewards.${reward.id}.message`, reward.message), reward.tokenAmount);
      setQuestModal(completed ? { type: 'chest', stage: 'opened', reward } : { type: 'chest', stage: 'closed' });
    }, 1500);
  };

  const handleCloseModal = () => {
    if (completingQuestId || (questModal?.type === 'chest' && questModal.stage === 'opening')) return;
    setQuestModal(null);
    setActiveQuestId(null);
  };

  const modalBusy =
    Boolean(completingQuestId) ||
    (questModal?.type === 'chest' && questModal.stage === 'opening');

  const rewardCards = [
    {
      translationKey: 'quests.milestones.checkin',
      defaultTitle: 'Điểm danh: +1 token',
      icon: Coins,
      unlocked: questState.milestones.checkinRewardUnlocked,
      tone: 'text-amber-300',
    },
    {
      translationKey: 'quests.milestones.chest',
      defaultTitle: 'Rương vũ trụ: Quà ngẫu nhiên',
      icon: Gift,
      unlocked: questState.milestones.chestRewardUnlocked,
      tone: 'text-purple-300',
    },
  ];

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d0d16]/70 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] p-8 text-center shadow-[0_0_40px_rgba(124,58,237,0.18)]">
          <Lock className="w-10 h-10 text-purple-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">{t('quests.loginToReceive', 'Đăng nhập để nhận nhiệm vụ')}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {t('quests.loginDesc', 'Hành trình nhiệm vụ hằng ngày cần tài khoản để cộng token và lưu tiến độ riêng của bạn.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hide p-4 md:p-6 animate-in fade-in duration-700 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-purple-950/70 via-[#101426]/80 to-blue-950/50 backdrop-blur-xl border border-purple-500/20 rounded-[2rem] p-5 md:p-7 shadow-[0_0_45px_rgba(124,58,237,0.16)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-400/20 text-purple-200 shadow-[0_0_24px_rgba(168,85,247,0.18)]">
                <Award className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {t('quests.journeyTitle', 'Hành Trình Vũ Trụ Hôm Nay')}
                </h1>
                <p className="text-sm md:text-base text-purple-100/75 mt-2 leading-relaxed max-w-3xl">
                  {t('quests.journeyDesc', 'Điểm danh và mở rương vũ trụ mỗi ngày để tích lũy token cùng phần thưởng bí ẩn.')}
                </p>
              </div>
            </div>
            <div className="shrink-0 bg-black/25 border border-white/10 rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase font-black tracking-wider text-gray-400">{t('quests.progressToday', 'Tiến độ hôm nay')}</p>
              <p className="text-2xl font-black text-white mt-1">{completedCount}/{QUESTS.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewardCards.map((reward) => (
            <RewardMilestone
              key={reward.translationKey}
              translationKey={reward.translationKey}
              defaultTitle={reward.defaultTitle}
              unlocked={reward.unlocked}
              icon={reward.icon}
              tone={reward.tone}
            />
          ))}
        </div>

        {announcement && (
          <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 text-emerald-100 font-bold shadow-[0_0_26px_rgba(16,185,129,0.12)]">
            {announcement}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.18em] text-purple-300">{t('quests.listTitle', 'Danh sách nhiệm vụ')}</p>
                <h2 className="text-xl font-black text-white mt-1">{t('quests.dailyCount', '2 nhiệm vụ hằng ngày')}</h2>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-400 bg-white/5 border border-white/10 rounded-full px-3 py-2">
                <CircleDot className="w-4 h-4 text-blue-300" />
                {t('quests.dailyReset', 'Reset mỗi ngày mới')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUESTS.map((quest) => {
                const cardProps = {
                  quest,
                  status: getQuestStatus(quest.id, questState, activeQuestId),
                  disabled: Boolean(activeQuestId || completingQuestId),
                  onAction: handleQuestAction,
                };

                return quest.id === 'cosmic-chest' ? (
                  <CosmicChestCard key={quest.id} {...cardProps} />
                ) : (
                  <QuestCard key={quest.id} {...cardProps} />
                );
              })}
            </div>
          </section>

          <ProgressPanel
            completedCount={completedCount}
            progressPercent={progressPercent}
            questState={questState}
          />
        </div>
      </div>

      {questModal?.type === 'chest' && (
        <CosmicChestModal
          modal={questModal}
          busy={modalBusy}
          onOpen={handleOpenChest}
          onClose={handleCloseModal}
        />
      )}

    </div>
  );
};

export default DailyCosmicQuest;
