import { describe, expect, it } from 'vitest';
import {
  DIALECTS,
  TOKEN_TABLES,
  UNIT_ORDER,
  convert,
  emitPattern,
  parsePattern,
  renderSample,
  sampleFromDate,
  tokenFor,
  type Dialect,
  type Piece,
} from './dateFormat';

const pieces = (input: string, from: Dialect): Piece[] => {
  const parsed = parsePattern(input, from);
  if (!parsed.ok) throw new Error(`beklenmeyen hata: ${parsed.error}`);
  return parsed.value.pieces;
};

const to = (input: string, from: Dialect, target: Dialect) =>
  emitPattern(pieces(input, from), target).pattern;

/** 24 Ağustos 2026 Pazartesi, 09:30:45.123, +03:00. */
const SAMPLE = {
  year: 2026,
  month: 8,
  day: 24,
  hour: 9,
  minute: 30,
  second: 45,
  ms: 123,
  offsetMinutes: 180,
  zoneName: 'Europe/Istanbul',
};

describe('parsePattern', () => {
  it('boş girdi hata döner', () => {
    expect(parsePattern('   ', 'oracle')).toEqual({ ok: false, error: 'dateFormatEmpty' });
  });

  it('hiç token içermeyen girdi hata döner', () => {
    // Tamamı düz metin olan bir dize kalıp değildir; sessizce boş çeviri
    // üretmek yerine söylenmeli.
    expect(parsePattern('-- --', 'oracle')).toEqual({ ok: false, error: 'dateFormatNoTokens' });
  });

  it('uzun token kısa olandan önce eşleşir', () => {
    // MONTH girdisinde MON eşleşseydi geriye "TH" düz metin kalırdı.
    expect(pieces('MONTH', 'oracle')).toEqual([{ kind: 'unit', unit: 'monthLong' }]);
    expect(pieces('HH24', 'oracle')).toEqual([{ kind: 'unit', unit: 'hour24_2' }]);
  });

  it('bitişik düz metinleri tek parçada birleştirir', () => {
    expect(pieces('YYYY - ', 'oracle')).toEqual([
      { kind: 'unit', unit: 'year4' },
      { kind: 'literal', text: ' - ' },
    ]);
  });

  describe('lehçeye özel tuzaklar', () => {
    it('Oracle çıplak HH 12 saatliktir ve uyarır', () => {
      const parsed = parsePattern('HH:MI', 'oracle');
      expect(parsed.ok && parsed.value.pieces[0]).toEqual({ kind: 'unit', unit: 'hour12_2' });
      expect(parsed.ok && parsed.value.warnings).toContain('oracleHh12');
    });

    it('Oracle MONTH dolgusu uyarı üretir', () => {
      const parsed = parsePattern('MONTH YYYY', 'oracle');
      expect(parsed.ok && parsed.value.warnings).toContain('oracleNamePad');
    });

    it('FM dolguyu kapatır ve ikinci FM geri açar', () => {
      // Oracle'da FM bir ANAHTAR, kalıcı bir önek değil: FMDD.FMMM yazan
      // kişi ayın da dolgusuz olduğunu sanıyor, oysa ikinci FM onu geri açar.
      expect(pieces('FMDD.FMMM.YYYY', 'oracle')).toEqual([
        { kind: 'unit', unit: 'day1' },
        { kind: 'literal', text: '.' },
        { kind: 'unit', unit: 'month2' },
        { kind: 'literal', text: '.' },
        { kind: 'unit', unit: 'year4' },
      ]);
    });

    it('Delphi hh, kalıpta ampm yoksa 24 saatliktir', () => {
      expect(pieces('hh:nn', 'delphi')).toContainEqual({ kind: 'unit', unit: 'hour24_2' });
    });

    it('Delphi hh, kalıpta ampm varsa 12 saatliğe döner', () => {
      expect(pieces('hh:nn ampm', 'delphi')).toContainEqual({ kind: 'unit', unit: 'hour12_2' });
    });

    it('Delphi mm ay, nn dakikadır', () => {
      expect(pieces('mm nn', 'delphi')).toEqual([
        { kind: 'unit', unit: 'month2' },
        { kind: 'literal', text: ' ' },
        { kind: 'unit', unit: 'minute2' },
      ]);
    });

    it('Oracle MM ay, MI dakikadır', () => {
      expect(pieces('MM MI', 'oracle')).toEqual([
        { kind: 'unit', unit: 'month2' },
        { kind: 'literal', text: ' ' },
        { kind: 'unit', unit: 'minute2' },
      ]);
    });

    it('.NET büyük/küçük harfe duyarlı, Oracle değil', () => {
      expect(pieces('MM', 'dotnet')).toEqual([{ kind: 'unit', unit: 'month2' }]);
      expect(pieces('mm', 'dotnet')).toEqual([{ kind: 'unit', unit: 'minute2' }]);
      expect(pieces('dd.mm.yyyy', 'oracle')).toEqual(pieces('DD.MM.YYYY', 'oracle'));
    });
  });

  describe('düz metin kaçışı', () => {
    it('Oracle çift tırnağı metin sayar', () => {
      expect(pieces('"Tarih: "DD', 'oracle')).toEqual([
        { kind: 'literal', text: 'Tarih: ' },
        { kind: 'unit', unit: 'day2' },
      ]);
    });

    it('dayjs köşeli parantezi metin sayar', () => {
      expect(pieces('[Tarih] DD', 'js')).toEqual([
        { kind: 'literal', text: 'Tarih ' },
        { kind: 'unit', unit: 'day2' },
      ]);
    });

    it('.NET ters bölü tek karakter kaçırır', () => {
      expect(pieces(String.raw`\d dd`, 'dotnet')).toEqual([
        { kind: 'literal', text: 'd ' },
        { kind: 'unit', unit: 'day2' },
      ]);
    });

    it('.NET yüzde işareti tek karakterlik belirteci açar', () => {
      // `%M` özel belirteçtir: dolgusuz AY. `MM` ile karıştırılmamalı.
      expect(pieces('%M', 'dotnet')).toEqual([{ kind: 'unit', unit: 'month1' }]);
    });

    it('kapanmayan tırnak kalanı metin sayar', () => {
      // Yarım tırnak yazmak yaygın; kalıbı reddetmek yerine okunabilir
      // bir sonuç vermek daha yararlı.
      expect(pieces('DD "kalan', 'oracle')).toEqual([
        { kind: 'unit', unit: 'day2' },
        { kind: 'literal', text: ' kalan' },
      ]);
    });
  });
});

