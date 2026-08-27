import { describe, expect, it } from 'vitest';
import { strategyFor } from './strategy';

const ORIGIN = 'https://furkansabuncu.github.io';
const at = (url: string, method = 'GET') => strategyFor({ url, method }, ORIGIN);

describe('değişmez varlıklar', () => {
  it.each([
    '/fsdotnet/assets/index-8pZt22JB.js',
    '/fsdotnet/assets/index-DsHVBjl9.css',
    '/fsdotnet/assets/SqlFixTool-CQEJjIeW.js',
  ])('%s önbellekten', (path) => {
    // İçerik özeti adın parçası; içerik değişirse ad değişir.
    expect(at(ORIGIN + path)).toBe('cache-first');
  });

  it('özetsiz bir varlık önbellekten VERİLMEZ', () => {
    // `og.png` içerik değişse de aynı adı taşıyor; önbellekten vermek
    // güncellenmiş bir kartı sonsuza kadar eski gösterirdi.
    expect(at(`${ORIGIN}/fsdotnet/og.png`)).toBe('network-first');
  });

  it('kısa son ek özet sayılmaz', () => {
    expect(at(`${ORIGIN}/fsdotnet/assets/logo-v2.png`)).toBe('network-first');
  });
});

describe('sayfalar', () => {
  it.each(['/fsdotnet/', '/fsdotnet/tr', '/fsdotnet/en/t/sql-fix/', '/fsdotnet/tr/r/linq-11g-any-async/'])(
    '%s önce ağdan',
    (path) => {
      expect(at(ORIGIN + path)).toBe('network-first');
    },
  );

  it('sitemap ve robots da önce ağdan', () => {
    expect(at(`${ORIGIN}/fsdotnet/sitemap.xml`)).toBe('network-first');
    expect(at(`${ORIGIN}/fsdotnet/robots.txt`)).toBe('network-first');
  });
});

describe('karışılmayanlar', () => {
  it('başka kaynak es geçilir', () => {
    // API'nin .NET regex motoru buradan geliyor; eski bir cevap vermek
    // aracın var olma sebebini ortadan kaldırırdı.
    expect(at('https://api.fsdotnet.dev/api/v1/regex')).toBe('bypass');
  });

  it.each(['POST', 'PUT', 'DELETE', 'HEAD'])('%s es geçilir', (method) => {
    expect(at(`${ORIGIN}/fsdotnet/`, method)).toBe('bypass');
  });

  it('ayrıştırılamayan adres es geçilir', () => {
    expect(at('bu bir adres değil')).toBe('bypass');
  });
});

describe('kök yolda yayın', () => {
  it('önek olmadan da aynı kararları verir', () => {
    expect(at(`${ORIGIN}/assets/index-8pZt22JB.js`)).toBe('cache-first');
    expect(at(`${ORIGIN}/en/t/sql-fix/`)).toBe('network-first');
  });
});
