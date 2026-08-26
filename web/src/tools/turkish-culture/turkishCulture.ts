import { err, ok, type ToolResult } from '../types';
import { scanCSharp } from '../../lint/csharp';
import {
  buildContext,
  closeParen,
  codeMatches,
  finding,
  patternRule,
  runRules,
  type LintContext,
  type Rule,
} from '../../lint/engine';
import type { Finding } from '../../lint/types';

/**
 * Kültüre bağlı C# çağrıları — `tr-TR` altında başka davranan kod.
 *
 * Türkçe'de `i`nin büyüğü `İ`, `I`nın küçüğü `ı`. Yani `"file".ToUpper()`
 * Türkçe bir sunucuda `FİLE` üretiyor ve `== "FILE"` karşılaştırması
 * sessizce başarısız oluyor. Aynı sınıftan: ondalık ayracı virgül olduğu
 * için `double.Parse("3.14")` ya patlıyor ya 314 okuyor, tarih ayracı nokta
 * olduğu için `"dd/MM/yyyy"` nokta basıyor.
 *
 * Hepsinin ortak yanı, hatanın GELİŞTİRME makinesinde görünmemesi: kod
 * invariant ya da en-US altında doğru çalışıyor, sunucu Türkçe olunca
 * bozuluyor. Bu yüzden liste "kültürsüz çağrı" üzerine kurulu — niyet
 * neyse açıkça yazılmalı.
 */

export type RuleKey =
  | 'toUpperLower'
  | 'startsEndsWith'
  | 'indexOfString'
  | 'stringCompare'
  | 'numberParse'
  | 'tryParse'
  | 'dateParse'
  | 'formatString'
  | 'stringFormat'
  | 'regexIgnoreCase';

type CultureRule = Rule<RuleKey>;

/** Argüman listesinde niyetin zaten yazılı olduğunu gösteren işaretler. */
const EXPLICIT = /StringComparison|CultureInfo|IFormatProvider|NumberStyles|DateTimeStyles|InvariantGlobalization/;

/**
 * Bir çağrının argüman listesine ek argüman yazan kuralları tek yerden
 * kurar. Üçü de aynı şeyi yapıyor: parantezi bul, içinde niyet zaten
 * yazılmışsa sus, yazılmamışsa kapanışın önüne ekle.
 */
function appendArgument(
  key: RuleKey,
  pattern: RegExp,
  argument: string,
  detail: (match: RegExpExecArray) => string,
  options: { fixable?: boolean } = {},
): CultureRule {
  return {
    key,
    run(context) {
      const findings: Finding<RuleKey>[] = [];

      for (const match of codeMatches(context, pattern)) {
        const open = context.source.indexOf('(', match.index);
        const close = open === -1 ? -1 : closeParen(context, open);
        if (close === -1) continue;

        // Niyet zaten yazılmış — kural burada susmak zorunda, yoksa
        // doğru yazılmış kodu her seferinde uyarır ve kimse bakmaz.
        if (EXPLICIT.test(context.source.slice(open, close))) continue;

        const edits =
          options.fixable === false ? [] : [{ start: close, end: close, text: `, ${argument}` }];

        findings.push(
          finding(context, key, 'warning', match.index, match.index + match[0].length, edits, detail(match)),
        );
      }
      return findings;
    },
  };
}

/*
 * `ToUpper()` / `ToLower()` — argümansız hâli mevcut kültürü izliyor.
 * Düzeltme birebir: `ToUpperInvariant()` aynı imzayı taşıyor.
 *
 * Argüman varsa (`ToUpper(CultureInfo.CurrentCulture)`) niyet açıkça
 * yazılmış demektir; kalıp yalnızca boş parantezi eşliyor.
 */
const toUpperLower = patternRule(
  'toUpperLower',
  'warning',
  /\.To(Upper|Lower)\s*\(\s*\)/g,
  (match) => ({
    text: `.To${match[1]}Invariant()`,
    detail: `To${match[1]}() → To${match[1]}Invariant()`,
  }),
);

/* `StartsWith("x")` ve `EndsWith("x")` .NET'te VARSAYILAN olarak kültüre
   duyarlı (CA1310) — çoğu kişi ordinal sanıyor. */
