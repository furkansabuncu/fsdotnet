import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { generateCall } from './odpCall';

const SAMPLE = [
  'CREATE OR REPLACE PROCEDURE PRC_SIPARIS_LISTE (',
  '  p_kanal_id   IN  NUMBER,',
  '  p_bas_tarih  IN  DATE,',
  '  p_aciklama   OUT VARCHAR2,',
  '  p_sonuc      OUT SYS_REFCURSOR',
  ') IS',
].join('\n');

export default function OdpCallTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);

  const generated = generateCall(input);
  const result: ToolResult<string> = generated.ok ? ok(generated.value.code) : generated;
  const warnings = generated.ok ? generated.value.warnings : [];

  return (
    <div className="flex flex-col gap-3">
      <ConverterShell
        input={input}
        onInputChange={setInput}
        result={result}
        inputLabel={t.odpCall.input}
        outputLabel={t.odpCall.output}
        placeholder={t.odpCall.placeholder}
        toolbar={
          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            {t.odpCall.sample}
          </button>
        }
      />

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {warnings.map((warning) => (
            <li
              key={`${warning.key}:${warning.detail ?? ''}`}
              className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface p-2.5 text-xs leading-5 text-muted"
            >
              <AlertTriangle size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
              <span>
                {t.odpCall.warnings[warning.key]}
                {/* Parametre ve tip adı çevrilmez — imzadan geliyor. */}
                {warning.detail !== undefined && (
                  <code className="ml-2 font-mono break-all text-warning">{warning.detail}</code>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
