import { err, ok, type ToolResult } from '../types';
import { scanSql } from '../../lint/sql';
import { codeMask } from '../../lint/types';

/**
 * SELECT ifadesini LINQ'e çevirir.
 *
 * **Bu bir derleyici değil, başlangıç noktası üretecidir.** SQL ile LINQ
 * arasındaki eşleme tek yönlü belirsiz: `LEFT JOIN` sonucunun C#'ta nullable
 * olup olmadığı, `GROUP BY` sonrası projeksiyonun anonim tip mi kayıt mı
 * olacağı, tablo adının hangi `DbSet`'e karşılık geldiği — hiçbiri SQL
 * metninde yazmıyor. Araç en olası karşılığı üretir; çeviremediği parçayı
 * SİLMEZ, çıktıya `TODO` satırı olarak bırakır. Sessizce yanlış kod
 * üretmektense görünür biçimde eksik kod üretmek doğru.
 *
 * Sunucuya gitmiyor: bu iş için düşünülen `ScriptDom` yalnızca T-SQL okuyor,
 * buradaki sorgular ise Oracle (ADR-0001 revizyonu).
 */

export type LinqSyntax = 'query' | 'method';

export interface LinqOptions {
  syntax: LinqSyntax;
  /** `db.Kitap` içindeki `db` — DbContext değişkeninin adı. */
  context: string;
}

/* ------------------------------------------------------------- belirteçler */

/** Dize ve parantez içine bakmadan üst seviye anahtar kelimeleri bulur. */
function splitTopLevel(sql: string, keywords: readonly string[]): Map<string, string[]> {
  const upper = sql.toUpperCase();
  const found: { keyword: string; start: number; end: number }[] = [];

  /* Dize, tanımlayıcı ve yorumları ayıklamak `lint/sql` ile ORTAK.
     Burada eskiden ayrı bir tırnak takibi vardı; hem ikinci bir kopyaydı
     hem de yorumları görmüyordu — `-- from x` yazan bir satır yan tümce
     sanılıyordu. */
  const mask = codeMask(sql, scanSql(sql).spans);

  let depth = 0;
  for (let index = 0; index < sql.length; index += 1) {
    if (!mask[index]) continue;
    const char = sql[index]!;

    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth !== 0) continue;

    for (const keyword of keywords) {
      if (!upper.startsWith(keyword, index)) continue;
      // Sözcük sınırı: `ORDERS` tablosu `ORDER BY` sanılmasın.
      const before = index === 0 ? ' ' : sql[index - 1]!;
      const after = sql[index + keyword.length] ?? ' ';
      if (/[\w$]/.test(before) || /[\w$]/.test(after)) continue;
      found.push({ keyword, start: index, end: index + keyword.length });
      index += keyword.length - 1;
      break;
    }
  }

  const clauses = new Map<string, string[]>();
  for (const [i, entry] of found.entries()) {
    const stop = found[i + 1]?.start ?? sql.length;
    /* Aynı anahtar birden fazla görülebilir (JOIN). Parçalar AYRI tutuluyor;
       tek dizede birleştirmek onları sonradan ayırmayı imkânsız kılardı. */
    const body = sql.slice(entry.end, stop).trim();
    const existing = clauses.get(entry.keyword);
    if (existing) existing.push(body);
    else clauses.set(entry.keyword, [body]);
  }
  return clauses;
}

/** Tek görülmesi beklenen yan tümcede ilk parçayı verir. */
function one(clauses: Map<string, string[]>, keyword: string): string | null {
  const value = clauses.get(keyword)?.[0];
  return value === undefined || value === '' ? null : value;
}

