import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { buildConnectionString, parseConnectionString, type ConnWarningKey } from './connString';

const SAMPLE = 'User Id=hbys;Password=gizli;Data Source=db01.local:1521/ORCLPDB;Pooling=true';

type Mode = 'parse' | 'build';

export default function ConnStringTool() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('parse');
  const [input, setInput] = useState(SAMPLE);
  const [form, setForm] = useState({
    host: 'db01.local',
    port: '1521',
    service: 'ORCLPDB',
    user: 'hbys',
    password: 'gizli',
    descriptor: false,
  });

  /* Kurma modunda kurulan dize aynı zamanda çözülüyor: kullanıcı ne
     ürettiğini görürken uyarıları da alıyor ve iki mod aynı denetimden
     geçmiş oluyor. */
  const text = mode === 'parse' ? input : buildConnectionString(form);
  const parsed = parseConnectionString(text);

  let result: ToolResult<string>;
  let warnings: ConnWarningKey[] = [];

  if (parsed.ok) {
    const rows: [string, string][] = [
      [t.connString.labelKind, t.connString.kinds[parsed.value.kind]],
      [t.connString.labelHost, parsed.value.host ?? '—'],
      [t.connString.labelPort, parsed.value.port ?? '—'],
      [t.connString.labelService, parsed.value.service ?? '—'],
      [t.connString.labelRedacted, parsed.value.redacted],
    ];
    // Etiketleri hizala; epoch ve guid-raw ile aynı kalıp.
    const width = Math.max(...rows.map(([label]) => label.length));
    result = ok(rows.map(([label, value]) => `${label.padEnd(width)}  ${value}`).join('\n'));
    warnings = parsed.value.warnings;
  } else {
    result = parsed;
  }

  const field = (key: 'host' | 'port' | 'service' | 'user', label: string) => (
    <label className="flex items-center gap-1.5 text-xs text-subtle">
      {label}
      <input
        type="text"
        value={form[key]}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        className="h-7 w-32 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      <ConverterShell
        input={text}
        // Kurma modunda metin alanlardan türüyor; elle düzenlenemez.
        onInputChange={mode === 'parse' ? setInput : () => undefined}
        result={result}
        inputLabel={mode === 'parse' ? t.connString.input : t.connString.built}
        outputLabel={t.connString.output}
        placeholder={t.connString.placeholder}
        toolbar={
          <>
            <SegmentedControl
              ariaLabel={t.connString.modeAria}
              value={mode}
              onChange={setMode}
              options={[
                { value: 'parse', label: t.connString.modeParse },
                { value: 'build', label: t.connString.modeBuild },
              ]}
            />

            {mode === 'build' && (
              <>
                {field('host', t.connString.labelHost)}
                {field('port', t.connString.labelPort)}
                {field('service', t.connString.labelService)}
                {field('user', t.connString.labelUser)}

                <label className="flex items-center gap-1.5 text-xs text-subtle">
                  <input
                    type="checkbox"
                    checked={form.descriptor}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, descriptor: event.target.checked }))
                    }
                    className="size-3.5 accent-[var(--cat)]"
                  />
                  {t.connString.useDescriptor}
                </label>
              </>
            )}
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
              {t.connString.warnings[key]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
