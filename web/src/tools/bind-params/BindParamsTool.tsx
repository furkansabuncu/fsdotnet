import { useState } from 'react';
import { Info, RotateCcw } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { ok } from '../types';
import { extractBinds, substituteBinds, type BindStyle, type BindType, type BindValue } from './bindParams';

const SAMPLE = [
  'select s.siparis_id, s.siparis_tarihi, k.baslik',
  '  from siparis s',
  '  join kitap k on k.kitap_id = s.kitap_id',
  ' where s.kanal_id       = :kanal_id',
  "   and s.siparis_tarihi >= :bas_tarih",
  '   and k.baslik like :baslik_filtre',
  '   and nvl(s.iptal, 0) = 0',
].join('\n');

const SAMPLE_VALUES: Record<string, BindValue> = {
  kanal_id: { type: 'auto', value: '12' },
  bas_tarih: { type: 'auto', value: '2026-08-01' },
  baslik_filtre: { type: 'auto', value: 'Sessiz%' },
};

export default function BindParamsTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [style, setStyle] = useState<BindStyle>('oracle');
  const [values, setValues] = useState<Record<string, BindValue>>(SAMPLE_VALUES);

  const binds = extractBinds(input, style);
  const { sql, missing } = substituteBinds(input, values, style);

  const update = (name: string, patch: Partial<BindValue>) => {
    setValues((current) => ({
      ...current,
      [name]: { type: 'auto', value: '', ...current[name], ...patch },
    }));
  };

  const types: { value: BindType; label: string }[] = [
    { value: 'auto', label: t.bindParams.typeAuto },
    { value: 'number', label: t.bindParams.typeNumber },
    { value: 'text', label: t.bindParams.typeText },
    { value: 'date', label: t.bindParams.typeDate },
    { value: 'null', label: t.bindParams.typeNull },
  ];

  return (
    <div className="flex flex-col gap-3">
      <ConverterShell
        input={input}
        onInputChange={setInput}
        result={ok(sql)}
        inputLabel={t.bindParams.input}
        outputLabel={t.bindParams.output}
        placeholder={t.bindParams.placeholder}
        toolbar={
          <>
            <SegmentedControl
              ariaLabel={t.bindParams.styleAria}
              value={style}
              onChange={setStyle}
              options={[
                { value: 'oracle', label: t.bindParams.oracle },
                { value: 'sqlserver', label: t.bindParams.sqlserver },
              ]}
            />

            {missing.length > 0 && (
              <span className="rounded bg-warning-bg px-2 py-1 font-mono text-[11px] text-warning">
                {t.bindParams.missing(missing.join(', '))}
              </span>
            )}

            {/* Bu çıktı koda kopyalanmamalı — bind'i kaldırmak hem enjeksiyon
                hem ORA-04031 (shared pool şişmesi) kapısıdır. */}
            <span className="flex items-center gap-1.5 rounded bg-surface-2 px-2 py-1 text-[11px] text-subtle">
              <Info size={12} aria-hidden="true" />
              {t.bindParams.debugNote}
            </span>

            <button
              type="button"
              onClick={() => {
                setInput(SAMPLE);
                setValues(SAMPLE_VALUES);
                setStyle('oracle');
              }}
              className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              <RotateCcw size={12} aria-hidden="true" />
              {t.bindParams.example}
            </button>
          </>
        }
      />

      <section className="rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
        <h2 className="mb-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
          {t.bindParams.paramsTitle}
        </h2>

        {binds.length === 0 ? (
          <p className="text-sm text-muted">{t.bindParams.noBinds}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {binds.map((name) => (
              <li key={name} className="flex flex-wrap items-center gap-2">
                <code className="w-40 shrink-0 truncate font-mono text-xs text-cat">
                  {style === 'oracle' ? ':' : '@'}
                  {name}
                </code>

                <input
                  type="text"
                  value={values[name]?.value ?? ''}
                  onChange={(event) => update(name, { value: event.target.value })}
                  aria-label={name}
                  className="h-7 min-w-0 flex-1 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
                />

                <select
                  value={values[name]?.type ?? 'auto'}
                  onChange={(event) => update(name, { type: event.target.value as BindType })}
                  aria-label={t.bindParams.typeAria}
                  className="h-7 shrink-0 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs text-muted transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
                >
                  {types.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
