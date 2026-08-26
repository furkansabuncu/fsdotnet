import { codeMask, positionOf, type Finding, type Severity, type Span } from './types';

/**
 * Kural motoru — dilden bağımsız.
 *
 * Bir lint aracı yazmak burada üç şey demek: bir tarayıcı (`sql.ts` /
 * `csharp.ts`), bir kural tablosu ve bir sözlük bölümü. Konum hesabı,
 * bölge filtresi, çakışan düzeltmelerin çözümü ve arayüz ortak.
 */

export interface LintContext {
  source: string;
  spans: readonly Span[];
  /** Karakter kodun içinde mi — dize ve yorumlar 0. */
  mask: Uint8Array;
  /** Parantez derinliği; üst seviye kuralları bunu okur. */
  depth: Int32Array;
  /** İlk anlamlı karakterin konumu; girdi boşsa 0. */
  firstToken: number;
}

export interface Rule<K extends string, C extends LintContext = LintContext> {
  key: K;
  run(context: C): Finding<K>[];
}

/** Açılış/kapanış olarak sayılacak karakterler; C ailesi ile SQL aynı. */
const OPEN = '(';
const CLOSE = ')';

export function buildContext(source: string, spans: readonly Span[]): LintContext {
  const mask = codeMask(source, spans);
  const depth = new Int32Array(source.length);

  let level = 0;
  let firstToken = -1;

  for (let index = 0; index < source.length; index += 1) {
    depth[index] = level;
    if (!mask[index]) continue;

    const char = source[index] as string;
    if (char === OPEN) level += 1;
    else if (char === CLOSE) level = Math.max(0, level - 1);
    if (firstToken === -1 && !/\s/.test(char)) firstToken = index;
  }

  return { source, spans, mask, depth, firstToken: Math.max(0, firstToken) };
}

export function finding<K extends string>(
  context: LintContext,
  rule: K,
  severity: Severity,
  start: number,
  end: number,
  edits: Finding<K>['edits'] = [],
  detail?: string,
): Finding<K> {
  const result: Finding<K> = {
    id: `${rule}:${start}`,
    rule,
    severity,
    start,
    end,
    position: positionOf(context.source, start),
    edits,
  };
  return detail === undefined ? result : { ...result, detail };
}

/** Yalnızca kodun içine düşen eşleşmeler — dize ve yorumlar atlanır. */
export function* codeMatches(context: LintContext, pattern: RegExp): Generator<RegExpExecArray> {
  // Kalıbın kendi `lastIndex`i taşınmasın: aynı RegExp nesnesi her çağrıda
  // yeniden kullanılıyor ve durum sızarsa ikinci çağrı eşleşmeleri atlar.
  const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);

  let match = regex.exec(context.source);
  while (match !== null) {
    if (context.mask[match.index]) yield match;
    if (match[0] === '') regex.lastIndex += 1;
    match = regex.exec(context.source);
  }
}

export interface PatternResult {
  /** Verilmezse kural yalnızca bildirir, düzeltmez. */
  text?: string;
  detail?: string;
  start?: number;
  end?: number;
}

/**
 * Kuralların çoğu aynı şekle sahip: kod içinde bir kalıp ara, bulduğunu
 * başka bir metinle değiştir. Bunu her seferinde elle yazmak yerine tek
 * fabrika — yeni bir kural genelde tek satır.
 *
 * `build` null döndürürse eşleşme bulgu sayılmaz; böylece bağlama bakıp
 * yanlış pozitifleri eleyebiliyor.
 */
export function patternRule<K extends string>(
  key: K,
  severity: Severity,
  pattern: RegExp,
  build: (match: RegExpExecArray, context: LintContext) => PatternResult | null,
): Rule<K> {
  return {
    key,
    run(context) {
      const findings: Finding<K>[] = [];
      for (const match of codeMatches(context, pattern)) {
        const result = build(match, context);
        if (result === null) continue;

        const start = result.start ?? match.index;
        const end = result.end ?? match.index + match[0].length;
        const edits = result.text === undefined ? [] : [{ start, end, text: result.text }];
        findings.push(finding(context, key, severity, start, end, edits, result.detail));
      }
      return findings;
    },
  };
}

/** Kuralları çalıştırıp bulguları konuma göre sıralar. */
export function runRules<K extends string, C extends LintContext>(
  context: C,
  rules: readonly Rule<K, C>[],
): Finding<K>[] {
  return rules
    .flatMap((rule) => rule.run(context))
    .sort((a, b) => a.start - b.start || a.rule.localeCompare(b.rule));
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
  source: string,
  findings: readonly Finding[],
  excluded: ReadonlySet<string> = new Set(),
): string {
  const claimed: Finding['edits'] = [];

  for (const item of findings) {
    if (item.edits.length === 0 || excluded.has(item.id)) continue;

    const overlaps = item.edits.some((edit) =>
      claimed.some((other) =>
        // Sıfır genişlikli eklemeler yalnızca AYNI noktada çakışır;
        // aralık kuralı onları hiç çakışmıyor sayardı.
        edit.start === edit.end && other.start === other.end
          ? edit.start === other.start
          : edit.start < other.end && other.start < edit.end,
      ),
    );
    if (!overlaps) claimed.push(...item.edits);
  }

  let output = source;
  for (const edit of [...claimed].sort((a, b) => b.start - a.start || b.end - a.end)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}

/** Otomatik düzeltmesi olan bulgu sayısı — arayüz "hepsini uygula"yı buna göre gösterir. */
export function fixableCount(findings: readonly Finding[]): number {
  return findings.filter((item) => item.edits.length > 0).length;
}

/* ------------------------------------------------------------------ */
/* Parantez yardımcıları                                                */
/* ------------------------------------------------------------------ */

/**
 * `open` konumundaki parantezin eşi; bulunamazsa -1.
 *
 * Çağrının argüman listesinin nerede bittiğini bilmek gerekiyor: bir
 * düzeltme oraya `, StringComparison.Ordinal` eklerken ya da bir kural
 * projeksiyonun içine bakarken.
 */
export function closeParen(context: LintContext, open: number): number {
  let depth = 0;
  for (let index = open; index < context.source.length; index += 1) {
    if (!context.mask[index]) continue;
    const char = context.source[index];
    if (char === OPEN) depth += 1;
    else if (char === CLOSE) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

/**
 * `index` konumunu saran çağrının adı — `.Where(… buradayız …)` içinse
 * `Where`. Saran parantez yoksa null, parantez var ama adsızsa boş dize.
 *
 * Kuralların çoğu "nerede" sorusuna bağlı: aynı `Any(...)` bir `Where`
 * içinde EXISTS'e çevrilir, bir `Select` içinde 11g'yi patlatır.
 */
export function enclosingCall(
  context: LintContext,
  index: number,
): { name: string; open: number } | null {
  let depth = 0;
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (!context.mask[cursor]) continue;
    const char = context.source[cursor];

    if (char === CLOSE) depth += 1;
    else if (char === OPEN) {
      if (depth === 0) {
        const name = /([A-Za-z_]\w*)\s*$/.exec(context.source.slice(0, cursor));
        return { name: name?.[1] ?? '', open: cursor };
      }
      depth -= 1;
    }
  }
  return null;
}
