'use client';

import React from 'react';
import { Flame, TrendingUp, Target, Calendar, BookOpen } from 'lucide-react';
import { ProgressState } from '@/types/schedule';

interface ProgressDashboardProps {
  progress: ProgressState;
  motivationMessage: string;
}

export function ProgressDashboard({ progress, motivationMessage }: ProgressDashboardProps) {
  const { streak, totalCompletedReadings, totalReadings, totalCompletedDays, totalDays, completionRate } = progress;

  return (
    <div className="space-y-4">
      {/* Motivation Message */}
      <div className="motivation-card animate-fadeIn">
        <p className="text-sm font-medium text-center leading-relaxed">
          {motivationMessage}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="glass-card stat-card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">連続達成</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black tabular-nums ${streak > 0 ? 'text-amber-400' : 'text-muted-foreground/40'}`}>
                  {streak}
                </span>
                <span className="text-xs text-muted-foreground">日</span>
              </div>
            </div>
            <div className={`p-2 rounded-xl ${streak > 0 ? 'bg-amber-500/15' : 'bg-secondary'}`}>
              <Flame className={`w-5 h-5 ${streak > 0 ? 'text-amber-400 animate-streakPulse' : 'text-muted-foreground/40'}`} />
            </div>
          </div>
          {streak > 0 && (
            <div className="flex gap-[3px] flex-wrap">
              {Array.from({ length: Math.min(streak, 21) }).map((_, i) => (
                <div key={i} className="streak-dot" style={{ animationDelay: `${i * 40}ms` }} />
              ))}
            </div>
          )}
        </div>

        {/* Completion Rate */}
        <div className="glass-card stat-card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">全体達成率</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black tabular-nums ${completionRate > 0 ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
                  {completionRate.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className={`p-2 rounded-xl ${completionRate > 0 ? 'bg-emerald-500/15' : 'bg-secondary'}`}>
              <TrendingUp className={`w-5 h-5 ${completionRate > 0 ? 'text-emerald-400' : 'text-muted-foreground/40'}`} />
            </div>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${Math.min(completionRate, 100)}%` }} />
          </div>
        </div>

        {/* Readings completed */}
        <div className="glass-card stat-card p-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/12">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">読了箇所</p>
              <p className="text-base font-bold tabular-nums">
                <span className="text-blue-400">{totalCompletedReadings}</span>
                <span className="text-muted-foreground/40 text-xs font-normal"> / {totalReadings}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Days completed */}
        <div className="glass-card stat-card p-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/12">
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">完了日数</p>
              <p className="text-base font-bold tabular-nums">
                <span className="text-purple-400">{totalCompletedDays}</span>
                <span className="text-muted-foreground/40 text-xs font-normal"> / {totalDays}日</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      <MilestoneBar completionRate={completionRate} />
    </div>
  );
}

// ─── Milestone Progress Bar ───────────────────────────────────────────
function MilestoneBar({ completionRate }: { completionRate: number }) {
  const milestones = [
    { pct: 25, label: '1/4', emoji: '📚' },
    { pct: 50, label: '半分', emoji: '⭐' },
    { pct: 75, label: '3/4', emoji: '💪' },
    { pct: 100, label: '完走', emoji: '🏆' },
  ];

  return (
    <div className="glass-card p-4">
      <p className="text-[11px] text-muted-foreground font-medium mb-3">マイルストーン</p>
      <div className="relative">
        {/* Track */}
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>

        {/* Milestone markers */}
        <div className="flex justify-between mt-2">
          {milestones.map(m => {
            const reached = completionRate >= m.pct;
            return (
              <div key={m.pct} className="flex flex-col items-center" style={{ width: '25%' }}>
                <span className={`text-sm ${reached ? '' : 'grayscale opacity-30'} transition-all duration-500`}>
                  {m.emoji}
                </span>
                <span className={`text-[10px] mt-0.5 ${reached ? 'text-foreground font-medium' : 'text-muted-foreground/40'}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
