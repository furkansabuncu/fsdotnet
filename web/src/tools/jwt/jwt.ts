import { err, ok, type ToolResult } from '../types';

export interface JwtClaim {
  name: 'iat' | 'exp' | 'nbf';
  date: Date;
  /** `exp` için geçmişte, `nbf` için gelecekte olmak sorunludur. */
  problem: boolean;
}

export interface DecodedJwt {
  header: string;
  payload: string;
  signature: string;
  algorithm: string;
  claims: JwtClaim[];
  /** İmza var mı — `alg: none` token'ları burada yakalanır. */
  signed: boolean;
}

/**
 * Base64url → metin.
 *
 * JWT, RFC 4648 §5 alfabesini kullanır (`-_`, dolgusuz). Kendi çözücümüzü
 * yazmak yerine standart alfabeye çevirip `atob`'a veriyoruz.
 */
function decodeSegment(segment: string): string | null {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    // JWT payload'u UTF-8'dir; latin1 okumak Türkçe adları bozar.
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function claimDate(payload: Record<string, unknown>, name: JwtClaim['name']): Date | null {
  const value = payload[name];
  // NumericDate: epoch'tan SANİYE (milisaniye değil) — yaygın bir hata kaynağı.
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Bir JWT'yi çözer. İMZA DOĞRULAMAZ — yalnızca okur.
 *
 * Doğrulama gizli anahtar gerektirir; anahtarı bir web sayfasına yapıştırmak
 * doğru bir alışkanlık değil, o yüzden bilerek kapsam dışı (ADR-0001).
 */
export function decodeJwt(token: string): ToolResult<DecodedJwt> {
  const trimmed = token.trim();
  if (trimmed === '') return err('jwtEmpty');

  const parts = trimmed.split('.');
  if (parts.length !== 3) return err('jwtShape');

  const [rawHeader, rawPayload, signature] = parts as [string, string, string];

  const headerText = decodeSegment(rawHeader);
  const payloadText = decodeSegment(rawPayload);
  if (headerText === null || payloadText === null) return err('jwtSegment');

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(headerText) as Record<string, unknown>;
    payload = JSON.parse(payloadText) as Record<string, unknown>;
  } catch {
    return err('jwtJson');
  }

  const now = Date.now();
  const claims: JwtClaim[] = [];

  const iat = claimDate(payload, 'iat');
  if (iat) claims.push({ name: 'iat', date: iat, problem: false });

  const nbf = claimDate(payload, 'nbf');
  if (nbf) claims.push({ name: 'nbf', date: nbf, problem: nbf.getTime() > now });

  const exp = claimDate(payload, 'exp');
  if (exp) claims.push({ name: 'exp', date: exp, problem: exp.getTime() < now });

  const algorithm = typeof header['alg'] === 'string' ? header['alg'] : '?';

  return ok({
    header: JSON.stringify(header, null, 2),
    payload: JSON.stringify(payload, null, 2),
    signature,
    algorithm,
    claims,
    signed: signature !== '' && algorithm.toLowerCase() !== 'none',
  });
}
