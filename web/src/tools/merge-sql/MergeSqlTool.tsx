import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { generateMerge } from './mergeSql';

export default function MergeSqlTool() {
  const { t } = useI18n();
  const [table, setTable] = useState('siparis');
  const [keys, setKeys] = useState('siparis_id');
  const [columns, setColumns] = useState('kanal_id, tutar, aciklama');
  const [update, setUpdate] = useState(true);

  const generated = generateMerge({ table, keys, columns, update, bindPrefix: ':' });
  const result: ToolResult<string> = generated.ok ? ok(generated.value.sql) : generated;
  const warnings = generated.ok ? generated.value.warnings : [];

  const field = (label: string, value: string, onChange: (next: string) => void) => (
    <label className="flex items-center gap-1.5 text-xs text-subtle">
      {label}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 w-40 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Girdi kutusu güncellenecek kolonları taşıyor: liste uzayabildiği
          için tek satırlık bir alan yetmiyor. Tablo ve anahtar kısa. */}
      <ConverterShell
        input={columns}
        onInputChange={setColumns}
        result={result}
        inputLabel={t.mergeSql.columns}
        outputLabel={t.mergeSql.output}
        placeholder={t.mergeSql.placeholder}
        toolbar={
          <>
            {field(t.mergeSql.table, table, setTable)}
            {field(t.mergeSql.keys, keys, setKeys)}

            <label className="flex items-center gap-1.5 text-xs text-subtle">
              <input
                type="checkbox"
                checked={update}
                onChange={(event) => setUpdate(event.target.checked)}
                className="size-3.5 accent-[var(--cat)]"
              />
              {t.mergeSql.withUpdate}
            </label>
          </>
        }
      />

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {warnings.map((key) => (
            <li
              key={key}
              className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface p-2.5 text-xs leading-5 text-muted"
            >
              <AlertTriangle size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
              {t.mergeSql.warnings[key]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
