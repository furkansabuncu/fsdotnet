import { describe, expect, it } from 'vitest';
import { formatSql, minifySql } from './sqlFormat';

const value = (result: ReturnType<typeof minifySql>) => {
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

const format = (sql: string, dialect: 'plsql' | 'transactsql' = 'plsql') =>
  value(formatSql(sql, { dialect, keywordCase: 'upper' }));

const minify = (sql: string) => value(minifySql(sql));

describe('formatSql', () => {
  it('tek satırlık sorguyu girintiler', () => {
    expect(format('select a, b from t where x = 1')).toBe(
      'SELECT\n  a,\n  b\nFROM\n  t\nWHERE\n  x = 1',
    );
  });

  it('anahtar sözcük kasasını uygular', () => {
    const lower = formatSql('SELECT A FROM T', { dialect: 'plsql', keywordCase: 'lower' });
    expect(value(lower)).toContain('select');

    const preserve = formatSql('SeLeCt a FROM t', { dialect: 'plsql', keywordCase: 'preserve' });
    expect(value(preserve)).toContain('SeLeCt');
  });

  it('Oracle sözdizimini tanır', () => {
    const out = format(
      "select nvl(a, 0) from dual where d >= trunc(sysdate) - 7 connect by prior id = pid",
    );
    expect(out).toContain('NVL');
    expect(out).toContain('CONNECT BY');
  });

  it('T-SQL sözdizimini tanır', () => {
    const out = format('select top 10 [Ad] from [dbo].[Hasta]', 'transactsql');
    expect(out).toContain('TOP');
    expect(out).toContain('[dbo].[Hasta]');
  });

  it('boş girdi boş çıktı verir', () => {
    expect(format('')).toBe('');
    expect(format('   \n  ')).toBe('');
  });
});

describe('minifySql', () => {
  it('satırlara yayılmış sorguyu tek satıra indirir', () => {
    const sql = `SELECT
      a,
      b
    FROM
      t`;
    expect(minify(sql)).toBe('SELECT a,b FROM t');
  });

  it('satır yorumunu siler ama token\'ları birleştirmez', () => {
    expect(minify('select a -- yorum\nfrom t')).toBe('select a from t');
  });

  it('blok yorumunu siler', () => {
    expect(minify('select /* araya */ a from t')).toBe('select a from t');
  });

  describe('string literal dokunulmaz', () => {
    // Naif bir \\s+ → ' ' değiştirmesi bu vakaların hepsini sessizce bozar.
    it.each([
      ["select 'a   b' from t", "select 'a   b' from t"],
      ["select 'x , y' from t", "select 'x , y' from t"],
      ["select 'çok\n satır' from t", "select 'çok\n satır' from t"],
      ["select 'it''s' from t", "select 'it''s' from t"],
      ['select "iki  boşluk" from t', 'select "iki  boşluk" from t'],
      ["select '-- yorum değil' from t", "select '-- yorum değil' from t"],
      ["select '/* bu da değil */' from t", "select '/* bu da değil */' from t"],
    ])('%j korunur', (input, expected) => {
      expect(minify(input)).toBe(expected);
    });
  });

  it('noktalama çevresini sıkar ama token\'ları yapıştırmaz', () => {
    expect(minify('select a , b , c from t where x in ( 1 , 2 )')).toBe(
      'select a,b,c from t where x in (1,2)',
    );
  });

  it('sonuç yeniden biçimlendirilebilir — tur gidiş dönüşü', () => {
    const original = 'select a, b from t where x = 1';
    const roundTrip = format(minify(format(original)));
    expect(roundTrip).toBe(format(original));
  });

  it('boş girdi boş çıktı verir', () => {
    expect(minify('')).toBe('');
    expect(minify('  \n ')).toBe('');
  });

  it('kapanmamış tırnak çökmez', () => {
    expect(minify("select 'yarım")).toBe("select 'yarım");
  });
});
