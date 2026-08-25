import { describe, expect, it } from 'vitest';
import { sqlToLinq, toEntityName, translateExpression, type LinqOptions } from './sqlToLinq';

const base: LinqOptions = { syntax: 'method', context: 'db' };

const run = (sql: string, options: Partial<LinqOptions> = {}) => {
  const result = sqlToLinq(sql, { ...base, ...options });
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

describe('toEntityName', () => {
  it.each([
    ['TXHASTARAPOR', 'Txhastarapor'],
    ['hasta_kayit', 'HastaKayit'],
    ['HASTANE.HASTA', 'HastaneHasta'],
    ['Hasta', 'Hasta'],
  ])('%j → %j', (table, expected) => {
    expect(toEntityName(table)).toBe(expected);
  });
});

describe('translateExpression — operatörler', () => {
  it.each([
    ['a = 1', 'a == 1'],
    ['a <> 1', 'a != 1'],
    ['a != 1', 'a != 1'],
    ['a >= 1', 'a >= 1'],
    ['a <= 1', 'a <= 1'],
    ['a = 1 AND b = 2', 'a == 1 && b == 2'],
    ['a = 1 OR b = 2', 'a == 1 || b == 2'],
    ['a IS NULL', 'a == null'],
    ['a IS NOT NULL', 'a != null'],
  ])('%j → %j', (sql, expected) => {
    expect(translateExpression(sql)).toBe(expected);
  });

  it('dizeyi çift tırnağa çevirir ve içindeki kaçışı açar', () => {
    expect(translateExpression("ad = 'Ali''nin'")).toBe('ad == "Ali\'nin"');
  });

  /* Yer tutucular sayı OLMAMALI: `id = 5` içindeki 5, geri koyma adımında
     dize sanılıp bozulurdu. */
  it('dize ile sayıyı karıştırmaz', () => {
    expect(translateExpression("id = 5 AND ad = 'x'")).toBe('id == 5 && ad == "x"');
  });

  it('dize içindeki AND kelimesini operatöre çevirmez', () => {
    expect(translateExpression("ad = 'A AND B'")).toBe('ad == "A AND B"');
  });
});

describe('translateExpression — LIKE', () => {
  it.each([
    ["ad LIKE 'Ali%'", 'ad.StartsWith("Ali")'],
    ["ad LIKE '%Ali'", 'ad.EndsWith("Ali")'],
    ["ad LIKE '%Ali%'", 'ad.Contains("Ali")'],
    ["ad NOT LIKE '%Ali%'", '!ad.Contains("Ali")'],
    ["ad LIKE 'Ali'", '(ad == "Ali")'],
  ])('%j → %j', (sql, expected) => {
    expect(translateExpression(sql)).toBe(expected);
  });

  it('ortasında joker varsa EF.Functions.Like kullanır', () => {
    // `A_i%` metot zinciriyle ifade edilemez.
    expect(translateExpression("ad LIKE 'A_i%'")).toBe('EF.Functions.Like(ad, "A_i%")');
  });
});

describe('translateExpression — IN ve BETWEEN', () => {
  it('IN listesini Contains yapar', () => {
    expect(translateExpression('id IN (1, 2, 3)')).toBe('new[] { 1, 2, 3 }.Contains(id)');
  });

  it('NOT IN listesini olumsuzlar', () => {
    expect(translateExpression('id NOT IN (1, 2)')).toBe('!new[] { 1, 2 }.Contains(id)');
  });

  it('BETWEEN aralığını iki karşılaştırmaya açar', () => {
    expect(translateExpression('tarih BETWEEN 1 AND 9')).toBe('(tarih >= 1 && tarih <= 9)');
  });
});

describe('translateExpression — fonksiyonlar', () => {
  it.each([
    ['UPPER(ad)', 'ad.ToUpper()'],
    ['LOWER(ad)', 'ad.ToLower()'],
    ['TRIM(ad)', 'ad.Trim()'],
    ['LENGTH(ad)', 'ad.Length'],
    ["NVL(ad, 'yok')", '(ad ?? "yok")'],
    ['COALESCE(a, b)', '(a ?? b)'],
  ])('%j → %j', (sql, expected) => {
    expect(translateExpression(sql)).toBe(expected);
  });
});

describe('sqlToLinq — metot söz dizimi', () => {
  it('tek tablo, koşul ve sıralama', () => {
    expect(run('SELECT * FROM HASTA H WHERE H.AKTIF = 1 ORDER BY H.AD DESC')).toBe(
      ['var query = db.Hasta', '    .Where(h => h.AKTIF == 1)', '    .OrderByDescending(h => h.AD);'].join(
        '\n',
      ),
    );
  });

  it('tek kolonda anonim tip kurmaz', () => {
    expect(run('SELECT H.AD FROM HASTA H')).toContain('.Select(h => h.AD)');
  });

  it('projeksiyonu anonim tipe çevirir', () => {
    expect(run('SELECT H.HASTA_ID, H.AD_SOYAD FROM HASTA H')).toContain(
      '.Select(h => new { h.HASTA_ID, h.AD_SOYAD })',
    );
  });

  it('kolon takma adını atama yapar', () => {
    expect(run('SELECT H.AD_SOYAD AS Ad FROM HASTA H')).toContain('new { Ad = h.AD_SOYAD }');
  });

  it('takma ad zaten property adıyla aynıysa tekrar yazmaz', () => {
    expect(run('SELECT H.AD_SOYAD AS AD_SOYAD FROM HASTA H')).toContain('new { h.AD_SOYAD }');
  });

  it('DISTINCT ve TOP ekler', () => {
    const out = run('SELECT DISTINCT TOP 10 H.AD FROM HASTA H');
    expect(out).toContain('.Distinct()');
    expect(out).toContain('.Take(10)');
  });

  it('Oracle FETCH FIRST sözdizimini de anlar', () => {
    expect(run('SELECT * FROM HASTA H FETCH FIRST 5 ROWS ONLY')).toContain('.Take(5)');
  });

  it('ikinci sıralama alanı ThenBy olur', () => {
    const out = run('SELECT * FROM HASTA H ORDER BY H.AD, H.SOYAD DESC');
    expect(out).toContain('.OrderBy(h => h.AD)');
    expect(out).toContain('.ThenByDescending(h => h.SOYAD)');
  });

  it('INNER JOIN üretir', () => {
    const out = run('SELECT * FROM HASTA H JOIN ISTEM I ON I.HASTA_ID = H.HASTA_ID');
    expect(out).toContain('.Join(db.Istem,');
    expect(out).toContain('h => h.HASTA_ID,');
    expect(out).toContain('i => i.HASTA_ID,');
  });

  it('LEFT JOIN için GroupJoin + DefaultIfEmpty üretir', () => {
    const out = run('SELECT * FROM HASTA H LEFT JOIN ISTEM I ON I.HASTA_ID = H.HASTA_ID');
    expect(out).toContain('.GroupJoin(db.Istem,');
    expect(out).toContain('.SelectMany(x => x.iGroup.DefaultIfEmpty(),');
  });

  it('eşitlik olmayan JOIN koşulunu TODO olarak bırakır', () => {
    const out = run('SELECT * FROM HASTA H JOIN ISTEM I ON I.TARIH > H.TARIH');
    expect(out).toContain('// TODO: eşitlik olmayan JOIN koşulu');
    expect(out).toContain('i.TARIH > h.TARIH');
  });

  it('GROUP BY ve toplama fonksiyonu', () => {
    const out = run('SELECT H.BOLUM, COUNT(*) AS Adet FROM HASTA H GROUP BY H.BOLUM');
    expect(out).toContain('.GroupBy(h => h.BOLUM)');
    expect(out).toContain('Adet = g.Count()');
  });

  it('SUM için grup elemanına iner', () => {
    const out = run('SELECT H.BOLUM, SUM(H.TUTAR) AS Toplam FROM HASTA H GROUP BY H.BOLUM');
    expect(out).toContain('Toplam = g.Sum(i => i.TUTAR)');
  });

  it('HAVING koşulunu grup sonrası Where yapar', () => {
    const out = run('SELECT H.BOLUM FROM HASTA H GROUP BY H.BOLUM HAVING COUNT(*) > 5');
    expect(out).toContain('.Where(g => COUNT(*) > 5)');
  });
});

describe('sqlToLinq — sorgu söz dizimi', () => {
  const query = (sql: string) => run(sql, { syntax: 'query' });

  it('from/where/orderby/select üretir', () => {
    expect(query('SELECT H.AD FROM HASTA H WHERE H.AKTIF = 1 ORDER BY H.AD')).toBe(
      [
        'var query = from h in db.Hasta',
        '            where h.AKTIF == 1',
        '            orderby h.AD',
        '            select h.AD;',
      ].join('\n'),
    );
  });

  it('join … equals üretir ve tarafları doğru sıralar', () => {
    const out = query('SELECT * FROM HASTA H JOIN ISTEM I ON I.HASTA_ID = H.HASTA_ID');
    expect(out).toContain('join i in db.Istem on h.HASTA_ID equals i.HASTA_ID');
  });

  it('LEFT JOIN için into … DefaultIfEmpty üretir', () => {
    const out = query('SELECT * FROM HASTA H LEFT JOIN ISTEM I ON I.HASTA_ID = H.HASTA_ID');
    expect(out).toContain('into iGroup');
    expect(out).toContain('from i in iGroup.DefaultIfEmpty()');
  });

  it('eşitlik olmayan koşulu çapraz birleşim + where yapar', () => {
    const out = query('SELECT * FROM HASTA H JOIN ISTEM I ON I.TARIH > H.TARIH');
    expect(out).toContain('from i in db.Istem');
    expect(out).toContain('where i.TARIH > h.TARIH');
  });

  it('DISTINCT ayrı satıra düşer', () => {
    expect(query('SELECT DISTINCT H.AD FROM HASTA H')).toContain('query = query.Distinct();');
  });
});

describe('sqlToLinq — sınırlar', () => {
  it('SELECT olmayan ifadeyi reddeder', () => {
    for (const sql of ['UPDATE HASTA SET A = 1', 'DELETE FROM HASTA', '']) {
      const result = sqlToLinq(sql, base);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('sqlSelectOnly');
    }
  });

  it('FROM olmayan ifadeyi reddeder', () => {
    const result = sqlToLinq('SELECT 1', base);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('sqlNoFrom');
  });

  it('ORDERS tablosunu ORDER BY sanmaz', () => {
    expect(run('SELECT * FROM ORDERS O')).toContain('db.Orders');
  });

  it('fonksiyon içindeki virgülü kolon ayracı sanmaz', () => {
    const out = run("SELECT NVL(H.AD, 'yok') AS Ad, H.ID FROM HASTA H");
    expect(out).toContain('new { Ad = (h.AD ?? "yok"), h.ID }');
  });
});
