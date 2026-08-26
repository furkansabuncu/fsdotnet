import { err, ok, type ToolResult } from '../types';

/**
 * Tarih biçim kalıplarını dört lehçe arasında çevirir.
 *
 * Aracın varlık sebebi, aynı harflerin lehçeden lehçeye BAŞKA şey demesi:
 * Oracle'da `MI` dakika ve `MM` ay, .NET'te `mm` dakika ve `MM` ay,
 * Delphi'de dakika `nn` — `mm` yine ay. Bir kalıbı elle taşırken en sık
 * yapılan hata `HH:MM` yazıp ay basmak, ikincisi Oracle'da `HH` yazıp
 * 24 saat sanmak (o 12 saatliktir).
 *
 * Bu yüzden doğrudan lehçe→lehçe eşleme YOK: her kalıp önce anlam
 * birimlerine (`Unit`) ayrıştırılıyor, sonra hedef lehçede yeniden
 * yazılıyor. Böylece n² eşleme tablosu yerine n ayrıştırma + n yazma
 * tablosu var ve beşinci lehçe eklemek iki tablo demek.
 */

export const DIALECTS = ['oracle', 'dotnet', 'js', 'delphi'] as const;
export type Dialect = (typeof DIALECTS)[number];

/** Kalıbın taşıdığı anlam — lehçeden bağımsız ara dil. */
export type Unit =
  | 'year4'
  | 'year2'
  | 'quarter'
  | 'month2'
  | 'month1'
  | 'monthShort'
  | 'monthLong'
  | 'day2'
  | 'day1'
  | 'dayOfYear'
  | 'weekdayShort'
  | 'weekdayLong'
  | 'weekdayNumber'
  | 'hour24_2'
  | 'hour24_1'
  | 'hour12_2'
  | 'hour12_1'
  | 'minute2'
  | 'minute1'
  | 'second2'
  | 'second1'
  | 'fraction1'
  | 'fraction2'
  | 'fraction3'
  | 'meridiemUpper'
  | 'meridiemLower'
  | 'offsetColon'
  | 'offsetCompact'
  | 'offsetHours'
  | 'zoneName'
  | 'era'
  | 'isoWeek'
  | 'isoYear'
  | 'secondsOfDay'
  | 'localeDate'
  | 'localeTime';

/**
 * Kullanıcıya gösterilecek uyarılar — düz metin değil ANAHTAR.
 *
 * Sebebi araç hatalarıyla aynı (`ToolErrorKey`): saf bir çeviri fonksiyonu
 * hangi dilde konuşulduğunu bilemez. Metinler sözlükte
 * (`dateFormat.notes`), tip oradan `satisfies` ile bağlı, yani yeni bir
 * anahtar eklenip Türkçesi yazılmazsa proje derlenmez.
 */
export type NoteKey =
  | 'oracleFm'
  | 'oracleNamePad'
  | 'oracleHh12'
  | 'oracleMinute'
  | 'dotnetSingle'
  | 'dotnetSeparator'
  | 'dotnetMeridiem'
  | 'delphiMinute'
  | 'delphiHour'
  | 'delphiSeparator'
  | 'dayjsPlugin'
  | 'dropped'
  | 'approx';

export type Piece =
  | { kind: 'unit'; unit: Unit }
  | { kind: 'literal'; text: string };

/* ------------------------------------------------------------------ */
/* Ayrıştırma tabloları                                                */
/* ------------------------------------------------------------------ */

interface Match {
  token: string;
  unit: Unit;
  /** Token'ın kendisi bir tuzaksa parse sırasında düşülen uyarı. */
  warn?: NoteKey;
}

/* Sıra ÖNEMLİ değil — tablolar kullanılmadan önce uzunluğa göre
   sıralanıyor. Elle sıralamak, birinin listeye `MM`i `MONTH`ten önce
   eklemesiyle sessizce bozulurdu. */

