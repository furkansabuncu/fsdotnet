import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { csvToInsert, csvToJson, parseCsv, type Delimiter } from './csv';

const SAMPLE = ['kitap_id,ad,dogum_yili,notlar', "1,Ömer Çelikbaş,1991,", "2,Ayşe Şahin,1984,\"kontrol, 3 ay sonra\""].join(
  '\n',
);

type Mode = 'json' | 'sql';

export default function CsvTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [mode, setMode] = useState<Mode>('json');
  const [delimiter, setDelimiter] = useState<Delimiter>(',');
  const [headerRow, setHeaderRow] = useState(true);
  const [table, setTable] = useState('kitap');

  const options = { delimiter, headerRow };
  const result = mode === 'json' ? csvToJson(input, options) : csvToInsert(input, options, table);

  // Satır sayısı en somut geri bildirim: ayraç yanlışsa hemen 1 satır görünür.
  const rows = parseCsv(input, delimiter);
  const dataRows = Math.max(0, headerRow ? rows.length - 1 : rows.length);

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={t.csv.input}
      outputLabel={t.csv.output}
      placeholder={t.csv.placeholder}
      toolbar={
        <>
          <SegmentedControl
            ariaLabel={t.csv.modeAria}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'json', label: t.csv.json },
              { value: 'sql', label: t.csv.sql },
            ]}
          />

          <SegmentedControl
            ariaLabel={t.csv.delimiterAria}
            value={delimiter}
            onChange={setDelimiter}
            options={[
              { value: ',', label: t.csv.comma },
              { value: ';', label: t.csv.semicolon },
              { value: '\t', label: t.csv.tab },
              { value: '|', label: t.csv.pipe },
            ]}
          />

          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={headerRow}
              onChange={(event) => setHeaderRow(event.target.checked)}
              className="size-3.5 accent-[var(--cat)]"
            />
            {t.csv.headerRow}
          </label>

          {mode === 'sql' && (
            <input
              type="text"
              value={table}
              onChange={(event) => setTable(event.target.value)}
              aria-label={t.csv.tableLabel}
              placeholder={t.csv.tableLabel}
              className="h-7 w-36 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
            />
          )}

          <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
            {t.csv.rows(dataRows)}
          </span>

          <button
            type="button"
            onClick={() => {
              setInput(SAMPLE);
              setDelimiter(',');
              setHeaderRow(true);
            }}
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <RotateCcw size={12} aria-hidden="true" />
            {t.csv.example}
          </button>
        </>
      }
    />
  );
}
