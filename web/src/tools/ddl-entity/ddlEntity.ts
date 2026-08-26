import { err, ok, type ToolResult } from '../types';
import { splitList } from '../../lint/sql';

/**
 * Oracle `CREATE TABLE` → EF Core entity + mapping.
 *
 * Mevcut üreteçlerin hemen hepsi SQL Server odaklı, dolayısıyla Oracle'ın
 * tek sayısal tipini (`NUMBER`) doğru bölemiyorlar. Oysa `NUMBER`ın hangi
 * .NET tipine düşeceği tamamen ondalık BASAMAK ve HASSASİYET'e bağlı ve
 * yanlış seçim ya taşma ya sessiz yuvarlama demek.
 *
 * Şema erişimi yok; girdi metnin kendisi. Söylenebilecek her şey DDL'de
 * yazılı: tip, hassasiyet, null'luk, varsayılan ve anahtar.
 */

export interface Column {
  /** DDL'deki hâli — kolon adı olarak bu kullanılıyor. */
  name: string;
  /** Üretilen C# property adı. */
  property: string;
  type: string;
  nullable: boolean;
  isKey: boolean;
  /** `VARCHAR2(400)` → 400; sayısal tiplerde undefined. */
  maxLength?: number;
  /** Ham Oracle tipi — uyarı ve yorum metinlerinde geçiyor. */
  oracleType: string;
}

export interface EntityWarning {
  key: 'unknownType' | 'noPrimaryKey' | 'compositeKey' | 'numberPrecision';
  detail?: string;
}

export interface EntityResult {
  className: string;
  table: string;
  columns: Column[];
  warnings: EntityWarning[];
  entity: string;
  configuration: string;
}

export interface EntityOptions {
  /** Kapalıyken kolon adı property adı olarak aynen kullanılıyor. */
  pascalCase: boolean;
  /** `NUMBER(1)` bir bayrak mı, yoksa küçük bir sayı mı. */
  numberOneAsBool: boolean;
}

/* Tablo adı: tırnaklı ya da çıplak, şema öneki olabilir. Tırnaklı hâli
   boşluk içerebildiği için `[\w$#]+` yetmiyor. */
