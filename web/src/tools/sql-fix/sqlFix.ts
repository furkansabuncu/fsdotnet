import { err, ok, type ToolResult } from '../types';
import { codeMask, positionOf, scan, type Span } from './scan';

/**
 * Çalışmayan SQL'i inceleyip düzeltme öneren kural motoru.
 *
 * Bilinçli olarak "SQL tamircisi" DEĞİL, auto-fix'li bir linter: her bulgu
 * ayrı ayrı listeleniyor ve tek tek uygulanıyor. Sebebi şu — hata veren
 * sorgu gürültülü bir arızadır, görürsünüz; sessizce "düzeltilmiş" sorgu
 * ise sessiz bir arızadır ve yanlış satırları döndürür. Fazla virgülü
 * silmek güvenli, ama sorgunun yapısını değiştiren her düzeltme
 * kullanıcının kararı olmalı.
 *
 * Kapsam Oracle: kurallar "Oracle'ın kabul etmediği" şeye göre yazıldı,
 * yani SQL Server'dan gelen sözdizimi burada bulgu sayılır. Şema
 * gerektiren hiçbir şey YOK — yanlış yazılmış kolon adı, ORA-00918
 * belirsiz kolon ve sorgunun doğru satırları döndürüp döndürmediği bu
 * aracın bilebileceği şeyler değil.
 */

export type RuleKey =
  | 'hostStringLiteral'
  | 'invisibleChar'
  | 'smartQuote'
  | 'pastePrefix'
  | 'unterminatedString'
  | 'unterminatedIdentifier'
  | 'unterminatedComment'
  | 'unclosedParen'
  | 'extraParen'
  | 'trailingSemicolon'
  | 'sqlPlusSlash'
  | 'extraComma'
  | 'gluedKeyword'
  | 'doubleQuotedString'
  | 'tableAliasAs'
  | 'bracketIdentifier'
  | 'atParameter'
  | 'tsqlFunction'
  | 'tsqlNoEquivalent'
  | 'plusConcat'
  | 'topClause'
  | 'offsetFetch';

export type Severity = 'error' | 'warning';

export interface Edit {
  start: number;
  end: number;
  text: string;
}

export interface Finding {
  /** Kullanıcının hangi düzeltmeyi kapattığını hatırlamak için kararlı anahtar. */
  id: string;
  rule: RuleKey;
  severity: Severity;
  start: number;
  end: number;
  /** `3:12` — çevrilmez, girdiden gelir. */
  position: string;
  /** Bulunan token ya da somut öneri; çevrilmez. */
  detail?: string;
  /** Boş dizi: tespit var, otomatik düzeltmesi yok. */
  edits: Edit[];
}

interface Context {
  sql: string;
  spans: Span[];
  mask: Uint8Array;
  /** Parantez derinliği; üst seviye kuralları bunu okur. */
  depth: Int32Array;
  /** İlk anlamlı karakterin konumu, yoksa -1. */
  firstToken: number;
  /** Sondaki `;`, `/` ve boşluk hariç, ifadenin bittiği yer. */
  statementEnd: number;
}

interface Rule {
  key: RuleKey;
  run(context: Context): Finding[];
}

/* ------------------------------------------------------------------ */
/* Ortak yardımcılar — her kural bunları kullanır, kendi kopyasını değil */
/* ------------------------------------------------------------------ */

function make(
  context: Context,
  rule: RuleKey,
  severity: Severity,
  start: number,
  end: number,
  edits: Edit[] = [],
  detail?: string,
): Finding {
  const finding: Finding = {
    id: `${rule}:${start}`,
    rule,
    severity,
    start,
    end,
    position: positionOf(context.sql, start),
    edits,
  };
  return detail === undefined ? finding : { ...finding, detail };
}

/** Yalnızca kodun içine düşen eşleşmeler — string ve yorumlar atlanır. */
function* codeMatches(context: Context, pattern: RegExp): Generator<RegExpExecArray> {
  const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  let match = regex.exec(context.sql);
  while (match !== null) {
    if (context.mask[match.index]) yield match;
    if (match[0] === '') regex.lastIndex += 1;
    match = regex.exec(context.sql);
  }
}

/**
 * Kuralların çoğu aynı şekle sahip: kod içinde bir kalıp ara, bulduğunu
 * başka bir metinle değiştir. Bunu her seferinde elle yazmak yerine tek
 * fabrika — yeni bir kural genelde tek satır.
 *
 * `build` null döndürürse eşleşme bulgu sayılmaz; böylece bağlama bakıp
 * yanlış pozitifleri eleyebiliyor.
 */
