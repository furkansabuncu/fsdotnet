import { postJson } from '../../services/api';
import { err, ok, type ToolResult } from '../types';
import type { RegexFlags, RegexMatch } from './regex';

/** `api/src/Fsdotnet.Api/Features/Regex/RegexEndpoint.cs` ile birebir. */
interface DotnetGroup {
  name: string;
  success: boolean;
  index: number;
  length: number;
  value: string;
}

interface DotnetMatch {
  index: number;
  length: number;
  value: string;
  groups: DotnetGroup[];
}

interface DotnetResponse {
  success: boolean;
  matches: DotnetMatch[];
  error: string | null;
  truncated: boolean;
  elapsedMilliseconds: number;
}

export interface DotnetRunResult {
  matches: RegexMatch[];
  truncated: boolean;
  elapsedMilliseconds: number;
}

/**
 * Deseni gerçek .NET motorunda çalıştırır.
 *
 * API yapılandırılmamış ya da ulaşılamıyorsa `regexServerDown` döner —
 * arayüz o durumda JavaScript sonucunu göstermeye devam eder ve motorun
 * kapalı olduğunu söyler. Statik barındırmada API olmadığı için bu
 * beklenen bir durum, arıza değil.
 */
export async function runDotnetRegex(
  pattern: string,
  flags: RegexFlags,
  input: string,
): Promise<ToolResult<DotnetRunResult>> {
  if (pattern === '') return err('regexEmpty');

  const response = await postJson<DotnetResponse>('/api/v1/regex/test', {
    pattern,
    input,
    options: {
      ignoreCase: flags.ignoreCase,
      multiline: flags.multiline,
      // .NET'te `.`'ın satır sonunu da kapsaması `Singleline`; JS'te `s`.
      singleline: flags.dotAll,
      cultureInvariant: flags.cultureInvariant,
    },
  });

  if (!response.ok) return err('regexServerDown', response.detail);

  const body = response.value;
  if (!body.success) return err('regexInvalid', body.error ?? undefined);

  return ok({
    truncated: body.truncated,
    elapsedMilliseconds: body.elapsedMilliseconds,
    matches: body.matches.map((match) => ({
      index: match.index,
      length: match.length,
      value: match.value,
      groups: match.groups.map((group) => ({
        name: group.name,
        // Eşleşmeyen grup .NET'te boş dize döner; "yakalanmadı" ile "boş
        // yakalandı" ayrımını `success` taşıyor.
        value: group.success ? group.value : null,
        index: group.index,
      })),
    })),
  });
}
