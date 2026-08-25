import { useState } from 'react';
import { AlertTriangle, RotateCcw, Wand2 } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { countText, inspectPoints, normalization, stripInvisible } from './unicode';

/**
 * Örnek bilerek "kirli": bölünmez boşluk, sıfır genişlikli boşluk ve ayrık
 * yazılmış bir ğ içeriyor — üç tuzağı da tek bakışta gösteriyor.
 */
const SAMPLE = 'Ömer Çelikbaş​ — ağrı kontrolü';

/** DOM'u şişirmemek için tabloda gösterilecek satır tavanı. */
const MAX_ROWS = 300;

export default function UnicodeTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);

  const counts = countText(input);
  const points = inspectPoints(input);
  const suspicious = points.filter((point) => point.suspicious);
  const hasBidi = points.some((point) => point.bidi);
  const norm = normalization(input);
  const shown = points.slice(0, MAX_ROWS);

  const stats = [
    [counts.graphemes, t.unicode.graphemes],
    [counts.codePoints, t.unicode.codePoints],
    [counts.utf16Units, t.unicode.utf16Units],
    [counts.utf8Bytes, t.unicode.utf8Bytes],
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        aria-label={t.unicode.input}
        placeholder={t.unicode.placeholder}
        spellCheck={false}
        className="min-h-24 w-full resize-y rounded-lg border border-border-subtle bg-surface p-3 font-mono text-sm leading-6 text-fg shadow-elev-1 outline-none placeholder:text-subtle focus-visible:border-cat"
      />

      <div className="flex flex-wrap items-center gap-2">
        {stats.map(([value, label]) => (
          <span
            key={label}
            className="rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-[11px] text-muted"
          >
            <span className="font-mono text-sm text-fg">{value}</span> {label}
          </span>
        ))}

        <button
          type="button"
          onClick={() => setInput(stripInvisible(input))}
          disabled={suspicious.length === 0}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg disabled:pointer-events-none disabled:opacity-40"
        >
          <Wand2 size={12} aria-hidden="true" />
          {t.unicode.strip}
        </button>

        <button
          type="button"
          onClick={() => setInput(norm.nfc)}
          disabled={norm.isNfc}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg disabled:pointer-events-none disabled:opacity-40"
        >
          {t.unicode.toNfc}
        </button>

        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <RotateCcw size={12} aria-hidden="true" />
          {t.unicode.example}
        </button>
      </div>

      <section className="rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
        <h2 className="mb-2 flex items-center gap-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
          {t.unicode.suspiciousTitle}
          {suspicious.length > 0 && (
            <span className="rounded bg-warning-bg px-1.5 py-0.5 font-mono text-[10px] normal-case text-warning">
              {t.unicode.suspiciousCount(suspicious.length)}
            </span>
          )}
        </h2>

        {suspicious.length === 0 ? (
          <p className="text-sm text-muted">{t.unicode.suspiciousNone}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {/* Aynı karakter defalarca geçebilir; tekilleştirip sayıyoruz. */}
            {[...new Map(suspicious.map((point) => [point.codePoint, point])).values()].map((point) => {
              const times = suspicious.filter((other) => other.codePoint === point.codePoint).length;
              return (
                <li key={point.codePoint} className="flex items-center gap-2 text-sm">
                  <code className="w-20 shrink-0 font-mono text-[11px] text-warning">{point.label}</code>
                  <span className="min-w-0 flex-1 truncate text-muted">{point.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-subtle">×{times}</span>
                </li>
              );
            })}
          </ul>
        )}

        {hasBidi && (
          <p className="mt-2 flex items-start gap-1.5 rounded bg-error-bg p-2 text-xs text-error">
            <AlertTriangle size={13} aria-hidden="true" className="mt-px shrink-0" />
            {t.unicode.bidiWarning}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
        <h2 className="mb-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
          {t.unicode.normalizeTitle}
        </h2>
        <p className={`text-sm ${norm.isNfc ? 'text-muted' : 'text-warning'}`}>
          {norm.isNfc ? t.unicode.isNfc : t.unicode.notNfc}
        </p>
      </section>

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
        <div className="flex h-8 items-center gap-2 border-b border-border-subtle bg-surface-2 px-3">
          <span className="text-[11px] font-medium tracking-wider text-subtle uppercase">
            {t.unicode.tableTitle}
          </span>
          {points.length > MAX_ROWS && (
            <span className="ml-auto font-mono text-[11px] text-subtle">
              {t.unicode.truncated(MAX_ROWS, points.length)}
            </span>
          )}
        </div>

        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left font-mono text-xs">
            <tbody>
              {shown.map((point) => (
                <tr
                  key={point.index}
                  className={`border-b border-border-subtle last:border-0 ${
                    point.suspicious ? 'bg-warning-bg' : ''
                  }`}
                >
                  <td className="w-12 px-3 py-1 text-subtle">{point.index}</td>
                  <td className="w-10 px-3 py-1 text-fg">
                    {/* Görünmez karakterin yerine nokta koyuyoruz; boş hücre
                        "burada bir şey var" bilgisini gizlerdi. */}
                    {point.suspicious || point.category === 'control' ? (
                      <span className="text-subtle">·</span>
                    ) : (
                      point.char
                    )}
                  </td>
                  <td className="w-24 px-3 py-1 text-cat">{point.label}</td>
                  <td className="w-24 px-3 py-1 text-subtle">{point.category}</td>
                  <td className="px-3 py-1 text-muted">{point.name ?? ''}</td>
                  <td className="w-16 px-3 py-1 text-right text-subtle">{point.utf8Bytes} B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
