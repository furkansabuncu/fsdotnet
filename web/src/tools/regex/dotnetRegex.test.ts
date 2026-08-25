import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiResult } from '../../services/api';
import { EMPTY_FLAGS, type RegexFlags } from './regex';

/*
 * Ağ katmanı taklit ediliyor, .NET motoru değil. Motorun kendi davranışı
 * backend tarafında test ediliyor (`RegexEndpointTests`); burada sınanan
 * şey ÇEVİRİ: istek nasıl kuruluyor, cevap arayüzün beklediği şekle nasıl
 * dönüşüyor ve sunucu yoksa ne oluyor.
 */
const postJson = vi.fn<(path: string, body: unknown) => Promise<ApiResult<unknown>>>();

vi.mock('../../services/api', () => ({
  postJson: (path: string, body: unknown) => postJson(path, body),
  isApiConfigured: true,
  apiBaseUrl: 'http://localhost:5106',
}));

const { runDotnetRegex } = await import('./dotnetRegex');

const flags = (overrides: Partial<RegexFlags> = {}): RegexFlags => ({ ...EMPTY_FLAGS, ...overrides });

const respond = (body: unknown) => postJson.mockResolvedValue({ ok: true, value: body });

const okBody = (matches: unknown[]) => ({
  success: true,
  matches,
  error: null,
  truncated: false,
  elapsedMilliseconds: 3,
});

beforeEach(() => postJson.mockReset());

describe('runDotnetRegex — istek', () => {
  it('sürümlü uca gider', async () => {
    respond(okBody([]));
    await runDotnetRegex('a', flags(), 'a');
    expect(postJson.mock.calls[0]?.[0]).toBe('/api/v1/regex/test');
  });

  /* JavaScript'te `s`, .NET'te `Singleline`. Aynı şeyin iki adı var ve
     yanlış eşlemek noktanın satır sonunu yakalayıp yakalamadığını sessizce
     değiştirirdi. */
  it('dotAll bayrağını Singleline olarak gönderir', async () => {
    respond(okBody([]));
    await runDotnetRegex('a', flags({ dotAll: true, ignoreCase: true }), 'a');

    expect(postJson.mock.calls[0]?.[1]).toMatchObject({
      pattern: 'a',
      input: 'a',
      options: { singleline: true, ignoreCase: true, multiline: false, cultureInvariant: false },
    });
  });

  it('boş deseni sunucuya hiç göndermez', async () => {
    const result = await runDotnetRegex('', flags(), 'a');
    expect(postJson).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('regexEmpty');
  });
});

describe('runDotnetRegex — cevap', () => {
  it('eşleşmeleri ve grupları çevirir', async () => {
    respond(
      okBody([
        {
          index: 4,
          length: 3,
          value: '123',
          groups: [{ name: 'sayi', success: true, index: 4, length: 3, value: '123' }],
        },
      ]),
    );

    const result = await runDotnetRegex('a', flags(), 'abc 123');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.matches).toEqual([
      { index: 4, length: 3, value: '123', groups: [{ name: 'sayi', value: '123', index: 4 }] },
    ]);
  });

  /* .NET eşleşmeyen grup için BOŞ DİZE döner; "yakalanmadı" ile "boş
     yakalandı" ayrımını yalnızca `success` taşıyor. Bunu düzleştirmek
     arayüzde ikisini aynı gösterirdi. */
  it('yakalanmayan grubu null yapar', async () => {
    respond(
      okBody([
        {
          index: 0,
          length: 1,
          value: 'a',
          groups: [{ name: '1', success: false, index: -1, length: 0, value: '' }],
        },
      ]),
    );

    const result = await runDotnetRegex('a', flags(), 'a');
    expect(result.ok && result.value.matches[0]?.groups[0]?.value).toBeNull();
  });

  it('kesilmiş sonucu ve süreyi taşır', async () => {
    respond({ success: true, matches: [], error: null, truncated: true, elapsedMilliseconds: 42 });
    const result = await runDotnetRegex('a', flags(), 'a');
    expect(result.ok && result.value).toMatchObject({ truncated: true, elapsedMilliseconds: 42 });
  });

  it('derlenmeyen deseni motorun mesajıyla bildirir', async () => {
    respond({
      success: false,
      matches: [],
      error: "Not enough )'s.",
      truncated: false,
      elapsedMilliseconds: 1,
    });

    const result = await runDotnetRegex('(a', flags(), 'a');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('regexInvalid');
      expect(result.detail).toContain(')');
    }
  });
});

describe('runDotnetRegex — sunucu yok', () => {
  /* Statik barındırmada API hiç yok. Bu bir arıza değil beklenen durum;
     arayüz bu anahtarı görünce JavaScript motoruna düşüyor. */
  it.each([
    ['unconfigured' as const],
    ['unreachable' as const],
    ['status' as const],
  ])('%s durumunda regexServerDown döner', async (reason) => {
    postJson.mockResolvedValue({ ok: false, reason, detail: 'x' });

    const result = await runDotnetRegex('a', flags(), 'a');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('regexServerDown');
      expect(result.detail).toBe('x');
    }
  });
});
