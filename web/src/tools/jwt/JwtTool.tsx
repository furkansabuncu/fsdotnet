import { useState } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { decodeJwt } from './jwt';

/**
 * Örnek token. İmzası sahte ve payload'u uydurma — araç imza doğrulamadığı
 * için gerçek bir token'a gerek yok, ve örnek olarak gerçek token koymak
 * kötü bir alışkanlığı normalleştirirdi.
 */
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0IiwiYWQiOiLDlm1lciDDh2VsaWtiYcWfIiwiaWF0IjoxNzg3NTYzODAwLCJleHAiOjE3ODc1Njc0MDB9.' +
  'v3rY_f4k3-S1gnatur3';

export default function JwtTool() {
  const { t, locale } = useI18n();
  const [input, setInput] = useState(SAMPLE);

  const parsed = decodeJwt(input);

  let result: ToolResult<string>;
  if (parsed.ok) {
    const { header, payload, claims } = parsed.value;
    const blocks = [`── ${t.jwt.sectionHeader} ──`, header, '', `── ${t.jwt.sectionPayload} ──`, payload];

    if (claims.length > 0) {
      const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' });
      blocks.push('', `── ${t.jwt.sectionClaims} ──`);
      for (const claim of claims) {
        const note = claim.problem ? `  ← ${claim.name === 'exp' ? t.jwt.expired : t.jwt.notYetValid}` : '';
        blocks.push(`${claim.name.padEnd(4)}${formatter.format(claim.date)}${note}`);
      }
    }

    result = ok(blocks.join('\n'));
  } else {
    result = parsed;
  }

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={t.jwt.token}
      outputLabel={t.jwt.output}
      placeholder={t.jwt.placeholder}
      toolbar={
        <>
          {parsed.ok &&
            (parsed.value.signed ? (
              <span className="rounded bg-surface-2 px-2 py-1 font-mono text-[11px] text-subtle">
                {t.jwt.signatureNote(parsed.value.algorithm)}
              </span>
            ) : (
              /* alg:none gerçek bir saldırı yüzeyi — sessiz geçilmemeli. */
              <span className="flex items-center gap-1.5 rounded bg-warning-bg px-2 py-1 font-mono text-[11px] text-warning">
                <ShieldAlert size={12} aria-hidden="true" />
                {t.jwt.unsigned}
              </span>
            ))}

          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <RotateCcw size={12} aria-hidden="true" />
            {t.jwt.example}
          </button>
        </>
      }
    />
  );
}
