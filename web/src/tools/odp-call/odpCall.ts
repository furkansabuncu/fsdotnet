import { err, ok, type ToolResult } from '../types';
import { splitList } from '../../lint/sql';

/**
 * PL/SQL prosedür imzası → ODP.NET çağrı iskeleti.
 *
 * Oracle'da veri döndüren prosedür sonucu `SYS_REFCURSOR` OUT parametresi
 * olarak veriyor, yani SQL Server'daki gibi `ExecuteReader` demek işe
 * yaramıyor. Üstelik dört ayrı tuzak var ve dördü de derleme değil ÇALIŞMA
 * anında, çoğu zaman da yalnızca belirli verilerle patlıyor:
 *
 *   1. `BindByName` varsayılan olarak FALSE — parametreler isme değil
 *      SIRAYA göre bağlanıyor.
 *   2. OUT `VARCHAR2`ye `Size` verilmezse `ORA-06502: buffer too small`.
 *   3. Ref cursor `ExecuteNonQuery`den SONRA parametre değerinden okunuyor.
 *   4. `NUMBER`ın hangi .NET tipine düşeceği imzada yazmıyor.
 */

export type Direction = 'Input' | 'Output' | 'InputOutput';

export interface Parameter {
  name: string;
  oracleType: string;
  direction: Direction;
  /** ODP.NET numaralandırma değeri. */
  dbType: string;
  /** OUT metin parametreleri için zorunlu tampon boyutu. */
  size?: number;
  isRefCursor: boolean;
}

export interface OdpWarning {
  key: 'bindByName' | 'outSize' | 'refCursor' | 'booleanUnsupported' | 'unknownType' | 'noParameters';
  detail?: string;
}

export interface OdpResult {
  routine: string;
  isFunction: boolean;
  parameters: Parameter[];
  warnings: OdpWarning[];
  code: string;
}

