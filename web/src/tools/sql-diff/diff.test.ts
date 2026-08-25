import { describe, expect, it } from 'vitest';
import { MAX_LINES, diffLines, diffWords } from './diff';

const ops = (before: string, after: string) => diffLines(before, after).rows.map((row) => row.op);
const texts = (before: string, after: string, op: string) =>
  diffLines(before, after).rows.filter((row) => row.op === op).map((row) => row.text);

describe('diffLines', () => {
  it('aynı metinde hepsi equal', () => {
    const summary = diffLines('a\nb\nc', 'a\nb\nc');
    expect(summary.rows.every((row) => row.op === 'equal')).toBe(true);
    expect(summary).toMatchObject({ added: 0, removed: 0, unchanged: 3 });
  });

  it('eklenen satırı yakalar', () => {
    expect(texts('a\nc', 'a\nb\nc', 'insert')).toEqual(['b']);
  });

  it('silinen satırı yakalar', () => {
    expect(texts('a\nb\nc', 'a\nc', 'delete')).toEqual(['b']);
  });

  it('değişen satır sil + ekle olarak görünür', () => {
    expect(ops('a\nb', 'a\nB')).toEqual(['equal', 'delete', 'insert']);
  });

  it('satır numaraları iki tarafta ayrı ilerler', () => {
    const rows = diffLines('a\nb\nc', 'a\nx\ny\nc').rows;
    const last = rows[rows.length - 1];
    expect(last).toMatchObject({ op: 'equal', left: 3, right: 4 });
  });

  it('tamamen farklı metinde ortak satır kalmaz', () => {
    const summary = diffLines('a\nb', 'x\ny');
    expect(summary.unchanged).toBe(0);
    expect(summary).toMatchObject({ removed: 2, added: 2 });
  });

  it('boş taraf tamamen ekleme sayılır', () => {
    expect(diffLines('', 'a\nb')).toMatchObject({ added: 2 });
  });

  it('çok uzun girdi kırpılır ve bunu bildirir', () => {
    const long = Array.from({ length: MAX_LINES + 10 }, (_, i) => `satır ${i}`).join('\n');
    const summary = diffLines(long, long);
    expect(summary.truncated).toBe(true);
    expect(summary.rows).toHaveLength(MAX_LINES);
  });

  describe('gerçek bir view değişikliği', () => {
    const before = [
      'create or replace view vw_rapor as',
      'select r.rapor_id,',
      '       r.kitap_id',
      '  from siparis r',
      ' where r.kanal_id = 12',
    ].join('\n');

    const after = [
      'create or replace view vw_rapor as',
      'select r.rapor_id,',
      '       r.kitap_id,',
      '       r.rapor_tarihi',
      '  from siparis r',
      ' where r.kanal_id = 12',
      '   and nvl(r.iptal, 0) = 0',
    ].join('\n');

    it('yalnızca gerçek değişiklikleri işaretler', () => {
      const summary = diffLines(before, after);
      expect(summary.unchanged).toBe(4);
      expect(summary.added).toBe(3);
      expect(summary.removed).toBe(1);
    });
  });
});

describe('satır içi vurgu', () => {
  it('eşleşen sil/ekle çiftinde kelime farkı işaretlenir', () => {
    const rows = diffLines('where kanal_id = 12', 'where kanal_id = 20').rows;
    const removed = rows.find((row) => row.op === 'delete');
    const added = rows.find((row) => row.op === 'insert');

    expect(removed?.parts?.filter((part) => part.changed).map((p) => p.text)).toEqual(['12']);
    expect(added?.parts?.filter((part) => part.changed).map((p) => p.text)).toEqual(['20']);
    // Değişmeyen kısım her iki tarafta da aynı.
    expect(removed?.parts?.filter((p) => !p.changed).map((p) => p.text).join('')).toBe('where kanal_id = ');
  });

  it('blok uzunlukları farklı olsa da benzeyen çift eşleşir', () => {
    // Gerçek bir view değişikliğinin tipik şekli: 1 satır değişir, 1 eklenir.
    const rows = diffLines(
      ' where r.kanal_id = 12',
      ' where r.kanal_id = 20\n   and nvl(r.iptal, 0) = 0',
    ).rows;

    const removed = rows.find((row) => row.op === 'delete');
    expect(removed?.parts?.filter((p) => p.changed).map((p) => p.text)).toEqual(['12']);
    // Fazladan eklenen satır eşleşmez, vurgusuz kalır.
    const extra = rows.findLast((row) => row.op === 'insert');
    expect(extra?.parts).toBeUndefined();
  });

  it('benzemeyen satırlar eşleştirilmez', () => {
    // Alakasız iki satırı baştan sona renklendirmek, hiç vurgulamamaktan kötü.
    const rows = diffLines('select a from t', 'drop table x').rows;
    expect(rows.filter((row) => row.parts !== undefined)).toHaveLength(0);
  });

  it('eşit uzunluktaki blokta her satır sırayla eşleşir', () => {
    const rows = diffLines('and a = 1\nand b = 1', 'and a = 2\nand b = 2').rows;
    expect(rows.filter((row) => row.parts !== undefined)).toHaveLength(4);
  });
});

describe('diffWords', () => {
  it('değişmeyen kelimeleri işaretlemez', () => {
    const { left, right } = diffWords('select a from t', 'select b from t');
    expect(left?.filter((p) => p.changed).map((p) => p.text)).toEqual(['a']);
    expect(right?.filter((p) => p.changed).map((p) => p.text)).toEqual(['b']);
  });

  it('parçalar birleştirilince orijinal satırı verir', () => {
    const before = 'and nvl(r.iptal, 0) = 0';
    const after = 'and nvl(r.iptal, 0) = 1';
    const { left, right } = diffWords(before, after);
    expect(left?.map((p) => p.text).join('')).toBe(before);
    expect(right?.map((p) => p.text).join('')).toBe(after);
  });

  it('boşluk korunur — hizalama bozulmaz', () => {
    const { left } = diffWords('  a', '  b');
    expect(left?.map((p) => p.text).join('')).toBe('  a');
  });
});
