/**
 * Küçük bir CSS yeniden girintileyici.
 *
 * Tam bir CSS ayrıştırıcısı değil — amaç tek satıra sıkışmış bir stil
 * bloğunu okunur hâle getirmek. Bu yüzden tarayıcı karakter karakter
 * ilerliyor ve yalnızca üç sınıra bakıyor: `{`, `}`, `;`. Kritik olan,
 * bu üç karakterin dize, yorum ve `url(...)` içinde SAYILMAMASI — orada
 * bölmek geçerli CSS'i bozar.
 */

export interface CssFormatOptions {
  indent: number;
}

type Piece =
  | { kind: 'open'; text: string }
  | { kind: 'close' }
  | { kind: 'declaration'; text: string }
  | { kind: 'comment'; text: string };

/** Ardışık boşlukları teke indirir; satır sonları da boşluk sayılır. */
function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function tokenize(source: string): Piece[] {
  const pieces: Piece[] = [];
  let buffer = '';
  let index = 0;

  const flushDeclaration = () => {
    const text = collapse(buffer);
    buffer = '';
    if (text !== '') pieces.push({ kind: 'declaration', text });
  };

  while (index < source.length) {
    const char = source[index]!;

    // Yorum: içeriğine hiç bakılmadan olduğu gibi taşınır.
    if (char === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2);
      const stop = end === -1 ? source.length : end + 2;
      const pending = collapse(buffer);
      buffer = '';
      if (pending !== '') pieces.push({ kind: 'declaration', text: pending });
      pieces.push({ kind: 'comment', text: source.slice(index, stop) });
      index = stop;
      continue;
    }

    // Dize: kaçış dâhil olduğu gibi kopyalanır.
    if (char === '"' || char === "'") {
      const quote = char;
      buffer += char;
      index += 1;
      while (index < source.length) {
        const inner = source[index]!;
        buffer += inner;
        index += 1;
        if (inner === '\\') {
          buffer += source[index] ?? '';
          index += 1;
        } else if (inner === quote) break;
      }
      continue;
    }

    // `url(...)` tırnaksız olabilir ve içinde `;` geçebilir.
    if (char === '(') {
      let depth = 0;
      while (index < source.length) {
        const inner = source[index]!;
        buffer += inner;
        if (inner === '(') depth += 1;
        if (inner === ')') {
          depth -= 1;
          index += 1;
          if (depth === 0) break;
          continue;
        }
        index += 1;
      }
      continue;
    }

    if (char === '{') {
      const selector = collapse(buffer);
      buffer = '';
      pieces.push({ kind: 'open', text: selector });
      index += 1;
      continue;
    }

    if (char === '}') {
      flushDeclaration();
      pieces.push({ kind: 'close' });
      index += 1;
      continue;
    }

    if (char === ';') {
      flushDeclaration();
      index += 1;
      continue;
    }

    buffer += char;
    index += 1;
  }

  flushDeclaration();
  return pieces;
}

/**
 * `color:red` → `color: red`. Yalnızca İLK iki nokta bölünür: `background:
 * url(data:image/png;base64,…)` değerin içindeki iki noktayı korumalı.
 * Bildirim değilse (özel değişken ya da `@media` gibi) dokunulmaz.
 */
function spaceDeclaration(text: string): string {
  const colon = text.indexOf(':');
  if (colon === -1) return text;
  const property = text.slice(0, colon).trim();
  const value = text.slice(colon + 1).trim();
  return `${property}: ${value}`;
}

export function formatCss(source: string, { indent }: CssFormatOptions): string {
  const lines: string[] = [];
  let depth = 0;

  for (const piece of tokenize(source)) {
    const pad = ' '.repeat(Math.max(0, depth) * indent);

    switch (piece.kind) {
      case 'open': {
        // Virgülle ayrılmış seçiciler alt alta okunur.
        const selector = piece.text.split(',').map((part) => part.trim()).filter(Boolean);
        if (selector.length > 1) {
          lines.push(...selector.map((part, i) => `${pad}${part}${i < selector.length - 1 ? ',' : ' {'}`));
        } else {
          lines.push(`${pad}${piece.text} {`);
        }
        depth += 1;
        break;
      }
      case 'close': {
        depth -= 1;
        lines.push(`${' '.repeat(Math.max(0, depth) * indent)}}`);
        // Blok sonrası boş satır: kurallar birbirine yapışmasın.
        lines.push('');
        break;
      }
      case 'declaration':
        lines.push(`${pad}${spaceDeclaration(piece.text)};`);
        break;
      case 'comment':
        lines.push(`${pad}${piece.text}`);
        break;
    }
  }

  // Sondaki fazladan boş satırlar kırpılır, aradakiler kalır.
  while (lines.at(-1) === '') lines.pop();
  return lines.join('\n');
}

export function minifyCss(source: string): string {
  let out = '';
  let depth = 0;

  for (const piece of tokenize(source)) {
    switch (piece.kind) {
      case 'open':
        out += `${piece.text.replace(/\s*,\s*/g, ',')}{`;
        depth += 1;
        break;
      case 'close':
        // Son bildirimden sonraki `;` gereksiz.
        if (out.endsWith(';')) out = out.slice(0, -1);
        out += '}';
        depth -= 1;
        break;
      case 'declaration':
        out += `${spaceDeclaration(piece.text).replace(': ', ':')};`;
        break;
      // Yorumlar küçültmede düşer — küçültmenin amacı bu.
      case 'comment':
        break;
    }
  }

  return out;
}
