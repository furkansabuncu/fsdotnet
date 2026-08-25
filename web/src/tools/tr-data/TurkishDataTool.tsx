import { useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import CopyButton from '../../shared/CopyButton';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import {
  MAX_ROWS,
  PERSON_FIELDS,
  generatePeople,
  toCsv,
  toJson,
  type Person,
} from './turkishData';

type Format = 'table' | 'json' | 'csv';

export default function TurkishDataTool() {
  const { t } = useI18n();
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<Format>('table');
  const [fields, setFields] = useState<readonly (keyof Person)[]>(PERSON_FIELDS);
  const [people, setPeople] = useState(() => generatePeople(10));

  const toggleField = (field: keyof Person) => {
    // Sıra PERSON_FIELDS'ta sabit: seçim sırasına göre değil, kanonik sıraya
    // göre filtreleniyor — yoksa kolonlar tıklama sırasına göre karışırdı.
    setFields((current) =>
      current.includes(field)
        ? PERSON_FIELDS.filter((item) => current.includes(item) && item !== field)
        : PERSON_FIELDS.filter((item) => current.includes(item) || item === field),
    );
  };

  const text = format === 'json' ? toJson(people, fields) : toCsv(people, fields);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel={t.trData.formatAria}
          value={format}
          onChange={setFormat}
          options={[
            { value: 'table', label: t.trData.table },
            { value: 'json', label: t.trData.json },
            { value: 'csv', label: t.trData.csv },
          ]}
        />

        <input
          type="number"
          min={1}
          max={MAX_ROWS}
          value={count}
          onChange={(event) => {
            const next = Number(event.target.value);
            setCount(next);
            setPeople(generatePeople(next));
          }}
          aria-label={t.trData.countAria}
          className="h-7 w-20 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
        />

        <button
          type="button"
          onClick={() => setPeople(generatePeople(count))}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <RefreshCw size={12} aria-hidden="true" />
          {t.trData.generate}
        </button>

        <span className="flex items-center gap-1.5 rounded bg-success-bg px-2 py-1 text-[11px] text-success">
          <ShieldCheck size={12} aria-hidden="true" />
          {t.trData.checksumNote}
        </span>
      </div>

      <fieldset className="rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
        <legend className="px-1 text-[11px] font-medium tracking-wider text-subtle uppercase">
          {t.trData.fieldsTitle}
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {PERSON_FIELDS.map((field) => (
            <label key={field} className="flex cursor-pointer items-center gap-1.5 font-mono text-xs text-muted">
              <input
                type="checkbox"
                checked={fields.includes(field)}
                onChange={() => toggleField(field)}
                className="size-3.5 accent-[var(--cat)]"
              />
              {field}
            </label>
          ))}
        </div>
      </fieldset>

      <section className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
        <div className="flex h-8 shrink-0 items-center gap-1 border-b border-border-subtle bg-surface-2 px-3">
          <span className="text-[11px] font-medium tracking-wider text-subtle uppercase">
            {t.trData.output}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <CopyButton value={text} />
          </div>
        </div>

        <div className="max-h-[420px] overflow-auto">
          {format === 'table' ? (
            <table className="w-full text-left font-mono text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-surface-2">
                <tr>
                  {fields.map((field) => (
                    <th key={field} className="border-b border-border-subtle px-3 py-1.5 font-medium text-subtle">
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* oxlint-disable-next-line react/no-array-index-key -- üretilen
                    veride TCKN teorik olarak tekrar edebilir; indeks tekilliği
                    garantiliyor ve liste her üretimde bütünüyle değişiyor. */}
                {people.map((person, index) => (
                  <tr key={`${person.tckn}-${index}`} className="border-b border-border-subtle last:border-0">
                    {fields.map((field) => (
                      <td key={field} className="px-3 py-1 text-fg">
                        {person[field]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre className="p-3 font-mono text-sm leading-6 text-fg">{text}</pre>
          )}
        </div>

        <div className="flex h-7 shrink-0 items-center border-t border-border-subtle bg-surface-2 px-3 font-mono text-[11px] text-subtle">
          {t.trData.rows(people.length)}
        </div>
      </section>
    </div>
  );
}
