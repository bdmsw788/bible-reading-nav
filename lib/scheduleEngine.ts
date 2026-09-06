'use client';

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ReadingEntry, DayGroup, ProgressState, AppState } from '@/types/schedule';

// ─── localStorage Keys ────────────────────────────────────────────────
const STORAGE_KEY_SCHEDULE = 'bible-nav-schedule';
const STORAGE_KEY_COMPLETED = 'bible-nav-completed'; // Set of entry IDs

// ─── Date Utilities ───────────────────────────────────────────────────
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(dateStr: string, year: number): Date | null {
  let cleaned = dateStr.trim();
  if (!cleaned) return null;

  // 1. 曜日 (Thu), (金) などを除去
  cleaned = cleaned.replace(/\([A-Za-z]+\)/g, ''); // (Thu)
  cleaned = cleaned.replace(/（.）/g, ''); // (月)
  cleaned = cleaned.replace(/\([一-龠ぁ-んァ-ヶ]\)/g, ''); // 曜日括弧

  // 2. 日本語日付「2026年1月1日」形式
  const jpMatch = cleaned.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (jpMatch) {
    return new Date(parseInt(jpMatch[1]), parseInt(jpMatch[2]) - 1, parseInt(jpMatch[3]));
  }

  // 3. 「M/D」 または 「M-D」 形式
  const parts = cleaned.split(/[-/]/);
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    if (!isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day);
    }
  }

  // 4. その他の標準的な日付フォーマット
  cleaned = cleaned.replace(/\//g, '-');
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;

  return null;
}

