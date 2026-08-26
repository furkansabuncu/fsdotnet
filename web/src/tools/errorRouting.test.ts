import { describe, expect, it } from 'vitest';
import { routeError, toolForOraCode } from './errorRouting';

describe('routeError', () => {
  it.each([
    ['ORA-00911: invalid character', 'sql-fix'],
    ['ORA-1795', 'in-list'],
    ['ORA-00972: identifier is too long', 'oracle-identity'],
    ['error CS0854: An expression tree may not contain…', 'linq-11g'],
  ])('%s → %s', (input, tool) => {
    expect(routeError(input)?.tool).toBe(tool);
  });

  it('sıfır dolgusu olmadan da eşleşir', () => {
    // Log bazen ORA-1795, bazen ORA-01795 basıyor.
    expect(routeError('ORA-1795')?.tool).toBe(routeError('ORA-01795')?.tool);
  });

  it('bozuk metni mojibake aracına yönlendirir', () => {
    expect(routeError('TÃ¼rkÃ§e karakterler bozuk')?.tool).toBe('mojibake');
  });

  it('Delphi string ifadesini PAS aracına yönlendirir', () => {
    expect(routeError("'select * from t ' + 'where x = 1'")?.tool).toBe('pas-sql');
  });

  it('JWT’yi çözücüye yönlendirir', () => {
    expect(routeError('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc')?.tool).toBe('jwt');
  });

  it('bağlama içeren sorguyu bind aracına yönlendirir', () => {
    expect(routeError('select * from siparis where kanal_id = :kanal')?.tool).toBe('bind-params');
  });

  it('sade sorguyu denetleyiciye yönlendirir', () => {
    expect(routeError('select ad from uye')?.tool).toBe('sql-fix');
  });

  it('boş girdi null döner', () => {
    expect(routeError('   ')).toBeNull();
  });

  it('eşleşmeyen metin null döner', () => {
    expect(routeError('merhaba dünya')).toBeNull();
  });
});

describe('toolForOraCode', () => {
  it('bilinen kodu bulur', () => {
    expect(toolForOraCode(1795)?.tool).toBe('in-list');
  });

  it('bilinmeyen kod null döner', () => {
    expect(toolForOraCode(12154)).toBeNull();
  });
});
