import { err, ok, type ToolResult } from '../types';
import { XmlParseError, parseXml, stringifyXml, type XmlElement, type XmlNode } from '../xml-json/xml';
import { formatCss, minifyCss } from './css';
import { formatHtml, minifyHtml } from './html';

export type FormatLanguage = 'json' | 'xml' | 'html' | 'css';
export type FormatMode = 'format' | 'minify';

export interface FormatOptions {
  /** `null` = otomatik algıla. */
  language: FormatLanguage | null;
  mode: FormatMode;
  indent: number;
}

export interface FormatResult {
  text: string;
  /** Hangi dil kullanıldı — otomatik algılamada arayüz bunu gösteriyor. */
  language: FormatLanguage;
}

/**
 * Dili tahmin eder.
 *
 * Sıra önemli: HTML de `<` ile başlar, o yüzden XML'den ÖNCE bakılmalı;
 * ama `<?xml` bildirimi varsa tartışma biter. CSS en sona kalıyor çünkü
 * ayırt edici işareti (`{ … : … ; }`) en zayıf olan o.
 */
export function detectLanguage(source: string): FormatLanguage | null {
  const text = source.trim();
  if (text === '') return null;

  if (text.startsWith('{') || text.startsWith('[')) return 'json';
  if (/^<\?xml\b/i.test(text)) return 'xml';

  if (text.startsWith('<')) {
    if (/<!doctype\s+html|<html[\s>]|<(?:div|span|body|head|p|table|a|img|meta|link)[\s>/]/i.test(text)) {
      return 'html';
    }
    return 'xml';
  }

  if (/[^{}]*\{[^{}]*:[^{}]*[;}]/.test(text) || text.startsWith('@')) return 'css';
  return null;
}

/** XML'i tek satıra indirger — girintiden gelen boşluk zaten veri değil. */
function minifyXml(root: XmlElement): string {
  const render = (node: XmlNode): string => {
    if (node.kind === 'text') {
      if (node.cdata) return `<![CDATA[${node.value}]]>`;
      return node.value.trim().replace(/[&<>]/g, (char) =>
        char === '&' ? '&amp;' : char === '<' ? '&lt;' : '&gt;',
      );
    }
    const attributes = node.attributes
      .map(([name, value]) => ` ${name}="${value.replace(/[&<>"]/g, (char) =>
        char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : '&quot;',
      )}"`)
      .join('');
    const inner = node.children.map(render).join('');
    return inner === '' ? `<${node.name}${attributes}/>` : `<${node.name}${attributes}>${inner}</${node.name}>`;
  };
  return render(root);
}

export function formatCode(source: string, options: FormatOptions): ToolResult<FormatResult> {
  if (source.trim() === '') return err('jsonEmpty');

  const language = options.language ?? detectLanguage(source);
  if (language === null) return err('formatUnknownLanguage');

  const minify = options.mode === 'minify';

  switch (language) {
    case 'json': {
      let parsed: unknown;
      try {
        parsed = JSON.parse(source);
      } catch (error) {
        // `JSON.parse` mesajı konumu içeriyor; çeviri gerektirmeyen kısmı o.
        return err('jsonInvalid', error instanceof Error ? error.message.replace(/^JSON\.parse:?\s*/i, '') : undefined);
      }
      return ok({
        language,
        text: minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, options.indent),
      });
    }

    case 'xml': {
      let root: XmlElement;
      try {
        root = parseXml(source);
      } catch (error) {
        if (error instanceof XmlParseError) return err('xmlInvalid', `${error.position} — ${error.message}`);
        throw error;
      }
      return ok({
        language,
        text: minify
          ? minifyXml(root)
          : stringifyXml(root, { indent: options.indent, declaration: /^\s*<\?xml\b/i.test(source) }),
      });
    }

    case 'html':
      return ok({
        language,
        text: minify ? minifyHtml(source) : formatHtml(source, { indent: options.indent }),
      });

    case 'css':
      return ok({
        language,
        text: minify ? minifyCss(source) : formatCss(source, { indent: options.indent }),
      });
  }
}