const ORACLE_TOKENS: Match[] = [
  { token: 'YYYY', unit: 'year4' },
  { token: 'SYYYY', unit: 'year4' },
  { token: 'RRRR', unit: 'year4' },
  { token: 'YY', unit: 'year2' },
  { token: 'RR', unit: 'year2' },
  { token: 'IYYY', unit: 'isoYear' },
  { token: 'IW', unit: 'isoWeek' },
  { token: 'Q', unit: 'quarter' },
  { token: 'MONTH', unit: 'monthLong' },
  { token: 'MON', unit: 'monthShort' },
  { token: 'MM', unit: 'month2' },
  { token: 'MI', unit: 'minute2' },
  { token: 'DDD', unit: 'dayOfYear' },
  { token: 'DAY', unit: 'weekdayLong' },
  { token: 'DY', unit: 'weekdayShort' },
  { token: 'DD', unit: 'day2' },
  { token: 'D', unit: 'weekdayNumber' },
  { token: 'HH24', unit: 'hour24_2' },
  { token: 'HH12', unit: 'hour12_2' },
  // Çıplak HH, HH12'nin eş anlamlısı. Sahada en pahalı yanlış anlamalardan
  // biri: `HH:MI` yazan kişi 24 saat sanıyor, 13:05 saat 01:05 basılıyor.
  { token: 'HH', unit: 'hour12_2', warn: 'oracleHh12' },
  { token: 'SSSSS', unit: 'secondsOfDay' },
  { token: 'SS', unit: 'second2' },
  { token: 'FF1', unit: 'fraction1' },
  { token: 'FF2', unit: 'fraction2' },
  { token: 'FF3', unit: 'fraction3' },
  { token: 'FF6', unit: 'fraction3', warn: 'approx' },
  { token: 'FF9', unit: 'fraction3', warn: 'approx' },
  { token: 'FF', unit: 'fraction3', warn: 'approx' },
  { token: 'A.M.', unit: 'meridiemUpper' },
  { token: 'P.M.', unit: 'meridiemUpper' },
  { token: 'AM', unit: 'meridiemUpper' },
  { token: 'PM', unit: 'meridiemUpper' },
  { token: 'TZH:TZM', unit: 'offsetColon' },
  { token: 'TZHTZM', unit: 'offsetCompact' },
  { token: 'TZH', unit: 'offsetHours' },
  { token: 'TZR', unit: 'zoneName' },
  { token: 'TZD', unit: 'zoneName' },
  { token: 'AD', unit: 'era' },
  { token: 'BC', unit: 'era' },
];

const DOTNET_TOKENS: Match[] = [
  { token: 'yyyy', unit: 'year4' },
  { token: 'yy', unit: 'year2' },
  { token: 'MMMM', unit: 'monthLong' },
  { token: 'MMM', unit: 'monthShort' },
  { token: 'MM', unit: 'month2' },
  { token: 'M', unit: 'month1' },
  { token: 'dddd', unit: 'weekdayLong' },
  { token: 'ddd', unit: 'weekdayShort' },
  { token: 'dd', unit: 'day2' },
  { token: 'd', unit: 'day1' },
  { token: 'HH', unit: 'hour24_2' },
  { token: 'H', unit: 'hour24_1' },
  { token: 'hh', unit: 'hour12_2' },
  { token: 'h', unit: 'hour12_1' },
  { token: 'mm', unit: 'minute2' },
  { token: 'm', unit: 'minute1' },
  { token: 'ss', unit: 'second2' },
  { token: 's', unit: 'second1' },
  { token: 'fff', unit: 'fraction3' },
  { token: 'ff', unit: 'fraction2' },
  { token: 'f', unit: 'fraction1' },
  // Büyük F, sondaki sıfırları atar; küçük f her zaman basar. Fark
  // yalnızca çıktıda görünür, kalıpta aynı alana denk gelirler.
  { token: 'FFF', unit: 'fraction3', warn: 'approx' },
  { token: 'FF', unit: 'fraction2', warn: 'approx' },
  { token: 'F', unit: 'fraction1', warn: 'approx' },
  { token: 'tt', unit: 'meridiemUpper' },
  { token: 't', unit: 'meridiemUpper', warn: 'approx' },
  { token: 'zzz', unit: 'offsetColon' },
  { token: 'zz', unit: 'offsetHours' },
  { token: 'z', unit: 'offsetHours' },
  { token: 'K', unit: 'offsetColon', warn: 'approx' },
  { token: 'gg', unit: 'era' },
  { token: 'g', unit: 'era' },
];

