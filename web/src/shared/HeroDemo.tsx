import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { categoryVars } from '../tools/categories';
import { ok, type ToolCategory, type ToolResult } from '../tools/types';
import { decodeBase64, encodeBase64 } from '../tools/base64/base64';
import { repairMojibake } from '../tools/mojibake/mojibake';

interface DemoScript {
  toolId: string;
  /** Terminal başlığında görünen "araç · mod" etiketi. */
  label: string;
  category: ToolCategory;
  input: string;
  run: (input: string) => ToolResult<string>;
}

/**
 * Demo yalnızca GERÇEKTEN YAZILMIŞ araçları oynatır — çıktılar sabit metin
 * değil, araç sayfasının çağırdığı fonksiyonun aynısından geliyor. Yeni bir
 * araç bittiğinde buraya bir satır eklenir.
 */
const SCRIPTS: readonly DemoScript[] = [
  {
    toolId: 'base64',
    label: 'base64 · encode',
    category: 'converters',
    input: 'héllo 🌍',
    run: (value) => encodeBase64(value),
  },
  {
    toolId: 'base64',
    label: 'base64 · url-safe',
    category: 'converters',
    input: 'https://fsbox.dev/?q=a+b',
    run: (value) => encodeBase64(value, { urlSafe: true }),
  },
  {
    toolId: 'mojibake',
    label: 'mojibake · repair',
    category: 'converters',
    input: 'TüÃrkçÃe metin bozulmuşÅ göÃrüÃnüÃyor',
    run: (value) => ok(repairMojibake(value).text),
  },
  {
    toolId: 'base64',
    label: 'base64 · decode',
    category: 'converters',
    input: 'ZnNib3ggLS0gLk5FVCB0b29sYm94',
    run: decodeBase64,
  },
];

const TYPE_MS = 55;
const HOLD_MS = 2200;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function HeroDemo() {
  const { t } = useI18n();
  const [scriptIndex, setScriptIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [paused, setPaused] = useState(false);

  const reducedMotion = prefersReducedMotion();
  const script = SCRIPTS[scriptIndex] ?? SCRIPTS[0]!;

  /**
   * Tek effect, tek zamanlayıcı: yaz → bekle → sıradaki senaryo.
   * İki ayrı effect'i aynı state'e bağlamak yarış durumu üretiyordu.
   */
  useEffect(() => {
    if (reducedMotion) {
      setTyped(script.input);
      return;
    }
    if (paused) return;

    if (typed.length < script.input.length) {
      const timer = setTimeout(
        () => setTyped(script.input.slice(0, typed.length + 1)),
        TYPE_MS,
      );
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setScriptIndex((index) => (index + 1) % SCRIPTS.length);
      setTyped('');
    }, HOLD_MS);
    return () => clearTimeout(timer);
  }, [typed, script, paused, reducedMotion]);

  /* Kısmi girdi çoğu zaman geçersizdir (yarım base64 gibi) — o anda çıktı
     yok. Araç sayfasındaki "son geçerli sonucu koru" davranışı burada
     kullanılmıyor: senaryolar arası geçişte önceki aracın çıktısı sızardı. */
  const result = script.run(typed);
  const output = result.ok ? result.value : '';

  return (
    <div
      style={categoryVars(script.category)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-elev-2"
    >
      <div className="flex h-8 items-center gap-2 border-b border-border-subtle bg-surface-2 px-3">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-2 rounded-full bg-surface-3" />
          <span className="size-2 rounded-full bg-surface-3" />
          <span className="size-2 rounded-full bg-surface-3" />
        </span>
        <span className="font-mono text-[11px] text-subtle">{script.label}</span>
        <Link
          to={`/t/${script.toolId}`}
          className="ml-auto flex items-center gap-1 font-mono text-[11px] text-subtle transition-colors hover:text-cat"
        >
          {t.demo.open}
          <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>

      {/* Canlı daktilo animasyonu ekran okuyucuda gürültüdür; altta sabit bir
          özet var. */}
      {/* Taban yükseklik iki işe yarıyor: panel sol kolonla dengeleniyor, ve
          girdi bir satırdan ikiye taşarken kutu zıplamıyor. */}
      <div
        aria-hidden="true"
        className="grid min-h-[132px] content-start gap-1 p-3 font-mono text-sm leading-6"
      >
        <div className="min-h-6 break-all text-fg">
          {typed}
          <span className="caret text-cat">▍</span>
        </div>
        <div className="min-h-6 break-all text-cat">{output}</div>
      </div>

      <p className="sr-only">
        {t.demo.summary}
      </p>
    </div>
  );
}
