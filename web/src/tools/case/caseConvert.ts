export type CaseId =
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'constant'
  | 'kebab'
  | 'title'
  | 'sentence'
  | 'dot';

export interface CaseFormat {
  id: CaseId;
  /** Örnek çıktı; arayüzde etiketin yanında gösteriliyor. */
  sample: string;
}

export const CASE_FORMATS: readonly CaseFormat[] = [
  { id: 'camel', sample: 'kitapId' },
  { id: 'pascal', sample: 'KitapId' },
  { id: 'snake', sample: 'kitap_id' },
  { id: 'constant', sample: 'KITAP_ID' },
  { id: 'kebab', sample: 'kitap-id' },
  { id: 'title', sample: 'Kitap Id' },
  { id: 'sentence', sample: 'Kitap id' },
  { id: 'dot', sample: 'kitap.id' },
];

/**
 * Tanımlayıcıyı kelimelere böler.
 *
 * Zor kısım kısaltmalar: `XMLHttpRequest` → `XML | Http | Request`. Naif bir
 * "büyük harfte böl" kuralı `X | M | L | Http...` üretirdi. Kural şu: büyük
 * harf dizisi, ardından küçük harf geliyorsa son büyük harf bir sonraki
 * kelimeye aittir.
 */
export function splitWords(input: string): string[] {
  const words: string[] = [];
  let current = '';

  const flush = () => {
    if (current !== '') words.push(current);
    current = '';
  };

  const chars = [...input];
  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i] as string;

    // Ayraçlar: alt çizgi, tire, nokta, boşluk, eğik çizgi
    if (/[\s_\-./\\]/u.test(char)) {
      flush();
      continue;
    }

    const isUpper = char !== char.toLocaleLowerCase() && char === char.toLocaleUpperCase();
    const previous = chars[i - 1];
    const next = chars[i + 1];

    if (isUpper && previous !== undefined) {
      const previousLower = previous === previous.toLocaleLowerCase() && previous !== previous.toLocaleUpperCase();
      const nextLower = next !== undefined && next === next.toLocaleLowerCase() && next !== next.toLocaleUpperCase();
      // küçük→BÜYÜK sınırı, ya da BÜYÜK dizisinin sonu (XMLHttp → XML | Http)
      if (previousLower || nextLower) flush();
    }

    // Rakam ↔ harf sınırı da kelime ayırır: user2Name → user | 2 | Name
    if (previous !== undefined && /\p{N}/u.test(char) !== /\p{N}/u.test(previous)) flush();

    current += char;
  }

  flush();
  return words;
}

/**
 * Kasa dönüşümü için yerel.
 *
 * Türkçe'de `i` → `İ` ve `I` → `ı`; invariant'ta `i` → `I` ve `I` → `i`.
 * Bu, .NET'te `ToUpper()`'ın kültüre göre farklı sonuç vermesiyle aynı tuzak:
 * `tr-TR` altında `"file".ToUpper()` → `FİLE`. Tanımlayıcı üretirken
 * neredeyse her zaman invariant istenir; metin başlığı için Türkçe.
 */
export type CaseLocale = 'invariant' | 'tr';

const upper = (value: string, locale: CaseLocale) =>
  locale === 'tr' ? value.toLocaleUpperCase('tr-TR') : value.toUpperCase();

const lower = (value: string, locale: CaseLocale) =>
  locale === 'tr' ? value.toLocaleLowerCase('tr-TR') : value.toLowerCase();

const capitalize = (value: string, locale: CaseLocale) =>
  upper(value.slice(0, 1), locale) + lower(value.slice(1), locale);

export function convertCase(input: string, target: CaseId, locale: CaseLocale = 'invariant'): string {
  const words = splitWords(input);
  if (words.length === 0) return '';

  switch (target) {
    case 'camel':
      return words
        .map((word, index) => (index === 0 ? lower(word, locale) : capitalize(word, locale)))
        .join('');
    case 'pascal':
      return words.map((word) => capitalize(word, locale)).join('');
    case 'snake':
      return words.map((word) => lower(word, locale)).join('_');
    case 'constant':
      return words.map((word) => upper(word, locale)).join('_');
    case 'kebab':
      return words.map((word) => lower(word, locale)).join('-');
    case 'title':
      return words.map((word) => capitalize(word, locale)).join(' ');
    case 'sentence': {
      const [first, ...rest] = words;
      return [capitalize(first as string, locale), ...rest.map((word) => lower(word, locale))].join(' ');
    }
    case 'dot':
      return words.map((word) => lower(word, locale)).join('.');
  }
}

/** Her satırı bağımsız çevirir; boş satırlar korunur (liste hizası bozulmasın). */
export function convertLines(input: string, target: CaseId, locale: CaseLocale = 'invariant'): string {
  return input
    .split('\n')
    .map((line) => (line.trim() === '' ? line : convertCase(line, target, locale)))
    .join('\n');
}

/**
 * Türkçe ve invariant sonuçları farklı mı?
 *
 * Farklıysa arayüz uyarı gösteriyor — çünkü bu fark, koda sızdığında
 * bulunması en zor hatalardan biri.
 */
export function localeDiffers(input: string, target: CaseId): boolean {
  return convertLines(input, target, 'invariant') !== convertLines(input, target, 'tr');
}