function extractYear(fileName: string): number {
  const match = fileName.match(/\d{4}/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return 2026;
}

// ─── Header Detection ─────────────────────────────────────────────────
const DATE_HEADERS = ['日付', 'date', 'Date', 'DATE', '年月日'];
const BOOK_HEADERS = ['書名', 'book', 'Book', 'BOOK', '書', '聖書箇所'];
const PASSAGE_HEADERS = ['章節', 'passage', 'Passage', 'PASSAGE', '箇所', '章', '範囲'];

// ─── BIBLE BOOK MAP (略称・異表記 -> 新改訳2017正式名称) ──────────────
export const BIBLE_BOOK_MAP: Record<string, string> = {
  // 旧約聖書（律法・歴史）
  '創': '創世記', '創世記': '創世記',
  '出': '出エジプト記', '出エジプト記': '出エジプト記',
  'レ': 'レビ記', 'レビ記': 'レビ記',
  '民': '民数記', '民数記': '民数記',
  '申': '申命記', '申命記': '申命記',
  'ヨシ': 'ヨシュア記', 'ヨシュア記': 'ヨシュア記',
  '士': '士師記', '士師記': '士師記',
  'ルツ': 'ルツ記', 'ルツ記': 'ルツ記',
  'Ⅰサム': 'サムエル記 第一', 'Ⅱサム': 'サムエル記 第二',
  'Iサム': 'サムエル記 第一', 'IIサム': 'サムエル記 第二',
  '1サム': 'サムエル記 第一', '2サム': 'サムエル記 第二',
  'サムエル記 第一': 'サムエル記 第一', 'サムエル記 第二': 'サムエル記 第二',
  'サムエル記第一': 'サムエル記 第一', 'サムエル記第二': 'サムエル記 第二',
  'Ⅰ列': '列王記 第一', 'Ⅱ列': '列王記 第二',
  'I列': '列王記 第一', 'II列': '列王記 第二',
  '1列': '列王記 第一', '2列': '列王記 第二',
  '列王記 第一': '列王記 第一', '列王記 第二': '列王記 第二',
  '列王記第一': '列王記 第一', '列王記第二': '列王記 第二',
  'Ⅰ歴': '歴代誌 第一', 'Ⅱ歴': '歴代誌 第二',
  'I歴': '歴代誌 第一', 'II歴': '歴代誌 第二',
  '1歴': '歴代誌 第一', '2歴': '歴代誌 第二',
  '歴代誌 第一': '歴代誌 第一', '歴代誌 第二': '歴代誌 第二',
  '歴代誌第一': '歴代誌 第一', '歴代誌第二': '歴代誌 第二',
  'エズ': 'エズラ記', 'エズラ記': 'エズラ記',
  'ネヘ': 'ネヘミヤ記', 'ネヘミヤ記': 'ネヘミヤ記',
  'エス': 'エステル記', 'エステル記': 'エステル記',

  // 旧約聖書（詩歌・知恵）
  'ヨブ': 'ヨブ記', 'ヨブ記': 'ヨブ記',
  '詩': '詩篇', '詩篇': '詩篇',
  '箴': '箴言', '箴言': '箴言',
  '伝道者': '伝道者の書', '伝道者の書': '伝道者の書',
  '雅': '雅歌', '雅歌': '雅歌',

  // 旧約聖書（預言書）
  'イザ': 'イザヤ書', 'イザヤ書': 'イザヤ書',
  'エレ': 'エレミヤ書', 'エレミヤ書': 'エレミヤ書',
  '哀': '哀歌', '哀歌': '哀歌',
  'エゼ': 'エゼキエル書', 'エゼキエル書': 'エゼキエル書',
  'ダニ': 'ダニエル書', 'ダニエル書': 'ダニエル書',
  'ホセ': 'ホセア書', 'ホセア書': 'ホセア書',
  'ヨエ': 'ヨエル書', 'ヨエル書': 'ヨエル書',
  'アモ': 'アモス書', 'アモス書': 'アモス書',
  'オバ': 'オバデヤ書', 'オバデヤ書': 'オバデヤ書',
  'ヨナ': 'ヨナ書', 'ヨナ書': 'ヨナ書',
  'ミカ': 'ミカ書', 'ミカ書': 'ミカ書',
  'ナホ': 'ナホム書', 'ナホム書': 'ナホム書',
  'ハバ': 'ハバクク書', 'ハバクク書': 'ハバクク書',
  'ゼパ': 'ゼパニヤ書', 'ゼパニヤ書': 'ゼパニヤ書',
  'ハガ': 'ハガイ書', 'ハガイ書': 'ハガイ書',
  'ゼカ': 'ゼカリヤ書', 'ゼカリヤ書': 'ゼカリヤ書',
  'マラ': 'マラキ書', 'マラキ書': 'マラキ書',

  // 新約聖書
  'マタ': 'マタイの福音書', 'マタイ': 'マタイの福音書', 'マタイの福音書': 'マタイの福音書',
  'マル': 'マルコの福音書', 'マルコ': 'マルコの福音書', 'マルコの福音書': 'マルコの福音書',
  'ルカ': 'ルカの福音書', 'ルカの福音書': 'ルカの福音書',
  'ヨハ': 'ヨハネの福音書', 'ヨハネ': 'ヨハネの福音書', 'ヨハネの福音書': 'ヨハネの福音書',
  '使徒': '使徒の働き', '使徒の働き': '使徒の働き',
  'ロマ': 'ローマ人への手紙', 'ローマ': 'ローマ人への手紙', 'ローマ人への手紙': 'ローマ人への手紙',
  'Ⅰコリ': 'コリント人への手紙 第一', 'Ⅱコリ': 'コリント人への手紙 第二',
  'Iコリ': 'コリント人への手紙 第一', 'IIコリ': 'コリント人への手紙 第二',
  '1コリ': 'コリント人への手紙 第一', '2コリ': 'コリント人への手紙 第二',
  'コリント人への手紙 第一': 'コリント人への手紙 第一', 'コリント人への手紙 第二': 'コリント人への手紙 第二',
  'ガラ': 'ガラテヤ人への手紙', 'ガラテヤ': 'ガラテヤ人への手紙', 'ガラテヤ人への手紙': 'ガラテヤ人への手紙',
  'エペ': 'エペソ人への手紙', 'エペソ': 'エペソ人への手紙', 'エペソ人への手紙': 'エペソ人への手紙',
  'ピリ': 'ピリピ人への手紙', 'ピリピ': 'ピリピ人への手紙', 'ピリピ人への手紙': 'ピリピ人への手紙',
  'コロ': 'コロサイ人への手紙', 'コロサイ': 'コロサイ人への手紙', 'コロサイ人への手紙': 'コロサイ人への手紙',
  'Ⅰテサ': 'テサロニケ人への手紙 第一', 'Ⅱテサ': 'テサロニケ人への手紙 第二',
  'Iテサ': 'テサロニケ人への手紙 第一', 'IIテサ': 'テサロニケ人への手紙 第二',
  '1テサ': 'テサロニケ人への手紙 第一', '2テサ': 'テサロニケ人への手紙 第二',
  'テサロニケ人への手紙 第一': 'テサロニケ人への手紙 第一', 'テサロニケ人への手紙 第二': 'テサロニケ人への手紙 第二',
  'Ⅰテモ': 'テモテへの手紙 第一', 'Ⅱテモ': 'テモテへの手紙 第二',
  'Iテモ': 'テモテへの手紙 第一', 'IIテモ': 'テモテへの手紙 第二',
  '1テモ': 'テモテへの手紙 第一', '2テモ': 'テモテへの手紙 第二',
  'テモテへの手紙 第一': 'テモテへの手紙 第一', 'テモテへの手紙 第二': 'テモテへの手紙 第二',
  'テト': 'テトスへの手紙', 'テトス': 'テトスへの手紙', 'テトスへの手紙': 'テトスへの手紙',
  'フィ': 'フィレモンへの手紙', 'フィレモン': 'フィレモンへの手紙', 'フィレモンへの手紙': 'フィレモンへの手紙',
  'ヘブ': 'ヘブル人への手紙', 'ヘブル': 'ヘブル人への手紙', 'ヘブル人への手紙': 'ヘブル人への手紙',
  'ヤコ': 'ヤコブの手紙', 'ヤコブ': 'ヤコブの手紙', 'ヤコブの手紙': 'ヤコブの手紙',
  'Ⅰペテ': 'ペテロの手紙 第一', 'Ⅱペテ': 'ペテロの手紙 第二',
  'Iペテ': 'ペテロの手紙 第一', 'IIペテ': 'ペテロの手紙 第二',
  '1ペテ': 'ペテロの手紙 第一', '2ペテ': 'ペテロの手紙 第二',
  'ペテロの手紙 第一': 'ペテロの手紙 第一', 'ペテロの手紙 第二': 'ペテロの手紙 第二',
  'Ⅰヨハ': 'ヨハネの手紙 第一', 'Ⅱヨハ': 'ヨハネの手紙 第二', 'Ⅲヨハ': 'ヨハネの手紙 第三',
  'Iヨハ': 'ヨハネの手紙 第一', 'IIヨハ': 'ヨハネの手紙 第二', 'IIIヨハ': 'ヨハネの手紙 第三',
  '1ヨハ': 'ヨハネの手紙 第一', '2ヨハ': 'ヨハネの手紙 第二', '3ヨハ': 'ヨハネの手紙 第三',
  'ヨハネの手紙 第一': 'ヨハネの手紙 第一', 'ヨハネの手紙 第二': 'ヨハネの手紙 第二', 'ヨハネの手紙 第三': 'ヨハネの手紙 第三',
  'ユダ': 'ユダの手紙', 'ユダの手紙': 'ユダの手紙',
  '黙示': 'ヨハネの黙示録', '黙示録': 'ヨハネの黙示録', 'ヨハネの黙示録': 'ヨハネの黙示録',
};

// ─── 正統な聖書66巻のジャンル分類 ──────────────────────────────────────
const POETRY_BOOKS = new Set(['ヨブ記', '詩篇', '箴言', '伝道者の書', '雅歌']);

const PROPHET_BOOKS = new Set([
  'イザヤ書', 'エレミヤ書', '哀歌', 'エゼキエル書', 'ダニエル書',
  'ホセア書', 'ヨエル書', 'アモス書', 'オバデヤ書', 'ヨナ書',
  'ミカ書', 'ナホム書', 'ハバクク書', 'ゼパニヤ書', 'ハガイ書',
  'ゼカリヤ書', 'マラキ書'
]);

const NT_BOOKS = new Set([
  'マタイの福音書', 'マルコの福音書', 'ルカの福音書', 'ヨハネの福音書', '使徒の働き',
  'ローマ人への手紙', 'コリント人への手紙 第一', 'コリント人への手紙 第二',
  'ガラテヤ人への手紙', 'エペソ人への手紙', 'ピリピ人への手紙', 'コロサイ人への手紙',
  'テサロニケ人への手紙 第一', 'テサロニケ人への手紙 第二',
  'テモテへの手紙 第一', 'テモテへの手紙 第二', 'テトスへの手紙', 'フィレモンへの手紙',
  'ヘブル人への手紙', 'ヤコブの手紙', 'ペテロの手紙 第一', 'ペテロの手紙 第二',
  'ヨハネの手紙 第一', 'ヨハネの手紙 第二', 'ヨハネの手紙 第三', 'ユダの手紙', 'ヨハネの黙示録'
]);

export interface CategoryStyle {
  label: string;
  color: string;
  bg: string;
  border: string;
  badge: string;
}

export function getBookCategory(bookName: string): CategoryStyle {
  const normalized = normalizeBookName(bookName);

  if (NT_BOOKS.has(normalized)) {
    return {
      label: '新約聖書',
      color: 'text-emerald-800 dark:text-emerald-300',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      badge: '🌿',
    };
  }

  if (POETRY_BOOKS.has(normalized)) {
    return {
      label: '詩歌・知恵',
      color: 'text-rose-700 dark:text-rose-300',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      badge: '🌹',
    };
  }

  if (PROPHET_BOOKS.has(normalized)) {
    return {
      label: '預言書',
      color: 'text-purple-800 dark:text-purple-300',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      badge: '📜',
    };
  }

  // デフォルトは旧約聖書（律法・歴史）
  return {
    label: '旧約聖書',
    color: 'text-amber-800 dark:text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    badge: '🏛️',
  };
}

export function normalizeBookName(rawBook: string): string {
  const trimmed = rawBook.trim();
  if (BIBLE_BOOK_MAP[trimmed]) {
    return BIBLE_BOOK_MAP[trimmed];
  }

  // プレフィックス正規化（例: 1コリ -> Iコリ / コリント人への手紙 第一）
  const match = trimmed.match(/^([1-3Ⅰ-ⅢI-V\s]*[^\d\s,:-]+)/);
  if (match) {
    const key = match[1].trim();
    if (BIBLE_BOOK_MAP[key]) {
      return BIBLE_BOOK_MAP[key];
    }
  }

  return trimmed;
}

function formatPassage(passageStr: string): string {
  let p = passageStr.trim();
  if (!p) return '';
  if (p.includes('章')) return p;
  
  p = p.replace(/-/g, '〜');
  return p + '章';
}

// ─── File Parsing ─────────────────────────────────────────────────────
export async function parseScheduleFile(file: File): Promise<ReadingEntry[]> {
  const ext = file.name.toLowerCase().split('.').pop();

  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    const text = await file.text();
    return parseScheduleText(text, file.name);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  }

  throw new Error('サポートされていないファイル形式です。CSV または Excel (.xlsx) ファイルをアップロードしてください。');
}

