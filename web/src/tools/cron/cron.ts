import { err, ok, type ToolResult } from '../types';

/**
 * Cron ifadesi çözümleyici.
 *
 * İki lehçe var ve aralarındaki farklar sessizce yanlış sonuç üretecek
 * cinsten:
 *
 * - **Unix (5 alan)** — dakika saat ayınGünü ay haftanınGünü. Haftanın günü
 *   `0-7`, hem `0` hem `7` pazar.
 * - **Quartz (6-7 alan)** — başta SANİYE, sonda isteğe bağlı YIL. Haftanın
 *   günü `1-7` ve **1 pazardır**, yani aynı sayı iki lehçede farklı gün
 *   demek. Ayrıca ayınGünü ve haftanınGünü'nden biri `?` olmak zorunda.
 *
 * Hesap yerel saat diliminde yapılır — kullanıcı "sonraki çalışma" derken
 * kendi saatini kastediyor. Sunucu UTC ise fark arayüzde yazıyor.
 */

export type CronFlavour = 'unix' | 'quartz';

export type FieldName = 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek' | 'year';

export interface CronField {
  name: FieldName;
  /** Kullanıcının yazdığı ham metin — tabloda yan yana gösteriliyor. */
  raw: string;
  /** `*` ya da `?`: kısıtlama yok. */
  any: boolean;
  values: Set<number>;
  /** Ayın son günü (`L`). */
  last: boolean;
  /** `5L` — ayın son cuması gibi. Haftanın günü 0-6, pazar 0. */
  lastWeekdays: Set<number>;
  /** `6#3` — ayın üçüncü cumartesi. */
  nthWeekdays: { weekday: number; nth: number }[];
}

