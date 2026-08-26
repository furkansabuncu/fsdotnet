import type { ToolId } from './types';

/**
 * Hata kodundan onu çözen araca eşleme.
 *
 * İki yerde kullanılıyor ve ikisi de aynı soruyu soruyor: "bu hatayı
 * gördüm, ne yapacağım?" — `ora-errors` listesindeki her satırın yanında
 * bir bağlantı olarak, ana sayfada ise yapıştırılan metni doğru araca
 * yönlendirmek için.
 *
 * Kod DEĞİL, kalıp tutuluyor: kullanıcı `ORA-00911` de yapıştırabilir,
 * `CS0854` de, bozuk bir Türkçe metin de. Eşleşen ilk kural kazanıyor,
 * yani sıra önem taşıyor — dar kalıplar yukarıda.
 */

export interface ErrorRoute {
  /** Girdide aranan kalıp. */
  pattern: RegExp;
  tool: ToolId;
  /** Neden bu araç — çevrilir, sözlükte `errorRoutes` altında. */
  reason: RouteReason;
}

export type RouteReason =
  | 'invalidCharacter'
  | 'identifierTooLong'
  | 'inListLimit'
  | 'notGroupBy'
  | 'groupFunction'
  | 'missingKeyword'
  | 'invalidIdentifier'
  | 'invalidNumber'
  | 'bufferTooSmall'
  | 'stringTooLong'
  | 'expressionTree'
  | 'mojibake'
  | 'bindPlaceholders'
  | 'delphiSource'
  | 'jwtToken'
  | 'sqlText';

/* Oracle kodları. Sıfır dolgusu isteğe bağlı: log bazen `ORA-1795`
   bazen `ORA-01795` basıyor. */
const ora = (code: number, tool: ToolId, reason: RouteReason): ErrorRoute => ({
  pattern: new RegExp(String.raw`\bORA-0*${code}\b`, 'i'),
  tool,
  reason,
});

export const ERROR_ROUTES: readonly ErrorRoute[] = [
  ora(911, 'sql-fix', 'invalidCharacter'),
  ora(972, 'oracle-identity', 'identifierTooLong'),
  ora(1795, 'in-list', 'inListLimit'),
  ora(979, 'sql-fix', 'notGroupBy'),
  ora(934, 'sql-fix', 'groupFunction'),
  ora(905, 'sql-fix', 'missingKeyword'),
  ora(933, 'sql-fix', 'missingKeyword'),
  ora(936, 'sql-fix', 'missingKeyword'),
  ora(904, 'sql-fix', 'invalidIdentifier'),
  ora(1722, 'ora-errors', 'invalidNumber'),
  ora(6502, 'ora-errors', 'bufferTooSmall'),
  ora(1489, 'sql-fix', 'stringTooLong'),

  // Derleyici hatası: ifade ağacı kısıtı.
  { pattern: /\bCS0854\b/i, tool: 'linq-11g', reason: 'expressionTree' },

  /* Bozuk kodlama. Kalıp, UTF-8'in Windows-1252 olarak okunmasında ortaya
     çıkan öncü baytlar — bunlar bir arada yalnızca mojibake'te görülür. */
  { pattern: /[ÃÄÅ][-¿‘-‟¼½¾§©®°±·]/, tool: 'mojibake', reason: 'mojibake' },

  // Delphi kaynağından yapıştırılmış string ifadesi.
  { pattern: /'\s*\+\s*'/, tool: 'pas-sql', reason: 'delphiSource' },

  // Üç noktalı base64url — JWT.
  { pattern: /\beyJ[\w-]+\.[\w-]+\.[\w-]*/, tool: 'jwt', reason: 'jwtToken' },

  /* Loglanmış sorgu: bağlama yer tutucuları var. `sqlText`ten ÖNCE
     denenmeli, ikisi de eşleşiyor ve bu daha bilgilendirici. */
  { pattern: /:\w+.*\bfrom\b|\bfrom\b.*:\w+/is, tool: 'bind-params', reason: 'bindPlaceholders' },

  // Genel SQL: bir yan tümce görülüyorsa denetleyiciye gitsin.
  { pattern: /\bselect\b[\s\S]*\bfrom\b/i, tool: 'sql-fix', reason: 'sqlText' },
];

/** Girdiye uyan ilk yönlendirme; yoksa null. */
export function routeError(input: string): ErrorRoute | null {
  const text = input.trim();
  if (text === '') return null;
  return ERROR_ROUTES.find((route) => route.pattern.test(text)) ?? null;
}

/** Bir ORA kodunu çözen araç — hata listesindeki satır bağlantısı için. */
export function toolForOraCode(code: number): ErrorRoute | null {
  return ERROR_ROUTES.find((route) => route.pattern.test(`ORA-${String(code).padStart(5, '0')}`)) ?? null;
}
