import { useState } from 'react';
import { Search } from 'lucide-react';
import CopyButton from '../../shared/CopyButton';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { ORA_GROUPS, formatCode, searchOraErrors, type OraGroup } from './oraErrors';

/** Grup rengi anlamı taşır: bağlantı/kaynak kırmızı, sözdizimi sarı. */
const GROUP_TONE: Record<OraGroup, string> = {
  syntax: 'bg-warning-bg text-warning',
  object: 'bg-warning-bg text-warning',
  data: 'bg-info-bg text-info',
  constraint: 'bg-info-bg text-info',
  plsql: 'bg-cat-bg text-cat',
  connection: 'bg-error-bg text-error',
  concurrency: 'bg-error-bg text-error',
  resource: 'bg-error-bg text-error',
};

type Filter = OraGroup | 'all';

export default function OraErrorsTool() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const results = searchOraErrors(query, filter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex min-w-0 flex-1 items-center">
          <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-2.5 text-subtle" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t.oraErrors.searchLabel}
            placeholder={t.oraErrors.placeholder}
            className="h-8 w-full rounded-md border border-border-subtle bg-surface-2 pr-2.5 pl-8 text-sm text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
          />
        </div>

        <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
          {t.oraErrors.count(results.length)}
        </span>
      </div>

      <SegmentedControl
        ariaLabel={t.oraErrors.filterAria}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t.oraErrors.all },
          ...ORA_GROUPS.map((value) => ({ value, label: value })),
        ]}
      />

      {results.length === 0 ? (
        <p className="rounded-lg border border-border-subtle bg-surface p-8 text-center text-sm text-muted">
          {t.oraErrors.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {results.map((item) => (
            <li
              key={item.code}
              className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface p-2.5 shadow-elev-1"
            >
              <span
                className={`shrink-0 rounded px-2 py-1 font-mono text-xs font-medium ${GROUP_TONE[item.group]}`}
              >
                {formatCode(item.code)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{item.message}</p>
                {/* Asıl değer burada: resmî belge "ne" der, bu satır "neden" der. */}
                <p className="mt-0.5 text-xs text-muted">{item.cause}</p>
              </div>

              <span className="hidden shrink-0 items-center gap-1 sm:flex">
                <span className="rounded bg-surface-2 px-2 py-1 font-mono text-[10px] tracking-wide text-subtle uppercase">
                  {item.group}
                </span>
                <CopyButton value={`${formatCode(item.code)}: ${item.message}`} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
