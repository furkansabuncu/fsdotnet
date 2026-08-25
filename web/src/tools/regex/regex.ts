import { err, ok, type ToolResult } from '../types';

export interface RegexFlags {
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  /** .NET karşılığı `RegexOptions.CultureInvariant`. */
  cultureInvariant: boolean;
}

export interface CaptureGroup {
  /** Adlandırılmamış gruplarda sıra numarası ('1', '2'). */
  name: string;
  value: string | null;
  index: number;
}

export interface RegexMatch {
  index: number;
  length: number;
  value: string;
  groups: CaptureGroup[];
}

export const EMPTY_FLAGS: RegexFlags = {
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  cultureInvariant: false,
};

export function toJsFlags(flags: RegexFlags): string {
  return (
    'gd' +
    (flags.ignoreCase ? 'i' : '') +
    (flags.multiline ? 'm' : '') +
    (flags.dotAll ? 's' : '') +
    (flags.unicode ? 'u' : '')
  );
}

/** Sonsuz döngü ve devasa çıktı koruması. */
export const MATCH_LIMIT = 500;

export interface JsRunResult {
  matches: RegexMatch[];
  truncated: boolean;
}

/**
 * Deseni tarayıcının kendi motoruyla çalıştırır.
 *
 * `d` bayrağı (`hasIndices`) her zaman açık: grupların KONUMU olmadan
 * vurgulama yapılamaz. `g` de her zaman açık — araç tüm eşleşmeleri
 * listeliyor, "ilk eşleşme" ayrı bir mod değil.
 */
export function runJsRegex(pattern: string, flags: RegexFlags, input: string): ToolResult<JsRunResult> {
  if (pattern === '') return err('regexEmpty');

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, toJsFlags(flags));
  } catch (error) {
    return err('regexInvalid', error instanceof Error ? error.message : undefined);
  }

  const matches: RegexMatch[] = [];
  let truncated = false;

  for (const match of input.matchAll(regex)) {
    if (matches.length >= MATCH_LIMIT) {
      truncated = true;
      break;
    }

    const indices = match.indices ?? [];
    const named = match.groups ?? {};
    const namedByValue = new Map<number, string>();

    /* Adlandırılmış grupların SIRA numarası `match.groups`'ta yok; adı
       bulmak için değerleri sayısal gruplarla eşleştiriyoruz. Aynı değere
       sahip iki grup olursa ad ilkine bağlanır — görüntüde ada sahip
       olmak, hangi sıra numarasını taşıdığından daha yararlı. */
    for (const [name, value] of Object.entries(named)) {
      for (let i = 1; i < match.length; i += 1) {
        if (match[i] === value && !namedByValue.has(i)) {
          namedByValue.set(i, name);
          break;
        }
      }
    }

    const groups: CaptureGroup[] = [];
    for (let i = 1; i < match.length; i += 1) {
      groups.push({
        name: namedByValue.get(i) ?? String(i),
        value: match[i] ?? null,
        index: indices[i]?.[0] ?? -1,
      });
    }

    matches.push({
      index: match.index,
      length: match[0].length,
      value: match[0],
      groups,
    });

    // Sıfır uzunluklu eşleşme `matchAll` içinde zaten ilerletiliyor; ayrıca
    // korumaya gerek yok, ama limit kontrolü onu da kapsıyor.
  }

  return ok({ matches, truncated });
}

/** `$1`, `${name}` ve `$&` destekli değiştirme önizlemesi. */
export function replacePreview(
  pattern: string,
  flags: RegexFlags,
  input: string,
  replacement: string,
): ToolResult<string> {
  if (pattern === '') return err('regexEmpty');
  try {
    return ok(input.replace(new RegExp(pattern, toJsFlags(flags)), replacement));
  } catch (error) {
    return err('regexInvalid', error instanceof Error ? error.message : undefined);
  }
}

/* ------------------------------------------------------- lehçe farklılıkları */

export type FlavourSide = 'dotnetOnly' | 'differs';

export interface FlavourNote {
  /** Sözlükteki `regex.notes` anahtarı. */
  key:
    | 'balancingGroup'
    | 'conditional'
    | 'inlineOptions'
    | 'anchors'
    | 'quotedGroupName'
    | 'digitUnicode'
    | 'wordUnicode'
    | 'dollarNewline'
    | 'unicodeCategory'
    | 'turkishCase';
  side: FlavourSide;
  /** Desenin bu notu tetikleyen parçası. */
  sample: string;
}

const RULES: readonly {
  key: FlavourNote['key'];
  side: FlavourSide;
  pattern: RegExp;
}[] = [
  // Yalnızca .NET'te olanlar — JavaScript motorunda derlenmez bile.
  { key: 'balancingGroup', side: 'dotnetOnly', pattern: /\(\?<-\w+>/ },
  { key: 'conditional', side: 'dotnetOnly', pattern: /\(\?\((?:\w+|\d+)\)/ },
  { key: 'inlineOptions', side: 'dotnetOnly', pattern: /\(\?[imsxn]+[):]/ },
  { key: 'anchors', side: 'dotnetOnly', pattern: /\\[AzZG]/ },
  { key: 'quotedGroupName', side: 'dotnetOnly', pattern: /\(\?'\w+'/ },

  // İkisinde de derlenir ama SONUCU farklı — asıl tehlikeli grup bunlar.
  { key: 'digitUnicode', side: 'differs', pattern: /\\d/ },
  { key: 'wordUnicode', side: 'differs', pattern: /\\w/ },
  { key: 'dollarNewline', side: 'differs', pattern: /\$/ },
  { key: 'unicodeCategory', side: 'differs', pattern: /\\p\{\w+\}/ },
];

/**
 * Desende iki motorun ayrıştığı yapıları arar.
 *
 * Amaç desen yazmayı engellemek değil, sessiz farkı görünür kılmak: aynı
 * desen iki motorda derlenip FARKLI sonuç verdiğinde hatayı bulmak çok
 * zor oluyor.
 */
export function analyzeFlavour(pattern: string, flags: RegexFlags): FlavourNote[] {
  const notes: FlavourNote[] = [];

  for (const rule of RULES) {
    const match = rule.pattern.exec(pattern);
    if (match) notes.push({ key: rule.key, side: rule.side, sample: match[0] });
  }

  /* Türkçe I sorunu: .NET'te `RegexOptions.IgnoreCase` GEÇERLİ KÜLTÜRÜ
     kullanır. tr-TR altında `I` ile `i` eşleşmez. Yalnızca desende bu iki
     harf geçiyorsa uyarmak anlamlı. */
  if (flags.ignoreCase && !flags.cultureInvariant && /[iıIİ]/.test(pattern)) {
    notes.push({ key: 'turkishCase', side: 'differs', sample: 'IgnoreCase' });
  }

  return notes;
}
