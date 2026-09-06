import fs from 'fs';
import path from 'path';
import { BibleData, BibleBook } from '@/types/bible';

// Mapping or function to get Japanese names
export const JAPANESE_BOOK_NAMES: Record<string, string> = {
    Genesis: '創世記',
    Exodus: '出エジプト記',
    Leviticus: 'レビ記',
    Numbers: '民数記',
    Deuteronomy: '申命記',
    Joshua: 'ヨシュア記',
    Judges: '士師記',
    Ruth: 'ルツ記',
    '1 Samuel': 'サムエル記上',
    '2 Samuel': 'サムエル記下',
    '1 Kings': '列王紀上',
    '2 Kings': '列王紀下',
    '1 Chronicles': '歴代誌上',
    '2 Chronicles': '歴代誌下',
    Ezra: 'エズラ記',
    Nehemiah: 'ネヘミヤ記',
    Esther: 'エステル記',
    Job: 'ヨブ記',
    Psalms: '詩篇',
    Proverbs: '箴言',
    Ecclesiastes: 'コヘレトの言葉', // or 伝道の書 (Kougo-yaku usually uses 伝道の書)
    'Song of Solomon': '雅歌',
    Isaiah: 'イザヤ書',
    Jeremiah: 'エレミヤ書',
    Lamentations: '哀歌',
    Ezekiel: 'エゼキエル書',
    Daniel: 'ダニエル書',
    Hosea: 'ホセア書',
    Joel: 'ヨエル書',
    Amos: 'アモス書',
    Obadiah: 'オバデア書',
    Jonah: 'ヨナ書',
    Micah: 'ミカ書',
    Nahum: 'ナホム書',
    Habakkuk: 'ハバクク書',
    Zephaniah: 'ゼパニヤ書',
    Haggai: 'ハガイ書',
    Zechariah: 'ゼカリヤ書',
    Malachi: 'マラキ書',
    Matthew: 'マタイによる福音書',
    Mark: 'マルコによる福音書',
    Luke: 'ルカによる福音書',
    John: 'ヨハネによる福音書',
    Acts: '使徒行伝',
    Romans: 'ローマ人への手紙',
    '1 Corinthians': 'コリント人への手紙第一',
    '2 Corinthians': 'コリント人への手紙第二',
    Galatians: 'ガラテヤ人への手紙',
    Ephesians: 'エペソ人への手紙',
    Philippians: 'ピリピ人への手紙',
    Colossians: 'コロサイ人への手紙',
    '1 Thessalonians': 'テサロニケ人への手紙第一',
    '2 Thessalonians': 'テサロニケ人への手紙第二',
    '1 Timothy': 'テモテへの手紙第一',
    '2 Timothy': 'テモテへの手紙第二',
    Titus: 'テトスへの手紙',
    Philemon: 'ピレモンへの手紙',
    Hebrews: 'ヘブル人への手紙',
    James: 'ヤコブの手紙',
    '1 Peter': 'ペテロの手紙第一',
    '2 Peter': 'ペテロの手紙第二',
    '1 John': 'ヨハネの手紙第一',
    '2 John': 'ヨハネの手紙第二',
    '3 John': 'ヨハネの手紙第三',
    Jude: 'ユダの手紙',
    Revelation: 'ヨハネの黙示録',
};

// Kougo-yaku specific override check
// Ecclesiastes -> 伝道の書 might be safer for Kougo.
JAPANESE_BOOK_NAMES['Ecclesiastes'] = '伝道の書';

let cachedData: BibleData | null = null;

export async function getBibleData(): Promise<BibleData> {
    if (cachedData) return cachedData;

    const filePath = path.join(process.cwd(), 'public', 'bible-data.json');
    const fileContents = await fs.promises.readFile(filePath, 'utf8');
    cachedData = JSON.parse(fileContents);
    return cachedData!;
}

export async function getBook(bookNameOrId: string | number): Promise<BibleBook | undefined> {
    const data = await getBibleData();
    if (typeof bookNameOrId === 'number') {
        return data.books.find((b) => b.nr === bookNameOrId);
    }
    return data.books.find((b) => b.name === bookNameOrId || JAPANESE_BOOK_NAMES[b.name] === bookNameOrId);
}

export interface BookSummary {
    nr: number;
    name: string;
    japaneseName: string;
    chapterCount: number;
}

export async function getAllBooks(): Promise<BookSummary[]> {
    const data = await getBibleData();
    return data.books.map((b) => ({
        nr: b.nr,
        name: b.name,
        japaneseName: JAPANESE_BOOK_NAMES[b.name] || b.name,
        chapterCount: b.chapters.length,
    }));
}
