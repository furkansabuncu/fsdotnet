import { describe, expect, it } from 'vitest';
import { HTTP_STATUSES, searchStatuses, statusClass } from './httpStatus';

describe('HTTP_STATUSES verisi', () => {
  it('kodlar benzersiz ve artan sırada', () => {
    const codes = HTTP_STATUSES.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort((a, b) => a - b)).toEqual(codes);
  });

  it('her kayıt dolu', () => {
    for (const item of HTTP_STATUSES) {
      expect(item.code).toBeGreaterThanOrEqual(100);
      expect(item.code).toBeLessThan(600);
      expect(item.name).not.toBe('');
      expect(item.summary).not.toBe('');
    }
  });

  it('.NET sabit adları Status<kod> ile başlar', () => {
    for (const item of HTTP_STATUSES) {
      if (item.dotnet === null) continue;
      expect(item.dotnet.startsWith(`Status${item.code}`)).toBe(true);
    }
  });

  it('en çok aranan kodlar mevcut', () => {
    const codes = HTTP_STATUSES.map((s) => s.code);
    for (const code of [200, 201, 204, 301, 304, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503]) {
      expect(codes).toContain(code);
    }
  });
});

describe('statusClass', () => {
  it.each([
    [100, '1xx'],
    [204, '2xx'],
    [301, '3xx'],
    [404, '4xx'],
    [503, '5xx'],
  ])('%i → %s', (code, expected) => {
    expect(statusClass(code)).toBe(expected);
  });
});

describe('searchStatuses', () => {
  it('boş sorgu hepsini verir', () => {
    expect(searchStatuses('', 'all')).toHaveLength(HTTP_STATUSES.length);
  });

  it('kod ÖNEK olarak eşleşir', () => {
    const codes = searchStatuses('40', 'all').map((s) => s.code);
    expect(codes).toContain(404);
    expect(codes).toContain(400);
    // Alt dize eşleşmesi olsaydı 240/540 gibi kodlar da gelirdi.
    expect(codes.every((code) => String(code).startsWith('40'))).toBe(true);
  });

  it('ada göre arar', () => {
    expect(searchStatuses('not found', 'all').map((s) => s.code)).toContain(404);
  });

  it('.NET sabitine göre arar — bu aracın ayırt edici tarafı', () => {
    expect(searchStatuses('Status422', 'all').map((s) => s.code)).toEqual([422]);
  });

  it('açıklamaya göre arar', () => {
    expect(searchStatuses('rate limited', 'all').map((s) => s.code)).toContain(429);
  });

  it('büyük/küçük harf duyarsız', () => {
    expect(searchStatuses('TEAPOT', 'all').map((s) => s.code)).toEqual([418]);
  });

  it('sınıfa göre filtreler', () => {
    const results = searchStatuses('', '5xx');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((s) => s.code >= 500 && s.code < 600)).toBe(true);
  });

  it('sınıf ve sorgu birlikte çalışır', () => {
    expect(searchStatuses('gateway', '5xx').map((s) => s.code)).toEqual([502, 504]);
  });

  it('eşleşme yoksa boş döner', () => {
    expect(searchStatuses('kesinlikle-yok', 'all')).toEqual([]);
  });
});
