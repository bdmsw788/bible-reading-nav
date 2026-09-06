import React from 'react';
import { getBook, JAPANESE_BOOK_NAMES } from '@/lib/bible-data';
import { Reader } from '@/components/Reader';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{
        bookId: string;
        chapterId: string;
    }>;
}

export default async function ReadPage({ params }: PageProps) {
    // Decode params
    const { bookId: rawBookId, chapterId: rawChapterId } = await params;
    const bookId = decodeURIComponent(rawBookId);
    const chapterNum = parseInt(rawChapterId, 10);

    const book = await getBook(bookId);

    if (!book) {
        // Try to find by Japanese name if passed
        // But currently we expect English bookId from URL usually.
        // If not found, 404
        return notFound();
    }

    const chapterIndex = chapterNum - 1;
    const chapter = book.chapters[chapterIndex];

    if (!chapter) {
        return notFound();
    }

    // Calculate links
    let prevLink: string | undefined;
    let nextLink: string | undefined;

    // Prev
    if (chapterNum > 1) {
        prevLink = `/read/${encodeURIComponent(book.name)}/${chapterNum - 1}`;
    } else if (book.nr > 1) {
        // Go to last chapter of prev book
        const prevBook = await getBook(book.nr - 1);
        if (prevBook) {
            prevLink = `/read/${encodeURIComponent(prevBook.name)}/${prevBook.chapters.length}`;
        }
    }

    // Next
    if (chapterNum < book.chapters.length) {
        nextLink = `/read/${encodeURIComponent(book.name)}/${chapterNum + 1}`;
    } else {
        // Go to next book
        const nextBook = await getBook(book.nr + 1);
        if (nextBook) {
            nextLink = `/read/${encodeURIComponent(nextBook.name)}/1`;
        }
    }

    const japaneseName = JAPANESE_BOOK_NAMES[book.name] || book.name;

    return (
        <Reader
            bookName={book.name}
            japaneseBookName={japaneseName}
            chapter={chapter}
            prevChapterLink={prevLink}
            nextChapterLink={nextLink}
        />
    );
}
