import { err, ok, type ToolResult } from '../types';

export type CodeTarget = 'record' | 'class' | 'typescript';
export type FractionStyle = 'double' | 'decimal';

export interface GenerateOptions {
  target: CodeTarget;
  /** Kök tipin adı. Boşsa 'Root'. */
  rootName: string;
  /**
   * `hasta_id` → `HastaId` + `[JsonPropertyName("hasta_id")]`.
   * Kapalıyken JSON anahtarı olduğu gibi property adı olur.
   */
  pascalCase: boolean;
  /** C# 8+ nullable reference types: null görülen string `string?` olur. */
  nullableRefTypes: boolean;
  fraction: FractionStyle;
}

/* ---------------------------------------------------------------- çıkarım */

type Shape =
  | { kind: 'unknown' }
  | { kind: 'bool' }
  | { kind: 'int' }
  | { kind: 'long' }
  | { kind: 'fraction' }
  | { kind: 'string' }
  | { kind: 'guid' }
  | { kind: 'date' }
  | { kind: 'array'; item: Node }
  | { kind: 'object'; fields: Map<string, Field> };

interface Node {
  shape: Shape;
  /** JSON'da bu konumda `null` görüldü. */
  nullable: boolean;
}

interface Field {
  node: Node;
  /** Anahtar bazı örneklerde yoktu — dizi içindeki nesneler farklıysa olur. */
  optional: boolean;
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/* Yalnızca tarih GİBİ görünenler: `2026-08-24`, `2026-08-24T09:30:00Z`,
   `2026-08-24 09:30:00`. Serbest metni tarihe çevirmeye çalışmıyoruz —
   "3 Mart" gibi bir değeri DateTime yapmak yanlış tip üretir. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

const INT_MIN = -2_147_483_648;
const INT_MAX = 2_147_483_647;

function inferScalar(value: string | number | boolean): Shape {
  if (typeof value === 'boolean') return { kind: 'bool' };
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) return { kind: 'fraction' };
    return value >= INT_MIN && value <= INT_MAX ? { kind: 'int' } : { kind: 'long' };
  }
  if (GUID.test(value)) return { kind: 'guid' };
  if (ISO_DATE.test(value)) return { kind: 'date' };
  return { kind: 'string' };
}

function infer(value: unknown): Node {
  if (value === null || value === undefined) return { shape: { kind: 'unknown' }, nullable: true };

  if (Array.isArray(value)) {
    // Dizinin TÜM elemanları birleştirilir: ilk eleman eksik alan içeriyorsa
    // yalnızca ona bakmak tipi yanlış kurar.
    let item: Node = { shape: { kind: 'unknown' }, nullable: false };
    for (const element of value) item = merge(item, infer(element));
    return { shape: { kind: 'array', item }, nullable: false };
  }

  if (typeof value === 'object') {
    const fields = new Map<string, Field>();
    for (const [key, child] of Object.entries(value)) {
      fields.set(key, { node: infer(child), optional: false });
    }
    return { shape: { kind: 'object', fields }, nullable: false };
  }

  return { shape: inferScalar(value as string | number | boolean), nullable: false };
}

/** Sayısal tipler arasında en geniş olanı kazanır. */
const NUMERIC_RANK: Partial<Record<Shape['kind'], number>> = {
  int: 1,
  long: 2,
  fraction: 3,
};

function mergeShapes(a: Shape, b: Shape): Shape {
  if (a.kind === 'unknown') return b;
  if (b.kind === 'unknown') return a;

  if (a.kind === 'array' && b.kind === 'array') {
    return { kind: 'array', item: merge(a.item, b.item) };
  }

  if (a.kind === 'object' && b.kind === 'object') {
    const fields = new Map<string, Field>();
    for (const [key, field] of a.fields) {
      const other = b.fields.get(key);
      fields.set(
        key,
        other
          ? { node: merge(field.node, other.node), optional: field.optional || other.optional }
          : // Anahtar yalnızca bir tarafta var → o alan isteğe bağlı.
            { node: field.node, optional: true },
      );
    }
    for (const [key, field] of b.fields) {
      if (!fields.has(key)) fields.set(key, { node: field.node, optional: true });
    }
    return { kind: 'object', fields };
  }

  if (a.kind === b.kind) return a;

  const rankA = NUMERIC_RANK[a.kind];
  const rankB = NUMERIC_RANK[b.kind];
  if (rankA && rankB) return rankA >= rankB ? a : b;

  // guid/date, düz metinle karışırsa artık güvenilir değil — string'e düşer.
  const textual = new Set<Shape['kind']>(['string', 'guid', 'date']);
  if (textual.has(a.kind) && textual.has(b.kind)) return { kind: 'string' };

  return { kind: 'unknown' };
}

function merge(a: Node, b: Node): Node {
  return { shape: mergeShapes(a.shape, b.shape), nullable: a.nullable || b.nullable };
}

/* ------------------------------------------------------------- adlandırma */

/**
 * `hasta_id` → `HastaId`, `XMLHttpRequest` → `XMLHttpRequest`.
 *
 * JS'in `toUpperCase()`'i yerel ayardan BAĞIMSIZDIR (`toLocaleUpperCase('tr')`
 * değil) — yani Türkçe bir tarayıcıda bile `id` → `Id`, `İd` değil. Bu araç
 * için doğru olan da budur: C# tanımlayıcıları invariant büyük harf ister.
 */
export function toPascalCase(key: string): string {
  const words = key
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  if (words.length === 0) return 'Value';

  return words
    .map((word) => (word === word.toUpperCase() ? word : word[0]!.toUpperCase() + word.slice(1)))
    .join('');
}

const CSHARP_KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
  'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
  'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
  'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
  'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
  'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short',
  'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true',
  'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual',
  'void', 'volatile', 'while',
]);

