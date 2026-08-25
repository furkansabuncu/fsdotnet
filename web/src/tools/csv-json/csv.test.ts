import { describe, expect, it } from 'vitest';
import { csvToInsert, csvToJson, parseCsv } from './csv';

const options = { delimiter: ',' as const, headerRow: true };

const value = (result: ReturnType<typeof csvToJson>) => {
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

describe('parseCsv', () => {
  it('basit satırları ayırır', () => {
    expect(parseCsv('a,b\n1,2', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  describe('tırnak kuralları — split(",") bunların hepsinde bozulur', () => {
    it('tırnak içindeki ayraç bölmez', () => {
      expect(parseCsv('"a,b",c', ',')).toEqual([['a,b', 'c']]);
    });

    it('tırnak içindeki satır sonu satır bitirmez', () => {
      expect(parseCsv('"iki\nsatır",x', ',')).toEqual([['iki\nsatır', 'x']]);
    });

    it('"" kaçırılmış tırnaktır', () => {
      expect(parseCsv('"o ""dedi""",x', ',')).toEqual([['o "dedi"', 'x']]);
    });

    it('alan ortasındaki tırnak sıradan karakterdir', () => {
      expect(parseCsv('5" boru,x', ',')).toEqual([['5" boru', 'x']]);
    });
  });

  describe('satır sonu biçimleri', () => {
    it.each([
      ['a\nb', 2],
      ['a\r\nb', 2],
      ['a\rb', 2],
      ['a\nb\n', 2],
      ['a\r\nb\r\n', 2],
    ])('%j → %i satır', (input, count) => {
      expect(parseCsv(input, ',')).toHaveLength(count);
    });
  });

  it('alternatif ayraçlar', () => {
    expect(parseCsv('a;b', ';')).toEqual([['a', 'b']]);
    expect(parseCsv('a\tb', '\t')).toEqual([['a', 'b']]);
    expect(parseCsv('a|b', '|')).toEqual([['a', 'b']]);
  });

  it('boş girdi satır üretmez', () => {
    expect(parseCsv('', ',')).toEqual([]);
  });
});

describe('csvToJson', () => {
  it('başlık satırını anahtar yapar', () => {
    const json = value(csvToJson('ad,yas\nÖmer,34', options));
    expect(JSON.parse(json)).toEqual([{ ad: 'Ömer', yas: 34 }]);
  });

  it('sayı gibi görünen hücreler sayı olur', () => {
    const json = value(csvToJson('a,b,c\n1,2.5,x', options));
    expect(JSON.parse(json)).toEqual([{ a: 1, b: 2.5, c: 'x' }]);
  });

  it('boş ve eksik hücreler null olur', () => {
    const json = value(csvToJson('a,b,c\n1,,', options));
    expect(JSON.parse(json)).toEqual([{ a: 1, b: null, c: null }]);
  });

  it('başlıksız modda kolonlar col1, col2 olur', () => {
    const json = value(csvToJson('1,2', { ...options, headerRow: false }));
    expect(JSON.parse(json)).toEqual([{ col1: 1, col2: 2 }]);
  });

  it('boş başlık adı col<n> ile doldurulur', () => {
    const json = value(csvToJson('ad,,yas\nÖmer,x,34', options));
    expect(Object.keys(JSON.parse(json)[0])).toEqual(['ad', 'col2', 'yas']);
  });

  it.each([
    ['', 'csvEmpty'],
    ['sadece,baslik', 'csvNoRows'],
  ])('%j → %s', (input, error) => {
    expect(csvToJson(input, options)).toEqual({ ok: false, error });
  });
});

describe('csvToInsert', () => {
  it('INSERT üretir', () => {
    expect(value(csvToInsert('ad,yas\nÖmer,34', options, 'hasta'))).toBe(
      "INSERT INTO hasta (ad, yas) VALUES ('Ömer', 34);",
    );
  });

  it('her satır için bir ifade', () => {
    const sql = value(csvToInsert('a\n1\n2\n3', options, 't'));
    expect(sql.split('\n')).toHaveLength(3);
  });

  describe('SQL güvenliği', () => {
    it('tek tırnak ikiye katlanarak kaçırılır', () => {
      expect(value(csvToInsert("ad\nO'Brien", options, 't'))).toContain("'O''Brien'");
    });

    it('enjeksiyon denemesi literal olarak kalır', () => {
      const sql = value(csvToInsert("ad\n'); DROP TABLE hasta; --", options, 't'));
      expect(sql).toBe("INSERT INTO t (ad) VALUES ('''); DROP TABLE hasta; --');");
    });

    it('boş hücre NULL olur, tırnaklı boş dize değil', () => {
      expect(value(csvToInsert('a,b\n1,', options, 't'))).toContain('VALUES (1, NULL)');
    });

    it('sayılar tırnaksız yazılır', () => {
      expect(value(csvToInsert('a\n42', options, 't'))).toContain('VALUES (42)');
    });
  });

  describe('tanımlayıcı tırnaklama', () => {
    it('güvenli adlar tırnaklanmaz — Oracle\'da tırnak kasa duyarlı yapar', () => {
      expect(value(csvToInsert('hasta_id\n1', options, 'tx_rapor'))).toContain(
        'INSERT INTO tx_rapor (hasta_id)',
      );
    });

    it('boşluk ya da Türkçe harf içeren ad tırnaklanır', () => {
      const sql = value(csvToInsert('doğum tarihi\n2026', options, 'my table'));
      expect(sql).toContain('"my table"');
      expect(sql).toContain('"doğum tarihi"');
    });
  });

  it('tablo adı boşsa varsayılan kullanılır', () => {
    expect(value(csvToInsert('a\n1', options, '  '))).toContain('INSERT INTO my_table');
  });
});
