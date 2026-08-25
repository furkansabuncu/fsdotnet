/**
 * HTML yeniden girintileyici.
 *
 * HTML, XML değil: kapanışsız etiketler (`<br>`), tırnaksız öznitelikler
 * ve içeriği ayrıştırılmayan bloklar (`<script>`, `<pre>`) var. Bu yüzden
 * XML ayrıştırıcısı burada kullanılmıyor; belge bir AĞACA çevrilmiyor,
 * belirteç akışı olarak yeniden girintileniyor. Kapanışı eksik bir belge
 * bile bozulmadan geçsin diye kasıtlı olarak hoşgörülü.
 */

export interface HtmlFormatOptions {
  indent: number;
}

/** Kapanış etiketi almayan elemanlar (HTML Living Standard). */
const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/** İçeriği HTML olarak okunmayan elemanlar — olduğu gibi taşınır. */
const RAW = new Set(['script', 'style', 'pre', 'textarea']);

type Token =
  | { kind: 'open'; name: string; text: string; selfClosing: boolean }
  | { kind: 'close'; name: string; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'raw'; text: string }
  | { kind: 'other'; text: string };

/** `<div class="a">` içindeki `>` işareti öznitelik değerinde olabilir. */
function findTagEnd(source: string, start: number): number {
  let index = start;
  let quote = '';
  while (index < source.length) {
    const char = source[index]!;
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      return index;
    }
    index += 1;
  }
  return -1;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    if (source[index] !== '<') {
      const next = source.indexOf('<', index);
      const end = next === -1 ? source.length : next;
      tokens.push({ kind: 'text', text: source.slice(index, end) });
      index = end;
      continue;
    }

    // Yorum, DOCTYPE, işlem yönergesi: tek parça.
    if (source.startsWith('<!--', index)) {
      const end = source.indexOf('-->', index + 4);
      const stop = end === -1 ? source.length : end + 3;
      tokens.push({ kind: 'other', text: source.slice(index, stop) });
      index = stop;
      continue;
    }
    if (source.startsWith('<!', index) || source.startsWith('<?', index)) {
      const end = findTagEnd(source, index);
      const stop = end === -1 ? source.length : end + 1;
      tokens.push({ kind: 'other', text: source.slice(index, stop) });
      index = stop;
      continue;
    }

    const end = findTagEnd(source, index);
    if (end === -1) {
      // Kapanmayan `<` — metin sayılır, yutulmaz.
      tokens.push({ kind: 'text', text: source.slice(index) });
      break;
    }

    const text = source.slice(index, end + 1);
    index = end + 1;

    if (text.startsWith('</')) {
      tokens.push({ kind: 'close', name: (/^<\/\s*([^\s/>]+)/.exec(text)?.[1] ?? '').toLowerCase(), text });
      continue;
    }

    const name = (/^<\s*([^\s/>]+)/.exec(text)?.[1] ?? '').toLowerCase();
    const selfClosing = text.endsWith('/>') || VOID.has(name);
    tokens.push({ kind: 'open', name, text, selfClosing });

    /* Ham blokların içi ayrıştırılmaz: `<script>if (a < b)` içindeki `<`
       etiket başlangıcı değildir. Kapanışa kadar tek parça alınır. */
    if (RAW.has(name) && !selfClosing) {
      const closing = `</${name}`;
      const closeAt = source.toLowerCase().indexOf(closing, index);
      const stop = closeAt === -1 ? source.length : closeAt;
      const body = source.slice(index, stop);
      if (body !== '') tokens.push({ kind: 'raw', text: body });
      index = stop;
    }
  }

  return tokens;
}

/** Tek satırda kalması okunabilirliği artıran maksimum uzunluk. */
const INLINE_LIMIT = 100;

export function formatHtml(source: string, { indent }: HtmlFormatOptions): string {
  const tokens = tokenize(source);
  const lines: string[] = [];
  let depth = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!;
    const pad = ' '.repeat(Math.max(0, depth) * indent);

    if (token.kind === 'text') {
      const text = token.text.trim();
      if (text !== '') lines.push(pad + text.replace(/\s+/g, ' '));
      continue;
    }

    if (token.kind === 'raw') {
      /* Ham içerik yeniden girintilenmez ama tamamen sola da yapıştırılmaz:
         mevcut göreli girintisi korunarak bloğun altına kaydırılıyor. */
      const body = token.text.replace(/^\n+|\s+$/g, '');
      if (body === '') continue;
      const bodyLines = body.split('\n');
      const common = Math.min(
        ...bodyLines.filter((line) => line.trim() !== '').map((line) => /^\s*/.exec(line)![0].length),
      );
      lines.push(...bodyLines.map((line) => (line.trim() === '' ? '' : pad + line.slice(common))));
      continue;
    }

    if (token.kind === 'other') {
      lines.push(pad + token.text);
      continue;
    }

    if (token.kind === 'close') {
      depth -= 1;
      lines.push(' '.repeat(Math.max(0, depth) * indent) + token.text);
      continue;
    }

    // Açılış etiketi. `<td>metin</td>` gibi kısa üçlüler tek satırda kalır.
    const next = tokens[i + 1];
    const after = tokens[i + 2];
    if (
      !token.selfClosing &&
      next?.kind === 'text' &&
      after?.kind === 'close' &&
      after.name === token.name
    ) {
      const single = `${token.text}${next.text.trim().replace(/\s+/g, ' ')}${after.text}`;
      if (pad.length + single.length <= INLINE_LIMIT) {
        lines.push(pad + single);
        i += 2;
        continue;
      }
    }

    lines.push(pad + token.text);
    if (!token.selfClosing) depth += 1;
  }

  return lines.join('\n');
}

export function minifyHtml(source: string): string {
  let out = '';

  for (const token of tokenize(source)) {
    switch (token.kind) {
      case 'text':
        // Etiketler arası boşluk HTML'de anlamlı olabilir; tamamen silmek
        // yerine teke indiriyoruz.
        out += token.text.replace(/\s+/g, ' ');
        break;
      case 'raw':
        out += token.text.trim();
        break;
      // Yorumlar küçültmede düşer.
      case 'other':
        out += token.text.startsWith('<!--') ? '' : token.text;
        break;
      default:
        out += token.text.replace(/\s+/g, ' ');
    }
  }

  return out.replace(/>\s+</g, '><').trim();
}
