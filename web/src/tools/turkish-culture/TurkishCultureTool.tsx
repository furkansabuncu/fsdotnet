import { useState } from 'react';
import LintShell from '../../shared/LintShell';
import { useI18n } from '../../i18n/I18nProvider';
import { analyze } from './turkishCulture';

/**
 * Örnek, geliştirme makinesinde kusursuz çalışıp Türkçe bir sunucuda
 * bozulan tipik bir doğrulama metodu. Son satır bilerek doğru yazılmış:
 * aracın ne zaman SUSTUĞUNU göstermek, ne bulduğunu göstermek kadar önemli.
 */
const SAMPLE = [
  'public bool DosyaGecerli(string ad, string boyutMetni)',
  '{',
  '    if (ad.ToUpper() == "FILE") return false;',
  '    if (!ad.EndsWith(".pdf")) return false;',
  '',
  '    var boyut = double.Parse(boyutMetni);',
  '    var etiket = string.Format("{0:N2} MB", boyut);',
  '    logger.LogInformation(etiket + " " + DateTime.Now.ToString("dd/MM/yyyy"));',
  '',
  '    return ad.StartsWith("TR", StringComparison.Ordinal);',
  '}',
].join('\n');

export default function TurkishCultureTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);

  return (
    <LintShell
      input={input}
      onInputChange={setInput}
      analysis={analyze(input)}
      rules={t.turkishCulture.rules}
      labels={t.turkishCulture}
      toolbar={
        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          {t.turkishCulture.sample}
        </button>
      }
    />
  );
}
