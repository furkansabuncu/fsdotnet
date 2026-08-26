import type { ScanResult, Span } from './types';

/**
 * C# kaynağını bölgelere ayıran tarayıcı.
 *
 * SQL'inkiyle aynı işi yapıyor ama kaçış kuralları başka: satır yorumu
 * çift bölü, blok yorum C tarzı; dize `"…"` ters bölü kaçışlı, `@"…"`
 * verbatim (ters bölü kaçış DEĞİL, `""` kaçış), `$"…"` enterpolasyonlu.
 * Bunları tek bir "ayarlanabilir tarayıcı" altında birleştirmek her iki
 * dilin de kurallarını bulanıklaştırırdı; iki küçük tarayıcı, bir tane
 * karmaşık olandan okunaklı.
 *
 * `identifier` bölgesi C#'ta karşılıksız: `'c'` de dize sayılıyor, çünkü
 * kuralların hepsi için önemli olan tek şey "kod değil".
 *
 * Bilinen sınır: `$"{Yontem("x")}"` gibi enterpolasyon deliğinin İÇİ de
 * dize sayılıyor. Delikteki kod denetlenmemiş kalır — yanlış bulgu
 * üretmekten iyidir.
 */
export function scanCSharp(source: string): ScanResult {
  const spans: Span[] = [];
  let unterminated: ScanResult['unterminated'] = null;
  let codeStart = 0;
  let index = 0;

  const closeCode = (end: number) => {
    if (end > codeStart) spans.push({ kind: 'code', start: codeStart, end });
  };

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '/' && next === '/') {
      closeCode(index);
      const newline = source.indexOf('\n', index);
      const end = newline === -1 ? source.length : newline;
      spans.push({ kind: 'comment', start: index, end });
      index = end;
      codeStart = index;
      continue;
    }

    if (char === '/' && next === '*') {
      closeCode(index);
      const close = source.indexOf('*/', index + 2);
      const end = close === -1 ? source.length : close + 2;
      if (close === -1) unterminated ??= { kind: 'comment', start: index };
      spans.push({ kind: 'comment', start: index, end });
      index = end;
      codeStart = index;
      continue;
    }

    /* Ön ekler birlikte gelebiliyor: `$@"…"` ve `@$"…"` ikisi de geçerli.
       Verbatim olup olmadığı kaçış kuralını belirlediği için ayrı tutuluyor. */
    let prefix = 0;
    let verbatim = false;
    while (source[index + prefix] === '@' || source[index + prefix] === '$') {
      if (source[index + prefix] === '@') verbatim = true;
      prefix += 1;
    }
    const quote = source[index + prefix];

    if ((quote === '"' || quote === "'") && (prefix === 0 || quote === '"')) {
      closeCode(index);
      let cursor = index + prefix + 1;
      let closed = false;

      while (cursor < source.length) {
        const current = source[cursor];

        if (verbatim && current === quote && source[cursor + 1] === quote) {
          cursor += 2;
          continue;
        }
        if (!verbatim && current === '\\') {
          cursor += 2;
          continue;
        }
        if (current === quote) {
          cursor += 1;
          closed = true;
          break;
        }
        // Verbatim olmayan dize satır sonunda biter; kapanmamış sayılır.
        if (!verbatim && current === '\n') break;
        cursor += 1;
      }

      if (!closed) unterminated ??= { kind: 'string', start: index };
      spans.push({ kind: 'string', start: index, end: cursor });
      index = cursor;
      codeStart = index;
      continue;
    }

    index += prefix > 0 ? prefix : 1;
  }

  closeCode(source.length);
  return { spans, unterminated };
}