const TABLE = /CREATE\s+(?:GLOBAL\s+TEMPORARY\s+)?TABLE\s+(?:(?:"[^"\n]*"|[\w$#]+)\.)?("[^"\n]*"|[\w$#]+)\s*\(/i;

/*
 * Kolon tanımı ADIM ADIM okunuyor, tek regex'le değil.
 *
 * Tek regex denendi ve sessizce yanlış çalıştı: tip grubunu tembel yazmak
 * gerekiyordu (yoksa `NOT NULL`u da yutuyordu), ama tembel grup hassasiyet
 * parantezi İSTEĞE BAĞLI olduğu için hemen pes ediyor — `NUMBER(9)` tipi
 * `N` olarak okunuyor, hassasiyet hiç yakalanmıyor ve her kolon `string`
 * çıkıyordu. Adımlar ayrılınca her parçanın nerede bittiği kesinleşiyor.
 */
const COLUMN_NAME = /^("[^"\n]*"|[\w$#]+)\s+/;
const BASE_TYPE = /^([A-Za-z][A-Za-z0-9_]*)/;
const PRECISION = /^\s*\(\s*(\d+)\s*(?:,\s*(-?\d+)\s*)?(?:BYTE|CHAR)?\s*\)/i;

/* Tip adının ikinci ve sonraki kelimeleri. Liste kapalı: `NOT`, `DEFAULT`
   ve `PRIMARY` buraya girmediği için tipin nerede bittiği belirsiz kalmıyor. */
const TYPE_TAIL = /^(?:\s+(?:WITH|WITHOUT|LOCAL|TIME|ZONE|PRECISION|VARYING|RAW|DAY|TO|SECOND|MINUTE|HOUR|YEAR|MONTH)\b)+/i;

interface ParsedColumn {
  name: string;
  type: string;
  precision?: number;
  scale?: number;
  tail: string;
}

function parseColumn(text: string): ParsedColumn | null {
  const name = COLUMN_NAME.exec(text);
  if (name === null) return null;

  let rest = text.slice(name[0].length);
  const base = BASE_TYPE.exec(rest);
  if (base === null) return null;

  rest = rest.slice(base[0].length);
  let type = base[1] as string;

  /* Hassasiyet tip adının ORTASINDA olabiliyor: `TIMESTAMP(6) WITH TIME
     ZONE`. Bu yüzden önce parantez, sonra kalan tip kelimeleri okunuyor. */
  const precision = PRECISION.exec(rest);
  if (precision !== null) rest = rest.slice(precision[0].length);

  const tail = TYPE_TAIL.exec(rest);
  if (tail !== null) {
    type += tail[0].replace(/\s+/g, ' ');
    rest = rest.slice(tail[0].length);
  }

  return {
    name: strip(name[1] as string),
    type,
    ...(precision?.[1] === undefined ? {} : { precision: Number(precision[1]) }),
    ...(precision?.[2] === undefined ? {} : { scale: Number(precision[2]) }),
    tail: rest,
  };
}

/** Kolon değil, tablo düzeyi kısıt olan öğeler. */
const CONSTRAINT = /^\s*(CONSTRAINT|PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|CHECK)\b/i;

const strip = (name: string) => name.replace(/"/g, '');

/** `siparis_kalem` → `SiparisKalem`; `SIPARIS` → `Siparis`. */
export function toPascalCase(name: string): string {
  return strip(name)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Oracle tipini .NET tipine eşler.
 *
 * `NUMBER` özel: tek bir tip adı altında bool'dan decimal'e kadar her şey
 * var ve ayrım hassasiyetle yapılıyor. Sınırlar `int`/`long`ın gerçek
 * kapasitesinden geliyor — 10 haneli bir `NUMBER` `int`e sığmaz.
 */
export function mapType(
  oracleType: string,
  precision: number | undefined,
  scale: number | undefined,
  options: EntityOptions,
): { type: string; warning?: EntityWarning } {
  const type = oracleType.trim().toUpperCase().replace(/\s+/g, ' ');

  if (type === 'NUMBER' || type === 'NUMERIC' || type === 'DECIMAL' || type === 'INTEGER' || type === 'INT') {
    if (type === 'INTEGER' || type === 'INT') return { type: 'int' };
    if (precision === undefined) {
      // Hassasiyetsiz NUMBER 38 haneye kadar gidiyor; decimal en yakın olan.
      return { type: 'decimal', warning: { key: 'numberPrecision', detail: 'NUMBER' } };
    }
    if ((scale ?? 0) > 0) return { type: 'decimal' };
    if (precision === 1 && options.numberOneAsBool) return { type: 'bool' };
    if (precision <= 4) return { type: 'short' };
    if (precision <= 9) return { type: 'int' };
    if (precision <= 18) return { type: 'long' };
    return { type: 'decimal' };
  }

  if (/^N?VARCHAR2?$|^N?CHAR$|^N?CLOB$|^LONG$|^ROWID$|^UROWID$/.test(type)) return { type: 'string' };
  if (/^BLOB$|^RAW$|^LONG RAW$|^BFILE$/.test(type)) return { type: 'byte[]' };
  if (type === 'DATE') return { type: 'DateTime' };
  if (type.startsWith('TIMESTAMP')) {
    return { type: type.includes('TIME ZONE') ? 'DateTimeOffset' : 'DateTime' };
  }
  if (type.startsWith('INTERVAL DAY')) return { type: 'TimeSpan' };
  if (type === 'BINARY_FLOAT' || type === 'FLOAT' || type === 'REAL') return { type: 'float' };
  if (type === 'BINARY_DOUBLE' || type === 'DOUBLE PRECISION') return { type: 'double' };

  return { type: 'string', warning: { key: 'unknownType', detail: oracleType.trim() } };
}

/** Değer tipiyse `?` ekler; `string` ve `byte[]` zaten referans tipi. */
const nullableType = (type: string, nullable: boolean) => (nullable ? `${type}?` : type);

export function generateEntity(ddl: string, options: EntityOptions): ToolResult<EntityResult> {
  if (ddl.trim() === '') return err('ddlEmpty');

  const header = TABLE.exec(ddl);
  if (header === null) return err('ddlNoTable');

  const open = header.index + header[0].length - 1;
  const body = ddl.slice(open + 1, matchingParen(ddl, open));

  const warnings: EntityWarning[] = [];
  const columns: Column[] = [];
  const keys: string[] = [];

  for (const item of splitList(body)) {
    if (CONSTRAINT.test(item.text)) {
      const primary = /PRIMARY\s+KEY\s*\(([^)]*)\)/i.exec(item.text);
      if (primary !== null) {
        keys.push(...splitList(primary[1] as string).map((part) => strip(part.text).toUpperCase()));
      }
      continue;
    }

    const parsed = parseColumn(item.text.trim());
    if (parsed === null) continue;

    const { name, type: oracleType, precision, scale, tail } = parsed;
    const mapped = mapType(oracleType, precision, scale, options);
    if (mapped.warning !== undefined) {
      warnings.push({ ...mapped.warning, detail: `${name}: ${mapped.warning.detail ?? ''}` });
    }

    if (/\bPRIMARY\s+KEY\b/i.test(tail)) keys.push(name.toUpperCase());

    const isText = mapped.type === 'string' && precision !== undefined;
    columns.push({
      name,
      property: options.pascalCase ? toPascalCase(name) : name,
      type: mapped.type,
      // NOT NULL yazmıyorsa Oracle varsayılanı null kabul etmek.
      nullable: !/\bNOT\s+NULL\b/i.test(tail),
      isKey: false,
      oracleType: oracleType.toUpperCase(),
      ...(isText ? { maxLength: precision } : {}),
    });
  }

  if (columns.length === 0) return err('ddlNoColumns');

  for (const column of columns) {
    column.isKey = keys.includes(column.name.toUpperCase());
    // Anahtar hiçbir zaman null olamaz, DDL söylemese bile.
    if (column.isKey) column.nullable = false;
  }

  if (keys.length === 0) warnings.push({ key: 'noPrimaryKey' });
  if (keys.length > 1) warnings.push({ key: 'compositeKey', detail: keys.join(', ') });

  const table = strip(header[1] as string);
  const className = toPascalCase(table);

  return ok({
    className,
    table,
    columns,
    warnings,
    entity: renderEntity(className, columns),
    configuration: renderConfiguration(className, table, columns, keys.length > 0),
  });
}

/** Açılış parantezinin eşi; bulunamazsa metnin sonu. */
function matchingParen(text: string, open: number): number {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '(') depth += 1;
    else if (text[index] === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return text.length;
}

function renderEntity(className: string, columns: readonly Column[]): string {
  const lines = columns.map((column) => {
    const type = nullableType(column.type, column.nullable);
    return `    public ${type} ${column.property} { get; set; }`;
  });

  return [`public class ${className}`, '{', ...lines, '}'].join('\n');
}

/**
 * Eşleme ayrı bir sınıf olarak üretiliyor, attribute olarak değil:
 * `HasColumnName` ve `HasMaxLength` gibi Oracle'a özgü ayarlar tek yerde
 * toplanınca entity temiz kalıyor ve `DbContext` bunları otomatik buluyor.
 */
function renderConfiguration(
  className: string,
  table: string,
  columns: readonly Column[],
  hasKey: boolean,
): string {
  const keys = columns.filter((column) => column.isKey);
  const lines: string[] = [`        builder.ToTable("${table.toUpperCase()}");`];

  if (hasKey) {
    const selector =
      keys.length === 1
        ? `x => x.${keys[0]!.property}`
        : `x => new { ${keys.map((key) => `x.${key.property}`).join(', ')} }`;
    lines.push(`        builder.HasKey(${selector});`);
  }

  lines.push('');

  for (const column of columns) {
    const parts = [`        builder.Property(x => x.${column.property})`];
    if (column.property.toUpperCase() !== column.name.toUpperCase()) {
      parts.push(`.HasColumnName("${column.name.toUpperCase()}")`);
    }
    if (column.maxLength !== undefined) parts.push(`.HasMaxLength(${column.maxLength})`);
    if (!column.nullable) parts.push('.IsRequired()');

    // Hiçbir ayar gerekmiyorsa satırı hiç yazma — `Property(x => x.A);`
    // tek başına hiçbir şey söylemiyor ve dosyayı şişiriyor.
    if (parts.length > 1) lines.push(`${parts.join('')};`);
  }

  return [
    `public class ${className}Configuration : IEntityTypeConfiguration<${className}>`,
    '{',
    `    public void Configure(EntityTypeBuilder<${className}> builder)`,
    '    {',
    ...lines,
    '    }',
    '}',
  ].join('\n');
}