const JS_TOKENS: Match[] = [
  { token: 'YYYY', unit: 'year4' },
  { token: 'YY', unit: 'year2' },
  { token: 'Q', unit: 'quarter' },
  { token: 'MMMM', unit: 'monthLong' },
  { token: 'MMM', unit: 'monthShort' },
  { token: 'MM', unit: 'month2' },
  { token: 'M', unit: 'month1' },
  { token: 'DDD', unit: 'dayOfYear' },
  { token: 'DD', unit: 'day2' },
  { token: 'D', unit: 'day1' },
  { token: 'dddd', unit: 'weekdayLong' },
  { token: 'ddd', unit: 'weekdayShort' },
  { token: 'd', unit: 'weekdayNumber' },
  { token: 'HH', unit: 'hour24_2' },
  { token: 'H', unit: 'hour24_1' },
  { token: 'hh', unit: 'hour12_2' },
  { token: 'h', unit: 'hour12_1' },
  { token: 'mm', unit: 'minute2' },
  { token: 'm', unit: 'minute1' },
  { token: 'ss', unit: 'second2' },
  { token: 's', unit: 'second1' },
  { token: 'SSS', unit: 'fraction3' },
  { token: 'SS', unit: 'fraction2' },
  { token: 'S', unit: 'fraction1' },
  { token: 'A', unit: 'meridiemUpper' },
  { token: 'a', unit: 'meridiemLower' },
  { token: 'ZZ', unit: 'offsetCompact' },
  { token: 'Z', unit: 'offsetColon' },
  { token: 'W', unit: 'isoWeek' },
  { token: 'z', unit: 'zoneName' },
];

const DELPHI_TOKENS: Match[] = [
  { token: 'yyyy', unit: 'year4' },
  { token: 'yy', unit: 'year2' },
  { token: 'mmmm', unit: 'monthLong' },
  { token: 'mmm', unit: 'monthShort' },
  { token: 'mm', unit: 'month2' },
  { token: 'm', unit: 'month1' },
  { token: 'dddddd', unit: 'localeDate' },
  { token: 'ddddd', unit: 'localeDate' },
  { token: 'dddd', unit: 'weekdayLong' },
  { token: 'ddd', unit: 'weekdayShort' },
  { token: 'dd', unit: 'day2' },
  { token: 'd', unit: 'day1' },
  { token: 'hh', unit: 'hour24_2' },
  { token: 'h', unit: 'hour24_1' },
  { token: 'nn', unit: 'minute2' },
  { token: 'n', unit: 'minute1' },
  { token: 'ss', unit: 'second2' },
  { token: 's', unit: 'second1' },
  { token: 'zzz', unit: 'fraction3' },
  { token: 'z', unit: 'fraction1' },
  { token: 'ampm', unit: 'meridiemUpper' },
  { token: 'am/pm', unit: 'meridiemUpper' },
  { token: 'a/p', unit: 'meridiemUpper' },
  { token: 'tt', unit: 'localeTime' },
  { token: 't', unit: 'localeTime' },
];

const TOKENS: Record<Dialect, Match[]> = {
  oracle: ORACLE_TOKENS,
  dotnet: DOTNET_TOKENS,
  js: JS_TOKENS,
  delphi: DELPHI_TOKENS,
};

/** Oracle ve Delphi kalıpları büyük/küçük harfe duyarsız; .NET ve dayjs değil. */
const CASE_INSENSITIVE: Record<Dialect, boolean> = {
  oracle: true,
  dotnet: false,
  js: false,
  delphi: true,
};

/* Uzun token önce denenmeli, yoksa `MONTH` girdisinde `MON` eşleşir ve
   geriye `TH` düz metin olarak kalır. */
const SORTED: Record<Dialect, Match[]> = {
  oracle: sortByTokenLength(ORACLE_TOKENS),
  dotnet: sortByTokenLength(DOTNET_TOKENS),
  js: sortByTokenLength(JS_TOKENS),
  delphi: sortByTokenLength(DELPHI_TOKENS),
};

function sortByTokenLength(table: Match[]): Match[] {
  return [...table].sort((a, b) => b.token.length - a.token.length);
}

/** Oracle `FM` dolgu kapattığında hangi birim hangisine dönüşür. */
const UNPADDED: Partial<Record<Unit, Unit>> = {
  month2: 'month1',
  day2: 'day1',
  hour24_2: 'hour24_1',
  hour12_2: 'hour12_1',
  minute2: 'minute1',
  second2: 'second1',
};