function patternRule(
  key: RuleKey,
  severity: Severity,
  pattern: RegExp,
  build: (match: RegExpExecArray, context: Context) => { text?: string; detail?: string; start?: number; end?: number } | null,
): Rule {
  return {
    key,
    run(context) {
      const findings: Finding[] = [];
      for (const match of codeMatches(context, pattern)) {
        const result = build(match, context);
        if (result === null) continue;
        const start = result.start ?? match.index;
        const end = result.end ?? match.index + match[0].length;
        const edits = result.text === undefined ? [] : [{ start, end, text: result.text }];
        findings.push(make(context, key, severity, start, end, edits, result.detail));
      }
      return findings;
    },
  };
}

/**
 * İfadenin tamamını saran düzeltmeler (TOP, OFFSET/FETCH).
 *
 * Sonek `statementEnd`'e yazılıyor, girdinin sonuna değil: aksi hâlde
 * sondaki `;` sarmalayıcının İÇİNDE kalır ve düzeltilmiş sorgu yine
 * çalışmaz.
 */
function wrapEdits(context: Context, remove: { start: number; end: number }, prefix: string, suffix: string): Edit[] {
  return [
    { start: context.firstToken, end: context.firstToken, text: prefix },
    { start: remove.start, end: remove.end, text: '' },
    { start: context.statementEnd, end: context.statementEnd, text: suffix },
  ];
}

/* ------------------------------------------------------------------ */
/* Yapıştırma hasarı                                                    */
/* ------------------------------------------------------------------ */

/* Boşluk gibi görünenler boşluğa, genişliği olmayanlar hiçliğe. Oracle
   bunlara `ORA-00911: invalid character` diyor ve karakter görünmediği
   için sorgu ekranda kusursuz duruyor. */
const SPACE_LIKE = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/;
const INVISIBLE = /[\u00A0\u1680\u2000-\u200D\u202F\u205F\u2028\u2029\u3000\uFEFF]/g;

const invisibleChar = patternRule('invisibleChar', 'error', INVISIBLE, (match) => ({
  text: SPACE_LIKE.test(match[0]) ? ' ' : '',
  detail: `U+${(match[0].codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`,
}));

const SMART_QUOTES: Record<string, string> = {
  '\u2018': "'", '\u2019': "'", '\u201A': "'", '\u201B': "'",
  '\u201C': '"', '\u201D': '"', '\u201E': '"', '\u201F': '"',
};

const smartQuote = patternRule('smartQuote', 'error', /[\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F]/g, (match) => ({
  text: SMART_QUOTES[match[0]],
  detail: match[0],
}));

/* Satır başındaki yapıştırma kiri. `SQL>` istemci istemi, `  2  ` SQL*Plus
   satır numarası, `> ` e-posta alıntısı, ``` markdown çiti.
   Önekten sonraki boşluk da gider: bırakılırsa düzeltilmiş sorgu girintili
   kalır ve "bir şey olmadı" gibi görünür. */
const PASTE_PREFIX =
  /^([ \t]*(?:SQL>|>(?=[ \t])|\d+(?=[ \t]{2,}))[ \t]*)|^([ \t]*```[a-z]*[ \t]*$)/gim;

const pastePrefix: Rule = {
  key: 'pastePrefix',
  run(context) {
    const findings: Finding[] = [];
    for (const match of codeMatches(context, PASTE_PREFIX)) {
      // Çit satırının tamamı gider; önek yalnızca kendisi.
      const fence = match[1] === undefined;
      const end = fence
        ? Math.min(context.sql.length, match.index + match[0].length + 1)
        : match.index + match[0].length;
      findings.push(
        make(context, 'pastePrefix', 'error', match.index, end, [{ start: match.index, end, text: '' }], match[0].trim() || '```'),
      );
    }
    return findings;
  },
};

/* ------------------------------------------------------------------ */
/* Ana dilden yapıştırılmış string                                      */
/* ------------------------------------------------------------------ */

export interface HostString {
  text: string;
  /** `Delphi`, `C#`, `C# verbatim` — çevrilmez. */
  flavour: string;
}

