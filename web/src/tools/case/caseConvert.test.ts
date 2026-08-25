import { describe, expect, it } from 'vitest';
import { convertCase, convertLines, localeDiffers, splitWords } from './caseConvert';

describe('splitWords', () => {
  describe('ayraçlı biçimler', () => {
    it.each([
      ['hasta_id', ['hasta', 'id']],
      ['hasta-id', ['hasta', 'id']],
      ['hasta.id', ['hasta', 'id']],
      ['hasta id', ['hasta', 'id']],
      ['HASTA_ID', ['HASTA', 'ID']],
      ['__hasta__id__', ['hasta', 'id']],
    ])('%j → %j', (input, expected) => {
      expect(splitWords(input)).toEqual(expected);
    });
  });

  describe('kasa sınırları', () => {
    it.each([
      ['hastaId', ['hasta', 'Id']],
      ['HastaId', ['Hasta', 'Id']],
      ['eklemeTarihi', ['ekleme', 'Tarihi']],
    ])('%j → %j', (input, expected) => {
      expect(splitWords(input)).toEqual(expected);
    });
  });

  describe('kısaltmalar — naif "büyük harfte böl" burada patlar', () => {
    it.each([
      ['XMLHttpRequest', ['XML', 'Http', 'Request']],
      ['HTTPResponse', ['HTTP', 'Response']],
      ['parseJSON', ['parse', 'JSON']],
      ['IOSDevice', ['IOS', 'Device']],
      ['ID', ['ID']],
    ])('%j → %j', (input, expected) => {
      expect(splitWords(input)).toEqual(expected);
    });
  });

  describe('rakam sınırları', () => {
    it.each([
      ['user2Name', ['user', '2', 'Name']],
      ['sha256Hash', ['sha', '256', 'Hash']],
      ['v1', ['v', '1']],
    ])('%j → %j', (input, expected) => {
      expect(splitWords(input)).toEqual(expected);
    });
  });

  it('boş girdi boş dizi verir', () => {
    expect(splitWords('')).toEqual([]);
    expect(splitWords('   ')).toEqual([]);
    expect(splitWords('___')).toEqual([]);
  });
});

describe('convertCase', () => {
  describe('hasta_id kaynaklı tüm biçimler', () => {
    it.each([
      ['camel', 'hastaId'],
      ['pascal', 'HastaId'],
      ['snake', 'hasta_id'],
      ['constant', 'HASTA_ID'],
      ['kebab', 'hasta-id'],
      ['title', 'Hasta Id'],
      ['sentence', 'Hasta id'],
      ['dot', 'hasta.id'],
    ] as const)('%s → %s', (target, expected) => {
      expect(convertCase('hasta_id', target)).toBe(expected);
    });
  });

  it('her yönde gidiş dönüş kararlı', () => {
    // snake → camel → snake aynı sonuca dönmeli.
    const original = 'ekleme_tarihi_utc';
    expect(convertCase(convertCase(original, 'camel'), 'snake')).toBe(original);
    expect(convertCase(convertCase(original, 'pascal'), 'snake')).toBe(original);
    expect(convertCase(convertCase(original, 'kebab'), 'snake')).toBe(original);
  });

  it('kısaltmalı ad camelCase\'e düzgün iner', () => {
    expect(convertCase('XMLHttpRequest', 'snake')).toBe('xml_http_request');
    expect(convertCase('XMLHttpRequest', 'camel')).toBe('xmlHttpRequest');
  });

  it('boş girdi boş çıktı', () => {
    expect(convertCase('', 'camel')).toBe('');
  });
});

describe('Türkçe kasa tuzağı', () => {
  // .NET'te tr-TR altında "file".ToUpper() → "FİLE". Aynı ayrım burada da var
  // ve tanımlayıcı üretirken neredeyse her zaman invariant istenir.
  it('invariant: i → I', () => {
    expect(convertCase('iptal_durumu', 'constant', 'invariant')).toBe('IPTAL_DURUMU');
  });

  it('tr: i → İ', () => {
    expect(convertCase('iptal_durumu', 'constant', 'tr')).toBe('İPTAL_DURUMU');
  });

  it('invariant: I → i', () => {
    expect(convertCase('IPTAL', 'snake', 'invariant')).toBe('iptal');
  });

  it('tr: I → ı', () => {
    expect(convertCase('IPTAL', 'snake', 'tr')).toBe('ıptal');
  });

  describe('localeDiffers', () => {
    it.each([
      ['iptal_durumu', 'constant', true],
      ['IPTAL', 'snake', true],
      // Gerçek tuzak: "id" içindeki i, tr-TR altında HASTA_İD üretir.
      ['hasta_id', 'constant', true],
      ['hasta_kodu', 'constant', false],
      ['rapor_kodu', 'camel', false],
    ] as const)('%j / %s → %s', (input, target, expected) => {
      expect(localeDiffers(input, target)).toBe(expected);
    });
  });
});

describe('convertLines', () => {
  it('her satırı bağımsız çevirir', () => {
    expect(convertLines('hasta_id\nekleme_tarihi\nrapor_kodu', 'camel')).toBe(
      'hastaId\neklemeTarihi\nraporKodu',
    );
  });

  it('boş satırlar korunur — liste hizası bozulmasın', () => {
    expect(convertLines('a_b\n\nc_d', 'camel')).toBe('aB\n\ncD');
  });

  it('tek satır da çalışır', () => {
    expect(convertLines('hasta_id', 'pascal')).toBe('HastaId');
  });
});