describe('emitPattern', () => {
  it('Oracle → diğer üç lehçe', () => {
    expect(to('DD.MM.YYYY HH24:MI', 'oracle', 'dotnet')).toBe('dd.MM.yyyy HH:mm');
    expect(to('DD.MM.YYYY HH24:MI', 'oracle', 'js')).toBe('DD.MM.YYYY HH:mm');
    expect(to('DD.MM.YYYY HH24:MI', 'oracle', 'delphi')).toBe('dd.mm.yyyy hh:nn');
  });

  it('.NET → diğer üç lehçe', () => {
    expect(to('yyyy-MM-dd HH:mm:ss', 'dotnet', 'oracle')).toBe('YYYY-MM-DD HH24:MI:SS');
    expect(to('yyyy-MM-dd HH:mm:ss', 'dotnet', 'delphi')).toBe('yyyy-mm-dd hh:nn:ss');
    expect(to('yyyy-MM-dd HH:mm:ss', 'dotnet', 'js')).toBe('YYYY-MM-DD HH:mm:ss');
  });

  it('Delphi → Oracle', () => {
    expect(to('dd.mm.yyyy hh:nn:ss', 'delphi', 'oracle')).toBe('DD.MM.YYYY HH24:MI:SS');
  });

  it('ISO 8601 T harfi hedefte metin olarak kaçırılır', () => {
    expect(to('yyyy-MM-ddTHH:mm:ss', 'dotnet', 'js')).toBe('YYYY-MM-DD[T]HH:mm:ss');
    expect(to('yyyy-MM-ddTHH:mm:ss', 'dotnet', 'oracle')).toBe('YYYY-MM-DD"T"HH24:MI:SS');
  });

  it('metin, hedefin tırnak biçimine çevrilir', () => {
    expect(to('"Tarih: "DD.MM.YYYY', 'oracle', 'dotnet')).toBe("'Tarih: 'dd.MM.yyyy");
    expect(to('"Tarih: "DD.MM.YYYY', 'oracle', 'js')).toBe('[Tarih: ]DD.MM.YYYY');
    expect(to('"Tarih: "DD.MM.YYYY', 'oracle', 'delphi')).toBe('"Tarih: "dd.mm.yyyy');
  });

  describe('kültüre bağlı ayraç', () => {
    it('bölü işareti .NET ve Delphi çıktısında tırnaklanır', () => {
      // tr-TR altında tırnaksız `/` NOKTA basar; kalıp sessizce başka bir
      // şey üretir.
      expect(to('DD/MM/YYYY', 'oracle', 'dotnet')).toBe("dd'/'MM'/'yyyy");
      expect(to('DD/MM/YYYY', 'oracle', 'delphi')).toBe('dd"/"mm"/"yyyy');
    });

    it('iki nokta serbest bırakılır', () => {
      expect(to('HH24:MI', 'oracle', 'dotnet')).toBe('HH:mm');
    });

    it('bölü ya da iki nokta varsa not düşülür', () => {
      expect(emitPattern(pieces('HH24:MI', 'oracle'), 'dotnet').notes).toContain('dotnetSeparator');
      expect(emitPattern(pieces('DD/MM', 'oracle'), 'delphi').notes).toContain('delphiSeparator');
    });
  });

  describe('Oracle FM', () => {
    it('dolgusuz birim için FM ekler', () => {
      expect(to('d.M.yyyy', 'dotnet', 'oracle')).toBe('FMDD.MM.YYYY');
    });

    it('ad token’ları için de FM ekler', () => {
      // FMsiz MONTH çıktıyı 9 karaktere boşlukla doldurur.
      expect(to('MMMM', 'dotnet', 'oracle')).toBe('FMMONTH');
    });

    it('dolguya dönerken FM’i yeniden yazar', () => {
      expect(to('FMDD.FMMM.YYYY', 'oracle', 'oracle')).toBe('FMDD.FMMM.YYYY');
    });

    it('FM eklendiğinde not düşer', () => {
      expect(emitPattern(pieces('d', 'dotnet'), 'oracle').notes).toContain('oracleFm');
    });
  });

  describe('.NET tek karakterlik belirteç', () => {
    it('yalnız kalan belirtecin başına % ekler', () => {
      // ToString("M") ayı değil, "24 Ağustos" biçimini verir.
      const result = emitPattern(pieces('M', 'js'), 'dotnet');
      expect(result.pattern).toBe('%M');
      expect(result.notes).toContain('dotnetSingle');
    });

    it('standart belirteç olmayan tek karakteri olduğu gibi bırakır', () => {
      expect(emitPattern(pieces('h', 'js'), 'dotnet').pattern).toBe('h');
    });
  });

  describe('karşılıksız birimler', () => {
    it('hedefte yoksa düşürülür ve bildirilir', () => {
      const result = emitPattern(pieces('Q', 'js'), 'dotnet');
      expect(result.dropped).toEqual(['quarter']);
      expect(result.notes).toContain('dropped');
      expect(result.pattern).toBe('');
    });

    it('kalan birimler yazılmaya devam eder', () => {
      const result = emitPattern(pieces('YYYY Q', 'js'), 'dotnet');
      expect(result.pattern).toBe('yyyy ');
      expect(result.dropped).toEqual(['quarter']);
    });

    it('dayjs eklenti gerektiren token’ı işaretler', () => {
      expect(emitPattern(pieces('Q', 'oracle'), 'js').notes).toContain('dayjsPlugin');
    });
  });

  describe('dakika ve saat notları', () => {
    it('Oracle dakika yazarken MI/MM ayrımını hatırlatır', () => {
      expect(emitPattern(pieces('mm', 'dotnet'), 'oracle').notes).toContain('oracleMinute');
    });

    it('Delphi dakika yazarken nn/mm ayrımını hatırlatır', () => {
      expect(emitPattern(pieces('mm', 'dotnet'), 'delphi').notes).toContain('delphiMinute');
    });

    it('Delphi’de 12 saatlik alan ampm’siz kalırsa uyarır', () => {
      expect(emitPattern(pieces('hh:mm', 'dotnet'), 'delphi').notes).toContain('delphiHour');
    });

    it('ampm varsa uyarmaz', () => {
      expect(emitPattern(pieces('hh:mm tt', 'dotnet'), 'delphi').notes).not.toContain('delphiHour');
    });
  });
});

