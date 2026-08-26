import { splitClauses, splitList, type Clause } from '../../lint/sql';
import { finding, patternRule, type Rule } from '../../lint/engine';
import type { Finding } from '../../lint/types';
import type { RuleKey, SqlContext } from './sqlFix';

/**
 * Yapısal kurallar — sorgunun ŞEKLİNE bakanlar.
 *
 * Faz 1'deki kurallar tek tek token'lara bakıyordu; buradakiler yan
 * tümceleri birbiriyle karşılaştırıyor. Hiçbiri şema gerektirmiyor:
 * `GROUP BY` kapsamı, agregatın yeri ve takma adların tutarlılığı sorgunun
 * metninden tamamen belirlenebiliyor. Belirlenemeyecek olanlar (ORA-00918
 * belirsiz kolon, yanlış yazılmış ad) bilerek dışarıda.
 *
 * Ayrı dosya: Faz 1 zaten 600 satırdı ve bu kuralların ortak yardımcıları
 * (yan tümce haritası, select listesi) yalnızca burada kullanılıyor.
 */

type SqlRule = Rule<RuleKey, SqlContext>;

const AGGREGATE = /\b(COUNT|SUM|AVG|MIN|MAX|LISTAGG|STDDEV|VARIANCE)\s*\(/i;

/** Yan tümceyi anahtarına göre bulur; yoksa undefined. */
const clauseOf = (clauses: readonly Clause[], keyword: string) =>
  clauses.find((clause) => clause.keyword === keyword);

/**
 * `GROUP BY` kapsamı — `ORA-00979: not a GROUP BY expression`.
 *
 * Kural pazarlıksız: select listesindeki agregat OLMAYAN her ifade
 * GROUP BY'da da bulunmak zorunda. İkisini karşılaştırmak yeterli, şema
 * gerekmiyor.
 *
 * Karşılaştırma metin üzerinden ve normalleştirilerek yapılıyor: takma ad
 * atılıyor, boşluk sadeleşiyor, büyük/küçük harf yok sayılıyor. Bu bir
 * ifade ağacı değil — `a+b` ile `a + b` eşleşir ama `b+a` eşleşmez.
 * Yanlış ALARM üretmemek için eşleşmeyen ifade yalnızca uyarı.
 */
const normalise = (expression: string) =>
  expression
    // Sondaki takma ad: `k.baslik AS ad` ya da `k.baslik ad`.
    .replace(/\s+(AS\s+)?[A-Za-z_]\w*\s*$/i, (whole) => (/^\s+AS\s+/i.test(whole) ? '' : whole))
    .replace(/\s+/g, '')
    .toUpperCase();

const groupByScope: SqlRule = {
  key: 'groupByScope',
  run(context) {
    const clauses = splitClauses(context.source);
    const group = clauseOf(clauses, 'GROUP BY');
    const select = clauseOf(clauses, 'SELECT');
    if (group === undefined || select === undefined) return [];

    const grouped = new Set(splitList(group.body).map((item) => normalise(item.text)));

    return splitList(select.body)
      .filter((item) => item.text !== '*' && !AGGREGATE.test(item.text))
      .filter((item) => {
        const key = normalise(item.text);
        // Takma adı atılmış hâli de denenmeli: GROUP BY takma ad kabul
        // etmediği için orada ham ifade yazılı olur.
        return !grouped.has(key) && !grouped.has(key.replace(/AS\w+$/, ''));
      })
      .map((item) => {
        const start = select.bodyStart + item.offset;
        return finding(context, 'groupByScope', 'error', start, start + item.text.length, [], item.text);
      });
  },
};

/**
 * `WHERE` içinde agregat — `ORA-00934: group function is not allowed here`.
 *
 * Doğrusu `HAVING`. Otomatik düzeltme yok: koşulu taşımak `HAVING` yan
 * tümcesi kurmayı ya da mevcut olana eklemeyi gerektiriyor ve arada
 * `AND`/`OR` önceliği bozulabilir.
 */
const aggregateInWhere: SqlRule = {
  key: 'aggregateInWhere',
  run(context) {
    const where = clauseOf(splitClauses(context.source), 'WHERE');
    if (where === undefined) return [];

    const match = AGGREGATE.exec(where.body);
    if (match === null) return [];

    const start = where.bodyStart + match.index;
    return [finding(context, 'aggregateInWhere', 'error', start, start + match[0].length, [], match[0])];
  },
};

/**
 * `ON` koşulu olmayan `JOIN` — `ORA-00905: missing keyword`.
 *
 * `CROSS JOIN` ve `NATURAL JOIN` bilerek dışarıda: ikisinin de `ON`
 * alması yasak.
 */
const joinWithoutOn: SqlRule = {
  key: 'joinWithoutOn',
  run(context) {
    const findings: Finding<RuleKey>[] = [];

    for (const clause of splitClauses(context.source)) {
      if (!clause.keyword.endsWith('JOIN')) continue;
      if (clause.keyword === 'CROSS JOIN' || clause.keyword === 'NATURAL JOIN') continue;
      if (/\bON\b|\bUSING\s*\(/i.test(clause.body)) continue;

      findings.push(
        finding(context, 'joinWithoutOn', 'error', clause.start, clause.bodyStart, [], clause.keyword),
      );
    }
    return findings;
  },
};

/**
 * Tanımlanmamış takma ad.
 *
 * `FROM`/`JOIN` yan tümcelerindeki takma adlar toplanıyor, sonra sorgunun
 * geri kalanındaki `x.kolon` önekleri onlarla karşılaştırılıyor. Şema
 * gerekmiyor çünkü sorulan şey kolonun VARLIĞI değil, önekin tanımlı olup
 * olmadığı.
 *
 * Tablo adının kendisi de önek olarak kullanılabildiği için o da kümeye
 * giriyor; şema adı (`sema.tablo.kolon`) yanlış alarm üretmesin diye
 * iki noktalı önekler atlanıyor.
 */
const SOURCE_ALIAS = /^\s*(?:"[^"\n]*"|[A-Za-z_][\w$#]*(?:\.[A-Za-z_][\w$#]*)*)\s*(?:AS\s+)?([A-Za-z_]\w*)?/i;
const QUALIFIED = /(?:^|[^\w.$"])([A-Za-z_]\w*)\.(?![\w$]*\s*\()/g;
const NOT_ALIAS = /^(SELECT|FROM|WHERE|AND|OR|ON|NOT|NULL|CASE|WHEN|THEN|ELSE|END|BY|ASC|DESC|USING|INTO|SET|VALUES)$/i;

const unknownAlias: SqlRule = {
  key: 'unknownAlias',
  run(context) {
    const clauses = splitClauses(context.source);
    const defined = new Set<string>();

    for (const clause of clauses) {
      if (clause.keyword !== 'FROM' && !clause.keyword.endsWith('JOIN')) continue;

      for (const source of splitList(clause.body)) {
        // `ON` sonrası koşul kaynağın parçası değil.
        const head = source.text.split(/\bON\b/i)[0] ?? '';
        const match = SOURCE_ALIAS.exec(head);
        if (match === null) continue;

        const [whole, alias] = match;
        const table = whole.trim().split(/\s+/)[0]?.replace(/"/g, '') ?? '';
        const bare = table.includes('.') ? table.slice(table.lastIndexOf('.') + 1) : table;

        if (bare !== '') defined.add(bare.toUpperCase());
        if (alias !== undefined && !NOT_ALIAS.test(alias)) defined.add(alias.toUpperCase());
      }
    }

    // Tek kaynak yoksa önek denetimi anlamsız (alt sorgu, DUAL, vs.).
    if (defined.size === 0) return [];

    const findings: Finding<RuleKey>[] = [];
    const seen = new Set<string>();

    for (const match of matchAll(context.source, QUALIFIED)) {
      const prefix = match[1] as string;
      const upper = prefix.toUpperCase();
      if (defined.has(upper) || NOT_ALIAS.test(prefix) || seen.has(upper)) continue;

      seen.add(upper);
      const start = match.index + (match[0].length - prefix.length - 1);
      findings.push(finding(context, 'unknownAlias', 'warning', start, start + prefix.length, [], prefix));
    }
    return findings;
  },
};

/** Global kalıbın durumunu taşımadan tüm eşleşmeler. */
function matchAll(source: string, pattern: RegExp): RegExpExecArray[] {
  const regex = new RegExp(pattern.source, pattern.flags);
  const matches: RegExpExecArray[] = [];
  let match = regex.exec(source);
  while (match !== null) {
    matches.push(match);
    match = regex.exec(source);
  }
  return matches;
}

/**
 * Virgüllü join ile ANSI join karışımı.
 *
 * İkisi aynı sorguda geçerli ama okunmaz ve join koşullarının bir kısmı
 * `WHERE`e dağıldığı için eksik koşul gözden kaçıyor — kartezyen çarpım
 * hata vermeden geliyor.
 */
const mixedJoins: SqlRule = {
  key: 'mixedJoins',
  run(context) {
    const clauses = splitClauses(context.source);
    const from = clauseOf(clauses, 'FROM');
    const hasAnsi = clauses.some((clause) => clause.keyword.endsWith('JOIN'));
    if (from === undefined || !hasAnsi || splitList(from.body).length < 2) return [];

    return [finding(context, 'mixedJoins', 'warning', from.start, from.bodyStart)];
  },
};

/* ------------------------------------------------------------------ */
/* 11g uyumluluğu — 12c ve sonrasının söz dizimi                        */
/* ------------------------------------------------------------------ */

/**
 * Hepsi 12c ya da sonrasında geldi ve 11g'de sözdizimi hatası veriyor.
 * Otomatik düzeltme yok: her birinin 11g karşılığı YAPISAL bir yeniden
 * yazım, ad değişikliği değil.
 */
const TWELVE_C: Record<string, string> = {
  'CROSS APPLY': 'CROSS APPLY → alt sorgu ya da JOIN (12c)',
  'OUTER APPLY': 'OUTER APPLY → LEFT JOIN + alt sorgu (12c)',
  LATERAL: 'LATERAL → alt sorgu (12c)',
  JSON_TABLE: 'JSON_TABLE (12c)',
  JSON_VALUE: 'JSON_VALUE (12c)',
  JSON_QUERY: 'JSON_QUERY (12c)',
  'ON OVERFLOW': 'LISTAGG … ON OVERFLOW (12.2)',
  'DEFAULT ON NULL': 'DEFAULT ON NULL (12c)',
  IDENTITY: 'GENERATED … AS IDENTITY (12c) → 11g: sequence + trigger',
};

const twelveCSyntax = patternRule(
  'twelveCSyntax',
  'warning',
  new RegExp(
    String.raw`\b(${Object.keys(TWELVE_C)
      .map((word) => word.replace(/ /g, String.raw`\s+`))
      .join('|')})\b`,
    'gi',
  ),
  (match) => {
    const key = (match[1] as string).replace(/\s+/g, ' ').toUpperCase();
    return { detail: TWELVE_C[key] ?? key };
  },
);

/**
 * `ON OVERFLOW` olmadan `LISTAGG` — `ORA-01489: result of string
 * concatenation is too long`.
 *
 * 4000 baytı aşınca patlıyor ve bu ancak veri büyüyünce oluyor, yani
 * genelde üretimde. 11g'de `ON OVERFLOW` de yok; çözüm satır sayısını
 * sınırlamak ya da CLOB'a geçmek.
 */
const listaggOverflow = patternRule('listaggOverflow', 'warning', /\bLISTAGG\s*\(/gi, (match, context) => {
  const rest = context.source.slice(match.index, match.index + 400);
  return /ON\s+OVERFLOW/i.test(rest) ? null : {};
});

export const STRUCTURAL_RULES: readonly SqlRule[] = [
  groupByScope,
  aggregateInWhere,
  joinWithoutOn,
  unknownAlias,
  mixedJoins,
  twelveCSyntax,
  listaggOverflow,
];