/** `KITAP H` / `KITAP AS H` / `SCHEMA.KITAP H` → tablo + takma ad. */
function parseSource(text: string): { table: string; alias: string } {
  const cleaned = text.replace(/\s+AS\s+/i, ' ').trim();
  const [rawTable = '', rawAlias] = cleaned.split(/\s+/);
  const table = rawTable.includes('.') ? rawTable.slice(rawTable.lastIndexOf('.') + 1) : rawTable;
  const bare = table.replace(/"/g, '');
  return { table: bare, alias: (rawAlias ?? bare).replace(/"/g, '') };
}

/** `TBLSIPARISKALEM` → `Tblsipariskalem`, `kitap_kayit` → `KitapKayit`. */
export function toEntityName(table: string): string {
  const words = table.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.map((word) => word[0]!.toUpperCase() + word.slice(1).toLowerCase()).join('');
}

/** Range değişkeni: takma addan güvenli bir C# tanımlayıcısı. */
function rangeVariable(alias: string): string {
  return alias.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'x';
}

/* ------------------------------------------------------------ ifade çevirisi */

const FUNCTIONS: readonly [RegExp, string][] = [
  [/\bUPPER\s*\(([^()]+)\)/gi, '$1.ToUpper()'],
  [/\bLOWER\s*\(([^()]+)\)/gi, '$1.ToLower()'],
  [/\bTRIM\s*\(([^()]+)\)/gi, '$1.Trim()'],
  [/\bLENGTH\s*\(([^()]+)\)/gi, '$1.Length'],
  [/\bLEN\s*\(([^()]+)\)/gi, '$1.Length'],
];

/**
 * SQL takma adını LINQ range değişkenine çevirir: `H.AD` → `h.AD`.
 *
 * Bu adım olmadan üretilen kod DERLENMEZ — sorgu `from h in …` diyip
 * gövdede `H.AD` yazardı. Eşleme büyük/küçük harf duyarsız, çünkü SQL öyle.
 */
function renameAliases(text: string, aliases: ReadonlyMap<string, string>): string {
  if (aliases.size === 0) return text;
  const pattern = new RegExp(`\\b(${[...aliases.keys()].join('|')})\\.`, 'gi');
  return text.replace(pattern, (whole, alias: string) => {
    const variable = aliases.get(alias.toLowerCase());
    return variable === undefined ? whole : `${variable}.`;
  });
}

/* Dizeler yer tutucuya çekilirken sayı KULLANILMIYOR: `WHERE id = 5`
   içindeki 5'i geri koyma adımı dize sanardı. `@@S0@@` kalıbı SQL'de
   geçmeyecek kadar yabancı ve dönüşümlerin hiçbiri ona dokunmuyor. */
const PLACEHOLDER = /@@S(\d+)@@/g;

const NOT_PREFIX = /^NOT/i;

/**
 * Bir SQL koşulunu / ifadesini C# söz dizimine çevirir.
 *
 * Dizeler önce yerinden çıkarılır: aksi hâlde `'A AND B'` metnindeki AND
 * operatöre çevrilirdi.
 */
export function translateExpression(
  sql: string,
  aliases: ReadonlyMap<string, string> = new Map(),
): string {
  const literals: string[] = [];
  let text = sql.replace(/'((?:[^']|'')*)'/g, (_, body: string) => {
    literals.push(`"${body.replace(/''/g, "'").replace(/"/g, '\\"')}"`);
    return `@@S${literals.length - 1}@@`;
  });

  for (const [pattern, replacement] of FUNCTIONS) text = text.replace(pattern, replacement);

  /* İki argümanlı NVL/ISNULL/COALESCE null birleştirme operatörüne düşer.
     Argümanlar trim ediliyor: `NVL(a, b)` içindeki virgül sonrası boşluk
     yoksa `(a ??  b)` gibi çift boşluklu çıktı üretiliyordu. */
  text = text.replace(
    /\b(?:NVL|ISNULL|COALESCE)\s*\(([^(),]+),([^()]+)\)/gi,
    (_, left: string, right: string) => `(${left.trim()} ?? ${right.trim()})`,
  );

  text = text
    .replace(/\bIS\s+NOT\s+NULL\b/gi, '!= null')
    .replace(/\bIS\s+NULL\b/gi, '== null')
    // `NOT IN` / `NOT LIKE` tek belirtece indiriliyor; sonraki adımlarda
    // `NOT` tek başına `!` olacağı için ayrı kalırsa parçalanırdı.
    .replace(/\bNOT\s+IN\b/gi, 'NOTIN')
    .replace(/\bNOT\s+LIKE\b/gi, 'NOTLIKE');

  // BETWEEN a AND b → (x >= a && x <= b)
  text = text.replace(
    /([\w.]+)\s+BETWEEN\s+(\S+)\s+AND\s+(\S+)/gi,
    (_, column: string, low: string, high: string) => `(${column} >= ${low} && ${column} <= ${high})`,
  );

  // IN (...) → new[] { ... }.Contains(x)
  text = text.replace(
    /([\w.]+)\s*(NOTIN|\bIN\b)\s*\(([^()]*)\)/gi,
    (_, column: string, operator: string, list: string) => {
      const values = list.split(',').map((value) => value.trim()).filter(Boolean);
      const negate = NOT_PREFIX.test(operator) ? '!' : '';
      return `${negate}new[] { ${values.join(', ')} }.Contains(${column})`;
    },
  );

  // LIKE — kalıbın şekli hangi metoda karşılık geldiğini belirliyor.
  text = text.replace(
    /([\w.]+)\s*(NOTLIKE|\bLIKE\b)\s*@@S(\d+)@@/gi,
    (_, column: string, operator: string, index: string) => {
      const literal = literals[Number(index)]!;
      const body = literal.slice(1, -1);
      const negate = NOT_PREFIX.test(operator) ? '!' : '';
      const inner = `"${body.replace(/^%|%$/g, '')}"`;
      const leading = body.startsWith('%');
      const trailing = body.endsWith('%');
      // Ortadaki `%` ya da `_` metotlarla ifade edilemez; EF.Functions kalır.
      if (/[%_]/.test(body.slice(1, -1))) return `${negate}EF.Functions.Like(${column}, ${literal})`;
      if (leading && trailing) return `${negate}${column}.Contains(${inner})`;
      if (trailing) return `${negate}${column}.StartsWith(${inner})`;
      if (leading) return `${negate}${column}.EndsWith(${inner})`;
      return `${negate}(${column} == ${literal})`;
    },
  );

  text = text
    .replace(/<>/g, '!=')
    .replace(/(?<![<>!=])=(?!=)/g, '==')
    .replace(/\bAND\b/gi, '&&')
    .replace(/\bOR\b/gi, '||')
    .replace(/\bNOT\b/gi, '!');

  // Takma adlar en sonda çevriliyor: yer tutucular hâlâ yerinde olduğu için
  // dize içeriğindeki nokta içeren metinlere dokunma riski yok.
  text = renameAliases(text, aliases);

  return text.replace(PLACEHOLDER, (_, index: string) => literals[Number(index)]!).trim();
}

