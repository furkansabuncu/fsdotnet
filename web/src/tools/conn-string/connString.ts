import { err, ok, type ToolResult } from '../types';

/**
 * Oracle bağlantı dizesini çözer, kurar ve maskeler.
 *
 * `Data Source` iki tamamen farklı biçim kabul ediyor ve ikisi de aynı
 * anahtarın değeri olarak yazılıyor:
 *
 *   - **Easy Connect** — `sunucu:1521/servis`. Kısa, `tnsnames.ora`
 *     gerektirmiyor.
 *   - **TNS tanımlayıcı** — `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)…))`.
 *     Uzun, ama yük dengeleme ve yedek adres taşıyabiliyor.
 *
 * Üçüncü bir olasılık daha var: `Data Source` yalnızca bir TNS ADI olabilir
 * ve o zaman değer `tnsnames.ora` dosyasında aranıyor — yani bağlantı
 * dizesi tek başına nereye bağlandığınızı söylemiyor. Araç bu üç durumu
 * ayırt ediyor, çünkü "neden bağlanamıyorum" sorusunun cevabı çoğu zaman
 * burada.
 */

export type SourceKind = 'easyConnect' | 'descriptor' | 'tnsAlias' | 'unknown';

export interface ConnectionField {
  key: string;
  value: string;
  /** Şifre gibi, paylaşılırken gizlenmesi gereken alan. */
  secret: boolean;
}

export interface ConnectionInfo {
  fields: ConnectionField[];
  kind: SourceKind;
  /** Easy Connect ya da tanımlayıcıdan çıkarılabilenler. */
  host?: string;
  port?: string;
  service?: string;
  /** Şifresi gizlenmiş, paylaşılabilir hâli. */
  redacted: string;
  /** Normalleştirilmiş, tek satırlık hâli. */
  normalised: string;
  warnings: ConnWarningKey[];
}

export type ConnWarningKey =
  | 'tnsAlias'
  | 'plainPassword'
  | 'noPassword'
  | 'unknownSource'
  | 'poolingOff'
  | 'integratedSecurity';

/** Değeri gizlenecek anahtarlar — karşılaştırma küçük harf üzerinden. */
const SECRET_KEYS = new Set(['password', 'pwd', 'proxy password', 'wallet_location', 'dba privilege']);

/**
 * `Key=Value;` çiftlerine böler.
 *
 * Naif bir `split(';')` TNS tanımlayıcısını parçalar — orada noktalı
 * virgül yok ama parantez var ve değer birden çok `=` içeriyor. Bu yüzden
 * parantez derinliği izleniyor ve yalnızca İLK `=` ayraç sayılıyor.
 */
function splitPairs(input: string): ConnectionField[] {
  const fields: ConnectionField[] = [];
  let depth = 0;
  let start = 0;

  const push = (end: number) => {
    const piece = input.slice(start, end).trim();
    if (piece === '') return;

    const equals = piece.indexOf('=');
    if (equals === -1) return;

    const key = piece.slice(0, equals).trim();
    fields.push({
      key,
      value: piece.slice(equals + 1).trim(),
      secret: SECRET_KEYS.has(key.toLowerCase()),
    });
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ';' && depth === 0) {
      push(index);
      start = index + 1;
    }
  }
  push(input.length);
  return fields;
}

const EASY_CONNECT = /^(?:\/\/)?([\w.-]+)(?::(\d+))?(?:\/([\w.$-]+))?$/;
const DESCRIPTOR_HOST = /\bHOST\s*=\s*([^)\s]+)/i;
const DESCRIPTOR_PORT = /\bPORT\s*=\s*(\d+)/i;
const DESCRIPTOR_SERVICE = /\b(?:SERVICE_NAME|SID)\s*=\s*([^)\s]+)/i;

function classify(source: string): { kind: SourceKind; host?: string; port?: string; service?: string } {
  const value = source.trim();
  if (value === '') return { kind: 'unknown' };

  if (value.startsWith('(')) {
    return {
      kind: 'descriptor',
      ...(DESCRIPTOR_HOST.exec(value)?.[1] === undefined ? {} : { host: DESCRIPTOR_HOST.exec(value)![1] }),
      ...(DESCRIPTOR_PORT.exec(value)?.[1] === undefined ? {} : { port: DESCRIPTOR_PORT.exec(value)![1] }),
      ...(DESCRIPTOR_SERVICE.exec(value)?.[1] === undefined
        ? {}
        : { service: DESCRIPTOR_SERVICE.exec(value)![1] }),
    };
  }

  const easy = EASY_CONNECT.exec(value);
  if (easy !== null) {
    // Yalnızca bir ad varsa (port ve servis yok) bu bir TNS takma adıdır:
    // adres bilgisi bu dizede DEĞİL, tnsnames.ora dosyasında.
    if (easy[2] === undefined && easy[3] === undefined) return { kind: 'tnsAlias', host: easy[1] as string };

    return {
      kind: 'easyConnect',
      host: easy[1] as string,
      port: easy[2] ?? '1521',
      ...(easy[3] === undefined ? {} : { service: easy[3] }),
    };
  }

  return { kind: 'unknown' };
}

export function parseConnectionString(input: string): ToolResult<ConnectionInfo> {
  if (input.trim() === '') return err('connEmpty');

  const fields = splitPairs(input);
  if (fields.length === 0) return err('connNoPairs');

  const find = (name: string) =>
    fields.find((field) => field.key.toLowerCase() === name)?.value ?? '';

  const source = find('data source') || find('dsn');
  const classified = classify(source);
  const warnings: ConnWarningKey[] = [];

  if (classified.kind === 'tnsAlias') warnings.push('tnsAlias');
  if (classified.kind === 'unknown') warnings.push('unknownSource');
  if (fields.some((field) => field.secret && field.value !== '')) warnings.push('plainPassword');
  else if (find('integrated security').toLowerCase() !== 'yes') warnings.push('noPassword');
  if (find('integrated security').toLowerCase() === 'yes') warnings.push('integratedSecurity');
  if (find('pooling').toLowerCase() === 'false') warnings.push('poolingOff');

  const render = (mask: boolean) =>
    fields
      .map((field) => `${field.key}=${mask && field.secret ? '********' : field.value}`)
      .join(';');

  return ok({
    fields,
    kind: classified.kind,
    ...(classified.host === undefined ? {} : { host: classified.host }),
    ...(classified.port === undefined ? {} : { port: classified.port }),
    ...(classified.service === undefined ? {} : { service: classified.service }),
    redacted: render(true),
    normalised: render(false),
    warnings,
  });
}

export interface BuildOptions {
  host: string;
  port: string;
  service: string;
  user: string;
  password: string;
  /** Açıkken TNS tanımlayıcısı, kapalıyken Easy Connect. */
  descriptor: boolean;
}

/**
 * Alanlardan bağlantı dizesi kurar.
 *
 * Tanımlayıcı biçimi tek satırda yazılıyor: `.NET` yapılandırma
 * dosyalarında satır sonu taşıyan bir değer çoğu okuyucuda bozuluyor.
 */
export function buildConnectionString(options: BuildOptions): string {
  const port = options.port.trim() === '' ? '1521' : options.port.trim();
  const source = options.descriptor
    ? `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${options.host})(PORT=${port}))` +
      `(CONNECT_DATA=(SERVICE_NAME=${options.service})))`
    : `${options.host}:${port}/${options.service}`;

  return `User Id=${options.user};Password=${options.password};Data Source=${source}`;
}
