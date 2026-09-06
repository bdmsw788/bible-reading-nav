export interface BibleVerse {
    chapter: number;
    verse: number;
    name: string;
    text: string;
}

export interface BibleChapter {
    chapter: number;
    name: string;
    verses: BibleVerse[];
}

export interface BibleBook {
    nr: number;
    name: string;
    chapters: BibleChapter[];
}

export interface BibleData {
    translation: string;
    abbreviation: string;
    lang: string;
    language: string;
    direction: string;
    encoding: string;
    books: BibleBook[];
}
