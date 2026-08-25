/**
 * Küçük, bağımlılıksız bir XML ayrıştırıcı.
 *
 * Tarayıcının `DOMParser`'ı kullanılmıyor çünkü hata bildirimi tarayıcıdan
 * tarayıcıya değişiyor (Chrome bir `<parsererror>` elemanı basar, Firefox
 * başka bir şey) ve hatanın SATIRINI taşımıyor. Bu araçta "nerede bozuk"
 * bilgisi çıktının kendisi kadar değerli, o yüzden tarama elle yapılıyor.
 *
 * Kapsam: eleman, öznitelik, metin, CDATA, yorum, işlem yönergesi, beş
 * öntanımlı varlık ve sayısal karakter başvuruları. DTD iç kümesi atlanır —
 * özel varlık tanımı desteklenmez (`ENTITY` genişletmesi bilerek dışarıda:
 * bilinmeyen varlık olduğu gibi bırakılır, sessizce yutulmaz).
 */

export interface XmlElement {
  kind: 'element';
  name: string;
  /** Sıra korunur: JSON'a çevirirken belgedeki sırayı bozmuyoruz. */
  attributes: [name: string, value: string][];
  children: XmlNode[];
}

export interface XmlText {
  kind: 'text';
  value: string;
  /** CDATA içeriği geri yazarken yeniden CDATA olarak sarılır. */
  cdata: boolean;
}

export type XmlNode = XmlElement | XmlText;

export class XmlParseError extends Error {
  constructor(
    message: string,
    readonly line: number,
    readonly column: number,
  ) {
    super(message);
    this.name = 'XmlParseError';
  }

  /** `12:34` — çeviri gerektirmeyen konum etiketi. */
  get position(): string {
    return `${this.line}:${this.column}`;
  }
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** `&amp;` ve `&#x41;` çözer; tanımadığı varlığı olduğu gibi bırakır. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, (whole, body: string) => {
    if (body.startsWith('#')) {
      const isHex = body[1] === 'x' || body[1] === 'X';
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      // Geçersiz kod noktası (0, vekil alan, üst sınır) → dokunma.
      if (!Number.isFinite(code) || code <= 0 || code > 0x10_ff_ff) return whole;
      try {
        return String.fromCodePoint(code);
      } catch {
        return whole;
      }
    }
    return ENTITIES[body.toLowerCase()] ?? whole;
  });
}

export function escapeXmlText(text: string): string {
  return text.replace(/[&<>]/g, (char) => (char === '&' ? '&amp;' : char === '<' ? '&lt;' : '&gt;'));
}

