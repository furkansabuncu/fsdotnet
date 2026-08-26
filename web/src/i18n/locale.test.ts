import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  absoluteUrl,
  detectLocale,
  isLocale,
  localePath,
  splitLocale,
  swapLocale,
} from './locale';

describe('isLocale', () => {
  it.each([
    ['en', true],
    ['tr', true],
    ['de', false],
    ['t', false],
    ['', false],
    [undefined, false],
  ])('%j → %s', (value, expected) => {
    expect(isLocale(value)).toBe(expected);
  });
});

describe('detectLocale', () => {
  it('kaydedilmiş dil her şeyin önünde gelir', () => {
    expect(detectLocale('tr', ['en-US'])).toBe('tr');
    expect(detectLocale('en', ['tr-TR'])).toBe('en');
  });

  it('kaydedilmiş değer bozuksa yok sayılır', () => {
    expect(detectLocale('klingon', ['tr-TR'])).toBe('tr');
  });

  it('tarayıcı dilinin bölge ekini yok sayar', () => {
    expect(detectLocale(null, ['tr-TR'])).toBe('tr');
    expect(detectLocale(null, ['TR-cy'])).toBe('tr');
  });

  it('tanımadığı dilleri atlayıp sıradakine bakar', () => {
    expect(detectLocale(null, ['de-DE', 'fr', 'tr'])).toBe('tr');
  });

  it('hiçbir ipucu yoksa varsayılana düşer', () => {
    expect(detectLocale(null, [])).toBe(DEFAULT_LOCALE);
    expect(detectLocale(null, ['de-DE'])).toBe(DEFAULT_LOCALE);
  });

  /* `tr` ön eki kontrolü `startsWith('tr')` olsaydı burası yanlış eşleşirdi. */
  it('dil kodunun yalnızca ön ek olarak başlamasına aldanmaz', () => {
    expect(detectLocale(null, ['tra'])).toBe(DEFAULT_LOCALE);
    expect(detectLocale(null, ['english'])).toBe(DEFAULT_LOCALE);
  });
});

describe('splitLocale', () => {
  it.each([
    ['/tr/t/base64', 'tr', '/t/base64'],
    ['/en/t/base64', 'en', '/t/base64'],
    ['/tr', 'tr', '/'],
    ['/en/', 'en', '/'],
  ])('%j → %s + %j', (pathname, locale, rest) => {
    expect(splitLocale(pathname)).toEqual({ locale, rest });
  });

  it.each(['/t/base64', '/', '/foo', '/de/t/base64'])('dilsiz %j olduğu gibi kalır', (pathname) => {
    expect(splitLocale(pathname)).toEqual({ locale: null, rest: pathname });
  });
});

describe('localePath', () => {
  it.each([
    ['tr' as const, '/t/base64', '/tr/t/base64'],
    ['en' as const, '/', '/en'],
    ['en' as const, 't/base64', '/en/t/base64'],
  ])('%s + %j → %j', (locale, rest, expected) => {
    expect(localePath(locale, rest)).toBe(expected);
  });

  /* Kök `/tr/` değil `/tr`: sondaki bölü çizgisi aynı sayfanın ikinci bir
     adresi olur ve canonical ile sitemap çelişir. */
  it('kökte sondaki bölü çizgisini üretmez', () => {
    expect(localePath('tr')).toBe('/tr');
    expect(localePath('tr', '/')).toBe('/tr');
  });
});

describe('swapLocale', () => {
  it('sayfada kalıp yalnızca dili değiştirir', () => {
    expect(swapLocale('/tr/t/base64', 'en')).toBe('/en/t/base64');
    expect(swapLocale('/en', 'tr')).toBe('/tr');
  });

  it('dilsiz adrese dil ekler', () => {
    expect(swapLocale('/t/base64', 'tr')).toBe('/tr/t/base64');
  });
});

describe('absoluteUrl', () => {
  it('mutlak adres kurar', () => {
    expect(absoluteUrl('https://fsdotnet.dev', 'tr', '/t/base64')).toBe('https://fsdotnet.dev/tr/t/base64/');
  });

  it('sonda bölü çizgisi bırakır', () => {
    // GitHub Pages çizgisiz adresi 301 ile çizgiliye yönlendiriyor.
    // Canonical çizgisiz olsaydı, gösterdiği adres 200 dönmezdi.
    expect(absoluteUrl('https://fsdotnet.dev', 'en')).toBe('https://fsdotnet.dev/en/');
    expect(absoluteUrl('https://fsdotnet.dev', 'en', '/t/base64')).toBe(
      'https://fsdotnet.dev/en/t/base64/',
    );
  });

  it('tabandaki fazla bölü çizgisini kırpar', () => {
    // Yanlış taban canonical etiketini bozar, o yüzden normalleştiriliyor.
    expect(absoluteUrl('https://fsdotnet.dev/', 'en')).toBe('https://fsdotnet.dev/en/');
    expect(absoluteUrl('https://fsdotnet.dev///', 'en')).toBe('https://fsdotnet.dev/en/');
  });

  it('iç bağlantı biçimi çizgisiz kalır', () => {
    // Router iki biçimi de eşliyor; gezinmede yönlendirme olmasın diye
    // `localePath` çizgisiz üretmeye devam ediyor.
    expect(localePath('en', '/t/base64')).toBe('/en/t/base64');
  });
});
