/**
 * CP1252'nin 0x80–0x9F aralığı — Latin-1'de kontrol karakteri olduğu için
 * mojibake'te en çok kaybolan 32 byte. Tanımsız konumlar (0x81, 0x8D, 0x8F,
 * 0x90, 0x9D) kendi kod noktalarıyla bırakıldı ki tablo tersine çevrilebilsin.
 */
const CP1252_HIGH = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021,
  0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x008d, 0x017d, 0x008f,
  0x0090, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d, 0x017e, 0x0178,
] as const;

const CP1252_REVERSE = new Map<number, number>(
  CP1252_HIGH.map((codePoint, index) => [codePoint, 0x80 + index]),
);

function cp1252Char(byte: number): string {
  const high = CP1252_HIGH[byte - 0x80];
  return byte >= 0x80 && byte <= 0x9f && high !== undefined
    ? String.fromCharCode(high)
    : String.fromCharCode(byte);
}

/** Metin CP1252'de temsil edilebiliyorsa byte'ları, edilemiyorsa null. */
function toCp1252(text: string): Uint8Array | null {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    const unit = text.charCodeAt(i);
    const mapped = CP1252_REVERSE.get(unit);
    if (mapped !== undefined) {
      out[i] = mapped;
    } else if (unit <= 0xff) {
      out[i] = unit;
    } else {
      // CP1252'de karşılığı yok → bu metin zaten çift kodlanmış olamaz.
      return null;
    }
  }
  return out;
}

/** Bir kod noktasının UTF-8 karşılığındaki ilk byte. */
function utf8LeadByte(codePoint: number): number {
  if (codePoint < 0x80) return codePoint;
  if (codePoint < 0x800) return 0xc0 | (codePoint >> 6);
  if (codePoint < 0x10000) return 0xe0 | (codePoint >> 12);
  return 0xf0 | (codePoint >> 18);
}

const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

/**
 * Klasik mojibake: UTF-8 byte'ları CP1252 sanılarak çözülmüş (Ã¶ → ö).
 * Metni CP1252 byte'larına geri çevirip UTF-8 olarak okuyoruz.
 */
function undoDoubleEncoding(text: string): string | null {
  const bytes = toCp1252(text);
  if (!bytes) return null;
  try {
    return strictUtf8.decode(bytes);
  } catch {
    // Geçerli UTF-8 değilse metin çift kodlanmamıştır — dokunma.
    return null;
  }
}

/**
 * Daha nadir varyant: karakterin doğrusu duruyor ama arkasına kendi UTF-8
 * öncü byte'ının CP1252 görüntüsü yapışmış (ö → öÃ, ş → şÅ, ı → ıÄ).
 *
 * Kural kendi kendini doğrular: yalnızca önündeki karakterden HESAPLANAN
 * artığa birebir eşit olan karakter silinir. Bu yüzden temiz metinde hiçbir
 * şey kaybolmaz — doğal metinde ö'yü Ã izlemez.
 */
function stripOrphanLeadBytes(text: string): string {
  const chars = [...text];
  let out = '';

  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    if (char === undefined) continue;
    out += char;

    const codePoint = char.codePointAt(0);
    if (codePoint === undefined || codePoint < 0x80) continue;

    if (chars[i + 1] === cp1252Char(utf8LeadByte(codePoint))) i += 1;
  }

  return out;
}

/**
 * Klasik mojibake imzası: öncü byte'ın görüntüsü + devam byte'ının görüntüsü.
 * Çift kodlama onarımı yalnızca bu sayıyı DÜŞÜRÜYORSA kabul edilir; aksi
 * hâlde temiz metni bozma riski var (ör. Portekizce "São").
 */
const SUSPECT_PAIR = new RegExp(
  '[\\u00c2-\\u00c5\\u00ce\\u00cf\\u00d0\\u00d1\\u00d5\\u00d8\\u00de\\u00df]' +
    '[\\u0080-\\u00bf\\u0152\\u0153\\u0160\\u0161\\u0178\\u017d\\u017e\\u0192' +
    '\\u02c6\\u02dc\\u2013\\u2014\\u2018\\u2019\\u201a\\u201c\\u201d\\u201e' +
    '\\u2020\\u2021\\u2022\\u2026\\u2030\\u2039\\u203a\\u20ac\\u2122]',
  'g',
);

function suspicion(text: string): number {
  return (text.match(SUSPECT_PAIR) ?? []).length;
}

/** Üst üste binmiş bozulmalar için tavan; 8 tur 2^8 katmanı çözer. */
const MAX_PASSES = 8;

export interface MojibakeReport {
  text: string;
  /** Kaç tur onarım uygulandı; 0 ise metin zaten temizdi. */
  passes: number;
  /** Silinen karakter sayısı. */
  removed: number;
}

/**
 * İki bozulma türünü de, birbirinin üstüne binmiş hâlde çözer:
 * her turda önce sahipsiz artıklar temizlenir, sonra çift kodlama geri alınır.
 * Değişiklik kalmayınca durur — temiz metinde 0 turda çıkar.
 */
export function repairMojibake(input: string): MojibakeReport {
  let text = input;
  let passes = 0;

  for (let i = 0; i < MAX_PASSES; i += 1) {
    const before = text;

    text = stripOrphanLeadBytes(text);

    const decoded = undoDoubleEncoding(text);
    if (decoded !== null && decoded !== text && suspicion(decoded) < suspicion(text)) {
      text = decoded;
    }

    if (text === before) break;
    passes += 1;
  }

  return { text, passes, removed: input.length - text.length };
}
