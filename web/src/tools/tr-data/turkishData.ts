/**
 * Türkçe test verisi.
 *
 * Değer katan kısım isim listeleri değil, CHECKSUM'lar: üretilen TCKN ve
 * IBAN gerçek doğrulama algoritmalarından geçer. Rastgele 11 hane üreten bir
 * araç, doğrulama yapan bir formda işe yaramaz.
 */

const FIRST_NAMES_M = [
  'Ahmet', 'Mehmet', 'Mustafa', 'Ömer', 'Emre', 'Burak', 'Kerem', 'Yusuf',
  'İbrahim', 'Hakan', 'Serkan', 'Onur', 'Cem', 'Barış', 'Tolga', 'Uğur',
];

const FIRST_NAMES_F = [
  'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Şeyma', 'Gülşah', 'Esra',
  'Büşra', 'Deniz', 'Selin', 'Ceren', 'Damla', 'Özge', 'İrem', 'Nur',
];

const SURNAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk',
  'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özdemir',
];

const CITIES = [
  ['34', 'İstanbul'], ['06', 'Ankara'], ['35', 'İzmir'], ['16', 'Bursa'],
  ['07', 'Antalya'], ['01', 'Adana'], ['42', 'Konya'], ['61', 'Trabzon'],
  ['27', 'Gaziantep'], ['55', 'Samsun'], ['44', 'Malatya'], ['21', 'Diyarbakır'],
] as const;

const DISTRICTS = [
  'Merkez', 'Kadıköy', 'Çankaya', 'Karşıyaka', 'Nilüfer', 'Muratpaşa',
  'Seyhan', 'Selçuklu', 'Ortahisar', 'Şahinbey',
];

const STREETS = [
  'Atatürk', 'Cumhuriyet', 'İnönü', 'Gazi', 'Fatih', 'Mimar Sinan',
  'Şehit Er', 'Kızılırmak', 'Bağdat', 'Çiçek',
];

/** IBAN'da kullanılan gerçek banka kodları. */
const BANKS = [
  ['00010', 'Ziraat Bankası'],
  ['00012', 'Halkbank'],
  ['00015', 'VakıfBank'],
  ['00046', 'Akbank'],
  ['00062', 'Garanti BBVA'],
  ['00064', 'İş Bankası'],
  ['00067', 'Yapı Kredi'],
] as const;

/** GSM operatör önekleri (yaklaşık; sahte veri için yeterli). */
const GSM_PREFIXES = ['530', '531', '532', '533', '535', '536', '541', '542', '543', '544', '505', '506', '507', '551', '552'];

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function pick<T>(list: readonly T[]): T {
  return list[randomInt(list.length)] as T;
}

function digits(count: number): string {
  return Array.from({ length: count }, () => randomInt(10)).join('');
}

// ---------------------------------------------------------------- TCKN

/**
 * T.C. Kimlik Numarası üretir.
 *
 * Kural: 11 hane, ilk hane 0 olamaz.
 *   d10 = ((d1+d3+d5+d7+d9) × 7 − (d2+d4+d6+d8)) mod 10
 *   d11 = (d1..d10 toplamı) mod 10
 */
export function generateTckn(): string {
  const first = 1 + randomInt(9);
  const rest = Array.from({ length: 8 }, () => randomInt(10));
  const d = [first, ...rest];

  const odd = (d[0] as number) + (d[2] as number) + (d[4] as number) + (d[6] as number) + (d[8] as number);
  const even = (d[1] as number) + (d[3] as number) + (d[5] as number) + (d[7] as number);

  // Fark negatif olabilir; JS'te % negatif sonuç verdiği için +10 ile düzeltilir.
  const d10 = (((odd * 7 - even) % 10) + 10) % 10;
  const d11 = ([...d, d10].reduce((sum, digit) => sum + digit, 0)) % 10;

  return [...d, d10, d11].join('');
}

export function validateTckn(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;

  const d = [...value].map(Number) as number[];
  const odd = (d[0] as number) + (d[2] as number) + (d[4] as number) + (d[6] as number) + (d[8] as number);
  const even = (d[1] as number) + (d[3] as number) + (d[5] as number) + (d[7] as number);

  if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10 === d[10];
}