export function parseScheduleText(text: string, fileName: string): ReadingEntry[] {
  const year = extractYear(fileName);
  
  const result = Papa.parse(text, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = result.data as string[][];
  if (rows.length < 2) {
    throw new Error('データが不足しています。');
  }

  const entries = buildEntries(rows, year);
  if (entries.length === 0) {
    throw new Error('有効なスケジュールデータが見つかりませんでした。');
  }

  return entries;
}

async function parseExcel(file: File): Promise<ReadingEntry[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (rows.length < 2) throw new Error('データが不足しています。');

  const year = extractYear(file.name);
  const headers = rows[0].map(String);
  
  let dateCol = -1;
  headers.forEach((h, i) => {
    const trimmed = h.toLowerCase();
    if (dateCol === -1 && DATE_HEADERS.some(dh => trimmed.includes(dh))) dateCol = i;
  });
  if (dateCol === -1) dateCol = 0;

  const converted = rows.map(row => {
    const newRow = [...row].map(val => (val === undefined || val === null) ? '' : String(val));
    const rawDate = row[dateCol];
    if (typeof rawDate === 'number') {
      const ed = XLSX.SSF.parse_date_code(rawDate);
      newRow[dateCol] = `${ed.y}-${String(ed.m).padStart(2, '0')}-${String(ed.d).padStart(2, '0')}`;
    }
    return newRow;
  });

  const entries = buildEntries(converted, year);
  if (entries.length === 0) throw new Error('有効なスケジュールデータが見つかりませんでした。');
  return entries;
}

function buildEntries(rows: string[][], year: number): ReadingEntry[] {
  const headers = rows[0].map(h => (h || '').trim());
  
  let dateCol = -1;
  let bookCol = -1;
  let passageCol = -1;

  headers.forEach((h, i) => {
    const trimmed = h.toLowerCase();
    if (dateCol === -1 && DATE_HEADERS.some(dh => trimmed.includes(dh))) dateCol = i;
    if (bookCol === -1 && BOOK_HEADERS.some(bh => trimmed.includes(bh))) bookCol = i;
    if (passageCol === -1 && PASSAGE_HEADERS.some(ph => trimmed.includes(ph))) passageCol = i;
  });

  if (dateCol === -1) dateCol = 0;

  const isVertical = bookCol !== -1 && passageCol !== -1;
  const dateCounters: Record<string, number> = {};
  const entries: ReadingEntry[] = [];

  if (isVertical) {
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const dateStr = (row[dateCol] || '').trim();
      const book = (row[bookCol] || '').trim();
      const passage = (row[passageCol] || '').trim();

      if (!dateStr || !book) continue;

      const parsedDate = parseDate(dateStr, year);
      if (!parsedDate) continue;

      const isoDate = toISODate(parsedDate);
      const idx = dateCounters[isoDate] ?? 0;
      dateCounters[isoDate] = idx + 1;

      const mappedBook = normalizeBookName(book);
      const formattedPassage = formatPassage(passage);

      entries.push({
        id: `${isoDate}_${idx}`,
        date: isoDate,
        book: mappedBook,
        passage: formattedPassage,
        completed: false,
      });
    }
  } else {
    const readingCols: number[] = [];
    const excludeHeaders = ['日付', 'date', '列', '完了', '曜日', 'day', 'week'];
    
    headers.forEach((h, i) => {
      const trimmed = h.trim();
      if (!trimmed) return;
      const isExcluded = excludeHeaders.some(ex => trimmed.includes(ex));
      if (!isExcluded) {
        readingCols.push(i);
      }
    });

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const dateStr = (row[dateCol] || '').trim();
      if (!dateStr) continue;

      const parsedDate = parseDate(dateStr, year);
      if (!parsedDate) continue;

      const isoDate = toISODate(parsedDate);

      for (const colIdx of readingCols) {
        const cellVal = (row[colIdx] || '').trim();
        if (!cellVal || cellVal === '-' || cellVal === '#VALUE!') continue;

        // プレフィックス（Iコリ, 1コリ, 創, エレ 等）と章節（10, 1-2 等）を確実にパース
        const match = cellVal.match(/^([1-3Ⅰ-ⅢI-V\s]*[^\d\s,:-]+)\s*(.*)$/);
        let bookName = cellVal;
        let passageVal = '';
        if (match) {
          bookName = match[1].trim();
          passageVal = match[2].trim();
        }

        const mappedBook = normalizeBookName(bookName);
        const formattedPassage = formatPassage(passageVal);

        const idx = dateCounters[isoDate] ?? 0;
        dateCounters[isoDate] = idx + 1;

        entries.push({
          id: `${isoDate}_${idx}`,
          date: isoDate,
          book: mappedBook,
          passage: formattedPassage,
          completed: false,
        });
      }
    }
  }

  return entries;
}