/** Lehçenin düz metin için kullandığı tırnaklar. */
const QUOTES: Record<Dialect, string[]> = {
  oracle: ['"'],
  dotnet: ["'", '"'],
  js: [],
  delphi: ['"', "'"],
};

/* ------------------------------------------------------------------ */
/* Ayrıştırma                                                          */
/* ------------------------------------------------------------------ */

export interface Parsed {
  pieces: Piece[];
  /** Kalıbın KENDİSİYLE ilgili uyarılar — hedeften bağımsız. */
  warnings: NoteKey[];
}

export function parsePattern(input: string, dialect: Dialect): ToolResult<Parsed> {
  if (input.trim() === '') return err('dateFormatEmpty');

  const table = SORTED[dialect];
  const fold = CASE_INSENSITIVE[dialect];
  const haystack = fold ? input.toUpperCase() : input;

  /* Delphi'de `hh` tek başına 24 saatlik, ama aynı kalıpta `ampm` varsa
     12 saatliğe döner. Karar tek tek token'a bakarak verilemez, kalıbın
     tamamı görülmeli — bu yüzden önden taranıyor. */
  const delphiMeridiem = dialect === 'delphi' && /ampm|am\/pm|a\/p/i.test(input);

  const pieces: Piece[] = [];
  const warnings = new Set<NoteKey>();
  let padded = true;
  let index = 0;

  const pushLiteral = (text: string) => {
    const last = pieces[pieces.length - 1];
    if (last?.kind === 'literal') last.text += text;
    else pieces.push({ kind: 'literal', text });
  };

  while (index < input.length) {
    const char = input[index] as string;

    // Tırnaklı düz metin. Kapanış yoksa kalanın tamamı metindir —
    // yarım tırnak yazmak yaygın ve kalıbı çöpe atmaya değmez.
    if (QUOTES[dialect].includes(char)) {
      const close = input.indexOf(char, index + 1);
      const end = close === -1 ? input.length : close;
      pushLiteral(input.slice(index + 1, end));
      index = end + 1;
      continue;
    }

    if (dialect === 'js' && char === '[') {
      const close = input.indexOf(']', index + 1);
      const end = close === -1 ? input.length : close;
      pushLiteral(input.slice(index + 1, end));
      index = end + 1;
      continue;
    }

    if (dialect === 'dotnet' && char === '\\') {
      if (index + 1 < input.length) pushLiteral(input[index + 1] as string);
      index += 2;
      continue;
    }

    /* .NET'te tek karakterlik özel belirteç `%` ile yazılır (`%M`); işareti
       atlıyoruz, çıktı tarafında gerekiyorsa yeniden ekleniyor. */
    if (dialect === 'dotnet' && char === '%') {
      index += 1;
      continue;
    }

    if (dialect === 'oracle' && haystack.startsWith('FM', index)) {
      padded = !padded;
      index += 2;
      continue;
    }

    const match = table.find((entry) =>
      haystack.startsWith(fold ? entry.token.toUpperCase() : entry.token, index),
    );

    if (!match) {
      pushLiteral(char);
      index += 1;
      continue;
    }

    let unit = match.unit;
    if (match.warn) warnings.add(match.warn);

    if (dialect === 'oracle') {
      if (!padded) unit = UNPADDED[unit] ?? unit;
      /* `MONTH` ve `DAY` çıktıyı 9 karaktere kadar BOŞLUKLA doldurur —
         `TO_CHAR(d,'MONTH')` → "AĞUSTOS  ". Bunu bilmeyen kırpma kodu
         yazıyor; doğrusu `FM` eklemek. */
      if (padded && (unit === 'monthLong' || unit === 'weekdayLong')) {
        warnings.add('oracleNamePad');
      }
    }

    if (delphiMeridiem) {
      if (unit === 'hour24_2') unit = 'hour12_2';
      else if (unit === 'hour24_1') unit = 'hour12_1';
    }

    pieces.push({ kind: 'unit', unit });
    index += match.token.length;
  }

  if (!pieces.some((piece) => piece.kind === 'unit')) return err('dateFormatNoTokens');

  return ok({ pieces, warnings: [...warnings] });
}

/* ------------------------------------------------------------------ */
/* Yazma                                                               */
/* ------------------------------------------------------------------ */

