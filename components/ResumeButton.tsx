'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function ResumeButton() {
    const [lastReadUrl, setLastReadUrl] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('last-read-url');
        if (stored) {
            setLastReadUrl(stored);
        }
    }, []);

    // Default link
    const href = lastReadUrl || '/read/Genesis/1';
    const label = lastReadUrl ? '続きから読む' : '読み始める (創世記)';

    if (!mounted) {
        // Return a skeleton or just the default stable button to avoid layout shift if possible,
        // but 'lastReadUrl' depends on client source.
        // We render a generic button.
        return (
            <div className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow opacity-50 cursor-not-allowed">
                <BookOpen className="mr-2 h-4 w-4" />
                読み込み中...
            </div>
        );
    }

    return (
        <Link
            href={href}
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
            <BookOpen className="mr-2 h-4 w-4" />
            {label}
        </Link>
    );
}