// ─── Default Schedule Loader ──────────────────────────────────────────
export async function loadDefaultSchedule(): Promise<ReadingEntry[]> {
  const res = await fetch('/sample-schedule.csv');
  if (!res.ok) throw new Error('デフォルトスケジュールの読み込みに失敗しました。');
  const text = await res.text();
  return parseScheduleText(text, '2026聖書通読表（週5日）.csv');
}

// ─── Storage ──────────────────────────────────────────────────────────
export function saveSchedule(entries: ReadingEntry[]): void {
  localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(entries));
}

export function loadSchedule(): ReadingEntry[] | null {
  const raw = localStorage.getItem(STORAGE_KEY_SCHEDULE);
  if (!raw) return null;
  try {
    const list: ReadingEntry[] = JSON.parse(raw);
    // 自動マイグレーション（古い略称表記が残っていれば正式名称に更新）
    let changed = false;
    const migrated = list.map(entry => {
      const normalized = normalizeBookName(entry.book);
      if (normalized !== entry.book) {
        changed = true;
        return { ...entry, book: normalized };
      }
      return entry;
    });
    if (changed) {
      saveSchedule(migrated);
    }
    return migrated;
  } catch {
    return null;
  }
}

export function clearSchedule(): void {
  localStorage.removeItem(STORAGE_KEY_SCHEDULE);
  localStorage.removeItem(STORAGE_KEY_COMPLETED);
}

