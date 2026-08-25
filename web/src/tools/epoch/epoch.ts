import { err, ok, type ToolResult } from '../types';

/**
 * 0001-01-01 ile 1970-01-01 arasındaki milisaniye farkı.
 *
 * .NET'in `DateTime.Ticks` sayacı 0001-01-01'den başlar ve 100 nanosaniyelik
 * adımlar sayar; Unix ise 1970'ten saniye sayar. Bu sabit ikisini bağlar.
 */
const TICKS_EPOCH_OFFSET_MS = 62_135_596_800_000n;

/** Bir tick 100 ns, yani milisaniye başına 10.000 tick. */
const TICKS_PER_MS = 10_000n;

export type EpochUnit = 'seconds' | 'milliseconds' | 'ticks' | 'date';

export interface EpochValue {
  date: Date;
  /** Girdinin hangi birim olarak yorumlandığı. */
  detected: EpochUnit;
}

/**
 * Girdiyi tarihe çevirir; birimi uzunluğundan tahmin eder.
 *
 * Eşikler pratik: saniye cinsinden bugünün değeri 10 hane, milisaniye 13,
 * .NET tick'i 18. Aradaki boşluklar geniş olduğu için uzunluk güvenilir bir
 * ayraç — ve kullanıcı yanılırsa birimi elle seçebiliyor.
 */
export function parseEpoch(input: string, forced?: EpochUnit): ToolResult<EpochValue> {
  const trimmed = input.trim();
  if (trimmed === '') return err('epochEmpty');

  const numeric = /^-?\d+$/.test(trimmed);
  const unit: EpochUnit = forced ?? (numeric ? detectUnit(trimmed) : 'date');

  if (unit === 'date') {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return err('epochUnparsable');
    return ok({ date: parsed, detected: 'date' });
  }

  if (!numeric) return err('epochUnparsable');

  let millis: number;
  if (unit === 'ticks') {
    // Tick değerleri 6e17 civarında — Number.MAX_SAFE_INTEGER'ı (9e15) aşar,
    // bu yüzden dönüşüm BigInt ile yapılmak ZORUNDA. Number ile yapılsaydı
    // sonuç sessizce yuvarlanırdı.
    millis = Number(BigInt(trimmed) / TICKS_PER_MS - TICKS_EPOCH_OFFSET_MS);
  } else {
    millis = unit === 'seconds' ? Number(trimmed) * 1000 : Number(trimmed);
  }

  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return err('epochOutOfRange');
  return ok({ date, detected: unit });
}

function detectUnit(digits: string): EpochUnit {
  const length = digits.replace('-', '').length;
  if (length >= 17) return 'ticks';
  if (length >= 12) return 'milliseconds';
  return 'seconds';
}

/** Bir tarihin .NET `DateTime.Ticks` karşılığı. */
export function toTicks(date: Date): string {
  return ((BigInt(date.getTime()) + TICKS_EPOCH_OFFSET_MS) * TICKS_PER_MS).toString();
}

export interface EpochBreakdown {
  iso: string;
  utc: string;
  local: string;
  seconds: string;
  milliseconds: string;
  ticks: string;
}

/**
 * Tüm gösterimleri üretir.
 *
 * Yerel saat biçimi `locale`'e bağlı; UTC bilerek sabit (RFC 1123) — o satırın
 * amacı makine tarafından okunabilir, dilden bağımsız bir referans olmak.
 */
export function breakdown(date: Date, locale: string, timeZone?: string): EpochBreakdown {
  return {
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: new Intl.DateTimeFormat(locale, {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone,
    }).format(date),
    seconds: Math.floor(date.getTime() / 1000).toString(),
    milliseconds: date.getTime().toString(),
    ticks: toTicks(date),
  };
}