describe('renderSample', () => {
  const render = (pattern: string, from: Dialect) =>
    renderSample(pieces(pattern, from), SAMPLE, 'tr');

  it('sayısal alanları doldurur', () => {
    expect(render('DD.MM.YYYY HH24:MI:SS', 'oracle')).toBe('24.08.2026 09:30:45');
  });

  it('dolgusuz birimler sıfır almaz', () => {
    expect(render('FMDD.MM.YYYY', 'oracle')).toBe('24.8.2026');
  });

  it('ikinci FM dolguyu geri açar', () => {
    // Aynı kalıbın tuzaklı yazımı: her FM bir ANAHTAR, önek değil. İkinci
    // FM ayın dolgusunu geri açtığı için "08" basılıyor.
    expect(render('FMDD.FMMM.FMYYYY', 'oracle')).toBe('24.08.2026');
  });

  it('12 saatlik alan ve öğle işareti', () => {
    expect(render('hh:mm tt', 'dotnet')).toBe('09:30 AM');
  });

  it('gece yarısı 12 olarak okunur', () => {
    expect(renderSample(pieces('hh tt', 'dotnet'), { ...SAMPLE, hour: 0 }, 'tr')).toBe('12 AM');
  });

  it('salise basamakları kırpılır', () => {
    expect(render('SSS|SS|S', 'js')).toBe('123|12|1');
  });

  it('saat dilimi farkı üç biçimde', () => {
    expect(render('TZH:TZM|TZHTZM|TZH', 'oracle')).toBe('+03:00|+0300|+03');
  });

  it('eksi fark işareti taşır', () => {
    expect(renderSample(pieces('TZH:TZM', 'oracle'), { ...SAMPLE, offsetMinutes: -330 }, 'tr')).toBe(
      '-05:30',
    );
  });

  it('yılın günü', () => {
    // 2026 artık yıl değil: 31+28+31+30+31+30+31 = 212, +24 = 236.
    expect(render('DDD', 'oracle')).toBe('236');
  });

  it('ISO hafta ve ISO yıl', () => {
    // 24.08.2026 pazartesi; 2026'nın 1 ocağı perşembe olduğu için 1. hafta
    // 29.12.2025'te başlıyor ve bu tarih 35. haftanın ilk günü.
    expect(render('IYYY-"W"IW', 'oracle')).toBe('2026-W35');
  });

  it('günün saniyesi', () => {
    expect(render('SSSSS', 'oracle')).toBe('34245');
  });

  it('çeyrek', () => {
    expect(render('Q', 'oracle')).toBe('3');
  });

  it('ad alanları site diline göre gelir', () => {
    expect(render('MONTH', 'oracle')).toBe('Ağustos');
    expect(renderSample(pieces('MMMM', 'dotnet'), SAMPLE, 'en')).toBe('August');
  });

  it('haftanın günü Oracle’da pazar = 1', () => {
    // 24.08.2026 pazartesi.
    expect(render('D', 'oracle')).toBe('2');
  });

  it('düz metin olduğu gibi kalır', () => {
    expect(render('"Kayıt: "DD.MM.YYYY', 'oracle')).toBe('Kayıt: 24.08.2026');
  });
});

