'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Check, Sparkles, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DayGroup, ReadingEntry } from '@/types/schedule';
import {
  formatDateJapanese,
  toggleCompleted,
  getDailyInspirationalVerse,
  getEstimatedMinutes,
  getBookCategory,
  normalizeBookName,
} from '@/lib/scheduleEngine';
import { Confetti } from '@/components/Confetti';

interface DailyReadingProps {
  dayGroup: DayGroup;
  onStatusChange: () => void;
}

export function DailyReading({ dayGroup, onStatusChange }: DailyReadingProps) {
  const todayFormatted = formatDateJapanese(dayGroup.date);
  const [showCelebration, setShowCelebration] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Inspirational verse of the day
  const inspirationalVerse = getDailyInspirationalVerse(dayGroup.date);
  const estimatedMin = getEstimatedMinutes(dayGroup.totalCount);

  // Remaining readings
  const uncompletedReadings = dayGroup.readings.filter(r => !r.completed);
  const remainingCount = uncompletedReadings.length;

  // Celebration & Confetti when all done
  useEffect(() => {
    if (dayGroup.allCompleted && dayGroup.totalCount > 0) {
      setShowCelebration(true);
      setTriggerConfetti(true);
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [dayGroup.allCompleted, dayGroup.totalCount]);

  const progressPercent = dayGroup.totalCount > 0
    ? Math.round((dayGroup.completedCount / dayGroup.totalCount) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Confetti celebration */}
      <Confetti active={triggerConfetti} onComplete={() => setTriggerConfetti(false)} />

      {/* ─── Sunrise Inspirational Verse Card ───────────────────── */}
      <div className="sunrise-card p-4 sm:p-5 relative animate-fadeIn">
        <div className="sunrise-card-bg" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5 text-amber-800 dark:text-amber-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>今日のみことば</span>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-200 font-medium">
              {inspirationalVerse.theme}
            </span>
          </div>
          <p className="text-base sm:text-lg font-bible font-medium leading-relaxed tracking-wide text-foreground my-2.5">
            「{inspirationalVerse.verse}」
          </p>
          <p className="text-right text-xs font-bible text-muted-foreground font-semibold mt-1">
            — {inspirationalVerse.reference}
          </p>
        </div>
      </div>

      {/* ─── 未読・残りの案内バナー（リマインダー） ─────────────── */}
      {!dayGroup.allCompleted && remainingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-foreground flex items-start gap-3 shadow-sm animate-fadeIn">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <span>まだ今日の通読箇所が残っています</span>
              </h4>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">
                あと {remainingCount} 箇所
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              未読：<span className="font-bible font-bold text-amber-900 dark:text-amber-200">
                {uncompletedReadings.map(r => `${normalizeBookName(r.book)} ${r.passage}`).join('、 ')}
              </span>
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1 font-medium">
              📖 読了したら下のカードをタップしてチェックを付けましょう！
            </p>
          </div>
        </div>
      )}

      {/* ─── 全完了の案内バナー ─────────────────────────────────── */}
      {dayGroup.allCompleted && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>今日の通読箇所はすべて完了しています！素晴らしい継続です✨</span>
        </div>
      )}

      {/* ─── Header & Progress Status ───────────────────────────── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <h2 className="text-lg font-bold tracking-tight">今日の通読箇所</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{todayFormatted}</p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>約{estimatedMin}分で読了</span>
          </div>
        </div>

        {/* Progress Bar with Dots */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              {dayGroup.allCompleted ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 本日のノルマ達成！
                </span>
              ) : (
                <span>
                  あと <strong className="text-amber-600 dark:text-amber-400">{remainingCount}箇所</strong> で達成！
                </span>
              )}
            </span>
            <span className="tabular-nums font-bold text-foreground">
              {dayGroup.completedCount} / {dayGroup.totalCount} 箇所 ({progressPercent}%)
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Celebration Banner */}
      {showCelebration && (
        <div className="celebration-banner animate-fadeIn p-4 border border-amber-500/30 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-emerald-500/20 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-base font-bold text-amber-700 dark:text-amber-300">
              🎉 今日の通読コンプリート！
            </span>
            <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <p className="text-xs text-foreground/80 mt-1">
            神様のみことばを心に蓄えました。素晴らしい1歩です！✨
          </p>
        </div>
      )}

      {/* ─── Reading Cards List ─────────────────────────────────── */}
      <div className="space-y-2.5">
        {dayGroup.readings.map((reading, index) => (
          <ReadingCard
            key={reading.id}
            id={reading.id}
            book={normalizeBookName(reading.book)}
            passage={reading.passage}
            initialCompleted={reading.completed}
            index={index}
            total={dayGroup.totalCount}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Individual Reading Card ──────────────────────────────────────────
interface ReadingCardProps {
  id: string;
  book: string;
  passage: string;
  initialCompleted: boolean;
  index: number;
  total: number;
  onStatusChange: () => void;
}

function ReadingCard({ id, book, passage, initialCompleted, index, total, onStatusChange }: ReadingCardProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted]);

  // 正確な聖書ジャンル分類を取得（旧約・詩歌・預言書・新約）
  const cat = getBookCategory(book);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setAnimating(true);
    const newState = toggleCompleted(id);
    setCompleted(newState);

    setTimeout(() => {
      setAnimating(false);
      onStatusChange();
    }, 300);
  };

  return (
    <div
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(e as unknown as React.MouseEvent); }}
      className={`reading-card-btn group cursor-pointer transition-all duration-300 ${
        completed
          ? 'completed bg-secondary/50 border-border/50 opacity-75'
          : 'bg-card hover:bg-card border-border hover:border-amber-500/50 hover:shadow-md'
      } ${animating ? 'animate-checkPulse' : ''}`}
      id={`reading-${id}`}
      aria-label={`${book} ${passage} ${completed ? '読了済み' : '未読'}`}
    >
      {/* Accent Indicator */}
      <div
        className={`reading-card-accent ${completed ? 'done bg-emerald-500' : 'bg-primary'}`}
      />

      {/* Checkbox with bounce */}
      <div
        className={`reading-checkbox transition-all duration-300 ${
          completed
            ? 'checked bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
            : 'border-muted-foreground/40 group-hover:border-primary group-hover:bg-primary/10'
        }`}
      >
        {completed && <Check className="w-4 h-4 stroke-[3]" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${cat.bg} ${cat.color} ${cat.border} flex items-center gap-1`}>
            <span>{cat.badge}</span>
            <span>{cat.label}</span>
          </span>
          <h3
            className={`font-bible font-bold text-[17px] tracking-wide transition-all duration-300 ${
              completed ? 'text-muted-foreground/50 line-through' : 'text-foreground'
            }`}
          >
            {book}
          </h3>
        </div>

        <p
          className={`font-bible text-sm mt-0.5 font-medium tracking-wide transition-all duration-300 ${
            completed ? 'text-muted-foreground/40' : 'text-primary font-bold'
          }`}
        >
          {passage}
        </p>
      </div>

      {/* Status Badge */}
      <div className="shrink-0">
        {completed ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full animate-fadeIn">
            <Check className="w-3.5 h-3.5" /> 読了
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60 group-hover:text-primary transition-colors font-medium">
            タップで完了
          </span>
        )}
      </div>
    </div>
  );
}
