import { describe, expect, it } from 'vitest';
import { extractBinds, inferType, substituteBinds, toLiteral, type BindValue } from './bindParams';

const v = (value: string, type: BindValue['type'] = 'auto'): BindValue => ({ value, type });

describe('extractBinds', () => {
  it('Oracle bind\'lerini sırayla çıkarır', () => {
    expect(extractBinds('select * from t where a = :a and b = :b', 'oracle')).toEqual(['a', 'b']);
  });

  it('SQL Server bind\'lerini çıkarır', () => {
    expect(extractBinds('select * from t where a = @a and b = @b', 'sqlserver')).toEqual(['a', 'b']);
  });

  it('tekrar eden bind bir kez listelenir', () => {
    expect(extractBinds('where a = :x or b = :x', 'oracle')).toEqual(['x']);
  });

  describe('yanlış pozitifler — ORA-01745 tuzağı', () => {
    it('dize literali içindeki iki nokta bind değildir', () => {
      // to_char maskesindeki :mi klasik tuzak.
      expect(extractBinds("select to_char(t, 'hh24:mi') from dual", 'oracle')).toEqual([]);
    });

    it('satır yorumundaki bind sayılmaz', () => {
      expect(extractBinds('select 1 -- :yorum\nfrom dual', 'oracle')).toEqual([]);
    });

    it('blok yorumundaki bind sayılmaz', () => {
      expect(extractBinds('select /* :gizli */ 1 from dual', 'oracle')).toEqual([]);
    });

    it('çift tırnaklı tanımlayıcı içindeki bind sayılmaz', () => {
      expect(extractBinds('select "a:b" from t', 'oracle')).toEqual([]);
    });

    it('iki nokta üst üste bind başlatmaz', () => {
      expect(extractBinds('select x::text from t', 'oracle')).toEqual([]);
    });

    it('kaçırılmış tırnak literali erken bitirmez', () => {
      expect(extractBinds("select 'it''s :yok' , :var from t", 'oracle')).toEqual(['var']);
    });
  });

  it('yanlış stil seçilirse bind bulunmaz', () => {
    expect(extractBinds('where a = :a', 'sqlserver')).toEqual([]);
  });
});

describe('inferType', () => {
  it.each([
    ['42', 'number'],
    ['-3.5', 'number'],
    ['', 'null'],
    ['null', 'null'],
    ['NULL', 'null'],
    ['2026-08-24', 'date'],
    ['2026-08-24 09:30:00', 'date'],
    ['Ömer', 'text'],
    // Baştaki sıfır anlamlıdır — kod, sayı değil.
    ['007', 'text'],
    ['0', 'number'],
  ] as const)('%j → %s', (value, expected) => {
    expect(inferType(value)).toBe(expected);
  });
});

describe('toLiteral', () => {
  it.each([
    [v('42'), '42'],
    [v('Ömer'), "'Ömer'"],
    [v(''), 'NULL'],
    [v("O'Brien"), "'O''Brien'"],
    [v('42', 'text'), "'42'"],
    [v('abc', 'null'), 'NULL'],
  ])('%o → %s', (bind, expected) => {
    expect(toLiteral(bind, 'oracle')).toBe(expected);
  });

  describe('tarihler', () => {
    it('Oracle: sade tarih DATE literali olur', () => {
      expect(toLiteral(v('2026-08-24'), 'oracle')).toBe("DATE '2026-08-24'");
    });

    it('Oracle: saatli tarih açık maskeyle TO_DATE olur — ORA-01861 önlenir', () => {
      expect(toLiteral(v('2026-08-24 09:30:00'), 'oracle')).toBe(
        "TO_DATE('2026-08-24 09:30:00', 'YYYY-MM-DD HH24:MI:SS')",
      );
    });

    it('SQL Server: sıradan dize literali yeter', () => {
      expect(toLiteral(v('2026-08-24'), 'sqlserver')).toBe("'2026-08-24'");
    });
  });
});

describe('substituteBinds', () => {
  const sql = 'select * from kitap where id = :id and ad = :ad and t > :t';

  it('değerleri yerine koyar', () => {
    const result = substituteBinds(
      sql,
      { id: v('42'), ad: v('Ömer'), t: v('2026-08-24') },
      'oracle',
    );
    expect(result.sql).toBe(
      "select * from kitap where id = 42 and ad = 'Ömer' and t > DATE '2026-08-24'",
    );
    expect(result.missing).toEqual([]);
  });

  it('aynı bind\'in her geçtiği yeri değiştirir', () => {
    const result = substituteBinds('where a = :x or b = :x', { x: v('7') }, 'oracle');
    expect(result.sql).toBe('where a = 7 or b = 7');
  });

  it('değeri verilmeyen bind olduğu gibi kalır ve raporlanır', () => {
    const result = substituteBinds(sql, { id: v('42') }, 'oracle');
    expect(result.sql).toContain(':ad');
    expect(result.missing).toEqual(['ad', 't']);
  });

  describe('literal ve yorumlara dokunmaz', () => {
    it('dize içindeki :mi korunur', () => {
      const result = substituteBinds(
        "select to_char(t, 'hh24:mi') from dual where a = :a",
        { a: v('1') },
        'oracle',
      );
      expect(result.sql).toBe("select to_char(t, 'hh24:mi') from dual where a = 1");
    });

    it('yorum içindeki bind korunur', () => {
      const result = substituteBinds('-- :gizli\nwhere a = :a', { a: v('1') }, 'oracle');
      expect(result.sql).toBe('-- :gizli\nwhere a = 1');
    });

    it('blok yorumu korunur', () => {
      const result = substituteBinds('/* :x */ where a = :a', { a: v('1') }, 'oracle');
      expect(result.sql).toBe('/* :x */ where a = 1');
    });

    it('kaçırılmış tırnaklı literal bozulmaz', () => {
      const result = substituteBinds("select 'it''s' , :a from t", { a: v('1') }, 'oracle');
      expect(result.sql).toBe("select 'it''s' , 1 from t");
    });
  });

  it('enjeksiyon denemesi literal olarak kaçırılır', () => {
    const result = substituteBinds(
      'where ad = :ad',
      { ad: v("'; drop table kitap; --") },
      'oracle',
    );
    expect(result.sql).toBe("where ad = '''; drop table kitap; --'");
  });

  it('bind yoksa sorgu aynen döner', () => {
    expect(substituteBinds('select 1 from dual', {}, 'oracle').sql).toBe('select 1 from dual');
  });
});
