'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, Check, Search, Filter, Sparkles, ArrowDown } from 'lucide-react';
import { ReadingEntry } from '@/types/schedule';
import {
  loadSchedule,
  formatDateJapanese,
  toggleCompleted,
  isCompleted,
  getTodayISO,
} from '@/lib/scheduleEngine';

interface ScheduleListProps {
  onStatusChange: () => void;
}

interface GroupedDay {
  date: string;
  readings: ReadingEntry[];
  allCompleted: boolean;
  completedCount: number;
}

export function ScheduleList({ onStatusChange }: ScheduleListProps) {
  const schedule = loadSchedule() || [];
  const todayISO = getTodayISO();

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const today = new Date();
    return today.getMonth() + 1;
  });
  const [filterMode, setFilterMode] = useState<'all' | 'uncompleted'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayRef = useRef<HTMLDivElement>(null);

  // Group by date
  const groupedDays = useMemo(() => {
    const map = new Map<string, ReadingEntry[]>();
    for (const entry of schedule) {
      const list = map.get(entry.date) || [];
      list.push(entry);
      map.set(entry.date, list);
    }

    const groups: GroupedDay[] = [];
    for (const [date, readings] of map.entries()) {
      const completedCount = readings.filter(r => isCompleted(r.id)).length;
      groups.push({
        date,
        readings,
        completedCount,
        allCompleted: completedCount === readings.length && readings.length > 0,
      });
    }

    return groups.sort((a, b) => a.date.localeCompare(b.date));
  }, [schedule]);

  // Filtered days
  const filteredDays = useMemo(() => {
    return groupedDays.filter(day => {
      // Month filter
      if (selectedMonth !== 0) {
        const d = new Date(day.date + 'T00:00:00');
        if (d.getMonth() + 1 !== selectedMonth) return false;
      }

      // Status filter
      if (filterMode === 'uncompleted' && day.allCompleted) return false;

      // Search filter (book or passage)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = day.readings.some(
          r => r.book.toLowerCase().includes(q) || r.passage.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [groupedDays, selectedMonth, filterMode, searchQuery]);

  const handleToggleEntry = (id: string) => {
    toggleCompleted(id);
    onStatusChange();
  };

  const scrollToToday = () => {
    const todayMonth = new Date().getMonth() + 1;
    setSelectedMonth(todayMonth);
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* ─── Header & Controls ──────────────────────────────────── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold">年間通読スケジュール表</h2>
          </div>
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/25 transition-all"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>今日へ</span>
          </button>
        </div>

        {/* Month Selector Tabs */}
        <div className="overflow-x-auto no-scrollbar -mx-2 px-2 flex gap-1.5 pb-1">
          <button
            onClick={() => setSelectedMonth(0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
              selectedMonth === 0
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            通年
          </button>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedMonth === m
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}月
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex gap-1 rounded-lg bg-secondary/80 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterMode === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              すべて ({groupedDays.length})
            </button>
            <button
              onClick={() => setFilterMode('uncompleted')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterMode === 'uncompleted'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              未完了のみ
            </button>
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              placeholder="書名・章節を検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </div>

      {/* ─── Day Cards List ─────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredDays.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-xs text-muted-foreground">該当するスケジュールが見つかりません。</p>
          </div>
        ) : (
          filteredDays.map(day => {
            const isToday = day.date === todayISO;
            const formatted = formatDateJapanese(day.date);

            return (
              <div
                key={day.date}
                ref={isToday ? todayRef : null}
                className={`glass-card p-4 transition-all ${
                  isToday
                    ? 'border-amber-500/80 bg-amber-500/5 ring-2 ring-amber-500/30'
                    : day.allCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm animate-pulse">
                        TODAY
                      </span>
                    )}
                    <span className={`text-xs font-bold ${isToday ? 'text-amber-500' : 'text-foreground'}`}>
                      {formatted}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {day.allCompleted ? (
                      <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> 完了
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                        {day.completedCount}/{day.readings.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reading Items */}
                <div className="space-y-1.5">
                  {day.readings.map(reading => {
                    const completed = isCompleted(reading.id);

                    return (
                      <div
                        key={reading.id}
                        onClick={() => handleToggleEntry(reading.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          completed
                            ? 'bg-secondary/20 text-muted-foreground/60 line-through'
                            : 'bg-secondary/50 hover:bg-secondary text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                              completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-muted-foreground/40'
                            }`}
                          >
                            {completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bible font-bold truncate">{reading.book}</span>
                          <span className={`text-xs font-bible ${completed ? 'text-muted-foreground/50' : 'text-primary'}`}>
                            {reading.passage}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
