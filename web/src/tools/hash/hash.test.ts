import { describe, expect, it } from 'vitest';
import { hmacMd5, md5 } from './md5';
import { computeHashes, crc32, toBase64, toHex, type HashRow } from './hash';

const encoder = new TextEncoder();
const bytes = (text: string) => encoder.encode(text);

const find = (rows: HashRow[], algorithm: string) =>
  rows.find((row) => row.algorithm === algorithm)?.value;

describe('md5', () => {
  /* RFC 1321 Appendix A.5'teki resmî test vektörleri. */
  it.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['a', '0cc175b9c0f1b6a831c399e269772661'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
    [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      'd174ab98d277d9f5a5611c2c9f419d9f',
    ],
    [
      '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
      '57edf4a22be3c955ac49da2e2107b67a',
    ],
  ])('md5(%j)', (input, expected) => {
    expect(toHex(md5(bytes(input)))).toBe(expected);
  });

  /* 56 bayt sınırı dolgu mantığının kırılma noktası: uzunluk alanı artık
     aynı bloğa sığmıyor, fazladan bir blok gerekiyor. */
  it('blok sınırında doğru dolgu yapar', () => {
    expect(toHex(md5(bytes('a'.repeat(55))))).toBe('ef1772b6dff9a122358552954ad0df65');
    expect(toHex(md5(bytes('a'.repeat(56))))).toBe('3b0c8ac703f828b04c6c197006d17218');
    expect(toHex(md5(bytes('a'.repeat(64))))).toBe('014842d480b571495a4a0363793f7367');
  });

  it('UTF-8 baytları üzerinden çalışır', () => {
    // "ü" iki bayt; JS karakteri üzerinden hesaplansa sonuç farklı çıkardı.
    expect(toHex(md5(bytes('ü')))).toBe('c03410a5204b21cd8229ff754688d743');
  });
});

describe('hmacMd5', () => {
  /* RFC 2202 test vektörleri. */
  it.each([
    [new Uint8Array(16).fill(0x0b), 'Hi There', '9294727a3638bb1c13f48ef8158bfc9d'],
    [bytes('Jefe'), 'what do ya want for nothing?', '750c783e6ab0b503eaa86e310a5db738'],
  ])('vektör %#', (key, message, expected) => {
    expect(toHex(hmacMd5(key, bytes(message)))).toBe(expected);
  });

  it('blok boyutundan uzun anahtarı önce özetler', () => {
    const key = new Uint8Array(80).fill(0xaa);
    expect(toHex(hmacMd5(key, bytes('Test Using Larger Than Block-Size Key - Hash Key First')))).toBe(
      '6b1ab7fe4bd7bf8f0b62e6ce61b9d0cd',
    );
  });
});

describe('crc32', () => {
  it.each([
    ['', 0x00_00_00_00],
    ['a', 0xe8_b7_be_43],
    ['abc', 0x35_24_41_c2],
    ['123456789', 0xcb_f4_39_26],
  ])('crc32(%j)', (input, expected) => {
    expect(crc32(bytes(input))).toBe(expected);
  });
});

describe('kodlama', () => {
  it('onaltılık her baytı iki hane yazar', () => {
    expect(toHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe('00010f10ff');
  });

  it('base64 üretir', () => {
    expect(toBase64(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe('3q2+7w==');
  });
});

describe('computeHashes', () => {
  it('tüm algoritmalar için değer döndürür', async () => {
    const rows = await computeHashes({ text: 'abc', hmacKey: '', encoding: 'hex' });
    expect(rows).toHaveLength(6);
    expect(find(rows, 'MD5')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(find(rows, 'SHA-1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(find(rows, 'SHA-256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('CRC32 için sabit sekiz hane basar', async () => {
    const rows = await computeHashes({ text: 'a', hmacKey: '', encoding: 'hex' });
    expect(find(rows, 'CRC32')).toBe('e8b7be43');
  });

  it('boş girdide bile özet üretir', async () => {
    const rows = await computeHashes({ text: '', hmacKey: '', encoding: 'hex' });
    expect(find(rows, 'MD5')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('HEX seçeneği büyük harf verir', async () => {
    const rows = await computeHashes({ text: 'abc', hmacKey: '', encoding: 'HEX' });
    expect(find(rows, 'MD5')).toBe('900150983CD24FB0D6963F7D28E17F72');
  });

  it('base64 seçeneği base64 verir', async () => {
    const rows = await computeHashes({ text: 'abc', hmacKey: '', encoding: 'base64' });
    expect(find(rows, 'SHA-256')).toBe('ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');
  });

  it('anahtar verildiğinde HMAC hesaplar', async () => {
    const rows = await computeHashes({
      text: 'what do ya want for nothing?',
      hmacKey: 'Jefe',
      encoding: 'hex',
    });
    expect(find(rows, 'MD5')).toBe('750c783e6ab0b503eaa86e310a5db738');
    // RFC 2202 / RFC 4231, aynı anahtar ve mesaj için SHA-256 vektörü.
    expect(find(rows, 'SHA-256')).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    );
  });

  it('anahtar verildiğinde CRC32 boş kalır', async () => {
    const rows = await computeHashes({ text: 'abc', hmacKey: 'k', encoding: 'hex' });
    expect(find(rows, 'CRC32')).toBeNull();
  });
});