/* ------------------------------------------------------------------- model */

interface Join {
  kind: 'inner' | 'left';
  table: string;
  alias: string;
  on: string;
}

interface Order {
  expression: string;
  descending: boolean;
}

interface SelectModel {
  distinct: boolean;
  limit: number | null;
  columns: string[];
  from: { table: string; alias: string };
  joins: Join[];
  where: string | null;
  groupBy: string | null;
  having: string | null;
  orderBy: Order[];
  /** SQL takma adı (küçük harf) → LINQ range değişkeni. */
  aliases: Map<string, string>;
}

/* Sıra önemli: `LEFT OUTER JOIN`, `LEFT JOIN`'den ÖNCE denenmeli, yoksa
   `LEFT JOIN` eşleşir ve geriye `OUTER JOIN` kalır. */
const CLAUSES = [
  'SELECT', 'FROM', 'INNER JOIN', 'LEFT OUTER JOIN', 'LEFT JOIN', 'JOIN',
  'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'FETCH FIRST', 'LIMIT',
] as const;

function parseSelect(sql: string): ToolResult<SelectModel> {
  const trimmed = sql.trim().replace(/;\s*$/, '');
  if (!/^\s*SELECT\b/i.test(trimmed)) return err('sqlSelectOnly');

  const clauses = splitTopLevel(trimmed, CLAUSES);
  const from = one(clauses, 'FROM');
  if (from === null) return err('sqlNoFrom');

  let select = one(clauses, 'SELECT') ?? '*';
  let distinct = false;
  let limit: number | null = null;

  if (/^DISTINCT\b/i.test(select)) {
    distinct = true;
    select = select.slice('DISTINCT'.length).trim();
  }
  // SQL Server `TOP n`, Oracle 12c `FETCH FIRST n ROWS ONLY`, MySQL `LIMIT n`.
  const top = /^TOP\s+(\d+)\s*/i.exec(select);
  if (top) {
    limit = Number(top[1]);
    select = select.slice(top[0].length).trim();
  }
  const fetch = one(clauses, 'FETCH FIRST') ?? one(clauses, 'LIMIT');
  if (fetch) {
    const count = /^(\d+)/.exec(fetch);
    if (count) limit = Number(count[1]);
  }

  const joins: Join[] = [];
  const addJoins = (keyword: string, kind: Join['kind']) => {
    for (const part of clauses.get(keyword) ?? []) {
      const [source = '', condition = ''] = part.split(/\s+ON\s+/i);
      const parsed = parseSource(source);
      joins.push({ kind, table: parsed.table, alias: parsed.alias, on: condition.trim() });
    }
  };
  addJoins('JOIN', 'inner');
  addJoins('INNER JOIN', 'inner');
  addJoins('LEFT JOIN', 'left');
  addJoins('LEFT OUTER JOIN', 'left');

  const orderBy: Order[] = (one(clauses, 'ORDER BY') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({
      expression: part.replace(/\s+(ASC|DESC)\b/i, '').trim(),
      descending: /\bDESC\b/i.test(part),
    }));

  // Virgülle ayrılmış eski usul FROM listesinin yalnızca ilki alınıyor.
  const source = parseSource(from.split(',')[0]!);

  /* Takma ad → range değişkeni eşlemesi. SQL büyük/küçük harfe duyarsız
     olduğu için anahtar küçük harfe indirgeniyor. */
  const aliases = new Map<string, string>([[source.alias.toLowerCase(), rangeVariable(source.alias)]]);
  for (const join of joins) aliases.set(join.alias.toLowerCase(), rangeVariable(join.alias));

  return ok({
    distinct,
    limit,
    columns: splitColumns(select),
    from: source,
    joins,
    aliases,
    where: one(clauses, 'WHERE'),
    groupBy: one(clauses, 'GROUP BY'),
    having: one(clauses, 'HAVING'),
    orderBy,
  });
}

