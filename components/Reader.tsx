'use client';

import React, { useState, useEffect } from 'react';
import { BibleChapter, BibleVerse } from '@/types/bible';
import { ChevronLeft, ChevronRight, Settings, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ReaderProps {
    bookName: string; // English key e.g. "Genesis"
    japaneseBookName: string; // e.g. "創世記"
    chapter: BibleChapter;
    prevChapterLink?: string;
    nextChapterLink?: string;
}

export function Reader({
    bookName,
    japaneseBookName,
    chapter,
    prevChapterLink,
    nextChapterLink,
}: ReaderProps) {
    const [fontSize, setFontSize] = useState(18);
    const [showSettings, setShowSettings] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Avoid hydration mismatch for local storage preferences
    useEffect(() => {
        const savedSize = localStorage.getItem('bible-font-size');
        if (savedSize) {
            setFontSize(parseInt(savedSize));
        }

        // Theme
        const savedTheme = localStorage.getItem('bible-theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }

        setMounted(true);

        // Save current location
        localStorage.setItem('last-read-url', window.location.pathname);
    }, []);

    const updateFontSize = (size: number) => {
        setFontSize(size);
        localStorage.setItem('bible-font-size', size.toString());
    };

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('bible-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('bible-theme', 'light');
        }
    };

    if (!mounted) {
        return <div className="min-h-screen bg-background"></div>; // Prevent flash
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between px-4 max-w-3xl mx-auto">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                    >
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline-block">聖書通読</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight">
                            {japaneseBookName}&nbsp;{chapter.chapter}
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Settings"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-card border-b p-4 animate-in slide-in-from-top-2">
                    <div className="max-w-3xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-muted-foreground">文字サイズ</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => updateFontSize(Math.max(12, fontSize - 2))}
                                    className="p-2 border rounded hover:bg-accent h-9 w-9 flex items-center justify-center"
                                >
                                    A-
                                </button>
                                <span className="w-8 text-center">{fontSize}</span>
                                <button
                                    onClick={() => updateFontSize(Math.min(32, fontSize + 2))}
                                    className="p-2 border rounded hover:bg-accent h-9 w-9 flex items-center justify-center"
                                >
                                    A+
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                            <span className="text-sm text-muted-foreground">表示モード</span>
                            <button
                                onClick={toggleTheme}
                                className="px-4 py-2 border rounded hover:bg-accent text-sm"
                            >
                                {isDark ? 'ライトモード' : 'ダークモード'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <main className="container max-w-3xl mx-auto px-6 py-8 md:py-12">
                <div
                    className="space-y-6 leading-loose text-foreground/90 font-serif"
                    style={{ fontSize: `${fontSize}px`, lineHeight: '2' }}
                >
                    {chapter.verses.map((verse) => (
                        <div key={verse.verse} className="relative group">
                            <span className="absolute -left-4 top-1 text-xs text-muted-foreground/50 select-none w-4 text-right pr-1 font-sans">
                                {verse.verse}
                            </span>
                            <p className={cn("inline", verse.verse === 1 && "font-bold text-primary")}>
                                {verse.text}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur z-40">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    {prevChapterLink ? (
                        <Link
                            href={prevChapterLink}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            前の章
                        </Link>
                    ) : (
                        <div className="w-24" /> // Spacer
                    )}

                    {nextChapterLink ? (
                        <Link
                            href={nextChapterLink}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                        >
                            次の章
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    ) : (
                        <div className="w-24" /> // Spacer
                    )}
                </div>
            </div>
        </div>
    );
}
