import type { Region, ScanResult, Span } from './types';

/**
 * SQL'i bölgelere ayıran tarayıcı.
 *
 * Kuralların neredeyse hepsinin ihtiyacı aynı: "bu karakter GERÇEKTEN kodun
 * içinde mi, yoksa bir string'in, tanımlayıcının ya da yorumun içinde mi?"
 * Bu ayrım olmadan her kural kendi naif regex'ini yazar ve hepsi aynı yerde
 * yanılır — `'-- fiyat'` bir yorum değil, `"a, b"` bir virgül değildir.
 *
 * SQL Fixer'ın yanı sıra `minifySql` ve `sqlToLinq` de buradan besleniyor;
 * eskiden üçünün de kendi kopyası vardı.
 *
 * Bilinen sınır: Oracle'ın `q'[...]'` alternatif tırnak sözdizimi
 * desteklenmiyor, sıradan tırnak gibi okunuyor.
 */
export function scanSql(sql: string): ScanResult {
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
      const kind: Region = char === "'" ? 'string' : 'identifier';
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
 * String birleştirmede kaybolan boşluk yüzünden bir tanımlayıcıya yapışan
 * yan tümce anahtar kelimesi: `from siparisWHERE kanal_id = 5`.
 *
 * Sonrasındaki kalıp her kelime için ayrı: `ORDER` ancak `BY` geliyorsa
 * yan tümcedir, yoksa `WORKORDER` gibi bir kolon adını ikiye bölerdik.
 * Anahtar kelimeden hemen önce `_` de olmamalı — `SIPARIS_WHERE` tek bir
 * tanımlayıcıdır, yapışma değil.
 *
 * Hem SQL Fixer (bulgu olarak bildirir) hem PAS çıkarıcısı (birleştirirken
 * onarır) buna bakıyor; ikisinin ayrı kopyası kaçınılmaz olarak ayrışırdı.
 */
const GLUED_FOLLOW: Record<string, string> = {
  WHERE: String.raw`\s`,
  FROM: String.raw`\s`,
  SELECT: String.raw`\s`,
  HAVING: String.raw`\s`,
  UNION: String.raw`\s`,
  JOIN: String.raw`\s`,
  ORDER: String.raw`\s+BY\b`,
  GROUP: String.raw`\s+BY\b`,
  INNER: String.raw`\s+JOIN\b`,
  LEFT: String.raw`\s+JOIN\b`,
};

/** `match[1]` yapışılan tanımlayıcı, `match[2]` anahtar kelime. */
export const GLUED_KEYWORD = new RegExp(
  String.raw`\b([A-Za-z0-9_$]*[A-Za-z0-9$])(` +
    Object.entries(GLUED_FOLLOW)
      .map(([word, follow]) => `${word}(?=${follow})`)
      .join('|') +
    ')',
  'gi',
);

/** Yapışmayı onarır — bildirmek değil, düzeltmek isteyen çağıranlar için. */
export function separateGluedKeywords(sql: string): string {
  return sql.replace(GLUED_KEYWORD, (_, identifier: string, keyword: string) => `${identifier} ${keyword}`);
}
