import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import CopyButton from '../../shared/CopyButton';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import {
  DIALECTS,
  UNIT_ORDER,
  convert,
  renderSample,
  sampleFromDate,
  tokenFor,
  type Dialect,
} from './dateFormat';

/**
 * Başlangıç kalıbı Oracle'ın Türkiye'de en sık yazılan biçimi. Boş kutu
 * bırakmıyoruz: araç açılır açılmaz üç çeviriyi ve örnek çıktıyı gösteriyor,
 * yani ne işe yaradığı okumadan anlaşılıyor.
 */
const DEFAULT_PATTERN = 'DD.MM.YYYY HH24:MI';

const PRESETS: { dialect: Dialect; pattern: string }[] = [
  { dialect: 'oracle', pattern: DEFAULT_PATTERN },
  { dialect: 'oracle', pattern: 'DD/MM/YYYY HH24:MI:SS' },
  { dialect: 'dotnet', pattern: 'yyyy-MM-ddTHH:mm:ss' },
  { dialect: 'delphi', pattern: 'dd.mm.yyyy hh:nn:ss' },
  { dialect: 'js', pattern: 'DD MMMM YYYY dddd' },
];

/* Saat dilimi adı yalnızca `TZR` / `z` örneği için gerekiyor; tarayıcı
   vermezse UTC yazmak, boş bırakmaktan anlaşılır. */
function browserZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export default function DateFormatTool() {
  const { t, locale } = useI18n();
  const [source, setSource] = useState<Dialect>('oracle');
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  /* Örnek an mount'ta bir kez sabitleniyor. Her render'da `new Date()`
     okunsaydı saniye alanı yazarken zıplar ve çıktı okunamazdı. */
  const [sample] = useState(() => sampleFromDate(new Date(), browserZone()));

  const result = convert(pattern, source);
  const dialectName = (dialect: Dialect) => t.dateFormat.dialects[dialect];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel={t.dateFormat.sourceAria}
          value={source}
          onChange={setSource}
          options={DIALECTS.map((dialect) => ({ value: dialect, label: dialectName(dialect) }))}
        />

        {PRESETS.map((preset) => (
          <button
            key={`${preset.dialect}:${preset.pattern}`}
            type="button"
            onClick={() => {
              setSource(preset.dialect);
              setPattern(preset.pattern);
            }}
            className="rounded-md border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            {preset.pattern}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
        <label
          htmlFor="date-format-input"
          className="text-[11px] font-medium tracking-wider text-subtle uppercase"
        >
          {t.dateFormat.input(dialectName(source))}
        </label>

        {/* Kalıplar tek satırlık; textarea yanlış sinyal verir ve Enter'ı
            yutar. */}
        <input
          id="date-format-input"
          type="text"
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          placeholder={t.dateFormat.placeholder}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={!result.ok}
          className="h-9 w-full rounded-md border border-border-subtle bg-surface-2 px-2.5 font-mono text-sm text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
        />

        <p aria-live="polite" className="min-h-5 font-mono text-xs">
          {result.ok ? (
            <>
              <span className="text-subtle">{t.dateFormat.sample} </span>
              <span className="text-cat">{renderSample(result.value.parsed.pieces, sample, locale)}</span>
            </>
          ) : (
            <span className="text-error">
              <span aria-hidden="true">✕ </span>
              {t.errors[result.error]}
            </span>
          )}
        </p>
      </section>

      {result.ok && result.value.parsed.warnings.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {result.value.parsed.warnings.map((note) => (
            <li
              key={note}
              className="flex items-start gap-2 rounded-lg border border-border-subtle bg-warning-bg p-2.5 text-xs leading-5 text-warning"
            >
              <AlertTriangle size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
              {t.dateFormat.notes[note]}
            </li>
          ))}
        </ul>
      )}

      {result.ok && (
        <ul className="flex flex-col gap-1.5">
          {result.value.translations.map((translation) => (
            <li
              key={translation.dialect}
              className="flex flex-col gap-1.5 rounded-lg border border-border-subtle bg-surface p-2.5 shadow-elev-1"
            >
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[11px] font-medium tracking-wider text-subtle uppercase">
                  {dialectName(translation.dialect)}
                </span>

                <code className="min-w-0 flex-1 truncate font-mono text-sm text-fg">
                  {translation.pattern}
                </code>

                <CopyButton
                  value={translation.pattern}
                  label={t.dateFormat.copy(dialectName(translation.dialect))}
                />
              </div>

              {translation.dropped.length > 0 && (
                <p className="pl-19 text-xs text-error">
                  {t.dateFormat.dropped(
                    translation.dropped.map((unit) => t.dateFormat.units[unit]).join(', '),
                  )}
                </p>
              )}

              {/* `dropped` notu ayrı satırda zaten yazıldı; burada tekrar
                  etmesin. */}
              {translation.notes
                .filter((note) => note !== 'dropped')
                .map((note) => (
                  <p key={note} className="pl-19 text-xs leading-5 text-muted">
                    {t.dateFormat.notes[note]}
                  </p>
                ))}
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-lg border border-border-subtle bg-surface shadow-elev-1">
        <h2 className="border-b border-border-subtle px-3 py-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
          {t.dateFormat.referenceTitle}
        </h2>

        {/* Dar ekranda tablo taşar; kaydırma sayfaya değil kutuya ait. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th scope="col" className="px-3 py-2 text-xs font-medium text-subtle">
                  {t.dateFormat.referenceField}
                </th>
                {DIALECTS.map((dialect) => (
                  <th key={dialect} scope="col" className="px-3 py-2 text-xs font-medium text-subtle">
                    {dialectName(dialect)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UNIT_ORDER.map((unit) => (
                <tr key={unit} className="border-b border-border-subtle last:border-b-0">
                  <th scope="row" className="px-3 py-1.5 text-xs font-normal text-muted">
                    {t.dateFormat.units[unit]}
                  </th>
                  {DIALECTS.map((dialect) => {
                    const token = tokenFor(unit, dialect);
                    return (
                      <td key={dialect} className="px-3 py-1.5 font-mono text-xs text-fg">
                        {token ?? (
                          <span className="text-subtle" title={t.dateFormat.noEquivalent}>
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
