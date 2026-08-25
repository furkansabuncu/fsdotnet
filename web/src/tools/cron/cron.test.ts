import { describe, expect, it } from 'vitest';
import { expandField, nextRuns, parseCron, type CronFlavour, type CronSpec } from './cron';

const parse = (expression: string, flavour: CronFlavour = 'unix'): CronSpec => {
  const result = parseCron(expression, flavour);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error} ${result.detail ?? ''}`);
  return result.value;
};

/* Testler yerel saatte çalışıyor; sabit bir başlangıç anı seçip yerel
   bileşenlere bakıyoruz, böylece CI'ın saat dilimi sonucu değiştirmiyor. */
const at = (year: number, month: number, day: number, hour = 0, minute = 0, second = 0) =>
  new Date(year, month - 1, day, hour, minute, second);

const format = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-') +
  ' ' +
  [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');

const runs = (expression: string, from: Date, count = 3, flavour: CronFlavour = 'unix') =>
  nextRuns(parse(expression, flavour), from, count).map(format);

describe('parseCron — alan sayısı', () => {
  it('Unix beş alan bekler', () => {
    expect(parse('* * * * *').fields).toHaveLength(5);
  });

  it('Quartz altı alanı kabul eder, yıl isteğe bağlıdır', () => {
    expect(parse('0 0 12 * * ?', 'quartz').fields).toHaveLength(6);
    expect(parse('0 0 12 * * ? 2027', 'quartz').fields).toHaveLength(7);
  });

  it.each([
    ['* * * *', 'unix' as const],
    ['* * * * * *', 'unix' as const],
    ['* * * * *', 'quartz' as const],
  ])('%j (%s) alan sayısı hatası verir', (expression, flavour) => {
    const result = parseCron(expression, flavour);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('cronFieldCount');
  });

  it('boş ifade reddedilir', () => {
    const result = parseCron('   ', 'unix');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('cronEmpty');
  });
});

describe('parseCron — alan sözdizimi', () => {
  it('listeyi, aralığı ve adımı açar', () => {
    expect(expandField(parse('0,30 * * * *').byName.minute!)).toBe('0, 30');
    expect(expandField(parse('10-13 * * * *').byName.minute!)).toBe('10, 11, 12, 13');
    expect(expandField(parse('*/15 * * * *').byName.minute!)).toBe('0, 15, 30, 45');
    expect(expandField(parse('5/20 * * * *').byName.minute!)).toBe('5, 25, 45');
  });

  it('ay ve gün adlarını tanır', () => {
    expect(expandField(parse('0 0 1 JAN-MAR *').byName.month!)).toBe('1, 2, 3');
    expect(expandField(parse('0 0 * * MON-FRI').byName.dayOfWeek!)).toBe('1, 2, 3, 4, 5');
  });

  it('uzun listeyi kırpar', () => {
    expect(expandField(parse('* * * * *').byName.minute!)).toBe('*');
    expect(expandField(parse('0-20 * * * *').byName.minute!)).toContain('… (+9)');
  });

  it.each([
    '60 * * * *',
    '* 24 * * *',
    '0 0 32 * *',
    '0 0 * 13 *',
    '0 0 * * 8',
    'x * * * *',
    '*/0 * * * *',
    '10-5 * * * *',
    '0 0 * * 1#9',
  ])('%j reddedilir', (expression) => {
    const result = parseCron(expression, 'unix');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('cronField');
  });
});

describe('parseCron — lehçe farkları', () => {
  /* Aynı sayı iki lehçede farklı gün: Unix'te 1 pazartesi, Quartz'ta pazar.
     Bu farkı kaçırmak zamanlanmış işi bir gün kaydırıyor. */
  it('haftanın günü numaralandırması lehçeye göre kayar', () => {
    expect([...parse('0 0 * * 1').byName.dayOfWeek!.values]).toEqual([1]);
    expect([...parse('0 0 0 * * 1', 'quartz').byName.dayOfWeek!.values]).toEqual([0]);
  });

  it('Unix\'te 0 ve 7 aynı günü gösterir', () => {
    expect([...parse('0 0 * * 7').byName.dayOfWeek!.values]).toEqual([0]);
    expect([...parse('0 0 * * 0').byName.dayOfWeek!.values]).toEqual([0]);
  });

  it('kısayolları açar', () => {
    expect(parse('@daily').fields.map((field) => field.raw)).toEqual(['0', '0', '*', '*', '*']);
    // Kısayol Unix biçiminde; Quartz seçiliyken de öyle okunmalı.
    expect(parse('@hourly', 'quartz').flavour).toBe('unix');
  });
});

describe('nextRuns — temel', () => {
  it('her dakika', () => {
    expect(runs('* * * * *', at(2026, 8, 24, 9, 30, 15))).toEqual([
      '2026-08-24 09:31:00',
      '2026-08-24 09:32:00',
      '2026-08-24 09:33:00',
    ]);
  });

  it('içinde bulunulan anı sonuç saymaz', () => {
    expect(runs('30 9 * * *', at(2026, 8, 24, 9, 30, 0), 1)).toEqual(['2026-08-25 09:30:00']);
  });

  it('çeyrek saatte bir', () => {
    expect(runs('*/15 * * * *', at(2026, 8, 24, 9, 31, 0))).toEqual([
      '2026-08-24 09:45:00',
      '2026-08-24 10:00:00',
      '2026-08-24 10:15:00',
    ]);
  });

  it('hafta içi her sabah', () => {
    // 2026-08-24 pazartesi; cuma sonrası pazartesiye atlamalı.
    expect(runs('0 6 * * MON-FRI', at(2026, 8, 27, 12, 0, 0))).toEqual([
      '2026-08-28 06:00:00',
      '2026-08-31 06:00:00',
      '2026-09-01 06:00:00',
    ]);
  });

  it('ayın belirli günü', () => {
    expect(runs('0 0 1 * *', at(2026, 8, 24), 2)).toEqual([
      '2026-09-01 00:00:00',
      '2026-10-01 00:00:00',
    ]);
  });
});

describe('nextRuns — gün alanlarının VEYA kuralı', () => {
  /* Klasik cron: ayınGünü ve haftanınGünü'nün İKİSİ de kısıtlıysa biri
     tutması yeter. Çoğu araç bunu VE sanıyor ve çalışmaları kaçırıyor. */
  it('ikisi de kısıtlıysa herhangi biri tutar', () => {
    const result = runs('0 0 1 * MON', at(2026, 8, 24), 4);
    expect(result).toEqual([
      '2026-08-31 00:00:00', // pazartesi
      '2026-09-01 00:00:00', // ayın biri (salı)
      '2026-09-07 00:00:00', // pazartesi
      '2026-09-14 00:00:00',
    ]);
  });

  it('biri * ise diğerinin tutması gerekir', () => {
    expect(runs('0 0 1 * *', at(2026, 8, 24), 1)).toEqual(['2026-09-01 00:00:00']);
  });
});

describe('nextRuns — L ve #', () => {
  it('ayın son günü', () => {
    expect(runs('0 0 L * *', at(2026, 1, 15), 3)).toEqual([
      '2026-01-31 00:00:00',
      '2026-02-28 00:00:00',
      '2026-03-31 00:00:00',
    ]);
  });

  it('artık yılın şubatını doğru bulur', () => {
    expect(runs('0 0 L 2 *', at(2028, 1, 1), 1)).toEqual(['2028-02-29 00:00:00']);
  });

  it('ayın son cuması', () => {
    expect(runs('0 0 0 ? * 6L', at(2026, 8, 1), 2, 'quartz')).toEqual([
      '2026-08-28 00:00:00',
      '2026-09-25 00:00:00',
    ]);
  });

  it('ayın üçüncü pazartesi', () => {
    expect(runs('0 0 0 ? * 2#3', at(2026, 8, 1), 2, 'quartz')).toEqual([
      '2026-08-17 00:00:00',
      '2026-09-21 00:00:00',
    ]);
  });
});

describe('nextRuns — Quartz', () => {
  it('saniye alanını kullanır', () => {
    expect(runs('*/20 * * * * ?', at(2026, 8, 24, 9, 30, 5), 3, 'quartz')).toEqual([
      '2026-08-24 09:30:20',
      '2026-08-24 09:30:40',
      '2026-08-24 09:31:00',
    ]);
  });

  it('yıl alanı verildiğinde onun dışına çıkmaz', () => {
    const result = runs('0 0 0 1 1 ? 2027', at(2026, 8, 24), 5, 'quartz');
    expect(result).toEqual(['2027-01-01 00:00:00']);
  });
});

describe('nextRuns — ulaşılamaz', () => {
  it('30 Şubat için sonuç üretmez', () => {
    expect(nextRuns(parse('0 0 30 2 *'), at(2026, 1, 1), 1)).toEqual([]);
  });

  it('geçmişte kalan yıl için sonuç üretmez', () => {
    expect(nextRuns(parse('0 0 0 1 1 ? 2020', 'quartz'), at(2026, 1, 1), 1)).toEqual([]);
  });
});
