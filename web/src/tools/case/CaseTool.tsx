import { useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import CopyButton from '../../shared/CopyButton';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { CASE_FORMATS, convertLines, localeDiffers, type CaseLocale } from './caseConvert';

/** ORIGO'nun gerçek kolon adları: FE↔BE sınırında çevrilen tam bu liste. */
const SAMPLE = ['hasta_id', 'ekleme_tarihi', 'rapor_kodu', 'iptal_durumu', 'XMLHttpRequest'].join('\n');

export default function CaseTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [locale, setLocale] = useState<CaseLocale>('invariant');

  // Herhangi bir biçimde Türkçe/invariant farkı varsa uyarı gösteriliyor.
  const risky = CASE_FORMATS.some((format) => localeDiffers(input, format.id));

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        aria-label={t.caseConvert.input}
        placeholder={t.caseConvert.placeholder}
        spellCheck={false}
        className="min-h-24 w-full resize-y rounded-lg border border-border-subtle bg-surface p-3 font-mono text-sm leading-6 text-fg shadow-elev-1 outline-none placeholder:text-subtle focus-visible:border-cat"
      />

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel={t.caseConvert.localeAria}
          value={locale}
          onChange={setLocale}
          options={[
            { value: 'invariant', label: t.caseConvert.invariant },
            { value: 'tr', label: t.caseConvert.turkish },
          ]}
        />

        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <RotateCcw size={12} aria-hidden="true" />
          {t.caseConvert.example}
        </button>
      </div>

      {risky && (
        <p className="flex items-start gap-1.5 rounded-lg bg-warning-bg p-2.5 text-xs text-warning">
          <AlertTriangle size={13} aria-hidden="true" className="mt-px shrink-0" />
          {t.caseConvert.localeWarning}
        </p>
      )}

      <div className="grid gap-2 md:grid-cols-2">
        {CASE_FORMATS.map((format) => {
          const output = convertLines(input, format.id, locale);
          return (
            <section
              key={format.id}
              className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1"
            >
              <div className="flex h-8 shrink-0 items-center gap-2 border-b border-border-subtle bg-surface-2 px-3">
                <span className="font-mono text-[11px] text-cat">{format.sample}</span>
                <div className="ml-auto">
                  <CopyButton value={output} />
                </div>
              </div>
              <pre className="overflow-auto p-3 font-mono text-sm leading-6 text-fg">{output}</pre>
            </section>
          );
        })}
      </div>
    </div>
  );
}
