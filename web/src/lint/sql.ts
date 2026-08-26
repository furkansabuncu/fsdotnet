import { codeMask } from './types';
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

/* ------------------------------------------------------------------ */
/* Yan tümce ayırma                                                     */
/* ------------------------------------------------------------------ */

/**
 * Üst seviye yan tümce anahtarları. Sıra ÖNEMSİZ — eşleştirmeden önce
 * uzunluğa göre sıralanıyor, yoksa `LEFT JOIN` girdisinde `JOIN` eşleşir
 * ve `LEFT` düz metin olarak kalırdı.
 */
export const CLAUSE_KEYWORDS = [
  'SELECT', 'FROM', 'CROSS JOIN', 'INNER JOIN', 'LEFT OUTER JOIN', 'LEFT JOIN',
  'RIGHT OUTER JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'FULL JOIN', 'NATURAL JOIN', 'JOIN',
  'WHERE', 'CONNECT BY', 'START WITH', 'GROUP BY', 'HAVING', 'ORDER BY',
  'FETCH FIRST', 'OFFSET', 'LIMIT', 'UNION ALL', 'UNION', 'MINUS', 'INTERSECT',
] as const;

export interface Clause {
  /** Büyük harfe normalleştirilmiş anahtar. */
  keyword: string;
  /** Anahtarın kaynaktaki başlangıcı. */
  start: number;
  /** Gövdenin başlangıcı — anahtarın hemen sonrası. */
  bodyStart: number;
  /** Bir sonraki anahtara kadar olan metin, kırpılmış. */
  body: string;
}

/**
 * Sorguyu üst seviye yan tümcelere böler.
 *
 * "Üst seviye" iki şey demek: parantez derinliği sıfır (alt sorgunun
 * `WHERE`i dış sorgunun sanılmasın) ve kodun içinde (dize ya da yorumdaki
 * `FROM` yan tümce değildir).
 *
 * Konum da veriliyor, yalnızca metin değil: SQL Fixer bulguyu kaynakta
 * göstermek zorunda ve konumu sonradan geri bulmak eşleşme aramak demekti.
 */
export function splitClauses(sql: string): Clause[] {
  const upper = sql.toUpperCase();
  const mask = codeMask(sql, scanSql(sql).spans);
  const keywords = [...CLAUSE_KEYWORDS].sort((a, b) => b.length - a.length);

  const found: { keyword: string; start: number; bodyStart: number }[] = [];
  let depth = 0;

  for (let index = 0; index < sql.length; index += 1) {
    if (!mask[index]) continue;
    const char = sql[index];

    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    if (depth !== 0) continue;

    for (const keyword of keywords) {
      if (!upper.startsWith(keyword, index)) continue;
      // Sözcük sınırı: `ORDERS` tablosu `ORDER BY` sanılmasın.
      const before = index === 0 ? ' ' : (sql[index - 1] as string);
      const after = sql[index + keyword.length] ?? ' ';
      if (/[\w$]/.test(before) || /[\w$]/.test(after)) continue;

      found.push({ keyword, start: index, bodyStart: index + keyword.length });
      index += keyword.length - 1;
      break;
    }
  }

  return found.map((entry, position) => {
    const stop = found[position + 1]?.start ?? sql.length;
    return {
      keyword: entry.keyword,
      start: entry.start,
      bodyStart: entry.bodyStart,
      body: sql.slice(entry.bodyStart, stop).trim(),
    };
  });
}

/**
 * Virgülle ayrılmış listeyi üst seviyede böler.
 *
 * `nvl(a, 0)` içindeki virgül ayraç DEĞİL; naif bir `split(',')` select
 * listesini yanlış sayar ve GROUP BY denetimi tamamen kayar.
 */
export function splitList(text: string): { text: string; offset: number }[] {
  const mask = codeMask(text, scanSql(text).spans);
  const items: { text: string; offset: number }[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    if (!mask[index]) continue;
    const char = text[index];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ',' && depth === 0) {
      items.push({ text: text.slice(start, index).trim(), offset: start });
      start = index + 1;
    }
  }

  const tail = text.slice(start).trim();
  if (tail !== '') items.push({ text: tail, offset: start });
  return items;
}
