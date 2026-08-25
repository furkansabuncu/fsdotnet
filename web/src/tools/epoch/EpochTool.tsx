import { useState } from 'react';
import { Clock } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { breakdown, parseEpoch, type EpochUnit } from './epoch';

type Selection = 'auto' | EpochUnit;

export default function EpochTool() {
  const { t, locale } = useI18n();
  // Boş kutu bırakma ilkesi: araç "şimdi" ile açılır, hep anlamlı bir şey gösterir.
  const [input, setInput] = useState(() => Math.floor(Date.now() / 1000).toString());
  const [unit, setUnit] = useState<Selection>('auto');

  const parsed = parseEpoch(input, unit === 'auto' ? undefined : unit);

  let result: ToolResult<string>;
  if (parsed.ok) {
    const rows = breakdown(parsed.value.date, locale);
    // Etiketleri hizala: en uzun etiket kadar doldurulmuş sabit genişlikli
    // sütun, monospace panelde tablo gibi okunuyor.
    const entries: [string, string][] = [
      [t.epoch.labelIso, rows.iso],
      [t.epoch.labelUtc, rows.utc],
      [t.epoch.labelLocal, rows.local],
      [t.epoch.labelSeconds, rows.seconds],
      [t.epoch.labelMillis, rows.milliseconds],
      [t.epoch.labelTicks, rows.ticks],
    ];
    const width = Math.max(...entries.map(([label]) => label.length));
    result = ok(entries.map(([label, value]) => `${label.padEnd(width)}  ${value}`).join('\n'));
  } else {
    result = parsed;
  }

  const detectedLabel = parsed.ok ? t.epoch[parsed.value.detected === 'date' ? 'auto' : parsed.value.detected] : null;

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={t.epoch.input}
      outputLabel={t.epoch.output}
      placeholder={t.epoch.placeholder}
      toolbar={
        <>
          <SegmentedControl
            ariaLabel={t.epoch.unitAria}
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'auto', label: t.epoch.auto },
              { value: 'seconds', label: t.epoch.seconds },
              { value: 'milliseconds', label: t.epoch.milliseconds },
              { value: 'ticks', label: t.epoch.ticks },
            ]}
          />

          {unit === 'auto' && detectedLabel && (
            <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
              {t.epoch.read(detectedLabel)}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setInput(Math.floor(Date.now() / 1000).toString());
              setUnit('auto');
            }}
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <Clock size={12} aria-hidden="true" />
            {t.epoch.now}
          </button>
        </>
      }
    />
  );
}
