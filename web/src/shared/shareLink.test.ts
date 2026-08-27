// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { canShare, decodeState, encodeState, readHash, withState } from './shareLink';

describe('canShare', () => {
  it('sıradan araçlarda açık', () => {
    expect(canShare('sql-fix')).toBe(true);
  });

  it.each(['jwt', 'hash', 'conn-string'])('%s kimlik bilgisi taşıyor, kapalı', (toolId) => {
    // Bağlantı üretmek içeriği geçmişe, panoya ve bağlantı önizlemesine
    // yazmak demek — bu araçların engellemek için var olduğu şey.
    expect(canShare(toolId)).toBe(false);
  });

  it('rota bağlamı yoksa kapalı', () => {
    expect(canShare(undefined)).toBe(false);
  });
});

describe('kodlama', () => {
  it('gidiş dönüş kayıpsız', async () => {
    const text = 'select * from siparis where kanal_id = :kanal';
    expect(await decodeState(await encodeState(text))).toBe(text);
  });

  it('çok baytlı karakterleri korur', async () => {
    const text = 'select ad from üye where şehir = \'İstanbul\' -- ğüşıöç';
    expect(await decodeState(await encodeState(text))).toBe(text);
  });

  it('satır sonlarını korur', async () => {
    const text = 'satır bir\nsatır iki\r\nsatır üç';
    expect(await decodeState(await encodeState(text))).toBe(text);
  });

  /* `CompressionStream` jsdom'da yok, gerçek tarayıcılarda var. İki yol da
     doğrulanıyor: hangisi koşarsa koşsun bağlantı üretilmeli, yalnızca
     boyutu değişmeli. */
  const compresses = typeof CompressionStream !== 'undefined';
  const repeated = 'select a from t where x = 1 and '.repeat(40);

  it.runIf(compresses)('tekrarlı metni gerçekten sıkıştırıyor', async () => {
    expect((await encodeState(repeated)).length).toBeLessThan(repeated.length / 2);
  });

  it.runIf(!compresses)('sıkıştırma yoksa düz kodlamaya düşer', async () => {
    const payload = await encodeState(repeated);
    expect(payload.startsWith('0')).toBe(true);
    expect(await decodeState(payload)).toBe(repeated);
  });

  it('adres güvenli karakterler üretir', async () => {
    const payload = await encodeState('a+b/c=d?e#f&g');
    expect(payload).toMatch(/^[01][A-Za-z0-9_-]*$/);
  });
});

describe('çözme dayanıklılığı', () => {
  it.each([
    ['', 'boş'],
    ['1', 'yalnızca bayrak'],
    ['9abc', 'bilinmeyen bayrak'],
    ['1!!!!', 'geçersiz base64'],
    ['1QUJD', 'bozuk sıkıştırma'],
  ])('%s → null (%s)', async (payload) => {
    // Kırık bir bağlantı aracı bozmamalı; girdi olduğu gibi kalıyor.
    expect(await decodeState(payload)).toBeNull();
  });
});

describe('adres', () => {
  it('yükü hash fragmentına koyar', () => {
    // Query string DEĞİL: fragment sunucuya hiç gitmiyor.
    expect(withState('https://x.dev/en/t/sql-fix', '1abc')).toBe('https://x.dev/en/t/sql-fix#s=1abc');
  });

  it('var olan fragmentı değiştirir, çoğaltmaz', () => {
    expect(withState('https://x.dev/en/t/sql-fix#s=eski', '1yeni')).toBe(
      'https://x.dev/en/t/sql-fix#s=1yeni',
    );
  });

  it('yolu ve sorguyu korur', () => {
    expect(withState('https://x.dev/tr/t/sql-fix?a=1', '1abc')).toBe(
      'https://x.dev/tr/t/sql-fix?a=1#s=1abc',
    );
  });

  it('fragmenttan yükü okur', () => {
    expect(readHash('#s=1abc')).toBe('1abc');
    expect(readHash('s=1abc')).toBe('1abc');
  });

  it('yük yoksa null', () => {
    expect(readHash('')).toBeNull();
    expect(readHash('#baska=1')).toBeNull();
  });
});
