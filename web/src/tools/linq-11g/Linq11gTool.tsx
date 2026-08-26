import { useState } from 'react';
import LintShell from '../../shared/LintShell';
import { useI18n } from '../../i18n/I18nProvider';
import { analyze } from './linq11g';

/**
 * Örnek, 11g'de patlayan tipik bir engine metodu. Depo ve varlık adları
 * uydurma; kuralların hiçbiri şemaya bakmıyor.
 *
 * `Where` içindeki `Any(...)` bilerek duruyor: geçerli olduğu için bulgu
 * ÜRETMEMELİ — aracın ne zaman sustuğunu göstermek, ne bulduğunu
 * göstermek kadar önemli.
 */
const SAMPLE = [
  'var alt = uow.SiparisRepository.Query();',
  '',
  'if (await uow.KitapRepository.Query().AnyAsync(k => k.kitap_id == id, ct))',
  '{',
  '    return null;',
  '}',
  '',
  'var liste = await uow.KitapRepository.Query()',
  '    .Where(k => alt.Any(s => s.kitap_id == k.kitap_id) && ids.Contains(k.tur_id))',
  '    .Select(k => new KitapCevap',
  '    {',
  '        Baslik  = k.baslik,',
  '        Tukendi = k.stok == 0,',
  '        Kapakli = k.kapak_gorsel != null,',
  '    })',
  '    .Skip(20).Take(10)',
  '    .ToListAsync(ct);',
].join('\n');

export default function Linq11gTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);

  return (
    <LintShell
      input={input}
      onInputChange={setInput}
      analysis={analyze(input)}
      rules={t.linq11g.rules}
      labels={t.linq11g}
      toolbar={
        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          {t.linq11g.sample}
        </button>
      }
    />
  );
}