interface Emit {
  token: string;
  /**
   * Oracle: bu token'ın gerektirdiği dolgu durumu.
   *
   * Yalnızca dolgusu ANLAMLI olan birimlerde var. `YYYY`, `MON`, `Q` gibi
   * birimlerde tanımsız — çünkü ayrıştırma da onlarda dolgu durumunu
   * korumuyor, yani burada `FM` yazmak kalıba karşılığı olmayan bir
   * anahtar eklemek olurdu (`FMDD.MM.FMYYYY` gibi).
   */
  fill?: 'on' | 'off';
  /** dayjs: çekirdekte yok, eklenti gerekiyor. */
  plugin?: boolean;
  /** Karşılık birebir değil, en yakını. */
  approx?: boolean;
}

type EmitTable = Partial<Record<Unit, Emit>>;

const ORACLE_EMIT: EmitTable = {
  year4: { token: 'YYYY' },
  year2: { token: 'YY' },
  quarter: { token: 'Q' },
  month2: { token: 'MM', fill: 'on' },
  month1: { token: 'MM', fill: 'off' },
  monthShort: { token: 'MON' },
  monthLong: { token: 'MONTH', fill: 'off' },
  day2: { token: 'DD', fill: 'on' },
  day1: { token: 'DD', fill: 'off' },
  dayOfYear: { token: 'DDD' },
  weekdayShort: { token: 'DY' },
  weekdayLong: { token: 'DAY', fill: 'off' },
  weekdayNumber: { token: 'D' },
  hour24_2: { token: 'HH24', fill: 'on' },
  hour24_1: { token: 'HH24', fill: 'off' },
  hour12_2: { token: 'HH12', fill: 'on' },
  hour12_1: { token: 'HH12', fill: 'off' },
  minute2: { token: 'MI', fill: 'on' },
  minute1: { token: 'MI', fill: 'off' },
  second2: { token: 'SS', fill: 'on' },
  second1: { token: 'SS', fill: 'off' },
  fraction1: { token: 'FF1' },
  fraction2: { token: 'FF2' },
  fraction3: { token: 'FF3' },
  meridiemUpper: { token: 'AM' },
  meridiemLower: { token: 'am' },
  offsetColon: { token: 'TZH:TZM' },
  offsetCompact: { token: 'TZHTZM' },
  offsetHours: { token: 'TZH' },
  zoneName: { token: 'TZR' },
  era: { token: 'AD' },
  isoWeek: { token: 'IW' },
  isoYear: { token: 'IYYY' },
  secondsOfDay: { token: 'SSSSS' },
};

const DOTNET_EMIT: EmitTable = {
  year4: { token: 'yyyy' },
  year2: { token: 'yy' },
  month2: { token: 'MM' },
  month1: { token: 'M' },
  monthShort: { token: 'MMM' },
  monthLong: { token: 'MMMM' },
  day2: { token: 'dd' },
  day1: { token: 'd' },
  weekdayShort: { token: 'ddd' },
  weekdayLong: { token: 'dddd' },
  hour24_2: { token: 'HH' },
  hour24_1: { token: 'H' },
  hour12_2: { token: 'hh' },
  hour12_1: { token: 'h' },
  minute2: { token: 'mm' },
  minute1: { token: 'm' },
  second2: { token: 'ss' },
  second1: { token: 's' },
  fraction1: { token: 'f' },
  fraction2: { token: 'ff' },
  fraction3: { token: 'fff' },
  meridiemUpper: { token: 'tt' },
  // .NET'te küçük harfli bir belirteç yok; ÖÖ/öö farkı kültürden gelir.
  meridiemLower: { token: 'tt', approx: true },
  offsetColon: { token: 'zzz' },
  offsetHours: { token: 'zz' },
  era: { token: 'gg' },
};

const JS_EMIT: EmitTable = {
  year4: { token: 'YYYY' },
  year2: { token: 'YY' },
  quarter: { token: 'Q', plugin: true },
  month2: { token: 'MM' },
  month1: { token: 'M' },
  monthShort: { token: 'MMM' },
  monthLong: { token: 'MMMM' },
  day2: { token: 'DD' },
  day1: { token: 'D' },
  dayOfYear: { token: 'DDD', plugin: true },
  weekdayShort: { token: 'ddd' },
  weekdayLong: { token: 'dddd' },
  weekdayNumber: { token: 'd' },
  hour24_2: { token: 'HH' },
  hour24_1: { token: 'H' },
  hour12_2: { token: 'hh' },
  hour12_1: { token: 'h' },
  minute2: { token: 'mm' },
  minute1: { token: 'm' },
  second2: { token: 'ss' },
  second1: { token: 's' },
  fraction1: { token: 'S' },
  fraction2: { token: 'SS' },
  fraction3: { token: 'SSS' },
  meridiemUpper: { token: 'A' },
  meridiemLower: { token: 'a' },
  offsetColon: { token: 'Z' },
  offsetCompact: { token: 'ZZ' },
  offsetHours: { token: 'Z', approx: true },
  zoneName: { token: 'z', plugin: true },
  isoWeek: { token: 'W', plugin: true },
};

