import { describe, expect, it } from 'vitest';
import { analyze, type RuleKey } from './sqlFix';

const rules = (sql: string): RuleKey[] => {
  const result = analyze(sql);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value.map((item) => item.rule);
};

const detailsOf = (sql: string, rule: RuleKey): (string | undefined)[] => {
  const result = analyze(sql);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value.filter((item) => item.rule === rule).map((item) => item.detail);
};

describe('GROUP BY kapsamı', () => {
  it('listede olmayan kolonu bildirir', () => {
    expect(
      detailsOf('select k.tur_id, k.baslik, count(*) from kitap k group by k.tur_id', 'groupByScope'),
    ).toEqual(['k.baslik']);
  });

  it('tam kapsanan sorguda susar', () => {
    expect(rules('select k.tur_id, count(*) from kitap k group by k.tur_id')).toEqual([]);
  });

  it('agregatları saymaz', () => {
    expect(rules('select k.tur_id, sum(k.fiyat), max(k.fiyat) from kitap k group by k.tur_id')).toEqual([]);
  });

  it('takma adı ayıklayarak eşleştirir', () => {
    expect(rules('select k.tur_id as tur, count(*) from kitap k group by k.tur_id')).toEqual([]);
  });

  it('GROUP BY yoksa hiç çalışmaz', () => {
    expect(rules('select k.tur_id, k.baslik from kitap k')).toEqual([]);
  });

  it('parantez içindeki virgülü ayraç sanmaz', () => {
    // `nvl(a, 0)` tek bir select öğesi; naif split iki sanardı.
    expect(rules('select nvl(k.fiyat, 0), count(*) from kitap k group by nvl(k.fiyat, 0)')).toEqual([]);
  });
});

describe('agregatın yeri', () => {
  it('WHERE içindeki agregatı bildirir', () => {
    expect(rules('select tur_id from kitap where count(*) > 5 group by tur_id')).toContain(
      'aggregateInWhere',
    );
  });

  it('HAVING içindekine dokunmaz', () => {
    expect(rules('select tur_id from kitap group by tur_id having count(*) > 5')).toEqual([]);
  });
});

describe('JOIN koşulu', () => {
  it('ON’suz JOIN’i bildirir', () => {
    expect(rules('select * from siparis s inner join kitap k')).toContain('joinWithoutOn');
  });

  it('USING da geçerlidir', () => {
    expect(rules('select * from siparis join kitap using (kitap_id)')).toEqual([]);
  });

  it('CROSS JOIN koşul almaz', () => {
    expect(rules('select * from siparis s cross join kitap k')).toEqual([]);
  });
});

describe('takma ad tutarlılığı', () => {
  it('tanımsız öneki bildirir', () => {
    expect(detailsOf('select h.baslik from kitap k', 'unknownAlias')).toEqual(['h']);
  });

  it('tanımlı takma ada dokunmaz', () => {
    expect(rules('select k.baslik from kitap k')).toEqual([]);
  });

  it('takma adsız tablo adı da önek olabilir', () => {
    expect(rules('select kitap.baslik from kitap')).toEqual([]);
  });

  it('fonksiyon çağrısını önek sanmaz', () => {
    expect(rules('select trunc(sysdate) from dual')).toEqual([]);
  });
});

describe('join karışımı', () => {
  it('virgüllü ve ANSI join birlikteyse uyarır', () => {
    expect(rules('select * from siparis s, kanal c join kitap k on k.id = s.kitap_id')).toContain(
      'mixedJoins',
    );
  });

  it('yalnızca ANSI join sorun değil', () => {
    expect(rules('select * from siparis s join kitap k on k.id = s.kitap_id')).toEqual([]);
  });
});

describe('11g uyumluluğu', () => {
  it.each([
    ['select * from t cross apply f(t.id)', 'CROSS APPLY'],
    ['select * from t, lateral (select 1 from dual)', 'LATERAL'],
    ["select json_value(veri, '$.ad') from t", 'JSON_VALUE'],
  ])('%s işaretlenir', (sql, expected) => {
    expect(detailsOf(sql, 'twelveCSyntax')[0]).toContain(expected);
  });

  it('LISTAGG taşma yönetimi olmadan uyarır', () => {
    const sql = "select listagg(ad, ',') within group (order by ad) from t";
    expect(rules(sql)).toContain('listaggOverflow');
  });

  it('ON OVERFLOW yazılmışsa susar', () => {
    const sql = "select listagg(ad, ',' on overflow truncate) within group (order by ad) from t";
    // 12c söz dizimi olarak yine bildirilir, ama taşma uyarısı düşer.
    expect(rules(sql)).not.toContain('listaggOverflow');
  });

  it('temiz 11g sorgusunda hiç bulgu yok', () => {
    expect(rules('select k.baslik from kitap k where k.tur_id = :tur order by k.baslik')).toEqual([]);
  });
});