/** Virgülle böler ama parantez içindekine dokunmaz: `NVL(a, b)` tek kolon. */
function splitColumns(select: string): string[] {
  const columns: string[] = [];
  let depth = 0;
  let quote = '';
  let buffer = '';

  for (const char of select) {
    if (quote) {
      buffer += char;
      if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"') quote = char;
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      columns.push(buffer.trim());
      buffer = '';
      continue;
    }
    buffer += char;
  }
  if (buffer.trim() !== '') columns.push(buffer.trim());
  return columns;
}

/* ---------------------------------------------------------------- yazdırma */

/** `H.BASLIK AS AD` → ifade + hedef ad. */
function parseColumn(column: string): { expression: string; name: string | null } {
  const aliased = /^(.*?)\s+(?:AS\s+)?([\w"]+)$/is.exec(column.replace(/\s+/g, ' ').trim());
  if (aliased) return { expression: aliased[1]!.trim(), name: aliased[2]!.replace(/"/g, '') };
  return { expression: column.trim(), name: null };
}

/** `COUNT(*)` → `g.Count()`, `SUM(H.TUTAR)` → `g.Sum(i => i.TUTAR)`. */
function translateAggregate(expression: string, group: string): string | null {
  const match = /^(COUNT|SUM|AVG|MIN|MAX)\s*\((?:DISTINCT\s+)?(.+)\)$/is.exec(expression.trim());
  if (!match) return null;

  const method = match[1]![0]!.toUpperCase() + match[1]!.slice(1).toLowerCase();
  const argument = match[2]!.trim();
  if (argument === '*') return `${group}.Count()`;

  // `H.TUTAR` → `i.TUTAR`: grup elemanının kendi range değişkeni olur.
  const property = argument.includes('.') ? argument.slice(argument.indexOf('.') + 1) : argument;
  return method === 'Count' ? `${group}.Count()` : `${group}.${method}(i => i.${property})`;
}

function projection(model: SelectModel, source: string): string {
  if (model.columns.length === 1 && model.columns[0] === '*') return source;

  const grouped = model.groupBy !== null;

  /* Tek kolon, takma adsız ve gruplamasız ise anonim tip gereksiz —
     `select h.AD` hem daha kısa hem çağıran tarafta `.ToListAsync()`
     doğrudan `List<string>` veriyor. Takma ad varsa ad taşınmalı, o yüzden
     anonim tip kalıyor. */
  if (!grouped && model.columns.length === 1) {
    const only = parseColumn(model.columns[0]!);
    if (only.name === null) return translateExpression(only.expression, model.aliases);
  }

  const parts = model.columns.map((column) => {
    const { expression, name } = parseColumn(column);
    const aggregate = grouped ? translateAggregate(expression, source) : null;
    const translated = aggregate ?? translateExpression(expression, model.aliases);
    if (name === null) return translated;
    // Anonim tipte ad zaten property'den geliyorsa tekrar yazmaya gerek yok.
    return translated.endsWith(`.${name}`) ? translated : `${name} = ${translated}`;
  });

  if (grouped && model.groupBy) {
    // Gruplanan anahtar projeksiyonda geçiyorsa `g.Key` ile karşılanır.
    const key = translateExpression(model.groupBy, model.aliases);
    return `new { ${parts.map((part) => (part === key ? `Key = ${source}.Key` : part)).join(', ')} }`;
  }

  return `new { ${parts.join(', ')} }`;
}

function emitQuerySyntax(model: SelectModel, options: LinqOptions): string {
  const root = rangeVariable(model.from.alias);
  const lines = [`from ${root} in ${options.context}.${toEntityName(model.from.table)}`];

  for (const join of model.joins) {
    const variable = rangeVariable(join.alias);
    const entity = `${options.context}.${toEntityName(join.table)}`;
    const on = translateExpression(join.on, model.aliases);
    /* Sorgu söz diziminde `join … on a equals b` yalnızca EŞİTLİK kabul
       eder. Koşul başka bir şeyse çeviri kaybolmasın diye çapraz birleşim +
       `where`e düşüyor — sonuç aynı, planı farklı. */
    const equality = /^([^=]+)==([^=]+)$/.exec(on);
    if (equality) {
      const left = equality[1]!.trim();
      const right = equality[2]!.trim();
      // `equals`ın solu dış, sağı iç kaynağın alanı olmak zorunda.
      const [outer, inner] = right.startsWith(`${variable}.`) ? [left, right] : [right, left];
      if (join.kind === 'left') {
        lines.push(
          `join ${variable} in ${entity} on ${outer} equals ${inner} into ${variable}Group`,
          `from ${variable} in ${variable}Group.DefaultIfEmpty()`,
        );
      } else {
        lines.push(`join ${variable} in ${entity} on ${outer} equals ${inner}`);
      }
    } else {
      lines.push(`from ${variable} in ${entity}`, `where ${on}`);
    }
  }

  if (model.where) lines.push(`where ${translateExpression(model.where, model.aliases)}`);
  if (model.groupBy) lines.push(`group ${root} by ${translateExpression(model.groupBy, model.aliases)} into g`);
  if (model.having) lines.push(`where ${translateExpression(model.having, model.aliases)}`);

  if (model.orderBy.length > 0) {
    const parts = model.orderBy.map(
      (order) => `${translateExpression(order.expression, model.aliases)}${order.descending ? ' descending' : ''}`,
    );
    lines.push(`orderby ${parts.join(', ')}`);
  }

  lines.push(`select ${projection(model, model.groupBy ? 'g' : root)}`);

  const indented = lines.map((line, index) => (index === 0 ? line : `            ${line}`)).join('\n');
  let code = `var query = ${indented};`;

  // DISTINCT ve TOP'un sorgu söz diziminde karşılığı yok; ayrı satır olur.
  if (model.distinct) code += '\n\nquery = query.Distinct();';
  if (model.limit !== null) code += `\n\nquery = query.Take(${model.limit});`;
  return code;
}

function emitMethodSyntax(model: SelectModel, options: LinqOptions): string {
  const root = rangeVariable(model.from.alias);
  const lines = [`var query = ${options.context}.${toEntityName(model.from.table)}`];

  for (const join of model.joins) {
    const variable = rangeVariable(join.alias);
    const entity = `${options.context}.${toEntityName(join.table)}`;
    const on = translateExpression(join.on, model.aliases);
    const equality = /^([^=]+)==([^=]+)$/.exec(on);

    if (!equality) {
      lines.push(`    // TODO: eşitlik olmayan JOIN koşulu elle yazılmalı — ${on}`);
      continue;
    }

    const left = equality[1]!.trim();
    const right = equality[2]!.trim();
    const [outerKey, innerKey] = right.startsWith(`${variable}.`) ? [left, right] : [right, left];

    if (join.kind === 'inner') {
      lines.push(
        `    .Join(${entity},`,
        `        ${root} => ${outerKey},`,
        `        ${variable} => ${innerKey},`,
        `        (${root}, ${variable}) => new { ${root}, ${variable} })`,
      );
    } else {
      /* LEFT JOIN'in metot karşılığı GroupJoin + SelectMany(DefaultIfEmpty).
         Sonuç null olabilir; nullable işaretlemek çağırana ait. */
      lines.push(
        `    .GroupJoin(${entity},`,
        `        ${root} => ${outerKey},`,
        `        ${variable} => ${innerKey},`,
        `        (${root}, ${variable}Group) => new { ${root}, ${variable}Group })`,
        `    .SelectMany(x => x.${variable}Group.DefaultIfEmpty(),`,
        `        (x, ${variable}) => new { x.${root}, ${variable} })`,
      );
    }
  }

  if (model.where) lines.push(`    .Where(${root} => ${translateExpression(model.where, model.aliases)})`);

  if (model.groupBy) {
    lines.push(`    .GroupBy(${root} => ${translateExpression(model.groupBy, model.aliases)})`);
    if (model.having) lines.push(`    .Where(g => ${translateExpression(model.having, model.aliases)})`);
  }

  for (const [index, order] of model.orderBy.entries()) {
    const expression = translateExpression(order.expression, model.aliases);
    const method =
      index === 0
        ? order.descending
          ? 'OrderByDescending'
          : 'OrderBy'
        : order.descending
          ? 'ThenByDescending'
          : 'ThenBy';
    lines.push(`    .${method}(${root} => ${expression})`);
  }

  if (model.distinct) lines.push('    .Distinct()');
  if (model.limit !== null) lines.push(`    .Take(${model.limit})`);

  const source = model.groupBy ? 'g' : root;
  const select = projection(model, source);
  if (select !== source) lines.push(`    .Select(${source} => ${select})`);

  return `${lines.join('\n')};`;
}

export function sqlToLinq(sql: string, options: LinqOptions): ToolResult<string> {
  if (sql.trim() === '') return err('sqlSelectOnly');

  const model = parseSelect(sql);
  if (!model.ok) return model;

  return ok(
    options.syntax === 'query'
      ? emitQuerySyntax(model.value, options)
      : emitMethodSyntax(model.value, options),
  );
}
