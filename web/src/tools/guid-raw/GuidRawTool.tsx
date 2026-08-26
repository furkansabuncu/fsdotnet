import { useState } from 'react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { convertGuid } from './guidRaw';

type Direction = 'guid' | 'raw';

export default function GuidRawTool() {
  const { t } = useI18n();
  const [input, setInput] = useState('00112233-4455-6677-8899-aabbccddeeff');
  const [direction, setDirection] = useState<Direction>('guid');

  const converted = convertGuid(input, direction === 'raw');

  let result: ToolResult<string>;
  if (converted.ok) {
    const rows: [string, string][] = [
      [t.guidRaw.labelGuid, converted.value.guid],
      [t.guidRaw.labelSameOrder, converted.value.hexSameOrder],
      [t.guidRaw.labelDotnetBytes, converted.value.hexDotnetBytes],
      [t.guidRaw.labelLiteral, converted.value.hextoraw],
    ];
    // Etiketleri hizala: en uzun etiket kadar doldurulmuş sabit sütun,
    // monospace panelde tablo gibi okunuyor (epoch aracıyla aynı kalıp).
    const width = Math.max(...rows.map(([label]) => label.length));
    result = ok(rows.map(([label, cell]) => `${label.padEnd(width)}  ${cell}`).join('\n'));
  } else {
    result = converted;
  }

  return (
    <ConverterShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={direction === 'guid' ? t.guidRaw.inputGuid : t.guidRaw.inputRaw}
      outputLabel={t.guidRaw.output}
      placeholder={t.guidRaw.placeholder}
      toolbar={
        <SegmentedControl
          ariaLabel={t.guidRaw.directionAria}
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'guid', label: t.guidRaw.fromGuid },
            { value: 'raw', label: t.guidRaw.fromRaw },
          ]}
        />
      }
    />
  );
}
