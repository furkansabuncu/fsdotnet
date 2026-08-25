import { useId, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
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

// Tek örnek yeterli; her ölçümde yeni encoder kurmak boşuna.
const encoder = new TextEncoder();

/**
 * Ölçüm yalnızca SAYIYI üretir; biçimlendirme (tekil/çoğul, binlik ayracı)
 * sözlükteki `shell.measure` fonksiyonuna ait — Türkçe'de sayıdan sonra çoğul
 * eki gelmediği için bu ayrım şart. Boş metin 0 satır sayılır.
 */
function measure(text: string): { bytes: number; lines: number } {
  return {
    bytes: encoder.encode(text).length,
    lines: text === '' ? 0 : text.split('\n').length,
  };
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
  inputLabel,
  outputLabel,
  placeholder,
  toolbar,
}: ConverterShellProps) {
  const { t, locale } = useI18n();
  const inputId = useId();
  const inputStatusId = useId();
  const outputStatusId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /*
   * regex101 modeli: hata anında çıktı paneli boşalmaz, son geçerli sonuç
   * soluk kalır.
   *
   * Bunu bir ref'e render sırasında yazarak yapmıyoruz: atılan bir render
   * (concurrent mod, Suspense yeniden denemesi) ref'i yine de değiştirir ve
   * ekranda olmayan bir değeri saklamış oluruz. React'in bu iş için
   * belgelediği yol, render sırasında state'i AYARLAMAK — setter aynı değerle
   * çağrılırsa React yeni render planlamaz, yani döngü oluşmaz.
   */
  const [lastValid, setLastValid] = useState('');
  if (result.ok && result.value !== lastValid) setLastValid(result.value);

  const output = result.ok ? result.value : lastValid;
  const inputSize = measure(input);
  const outputSize = measure(output);
  const stale = !result.ok && output !== '';

  return (
    <div className="flex flex-col gap-3">
      {toolbar ? <div className="flex min-h-8 flex-wrap items-center gap-2">{toolbar}</div> : null}

      <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1 md:grid-cols-2">
        <section className="flex min-w-0 flex-col">
          <div className="flex h-8 items-center gap-1 border-b border-border-subtle bg-surface-2 px-3">
            <label htmlFor={inputId} className="text-[11px] font-medium tracking-wider text-subtle uppercase">
              {inputLabel ?? t.shell.input}
            </label>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onInputChange('');
                  // Düğme boş girdide disabled oluyor; odağı geri almazsak
                  // tarayıcı onu body'ye düşürür ve klavye sırası başa döner.
                  inputRef.current?.focus();
                }}
                disabled={input === ''}
                title={t.shell.clear}
                aria-label={t.shell.clear}
                className="flex h-6 w-6 items-center justify-center rounded text-subtle transition-colors hover:bg-surface-3 hover:text-fg disabled:pointer-events-none disabled:opacity-40"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex min-h-[280px] flex-1">
            <textarea
              ref={inputRef}
              id={inputId}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={placeholder}
              spellCheck={false}
              aria-invalid={!result.ok}
              // aria-invalid tek başına "neyin geçersiz olduğunu" söylemiyor;
              // hata varken metni de açıklamaya bağlıyoruz.
              aria-describedby={result.ok ? inputStatusId : `${inputStatusId} ${errorId}`}
              className="h-full w-full resize-none bg-transparent p-3 font-mono text-sm leading-6 text-fg outline-none placeholder:text-subtle"
            />
          </div>

          <div
            id={inputStatusId}
            className="flex h-7 items-center justify-between gap-3 border-t border-border-subtle bg-surface-2 px-3 font-mono text-[11px] text-subtle"
          >
            <span>{t.shell.measure(inputSize.bytes.toLocaleString(locale), inputSize.lines)}</span>
          </div>
        </section>

        <section className="flex min-w-0 flex-col border-t border-border-subtle md:border-t-0 md:border-l">
          <div className="flex h-8 items-center gap-1 border-b border-border-subtle bg-surface-2 px-3">
            <span className="text-[11px] font-medium tracking-wider text-subtle uppercase">{outputLabel ?? t.shell.output}</span>
            <div className="ml-auto flex items-center gap-1">
              <CopyButton value={output} />
            </div>
          </div>

          {/* Kaydırılabilir alan klavyeyle de gezilebilmeli; <pre> odaklanabilir
              olmadığı için region + tabIndex kabuğa veriliyor. aria-describedby
              da rol taşımayan <pre> üzerinde okuyuculara ulaşmıyordu. */}
          <div
            role="region"
            aria-label={outputLabel ?? t.shell.output}
            aria-describedby={outputStatusId}
            tabIndex={0}
            className="relative isolate flex min-h-[280px] flex-1 overflow-auto"
          >
            {/* Çıktı değiştiğinde tek seferlik parlama. Ayrı bir katman ve
                key ile remount ediliyor: animasyonu <pre> üzerinde yeniden
                başlatmak metin seçimini bozardı. */}
            {output !== '' && (
              <span
                key={output}
                aria-hidden="true"
                className="output-flash pointer-events-none absolute inset-0 -z-10"
              />
            )}
            <pre
              className={`w-full p-3 font-mono text-sm leading-6 break-all whitespace-pre-wrap text-fg ${
                stale ? 'opacity-40' : ''
              }`}
            >
              {output}
            </pre>
          </div>

          <div
            id={outputStatusId}
            className="flex h-7 items-center justify-between gap-3 border-t border-border-subtle bg-surface-2 px-3 font-mono text-[11px] text-subtle"
          >
            <span className="shrink-0">{t.shell.measure(outputSize.bytes.toLocaleString(locale), outputSize.lines)}</span>
            {/* Doğrulama satır içi kalır — modal/toast yok. */}
            <span aria-live="polite" className="min-w-0 truncate">
              {!result.ok ? (
                /* `detail` çevrilmez — ayrıştırıcının verdiği konum ya da
                   girdiden gelen bir parça. Çevrilebilir kısım anahtarda. */
                <span
                  id={errorId}
                  className="text-error"
                  title={result.detail ? `${t.errors[result.error]} (${result.detail})` : t.errors[result.error]}
                >
                  <span aria-hidden="true">✕ </span>
                  {t.errors[result.error]}
                  {result.detail ? <span className="text-subtle"> · {result.detail}</span> : null}
                </span>
              ) : output !== '' ? (
                <span className="text-success">
                  <span aria-hidden="true">✓ </span>
                  {t.shell.valid}
                </span>
              ) : null}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
