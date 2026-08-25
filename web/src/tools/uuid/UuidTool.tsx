import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import CopyButton from '../../shared/CopyButton';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { MAX_COUNT, generateUuids, type UuidVersion } from './uuid';

/**
 * Üreteç, dönüştürücü değil — girdisi yok, o yüzden `ConverterShell`
 * kullanmıyor. Kabuğu paylaşmak için sahte bir girdi alanı eklemek arayüzü
 * yalan söyletirdi.
 */
export default function UuidTool() {
  const { t } = useI18n();
  const [version, setVersion] = useState<UuidVersion>('v4');
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [braces, setBraces] = useState(false);

  // İlk liste açılışta üretilir; boş kutu bırakma ilkesi.
  const [list, setList] = useState(() => generateUuids({ version: 'v4', count: 5, uppercase: false, braces: false }));

  const regenerate = (next?: Partial<Parameters<typeof generateUuids>[0]>) => {
    setList(generateUuids({ version, count, uppercase, braces, ...next }));
  };

  const text = list.join('\n');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel={t.uuid.versionAria}
          value={version}
          onChange={(next) => {
            setVersion(next);
            regenerate({ version: next });
          }}
          options={[
            { value: 'v4', label: t.uuid.v4 },
            { value: 'v7', label: t.uuid.v7 },
          ]}
        />

        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="sr-only">{t.uuid.countAria}</span>
          <input
            type="number"
            min={1}
            max={MAX_COUNT}
            value={count}
            onChange={(event) => {
              const next = Number(event.target.value);
              setCount(next);
              regenerate({ count: next });
            }}
            aria-label={t.uuid.countAria}
            className="h-7 w-20 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(event) => {
              setUppercase(event.target.checked);
              regenerate({ uppercase: event.target.checked });
            }}
            className="size-3.5 accent-[var(--cat)]"
          />
          {t.uuid.uppercase}
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={braces}
            onChange={(event) => {
              setBraces(event.target.checked);
              regenerate({ braces: event.target.checked });
            }}
            className="size-3.5 accent-[var(--cat)]"
          />
          {t.uuid.braces}
        </label>

        <button
          type="button"
          onClick={() => regenerate()}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <RefreshCw size={12} aria-hidden="true" />
          {t.uuid.generate}
        </button>
      </div>

      <section className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <div className="flex h-8 items-center gap-1 border-b border-border-subtle bg-surface-2 px-3">
          <span className="text-[11px] font-medium tracking-wider text-subtle uppercase">
            {t.uuid.output}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <CopyButton value={text} />
          </div>
        </div>

        <div
          role="region"
          aria-label={t.uuid.output}
          tabIndex={0}
          className="min-h-[280px] overflow-auto"
        >
          <pre className="p-3 font-mono text-sm leading-6 text-fg">{text}</pre>
        </div>

        <div className="flex h-7 items-center border-t border-border-subtle bg-surface-2 px-3 font-mono text-[11px] text-subtle">
          {t.uuid.count(list.length)}
        </div>
      </section>
    </div>
  );
}
