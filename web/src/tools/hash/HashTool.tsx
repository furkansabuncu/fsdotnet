import { useEffect, useId, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import CopyButton from '../../shared/CopyButton';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { WEAK, computeHashes, type HashEncoding, type HashRow } from './hash';

const encoder = new TextEncoder();

export default function HashTool() {
  const { t, locale } = useI18n();
  const inputId = useId();
  const keyId = useId();

  const [text, setText] = useState('Örnek metin');
  const [hmacKey, setHmacKey] = useState('');
  const [encoding, setEncoding] = useState<HashEncoding>('hex');
  const [rows, setRows] = useState<HashRow[]>([]);

  /*
   * Özet ASENKRON: `crypto.subtle` Promise döndürüyor, yani sonucu render
   * sırasında türetmek mümkün değil — diğer araçlardaki saf fonksiyon
   * kalıbının uygulanamadığı tek yer burası.
   *
   * `cancelled` bayrağı yarışı kapatıyor: hızlı yazarken önceki hesap geç
   * biterse yeni girdinin sonucunu ezerdi.
   */
  useEffect(() => {
    let cancelled = false;
    void computeHashes({ text, hmacKey, encoding }).then((next) => {
      if (!cancelled) setRows(next);
    });
    return () => {
      cancelled = true;
    };
  }, [text, hmacKey, encoding]);

  const byteLength = encoder.encode(text).length;
  const keyed = hmacKey !== '';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel={t.hash.encodingAria}
          value={encoding}
          onChange={setEncoding}
          options={[
            { value: 'hex', label: 'hex' },
            { value: 'HEX', label: 'HEX' },
            { value: 'base64', label: 'base64' },
          ]}
        />

        <label className="flex items-center gap-1.5 text-xs text-muted">
          <span className="sr-only sm:not-sr-only">{t.hash.hmacLabel}</span>
          <input
            id={keyId}
            type="text"
            value={hmacKey}
            onChange={(event) => setHmacKey(event.target.value)}
            aria-label={t.hash.hmacLabel}
            placeholder={t.hash.hmacPlaceholder}
            className="h-7 w-44 rounded-md border border-border-subtle bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
          />
        </label>

        <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
          {keyed ? t.hash.hmacOn : t.hash.plainDigest}
        </span>

        <span className="rounded bg-surface-2 px-2 py-1 font-mono text-[11px] text-subtle">
          {t.hash.bytes(byteLength.toLocaleString(locale))}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
        <div className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3">
          <label htmlFor={inputId} className="text-[11px] font-medium tracking-wider text-subtle uppercase">
            {t.hash.input}
          </label>
        </div>
        <textarea
          id={inputId}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t.hash.placeholder}
          spellCheck={false}
          className="min-h-[140px] w-full resize-y bg-transparent p-3 font-mono text-sm leading-6 text-fg outline-none placeholder:text-subtle"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
        <div className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3">
          <span className="text-[11px] font-medium tracking-wider text-subtle uppercase">
            {t.hash.digests}
          </span>
        </div>

        {/* Uzun özetler dar ekranda taşıyor; kaydırma tabloya ait olmalı,
            sayfaya değil. */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sr-only">
              <tr>
                <th scope="col">{t.hash.algorithm}</th>
                <th scope="col">{t.hash.digest}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.algorithm} className="border-t border-border-subtle first:border-t-0">
                  <th
                    scope="row"
                    className="w-px py-2 pr-4 pl-3 text-left align-top font-mono text-xs font-medium whitespace-nowrap text-fg"
                  >
                    {row.algorithm}
                    {WEAK.has(row.algorithm) && (
                      <span
                        title={t.hash.weakTitle}
                        className="ml-2 inline-flex items-center gap-1 rounded bg-warning-bg px-1.5 py-0.5 text-[10px] text-warning"
                      >
                        <TriangleAlert size={10} aria-hidden="true" />
                        {t.hash.weak}
                      </span>
                    )}
                  </th>
                  <td className="py-2 pr-2 align-top font-mono text-xs break-all text-muted">
                    {row.value ?? <span className="text-subtle">{t.hash.notAvailable}</span>}
                  </td>
                  <td className="w-px py-1 pr-2 align-top">
                    {row.value && <CopyButton value={row.value} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted">{t.hash.note}</p>
    </div>
  );
}
