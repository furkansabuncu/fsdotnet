import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import { useI18n } from '../../i18n/I18nProvider';
import SegmentedControl from '../../shared/SegmentedControl';
import { DIALECTS, formatSql, minifySql, type KeywordCase, type SqlDialect } from './sqlFormat';

/** Oracle tarzı, gerçek bir sorguya benzeyen örnek — boş kutu bırakma ilkesi. */
const SAMPLE =
  "select h.hasta_id, h.ad || ' ' || h.soyad as adsoyad, r.rapor_tarihi " +
  'from txhastarapor r inner join hasta h on h.hasta_id = r.hasta_id ' +
  'where r.grup_id = 5029 and r.ekleme_tarihi >= trunc(sysdate) - 7 ' +
  'and nvl(r.iptal, 0) = 0 order by r.rapor_tarihi desc';

type Mode = 'format' | 'minify';

export default function SqlFormatTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [mode, setMode] = useState<Mode>('format');
  const [dialect, setDialect] = useState<SqlDialect>('plsql');
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('upper');

  const formatting = mode === 'format';
  const result = formatting ? formatSql(input, { dialect, keywordCase }) : minifySql(input);

  // Sıkıştırmada kaç bayt kazanıldığı en somut geri bildirim.
  const savedPercent =
    !formatting && result.ok && input.length > 0
      ? Math.max(0, Math.round((1 - result.value.length / input.length) * 100))
      : null;

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={t.sqlFormat.query}
      outputLabel={formatting ? t.sqlFormat.formatted : t.sqlFormat.minified}
      placeholder={t.sqlFormat.placeholder}
      toolbar={
        <>
          <SegmentedControl
            ariaLabel={t.sqlFormat.modeAria}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'format', label: t.sqlFormat.format },
              { value: 'minify', label: t.sqlFormat.minify },
            ]}
          />

          {/* Lehçe yalnızca biçimlendirmede işe yarar; minify sözdiziminden
              bağımsız çalıştığı için o modda gizleniyor. */}
          {formatting && (
            <>
              <select
                aria-label={t.sqlFormat.dialectAria}
                value={dialect}
                onChange={(event) => setDialect(event.target.value as SqlDialect)}
                className="h-7 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs text-muted transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
              >
                {DIALECTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>

              <SegmentedControl
                ariaLabel={t.sqlFormat.caseAria}
                value={keywordCase}
                onChange={setKeywordCase}
                options={[
                  { value: 'upper', label: t.sqlFormat.upper },
                  { value: 'lower', label: t.sqlFormat.lower },
                  { value: 'preserve', label: t.sqlFormat.preserve },
                ]}
              />
            </>
          )}

          {savedPercent !== null && (
            <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
              {t.sqlFormat.saved(savedPercent)}
            </span>
          )}

          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <RotateCcw size={12} aria-hidden="true" />
            {t.sqlFormat.example}
          </button>
        </>
      }
    />
  );
}
