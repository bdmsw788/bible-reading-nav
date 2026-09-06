'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Sun, Moon } from 'lucide-react';
import { ScheduleUploader } from '@/components/ScheduleUploader';
import { DailyReading } from '@/components/DailyReading';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { ScheduleList } from '@/components/ScheduleList';
import { SettingsView } from '@/components/SettingsView';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { AppState } from '@/types/schedule';
import {
  getAppState,
  getMotivationMessage,
} from '@/lib/scheduleEngine';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('today');

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('bible-theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
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

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bible-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bible-theme', 'paper');
    }
  };

  if (!mounted) return <div className="min-h-screen bg-background" />;

  const hasSchedule = appState?.scheduleLoaded;
  const motivation = appState ? getMotivationMessage(appState.progress, appState.today) : '';

  const todayBadge = appState?.today
    ? {
        remaining: appState.today.totalCount - appState.today.completedCount,
        allCompleted: appState.today.allCompleted,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* ─── Top Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <BookOpen className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight">聖書通読ナビ</span>
              <span className="text-[10px] text-muted-foreground ml-1.5 font-medium">新改訳2017</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="テーマ切替"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-amber-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content Body ───────────────────────────────────── */}
      <main className="max-w-lg mx-auto w-full px-4 py-5 pb-28 flex-1">
        {!hasSchedule ? (
          /* ─── Initial Upload Screen ──────────────────────────── */
          <div className="animate-fadeIn">
            <div className="text-center mb-10 pt-6 hero-gradient rounded-2xl py-10">
              <h1 className="text-3xl font-extrabold tracking-tighter mb-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
                  聖書通読ナビ
                </span>
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                毎日の聖書通読を<br />温かくシンプルにトラッキング
              </p>
            </div>
            <ScheduleUploader onScheduleLoaded={refreshState} />
          </div>
        ) : (
          /* ─── Active Tab Content ─────────────────────────────── */
          <div>
            {activeTab === 'today' && (
              <div className="animate-fadeIn space-y-4">
                {appState?.today ? (
                  <DailyReading
                    dayGroup={appState.today}
                    onStatusChange={refreshState}
                  />
                ) : (
                  <div className="sunrise-card p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-1">今日はお休み・安息のひととき 🌱</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                        今日はスケジュールが設定されていません。<br />
                        平日の遅れを取り戻す予備日としても、心静かに祈りと感謝をささげる時間としても活用できます。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="animate-fadeIn">
                <ScheduleList onStatusChange={refreshState} />
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="animate-fadeIn">
                {appState && (
                  <ProgressDashboard
                    progress={appState.progress}
                    motivationMessage={motivation}
                  />
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-fadeIn">
                <SettingsView
                  isDark={isDark}
                  onToggleTheme={toggleTheme}
                  onStateRefresh={refreshState}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Bottom Navigation Bar (Fixed at bottom) ─────────────── */}
      {hasSchedule && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todayBadge={todayBadge}
        />
      )}
    </div>
  );
}