function loadCompleted(): Set<string> {
  const raw = localStorage.getItem(STORAGE_KEY_COMPLETED);
  if (!raw) return new Set();
  try { return new Set(JSON.parse(raw)); } catch { return new Set(); }
}

function saveCompleted(ids: Set<string>): void {
  localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify([...ids]));
}

// ─── Entry-level check/uncheck ────────────────────────────────────────
export function toggleCompleted(entryId: string): boolean {
  const ids = loadCompleted();
  let newState: boolean;
  if (ids.has(entryId)) {
    ids.delete(entryId);
    newState = false;
  } else {
    ids.add(entryId);
    newState = true;
  }
  saveCompleted(ids);
  return newState;
}

export function isCompleted(entryId: string): boolean {
  return loadCompleted().has(entryId);
}

// ─── Day Grouping ─────────────────────────────────────────────────────
function groupByDate(schedule: ReadingEntry[]): Map<string, ReadingEntry[]> {
  const map = new Map<string, ReadingEntry[]>();
  for (const entry of schedule) {
    const list = map.get(entry.date) || [];
    list.push(entry);
    map.set(entry.date, list);
  }
  return map;
}

export function getDayGroup(schedule: ReadingEntry[], date: string): DayGroup | null {
  const completed = loadCompleted();
  const dayEntries = schedule.filter(e => e.date === date);
  if (dayEntries.length === 0) return null;

  const withStatus = dayEntries.map(e => ({
    ...e,
    book: normalizeBookName(e.book),
    completed: completed.has(e.id)
  }));
  const completedCount = withStatus.filter(e => e.completed).length;

  return {
    date,
    readings: withStatus,
    allCompleted: completedCount === withStatus.length,
    completedCount,
    totalCount: withStatus.length,
  };
}