/**
 * Girdi bir SQL değil, .pas ya da .cs dosyasından kopyalanmış bir string
 * ifadesiyse onu çözer.
 *
 * Bu, aracın en çok işe yarayan kuralı: dönüşüm işinde sorgular form
 * event'lerinin içinde, satır satır birleştirilmiş hâlde duruyor. Kural
 * eşleştiğinde ÖTEKİ kurallar çalıştırılmıyor — çünkü onlar için girdinin
 * tamamı tek bir string ve söyleyecekleri her şey yanlış olurdu.
 */
export function unwrapHostString(input: string): HostString | null {
  const text = input.trim();
  if (text === '' || !/^@?['"]/.test(text)) return null;

  const parts: string[] = [];
  let verbatim = false;
  let escaped = false;
  let index = 0;

  const skipSpace = () => {
    while (index < text.length && /\s/.test(text[index] as string)) index += 1;
  };

  /* Elle taranıyor, tek bir regex'le değil: kaçış kuralı TIRNAĞA göre
     değişiyor (Pascal `''`, verbatim `""`, C# `\"`) ve hangi tırnakta
     olduğumuz ancak açılışı okuduktan sonra biliniyor. Tek regex bunu
     ifade edemez — ilk yazımı tam bu yüzden `''Ali''` üstünde patladı. */
  for (;;) {
    skipSpace();

    const at = text[index] === '@' && text[index + 1] === '"';
    if (at) {
      verbatim = true;
      index += 1;
    }

    const quote = text[index];
    if (quote !== "'" && quote !== '"') return null;
    index += 1;

    let body = '';
    let closed = false;

    while (index < text.length) {
      const char = text[index] as string;

      if (char === quote) {
        // İkiye katlanmış tırnak kaçıştır: Pascal'da her zaman, C#'ta
        // verbatim string'de.
        if (text[index + 1] === quote) {
          body += quote;
          index += 2;
          continue;
        }
        index += 1;
        closed = true;
        break;
      }

      if (quote === '"' && !at && char === '\\') {
        const next = text[index + 1] ?? '';
        escaped = true;
        body += next === 'n' ? '\n' : next === 't' ? '\t' : next === 'r' ? '' : next;
        index += 2;
        continue;
      }

      body += char;
      index += 1;
    }

    if (!closed) return null;
    parts.push(body);

    skipSpace();
    if (index >= text.length) break;

    // Aradaki tek geçerli şey birleştirme. Başka bir şeyse bu bir string
    // İFADESİ değil, içinde tırnak geçen sıradan bir metindir.
    if (text[index] === '+') index += 1;
    else if (text.startsWith('||', index)) index += 2;
    else return null;
  }

  const flavour = verbatim
    ? 'C# verbatim'
    : escaped
      ? 'C# / JSON'
      : text.startsWith("'")
        ? 'Delphi'
        : 'string';
  return { text: parts.join(''), flavour };
}

/* ------------------------------------------------------------------ */
/* Dengesizlikler                                                       */
/* ------------------------------------------------------------------ */

const UNTERMINATED: Record<'string' | 'identifier' | 'comment', RuleKey> = {
  string: 'unterminatedString',
  identifier: 'unterminatedIdentifier',
  comment: 'unterminatedComment',
};

const parens: Rule = {
  key: 'unclosedParen',
  run(context) {
    const findings: Finding[] = [];
    const open: number[] = [];

    for (let index = 0; index < context.sql.length; index += 1) {
      if (!context.mask[index]) continue;
      const char = context.sql[index];
      if (char === '(') open.push(index);
      else if (char === ')') {
        if (open.length > 0) open.pop();
        // Fazladan kapanış: yerini biliyoruz, silmek güvenli.
        else findings.push(make(context, 'extraParen', 'error', index, index + 1, [{ start: index, end: index + 1, text: '' }]));
      }
    }

    // Eksik kapanışın NEREYE geleceği bilinmiyor — açılışı gösterip
    // düzeltmeyi kullanıcıya bırakıyoruz.
    for (const index of open) {
      findings.push(make(context, 'unclosedParen', 'error', index, index + 1));
    }
    return findings;
  },
};

/* ------------------------------------------------------------------ */
/* Sonlandırıcılar                                                      */
/* ------------------------------------------------------------------ */

const terminators: Rule = {
  key: 'trailingSemicolon',
  run(context) {
    const findings: Finding[] = [];
    const { sql, mask } = context;
    let end = sql.length;
    const back = () => {
      while (end > 0 && /\s/.test(sql[end - 1] as string)) end -= 1;
    };

    back();
    if (end > 0 && sql[end - 1] === '/' && mask[end - 1]) {
      const lineStart = sql.lastIndexOf('\n', end - 1) + 1;
      // Kendi satırında yalnız duran `/` SQL*Plus çalıştırıcısıdır; başka
      // bir şeyin yanındaysa bölme işlemidir.
      if (sql.slice(lineStart, end - 1).trim() === '') {
        const slashEnd = end;
        end = lineStart;
        // Önündeki satır sonu da silinir; yoksa geriye boş bir satır kalır.
        back();
        findings.push(make(context, 'sqlPlusSlash', 'warning', end, slashEnd, [{ start: end, end: slashEnd, text: '' }]));
      }
    }

    if (end > 0 && sql[end - 1] === ';' && mask[end - 1]) {
      const semicolon = end - 1;
      end = semicolon;
      back();
      findings.push(make(context, 'trailingSemicolon', 'warning', end, semicolon + 1, [{ start: end, end: semicolon + 1, text: '' }]));
    }
    return findings;
  },
};

/* ------------------------------------------------------------------ */
/* Sözdizimi                                                            */
/* ------------------------------------------------------------------ */

const extraComma = patternRule(
  'extraComma',
  'error',
  /,(?=\s*(?:FROM\b|WHERE\b|GROUP\b|ORDER\b|HAVING\b|\)|$))/gi,
  () => ({ text: '' }),
);

/*
 * Yapışmış anahtar kelime — `'...siparis ' + 'where...'` yazarken aradaki
 * boşluğun kaybolması. Sonrasındaki kalıp her kelime için ayrı: `ORDER`
 * ancak `BY` geliyorsa yan tümcedir, yoksa `WORKORDER` gibi bir kolon adını
 * ikiye bölerdik.
 */
const GLUED_KEYWORDS: Record<string, string> = {
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

const GLUED = new RegExp(
  // Anahtar kelimeden hemen önce `_` olmasın: `SIPARIS_WHERE` tek bir
  // tanımlayıcıdır, yapışma değil.
  String.raw`\b([A-Za-z0-9_$]*[A-Za-z0-9$])(` +
    Object.entries(GLUED_KEYWORDS)
      .map(([word, follow]) => `${word}(?=${follow})`)
      .join('|') +
    ')',
  'gi',
);

const gluedKeyword = patternRule('gluedKeyword', 'warning', GLUED, (match) => ({
  text: `${match[1]} ${match[2]}`,
  detail: match[0],
}));

/* Oracle'da çift tırnak TANIMLAYICI demek, metin değil. Bir karşılaştırmanın
   sağında duruyorsa neredeyse kesinlikle metin kastedilmiştir → ORA-00904.
   Karşılaştırma bağlamı şart: `SELECT "Kolon Adı"` tamamen geçerlidir. */
const COMPARISON_BEFORE = /(?:=|<>|!=|<=|>=|<|>|\bLIKE|\bIN\s*\()\s*$/i;

const doubleQuotedString: Rule = {
  key: 'doubleQuotedString',
  run(context) {
    const findings: Finding[] = [];
    for (const span of context.spans) {
      if (span.kind !== 'identifier') continue;
      if (!COMPARISON_BEFORE.test(context.sql.slice(0, span.start))) continue;

      const body = context.sql.slice(span.start + 1, span.end - 1).replace(/""/g, '"');
      const text = `'${body.replace(/'/g, "''")}'`;
      findings.push(make(context, 'doubleQuotedString', 'error', span.start, span.end, [{ start: span.start, end: span.end, text }]));
    }
    return findings;
  },
};

const NAME = /^(?:"[^"\n]*"|[A-Za-z_][\w$#]*)(?:\.(?:"[^"\n]*"|[A-Za-z_][\w$#]*))*/;

/* `FROM tablo AS t` — Oracle tablo takma adında AS kabul etmez (ORA-00933).
   Kolon takma adında ise kabul eder, o yüzden yalnızca FROM/JOIN sonrası
   bakılıyor. `WITH x AS (` de buraya düşmez. */
const tableAliasAs: Rule = {
  key: 'tableAliasAs',
  run(context) {
    const findings: Finding[] = [];
    for (const match of codeMatches(context, /\b(?:FROM|JOIN)\b/gi)) {
      let cursor = match.index + match[0].length;
      const skip = () => {
        while (cursor < context.sql.length && /\s/.test(context.sql[cursor] as string)) cursor += 1;
      };

      skip();
      const name = NAME.exec(context.sql.slice(cursor));
      if (name === null) continue;
      cursor += name[0].length;

      const asStart = cursor;
      skip();
      if (!/^AS\b/i.test(context.sql.slice(cursor))) continue;
      const asEnd = cursor + 2;

      findings.push(make(context, 'tableAliasAs', 'error', cursor, asEnd, [{ start: asStart, end: asEnd, text: '' }]));
    }
    return findings;
  },
};

/* ------------------------------------------------------------------ */
/* SQL Server → Oracle                                                  */
/* ------------------------------------------------------------------ */

const bracketIdentifier = patternRule('bracketIdentifier', 'error', /\[([^\]\n]*)\]/g, (match) => {
  const body = match[1] ?? '';
  // Boşluk ya da özel karakter içeriyorsa çıplak bırakılamaz; Oracle'ın
  // karşılığı çift tırnaktır — ve o hâlde büyük/küçük harf de bağlayıcı olur.
  return { text: /^[A-Za-z_][\w$#]*$/.test(body) ? body : `"${body}"`, detail: match[0] };
});

/* `@ad` bağlama değişkeni Oracle'da `:ad`. Veri bağlantısı (`tablo@dblink`)
   ile karıştırmamak için `@`nin solunda tanımlayıcı olmamalı. */
const atParameter = patternRule('atParameter', 'error', /(^|[^\w$."@])@([A-Za-z_][\w$]*)/g, (match) => ({
  start: match.index + (match[1] ?? '').length,
  text: `:${match[2]}`,
  detail: `@${match[2]}`,
}));

/** Argümansız çağrılar — `GETDATE()` gibi, parantezleriyle birlikte gider. */
const TSQL_ZERO_ARG: Record<string, string> = {
  GETDATE: 'SYSDATE',
  SYSDATETIME: 'SYSTIMESTAMP',
  NEWID: 'SYS_GUID()',
};

/** Argümanları aynı anlama gelenler — yalnızca ad değişir. */
const TSQL_CALL: Record<string, string> = {
  ISNULL: 'NVL',
  LEN: 'LENGTH',
  SUBSTRING: 'SUBSTR',
  CEILING: 'CEIL',
};

/* Kalıp tablolardan türetiliyor: adları hem burada hem regex'te yazmak,
   birine eklenip ötekine eklenmeyen bir fonksiyonun sessizce kaybolması
   demekti. */
const TSQL_PATTERN = new RegExp(
  String.raw`\b(${Object.keys(TSQL_ZERO_ARG).join('|')})\s*\(\s*\)` +
    String.raw`|\b(${Object.keys(TSQL_CALL).join('|')})\s*(?=\()`,
  'gi',
);

const tsqlFunction = patternRule('tsqlFunction', 'error', TSQL_PATTERN, (match) => {
  const zeroArg = match[1];
  const name = (zeroArg ?? (match[2] as string)).toUpperCase();
  const text = zeroArg === undefined ? TSQL_CALL[name] : TSQL_ZERO_ARG[name];
  const from = zeroArg === undefined ? name : `${name}()`;
  return { text, detail: `${from} → ${text}` };
});

/**
 * Karşılığı olan ama birebir çevrilemeyen T-SQL fonksiyonları.
 *
 * Otomatik düzeltme YOK — `CHARINDEX` ile `INSTR`ın argüman sırası ters,
 * `CONVERT` ile `IIF` ise yapı değiştiriyor. Bunları sessizce çevirmek
 * derlenen ama yanlış çalışan sorgu üretirdi. Öneri `detail`de, kod olarak.
 */
const TSQL_MANUAL: Record<string, string> = {
  CHARINDEX: 'CHARINDEX(aranan, metin) → INSTR(metin, aranan)',
  CONVERT: 'CONVERT(tip, x) → TO_CHAR / TO_DATE / TO_NUMBER',
  IIF: 'IIF(k, a, b) → CASE WHEN k THEN a ELSE b END',
  DATEADD: 'DATEADD → tarih + sayı, ADD_MONTHS ya da INTERVAL',
  DATEDIFF: 'DATEDIFF → tarih farkı (gün) ya da MONTHS_BETWEEN',
  STRING_AGG: 'STRING_AGG → LISTAGG(kolon, ayrac) WITHIN GROUP (ORDER BY …)',
  PATINDEX: 'PATINDEX → REGEXP_INSTR',
  STUFF: 'STUFF → SUBSTR + concat',
  TRY_CAST: "TRY_CAST → CAST(… DEFAULT NULL ON CONVERSION ERROR) (12.2+)",
};

const tsqlNoEquivalent = patternRule(
  'tsqlNoEquivalent',
  'warning',
  new RegExp(String.raw`\b(${Object.keys(TSQL_MANUAL).join('|')})\s*(?=\()`, 'gi'),
  (match) => ({ detail: TSQL_MANUAL[(match[1] as string).toUpperCase()] }),
);

/* T-SQL metni `+` ile birleştirir, Oracle `||` ile. Yalnızca bir metin
   sabitine komşu `+` işaretleniyor; sayısal toplama dokunulmaz. */
const plusConcat: Rule = {
  key: 'plusConcat',
  run(context) {
    const findings: Finding[] = [];
    const seen = new Set<number>();

    for (const span of context.spans) {
      if (span.kind !== 'string') continue;

      for (const side of [-1, 1] as const) {
        let cursor = side === -1 ? span.start - 1 : span.end;
        while (cursor >= 0 && cursor < context.sql.length && /[ \t]/.test(context.sql[cursor] as string)) cursor += side;
        if (cursor < 0 || cursor >= context.sql.length) continue;
        if (context.sql[cursor] !== '+' || !context.mask[cursor] || seen.has(cursor)) continue;

        seen.add(cursor);
        findings.push(make(context, 'plusConcat', 'error', cursor, cursor + 1, [{ start: cursor, end: cursor + 1, text: '||' }]));
      }
    }
    return findings.sort((a, b) => a.start - b.start);
  },
};

/* ------------------------------------------------------------------ */
/* Sayfalama — 11g'de OFFSET/FETCH ve TOP yok                           */
/* ------------------------------------------------------------------ */

const TOP = /\bSELECT\s+(?:DISTINCT\s+|ALL\s+)?(TOP\s*\(?\s*(\d+)\s*\)?\s+)(?!PERCENT\b|WITH\b)/gi;

const topClause: Rule = {
  key: 'topClause',
  run(context) {
    const findings: Finding[] = [];
    for (const match of codeMatches(context, TOP)) {
      const removeStart = match.index + match[0].length - (match[1] as string).length;
      const remove = { start: removeStart, end: match.index + match[0].length };

      /* Sarmalayıcı yalnızca EN DIŞTAKİ sorgu için doğru. Alt sorgudaki bir
         TOP yüzünden dış sorguyu sarmak, çalışan ama yanlış satırları
         döndüren bir sorgu üretirdi — o yüzden orada yalnızca uyarı var. */
      const outermost = match.index === context.firstToken;
      const edits = outermost
        ? wrapEdits(context, remove, 'SELECT * FROM (\n', `\n) WHERE ROWNUM <= ${match[2]}`)
        : [];

      findings.push(make(context, 'topClause', 'error', match.index, remove.end, edits, `TOP ${match[2]}`));
    }
    return findings;
  },
};

const OFFSET_FETCH =
  /\bOFFSET\s+(\d+|:\w+)\s+ROWS?\s*(?:FETCH\s+(?:NEXT|FIRST)\s+(\d+|:\w+)\s+ROWS?\s+ONLY)?/gi;

const offsetFetch: Rule = {
  key: 'offsetFetch',
  run(context) {
    const findings: Finding[] = [];
    for (const match of codeMatches(context, OFFSET_FETCH)) {
      const remove = { start: match.index, end: match.index + match[0].length };
      const offset = match[1] as string;
      const limit = match[2];

      // Alt sorguda sayfalama sarılamaz: hangi sorgunun sayfalandığı belirsiz.
      const edits =
        context.depth[match.index] === 0
          ? wrapEdits(
              context,
              remove,
              'SELECT * FROM (\n  SELECT sub.*, ROWNUM rnum FROM (\n',
              limit === undefined
                ? `\n  ) sub\n) WHERE rnum > ${offset}`
                : `\n  ) sub WHERE ROWNUM <= ${sumOrExpression(offset, limit)}\n) WHERE rnum > ${offset}`,
            )
          : [];

      findings.push(make(context, 'offsetFetch', 'error', remove.start, remove.end, edits, match[0]));
    }
    return findings;
  },
};

/** İkisi de sayıysa toplamı, değilse ifadeyi verir — bağlama değişkeni olabilir. */
function sumOrExpression(offset: string, limit: string): string {
  const a = Number(offset);
  const b = Number(limit);
  return Number.isInteger(a) && Number.isInteger(b) ? String(a + b) : `${offset} + ${limit}`;
}

/* ------------------------------------------------------------------ */
/* Motor                                                                */
/* ------------------------------------------------------------------ */

const RULES: readonly Rule[] = [
  invisibleChar,
  smartQuote,
  pastePrefix,
  parens,
  terminators,
  extraComma,
  gluedKeyword,
  doubleQuotedString,
  tableAliasAs,
  bracketIdentifier,
  atParameter,
  tsqlFunction,
  tsqlNoEquivalent,
  plusConcat,
  topClause,
  offsetFetch,
];

function buildContext(sql: string): Context {
  const { spans } = scan(sql);
  const mask = codeMask(sql, spans);
  const depth = new Int32Array(sql.length);

  let level = 0;
  let firstToken = -1;
  for (let index = 0; index < sql.length; index += 1) {
    depth[index] = level;
    if (!mask[index]) continue;
    const char = sql[index];
    if (char === '(') level += 1;
    else if (char === ')') level = Math.max(0, level - 1);
    if (firstToken === -1 && !/\s/.test(char as string)) firstToken = index;
  }

  let statementEnd = sql.length;
  const trimBack = () => {
    while (statementEnd > 0 && /\s/.test(sql[statementEnd - 1] as string)) statementEnd -= 1;
  };
  trimBack();
  while (statementEnd > 0 && (sql[statementEnd - 1] === ';' || sql[statementEnd - 1] === '/')) {
    statementEnd -= 1;
    trimBack();
  }

  return { sql, spans, mask, depth, firstToken: Math.max(0, firstToken), statementEnd };
}

export function analyze(sql: string): ToolResult<Finding[]> {
  if (sql.trim() === '') return err('sqlFixEmpty');

  /* Girdi ana dilden yapıştırılmış bir string ifadesiyse öteki kuralların
     söyleyeceği her şey yanlış olur — onlar için girdinin tamamı tek bir
     metin sabiti. Önce bu çözülmeli. */
  const host = unwrapHostString(sql);
  if (host !== null) {
    const context = buildContext(sql);
    return ok([
      make(context, 'hostStringLiteral', 'error', 0, sql.length, [{ start: 0, end: sql.length, text: host.text }], host.flavour),
    ]);
  }

  const context = buildContext(sql);
  const findings = RULES.flatMap((rule) => rule.run(context));

  const { unterminated } = scan(sql);
  if (unterminated !== null) {
    findings.push(make(context, UNTERMINATED[unterminated.kind], 'error', unterminated.start, sql.length));
  }

  return ok(findings.sort((a, b) => a.start - b.start || a.rule.localeCompare(b.rule)));
}

/**
 * Seçili düzeltmeleri uygular.
 *
 * Çakışan düzeltmeler ATLANIR, kırpılmaz: iki kural aynı aralığı farklı
 * biçimde değiştirmek istiyorsa ikisini karıştırmak ortaya hiçbirinin
 * kastetmediği bir metin çıkarır. Atlanan kural bir sonraki turda yeniden
 * bulunur, çünkü girdi hâlâ o hâlde.
 */
export function applyFixes(
  sql: string,
  findings: readonly Finding[],
  excluded: ReadonlySet<string> = new Set(),
): string {
  const claimed: Edit[] = [];

  for (const finding of findings) {
    if (finding.edits.length === 0 || excluded.has(finding.id)) continue;
    const overlaps = finding.edits.some((edit) =>
      claimed.some((other) =>
        edit.start === edit.end && other.start === other.end
          ? edit.start === other.start
          : edit.start < other.end && other.start < edit.end,
      ),
    );
    if (!overlaps) claimed.push(...finding.edits);
  }

  let output = sql;
  for (const edit of [...claimed].sort((a, b) => b.start - a.start || b.end - a.end)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}

/** Otomatik düzeltmesi olan bulgu sayısı — arayüz "hepsini uygula"yı buna göre gösterir. */
export function fixableCount(findings: readonly Finding[]): number {
  return findings.filter((finding) => finding.edits.length > 0).length;
}
