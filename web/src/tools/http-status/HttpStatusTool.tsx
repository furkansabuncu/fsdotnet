import { useState } from 'react';
import { Search } from 'lucide-react';
import CopyButton from '../../shared/CopyButton';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { STATUS_CLASSES, searchStatuses, statusClass, type StatusClass } from './httpStatus';

/** Sınıf rengi anlamı taşır: 2xx yeşil, 4xx sarı, 5xx kırmızı. */
const CLASS_TONE: Record<StatusClass, string> = {
  '1xx': 'bg-info-bg text-info',
  '2xx': 'bg-success-bg text-success',
  '3xx': 'bg-info-bg text-info',
  '4xx': 'bg-warning-bg text-warning',
  '5xx': 'bg-error-bg text-error',
};

type Filter = StatusClass | 'all';

export default function HttpStatusTool() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const results = searchStatuses(query, filter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex min-w-0 flex-1 items-center">
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 text-subtle"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t.httpStatus.searchLabel}
            placeholder={t.httpStatus.placeholder}
            className="h-8 w-full rounded-md border border-border-subtle bg-surface-2 pr-2.5 pl-8 text-sm text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
          />
        </div>

        <SegmentedControl
          ariaLabel={t.httpStatus.filterAria}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t.httpStatus.all },
            ...STATUS_CLASSES.map((value) => ({ value, label: value })),
          ]}
        />

        <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
          {t.httpStatus.count(results.length)}
        </span>
      </div>

      {results.length === 0 ? (
        <p className="rounded-lg border border-border-subtle bg-surface p-8 text-center text-sm text-muted">
          {t.httpStatus.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {results.map((item) => (
            <li
              key={item.code}
              className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-2.5 shadow-elev-1"
            >
              <span
                className={`w-12 shrink-0 rounded px-1.5 py-1 text-center font-mono text-sm font-medium ${
                  CLASS_TONE[statusClass(item.code)]
                }`}
              >
                {item.code}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{item.name}</p>
                <p className="truncate text-xs text-muted">{item.summary}</p>
              </div>

              {/* Bu aracın diğer HTTP referanslarında olmayan tarafı:
                  kodu bulup sabiti doğrudan kopyalayabiliyorsunuz. */}
              {item.dotnet && (
                <span className="hidden shrink-0 items-center gap-1 sm:flex">
                  <code className="rounded bg-surface-2 px-2 py-1 font-mono text-[11px] text-muted">
                    {item.dotnet}
                  </code>
                  <CopyButton value={`StatusCodes.${item.dotnet}`} label={t.httpStatus.copied} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
