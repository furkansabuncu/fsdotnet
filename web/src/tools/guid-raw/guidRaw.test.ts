import { describe, expect, it } from 'vitest';
import { convertGuid, swapFields } from './guidRaw';

const value = (input: string, fromRaw = false) => {
  const result = convertGuid(input, fromRaw);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

const GUID = '00112233-4455-6677-8899-aabbccddeeff';

describe('swapFields', () => {
  it('ilk üç alanı ters çevirir, son sekiz baytı bırakır', () => {
    const bytes = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect([...swapFields(bytes)]).toEqual([3, 2, 1, 0, 5, 4, 7, 6, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  it('kendi tersidir', () => {
    const bytes = Uint8Array.from({ length: 16 }, (_, index) => index * 7);
    expect([...swapFields(swapFields(bytes))]).toEqual([...bytes]);
  });
});

describe('GUID → RAW', () => {
  it('metin sırasını korur', () => {
    expect(value(GUID).hexSameOrder).toBe('00112233445566778899AABBCCDDEEFF');
  });

  it('.NET bayt sırasını ayrıca verir', () => {
    // Guid.ToByteArray() ilk üç alanı little-endian yazıyor.
    expect(value(GUID).hexDotnetBytes).toBe('33221100554477668899AABBCCDDEEFF');
  });

  it('HEXTORAW literali üretir', () => {
    expect(value(GUID).hextoraw).toBe("HEXTORAW('00112233445566778899AABBCCDDEEFF')");
  });
});

describe('RAW → GUID', () => {
  it('.NET baytlarını doğru GUID’e çevirir', () => {
    expect(value('33221100554477668899AABBCCDDEEFF', true).guid).toBe(GUID);
  });

  it('gidiş dönüş kayıpsız', () => {
    expect(value(value(GUID).hexDotnetBytes, true).guid).toBe(GUID);
  });
});

describe('girdi biçimleri', () => {
  it.each([
    GUID,
    '00112233445566778899aabbccddeeff',
    '{00112233-4455-6677-8899-AABBCCDDEEFF}',
    '(00112233-4455-6677-8899-aabbccddeeff)',
    '0x00112233445566778899aabbccddeeff',
    '  00112233-4455-6677-8899-aabbccddeeff  ',
  ])('%s kabul edilir', (input) => {
    expect(value(input).guid).toBe(GUID);
  });

  it('boş girdi hata döner', () => {
    expect(convertGuid('   ', false)).toEqual({ ok: false, error: 'guidEmpty' });
  });

  it('eksik hane hata döner ve uzunluğu söyler', () => {
    expect(convertGuid('00112233', false)).toEqual({
      ok: false,
      error: 'guidInvalid',
      detail: '8/32',
    });
  });

  it('hex olmayan karakter hata döner', () => {
    expect(convertGuid('z0112233-4455-6677-8899-aabbccddeeff', false).ok).toBe(false);
  });
});
