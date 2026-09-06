'use client';

import React, { useState } from 'react';
import { Moon, Sun, RotateCcw, FileText, CheckCircle2, Shield, Info, ExternalLink } from 'lucide-react';
import { ScheduleUploader } from '@/components/ScheduleUploader';
import { clearSchedule, loadDefaultSchedule, saveSchedule } from '@/lib/scheduleEngine';

interface SettingsViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onStateRefresh: () => void;
}

export function SettingsView({ isDark, onToggleTheme, onStateRefresh }: SettingsViewProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleReloadDefault = async () => {
    try {
      const entries = await loadDefaultSchedule();
      saveSchedule(entries);
      setMessage('「2026聖書通読表（週5日）」を正常に再読み込みしました！');
      onStateRefresh();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('読み込みに失敗しました。');
    }
  };

  const handleResetData = () => {
    if (window.confirm('通読記録とスケジュールをすべて初期化しますか？\nこの操作は元に戻せません。')) {
      clearSchedule();
      onStateRefresh();
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* ─── Notification Message ───────────────────────────────── */}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* ─── Appearance ─────────────────────────────────────────── */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">外観設定</h3>
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-secondary">
              {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-bold">テーマ切り替え</p>
              <p className="text-xs text-muted-foreground">{isDark ? 'ダークモード' : 'ライトモード'}適用中</p>
            </div>
          </div>
          <button
            onClick={onToggleTheme}
            className="px-3.5 py-1.5 rounded-xl border border-border bg-secondary hover:bg-accent text-xs font-bold transition-all"
          >
            {isDark ? 'ライトに変更' : 'ダークに変更'}
          </button>
        </div>
      </div>

      {/* ─── Schedule Management ────────────────────────────────── */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">通読表の管理</h3>

        {/* Reload standard CSV */}
        <div className="flex items-center justify-between py-2 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold">標準通読表の同期</p>
              <p className="text-xs text-muted-foreground">「2026聖書通読表（週5日）.csv」を再読込</p>
            </div>
          </div>
          <button
            onClick={handleReloadDefault}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm"
          >
            再読み込み
          </button>
        </div>

        {/* Custom Upload Toggle */}
        <div className="pt-1">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="w-full text-center py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {showUploader ? '▲ ファイルアップロード画面を閉じる' : '▼ 別のCSV / Excelファイルをアップロードする'}
          </button>

          {showUploader && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <ScheduleUploader onScheduleLoaded={onStateRefresh} />
            </div>
          )}
        </div>
      </div>

      {/* ─── Data Reset ─────────────────────────────────────────── */}
      <div className="glass-card p-4 space-y-3 border-destructive/20 bg-destructive/5">
        <h3 className="text-xs font-bold text-destructive uppercase tracking-wider">データの初期化</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-destructive/90 font-medium">チェックした履歴・記録をすべてリセットします</p>
          </div>
          <button
            onClick={handleResetData}
            className="px-3 py-1.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold transition-all shrink-0 ml-3"
          >
            リセット
          </button>
        </div>
      </div>

      {/* ─── About Bible Nav ────────────────────────────────────── */}
      <div className="glass-card p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-amber-500">
          <Info className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider">このアプリについて</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          「聖書通読ナビ」は、新改訳2017に準拠し、毎日の聖書通読を温かく習慣化するためのナビゲーションエンジンです。
        </p>
        <div className="pt-2 text-[11px] text-muted-foreground/60 space-y-1">
          <p>• 週5日読書設計（土日は予備日＆休息）</p>
          <p>• 旧約・詩篇・新約などの個別チェック対応</p>
          <p>• データはお使いのブラウザ（ローカル）に安全に保存されます</p>
        </div>
      </div>
    </div>
  );
}
