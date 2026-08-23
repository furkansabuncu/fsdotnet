import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import { useI18n } from '../../i18n/I18nProvider';
import { ok } from '../types';
import { repairMojibake } from './mojibake';

/**
 * Boş kutu bırakma ilkesi (docs/design.md): araç gerçekçi bir örnekle açılır.
 * Örnek sentetik — bu bozulmanın geldiği gerçek kayıtlar kişisel veri içerir.
 * Metin çevrilmiyor: bozulmanın kendisi Türkçe karakterler üzerinden görünür
 * olduğu için örnek her iki dilde de aynı kalmalı.
 */
const SAMPLE = 'GöÃzlem: TüÃrkçÃe metin bozulmuşÅ göÃrüÃnüÃyor.';

export default function MojibakeTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);

  const report = repairMojibake(input);
  const repaired = report.passes > 0;

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={ok(report.text)}
      inputLabel={t.mojibake.brokenText}
      outputLabel={t.mojibake.repaired}
      placeholder={t.mojibake.placeholder}
      toolbar={
        <>
          <span
            className={`rounded px-2 py-1 font-mono text-[11px] ${
              repaired ? 'bg-cat-bg text-cat' : 'bg-surface-2 text-subtle'
            }`}
          >
            {input === ''
              ? t.mojibake.waiting
              : repaired
                ? t.mojibake.report(report.passes, report.removed)
                : t.mojibake.clean}
          </span>

          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <RotateCcw size={12} aria-hidden="true" />
            {t.mojibake.example}
          </button>
        </>
      }
    />
  );
}