const DELPHI_EMIT: EmitTable = {
  year4: { token: 'yyyy' },
  year2: { token: 'yy' },
  month2: { token: 'mm' },
  month1: { token: 'm' },
  monthShort: { token: 'mmm' },
  monthLong: { token: 'mmmm' },
  day2: { token: 'dd' },
  day1: { token: 'd' },
  weekdayShort: { token: 'ddd' },
  weekdayLong: { token: 'dddd' },
  hour24_2: { token: 'hh' },
  hour24_1: { token: 'h' },
  hour12_2: { token: 'hh' },
  hour12_1: { token: 'h' },
  minute2: { token: 'nn' },
  minute1: { token: 'n' },
  second2: { token: 'ss' },
  second1: { token: 's' },
  fraction1: { token: 'z' },
  fraction2: { token: 'zzz', approx: true },
  fraction3: { token: 'zzz' },
  meridiemUpper: { token: 'ampm' },
  meridiemLower: { token: 'am/pm', approx: true },
  localeDate: { token: 'ddddd' },
  localeTime: { token: 't' },
};

const EMIT: Record<Dialect, EmitTable> = {
  oracle: ORACLE_EMIT,
  dotnet: DOTNET_EMIT,
  js: JS_EMIT,
  delphi: DELPHI_EMIT,
};

/**
 * .NET'te TEK karakterlik bir kalıp özel değil STANDART belirteç sayılır:
 * `ToString("M")` ayı değil, "24 Ağustos"u verir. Doğrusu `%M`.
 */
const DOTNET_STANDARD = new Set('dDfFgGmMoOrRstTuUyY'.split(''));

const MINUTE_UNITS = new Set<Unit>(['minute1', 'minute2']);
const HOUR12_UNITS = new Set<Unit>(['hour12_1', 'hour12_2']);
const MERIDIEM_UNITS = new Set<Unit>(['meridiemUpper', 'meridiemLower']);

export interface Translation {
  dialect: Dialect;
  pattern: string;
  notes: NoteKey[];
  /** Hedefte karşılığı olmadığı için kalıptan DÜŞEN birimler. */
  dropped: Unit[];
}

export function emitPattern(pieces: Piece[], dialect: Dialect): Translation {
  const table = EMIT[dialect];
  const notes = new Set<NoteKey>();
  const dropped: Unit[] = [];
  let out = '';
  let padded = true;

  for (const piece of pieces) {
    if (piece.kind === 'literal') {
      if (piece.text === '') continue;
      if (dialect === 'dotnet' && /[/:]/.test(piece.text)) notes.add('dotnetSeparator');
      if (dialect === 'delphi' && /[/:]/.test(piece.text)) notes.add('delphiSeparator');
      out += escapeLiteral(piece.text, dialect);
      continue;
    }

    const emit = table[piece.unit];
    if (!emit) {
      dropped.push(piece.unit);
      notes.add('dropped');
      continue;
    }

    if (dialect === 'oracle' && emit.fill !== undefined) {
      const wantPadded = emit.fill === 'on';
      if (wantPadded !== padded) {
        out += 'FM';
        padded = wantPadded;
        notes.add('oracleFm');
      }
    }

    if (emit.plugin) notes.add('dayjsPlugin');
    if (emit.approx) notes.add('approx');
    if (dialect === 'dotnet' && MERIDIEM_UNITS.has(piece.unit)) notes.add('dotnetMeridiem');
    if (dialect === 'oracle' && MINUTE_UNITS.has(piece.unit)) notes.add('oracleMinute');
    if (dialect === 'delphi' && MINUTE_UNITS.has(piece.unit)) notes.add('delphiMinute');

    out += emit.token;
  }

  /* Delphi'de saat belirteci tek: `hh`. 12 saatlik okunması için aynı
     kalıpta `ampm` bulunmak ZORUNDA — yoksa 24 saat basar ve kalıp
     sessizce başka bir şey anlatır. */
  if (
    dialect === 'delphi' &&
    pieces.some((piece) => piece.kind === 'unit' && HOUR12_UNITS.has(piece.unit)) &&
    !pieces.some((piece) => piece.kind === 'unit' && MERIDIEM_UNITS.has(piece.unit))
  ) {
    notes.add('delphiHour');
  }

  if (dialect === 'dotnet' && out.length === 1 && DOTNET_STANDARD.has(out)) {
    out = `%${out}`;
    notes.add('dotnetSingle');
  }

  return { dialect, pattern: out, notes: [...notes], dropped };
}

