import { useState } from 'react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { generateTypes, type CodeTarget, type FractionStyle } from './jsonToCsharp';

/* Örnek bilerek bu projedeki tipik bir uç nokta cevabına benziyor: Oracle'dan
   gelen küçük harf snake_case alanlar, iç içe bir nesne ve bir dizi. */
const SAMPLE = JSON.stringify(
  {
    kitap_id: 10427,
    baslik: 'Örnek Kitap',
    dogum_tarihi: '1984-03-17',
    aktif: true,
    bakiye: 1250.5,
    raf: { raf_kodu: 'P-2026-0091', acilis_tarihi: '2026-08-24T09:30:00Z' },
    etiketler: [
      { kod: 'KTP-001', ad: 'Sessiz Bahçe', sonuc: null },
      { kod: 'KTP-014', ad: 'Kırık Pusula', sonuc: 'normal', rapor_id: 55120 },
    ],
  },
  null,
  2,
);

export default function JsonToCsharpTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);
  const [target, setTarget] = useState<CodeTarget>('record');
  const [rootName, setRootName] = useState('KitapDto');
  const [pascalCase, setPascalCase] = useState(true);
  const [nullableRefTypes, setNullableRefTypes] = useState(true);
  const [fraction, setFraction] = useState<FractionStyle>('decimal');

  const isCsharp = target !== 'typescript';
  const result = generateTypes(input, { target, rootName, pascalCase, nullableRefTypes, fraction });

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={t.jsonToCsharp.input}
      outputLabel={isCsharp ? t.jsonToCsharp.outputCsharp : t.jsonToCsharp.outputTypescript}
      placeholder={t.jsonToCsharp.placeholder}
      toolbar={
        <>
          <SegmentedControl
            ariaLabel={t.jsonToCsharp.targetAria}
            value={target}
            onChange={setTarget}
            options={[
              { value: 'record', label: t.jsonToCsharp.record },
              { value: 'class', label: t.jsonToCsharp.class },
              { value: 'typescript', label: t.jsonToCsharp.typescript },
            ]}
          />

          <input
            type="text"
            value={rootName}
            onChange={(event) => setRootName(event.target.value)}
            aria-label={t.jsonToCsharp.rootLabel}
            placeholder={t.jsonToCsharp.rootLabel}
            className="h-7 w-36 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
          />

          {/* C#'a özel seçenekler TypeScript hedefinde anlamsız — gizleniyor,
              disabled bırakmak "neden çalışmıyor" sorusunu doğuruyor. */}
          {isCsharp && (
            <>
              <SegmentedControl
                ariaLabel={t.jsonToCsharp.fractionAria}
                value={fraction}
                onChange={setFraction}
                options={[
                  { value: 'decimal', label: 'decimal' },
                  { value: 'double', label: 'double' },
                ]}
              />

              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={pascalCase}
                  onChange={(event) => setPascalCase(event.target.checked)}
                  className="size-3.5 accent-[var(--cat)]"
                />
                {t.jsonToCsharp.pascalCase}
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={nullableRefTypes}
                  onChange={(event) => setNullableRefTypes(event.target.checked)}
                  className="size-3.5 accent-[var(--cat)]"
                />
                {t.jsonToCsharp.nullableRefTypes}
              </label>
            </>
          )}

          <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
            {isCsharp ? t.jsonToCsharp.noteCsharp : t.jsonToCsharp.noteTypescript}
          </span>
        </>
      }
    />
  );
}
