import { useState } from 'react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { decodeBase64, encodeBase64 } from './base64';

type Mode = 'encode' | 'decode';

export default function Base64Tool() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState('');

  // Girdi küçük ve dönüşüm saf; her render'da hesaplamak memoization'dan ucuz.
  const result = mode === 'encode' ? encodeBase64(input, { urlSafe }) : decodeBase64(input);
  const encoding = mode === 'encode';

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={encoding ? t.base64.plainText : t.base64.base64}
      outputLabel={encoding ? t.base64.base64 : t.base64.plainText}
      placeholder={encoding ? t.base64.placeholderEncode : t.base64.placeholderDecode}
      toolbar={
        <>
          <SegmentedControl
            ariaLabel={t.base64.directionAria}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'encode', label: t.base64.encode },
              { value: 'decode', label: t.base64.decode },
            ]}
          />

          {encoding ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={urlSafe}
                onChange={(event) => setUrlSafe(event.target.checked)}
                className="size-3.5 accent-[var(--cat)]"
              />
              {t.base64.urlSafe} <span className="font-mono text-subtle">RFC 4648 §5</span>
            </label>
          ) : null}
        </>
      }
    />
  );
}
