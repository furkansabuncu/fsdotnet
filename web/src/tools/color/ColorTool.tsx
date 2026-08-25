import { useState } from 'react';
import CopyButton from '../../shared/CopyButton';
import { useI18n } from '../../i18n/I18nProvider';
import {
  BLACK,
  WHITE,
  contrastRatio,
  parseColor,
  toHex,
  toHslString,
  toOklchString,
  toRgbString,
  verdict,
  type ContrastVerdict,
} from './color';

/** Kontrast sonucunu tek bir rozette özetler. */
function Verdict({ label, result }: { label: string; result: ContrastVerdict }) {
  const { t } = useI18n();
  const level = result.normalAAA ? t.color.passAAA : result.normalAA ? t.color.pass : null;

  return (
    <div className="flex items-baseline gap-2">
      <span className="w-28 shrink-0 text-xs text-muted">{label}</span>
      <span className="font-mono text-sm text-fg">{result.ratio.toFixed(2)}</span>
      <span
        className={`rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase ${
          level ? 'bg-success-bg text-success' : 'bg-error-bg text-error'
        }`}
      >
        {level ?? t.color.fail}
      </span>
      {/* Büyük metin eşiği (3.0) ayrı bir bilgi: normal metinde kalan bir renk
          başlıkta hâlâ kullanılabilir. */}
      {!result.normalAA && result.largeAA && (
        <span className="text-[11px] text-subtle">{t.color.largeText} AA</span>
      )}
    </div>
  );
}

export default function ColorTool() {
  const { t } = useI18n();
  const [input, setInput] = useState('#0080ff');

  const parsed = parseColor(input);
  const color = parsed.ok ? parsed.value : null;

  const formats = color
    ? ([
        ['HEX', toHex(color)],
        ['RGB', toRgbString(color)],
        ['HSL', toHslString(color)],
        ['OKLCH', toOklchString(color)],
      ] as const)
    : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label={t.color.inputLabel}
          aria-invalid={!parsed.ok}
          placeholder={t.color.placeholder}
          spellCheck={false}
          className="h-8 min-w-0 flex-1 rounded-md border border-border-subtle bg-surface-2 px-2.5 font-mono text-sm text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
        />
        {/* Yerleşik renk seçici: elle hex yazmak yerine gözle seçmek için. */}
        <input
          type="color"
          value={color ? toHex({ ...color, a: 1 }) : '#000000'}
          onChange={(event) => setInput(event.target.value)}
          aria-label={t.color.inputLabel}
          className="h-8 w-10 cursor-pointer rounded-md border border-border-subtle bg-surface-2 p-1"
        />
      </div>

      {!parsed.ok ? (
        <p className="rounded-lg border border-border-subtle bg-surface p-4 text-sm text-error">
          {t.errors[parsed.error]}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <div
            className="flex min-h-[140px] items-end rounded-lg border border-border-subtle p-3 shadow-elev-1"
            style={{ background: toHex(color as NonNullable<typeof color>) }}
          >
            {/* Örnek metin doğrudan swatch'ın üstünde: kontrast rakamını
                okumadan önce gözle görülüyor. */}
            <div className="flex w-full items-center justify-between font-mono text-xs">
              <span style={{ color: '#ffffff' }}>Aa</span>
              <span style={{ color: '#000000' }}>Aa</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <section className="rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
              <h2 className="mb-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
                {t.color.formats}
              </h2>
              <ul className="flex flex-col gap-1">
                {formats.map(([label, value]) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 font-mono text-[11px] text-subtle">{label}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-sm text-fg">{value}</span>
                    <CopyButton value={value} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
              <h2 className="mb-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
                {t.color.contrast}
              </h2>
              <div className="flex flex-col gap-1.5">
                <Verdict
                  label={t.color.onWhite}
                  result={verdict(contrastRatio(color as NonNullable<typeof color>, WHITE))}
                />
                <Verdict
                  label={t.color.onBlack}
                  result={verdict(contrastRatio(color as NonNullable<typeof color>, BLACK))}
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
