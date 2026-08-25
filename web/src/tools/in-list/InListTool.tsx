import { useState } from 'react';
import { Info } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { buildInList, type QuoteMode } from './inList';

/** Excel'den yapıştırılmış bir ID kolonuna benzeyen örnek. */
const SAMPLE = ['1042', '1043', '1044', '1044', '2071', ''].join('\n');

export default function InListTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [column, setColumn] = useState('kitap_id');
  const [quote, setQuote] = useState<QuoteMode>('auto');
  const [dedupe, setDedupe] = useState(true);
  const [chunkSize, setChunkSize] = useState(1000);

  const built = buildInList(input, { column, quote, dedupe, skipEmpty: true, chunkSize });
  const result = built.ok ? { ok: true as const, value: built.value.sql } : built;
  const info = built.ok ? built.value : null;

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={t.inList.input}
      outputLabel={t.inList.output}
      placeholder={t.inList.placeholder}
      toolbar={
        <>
          <input
            type="text"
            value={column}
            onChange={(event) => setColumn(event.target.value)}
            aria-label={t.inList.columnLabel}
            placeholder={t.inList.columnLabel}
            className="h-7 w-36 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
          />

          <SegmentedControl
            ariaLabel={t.inList.quoteAria}
            value={quote}
            onChange={setQuote}
            options={[
              { value: 'auto', label: t.inList.auto },
              { value: 'always', label: t.inList.always },
              { value: 'never', label: t.inList.never },
            ]}
          />

          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={dedupe}
              onChange={(event) => setDedupe(event.target.checked)}
              className="size-3.5 accent-[var(--cat)]"
            />
            {t.inList.dedupe}
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted">
            {t.inList.chunkLabel}
            <input
              type="number"
              min={1}
              value={chunkSize}
              onChange={(event) => setChunkSize(Number(event.target.value))}
              aria-label={t.inList.chunkLabel}
              className="h-7 w-20 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
            />
          </label>

          {info && (
            <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
              {t.inList.stats(info.count, info.chunks)}
            </span>
          )}

          {info && info.removedDuplicates > 0 && (
            <span className="rounded bg-surface-2 px-2 py-1 font-mono text-[11px] text-subtle">
              {t.inList.duplicates(info.removedDuplicates)}
            </span>
          )}

          {/* Parçalanma olduğunda sebebi söylemek şart — yoksa çıktının neden
              OR'lu olduğu anlaşılmaz. */}
          {info && info.chunks > 1 && (
            <span className="flex items-center gap-1.5 rounded bg-warning-bg px-2 py-1 text-[11px] text-warning">
              <Info size={12} aria-hidden="true" />
              {t.inList.oracleNote}
            </span>
          )}
        </>
      }
    />
  );
}
