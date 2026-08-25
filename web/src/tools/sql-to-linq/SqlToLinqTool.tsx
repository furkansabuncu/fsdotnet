import { useState } from 'react';
import { Info } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { sqlToLinq, type LinqSyntax } from './sqlToLinq';

const SAMPLE = `SELECT H.HASTA_ID, H.AD_SOYAD, I.ISTEM_TARIHI
FROM HASTA H
LEFT JOIN ISTEM I ON I.HASTA_ID = H.HASTA_ID
WHERE H.AKTIF = 1
  AND H.AD_SOYAD LIKE 'Ali%'
  AND I.DURUM IN (1, 2, 3)
ORDER BY I.ISTEM_TARIHI DESC`;

export default function SqlToLinqTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [syntax, setSyntax] = useState<LinqSyntax>('query');
  const [context, setContext] = useState('db');

  const result = sqlToLinq(input, { syntax, context: context.trim() || 'db' });

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={t.sqlToLinq.input}
      outputLabel={t.sqlToLinq.output}
      placeholder={t.sqlToLinq.placeholder}
      toolbar={
        <>
          <SegmentedControl
            ariaLabel={t.sqlToLinq.syntaxAria}
            value={syntax}
            onChange={setSyntax}
            options={[
              { value: 'query', label: t.sqlToLinq.querySyntax },
              { value: 'method', label: t.sqlToLinq.methodSyntax },
            ]}
          />

          <input
            type="text"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            aria-label={t.sqlToLinq.contextLabel}
            placeholder={t.sqlToLinq.contextLabel}
            className="h-7 w-28 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
          />

          {/* Bu uyarı kalıcı ve gizlenemez: araç bir derleyici değil, çıktı
              gözden geçirilmeden kullanılmamalı. */}
          <span className="flex items-center gap-1.5 rounded bg-warning-bg px-2 py-1 text-[11px] text-warning">
            <Info size={12} aria-hidden="true" />
            {t.sqlToLinq.draftNote}
          </span>
        </>
      }
    />
  );
}
