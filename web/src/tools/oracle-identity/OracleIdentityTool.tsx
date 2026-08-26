import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { VERSIONS, generateIdentity, type OracleVersion } from './oracleIdentity';

/**
 * Girdi bir metin değil birkaç alan, ama çıktı yine tek bir betik — bu
 * yüzden `ConverterShell`in yalnızca çıktı tarafı kullanılıyor: girdi
 * kutusu tablo adını taşıyor, alanların geri kalanı araç çubuğunda.
 */
export default function OracleIdentityTool() {
  const { t } = useI18n();
  const [table, setTable] = useState('siparis');
  const [column, setColumn] = useState('siparis_id');
  const [version, setVersion] = useState<OracleVersion>('11g');
  const [startWith, setStartWith] = useState('1');
  const [allowExplicit, setAllowExplicit] = useState(true);

  const generated = generateIdentity({
    table,
    column,
    version,
    // Boş ya da bozuk giriş 1'e düşüyor: alan yazılırken bir an boş kalıyor
    // ve o anda NaN üretmek çıktıyı bozardı.
    startWith: Number.parseInt(startWith, 10) || 1,
    allowExplicit,
  });

  const result: ToolResult<string> = generated.ok ? ok(generated.value.sql) : generated;
  const warnings = generated.ok ? generated.value.warnings : [];

  const field = (id: string, label: string, value: string, onChange: (next: string) => void, width: string) => (
    <label className="flex items-center gap-1.5 text-xs text-subtle">
      {label}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-7 ${width} rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none`}
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      <ConverterShell
        input={table}
        onInputChange={setTable}
        result={result}
        inputLabel={t.oracleIdentity.table}
        outputLabel={t.oracleIdentity.output}
        placeholder={t.oracleIdentity.placeholder}
        toolbar={
          <>
            <SegmentedControl
              ariaLabel={t.oracleIdentity.versionAria}
              value={version}
              onChange={setVersion}
              options={VERSIONS.map((value) => ({ value, label: value }))}
            />

            {field('identity-column', t.oracleIdentity.column, column, setColumn, 'w-40')}
            {field('identity-start', t.oracleIdentity.startWith, startWith, setStartWith, 'w-20')}

            <label className="flex items-center gap-1.5 text-xs text-subtle">
              <input
                type="checkbox"
                checked={allowExplicit}
                onChange={(event) => setAllowExplicit(event.target.checked)}
                disabled={version === '12c'}
                className="size-3.5 accent-[var(--cat)] disabled:opacity-40"
              />
              {t.oracleIdentity.allowExplicit}
            </label>
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
                {t.oracleIdentity.warnings[warning.key]}
                {/* Ad ve uzunluk çevrilmez — girdiden geliyorlar. */}
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