export interface CronSpec {
  flavour: CronFlavour;
  fields: CronField[];
  byName: Record<FieldName, CronField | undefined>;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** İçeride haftanın günü her zaman 0-6, pazar 0 — lehçe farkı burada erir. */
const DAY_NAMES: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

interface FieldRule {
  name: FieldName;
  min: number;
  max: number;
  names?: Record<string, number>;
}

const SECOND: FieldRule = { name: 'second', min: 0, max: 59 };
const MINUTE: FieldRule = { name: 'minute', min: 0, max: 59 };
const HOUR: FieldRule = { name: 'hour', min: 0, max: 23 };
const DAY_OF_MONTH: FieldRule = { name: 'dayOfMonth', min: 1, max: 31 };
const MONTH: FieldRule = { name: 'month', min: 1, max: 12, names: MONTH_NAMES };
const YEAR: FieldRule = { name: 'year', min: 1970, max: 2199 };

const UNIX_DAY_OF_WEEK: FieldRule = { name: 'dayOfWeek', min: 0, max: 7, names: DAY_NAMES };
const QUARTZ_DAY_OF_WEEK: FieldRule = { name: 'dayOfWeek', min: 1, max: 7, names: DAY_NAMES };

const LAYOUTS: Record<CronFlavour, FieldRule[]> = {
  unix: [MINUTE, HOUR, DAY_OF_MONTH, MONTH, UNIX_DAY_OF_WEEK],
  quartz: [SECOND, MINUTE, HOUR, DAY_OF_MONTH, MONTH, QUARTZ_DAY_OF_WEEK, YEAR],
};

/** Yaygın kısayollar; `@reboot` bilerek yok — takvimle ifade edilemez. */
const ALIASES: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

class CronFieldError extends Error {
  constructor(readonly field: FieldName, readonly token: string) {
    super(`${field}: ${token}`);
  }
}

/** Quartz'ta pazar 1'dir; 1-7'yi 0-6'ya indiriyoruz. Unix'te 7 de pazardır. */
function normalizeWeekday(value: number, flavour: CronFlavour): number {
  return flavour === 'quartz' ? value - 1 : value % 7;
}

function parseNumber(token: string, rule: FieldRule): number {
  const named = rule.names?.[token.toLowerCase()];
  if (named !== undefined) return named;
  if (!/^\d+$/.test(token)) throw new CronFieldError(rule.name, token);
  return Number(token);
}

function parseField(raw: string, rule: FieldRule, flavour: CronFlavour): CronField {
  const field: CronField = {
    name: rule.name,
    raw,
    any: false,
    values: new Set(),
    last: false,
    lastWeekdays: new Set(),
    nthWeekdays: [],
  };

  const isWeekday = rule.name === 'dayOfWeek';

  if (raw === '*' || raw === '?') {
    field.any = true;
    return field;
  }

  for (const part of raw.split(',')) {
    if (part === '') throw new CronFieldError(rule.name, raw);

    // `L` — ayın son günü, ya da `5L` ayın son cuması.
    if (rule.name === 'dayOfMonth' && part.toUpperCase() === 'L') {
      field.last = true;
      continue;
    }
    if (isWeekday && /^\d+L$/i.test(part)) {
      const value = parseNumber(part.slice(0, -1), rule);
      if (value < rule.min || value > rule.max) throw new CronFieldError(rule.name, part);
      field.lastWeekdays.add(normalizeWeekday(value, flavour));
      continue;
    }
    // `6#3` — ayın üçüncü cumartesi.
    if (isWeekday && part.includes('#')) {
      const [dayToken = '', nthToken = ''] = part.split('#');
      const value = parseNumber(dayToken, rule);
      const nth = Number(nthToken);
      if (value < rule.min || value > rule.max) throw new CronFieldError(rule.name, part);
      if (!/^[1-5]$/.test(nthToken)) throw new CronFieldError(rule.name, part);
      field.nthWeekdays.push({ weekday: normalizeWeekday(value, flavour), nth });
      continue;
    }

    const [range = '', stepToken] = part.split('/');
    let step = 1;
    if (stepToken !== undefined) {
      if (!/^\d+$/.test(stepToken) || Number(stepToken) === 0) {
        throw new CronFieldError(rule.name, part);
      }
      step = Number(stepToken);
    }

    let from: number;
    let to: number;

    if (range === '*' || range === '?') {
      from = rule.min;
      to = rule.max;
    } else if (range.includes('-')) {
      const [low = '', high = ''] = range.split('-');
      from = parseNumber(low, rule);
      to = parseNumber(high, rule);
    } else {
      from = parseNumber(range, rule);
      // `5/10` "5'ten başla, 10'ar art" demek; `5` tek başına yalnızca 5.
      to = stepToken === undefined ? from : rule.max;
    }

    if (from < rule.min || to > rule.max || from > to) throw new CronFieldError(rule.name, part);

    for (let value = from; value <= to; value += step) {
      field.values.add(isWeekday ? normalizeWeekday(value, flavour) : value);
    }
  }

  if (field.values.size === 0 && !field.last && field.lastWeekdays.size === 0 && field.nthWeekdays.length === 0) {
    throw new CronFieldError(rule.name, raw);
  }

  return field;
}

export function parseCron(expression: string, flavour: CronFlavour): ToolResult<CronSpec> {
  const trimmed = expression.trim();
  if (trimmed === '') return err('cronEmpty');

  const expanded = ALIASES[trimmed.toLowerCase()] ?? trimmed;
  // Kısayollar Unix biçiminde yazılı; Quartz seçiliyken de öyle okunmalı.
  const layoutFlavour: CronFlavour = expanded === trimmed ? flavour : 'unix';
  const layout = LAYOUTS[layoutFlavour];

  const tokens = expanded.split(/\s+/);
  const optional = layoutFlavour === 'quartz' ? 1 : 0;
  if (tokens.length < layout.length - optional || tokens.length > layout.length) {
    return err('cronFieldCount', `${tokens.length}/${layout.length - optional}`);
  }

  const fields: CronField[] = [];
  try {
    for (const [index, token] of tokens.entries()) {
      fields.push(parseField(token, layout[index]!, layoutFlavour));
    }
  } catch (error) {
    if (error instanceof CronFieldError) return err('cronField', error.message);
    throw error;
  }

  const byName = {} as Record<FieldName, CronField | undefined>;
  for (const field of fields) byName[field.name] = field;

  return ok({ flavour: layoutFlavour, fields, byName });
}

/* ------------------------------------------------------- sonraki çalışmalar */

function lastDayOfMonth(year: number, month: number): number {
  // Ayın 0'ıncı günü = önceki ayın son günü.
  return new Date(year, month, 0).getDate();
}

function dayMatches(date: Date, spec: CronSpec): boolean {
  const dom = spec.byName.dayOfMonth!;
  const dow = spec.byName.dayOfWeek!;

  const domMatch =
    dom.any ||
    dom.values.has(date.getDate()) ||
    (dom.last && date.getDate() === lastDayOfMonth(date.getFullYear(), date.getMonth() + 1));

  const weekday = date.getDay();
  const nth = Math.floor((date.getDate() - 1) / 7) + 1;
  const isLastWeekday = date.getDate() + 7 > lastDayOfMonth(date.getFullYear(), date.getMonth() + 1);

  const dowMatch =
    dow.any ||
    dow.values.has(weekday) ||
    (dow.lastWeekdays.has(weekday) && isLastWeekday) ||
    dow.nthWeekdays.some((rule) => rule.weekday === weekday && rule.nth === nth);

  /* Klasik cron kuralı: ikisi de kısıtlıysa VEYA geçerlidir, VE değil.
     `0 0 1 * MON` ayın 1'inde VE her pazartesi çalışır — çoğu araç bunu
     yanlış yapıyor. Quartz'ta biri `?` olduğu için soru zaten doğmaz. */
  if (dom.any || dow.any) return domMatch && dowMatch;
  return domMatch || dowMatch;
}

/** Alan atlamalı arama: eşleşmeyen ay/gün/saat tek adımda geçilir. */
const GUARD = 100_000;

export function nextRuns(spec: CronSpec, from: Date, count: number): Date[] {
  const useSeconds = spec.flavour === 'quartz';
  const second = spec.byName.second;
  const minute = spec.byName.minute!;
  const hour = spec.byName.hour!;
  const month = spec.byName.month!;
  const year = spec.byName.year;

  const runs: Date[] = [];
  const cursor = new Date(from.getTime());

  // Bir sonraki adımdan başla; `from` anının kendisi sonuç sayılmaz.
  if (useSeconds) {
    cursor.setMilliseconds(0);
    cursor.setSeconds(cursor.getSeconds() + 1);
  } else {
    cursor.setSeconds(0, 0);
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  for (let guard = 0; guard < GUARD && runs.length < count; guard += 1) {
    if (year && !year.any && !year.values.has(cursor.getFullYear())) {
      if (cursor.getFullYear() > Math.max(...year.values)) break;
      cursor.setFullYear(cursor.getFullYear() + 1, 0, 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    if (!month.any && !month.values.has(cursor.getMonth() + 1)) {
      cursor.setMonth(cursor.getMonth() + 1, 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    if (!dayMatches(cursor, spec)) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    if (!hour.any && !hour.values.has(cursor.getHours())) {
      cursor.setHours(cursor.getHours() + 1, 0, 0, 0);
      continue;
    }

    if (!minute.any && !minute.values.has(cursor.getMinutes())) {
      cursor.setMinutes(cursor.getMinutes() + 1, 0, 0);
      continue;
    }

    if (useSeconds && second && !second.any && !second.values.has(cursor.getSeconds())) {
      cursor.setSeconds(cursor.getSeconds() + 1, 0);
      continue;
    }

    runs.push(new Date(cursor.getTime()));

    if (useSeconds) cursor.setSeconds(cursor.getSeconds() + 1);
    else cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return runs;
}

/**
 * Alanın kapsadığı değerleri okunur biçimde döker: adımlı bir dakika alanı
 * `0, 15, 30, 45` olur. Uzun listeler kırpılır — 60 sayıyı yan yana yazmak
 * tabloyu okunmaz yapıyor.
 */
export function expandField(field: CronField, limit = 12): string {
  if (field.any) return '*';

  const parts: string[] = [];
  if (field.last) parts.push('L');
  for (const weekday of field.lastWeekdays) parts.push(`${weekday}L`);
  for (const rule of field.nthWeekdays) parts.push(`${rule.weekday}#${rule.nth}`);

  const values = [...field.values].sort((a, b) => a - b);
  const shown = values.slice(0, limit).join(', ');
  if (values.length > limit) parts.push(`${shown}, … (+${values.length - limit})`);
  else if (values.length > 0) parts.push(shown);

  return parts.join(', ');
}
