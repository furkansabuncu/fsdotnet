import { useState } from 'react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { formatCode, type FormatLanguage, type FormatMode } from './codeFormat';

type LanguageChoice = FormatLanguage | 'auto';

const SAMPLE = `.hasta-karti{border:1px solid #ddd;padding:12px}.hasta-karti .ad{font-weight:600;color:#111}`;

export default function CodeFormatTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [choice, setChoice] = useState<LanguageChoice>('auto');
  const [mode, setMode] = useState<FormatMode>('format');
  const [indent, setIndent] = useState(2);

  const formatted = formatCode(input, {
    language: choice === 'auto' ? null : choice,
    mode,
    indent,
  });

  const result = formatted.ok ? { ok: true as const, value: formatted.value.text } : formatted;
  const detected = formatted.ok ? formatted.value.language : null;

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={t.codeFormat.input}
      outputLabel={mode === 'format' ? t.codeFormat.formatted : t.codeFormat.minified}
      placeholder={t.codeFormat.placeholder}
      toolbar={
        <>
          <SegmentedControl
            ariaLabel={t.codeFormat.languageAria}
            value={choice}
            onChange={setChoice}
            options={[
              { value: 'auto', label: t.codeFormat.auto },
              { value: 'json', label: 'JSON' },
              { value: 'xml', label: 'XML' },
              { value: 'html', label: 'HTML' },
              { value: 'css', label: 'CSS' },
            ]}
          />

          <SegmentedControl
            ariaLabel={t.codeFormat.modeAria}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'format', label: t.codeFormat.format },
              { value: 'minify', label: t.codeFormat.minify },
            ]}
          />

          {mode === 'format' && (
            <label className="flex items-center gap-1.5 text-xs text-muted">
              {t.codeFormat.indentLabel}
              <input
                type="number"
                min={1}
                max={8}
                value={indent}
                onChange={(event) => setIndent(Math.min(8, Math.max(1, Number(event.target.value))))}
                aria-label={t.codeFormat.indentLabel}
                className="h-7 w-14 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
              />
            </label>
          )}

          {/* Otomatik seçimde hangi dile karar verildiğini göstermek şart:
              yanlış tahmin sessizce yanlış çıktı üretirdi. */}
          {choice === 'auto' && detected && (
            <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
              {t.codeFormat.detected(detected.toUpperCase())}
            </span>
          )}
        </>
      }
    />
  );
}