const HEADER =
  /\b(PROCEDURE|FUNCTION)\s+(?:(?:"[^"\n]*"|[\w$#]+)\.)?("[^"\n]*"|[\w$#]+)\s*(?:\(([\s\S]*?)\)\s*)?(?:RETURN\b|IS\b|AS\b|;|$)/i;

/*
 * `ad [IN|OUT|IN OUT] TIP`. Varsayılan değer ÖNCEDEN kesiliyor, kalıbın
 * içinde değil: tip grubu o zaman açgözlü kalabiliyor. Tembel yazılsaydı
 * hemen pes eder ve `NUMBER` tipi `N` olarak okunurdu.
 *
 * `\b` şart: onsuz `INTERVAL DAY TO SECOND` tipindeki baştaki `IN` yön
 * sanılıyor ve geriye `TERVAL DAY TO SECOND` kalıyor.
 */
const PARAMETER = /^("[^"\n]*"|[\w$#]+)\s+(?:(IN\s+OUT|OUT|IN)\b\s*)?([\s\S]+)$/i;

/** `:=` ya da `DEFAULT` sonrası imzanın parçası değil. */
const DEFAULT_VALUE = /\s+(?::=|DEFAULT\b)[\s\S]*$/i;

/** Varsayılan OUT metin tamponu. ODP.NET boyutsuz OUT metni kabul etmiyor. */
const DEFAULT_SIZE = 4000;

/**
 * Oracle tipini `OracleDbType` üyesine eşler.
 *
 * `NUMBER` bilerek `Decimal`e düşüyor, `Int32`ye değil: imzada hassasiyet
 * yazmıyor ve `Int32` seçmek 10 haneli bir anahtarda sessizce taşar.
 * Daralttığınız yerde daraltma sizin kararınız olsun.
 */
function mapDbType(oracleType: string): { dbType: string; warning?: OdpWarning['key'] } {
  const type = oracleType.trim().toUpperCase().replace(/\s+/g, ' ');

  if (/REF\s*CURSOR|SYS_REFCURSOR/.test(type)) return { dbType: 'RefCursor' };
  if (/^NUMBER|^INTEGER$|^INT$|^PLS_INTEGER$|^BINARY_INTEGER$|^DECIMAL|^NUMERIC/.test(type)) {
    return { dbType: 'Decimal' };
  }
  if (/^N?VARCHAR2?|^N?CHAR|^STRING/.test(type)) return { dbType: 'Varchar2' };
  if (/^N?CLOB$/.test(type)) return { dbType: 'Clob' };
  if (type === 'BLOB') return { dbType: 'Blob' };
  if (type.startsWith('RAW')) return { dbType: 'Raw' };
  if (type === 'DATE') return { dbType: 'Date' };
  if (type.startsWith('TIMESTAMP')) {
    return { dbType: type.includes('TIME ZONE') ? 'TimeStampTZ' : 'TimeStamp' };
  }
  if (type === 'BINARY_FLOAT') return { dbType: 'BinaryFloat' };
  if (type === 'BINARY_DOUBLE') return { dbType: 'BinaryDouble' };
  // PL/SQL BOOLEAN sınır dışında: ODP.NET onu bağlayamıyor.
  if (type === 'BOOLEAN') return { dbType: 'Int32', warning: 'booleanUnsupported' };

  return { dbType: 'Varchar2', warning: 'unknownType' };
}

/** `p_kanal_id` → `pKanalId`; üretilen çağrıda değişken adı olarak geçiyor. */
function toCamelCase(name: string): string {
  const words = name.replace(/"/g, '').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word[0]!.toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');
}

export function generateCall(signature: string): ToolResult<OdpResult> {
  if (signature.trim() === '') return err('odpEmpty');

  const header = HEADER.exec(signature);
  if (header === null) return err('odpNoRoutine');

  const isFunction = (header[1] as string).toUpperCase() === 'FUNCTION';
  const routine = (header[2] as string).replace(/"/g, '');
  const warnings: OdpWarning[] = [];
  const parameters: Parameter[] = [];

  for (const item of splitList(header[3] ?? '')) {
    const match = PARAMETER.exec(item.text.trim().replace(DEFAULT_VALUE, ''));
    if (match === null) continue;

    const name = (match[1] as string).replace(/"/g, '');
    const mode = (match[2] ?? 'IN').toUpperCase().replace(/\s+/g, ' ');
    const oracleType = (match[3] as string).trim();
    const mapped = mapDbType(oracleType);

    const direction: Direction =
      mode === 'OUT' ? 'Output' : mode === 'IN OUT' ? 'InputOutput' : 'Input';
    const isRefCursor = mapped.dbType === 'RefCursor';
    // Metin OUT'una boyut ZORUNLU; girişte gerekmiyor.
    const needsSize = direction !== 'Input' && (mapped.dbType === 'Varchar2' || mapped.dbType === 'Raw');

    if (mapped.warning !== undefined) warnings.push({ key: mapped.warning, detail: `${name}: ${oracleType}` });
    if (needsSize) warnings.push({ key: 'outSize', detail: name });
    if (isRefCursor) warnings.push({ key: 'refCursor', detail: name });

    parameters.push({
      name,
      oracleType,
      direction,
      dbType: mapped.dbType,
      isRefCursor,
      ...(needsSize ? { size: DEFAULT_SIZE } : {}),
    });
  }

  if (parameters.length === 0) warnings.push({ key: 'noParameters' });
  else warnings.unshift({ key: 'bindByName' });

  return ok({ routine, isFunction, parameters, warnings, code: render(routine, parameters) });
}

function render(routine: string, parameters: readonly Parameter[]): string {
  const lines = [
    'using var connection = new OracleConnection(connectionString);',
    `using var command = new OracleCommand("${routine.toUpperCase()}", connection)`,
    '{',
    '    CommandType = CommandType.StoredProcedure,',
    '    // Varsayılan false: parametreler isme değil SIRAYA göre bağlanır.',
    '    BindByName = true,',
    '};',
    '',
  ];

  for (const parameter of parameters) {
    const args = [`"${parameter.name}"`, `OracleDbType.${parameter.dbType}`];
    // Boyutlu aşırı yükleme araya `value` de istiyor; null geçilip değer
    // sonra atanıyor.
    if (parameter.size !== undefined) args.push(String(parameter.size), 'null');
    args.push(`ParameterDirection.${parameter.direction}`);

    const call = `command.Parameters.Add(${args.join(', ')})`;
    lines.push(
      parameter.direction === 'Output'
        ? `${call};`
        : `${call}.Value = ${toCamelCase(parameter.name)};`,
    );
  }

  lines.push(
    '',
    'await connection.OpenAsync(cancellationToken);',
    '// ExecuteReader DEĞİL: sonuç ref cursor parametresinden okunuyor.',
    'await command.ExecuteNonQueryAsync(cancellationToken);',
  );

  const cursor = parameters.find((parameter) => parameter.isRefCursor);
  if (cursor !== undefined) {
    lines.push(
      '',
      `var cursor = (OracleRefCursor)command.Parameters["${cursor.name}"].Value;`,
      'using var reader = cursor.GetDataReader();',
      '',
      'while (await reader.ReadAsync(cancellationToken))',
      '{',
      '    // reader.GetString(0), reader.GetDecimal(1) …',
      '}',
    );
  }

  const scalars = parameters.filter(
    (parameter) => parameter.direction !== 'Input' && !parameter.isRefCursor,
  );
  if (scalars.length > 0) {
    lines.push('');
    for (const parameter of scalars) {
      lines.push(
        `var ${toCamelCase(parameter.name)} = command.Parameters["${parameter.name}"].Value?.ToString();`,
      );
    }
  }

  return lines.join('\n');
}
