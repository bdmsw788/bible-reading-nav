'use client';

import React from 'react';
import { BookOpen, Calendar, Flame, Settings } from 'lucide-react';

export type NavTab = 'today' | 'schedule' | 'progress' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  todayBadge?: {
    remaining: number;
    allCompleted: boolean;
  };
}

export function BottomNav({ activeTab, onTabChange, todayBadge }: BottomNavProps) {
  const tabs = [
    {
      id: 'today' as NavTab,
      label: '今日',
      icon: BookOpen,
      badge: todayBadge && !todayBadge.allCompleted && todayBadge.remaining > 0 ? todayBadge.remaining : null,
      badgeDone: todayBadge?.allCompleted,
    },
    {
      id: 'schedule' as NavTab,
      label: '通読表',
      icon: Calendar,
    },
    {
      id: 'progress' as NavTab,
      label: '進捗',
      icon: Flame,
    },
    {
      id: 'settings' as NavTab,
      label: '設定',
      icon: Settings,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-xl border-t border-border shadow-lg"
      aria-label="メインナビゲーション"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-all duration-200 group ${
                isActive ? 'text-amber-500 font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Active Glow Pill */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-amber-500 to-orange-400 rounded-b-full shadow-sm shadow-amber-500/50" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-amber-500' : 'group-hover:scale-105'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Badge for remaining or done */}
                {tab.badge !== null && tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
                {tab.badgeDone && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
                    ✓
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-1 transition-all ${isActive ? 'scale-105' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
