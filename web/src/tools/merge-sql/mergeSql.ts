import { err, ok, type ToolResult } from '../types';
import { splitList } from '../../lint/sql';

/**
 * Oracle `MERGE` (upsert) üretir.
 *
 * Elle yazması sıkıcı ve iki yeri herkes yanlış hatırlıyor: kaynak tarafı
 * bir TABLO olmak zorunda (`USING (SELECT … FROM dual) src`), ve `UPDATE`
 * yan tümcesinde ANAHTAR kolonlarına dokunulamıyor — `ORA-38104: columns
 * referenced in the ON clause cannot be updated`.
 *
 * Girdi kolon listesi, çıktı çalıştırılabilir bir ifade. Şema erişimi yok;
 * tip bilgisi de gerekmiyor, çünkü değerler bağlama değişkeni olarak
 * geçiyor.
 */

export interface MergeOptions {
  table: string;
  /** Eşleştirme kolonları — virgülle ayrılmış. */
  keys: string;
  /** Güncellenecek/eklenecek kolonlar — virgülle ayrılmış. */
  columns: string;
  /** Kapalıyken yalnızca ekleme yapılır (`WHEN NOT MATCHED`). */
  update: boolean;
  /** Bağlama değişkeni öneki: `:` Oracle, `@` SQL Server alışkanlığı. */
  bindPrefix: string;
}

export interface MergeResult {
  sql: string;
  keys: string[];
  columns: string[];
  warnings: ('keyInUpdate' | 'noColumns' | 'insertOnly')[];
}

const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_$#]*$/;

const names = (text: string): string[] =>
  splitList(text)
    .map((item) => item.text.trim())
    .filter((item) => item !== '');

export function generateMerge(options: MergeOptions): ToolResult<MergeResult> {
  const table = options.table.trim().toUpperCase();
  const keys = names(options.keys).map((key) => key.toUpperCase());
  if (table === '' || keys.length === 0) return err('mergeEmpty');
  if (!IDENTIFIER.test(table)) return err('mergeBadName', table);

  const keySet = new Set(keys);
  const all = names(options.columns).map((column) => column.toUpperCase());
  const warnings: MergeResult['warnings'] = [];

  /* Anahtar kolonları güncelleme listesinden ÇIKARILIYOR: `ON` yan
     tümcesinde geçen bir kolonu güncellemek ORA-38104 veriyor. Sessizce
     atmak yerine bildiriyoruz — kullanıcı onları oraya bilerek yazmış
     olabilir. */
  const updatable = all.filter((column) => !keySet.has(column));
  if (updatable.length < all.length) warnings.push('keyInUpdate');
  if (all.length === 0) warnings.push('noColumns');
  if (!options.update) warnings.push('insertOnly');

  const bind = (column: string) => `${options.bindPrefix}${column.toLowerCase()}`;
  const inserted = [...keys, ...updatable];

  const source = inserted.map((column) => `${bind(column)} AS ${column}`).join(', ');
  const on = keys.map((key) => `tgt.${key} = src.${key}`).join(' AND ');

  const lines = [
    `MERGE INTO ${table} tgt`,
    `USING (SELECT ${source} FROM dual) src`,
    `   ON (${on})`,
  ];

  if (options.update && updatable.length > 0) {
    lines.push('WHEN MATCHED THEN UPDATE SET');
    lines.push(updatable.map((column) => `       tgt.${column} = src.${column}`).join(',\n'));
  }

  lines.push(
    'WHEN NOT MATCHED THEN INSERT (',
    inserted.map((column) => `       ${column}`).join(',\n'),
    '     ) VALUES (',
    inserted.map((column) => `       src.${column}`).join(',\n'),
    '     );',
  );

  return ok({ sql: lines.join('\n'), keys, columns: updatable, warnings });
}
