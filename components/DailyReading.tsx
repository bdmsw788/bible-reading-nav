'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Check, Sparkles } from 'lucide-react';
import { DayGroup } from '@/types/schedule';
import {
  formatDateJapanese,
  toggleCompleted,
  isCompleted,
} from '@/lib/scheduleEngine';

interface DailyReadingProps {
  dayGroup: DayGroup;
  onStatusChange: () => void;
}

export function DailyReading({ dayGroup, onStatusChange }: DailyReadingProps) {
  const todayFormatted = formatDateJapanese(dayGroup.date);
  const [showCelebration, setShowCelebration] = useState(false);

  // Celebration when all done
  useEffect(() => {
    if (dayGroup.allCompleted && dayGroup.totalCount > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [dayGroup.allCompleted, dayGroup.totalCount]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">今日の通読</h2>
            <p className="text-sm text-muted-foreground">{todayFormatted}</p>
          </div>
        </div>

        {/* Mini progress indicator */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {dayGroup.readings.map((r, i) => (
              <div
                key={r.id}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                  r.completed
                    ? 'bg-emerald-400 scale-110'
                    : 'bg-secondary border border-border'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {dayGroup.completedCount}/{dayGroup.totalCount}
          </span>
        </div>
      </div>

      {/* Celebration banner */}
      {showCelebration && (
        <div className="celebration-banner animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-300">今日の通読コンプリート！</span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
      )}

      {/* Reading cards */}
      <div className="space-y-2">
        {dayGroup.readings.map((reading, index) => (
          <ReadingCard
            key={reading.id}
            id={reading.id}
            book={reading.book}
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

// Category labels for visual distinction
const CATEGORY_STYLES = [
  { label: '旧約', color: 'text-blue-400', bg: 'bg-blue-500/12', border: 'border-blue-500/25' },
  { label: '新約', color: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/25' },
  { label: '預言', color: 'text-purple-400', bg: 'bg-purple-500/12', border: 'border-purple-500/25' },
  { label: '詩歌', color: 'text-rose-400', bg: 'bg-rose-500/12', border: 'border-rose-500/25' },
];

function ReadingCard({ id, book, passage, initialCompleted, index, total, onStatusChange }: ReadingCardProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [animating, setAnimating] = useState(false);

  // Sync with external state changes
  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted]);

  const style = CATEGORY_STYLES[index % CATEGORY_STYLES.length];

  const handleToggle = () => {
    setAnimating(true);
    const newState = toggleCompleted(id);
    setCompleted(newState);

    setTimeout(() => {
      setAnimating(false);
      onStatusChange();
    }, 350);
  };

  return (
    <button
      onClick={handleToggle}
      className={`reading-card-btn w-full text-left ${
        completed ? 'completed' : ''
      } ${animating ? 'animate-checkPulse' : ''}`}
      id={`reading-${id}`}
      aria-label={`${book} ${passage} ${completed ? '読了済み' : '未読'}`}
    >
      {/* Left accent bar */}
      <div className={`reading-card-accent ${completed ? 'done' : ''}`}
           style={{ '--accent-hue': `${index * 120}deg` } as React.CSSProperties}
      />

      {/* Checkbox */}
      <div className={`reading-checkbox ${completed ? 'checked' : ''}`}>
        {completed && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold text-[15px] transition-all duration-300 ${
            completed ? 'text-muted-foreground/50 line-through' : 'text-foreground'
          }`}>
            {book}
          </h3>
          {total > 1 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.bg} ${style.color} ${
              completed ? 'opacity-40' : ''
            }`}>
              {index + 1}/{total}
            </span>
          )}
        </div>
        <p className={`text-sm mt-0.5 transition-all duration-300 ${
          completed ? 'text-muted-foreground/30' : 'text-muted-foreground'
        }`}>
          {passage}
        </p>
      </div>

      {/* Done indicator */}
      {completed && (
        <span className="text-xs text-emerald-500/60 font-medium shrink-0 animate-fadeIn">
          読了 ✓
        </span>
      )}
    </button>
  );
}
