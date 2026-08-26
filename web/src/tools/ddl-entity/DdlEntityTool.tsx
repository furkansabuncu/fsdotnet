import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { generateEntity } from './ddlEntity';

const SAMPLE = [
  'CREATE TABLE siparis (',
  '  siparis_id      NUMBER(9)      NOT NULL,',
  '  kanal_id        NUMBER(4),',
  '  tutar           NUMBER(12,2)   NOT NULL,',
  '  iptal           NUMBER(1)      DEFAULT 0 NOT NULL,',
  '  aciklama        VARCHAR2(400),',
  '  siparis_tarihi  DATE           NOT NULL,',
  '  ek_dosya        BLOB,',
  '  CONSTRAINT pk_siparis PRIMARY KEY (siparis_id)',
  ')',
].join('\n');

export default function DdlEntityTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [pascalCase, setPascalCase] = useState(true);
  const [numberOneAsBool, setNumberOneAsBool] = useState(true);

  const generated = generateEntity(input, { pascalCase, numberOneAsBool });

  const result: ToolResult<string> = generated.ok
    ? ok(`${generated.value.entity}\n\n${generated.value.configuration}`)
    : generated;
  const warnings = generated.ok ? generated.value.warnings : [];

  const toggle = (label: string, value: boolean, onChange: (next: boolean) => void) => (
    <label className="flex items-center gap-1.5 text-xs text-subtle">
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 accent-[var(--cat)]"
      />
      {label}
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      <ConverterShell
        input={input}
        onInputChange={setInput}
        result={result}
        inputLabel={t.ddlEntity.input}
        outputLabel={t.ddlEntity.output}
        placeholder={t.ddlEntity.placeholder}
        toolbar={
          <>
            {toggle(t.ddlEntity.pascalCase, pascalCase, setPascalCase)}
            {toggle(t.ddlEntity.numberOneAsBool, numberOneAsBool, setNumberOneAsBool)}

            <button
              type="button"
              onClick={() => setInput(SAMPLE)}
              className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              {t.ddlEntity.sample}
            </button>
          </>
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
                {t.ddlEntity.warnings[warning.key]}
                {/* Kolon ve tip adı çevrilmez — DDL'den geliyor. */}
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
