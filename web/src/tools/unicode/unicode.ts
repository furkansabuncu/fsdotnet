/**
 * Görünmez ya da tuzaklı karakterler.
 *
 * Bu aracın asıl varlık sebebi bunlar: Word/Excel'den yapıştırılan metin
 * sürekli `U+00A0` ve `U+200B` taşır, sonra `Trim()` çalışmaz, string
 * karşılaştırması tutmaz ve kimse sebebini bulamaz. Ekranda hepsi normal
 * boşluk gibi görünür.
 */
const NOTABLE: Record<number, string> = {
  0x0009: 'CHARACTER TABULATION',
  0x000a: 'LINE FEED',
  0x000d: 'CARRIAGE RETURN',
  0x00a0: 'NO-BREAK SPACE',
  0x00ad: 'SOFT HYPHEN',
  0x0085: 'NEXT LINE',
  0x1680: 'OGHAM SPACE MARK',
  0x2000: 'EN QUAD',
  0x2001: 'EM QUAD',
  0x2002: 'EN SPACE',
  0x2003: 'EM SPACE',
  0x2004: 'THREE-PER-EM SPACE',
  0x2005: 'FOUR-PER-EM SPACE',
  0x2006: 'SIX-PER-EM SPACE',
  0x2007: 'FIGURE SPACE',
  0x2008: 'PUNCTUATION SPACE',
  0x2009: 'THIN SPACE',
  0x200a: 'HAIR SPACE',
  0x200b: 'ZERO WIDTH SPACE',
  0x200c: 'ZERO WIDTH NON-JOINER',
  0x200d: 'ZERO WIDTH JOINER',
  0x200e: 'LEFT-TO-RIGHT MARK',
  0x200f: 'RIGHT-TO-LEFT MARK',
  0x2028: 'LINE SEPARATOR',
  0x2029: 'PARAGRAPH SEPARATOR',
  0x202a: 'LEFT-TO-RIGHT EMBEDDING',
  0x202b: 'RIGHT-TO-LEFT EMBEDDING',
  0x202c: 'POP DIRECTIONAL FORMATTING',
  0x202d: 'LEFT-TO-RIGHT OVERRIDE',
  0x202e: 'RIGHT-TO-LEFT OVERRIDE',
  0x202f: 'NARROW NO-BREAK SPACE',
  0x205f: 'MEDIUM MATHEMATICAL SPACE',
  0x2060: 'WORD JOINER',
  0x3000: 'IDEOGRAPHIC SPACE',
  0xfeff: 'ZERO WIDTH NO-BREAK SPACE (BOM)',
};

/**
 * Sessizce zarar veren küme.
 *
 * Sekme ve satır sonu burada YOK: onlar görünmez ama beklenen karakterlerdir,
 * uyarı listesine koymak gürültü olurdu.
 */
const SUSPICIOUS = new Set([
  0x00a0, 0x00ad, 0x0085, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
  0x2007, 0x2008, 0x2009, 0x200a, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x2028, 0x2029,
  0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x202f, 0x205f, 0x2060, 0x3000, 0xfeff,
]);

/**
 * Yön değiştirme kontrolleri.
 *
 * "Trojan Source" saldırısında kaynak kodun görünen sırası ile derleyicinin
 * okuduğu sıra farklılaşır. Bir metin aracında bunları ayrıca işaretlemek
 * ucuz ve değerli.
 */
const BIDI = new Set([0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e]);

export type PointCategory = 'space' | 'format' | 'control' | 'mark' | 'letter' | 'number' | 'punctuation' | 'symbol' | 'other';

export interface CodePointInfo {
  /** Kod noktası sırası (UTF-16 indeksi DEĞİL). */
  index: number;
  char: string;
  codePoint: number;
  /** `U+00A0` biçiminde. */
  label: string;
  name: string | null;
  category: PointCategory;
  suspicious: boolean;
  bidi: boolean;
  utf8Bytes: number;
}

/**
 * Kategori Unicode property escape'lerinden geliyor — elle tablo tutmaya
 * gerek yok, motor zaten biliyor.
 */
function categoryOf(char: string): PointCategory {
  if (/\p{Zs}/u.test(char)) return 'space';
  if (/\p{Cf}/u.test(char)) return 'format';
  if (/\p{Cc}/u.test(char)) return 'control';
  if (/\p{M}/u.test(char)) return 'mark';
  if (/\p{L}/u.test(char)) return 'letter';
  if (/\p{N}/u.test(char)) return 'number';
  if (/\p{P}/u.test(char)) return 'punctuation';
  if (/\p{S}/u.test(char)) return 'symbol';
  return 'other';
}

const encoder = new TextEncoder();

export function inspectPoints(text: string): CodePointInfo[] {
  return [...text].map((char, index) => {
    const codePoint = char.codePointAt(0) as number;
    return {
      index,
      char,
      codePoint,
      label: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
      name: NOTABLE[codePoint] ?? null,
      category: categoryOf(char),
      suspicious: SUSPICIOUS.has(codePoint),
      bidi: BIDI.has(codePoint),
      utf8Bytes: encoder.encode(char).length,
    };
  });
}

export interface UnicodeCounts {
  /** `[...text].length` — gerçek karakter sayısı. */
  codePoints: number;
  /** `text.length` — JS'in saydığı; emoji'de kod noktasının iki katı. */
  utf16Units: number;
  utf8Bytes: number;
  /** Kullanıcının "karakter" dediği şey; `👨‍👩‍👧` tek grafemdir. */
  graphemes: number;
}

export function countText(text: string): UnicodeCounts {
  let graphemes = text.length;
  if (typeof Intl.Segmenter === 'function') {
    graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length;
  }

  return {
    codePoints: [...text].length,
    utf16Units: text.length,
    utf8Bytes: encoder.encode(text).length,
    graphemes,
  };
}

export interface NormalizationInfo {
  /** NFC ile NFD farklıysa metinde birleşen işaret var demektir. */
  differs: boolean;
  isNfc: boolean;
  nfc: string;
  nfd: string;
}

/**
 * Türkçe için önemli: `ğ` hem tek kod noktası (U+011F) hem de `g` +
 * birleşen breve (U+0306) olarak yazılabilir. Ekranda aynı görünürler ama
 * `===` karşılaştırması tutmaz. Veritabanında biri, girdide diğeri varsa
 * kayıt "bulunamaz".
 */
export function normalization(text: string): NormalizationInfo {
  const nfc = text.normalize('NFC');
  const nfd = text.normalize('NFD');
  return { differs: nfc !== nfd, isNfc: text === nfc, nfc, nfd };
}

/** Şüpheli karakterleri temizler; NBSP normal boşluğa döner, kalanı silinir. */
export function stripInvisible(text: string): string {
  return [...text]
    .map((char) => {
      const codePoint = char.codePointAt(0) as number;
      if (!SUSPICIOUS.has(codePoint)) return char;
      // Boşluk sınıfındakiler sıradan boşluğa indirgenir — silmek kelimeleri
      // birbirine yapıştırırdı.
      return /\p{Zs}/u.test(char) ? ' ' : '';
    })
    .join('');
}