/**
 * Düz metni hedef lehçede metin olarak kalacak biçimde yazar.
 *
 * `/` ve `:` .NET ile Delphi'de karakter DEĞİL, kültürün tarih/saat ayracı
 * yer tutucusudur. Yalnızca `/` tırnaklanıyor: tr-TR altında nokta basıyor,
 * yani `dd/MM/yyyy` yazan kişi 24.08.2026 alıyor. `:` neredeyse her kültürde
 * yine iki nokta olduğu için serbest bırakıldı — tırnaklamak çıktıyı okunmaz
 * hâle getirir, kazancı yok. Not metni ikisini de anlatıyor.
 */
function escapeLiteral(text: string, dialect: Dialect): string {
  switch (dialect) {
    case 'oracle':
      return /[A-Za-z"]/.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text;
    case 'dotnet':
      return /[A-Za-z/'"\\%]/.test(text) ? `'${text.replace(/'/g, "\\'")}'` : text;
    case 'js':
      return /[A-Za-z[\]]/.test(text) ? `[${text.replace(/[[\]]/g, '')}]` : text;
    case 'delphi':
      if (!/[A-Za-z/"']/.test(text)) return text;
      return text.includes('"') ? `'${text.replace(/'/g, '')}'` : `"${text}"`;
  }
}

/** Kaynak lehçe hariç, diğer üçüne çeviri. */
export function translate(pieces: Piece[], from: Dialect): Translation[] {
  return DIALECTS.filter((dialect) => dialect !== from).map((dialect) =>
    emitPattern(pieces, dialect),
  );
}

/* ------------------------------------------------------------------ */
/* Canlı örnek                                                         */
/* ------------------------------------------------------------------ */

/**
 * Örneği `Date` yerine düz alanlardan üretiyoruz.
 *
 * Sebebi test edilebilirlik: `Date`in yerel alanları makinenin saat
 * dilimine bağlı, yani aynı test geliştirici makinesinde ve CI'da (UTC)
 * farklı sonuç verirdi.
 */
export interface SampleTime {
  year: number;
  /** 1-12. */
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  ms: number;
  /** UTC'ye göre dakika cinsinden fark; +03:00 için 180. */
  offsetMinutes: number;
  zoneName: string;
}

export function sampleFromDate(date: Date, zoneName: string): SampleTime {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    ms: date.getMilliseconds(),
    // getTimezoneOffset() işareti TERS: +03:00 için -180 döner.
    offsetMinutes: -date.getTimezoneOffset(),
    zoneName,
  };
}

const pad = (value: number, width: number) => String(value).padStart(width, '0');

function isoWeekParts(time: SampleTime): { week: number; year: number } {
  const date = new Date(Date.UTC(time.year, time.month - 1, time.day));
  // Perşembe'ye kaydır: ISO haftası, içindeki perşembenin yılına aittir.
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7) + 3);
  const year = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3,
  );
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return { week, year };
}

function offsetText(minutes: number, style: 'colon' | 'compact' | 'hours'): string {
  const sign = minutes < 0 ? '-' : '+';
  const total = Math.abs(minutes);
  const hours = pad(Math.floor(total / 60), 2);
  if (style === 'hours') return `${sign}${hours}`;
  const rest = pad(total % 60, 2);
  return style === 'colon' ? `${sign}${hours}:${rest}` : `${sign}${hours}${rest}`;
}

/**
 * Tek bir örnek çıktı üretir — dört kalıbın da AYNI şeyi anlattığını
 * göstermek için. Ay ve gün adları site diline göre; gerçek sistemde
 * `NLS_DATE_LANGUAGE`, `CultureInfo` ya da dayjs yereli belirler.
 */
export function renderSample(pieces: Piece[], time: SampleTime, locale: string): string {
  const utc = new Date(
    Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute, time.second, time.ms),
  );
  const name = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(utc);

  const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12;
  const startOfYear = Date.UTC(time.year, 0, 1);
  const dayOfYear = Math.floor((Date.UTC(time.year, time.month - 1, time.day) - startOfYear) / 86_400_000) + 1;

  const value = (unit: Unit): string => {
    switch (unit) {
      case 'year4': return pad(time.year, 4);
      case 'year2': return pad(time.year % 100, 2);
      case 'quarter': return String(Math.ceil(time.month / 3));
      case 'month2': return pad(time.month, 2);
      case 'month1': return String(time.month);
      case 'monthShort': return name({ month: 'short' });
      case 'monthLong': return name({ month: 'long' });
      case 'day2': return pad(time.day, 2);
      case 'day1': return String(time.day);
      case 'dayOfYear': return pad(dayOfYear, 3);
      case 'weekdayShort': return name({ weekday: 'short' });
      case 'weekdayLong': return name({ weekday: 'long' });
      case 'weekdayNumber': return String(utc.getUTCDay() + 1);
      case 'hour24_2': return pad(time.hour, 2);
      case 'hour24_1': return String(time.hour);
      case 'hour12_2': return pad(hour12, 2);
      case 'hour12_1': return String(hour12);
      case 'minute2': return pad(time.minute, 2);
      case 'minute1': return String(time.minute);
      case 'second2': return pad(time.second, 2);
      case 'second1': return String(time.second);
      case 'fraction1': return pad(time.ms, 3).slice(0, 1);
      case 'fraction2': return pad(time.ms, 3).slice(0, 2);
      case 'fraction3': return pad(time.ms, 3);
      case 'meridiemUpper': return time.hour < 12 ? 'AM' : 'PM';
      case 'meridiemLower': return time.hour < 12 ? 'am' : 'pm';
      case 'offsetColon': return offsetText(time.offsetMinutes, 'colon');
      case 'offsetCompact': return offsetText(time.offsetMinutes, 'compact');
      case 'offsetHours': return offsetText(time.offsetMinutes, 'hours');
      case 'zoneName': return time.zoneName;
      case 'era': return time.year > 0 ? 'AD' : 'BC';
      case 'isoWeek': return pad(isoWeekParts(time).week, 2);
      case 'isoYear': return pad(isoWeekParts(time).year, 4);
      case 'secondsOfDay':
        return pad(time.hour * 3600 + time.minute * 60 + time.second, 5);
      case 'localeDate': return name({ dateStyle: 'short' });
      case 'localeTime': return name({ timeStyle: 'short' });
    }
  };

  return pieces
    .map((piece) => (piece.kind === 'literal' ? piece.text : value(piece.unit)))
    .join('');
}

/* ------------------------------------------------------------------ */
/* Karşılaştırma tablosu                                               */
/* ------------------------------------------------------------------ */

/** Dört lehçenin yan yana dizildiği başvuru tablosunun satır sırası. */
export const UNIT_ORDER: Unit[] = [
  'year4', 'year2',
  'month2', 'month1', 'monthShort', 'monthLong',
  'day2', 'day1', 'dayOfYear',
  'weekdayShort', 'weekdayLong',
  'hour24_2', 'hour12_2',
  'minute2', 'second2',
  'fraction3',
  'meridiemUpper',
  'offsetColon', 'zoneName',
  'quarter', 'isoWeek',
];

/** Bir birimin her lehçedeki token'ı; karşılığı yoksa `null`. */
export function tokenFor(unit: Unit, dialect: Dialect): string | null {
  return EMIT[dialect][unit]?.token ?? null;
}

/** Girdi doğrulama ve çeviriyi tek adımda yapan giriş noktası. */
export function convert(
  input: string,
  from: Dialect,
): ToolResult<{ parsed: Parsed; translations: Translation[] }> {
  const parsed = parsePattern(input, from);
  if (!parsed.ok) return parsed;
  return ok({ parsed: parsed.value, translations: translate(parsed.value.pieces, from) });
}

/** Tabloların hangi lehçeleri tanıdığını test edebilmek için dışa açık. */
export const TOKEN_TABLES = TOKENS;
