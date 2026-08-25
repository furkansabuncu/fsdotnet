import { useState } from 'react';
import ConverterShell from '../../shared/ConverterShell';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { convertXmlJson, type XmlJsonDirection } from './xmlJson';

/* Eski sistemlerin konuştuğu dil SOAP; örnek de ondan bir parça olsun —
   öznitelik, iç içe eleman ve tekrar eden düğüm bir arada. */
const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<istem id="55120" durum="2">
  <hasta tc="11111111110">
    <ad>Örnek Hasta</ad>
    <dogum>1984-03-17</dogum>
  </hasta>
  <tetkik kod="RAD-001">Akciğer Grafisi</tetkik>
  <tetkik kod="RAD-014">Toraks BT</tetkik>
  <aciklama><![CDATA[Kontrol & takip < 30 gün]]></aciklama>
</istem>`;

const SAMPLE_JSON = JSON.stringify(
  { istem: { '@id': 55120, hasta: { '@tc': '11111111110', ad: 'Örnek Hasta' } } },
  null,
  2,
);

export default function XmlJsonTool() {
  const { t } = useI18n();
  const [direction, setDirection] = useState<XmlJsonDirection>('toJson');
  const [xml, setXml] = useState(SAMPLE_XML);
  const [json, setJson] = useState(SAMPLE_JSON);
  const [attributes, setAttributes] = useState(true);
  const [inferTypes, setInferTypes] = useState(true);

  const toJson = direction === 'toJson';
  const input = toJson ? xml : json;
  const result = convertXmlJson(input, { direction, attributes, inferTypes, indent: 2 });

  return (
    <ConverterShell
      input={input}
      onInputChange={toJson ? setXml : setJson}
      result={result}
      inputLabel={toJson ? t.xmlJson.xml : t.xmlJson.json}
      outputLabel={toJson ? t.xmlJson.json : t.xmlJson.xml}
      placeholder={toJson ? t.xmlJson.placeholderXml : t.xmlJson.placeholderJson}
      toolbar={
        <>
          <SegmentedControl
            ariaLabel={t.xmlJson.directionAria}
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'toJson', label: t.xmlJson.toJson },
              { value: 'toXml', label: t.xmlJson.toXml },
            ]}
          />

          {toJson && (
            <>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={attributes}
                  onChange={(event) => setAttributes(event.target.checked)}
                  className="size-3.5 accent-[var(--cat)]"
                />
                {t.xmlJson.keepAttributes}
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={inferTypes}
                  onChange={(event) => setInferTypes(event.target.checked)}
                  className="size-3.5 accent-[var(--cat)]"
                />
                {t.xmlJson.inferTypes}
              </label>
            </>
          )}

          <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
            {t.xmlJson.newtonsoftNote}
          </span>
        </>
      }
    />
  );
}
