import { err, ok, type ToolResult } from '../types';

export type QuoteMode = 'auto' | 'always' | 'never';

export interface InListOptions {
  /** `hasta_id IN (…)` — boşsa yalnızca liste üretilir. */
  column: string;
  quote: QuoteMode;
  dedupe: boolean;
  /** Boş satırlar atılsın mı — Excel yapıştırmalarında sonda hep boş satır olur. */
  skipEmpty: boolean;
  /**
   * Oracle'ın sınırı 1000; başka veritabanlarında sınır yok ama büyük
   * listeleri bölmek yine de okunabilirlik sağlıyor.
   */
  chunkSize: number;
}

/** Ayraç ne olursa olsun listeyi böler: satır sonu, virgül, sekme, noktalı virgül. */
export function splitValues(input: string): string[] {
  return input.split(/[\r\n,;\t]+/).map((value) => value.trim());
}

const NUMERIC = /^-?\d+(\.\d+)?$/;

function quoteValue(value: string, mode: QuoteMode): string {
  if (mode === 'never') return value;
  // Baştaki sıfır anlamlıdır: '007' bir kod, sayı değil — tırnaksız
  // bırakılırsa Oracle sıfırları düşürür ve eşleşme kaybolur.
  if (mode === 'auto' && NUMERIC.test(value) && !/^-?0\d/.test(value)) return value;
  // SQL'de tırnak, ikiye katlanarak kaçırılır.
  return `'${value.replace(/'/g, "''")}'`;
}

export interface InListResult {
  sql: string;
  /** Kaç değer kullanıldı (tekilleştirme ve boş atma sonrası). */
  count: number;
  /** Kaç parçaya bölündü; 1'den büyükse ORA-01795 sınırı aşılmış demektir. */
  chunks: number;
  removedDuplicates: number;
}

/**
 * `IN (…)` listesi kurar.
 *
 * Oracle'da bir ifade listesi en fazla **1000** eleman alır; fazlası
 * `ORA-01795: maximum number of expressions in a list is 1000` verir. Bu
 * sınır yalnızca literal listelerde vardır — `IN (SELECT …)` alt sorgusunda
 * yoktur. Sınır aşıldığında liste parçalanıp OR ile birleştiriliyor.
 */
export function buildInList(input: string, options: InListOptions): ToolResult<InListResult> {
  let values = splitValues(input);
  if (options.skipEmpty) values = values.filter((value) => value !== '');

  if (values.length === 0) return err('inListEmpty');

  const before = values.length;
  if (options.dedupe) values = [...new Set(values)];
  const removedDuplicates = before - values.length;

  const quoted = values.map((value) => quoteValue(value, options.quote));

  const size = Math.max(1, options.chunkSize);
  const chunks: string[][] = [];
  for (let i = 0; i < quoted.length; i += size) {
    chunks.push(quoted.slice(i, i + size));
  }

  const column = options.column.trim();
  const lists = chunks.map((chunk) => chunk.join(', '));

  let sql: string;
  if (column === '') {
    // Kolon verilmediyse ham liste; kullanıcı kendi yerine koyar.
    sql = lists.join(',\n');
  } else if (lists.length === 1) {
    sql = `${column} IN (${lists[0] as string})`;
  } else {
    sql = `(${lists.map((list) => `${column} IN (${list})`).join('\n  OR ')})`;
  }

  return ok({ sql, count: quoted.length, chunks: chunks.length, removedDuplicates });
}