// ---------------------------------------------------------------- IBAN

/**
 * ISO 13616 MOD-97-10.
 *
 * Sayı 26 hane × 2'ye kadar uzadığı için `Number` taşar; kalanı basamak
 * basamak alıyoruz — BigInt'e de gerek kalmıyor.
 */
function mod97(input: string): number {
  let remainder = 0;
  for (const char of input) {
    const value = /\d/.test(char) ? char : (char.charCodeAt(0) - 55).toString();
    for (const digit of value) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder;
}

/** TR IBAN: TR + 2 kontrol + 5 banka + 1 rezerve + 16 hesap = 26 karakter. */
export function generateIban(): { iban: string; bank: string } {
  const [code, bank] = pick(BANKS);
  const bban = `${code}0${digits(16)}`;

  // Kontrol hanesi: ülke kodu + "00" sona alınır, 98 − (mod 97) hesaplanır.
  const check = 98 - mod97(`${bban}TR00`);
  const iban = `TR${check.toString().padStart(2, '0')}${bban}`;

  return { iban, bank };
}

export function validateIban(value: string): boolean {
  const normalized = value.replace(/\s/g, '').toUpperCase();
  if (!/^TR\d{24}$/.test(normalized)) return false;
  return mod97(normalized.slice(4) + normalized.slice(0, 4)) === 1;
}

/** Okunabilirlik için dörderli gruplama: TR33 0006 1005 1978 6457 8413 26 */
export function formatIban(iban: string): string {
  return (iban.match(/.{1,4}/g) ?? []).join(' ');
}

// ---------------------------------------------------------------- kayıt

export interface Person {
  ad: string;
  soyad: string;
  tckn: string;
  dogum_tarihi: string;
  telefon: string;
  il: string;
  ilce: string;
  adres: string;
  plaka: string;
  iban: string;
  banka: string;
}

export function generatePerson(): Person {
  const female = Math.random() < 0.5;
  const [plate, city] = pick(CITIES);
  const { iban, bank } = generateIban();

  // 1940–2007 arası; ay/gün ayın uzunluğuna bakmadan 1–28 (her ayda geçerli).
  const year = 1940 + randomInt(68);
  const month = 1 + randomInt(12);
  const day = 1 + randomInt(28);

  return {
    ad: pick(female ? FIRST_NAMES_F : FIRST_NAMES_M),
    soyad: pick(SURNAMES),
    tckn: generateTckn(),
    dogum_tarihi: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    telefon: `0${pick(GSM_PREFIXES)} ${digits(3)} ${digits(2)} ${digits(2)}`,
    il: city,
    ilce: pick(DISTRICTS),
    adres: `${pick(STREETS)} Mah. ${pick(STREETS)} Sok. No:${1 + randomInt(120)} D:${1 + randomInt(20)}`,
    plaka: `${plate} ${pick(['AB', 'CD', 'EF', 'GH', 'KL', 'MN'])} ${100 + randomInt(900)}`,
    iban: formatIban(iban),
    banka: bank,
  };
}

export const MAX_ROWS = 200;

export function generatePeople(count: number): Person[] {
  const size = Math.min(Math.max(1, count), MAX_ROWS);
  return Array.from({ length: size }, generatePerson);
}

export const PERSON_FIELDS: readonly (keyof Person)[] = [
  'ad', 'soyad', 'tckn', 'dogum_tarihi', 'telefon', 'il', 'ilce', 'adres', 'plaka', 'iban', 'banka',
];

/** CSV çıktısı; virgül içeren alanlar (adres) tırnaklanır. */
export function toCsv(people: Person[], fields: readonly (keyof Person)[]): string {
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const header = fields.join(',');
  const rows = people.map((person) => fields.map((field) => escape(person[field])).join(','));
  return [header, ...rows].join('\n');
}

export function toJson(people: Person[], fields: readonly (keyof Person)[]): string {
  const trimmed = people.map((person) =>
    Object.fromEntries(fields.map((field) => [field, person[field]])),
  );
  return JSON.stringify(trimmed, null, 2);
}
