import { describe, expect, it } from 'vitest';
import { buildInList, splitValues, type InListOptions } from './inList';

const base: InListOptions = {
  column: 'kitap_id',
  quote: 'auto',
  dedupe: true,
  skipEmpty: true,
  chunkSize: 1000,
};

const build = (input: string, options: Partial<InListOptions> = {}) => {
  const result = buildInList(input, { ...base, ...options });
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

describe('splitValues', () => {
  it.each([
    ['1\n2\n3', ['1', '2', '3']],
    ['1,2,3', ['1', '2', '3']],
    ['1\t2\t3', ['1', '2', '3']],
    ['1;2;3', ['1', '2', '3']],
    ['1\r\n2', ['1', '2']],
    [' 1 , 2 ', ['1', '2']],
  ])('%j → %j', (input, expected) => {
    expect(splitValues(input)).toEqual(expected);
  });
});

describe('buildInList', () => {
  it('sayıları tırnaksız bırakır', () => {
    expect(build('1\n2\n3').sql).toBe('kitap_id IN (1, 2, 3)');
  });

  it('metinleri tırnaklar', () => {
    expect(build('a\nb').sql).toBe("kitap_id IN ('a', 'b')");
  });

  it('karışık listede her değeri ayrı değerlendirir', () => {
    expect(build('1\nabc').sql).toBe("kitap_id IN (1, 'abc')");
  });

  describe('tırnaklama modu', () => {
    it('always: sayılar da tırnaklanır', () => {
      expect(build('1\n2', { quote: 'always' }).sql).toBe("kitap_id IN ('1', '2')");
    });

    it('never: hiçbiri tırnaklanmaz', () => {
      expect(build('a\nb', { quote: 'never' }).sql).toBe('kitap_id IN (a, b)');
    });
  });

  it('değerdeki tek tırnak ikiye katlanır', () => {
    expect(build("O'Brien").sql).toBe("kitap_id IN ('O''Brien')");
  });

  it('baştaki sıfırlı kodlar tırnaklanır — sayı sayılmaz', () => {
    // "007" bir kod; sayıya çevirmek başındaki sıfırları düşürürdü.
    expect(build('007').sql).toBe("kitap_id IN ('007')");
  });

  describe('temizlik', () => {
    it('tekrarları atar ve sayısını bildirir', () => {
      const result = build('1\n2\n1\n2\n3');
      expect(result.sql).toBe('kitap_id IN (1, 2, 3)');
      expect(result.removedDuplicates).toBe(2);
    });

    it('dedupe kapalıyken tekrarlar kalır', () => {
      expect(build('1\n1', { dedupe: false }).sql).toBe('kitap_id IN (1, 1)');
    });

    it('boş satırlar atılır — Excel yapıştırmasında sonda hep boş satır olur', () => {
      expect(build('1\n\n2\n\n').count).toBe(2);
    });
  });

  describe('ORA-01795 parçalama', () => {
    const many = Array.from({ length: 2500 }, (_, i) => i + 1).join('\n');

    it('1000 altında tek liste', () => {
      const result = build(Array.from({ length: 999 }, (_, i) => i + 1).join('\n'));
      expect(result.chunks).toBe(1);
      expect(result.sql.startsWith('kitap_id IN (')).toBe(true);
      expect(result.sql).not.toContain('OR');
    });

    it('tam 1000 hâlâ tek liste — sınır dahil', () => {
      expect(build(Array.from({ length: 1000 }, (_, i) => i + 1).join('\n')).chunks).toBe(1);
    });

    it('1001 olunca ikiye bölünür', () => {
      expect(build(Array.from({ length: 1001 }, (_, i) => i + 1).join('\n')).chunks).toBe(2);
    });

    it('2500 değer üç parça ve OR ile birleşir', () => {
      const result = build(many);
      expect(result.chunks).toBe(3);
      expect(result.count).toBe(2500);
      expect(result.sql.match(/kitap_id IN \(/g)).toHaveLength(3);
      expect(result.sql.match(/OR/g)).toHaveLength(2);
      // Tümü tek parantez içinde — AND'li bir WHERE'e güvenle eklenebilsin.
      expect(result.sql.startsWith('(')).toBe(true);
      expect(result.sql.endsWith(')')).toBe(true);
    });

    it('parça boyutu değiştirilebilir', () => {
      expect(build('1\n2\n3\n4\n5', { chunkSize: 2 }).chunks).toBe(3);
    });

    it('hiçbir değer kaybolmaz', () => {
      const result = build(many);
      const numbers = result.sql.match(/\d+/g) ?? [];
      expect(new Set(numbers).size).toBe(2500);
    });
  });

  it('kolon adı boşsa yalnızca liste üretir', () => {
    expect(build('1\n2', { column: '' }).sql).toBe('1, 2');
  });

  it.each([
    ['', 'inListEmpty'],
    ['\n\n\n', 'inListEmpty'],
  ])('%j → %s', (input, error) => {
    expect(buildInList(input, base)).toEqual({ ok: false, error });
  });
});
