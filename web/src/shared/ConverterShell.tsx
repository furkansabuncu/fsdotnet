import type { ReactNode } from 'react';
import type { ToolResult } from '../tools/types';
import CopyButton from './CopyButton';

interface ConverterShellProps {
  input: string;
  onInputChange: (value: string) => void;
  result: ToolResult<string>;
  inputLabel?: string;
  outputLabel?: string;
  placeholder?: string;
  /** Mod anahtarları, seçenekler — başlık çubuğunda gösterilir. */
  toolbar?: ReactNode;
}

/**
 * Girdi → çıktı şeklindeki araçların ortak kabuğu.
 *
 * Planlanan 15 aracın 12'si bu şekle uyuyor; her araç kendi textarea/kopyala/
 * hata gösterimini yeniden yazmak yerine buraya bağlanır.
 */
export default function ConverterShell({
  input,
  onInputChange,
  result,
  inputLabel = 'Input',
  outputLabel = 'Output',
  placeholder,
  toolbar,
}: ConverterShellProps) {
  const output = result.ok ? result.value : '';

  return (
    <div className="flex flex-col gap-4">
      {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <label htmlFor="tool-input" className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {inputLabel}
          </label>
          <textarea
            id="tool-input"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className="h-72 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{outputLabel}</span>
            <CopyButton value={output} />
          </div>
          <output
            className={`h-72 w-full overflow-auto rounded-lg border p-3 font-mono text-sm whitespace-pre-wrap ${
              result.ok
                ? 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
                : 'border-red-400 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            {result.ok ? result.value : result.error}
          </output>
        </section>
      </div>
    </div>
  );
}
