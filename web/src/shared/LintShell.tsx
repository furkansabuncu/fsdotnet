import { useState, type ReactNode } from 'react';
import { ArrowUp } from 'lucide-react';
import ConverterShell from './ConverterShell';
import { applyFixes, fixableCount } from '../lint/engine';
import type { Finding, RuleText } from '../lint/types';
import { ok, type ToolResult } from '../tools/types';

/**
 * Lint araçlarının ortak yüzeyi.
 *
 * SQL Fixer ile Oracle 11g LINQ lint'inin arayüzü satırı satırına aynı:
 * girdi kutusu, düzeltilmiş çıktı, bulgu sayacı, "girdiye taşı" ve tek tek
 * kapatılabilen bulgu listesi. Fark yalnızca kural tablosu ve örnekler —
 * onlar `rules` ve `toolbar` ile geliyor.
 */

/** İki dilde de doldurulması zorunlu etiket kümesi. */
export interface LintLabels {
  input: string;
  output: string;
  placeholder: string;
  clean: string;
  count: (total: number, fixable: number) => string;
  findingsTitle: string;
  apply: string;
  manual: string;
  applyToInput: string;
}

interface LintShellProps<K extends string> {
  input: string;
  onInputChange: (value: string) => void;
  /** Kuralların çıktısı; boş girdi gibi durumlarda hata anahtarı. */
  analysis: ToolResult<readonly Finding<K>[]>;
  rules: Record<K, RuleText>;
  labels: LintLabels;
  /** Örnek düğmeleri gibi araca özel denetimler. */
  toolbar?: ReactNode;
}

export default function LintShell<K extends string>({
  input,
  onInputChange,
  analysis,
  rules,
  labels,
  toolbar,
}: LintShellProps<K>) {
  /** Kullanıcının kapattığı düzeltmeler; varsayılan hepsi açık. */
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());

  /*
   * Girdi değişince dışlamalar sıfırlanır.
   *
   * Bulgu kimliği `kural:konum`. Metin bir karakter kaydığında aynı bulgu
   * başka bir kimlik alıyor, yani eski dışlamalar zaten çöp — ama bir
   * kısmı BAŞKA bir bulgunun kimliğine denk gelebilir ve kullanıcının hiç
   * dokunmadığı bir düzeltme sessizce uygulanmaz olurdu.
   *
   * Render sırasında state ayarlamak React'in bu iş için belgelediği yol:
   * setter aynı değerle çağrılırsa yeni render planlanmıyor, döngü olmuyor.
   */
  const [lastInput, setLastInput] = useState(input);
  if (lastInput !== input) {
    setLastInput(input);
    if (excluded.size > 0) setExcluded(new Set());
  }

  const findings = analysis.ok ? analysis.value : [];
  const fixed = analysis.ok ? applyFixes(input, findings, excluded) : '';
  const result: ToolResult<string> = analysis.ok ? ok(fixed) : analysis;
  const changed = analysis.ok && fixed !== input;

  const toggle = (id: string) => {
    setExcluded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <ConverterShell
        input={input}
        onInputChange={onInputChange}
        result={result}
        inputLabel={labels.input}
        outputLabel={labels.output}
        placeholder={labels.placeholder}
        toolbar={
          <>
            {toolbar}

            {analysis.ok && (
              <span
                className={`rounded px-2 py-1 font-mono text-[11px] ${
                  findings.length === 0 ? 'bg-success-bg text-success' : 'bg-cat-bg text-cat'
                }`}
              >
                {findings.length === 0
                  ? labels.clean
                  : labels.count(findings.length, fixableCount(findings))}
              </span>
            )}

            {/*
              Düzeltilmiş metni girdiye taşımak şart, süs değil: bazı
              düzeltmeler bir sonraki turda YENİ bulgular açıyor. Ana
              dilden yapıştırılmış bir string çözülmeden içindeki SQL
              hiç incelenemiyor.
            */}
            <button
              type="button"
              onClick={() => {
                onInputChange(fixed);
                setExcluded(new Set());
              }}
              disabled={!changed}
              className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowUp size={12} aria-hidden="true" />
              {labels.applyToInput}
            </button>
          </>
        }
      />

      {findings.length > 0 && (
        <section className="rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
          <h2 className="mb-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
            {labels.findingsTitle}
          </h2>

          <ul className="flex flex-col gap-1.5">
            {findings.map((item) => {
              const rule = rules[item.rule];
              const hasFix = item.edits.length > 0;

              return (
                <li key={item.id} className="flex items-start gap-2.5 rounded-md bg-surface-2 p-2.5">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      item.severity === 'error' ? 'bg-error-bg text-error' : 'bg-warning-bg text-warning'
                    }`}
                  >
                    {item.position}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-fg">
                      {rule.title}
                      {item.detail !== undefined && (
                        /* Çevrilmez: girdiden gelen token ya da somut kod önerisi. */
                        <code className="ml-2 font-mono text-xs break-all text-cat">{item.detail}</code>
                      )}
                    </p>
                    <p className="text-xs leading-5 text-muted">{rule.hint}</p>
                  </div>

                  {hasFix ? (
                    <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={!excluded.has(item.id)}
                        onChange={() => toggle(item.id)}
                        className="size-3.5 accent-[var(--cat)]"
                      />
                      {labels.apply}
                    </label>
                  ) : (
                    <span className="shrink-0 text-xs text-subtle">{labels.manual}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