describe('sampleFromDate', () => {
  it('yerel alanları ve ters işaretli farkı okur', () => {
    const date = new Date(2026, 7, 24, 9, 30, 45, 123);
    const sample = sampleFromDate(date, 'Europe/Istanbul');

    expect(sample).toMatchObject({ year: 2026, month: 8, day: 24, hour: 9, minute: 30, ms: 123 });
    // getTimezoneOffset() +03:00 için -180 döner; işaret çevrilmeli.
    expect(sample.offsetMinutes).toBe(-date.getTimezoneOffset());
  });
});

describe('convert', () => {
  it('kaynak lehçe dışındaki üçünü döndürür', () => {
    const result = convert('DD.MM.YYYY', 'oracle');
    expect(result.ok && result.value.translations.map((item) => item.dialect)).toEqual([
      'dotnet',
      'js',
      'delphi',
    ]);
  });

  it('hatayı olduğu gibi geçirir', () => {
    expect(convert('', 'oracle')).toEqual({ ok: false, error: 'dateFormatEmpty' });
  });
});

describe('tablo tutarlılığı', () => {
  it.each(DIALECTS)('%s tablosunda tekrarlı token yok', (dialect) => {
    const tokens = TOKEN_TABLES[dialect].map((entry) =>
      dialect === 'dotnet' || dialect === 'js' ? entry.token : entry.token.toUpperCase(),
    );
    const seen = new Set(tokens);
    expect(tokens).toHaveLength(seen.size);
  });

  it('karşılaştırma tablosunun her satırı en az iki lehçede karşılık bulur', () => {
    // Tek lehçede karşılığı olan bir birim karşılaştırma tablosuna
    // konulmamalı; okuyucuya boş satır göstermek bilgi vermiyor.
    const thin = UNIT_ORDER.filter(
      (unit) => DIALECTS.filter((dialect) => tokenFor(unit, dialect) !== null).length < 2,
    );
    expect(thin).toEqual([]);
  });

  it('her lehçe kendi kalıbını kendine yazabiliyor', () => {
    // Ayrıştırma ve yazma tabloları birbirinden bağımsız; birinde olup
    // ötekinde olmayan bir token sessiz veri kaybı demek.
    const roundTrip: [Dialect, string][] = [
      ['oracle', 'DD.MM.YYYY HH24:MI:SS'],
      ['dotnet', 'dd.MM.yyyy HH:mm:ss'],
      ['js', 'DD.MM.YYYY HH:mm:ss'],
      ['delphi', 'dd.mm.yyyy hh:nn:ss'],
    ];

    for (const [dialect, pattern] of roundTrip) {
      expect(emitPattern(pieces(pattern, dialect), dialect).pattern).toBe(pattern);
    }
  });
});
