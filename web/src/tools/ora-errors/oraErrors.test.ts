import { describe, expect, it } from 'vitest';
import { ORA_ERRORS, ORA_GROUPS, formatCode, searchOraErrors } from './oraErrors';

describe('ORA_ERRORS verisi', () => {
  it('kodlar benzersiz ve artan sırada', () => {
    const codes = ORA_ERRORS.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort((a, b) => a - b)).toEqual(codes);
  });

  it('her kayıt mesaj ve sebep taşır', () => {
    for (const item of ORA_ERRORS) {
      expect(item.message, formatCode(item.code)).not.toBe('');
      expect(item.cause, formatCode(item.code)).not.toBe('');
      expect(ORA_GROUPS).toContain(item.group);
    }
  });

  it('en sık karşılaşılanlar mevcut', () => {
    const codes = ORA_ERRORS.map((item) => item.code);
    for (const code of [1, 904, 942, 1400, 1403, 1722, 1795, 2291, 6502, 12154, 12899]) {
      expect(codes, `ORA-${code}`).toContain(code);
    }
  });
});

describe('formatCode', () => {
  it.each([
    [1, 'ORA-00001'],
    [942, 'ORA-00942'],
    [1722, 'ORA-01722'],
    [12899, 'ORA-12899'],
  ])('%i → %s', (code, expected) => {
    expect(formatCode(code)).toBe(expected);
  });
});

describe('searchOraErrors', () => {
  it('boş sorgu hepsini verir', () => {
    expect(searchOraErrors('', 'all')).toHaveLength(ORA_ERRORS.length);
  });

  describe('kod araması — logdan kopyala-yapıştır çalışmalı', () => {
    it.each(['1722', '01722', 'ORA-01722', 'ora-01722', 'ORA-1722'])('%j → 1722 bulur', (query) => {
      expect(searchOraErrors(query, 'all').map((item) => item.code)).toContain(1722);
    });

    it('kısmi kod önek olarak eşleşir', () => {
      const codes = searchOraErrors('1289', 'all').map((item) => item.code);
      expect(codes).toContain(12899);
      expect(codes.every((code) => String(code).startsWith('1289'))).toBe(true);
    });
  });

  it('mesaj metnine göre arar', () => {
    expect(searchOraErrors('table or view', 'all').map((item) => item.code)).toContain(942);
  });

  it('sebep metnine göre arar — Türkçe not da aranabilir', () => {
    expect(searchOraErrors('sequence', 'all').map((item) => item.code)).toContain(1);
  });

  it('gruba göre filtreler', () => {
    const results = searchOraErrors('', 'connection');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.group === 'connection')).toBe(true);
  });

  it('grup ve sorgu birlikte çalışır', () => {
    expect(searchOraErrors('TNS', 'connection').length).toBeGreaterThan(3);
    expect(searchOraErrors('TNS', 'data')).toEqual([]);
  });

  it('eşleşme yoksa boş döner', () => {
    expect(searchOraErrors('kesinlikle-boyle-bir-sey-yok', 'all')).toEqual([]);
  });
});