export function escapeXmlAttribute(text: string): string {
  return escapeXmlText(text).replace(/"/g, '&quot;');
}

/*
 * XML adı: harf, alt çizgi ya da iki nokta ile başlar; devamında rakam,
 * `.`, `-`, orta nokta ve birleştirici işaretler de gelebilir (XML 1.0
 * NameStartChar / NameChar aralıklarının pratikte kullanılan kısmı).
 *
 * Aralıklar harfin kendisiyle değil kod noktası kaçışıyla yazılıyor:
 * birleştirici işaretleri kaynak dosyaya doğrudan koymak onları komşu
 * karakterle birleştirir ve sınıfın anlamını sessizce değiştirir.
 */
const NAME_START = /[A-Za-z_:\u00C0-\u02FF\u0370-\u1FFF\u3001-\uD7FF]/u;

/**
 * Ada devamında gelebilen ama onu başlatamayan karakterler.
 *
 * Birleştirici işaretler bir aralık yerine `\p{Mn}`/`\p{Mc}` ile
 * yazılıyor: niyeti açıkça söylüyor ve karakter sınıfının içinde
 * birleşme riski taşıyan bir aralık bırakmıyor.
 */
const NAME_CONTINUE = /[-.\d\u00B7]|\p{Mn}|\p{Mc}/u;

function isNameChar(char: string): boolean {
  return NAME_START.test(char) || NAME_CONTINUE.test(char);
}

export function isValidXmlName(name: string): boolean {
  if (name === '') return false;
  if (!NAME_START.test(name[0]!)) return false;
  for (const char of name.slice(1)) {
    if (!isNameChar(char)) return false;
  }
  return true;
}

class Scanner {
  index = 0;

  constructor(readonly source: string) {}

  get done(): boolean {
    return this.index >= this.source.length;
  }

  peek(offset = 0): string {
    return this.source[this.index + offset] ?? '';
  }

  startsWith(text: string): boolean {
    return this.source.startsWith(text, this.index);
  }

  /** Konumu 1 tabanlı satır/sütuna çevirir — hata mesajı için. */
  fail(message: string, at = this.index): never {
    const before = this.source.slice(0, at);
    const line = before.split('\n').length;
    const lastBreak = before.lastIndexOf('\n');
    throw new XmlParseError(message, line, at - lastBreak);
  }

  skipWhitespace(): void {
    while (!this.done && /\s/.test(this.peek())) this.index += 1;
  }

  readName(): string {
    const start = this.index;
    if (this.done || !NAME_START.test(this.peek())) this.fail('expected a name');
    this.index += 1;
    while (!this.done && isNameChar(this.peek())) this.index += 1;
    return this.source.slice(start, this.index);
  }

  /** `-->` gibi bir kapanışa kadar ilerler; bulamazsa hata. */
  readUntil(terminator: string, what: string): string {
    const end = this.source.indexOf(terminator, this.index);
    if (end === -1) this.fail(`unterminated ${what}`);
    const value = this.source.slice(this.index, end);
    this.index = end + terminator.length;
    return value;
  }
}

function parseAttributes(scanner: Scanner): [string, string][] {
  const attributes: [string, string][] = [];
  const seen = new Set<string>();

  for (;;) {
    scanner.skipWhitespace();
    const char = scanner.peek();
    if (char === '' || char === '>' || char === '/') return attributes;

    const nameAt = scanner.index;
    const name = scanner.readName();
    if (seen.has(name)) scanner.fail(`duplicate attribute "${name}"`, nameAt);
    seen.add(name);

    scanner.skipWhitespace();
    if (scanner.peek() !== '=') scanner.fail(`attribute "${name}" has no value`);
    scanner.index += 1;
    scanner.skipWhitespace();

    const quote = scanner.peek();
    if (quote !== '"' && quote !== "'") scanner.fail(`attribute "${name}" is not quoted`);
    scanner.index += 1;
    const raw = scanner.readUntil(quote, `attribute "${name}"`);
    attributes.push([name, decodeEntities(raw)]);
  }
}

function parseNodes(scanner: Scanner, parent: string | null): XmlNode[] {
  const children: XmlNode[] = [];

  for (;;) {
    if (scanner.done) {
      if (parent !== null) scanner.fail(`<${parent}> is never closed`);
      return children;
    }

    if (!scanner.startsWith('<')) {
      const next = scanner.source.indexOf('<', scanner.index);
      const end = next === -1 ? scanner.source.length : next;
      const raw = scanner.source.slice(scanner.index, end);
      scanner.index = end;
      children.push({ kind: 'text', value: decodeEntities(raw), cdata: false });
      continue;
    }

    if (scanner.startsWith('</')) {
      if (parent === null) scanner.fail('closing tag without an opening tag');
      const at = scanner.index;
      scanner.index += 2;
      const name = scanner.readName();
      scanner.skipWhitespace();
      if (scanner.peek() !== '>') scanner.fail(`malformed closing tag </${name}`);
      scanner.index += 1;
      if (name !== parent) scanner.fail(`</${name}> closes <${parent}>`, at);
      return children;
    }

    if (scanner.startsWith('<!--')) {
      scanner.index += 4;
      scanner.readUntil('-->', 'comment');
      continue;
    }

    if (scanner.startsWith('<![CDATA[')) {
      scanner.index += 9;
      children.push({ kind: 'text', value: scanner.readUntil(']]>', 'CDATA section'), cdata: true });
      continue;
    }

    if (scanner.startsWith('<?')) {
      scanner.index += 2;
      scanner.readUntil('?>', 'processing instruction');
      continue;
    }

    if (scanner.startsWith('<!')) {
      // DOCTYPE ve arkadaşları: içeriğe bakmadan atlanır. İç küme varsa
      // (`[ … ]`) önce onun kapanışını bulmak gerekir, yoksa ilk `>`
      // yanlış yerde biter.
      scanner.index += 2;
      const bracket = scanner.source.indexOf('[', scanner.index);
      const close = scanner.source.indexOf('>', scanner.index);
      if (bracket !== -1 && close !== -1 && bracket < close) {
        scanner.index = bracket + 1;
        scanner.readUntil(']', 'DOCTYPE internal subset');
      }
      scanner.readUntil('>', 'declaration');
      continue;
    }

    scanner.index += 1;
    const name = scanner.readName();
    const attributes = parseAttributes(scanner);
    scanner.skipWhitespace();

    if (scanner.startsWith('/>')) {
      scanner.index += 2;
      children.push({ kind: 'element', name, attributes, children: [] });
      continue;
    }

    if (scanner.peek() !== '>') scanner.fail(`malformed tag <${name}`);
    scanner.index += 1;
    children.push({ kind: 'element', name, attributes, children: parseNodes(scanner, name) });
  }
}

/**
 * Belgeyi ayrıştırır ve TEK kök elemanı döndürür.
 *
 * Hata durumunda `XmlParseError` fırlatır — bu modülün tek istisna fırlatan
 * yeri; çağıran onu `ToolResult`'a çeviriyor.
 */
export function parseXml(source: string): XmlElement {
  const scanner = new Scanner(source);
  const nodes = parseNodes(scanner, null);
  const elements = nodes.filter((node): node is XmlElement => node.kind === 'element');

  if (elements.length === 0) throw new XmlParseError('no root element found', 1, 1);
  if (elements.length > 1) {
    throw new XmlParseError(`${elements.length} root elements — XML allows one`, 1, 1);
  }
  return elements[0]!;
}

/** Yalnızca boşluktan oluşan metin düğümü — girintiden gelir, veri değil. */
export function isWhitespaceOnly(node: XmlNode): boolean {
  return node.kind === 'text' && node.value.trim() === '';
}

/* --------------------------------------------------------------- yazdırma */

export interface StringifyOptions {
  indent: number;
  /** `<?xml version="1.0" encoding="UTF-8"?>` satırı eklensin mi. */
  declaration: boolean;
}

function stringifyNode(node: XmlNode, options: StringifyOptions, depth: number): string {
  const pad = ' '.repeat(options.indent * depth);

  if (node.kind === 'text') {
    if (node.cdata) return `${pad}<![CDATA[${node.value}]]>`;
    return `${pad}${escapeXmlText(node.value)}`;
  }

  const attributes = node.attributes
    .map(([name, value]) => ` ${name}="${escapeXmlAttribute(value)}"`)
    .join('');

  const real = node.children.filter((child) => !isWhitespaceOnly(child));
  if (real.length === 0) return `${pad}<${node.name}${attributes} />`;

  /* Tek bir metin çocuğu varsa etiket tek satırda kalır — her metni ayrı
     satıra almak `<ad>\n  Örnek\n</ad>` gibi anlamı değiştiren boşluk üretir. */
  const onlyText = real.length === 1 && real[0]!.kind === 'text';
  if (onlyText) {
    const child = real[0] as XmlText;
    const body = child.cdata ? `<![CDATA[${child.value}]]>` : escapeXmlText(child.value.trim());
    return `${pad}<${node.name}${attributes}>${body}</${node.name}>`;
  }

  const inner = real.map((child) => stringifyNode(child, options, depth + 1)).join('\n');
  return `${pad}<${node.name}${attributes}>\n${inner}\n${pad}</${node.name}>`;
}

export function stringifyXml(root: XmlElement, options: StringifyOptions): string {
  const body = stringifyNode(root, options, 0);
  return options.declaration ? `<?xml version="1.0" encoding="UTF-8"?>\n${body}` : body;
}