/** Rakamla başlayan ya da anahtar kelime olan adları geçerli hâle getirir. */
function safeIdentifier(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}_]/gu, '') || 'Value';
  if (/^\d/.test(cleaned)) return `_${cleaned}`;
  return CSHARP_KEYWORDS.has(cleaned) ? `@${cleaned}` : cleaned;
}

/** Tekil ad: `hastalar` → `Hastalar` kalır ama `Items` → `Item` olur. */
function singularize(name: string): string {
  if (/ies$/i.test(name)) return `${name.slice(0, -3)}y`;
  if (/(s|x|z|ch|sh)es$/i.test(name)) return name.slice(0, -2);
  if (/[^s]s$/i.test(name)) return name.slice(0, -1);
  return name;
}

/* --------------------------------------------------------------- yazdırma */

interface Emitted {
  name: string;
  lines: string[];
}

class TypeNamer {
  private readonly used = new Set<string>();

  /** Aynı ad iki farklı şekil için istenirse ikincisi `Adres2` olur. */
  unique(desired: string): string {
    const base = safeIdentifier(desired) || 'Type';
    if (!this.used.has(base)) {
      this.used.add(base);
      return base;
    }
    let index = 2;
    while (this.used.has(`${base}${index}`)) index += 1;
    const name = `${base}${index}`;
    this.used.add(name);
    return name;
  }
}

function csharpScalar(shape: Shape, fraction: FractionStyle): string {
  switch (shape.kind) {
    case 'bool':
      return 'bool';
    case 'int':
      return 'int';
    case 'long':
      return 'long';
    case 'fraction':
      return fraction;
    case 'guid':
      return 'Guid';
    case 'date':
      return 'DateTime';
    case 'string':
      return 'string';
    default:
      return 'object';
  }
}

function typescriptScalar(shape: Shape): string {
  switch (shape.kind) {
    case 'bool':
      return 'boolean';
    case 'int':
    case 'long':
    case 'fraction':
      return 'number';
    // Guid ve tarih JSON'da metindir; TypeScript'te ayrı bir tip yok.
    case 'guid':
    case 'date':
    case 'string':
      return 'string';
    default:
      return 'unknown';
  }
}

/** C#'ta `?` eki: değer tipleri her zaman, referans tipleri yalnızca NRT açıksa. */
const VALUE_TYPES = new Set(['bool', 'int', 'long', 'double', 'decimal', 'Guid', 'DateTime']);

function generateCsharp(root: Node, options: GenerateOptions): string {
  const namer = new TypeNamer();
  const emitted: Emitted[] = [];
  const isRecord = options.target === 'record';

  function typeOf(node: Node, suggestedName: string, forceNullable: boolean): string {
    let base: string;

    if (node.shape.kind === 'object') {
      base = declare(node.shape.fields, suggestedName);
    } else if (node.shape.kind === 'array') {
      base = `List<${typeOf(node.shape.item, singularize(suggestedName), false)}>`;
    } else {
      base = csharpScalar(node.shape, options.fraction);
    }

    const wantsNullable = node.nullable || forceNullable;
    if (!wantsNullable) return base;
    if (VALUE_TYPES.has(base)) return `${base}?`;
    return options.nullableRefTypes ? `${base}?` : base;
  }

  function declare(fields: Map<string, Field>, suggestedName: string): string {
    const name = namer.unique(toPascalCase(suggestedName));
    const lines: string[] = [];

    /* Tip önce listeye konur, sonra doldurulur: iç içe tipler kendilerini
       yazarken diziye eklenir, böylece kök tip her zaman en üstte kalır. */
    const slot: Emitted = { name, lines };
    emitted.push(slot);

    const members: string[] = [];
    for (const [key, field] of fields) {
      const property = options.pascalCase ? safeIdentifier(toPascalCase(key)) : safeIdentifier(key);
      const type = typeOf(field.node, key, field.optional);

      if (options.pascalCase && property !== key) {
        members.push(`    [JsonPropertyName("${key}")]`);
      }

      if (isRecord) {
        members.push(`    public ${type} ${property} { get; init; }`);
      } else {
        members.push(`    public ${type} ${property} { get; set; }`);
      }
      members.push('');
    }
    // Son boş satır kapanış süslü parantezinden önce gereksiz.
    if (members.at(-1) === '') members.pop();

    lines.push(
      isRecord ? `public sealed record ${name}` : `public sealed class ${name}`,
      '{',
      ...members,
      '}',
    );

    return name;
  }

  const rootType = typeOf(root, options.rootName || 'Root', false);
  const usings: string[] = [];
  const body = emitted.map((type) => type.lines.join('\n')).join('\n\n');

  if (body.includes('List<')) usings.push('using System.Collections.Generic;');
  if (options.pascalCase && body.includes('[JsonPropertyName')) {
    usings.push('using System.Text.Json.Serialization;');
  }
  if (/\b(Guid|DateTime)\b/.test(body)) usings.unshift('using System;');

  // Kök bir dizi ise onu tutan bir tip yoktur; kullanıcıya nasıl
  // deserialize edeceğini söyleyen tek satırlık bir yorum bırakıyoruz.
  const rootNote =
    root.shape.kind === 'array' ? `\n\n// Root: ${rootType}` : '';

  return [usings.join('\n'), body].filter(Boolean).join('\n\n') + rootNote;
}

