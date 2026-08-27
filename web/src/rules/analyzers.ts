import { analyze as sqlFix } from '../tools/sql-fix/sqlFix';
import { analyze as linq11g } from '../tools/linq-11g/linq11g';
import { analyze as turkishCulture } from '../tools/turkish-culture/turkishCulture';
import type { ToolResult } from '../tools/types';
import type { Finding } from '../lint/types';
import type { ToolId } from '../tools/types';

/**
 * Kural sayfasının çalıştıracağı çözümleyiciler.
 *
 * Katalogdan AYRI dosya: katalog yalnızca veri ve tip içe aktarımı taşıyor,
 * bu yüzden `sitemap.mjs` onu Node'un tip sıyırmasıyla doğrudan okuyabiliyor.
 * Buraya bir çalışma zamanı içe aktarımı girdiği an bunu yapamazdı.
 */
type Analyzer = (source: string) => ToolResult<readonly Finding[]>;

export const ANALYZERS: Partial<Record<ToolId, Analyzer>> = {
  'sql-fix': sqlFix,
  'linq-11g': linq11g,
  'turkish-culture': turkishCulture,
};
