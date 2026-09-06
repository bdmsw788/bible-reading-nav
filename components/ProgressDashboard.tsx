'use client';

import React from 'react';
import { Flame, TrendingUp, Sparkles, BookOpen, Calendar, ShieldCheck, Sun } from 'lucide-react';
import { ProgressState, ReadingEntry } from '@/types/schedule';
import { getWeeklyStatus, loadSchedule } from '@/lib/scheduleEngine';

interface ProgressDashboardProps {
  progress: ProgressState;
  motivationMessage: string;
}

export function ProgressDashboard({ progress, motivationMessage }: ProgressDashboardProps) {
  const { streak, totalCompletedReadings, totalReadings, totalCompletedDays, totalDays, completionRate } = progress;

  // Compute weekly status
  const schedule = loadSchedule() || [];
  const weekDays = getWeeklyStatus(schedule);

  return (
    <div className="space-y-4">
      {/* ─── Motivation & Gentle Encouragement ──────────────────── */}
      <div className="motivation-card p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden">
        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-relaxed text-foreground">
            {motivationMessage}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            無理せず自分のペースで、みことばの恵みを受け取りましょう 🌱
          </p>
        </div>
      </div>

      {/* ─── Weekly Rhythm Tracker (週5日プラン) ──────────────────── */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold tracking-tight">今週のリズム（週5日プラン）</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
            土日は予備日・お休み
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => (
            <div
              key={d.date}
              className={`week-ring flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                d.isToday
                  ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/20 ring-1 ring-amber-500'
                  : d.completed
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : d.isWeekend
                  ? 'border-border/30 bg-secondary/30 opacity-60'
                  : 'border-border/60 bg-secondary/50'
              }`}
            >
              <span className={`text-[10px] font-semibold ${d.isToday ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {d.dayLabel}
              </span>
              <span className="text-xs font-bold mt-0.5">
                {d.dayNumber}
              </span>
              <div className="mt-1.5">
                {d.completed ? (
                  <span className="text-xs text-emerald-500">✓</span>
                ) : d.isWeekend ? (
                  <span className="text-[10px] text-muted-foreground/60">休</span>
                ) : d.isToday ? (
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 inline-block" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Stats Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Lamp / Streak Card */}
        <div className="lamp-card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[11px] text-amber-500/90 dark:text-amber-400 font-bold mb-1 flex items-center gap-1">
                <span>継続のともしび</span>
              </p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black tabular-nums ${streak > 0 ? 'text-amber-400' : 'text-muted-foreground/50'}`}>
                  {streak}
                </span>
                <span className="text-xs text-muted-foreground font-medium">日連続</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-2xl ${streak > 0 ? 'bg-amber-500/20 shadow-lg shadow-amber-500/20' : 'bg-secondary'}`}>
              <Flame className={`w-6 h-6 ${streak > 0 ? 'text-amber-400 animate-candleFlicker' : 'text-muted-foreground/30'}`} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {streak > 0 ? 'ともしびが温かく輝いています🕯️' : '今日読んで火を灯しましょう🕯️'}
          </p>
        </div>

        {/* Completion Rate */}
        <div className="glass-card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[11px] text-emerald-500/90 dark:text-emerald-400 font-bold mb-1 flex items-center gap-1">
                <span>通読の旅路</span>
              </p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black tabular-nums ${completionRate > 0 ? 'text-emerald-400' : 'text-muted-foreground/50'}`}>
                  {completionRate.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">%</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-2xl ${completionRate > 0 ? 'bg-emerald-500/20' : 'bg-secondary'}`}>
              <TrendingUp className={`w-6 h-6 ${completionRate > 0 ? 'text-emerald-400' : 'text-muted-foreground/30'}`} />
            </div>
          </div>
          <div className="progress-bar-track mt-1">
            <div className="progress-bar-fill" style={{ width: `${Math.min(completionRate, 100)}%` }} />
          </div>
        </div>

        {/* Readings Count */}
        <div className="glass-card p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">読了箇所</p>
            <p className="text-base font-bold tabular-nums">
              <span className="text-blue-400">{totalCompletedReadings}</span>
              <span className="text-muted-foreground/50 text-xs font-normal"> / {totalReadings}</span>
            </p>
          </div>
        </div>

        {/* Days Count */}
        <div className="glass-card p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">完了日数</p>
            <p className="text-base font-bold tabular-nums">
              <span className="text-purple-400">{totalCompletedDays}</span>
              <span className="text-muted-foreground/50 text-xs font-normal"> / {totalDays}日</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─── Milestone Road ────────────────────────────────────────── */}
      <MilestoneBar completionRate={completionRate} />
    </div>
  );
}

// ─── Milestone Progress Bar ───────────────────────────────────────────
function MilestoneBar({ completionRate }: { completionRate: number }) {
  const milestones = [
    { pct: 25, label: 'はじめの一歩', emoji: '🌿' },
    { pct: 50, label: '折り返し', emoji: '⭐' },
    { pct: 75, label: '実りのとき', emoji: '🍎' },
    { pct: 100, label: '完走・栄冠', emoji: '👑' },
  ];

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold">マイルストーン（通読の旅）</span>
        <span className="text-[10px] text-muted-foreground">一歩ずつ前進</span>
      </div>

      <div className="relative">
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-500 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>

        <div className="flex justify-between mt-2.5">
          {milestones.map((m) => {
            const reached = completionRate >= m.pct;
            return (
              <div key={m.pct} className="flex flex-col items-center" style={{ width: '25%' }}>
                <span className={`text-base sm:text-lg transition-all duration-500 ${reached ? 'scale-110' : 'grayscale opacity-30'}`}>
                  {m.emoji}
                </span>
                <span className={`text-[10px] mt-1 font-medium text-center ${reached ? 'text-foreground font-bold' : 'text-muted-foreground/50'}`}>
                  {m.label}
                </span>
                <span className="text-[9px] text-muted-foreground/40 mt-0.5">
                  {m.pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
