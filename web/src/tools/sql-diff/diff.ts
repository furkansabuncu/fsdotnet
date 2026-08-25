export type DiffOp = 'equal' | 'insert' | 'delete';

export interface DiffRow {
  op: DiffOp;
  /** Soldaki satır numarası (1 tabanlı); eklenen satırlarda yok. */
  left: number | null;
  right: number | null;
  text: string;
  /**
   * Satır içi vurgu — yalnızca eşleştirilmiş değişiklik çiftlerinde dolu.
   * Parça parça metin: `changed` olanlar renklendirilir.
   */
  parts?: { text: string; changed: boolean }[];
}

/**
 * Diff'in maliyeti O(n×m). SQL betikleri için fazlasıyla yeterli ama
 * kazara devasa bir dosya yapıştırılırsa tarayıcıyı kilitlememek gerekiyor.
 */
export const MAX_LINES = 3000;

/**
 * En uzun ortak alt dizi tablosu.
 *
 * Baştaki ve sondaki ortak satırlar önce kırpılıyor: iki view tanımı
 * genelde yalnızca ortada ayrışır, bu kırpma tabloyu küçültüyor.
 */
function lcsMatrix(a: string[], b: string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from<number>({ length: b.length + 1 }).fill(0),
  );

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      (table[i] as number[])[j] =
        a[i] === b[j]
          ? ((table[i + 1] as number[])[j + 1] as number) + 1
          : Math.max((table[i + 1] as number[])[j] as number, (table[i] as number[])[j + 1] as number);
    }
  }

  return table;
}

function walk(a: string[], b: string[], offsetA: number, offsetB: number): DiffRow[] {
  const table = lcsMatrix(a, b);
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ op: 'equal', left: offsetA + i + 1, right: offsetB + j + 1, text: a[i] as string });
      i += 1;
      j += 1;
    } else if (((table[i + 1] as number[])[j] as number) >= ((table[i] as number[])[j + 1] as number)) {
      rows.push({ op: 'delete', left: offsetA + i + 1, right: null, text: a[i] as string });
      i += 1;
    } else {
      rows.push({ op: 'insert', left: null, right: offsetB + j + 1, text: b[j] as string });
      j += 1;
    }
  }

  while (i < a.length) {
    rows.push({ op: 'delete', left: offsetA + i + 1, right: null, text: a[i] as string });
    i += 1;
  }
  while (j < b.length) {
    rows.push({ op: 'insert', left: null, right: offsetB + j + 1, text: b[j] as string });
    j += 1;
  }

  return rows;
}

/** Satırı kelime ve noktalama parçalarına böler — SQL için yeterli granülarite. */
function tokenize(line: string): string[] {
  return line.match(/\s+|[A-Za-z0-9_$#.]+|[^\sA-Za-z0-9_$#.]/g) ?? [];
}

/** İki satır arasındaki kelime bazlı farkı işaretler. */
export function diffWords(before: string, after: string): {
  left: DiffRow['parts'];
  right: DiffRow['parts'];
} {
  const a = tokenize(before);
  const b = tokenize(after);
  const rows = walk(a, b, 0, 0);

  const left: NonNullable<DiffRow['parts']> = [];
  const right: NonNullable<DiffRow['parts']> = [];

  for (const row of rows) {
    if (row.op === 'equal') {
      left.push({ text: row.text, changed: false });
      right.push({ text: row.text, changed: false });
    } else if (row.op === 'delete') {
      left.push({ text: row.text, changed: true });
    } else {
      right.push({ text: row.text, changed: true });
    }
  }

  return { left, right };
}

export interface DiffSummary {
  rows: DiffRow[];
  added: number;
  removed: number;
  unchanged: number;
  truncated: boolean;
}

/**
 * İki satırın ne kadar örtüştüğü (0–1).
 *
 * Satır içi vurgunun eşik bekçisi: birbiriyle alakasız iki satırı eşleştirip
 * baştan sona renklendirmek, hiç vurgulamamaktan kötüdür.
 */
function similarity(before: string, after: string): number {
  const longest = Math.max(before.length, after.length);
  if (longest === 0) return 1;

  const { left } = diffWords(before, after);
  const shared = (left ?? [])
    .filter((part) => !part.changed)
    .reduce((total, part) => total + part.text.length, 0);

  return shared / longest;
}

/** Bu oranın altında kalan çiftler eşleştirilmez. */
const SIMILARITY_THRESHOLD = 0.4;

/**
 * Satır bazlı diff; ardışık sil/ekle çiftlerine satır içi vurgu ekler.
 */
export function diffLines(before: string, after: string): DiffSummary {
  const a = before.split('\n');
  const b = after.split('\n');

  const truncated = a.length > MAX_LINES || b.length > MAX_LINES;
  const left = truncated ? a.slice(0, MAX_LINES) : a;
  const right = truncated ? b.slice(0, MAX_LINES) : b;

  // Ortak baş ve son kırpılır; LCS tablosu yalnızca ayrışan orta kısım için.
  let head = 0;
  while (head < left.length && head < right.length && left[head] === right[head]) head += 1;

  let tail = 0;
  while (
    tail < left.length - head &&
    tail < right.length - head &&
    left[left.length - 1 - tail] === right[right.length - 1 - tail]
  ) {
    tail += 1;
  }

  const rows: DiffRow[] = [];
  for (let i = 0; i < head; i += 1) {
    rows.push({ op: 'equal', left: i + 1, right: i + 1, text: left[i] as string });
  }

  rows.push(
    ...walk(left.slice(head, left.length - tail), right.slice(head, right.length - tail), head, head),
  );

  for (let i = 0; i < tail; i += 1) {
    const index = left.length - tail + i;
    rows.push({
      op: 'equal',
      left: index + 1,
      right: right.length - tail + i + 1,
      text: left[index] as string,
    });
  }

  annotateInline(rows);

  return {
    rows,
    added: rows.filter((row) => row.op === 'insert').length,
    removed: rows.filter((row) => row.op === 'delete').length,
    unchanged: rows.filter((row) => row.op === 'equal').length,
    truncated,
  };
}

function annotateInline(rows: DiffRow[]): void {
  let i = 0;
  while (i < rows.length) {
    if (rows[i]?.op !== 'delete') {
      i += 1;
      continue;
    }

    let deleteEnd = i;
    while (rows[deleteEnd]?.op === 'delete') deleteEnd += 1;

    let insertEnd = deleteEnd;
    while (rows[insertEnd]?.op === 'insert') insertEnd += 1;

    const deletes = deleteEnd - i;
    const inserts = insertEnd - deleteEnd;

    /*
     * Bloklar eşit uzunlukta olmak ZORUNDA değil — gerçek bir view
     * değişikliğinde tipik olarak 1 satır değişir ve 2 satır eklenir.
     * Sırayla eşleştirip fazlalığı vurgusuz bırakıyoruz; eşleşen çift
     * yeterince benzemiyorsa o çift de vurgusuz kalır.
     */
    for (let k = 0; k < Math.min(deletes, inserts); k += 1) {
      const removed = rows[i + k] as DiffRow;
      const added = rows[deleteEnd + k] as DiffRow;
      if (similarity(removed.text, added.text) < SIMILARITY_THRESHOLD) continue;

      const { left, right } = diffWords(removed.text, added.text);
      removed.parts = left;
      added.parts = right;
    }

    i = insertEnd > i ? insertEnd : i + 1;
  }
}
