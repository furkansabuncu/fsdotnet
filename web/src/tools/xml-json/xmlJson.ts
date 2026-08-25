import { err, ok, type ToolResult } from '../types';
import {
  XmlParseError,
  isValidXmlName,
  isWhitespaceOnly,
  parseXml,
  stringifyXml,
  type XmlElement,
  type XmlNode,
} from './xml';

export type XmlJsonDirection = 'toJson' | 'toXml';

export interface XmlJsonOptions {
  direction: XmlJsonDirection;
  /**
   * Öznitelikler `@ad` anahtarıyla korunur. Kapalıyken tamamen atılır —
   * yalnızca veriyi isteyen çağırıcı için.
   *
   * `@` ve `#text` seçimi keyfi değil: Newtonsoft'un
   * `JsonConvert.SerializeXmlNode` çıktısı da böyle, yani C# tarafında
   * üretilen JSON ile aynı şekli veriyor.
   */
  attributes: boolean;
  /** `"42"` yerine `42`, `"true"` yerine `true` üret. */
  inferTypes: boolean;
  indent: number;
}

export const TEXT_KEY = '#text';
export const ATTRIBUTE_PREFIX = '@';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/* -------------------------------------------------------------- XML → JSON */

const NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/;

function coerce(text: string, inferTypes: boolean): JsonValue {
  if (!inferTypes) return text;
  const trimmed = text.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (!NUMBER.test(trimmed)) return text;

  /* Baştaki sıfır anlamlıdır: `00123` bir raf numarası olabilir,
     sayıya çevrilirse veri kaybolur. */
  if (/^-?0\d/.test(trimmed)) return text;

  /* Güvenli tam sayı aralığının dışındaki değer JavaScript sayısına
     sığmıyor — `11111111111111111111` gibi bir kimlik numarası sessizce
     yuvarlanırdı. Kayıpsız tek gösterim metin. */
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) && Number.isInteger(value)) return text;
  if (String(value) !== trimmed && !trimmed.includes('e') && !trimmed.includes('E')) return text;

  return value;
}

function elementToJson(element: XmlElement, options: XmlJsonOptions): JsonValue {
  const children = element.children.filter((child) => !isWhitespaceOnly(child));
  const attributes = options.attributes ? element.attributes : [];

  const text = children
    .filter((child): child is Extract<XmlNode, { kind: 'text' }> => child.kind === 'text')
    .map((child) => child.value)
    .join('')
    .trim();

  const elements = children.filter((child): child is XmlElement => child.kind === 'element');

  // En yalın hâl: özniteliksiz, çocuksuz, sadece metin → düz değer.
  if (attributes.length === 0 && elements.length === 0) {
    return children.length === 0 ? '' : coerce(text, options.inferTypes);
  }

  const result: Record<string, JsonValue> = {};
  for (const [name, value] of attributes) {
    result[`${ATTRIBUTE_PREFIX}${name}`] = coerce(value, options.inferTypes);
  }

  for (const child of elements) {
    const value = elementToJson(child, options);
    const existing = result[child.name];

    if (existing === undefined) {
      result[child.name] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      // İkinci kez görülen ad diziye dönüşür. XML'de "bu alan çoklu mu"
      // bilgisi şemada durur, belgede değil — tek örnekten anlaşılmaz.
      result[child.name] = [existing, value];
    }
  }

  if (text !== '') result[TEXT_KEY] = coerce(text, options.inferTypes);

  return result;
}

/* -------------------------------------------------------------- JSON → XML */

function jsonToNodes(key: string, value: JsonValue): XmlNode[] {
  if (Array.isArray(value)) {
    // Dizi kendi etiketini üretmez; her eleman aynı adı taşıyan bir eleman olur.
    return value.flatMap((item) => jsonToNodes(key, item));
  }

  const element: XmlElement = { kind: 'element', name: key, attributes: [], children: [] };

  if (value === null) return [element];

  if (typeof value !== 'object') {
    element.children.push({ kind: 'text', value: String(value), cdata: false });
    return [element];
  }

  for (const [childKey, childValue] of Object.entries(value)) {
    if (childKey.startsWith(ATTRIBUTE_PREFIX)) {
      const name = childKey.slice(ATTRIBUTE_PREFIX.length);
      // Öznitelik değeri nesne olamaz; olursa JSON'a bakılarak yazılır.
      element.attributes.push([
        name,
        typeof childValue === 'object' && childValue !== null
          ? JSON.stringify(childValue)
          : String(childValue ?? ''),
      ]);
      continue;
    }

    if (childKey === TEXT_KEY) {
      element.children.push({ kind: 'text', value: String(childValue ?? ''), cdata: false });
      continue;
    }

    element.children.push(...jsonToNodes(childKey, childValue));
  }

  return [element];
}

/** JSON kökünden tek bir XML kök elemanı seçer ya da sarmalar. */
function rootFromJson(value: JsonValue): ToolResult<XmlElement> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return err('xmlRootShape');
  }

  const entries = Object.entries(value).filter(([key]) => !key.startsWith(ATTRIBUTE_PREFIX));

  /* Tek anahtar varsa o zaten köktür (`{"kitap": {...}}` → `<kitap>`).
     Birden fazlaysa hepsini tutacak bir sarmalayıcı gerekir — XML'in tek
     kök kuralı bunu zorunlu kılıyor. */
  if (entries.length === 1) {
    const [key, child] = entries[0]!;
    if (!isValidXmlName(key)) return err('xmlBadName', key);
    const nodes = jsonToNodes(key, child);
    if (nodes.length === 1) return ok(nodes[0] as XmlElement);
  }

  for (const [key] of entries) {
    if (!isValidXmlName(key)) return err('xmlBadName', key);
  }

  const children = entries.flatMap(([key, child]) => jsonToNodes(key, child));
  return ok({ kind: 'element', name: 'root', attributes: [], children });
}

/* ------------------------------------------------------------------ dışarı */

export function convertXmlJson(input: string, options: XmlJsonOptions): ToolResult<string> {
  if (input.trim() === '') return err(options.direction === 'toJson' ? 'xmlEmpty' : 'jsonEmpty');

  if (options.direction === 'toJson') {
    let root: XmlElement;
    try {
      root = parseXml(input);
    } catch (error) {
      if (error instanceof XmlParseError) return err('xmlInvalid', `${error.position} — ${error.message}`);
      throw error;
    }
    // Kök eleman adı korunur; aksi hâlde geri çevirirken kaybolur.
    const body = { [root.name]: elementToJson(root, options) };
    return ok(JSON.stringify(body, null, options.indent));
  }

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(input) as JsonValue;
  } catch {
    return err('jsonInvalid');
  }

  const root = rootFromJson(parsed);
  if (!root.ok) return root;

  return ok(stringifyXml(root.value, { indent: options.indent, declaration: true }));
}
