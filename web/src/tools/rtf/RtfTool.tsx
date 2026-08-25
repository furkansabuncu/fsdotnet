import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { SUPPORTED_CODEPAGES, rtfToText } from './rtf';

/**
 * Boş kutu bırakma ilkesi: araç gerçekçi bir örnekle açılır.
 *
 * Örnek sentetik ama biçimi gerçek — Delphi/DevExpress'in ürettiği RTF gibi
 * `\ansicpg1254` bildiriyor ve Türkçe harfleri `\'fd` gibi tek byte yazıyor.
 * Aracın asıl var oluş sebebi bu: kod sayfasını yok sayan bir okuyucu
 * "Tanı" yerine "Taný" üretir.
 */
const SAMPLE = String.raw`{\rtf1\ansi\ansicpg1254\deff0{\fonttbl{\f0\fnil\fcharset162 Tahoma;}}
{\*\generator Riched20 10.0}\viewkind4\uc1
\pard\b\f0\fs20 MUAYENE NOTU\b0\par
Tan\'fd: G\'f6\'f0\'fcs a\'f0r\'fds\'fd\par
\'d6neri: Kontrol \'e7ekimi yap\'fdls\'fdn.\par
}`;

type Selection = 'auto' | number;

export default function RtfTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [selection, setSelection] = useState<Selection>('auto');

  const parsed = rtfToText(input, selection === 'auto' ? undefined : selection);

  // ConverterShell metin bekliyor; rapor alanları araç çubuğunda gösteriliyor.
  const result: ToolResult<string> = parsed.ok ? ok(parsed.value.text) : parsed;

  let status: string | null = null;
  if (parsed.ok) {
    const { codepage, declared } = parsed.value;
    if (selection !== 'auto') status = t.rtf.forced(codepage);
    else if (declared) status = t.rtf.detected(codepage);
    else status = t.rtf.fallback(codepage);
  }

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={t.rtf.document}
      outputLabel={t.rtf.plainText}
      placeholder={t.rtf.placeholder}
      toolbar={
        <>
          <select
            aria-label={t.rtf.codepageAria}
            value={selection}
            onChange={(event) => {
              const { value } = event.target;
              setSelection(value === 'auto' ? 'auto' : Number(value));
            }}
            className="h-7 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-muted transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
          >
            <option value="auto">{t.rtf.auto}</option>
            {SUPPORTED_CODEPAGES.map((codepage) => (
              <option key={codepage} value={codepage}>
                cp{codepage}
              </option>
            ))}
          </select>

          {status && (
            <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
              {status}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setInput(SAMPLE);
              setSelection('auto');
            }}
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <RotateCcw size={12} aria-hidden="true" />
            {t.rtf.example}
          </button>
        </>
      }
    />
  );
}
