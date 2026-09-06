'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, RotateCcw, Sun, Moon } from 'lucide-react';
import { ScheduleUploader } from '@/components/ScheduleUploader';
import { DailyReading } from '@/components/DailyReading';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { AppState } from '@/types/schedule';
import {
  getAppState,
  clearSchedule,
  getMotivationMessage,
} from '@/lib/scheduleEngine';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('bible-theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('light');
    }

    const state = getAppState();
    if (!state.scheduleLoaded) {
      import('@/lib/scheduleEngine').then(async ({ loadDefaultSchedule, saveSchedule }) => {
        try {
          const defaultEntries = await loadDefaultSchedule();
          saveSchedule(defaultEntries);
          setAppState(getAppState());
        } catch (err) {
          console.error('Failed to load default schedule:', err);
          setAppState(state);
        }
      });
    } else {
      setAppState(state);
    }
  }, []);

  const refreshState = useCallback(() => {
    setAppState(getAppState());
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm('スケジュールデータをすべて削除しますか？\nこの操作は元に戻せません。')) {
      clearSchedule();
      setShowReset(false);
      refreshState();
    }
  }, [refreshState]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('bible-theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('bible-theme', 'light');
    }
  };

  if (!mounted) return <div className="min-h-screen bg-background" />;

  const hasSchedule = appState?.scheduleLoaded;
  const motivation = appState ? getMotivationMessage(appState.progress, appState.today) : '';

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <BookOpen className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-sm font-bold tracking-tight">聖書通読ナビ</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="テーマ切替"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {hasSchedule && (
              <button
                onClick={() => setShowReset(!showReset)}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="リセット"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Reset confirmation */}
      {showReset && (
        <div className="border-b bg-destructive/5 animate-fadeIn">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-destructive">スケジュールをリセットしますか？</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReset(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleReset}
                className="text-xs px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main ────────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {!hasSchedule ? (
          /* ─── Upload Screen ──────────────────────────────────── */
          <div className="animate-fadeIn">
            <div className="text-center mb-10 pt-6 hero-gradient rounded-2xl py-10">
              <h1 className="text-3xl font-extrabold tracking-tighter mb-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
                  聖書通読ナビ
                </span>
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                毎日の聖書通読を<br />シンプルに管理・トラッキング
              </p>
            </div>
            <ScheduleUploader onScheduleLoaded={refreshState} />
          </div>
        ) : (
          /* ─── Dashboard ──────────────────────────────────────── */
          <div className="space-y-6 stagger-children">
            {/* Today's Readings */}
            {appState?.today ? (
              <DailyReading
                dayGroup={appState.today}
                onStatusChange={refreshState}
              />
            ) : (
              <div className="glass-card p-8 text-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-base font-bold mb-1">今日の通読箇所はありません</h3>
                <p className="text-xs text-muted-foreground">スケジュール上、今日は読む箇所が設定されていません。</p>
              </div>
            )}

            {/* Divider */}
            <div className="section-divider" />

            {/* Progress */}
            {appState && (
              <ProgressDashboard
                progress={appState.progress}
                motivationMessage={motivation}
              />
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-[10px] text-muted-foreground/30 py-6 mt-8">
        <p>聖書通読ナビ</p>
      </footer>
    </div>
  );
}