const startsEndsWith = appendArgument(
  'startsEndsWith',
  /\.(StartsWith|EndsWith)\s*\(/g,
  'StringComparison.Ordinal',
  (match) => `${match[1]}(…)`,
);

/* `IndexOf(string)` kültüre duyarlı, `IndexOf(char)` ordinal — aynı adın
   iki aşırı yüklemesi farklı davranıyor. Yalnızca dize verilen hâli. */
const indexOfString = appendArgument(
  'indexOfString',
  /\.IndexOf\s*\(\s*(?=["$@])/g,
  'StringComparison.Ordinal',
  () => 'IndexOf(string)',
);

/* `string.Compare(a, b)` kültürle sıralar. Düzeltme YOK: `Ordinal` mı
   `OrdinalIgnoreCase` mi olacağı çağıranın kararı ve yanlış seçim
   karşılaştırmayı sessizce tersine çevirir. */
const stringCompare = appendArgument(
  'stringCompare',
  /\bstring\.Compare\s*\(/gi,
  '',
  () => 'string.Compare(a, b)',
  { fixable: false },
);

const numberParse = appendArgument(
  'numberParse',
  /\b(int|long|short|decimal|double|float)\.Parse\s*\(/g,
  'CultureInfo.InvariantCulture',
  (match) => `${match[1]}.Parse(…)`,
);

/* `TryParse` düzeltilmiyor: kültürlü aşırı yükleme `NumberStyles` de
   istiyor ve `out` argümanı sona kayıyor — sonuna ekleme yapmak
   derlenmeyen kod üretirdi. */
const tryParse = appendArgument(
  'tryParse',
  /\b(int|long|short|decimal|double|float|DateTime)\.TryParse\s*\(/g,
  '',
  (match) => `${match[1]}.TryParse(…)`,
  { fixable: false },
);

const dateParse = appendArgument(
  'dateParse',
  /\bDateTime(Offset)?\.Parse\s*\(/g,
  'CultureInfo.InvariantCulture',
  (match) => `DateTime${match[1] ?? ''}.Parse(…)`,
);

/* `ToString("yyyy-MM-dd")` — biçim dizesindeki `/` ve `:` kültürün
   ayracının yer tutucusu. tr-TR altında bölü nokta basıyor. */
const formatString = appendArgument(
  'formatString',
  /\.ToString\s*\(\s*(?=["$@])/g,
  'CultureInfo.InvariantCulture',
  () => 'ToString("…")',
);

/* `string.Format` sağlayıcıyı İLK argüman olarak alıyor, sona değil. */
const stringFormat: CultureRule = {
  key: 'stringFormat',
  run(context) {
    const findings: Finding<RuleKey>[] = [];

    for (const match of codeMatches(context, /\bstring\.Format\s*\(/gi)) {
      const open = match.index + match[0].length - 1;
      const close = closeParen(context, open);
      if (close === -1 || EXPLICIT.test(context.source.slice(open, close))) continue;

      findings.push(
        finding(
          context,
          'stringFormat',
          'warning',
          match.index,
          match.index + match[0].length,
          [{ start: open + 1, end: open + 1, text: 'CultureInfo.InvariantCulture, ' }],
          'string.Format(…)',
        ),
      );
    }
    return findings;
  },
};

/**
 * `RegexOptions.IgnoreCase` sunucunun kültürünü izliyor: `tr-TR` altında
 * `I` ile `i` FARKLI harfler, yani `[A-Z]` ile eşleşen şey değişiyor.
 *
 * Düzeltme `| RegexOptions.CultureInvariant` eklemek ve bu güvenli —
 * ama yalnızca AYNI ifadede zaten yoksa.
 */
const regexIgnoreCase: CultureRule = {
  key: 'regexIgnoreCase',
  run(context) {
    const findings: Finding<RuleKey>[] = [];

    for (const match of codeMatches(context, /\bRegexOptions\.IgnoreCase\b/g)) {
      const line = context.source.slice(
        context.source.lastIndexOf('\n', match.index) + 1,
        (() => {
          const next = context.source.indexOf('\n', match.index);
          return next === -1 ? context.source.length : next;
        })(),
      );
      if (line.includes('CultureInvariant')) continue;

      const end = match.index + match[0].length;
      findings.push(
        finding(context, 'regexIgnoreCase', 'warning', match.index, end, [
          { start: end, end, text: ' | RegexOptions.CultureInvariant' },
        ]),
      );
    }
    return findings;
  },
};

const RULES: readonly CultureRule[] = [
  toUpperLower,
  startsEndsWith,
  indexOfString,
  stringCompare,
  numberParse,
  tryParse,
  dateParse,
  formatString,
  stringFormat,
  regexIgnoreCase,
];

export function analyze(source: string): ToolResult<Finding<RuleKey>[]> {
  if (source.trim() === '') return err('cultureEmpty');
  return ok(runRules(buildContext(source, scanCSharp(source).spans) as LintContext, RULES));
}
