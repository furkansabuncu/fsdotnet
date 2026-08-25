import { useId, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { expandField, nextRuns, parseCron, type CronFlavour, type FieldName } from './cron';

const PRESETS: readonly { label: string; unix: string; quartz: string }[] = [
  { label: '@daily', unix: '@daily', quartz: '0 0 0 * * ?' },
  { label: '15 dk', unix: '*/15 * * * *', quartz: '0 */15 * * * ?' },
  { label: 'hafta içi 06:00', unix: '0 6 * * MON-FRI', quartz: '0 0 6 ? * MON-FRI' },
  { label: 'ayın sonu', unix: '0 0 L * *', quartz: '0 0 0 L * ?' },
];

const RUN_COUNT = 8;

/** Sonraki çalışmalar tabloda yerel saatle yazılıyor; başlık bunu söylüyor. */
function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'local';
  }
}

export default function CronTool() {
  const { t, locale } = useI18n();
  const inputId = useId();
  const [flavour, setFlavour] = useState<CronFlavour>('unix');
  const [expression, setExpression] = useState('*/15 * * * *');

  const parsed = parseCron(expression, flavour);
  /* `new Date()` render sırasında okunuyor: her tuşta zaten yeniden render
     oluyor, ayrı bir zamanlayıcı tutmak listeyi saniyede bir oynatmaktan
     başka işe yaramazdı. */
  const runs = parsed.ok ? nextRuns(parsed.value, new Date(), RUN_COUNT) : [];
  const unreachable = parsed.ok && runs.length === 0;

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel={t.cron.flavourAria}
          value={flavour}
          onChange={setFlavour}
          options={[
            { value: 'unix', label: t.cron.unix },
            { value: 'quartz', label: t.cron.quartz },
          ]}
        />

        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setExpression(flavour === 'unix' ? preset.unix : preset.quartz)}
            className="h-7 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-[11px] text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            {preset.label}
          </button>
        ))}

        <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
          {flavour === 'unix' ? t.cron.unixShape : t.cron.quartzShape}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
        <div className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3">
          <label htmlFor={inputId} className="text-[11px] font-medium tracking-wider text-subtle uppercase">
            {t.cron.expression}
          </label>
        </div>
        <input
          id={inputId}
          type="text"
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          placeholder={t.cron.placeholder}
          spellCheck={false}
          aria-invalid={!parsed.ok}
          className="w-full bg-transparent p-3 font-mono text-base text-fg outline-none placeholder:text-subtle"
        />
      </div>

      {!parsed.ok && (
        <p className="flex items-center gap-2 rounded-lg border border-error/40 bg-error-bg px-3 py-2 text-sm text-error">
          <TriangleAlert size={14} aria-hidden="true" className="shrink-0" />
          {t.errors[parsed.error]}
          {parsed.detail ? <span className="font-mono text-xs opacity-80">· {parsed.detail}</span> : null}
        </p>
      )}

      {unreachable && (
        <p className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning-bg px-3 py-2 text-sm text-warning">
          <TriangleAlert size={14} aria-hidden="true" className="shrink-0" />
          {t.errors.cronUnreachable}
        </p>
      )}

      {parsed.ok && (
        <div className="grid gap-3 lg:grid-cols-2">
          <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
            <h2 className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3 text-[11px] font-medium tracking-wider text-subtle uppercase">
              {t.cron.fields}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] tracking-wider text-subtle uppercase">
                    <th scope="col" className="py-1.5 pl-3 font-medium">{t.cron.field}</th>
                    <th scope="col" className="py-1.5 font-medium">{t.cron.raw}</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">{t.cron.expands}</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.value.fields.map((field) => (
                    <tr key={field.name} className="border-t border-border-subtle">
                      <th scope="row" className="py-2 pl-3 text-left align-top text-xs font-medium whitespace-nowrap text-fg">
                        {t.cron.fieldNames[field.name as FieldName]}
                      </th>
                      <td className="py-2 pr-3 align-top font-mono text-xs text-cat">{field.raw}</td>
                      <td className="py-2 pr-3 align-top font-mono text-xs text-muted">
                        {expandField(field)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
            <h2 className="flex h-8 items-center gap-2 border-b border-border-subtle bg-surface-2 px-3 text-[11px] font-medium tracking-wider text-subtle uppercase">
              {t.cron.nextRuns}
              <span className="ml-auto font-mono text-[10px] normal-case">{localZone()}</span>
            </h2>
            <ol className="divide-y divide-border-subtle">
              {runs.map((run, index) => (
                <li
                  key={run.getTime()}
                  className="flex items-baseline gap-3 px-3 py-2 text-sm"
                >
                  <span className="w-4 shrink-0 font-mono text-[11px] text-subtle">{index + 1}</span>
                  <span className="text-fg">{formatter.format(run)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      <p className="text-xs text-muted">{t.cron.orRuleNote}</p>
    </div>
  );
}
