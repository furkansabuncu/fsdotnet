import { useState } from 'react';
import ConverterShell from '../../shared/ConverterShell';
import { decodeBase64, encodeBase64 } from './base64';

type Mode = 'encode' | 'decode';

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState('');

  // Girdi küçük ve dönüşüm saf; her render'da hesaplamak memoization'dan ucuz.
  const result = mode === 'encode' ? encodeBase64(input, { urlSafe }) : decodeBase64(input);

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={mode === 'encode' ? 'Plain text' : 'Base64'}
      outputLabel={mode === 'encode' ? 'Base64' : 'Plain text'}
      placeholder={mode === 'encode' ? 'Type or paste text…' : 'Paste Base64…'}
      toolbar={
        <>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
            {(['encode', 'decode'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition ${
                  mode === value ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          {mode === 'encode' ? (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={urlSafe} onChange={(event) => setUrlSafe(event.target.checked)} />
              URL-safe (RFC 4648 §5)
            </label>
          ) : null}
        </>
      }
    />
  );
}
