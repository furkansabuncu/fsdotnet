/**
 * SQL'i bölgelere ayıran tarayıcı.
 *
 * Kuralların neredeyse hepsinin ihtiyacı aynı: "bu karakter GERÇEKTEN kodun
 * içinde mi, yoksa bir string'in, tanımlayıcının ya da yorumun içinde mi?"
 * Bu ayrım olmadan her kural kendi naif regex'ini yazar ve hepsi aynı yerde
 * yanılır — `'-- fiyat'` bir yorum değil, `"a, b"` bir virgül değildir.
 *
 * Bilinen sınır: Oracle'ın `q'[...]'` alternatif tırnak sözdizimi
 * desteklenmiyor, sıradan tırnak gibi okunuyor. Aynı sınır `minifySql`'de de
 * var; oradaki gerekçe burada da geçerli.
 */

export type Region = 'code' | 'string' | 'identifier' | 'comment';

export interface Span {
  kind: Region;
  start: number;
  /** Dışlayıcı. */
  end: number;
}

export interface ScanResult {
  /** Girdiyi boşluksuz kaplar — birleştirildiğinde girdinin kendisi çıkar. */
  spans: Span[];
  /** Kapanmamış ilk tırnak ya da blok yorum; yoksa null. */
  unterminated: { kind: Exclude<Region, 'code'>; start: number } | null;
}

export function scan(sql: string): ScanResult {
  const spans: Span[] = [];
  let unterminated: ScanResult['unterminated'] = null;
  let codeStart = 0;
  let index = 0;

  const closeCode = (end: number) => {
    if (end > codeStart) spans.push({ kind: 'code', start: codeStart, end });
  };

  while (index < sql.length) {
    const char = sql[index];
    const next = sql[index + 1];

    if (char === '-' && next === '-') {
      closeCode(index);
      const newline = sql.indexOf('\n', index);
      const end = newline === -1 ? sql.length : newline;
      spans.push({ kind: 'comment', start: index, end });
      index = end;
      codeStart = index;
      continue;
    }

    if (char === '/' && next === '*') {
      closeCode(index);
      const close = sql.indexOf('*/', index + 2);
      const end = close === -1 ? sql.length : close + 2;
      if (close === -1) unterminated ??= { kind: 'comment', start: index };
      spans.push({ kind: 'comment', start: index, end });
      index = end;
      codeStart = index;
      continue;
    }

    if (char === "'" || char === '"') {
      closeCode(index);
      const kind = char === "'" ? 'string' : 'identifier';
      let cursor = index + 1;
      let closed = false;

      while (cursor < sql.length) {
        if (sql[cursor] !== char) {
          cursor += 1;
          continue;
        }
        // İki tırnak yan yana kaçış demek (`'don''t'`), kapanış değil.
        if (sql[cursor + 1] === char) {
          cursor += 2;
          continue;
        }
        cursor += 1;
        closed = true;
        break;
      }

      if (!closed) unterminated ??= { kind, start: index };
      spans.push({ kind, start: index, end: cursor });
      index = cursor;
      codeStart = index;
      continue;
    }

    index += 1;
  }

  closeCode(sql.length);
  return { spans, unterminated };
}

/**
 * Karakter başına "kod mu" bayrağı.
 *
 * Kurallar girdi üzerinde regex gezdiriyor ve her eşleşmede bölge sorgusu
 * yapıyor; span listesinde arama yapmak bunu O(n·m) yapardı.
 */
export function codeMask(sql: string, spans: Span[]): Uint8Array {
  const mask = new Uint8Array(sql.length);
  for (const span of spans) {
    if (span.kind === 'code') mask.fill(1, span.start, span.end);
  }
  return mask;
}

/** `12` → `"3:7"` — bulgunun kullanıcıya gösterilen konumu. */
export function positionOf(sql: string, index: number): string {
  const before = sql.slice(0, index);
  const line = before.split('\n').length;
  const column = index - (before.lastIndexOf('\n') + 1) + 1;
  return `${line}:${column}`;
}