// ─── Progress ─────────────────────────────────────────────────────────
export function calculateProgress(schedule: ReadingEntry[]): ProgressState {
  const completed = loadCompleted();
  const grouped = groupByDate(schedule);

  const totalReadings = schedule.length;
  const totalCompletedReadings = schedule.filter(e => completed.has(e.id)).length;

  const totalDays = grouped.size;
  let totalCompletedDays = 0;

  for (const [, entries] of grouped) {
    if (entries.every(e => completed.has(e.id))) {
      totalCompletedDays++;
    }
  }

  const streak = calculateStreak(grouped, completed);

  const completedDates = [...grouped.entries()]
    .filter(([, entries]) => entries.every(e => completed.has(e.id)))
    .map(([date]) => date)
    .sort();
  const lastCompletedDate = completedDates.length > 0 ? completedDates[completedDates.length - 1] : null;

  return {
    streak,
    totalCompletedReadings,
    totalReadings,
    totalCompletedDays,
    totalDays,
    completionRate: totalReadings > 0 ? Math.round((totalCompletedReadings / totalReadings) * 1000) / 10 : 0,
    lastCompletedDate,
  };
}

function calculateStreak(
  grouped: Map<string, ReadingEntry[]>,
  completed: Set<string>
): number {
  const todayStr = toISODate(new Date());
  const sortedDates = [...grouped.keys()].filter(d => d <= todayStr).sort();

  if (sortedDates.length === 0) return 0;

  let streak = 0;

  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const date = sortedDates[i];
    const entries = grouped.get(date)!;
    const dayComplete = entries.every(e => completed.has(e.id));

    if (date === todayStr && !dayComplete) continue;

    if (dayComplete) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ─── App State ────────────────────────────────────────────────────────
export function getAppState(): AppState {
  const schedule = loadSchedule();

  if (!schedule || schedule.length === 0) {
    return {
      today: null,
      progress: { streak: 0, totalCompletedReadings: 0, totalReadings: 0, totalCompletedDays: 0, totalDays: 0, completionRate: 0, lastCompletedDate: null },
      scheduleLoaded: false,
    };
  }

  const todayStr = toISODate(new Date());
  const today = getDayGroup(schedule, todayStr);
  const progress = calculateProgress(schedule);

  return { today, progress, scheduleLoaded: true };
}

// ─── Motivation Messages ──────────────────────────────────────────────
export function getMotivationMessage(progress: ProgressState, todayGroup: DayGroup | null): string {
  if (todayGroup?.allCompleted) {
    if (progress.streak >= 30) return '🏆 30日連続達成！素晴らしい忍耐力です！';
    if (progress.streak >= 14) return '🌟 2週間以上継続中！習慣が根付いています！';
    if (progress.streak >= 7) return '🔥 1週間連続！この調子で続けましょう！';
    if (progress.streak >= 3) return '✨ 3日連続達成！リズムが出てきましたね！';
    return '🎉 今日の通読、お疲れさまでした！';
  }

  if (todayGroup && todayGroup.completedCount > 0) {
    const remaining = todayGroup.totalCount - todayGroup.completedCount;
    return `📖 あと${remaining}箇所で今日のノルマ達成です！`;
  }

  if (progress.completionRate >= 90) return '🏅 ゴールまであと少し！最後まで走り抜きましょう！';
  if (progress.completionRate >= 75) return '💪 3/4を突破！終わりが見えてきました！';
  if (progress.completionRate >= 50) return '⭐ 折り返し地点を通過！後半戦も頑張りましょう！';
  if (progress.completionRate >= 25) return '📚 1/4達成！着実に前進しています！';

  if (progress.streak > 0) return `🔥 ${progress.streak}日連続！今日も一緒に読みましょう！`;
  return '📖 今日の通読を始めましょう！';
}

// ─── Date Formatting ──────────────────────────────────────────────────
export function formatDateJapanese(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[d.getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

export function getTodayISO(): string {
  return toISODate(new Date());
}

// ─── Daily Inspiration ──────────────────────────────────────────────
export interface InspirationalVerse {
  verse: string;
  reference: string;
  theme: string;
}

const INSPIRATIONAL_VERSES: InspirationalVerse[] = [
  {
    verse: 'あなたの御言葉は私の足のともしび、私の道の光です。',
    reference: '詩篇 119篇105節',
    theme: '道しるべ',
  },
  {
    verse: '強くあれ、雄々しくあれ。恐れてはならない。あなたの神、主があなたとともにおられる。',
    reference: 'ヨシュア記 1章9節',
    theme: '勇気と励まし',
  },
  {
    verse: '主を待ち望む者は新しく力を得、鷲のように翼をかって上ることができる。',
    reference: 'イザヤ書 40章31節',
    theme: '新たな力',
  },
  {
    verse: '神のことばは生きていて、力があり、両刃の剣よりも鋭く、たましいと霊を刺し通します。',
    reference: 'ヘブル人への手紙 4章12節',
    theme: 'みことばの力',
  },
  {
    verse: '疲れた者、重荷を背負っている者は、だれでもわたしのもとに来なさい。休ませてあげよう。',
    reference: 'マタイの福音書 11章28節',
    theme: '平安と憩い',
  },
  {
    verse: '人はパンだけで生きるのではなく、神の口から出る一つ一つのことばで生きる。',
    reference: 'マタイの福音書 4章4節',
    theme: '霊のいのち',
  },
  {
    verse: 'いつも喜んでいなさい。絶えず祈りなさい。すべてのことについて感謝しなさい。',
    reference: 'テサロニケ人への手紙 第一 5章16-18節',
    theme: '日々の喜び',
  },
  {
    verse: 'わたしはぶどうの木、あなたがたはその枝です。人がわたしにとどまるなら、多くの実を結びます。',
    reference: 'ヨハネの福音書 15章5節',
    theme: '結びつき',
  },
  {
    verse: '主が私の羊飼い。私には乏しいことがありません。',
    reference: '詩篇 23篇1節',
    theme: '満たしと安心',
  },
  {
    verse: '草は枯れ、花は散る。しかし、私たちの神のことばは永遠に立つ。',
    reference: 'イザヤ書 40章8節',
    theme: '不変のみことば',
  },
];

export function getDailyInspirationalVerse(dateStr?: string): InspirationalVerse {
  const d = dateStr ? new Date(dateStr) : new Date();
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const index = Math.abs(dayOfYear) % INSPIRATIONAL_VERSES.length;
  return INSPIRATIONAL_VERSES[index];
}

// ─── Estimated Read Time ────────────────────────────────────────────
export function getEstimatedMinutes(passageCount: number): number {
  if (passageCount <= 0) return 0;
  return Math.max(3, passageCount * 3);
}

// ─── Weekly Status Helper ───────────────────────────────────────────
export interface WeekDayStatus {
  date: string;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  hasReading: boolean;
  completed: boolean;
}

export function getWeeklyStatus(schedule: ReadingEntry[]): WeekDayStatus[] {
  const today = new Date();
  const todayStr = toISODate(today);
  const currentDayOfWeek = today.getDay();

  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const completed = loadCompleted();
  const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
  const weekDays: WeekDayStatus[] = [];

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(monday);
    curDate.setDate(monday.getDate() + i);
    const dateStr = toISODate(curDate);
    const isWeekend = i >= 5;

    const entries = schedule.filter(e => e.date === dateStr);
    const hasReading = entries.length > 0;
    const isAllDone = hasReading && entries.every(e => completed.has(e.id));

    weekDays.push({
      date: dateStr,
      dayLabel: dayLabels[i],
      dayNumber: curDate.getDate(),
      isToday: dateStr === todayStr,
      isWeekend,
      hasReading,
      completed: isAllDone,
    });
  }

  return weekDays;
}
