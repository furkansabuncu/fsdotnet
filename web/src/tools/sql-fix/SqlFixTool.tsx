import { useState } from 'react';
import LintShell from '../../shared/LintShell';
import { useI18n } from '../../i18n/I18nProvider';
import { analyze } from './sqlFix';

/**
 * Örnekler SQL Server'dan Oracle'a taşınan tipik bir sorgu, Delphi'den
 * kopyalanmış bir string ifadesi ve yapıştırma hasarı. Tablo adları
 * uydurma — araç şema görmüyor, örneklerin de gerçek bir şemayı
 * anlatması gerekmiyor.
 */
const SAMPLES = {
  tsql: [
    'SELECT TOP 10 [ad], ISNULL(s.tutar, 0) AS tutar,',
    'FROM siparis AS s',
    'INNER JOIN kitap AS k ON k.kitap_id = s.kitap_id',
    'WHERE s.kanal_id = @kanal AND k.baslik = "Sessiz Ev"',
    'ORDER BY s.siparis_tarihi DESC;',
  ].join('\n'),

  delphi: [
    "'select k.baslik, k.fiyat from kitap k ' +",
    "'where k.tur_id = :tur and k.fiyat > :alt_sinir '",
  ].join('\n'),

  /* Kırılmaz boşluk ve akıllı tırnak kaçış dizisiyle yazılıyor: kaynak
     dosyaya olduğu gibi konsalar gözle ayırt edilemez ve bir sonraki
     düzenlemede sessizce kaybolurlardı. */
  paste: ['SQL> select ad, soyad from uye', '  2  where uye_id = 42 and ad = ‘Ali’;'].join('\n'),
} as const;

type SampleKey = keyof typeof SAMPLES;

export default function SqlFixTool() {
  const { t } = useI18n();
  const [input, setInput] = useState<string>(SAMPLES.tsql);

  return (
    <LintShell
      input={input}
      onInputChange={setInput}
      analysis={analyze(input)}
      rules={t.sqlFix.rules}
      labels={t.sqlFix}
      toolbar={(['tsql', 'delphi', 'paste'] as SampleKey[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setInput(SAMPLES[key])}
          className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          {t.sqlFix.samples[key]}
        </button>
      ))}
    />
  );
}