/** TypeScript tanımlayıcısı olarak yazılabilir mi — değilse tırnaklanır. */
const TS_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function generateTypescript(root: Node, options: GenerateOptions): string {
  const namer = new TypeNamer();
  const emitted: Emitted[] = [];

  function typeOf(node: Node, suggestedName: string): string {
    let base: string;

    if (node.shape.kind === 'object') {
      base = declare(node.shape.fields, suggestedName);
    } else if (node.shape.kind === 'array') {
      const item = typeOf(node.shape.item, singularize(suggestedName));
      // `(A | null)[]` — parantez şart, yoksa birleşim diziyi de kapsar.
      base = item.includes(' | ') ? `(${item})[]` : `${item}[]`;
    } else {
      base = typescriptScalar(node.shape);
    }

    // `unknown` zaten null'u kapsıyor; `unknown | null` yazmak gürültü.
    return node.nullable && base !== 'unknown' ? `${base} | null` : base;
  }

  function declare(fields: Map<string, Field>, suggestedName: string): string {
    const name = namer.unique(toPascalCase(suggestedName));
    const lines: string[] = [];
    emitted.push({ name, lines });

    const members: string[] = [];
    for (const [key, field] of fields) {
      /* Anahtar JSON'dan geldiği gibi kalır: arayüz TELİN üzerindeki şekli
         tarif eder, onu yeniden adlandırmaz. */
      const property = TS_IDENTIFIER.test(key) ? key : `'${key.replace(/'/g, "\\'")}'`;
      members.push(`  ${property}${field.optional ? '?' : ''}: ${typeOf(field.node, key)};`);
    }

    lines.push(`export interface ${name} {`, ...members, '}');
    return name;
  }

  const rootName = options.rootName || 'Root';

  /* Kök bir diziyse İKİ ada ihtiyaç var: takma ad (`HastaListesi`) ve eleman
     arayüzü. `singularize` bir şey değiştirmiyorsa ikisi çakışırdı — o yüzden
     takma ad önce rezerve edilir, elemana `…Item` verilir. */
  if (root.shape.kind === 'array') {
    namer.unique(toPascalCase(rootName));
    const singular = singularize(rootName);
    const itemName = singular === rootName ? `${rootName}Item` : singular;
    const rootType = typeOf(root, itemName);
    const body = emitted.map((type) => type.lines.join('\n')).join('\n\n');
    return `${body}\n\nexport type ${toPascalCase(rootName)} = ${rootType};`;
  }

  typeOf(root, rootName);
  return emitted.map((type) => type.lines.join('\n')).join('\n\n');
}

/**
 * JSON örneğinden C# `record`/`class` ya da TypeScript arayüzü üretir.
 *
 * Aynı DTO'nun iki dilde de gerekmesi bu projede olağan: uç nokta C#
 * döndürür, ekran onu TypeScript'te karşılar. İkisi tek girdiden üretilince
 * alan adları kaymıyor.
 */
export function generateTypes(json: string, options: GenerateOptions): ToolResult<string> {
  if (json.trim() === '') return err('jsonEmpty');

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return err('jsonInvalid');
  }

  if (parsed === null || typeof parsed !== 'object') {
    // Tek bir sayı ya da metin için üretilecek tip yok.
    return err('jsonNotObject');
  }

  const root = infer(parsed);
  const code =
    options.target === 'typescript' ? generateTypescript(root, options) : generateCsharp(root, options);

  return ok(code);
}
