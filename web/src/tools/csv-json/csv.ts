import { err, ok, type ToolResult } from '../types';

export type Delimiter = ',' | ';' | '\t' | '|';

/**
 * RFC 4180 ayrıştırıcısı.
 *
 * `split(',')` ile CSV okumak klasik hatadır: tırnak içindeki ayraç, gömülü
 * satır sonu ve `""` ile kaçırılmış tırnak sessizce veriyi bozar. Excel'in
 * Türkçe yerelinde ayracın noktalı virgül olması da bu yüzden seçilebilir.
 */
export function parseCsv(input: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < input.length) {
    const char = input[i] as string;

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"' && field === '') {
      quoted = true;
      i += 1;
      continue;
    }

    if (char === delimiter) {
      endField();
      i += 1;
      continue;
    }

    if (char === '\r' || char === '\n') {
      endRow();
      // \r\n tek satır sonudur.
      i += char === '\r' && input[i + 1] === '\n' ? 2 : 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // Dosya satır sonuyla bitiyorsa sondaki boş satırı sayma.
  if (field !== '' || row.length > 0) endRow();

  return rows;
}

/** Sayı gibi görünen değerler JSON'da sayı, SQL'de tırnaksız yazılır. */
function isNumeric(value: string): boolean {
  return value.trim() !== '' && Number.isFinite(Number(value));
}

export interface CsvOptions {
  delimiter: Delimiter;
  /** İlk satır başlık mı — değilse kolonlar col1, col2… olur. */
  headerRow: boolean;
}

export function csvToJson(input: string, options: CsvOptions): ToolResult<string> {
  const rows = parseCsv(input, options.delimiter);
  if (rows.length === 0) return err('csvEmpty');

  const header = options.headerRow
    ? (rows[0] as string[]).map((name, index) => (name.trim() === '' ? `col${index + 1}` : name.trim()))
    : (rows[0] as string[]).map((_, index) => `col${index + 1}`);

  const body = options.headerRow ? rows.slice(1) : rows;
  if (body.length === 0) return err('csvNoRows');

  const objects = body.map((cells) => {
    const record: Record<string, string | number | null> = {};
    header.forEach((name, index) => {
      const cell = cells[index];
      // Eksik hücre null; boş hücre de null — CSV ikisini ayırt etmez.
      record[name] = cell === undefined || cell === '' ? null : isNumeric(cell) ? Number(cell) : cell;
    });
    return record;
  });

  return ok(JSON.stringify(objects, null, 2));
}

/** SQL dize literal'i: tek tırnak ikiye katlanarak kaçırılır. */
function sqlLiteral(value: string): string {
  if (value === '') return 'NULL';
  if (isNumeric(value)) return value.trim();
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * SQL tanımlayıcısı olarak güvenli mi?
 *
 * Değilse çift tırnağa alınır. Oracle'da tırnaklı tanımlayıcı KASA DUYARLIDIR,
 * bu yüzden yalnızca gerektiğinde tırnaklıyoruz — her adı tırnaklamak
 * `"Ad"` ile `AD`'yi farklı kolonlar hâline getirirdi.
 */
function sqlIdentifier(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `"${name.replace(/"/g, '""')}"`;
}

export function csvToInsert(input: string, options: CsvOptions, table: string): ToolResult<string> {
  const rows = parseCsv(input, options.delimiter);
  if (rows.length === 0) return err('csvEmpty');

  const header = options.headerRow
    ? (rows[0] as string[]).map((name, index) => (name.trim() === '' ? `col${index + 1}` : name.trim()))
    : (rows[0] as string[]).map((_, index) => `col${index + 1}`);

  const body = options.headerRow ? rows.slice(1) : rows;
  if (body.length === 0) return err('csvNoRows');

  const target = table.trim() === '' ? 'my_table' : table.trim();
  const columns = header.map(sqlIdentifier).join(', ');

  const statements = body.map((cells) => {
    const values = header.map((_, index) => sqlLiteral(cells[index] ?? '')).join(', ');
    return `INSERT INTO ${sqlIdentifier(target)} (${columns}) VALUES (${values});`;
  });

  return ok(statements.join('\n'));
}
