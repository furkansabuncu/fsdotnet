export type BindStyle = 'oracle' | 'sqlserver';
export type BindType = 'auto' | 'number' | 'text' | 'date' | 'null';

export interface BindValue {
  type: BindType;
  value: string;
}

/**
 * Sorgudaki bind adlarını çıkarır.
 *
 * Kritik nokta: dize literalleri ve yorumlar atlanır. Aksi hâlde
 * `to_char(t, 'hh24:mi')` içindeki `:mi` bind sanılır — Oracle'ın kendisi de
 * bu tuzağa `ORA-01745` ile düşürür, ama biz düşmemeliyiz.
 *
 * Sıra korunur ve tekrar edenler tekilleştirilir; aynı bind sorguda birden
 * çok yerde kullanılabilir.
 */
export function extractBinds(sql: string, style: BindStyle): string[] {
  const marker = style === 'oracle' ? ':' : '@';
  const found: string[] = [];
  const seen = new Set<string>();

  let i = 0;
  while (i < sql.length) {
    const char = sql[i] as string;
    const next = sql[i + 1];

    if (char === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    if (char === "'" || char === '"') {
      const quote = char;
      i += 1;
      while (i < sql.length) {
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (char === marker) {
      // Oracle'da `::` tip dönüşümü değildir ama PostgreSQL alışkanlığıyla
      // yazılmış olabilir; iki nokta üst üste bind başlatmaz.
      if (next === marker) {
        i += 2;
        continue;
      }
      let j = i + 1;
      while (j < sql.length && /[A-Za-z0-9_]/.test(sql[j] as string)) j += 1;
      const name = sql.slice(i + 1, j);
      if (name !== '' && !seen.has(name)) {
        seen.add(name);
        found.push(name);
      }
      i = j;
      continue;
    }

    i += 1;
  }

  return found;
}

const NUMERIC = /^-?\d+(\.\d+)?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/;

/** Tip `auto` ise değerin şeklinden karar verir. */
export function inferType(value: string): Exclude<BindType, 'auto'> {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'null') return 'null';
  if (ISO_DATE.test(trimmed)) return 'date';
  // Baştaki sıfır anlamlıdır: "007" bir kod, sayı değil.
  if (NUMERIC.test(trimmed) && !/^-?0\d/.test(trimmed)) return 'number';
  return 'text';
}

/** Değeri SQL literaline çevirir. */
export function toLiteral(bind: BindValue, style: BindStyle): string {
  const type = bind.type === 'auto' ? inferType(bind.value) : bind.type;
  const raw = bind.value.trim();

  switch (type) {
    case 'null':
      return 'NULL';
    case 'number':
      return raw === '' ? 'NULL' : raw;
    case 'date':
      // Oracle'da açık maske vermek ORA-01861'i önler; SQL Server sıradan
      // dize literalini tarihe kendisi çevirir.
      return style === 'oracle'
        ? raw.includes(':')
          ? `TO_DATE('${raw}', 'YYYY-MM-DD HH24:MI:SS')`
          : `DATE '${raw}'`
        : `'${raw}'`;
    case 'text':
      return `'${bind.value.replace(/'/g, "''")}'`;
  }
}

export interface SubstituteResult {
  sql: string;
  /** Değeri girilmemiş bind'ler — çıktıda olduğu gibi bırakılır. */
  missing: string[];
}

/**
 * Bind'leri değerleriyle değiştirir; sonuç SQL Developer'a yapıştırılabilir.
 *
 * Bu çıktı DEBUG İÇİNDİR, koda konmak için değil — üretimde bind kullanmak
 * hem enjeksiyonu hem shared pool şişmesini (ORA-04031) engeller.
 */
export function substituteBinds(
  sql: string,
  values: Record<string, BindValue>,
  style: BindStyle,
): SubstituteResult {
  const marker = style === 'oracle' ? ':' : '@';
  const names = extractBinds(sql, style);
  const missing = names.filter((name) => (values[name]?.value ?? '') === '' && values[name]?.type !== 'null');

  let out = '';
  let i = 0;

  while (i < sql.length) {
    const char = sql[i] as string;
    const next = sql[i + 1];

    // Yorum ve literaller aynen geçer — içlerinde değişiklik yapılmaz.
    if (char === '-' && next === '-') {
      const end = sql.indexOf('\n', i);
      const stop = end === -1 ? sql.length : end;
      out += sql.slice(i, stop);
      i = stop;
      continue;
    }

    if (char === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      out += sql.slice(i, stop);
      i = stop;
      continue;
    }

    if (char === "'" || char === '"') {
      const quote = char;
      let literal = quote;
      i += 1;
      while (i < sql.length) {
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            literal += quote + quote;
            i += 2;
            continue;
          }
          literal += quote;
          i += 1;
          break;
        }
        literal += sql[i];
        i += 1;
      }
      out += literal;
      continue;
    }

    if (char === marker && next !== marker) {
      let j = i + 1;
      while (j < sql.length && /[A-Za-z0-9_]/.test(sql[j] as string)) j += 1;
      const name = sql.slice(i + 1, j);
      const bind = values[name];

      if (name !== '' && bind && !missing.includes(name)) {
        out += toLiteral(bind, style);
      } else {
        out += sql.slice(i, j);
      }
      i = j;
      continue;
    }

    out += char;
    i += 1;
  }

  return { sql: out, missing };
}
