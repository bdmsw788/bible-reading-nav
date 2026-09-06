'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { parseScheduleFile, saveSchedule, loadDefaultSchedule } from '@/lib/scheduleEngine';
import { ReadingEntry } from '@/types/schedule';

interface ScheduleUploaderProps {
  onScheduleLoaded: () => void;
}

export function ScheduleUploader({ onScheduleLoaded }: ScheduleUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number; days: number; range: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadDefault = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      const entries = await loadDefaultSchedule();
      saveSchedule(entries);

      const dates = [...new Set(entries.map(e => e.date))].sort();
      setSuccess({
        count: entries.length,
        days: dates.length,
        range: `${dates[0]} 〜 ${dates[dates.length - 1]}`,
      });

      setTimeout(() => onScheduleLoaded(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'デフォルトデータの読み込みに失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  }, [onScheduleLoaded]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      const entries = await parseScheduleFile(file);
      saveSchedule(entries);

      const dates = [...new Set(entries.map(e => e.date))].sort();
      setSuccess({
        count: entries.length,
        days: dates.length,
        range: `${dates[0]} 〜 ${dates[dates.length - 1]}`,
      });

      setTimeout(() => onScheduleLoaded(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました。');
    } finally {
      setIsProcessing(false);
    }
  }, [onScheduleLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="schedule-uploader-container">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-4">
          <FileSpreadsheet className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">通読スケジュールを登録</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
          CSV または Excel ファイルをアップロードして、<br />
          毎日の聖書通読を始めましょう。
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${success ? 'success' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        id="schedule-upload-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.tsv,.txt"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          className="hidden"
          id="schedule-file-input"
        />

        {isProcessing ? (
          <div className="upload-content">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-sm font-medium mt-4">ファイルを解析中...</p>
          </div>
        ) : success ? (
          <div className="upload-content animate-fadeIn">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-sm font-bold mt-4 text-emerald-400">
              登録完了！
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {success.days}日分 / {success.count}箇所
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{success.range}</p>
          </div>
        ) : (
          <div className="upload-content">
            <Upload className={`w-10 h-10 transition-transform duration-300 ${isDragging ? 'scale-125 text-amber-400' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium mt-4">ファイルをドラッグ＆ドロップ</p>
            <p className="text-xs text-muted-foreground mt-1">または クリックしてファイルを選択</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">.csv</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">.xlsx</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={handleLoadDefault}
          disabled={isProcessing}
          type="button"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>✨ 編集済みの「2026聖書通読表（週5日）.csv」を読み込む</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">エラー</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border/50">
        <p className="text-xs font-medium text-muted-foreground mb-3">📋 期待するファイル形式：</p>
        <p className="text-[11px] text-muted-foreground/60 mb-2">
          1日に複数行（旧約・新約・預言書など）を記載できます。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">日付</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">書名</th>
                <th className="text-left py-2 text-muted-foreground font-medium">章節</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground/80">
              <tr className="border-b border-border/30">
                <td className="py-1.5 pr-4">2026-01-01</td>
                <td className="py-1.5 pr-4">創世記</td>
                <td className="py-1.5">1章〜2章</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-1.5 pr-4">2026-01-01</td>
                <td className="py-1.5 pr-4">マタイの福音書</td>
                <td className="py-1.5">1章</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-1.5 pr-4">2026-01-01</td>
                <td className="py-1.5 pr-4">イザヤ書</td>
                <td className="py-1.5">1章〜2章</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4 text-muted-foreground/40">...</td>
                <td className="py-1.5 pr-4 text-muted-foreground/40">...</td>
                <td className="py-1.5 text-muted-foreground/40">...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
