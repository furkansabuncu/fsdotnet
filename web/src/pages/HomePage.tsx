import { Keyboard, ShieldCheck, Zap } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { CATEGORIES, categoryVars } from '../tools/categories';
import { CLIENT_COUNT, TOTAL_COUNT, toolsByCategory } from '../tools/registry';
import HeroDemo from '../shared/HeroDemo';
import Seo, { SITE_URL } from '../shared/Seo';
import StructuredData from '../shared/StructuredData';
import { websiteSchema } from '../shared/schema';
import ToolCard from '../shared/ToolCard';


/**
 * Kart girişi açılışta bir kez oynar, scroll'da DEĞİL — scroll ile beliren
 * içerik, günde defalarca giren kullanıcıyı animasyon bitene kadar bekletir.
 * Gecikme 300ms'de sınırlanıyor ki alttaki kartlar sıraya girmesin.
 */
const staggerDelay = (index: number) => ({
  animationDelay: `${Math.min(index * 20, 300)}ms`,
});

export default function HomePage() {
  const { t, locale } = useI18n();
  const groups = toolsByCategory();
  let cardIndex = 0;

  const stats = [
    { icon: Zap, label: t.home.statReady(TOTAL_COUNT) },
    { icon: ShieldCheck, label: t.home.statClient(CLIENT_COUNT) },
    { icon: Keyboard, label: t.home.statPrivacy },
  ];

  return (
    <div className="flex flex-col gap-10 py-8">
      <Seo title={t.seo.homeTitle} description={t.seo.homeDescription} path="/" locale={locale} />

      <StructuredData
        data={websiteSchema(
          { siteUrl: SITE_URL, locale },
          { name: t.seo.homeTitle, description: t.seo.homeDescription },
        )}
      />

      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div className="flex flex-col gap-4">
          <h1 className="max-w-2xl text-[28px] leading-9 font-semibold tracking-tight text-fg">
            {t.home.titleBefore}
            <span
              style={categoryVars('dotnet')}
              className="bg-gradient-to-r from-cat to-accent bg-clip-text text-transparent"
            >
              {t.home.titleAccent}
            </span>
            {t.home.titleAfter}
          </h1>

          <p className="max-w-xl text-sm leading-6 text-muted">{t.home.subtitle}</p>

          <ul className="flex flex-wrap items-center gap-2">
            {stats.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-[11px] text-muted"
              >
                <Icon size={12} className="text-subtle" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <HeroDemo />
      </section>

      {groups.map(({ category, tools }) => {
        const Icon = CATEGORIES[category].icon;
        const meta = t.categories[category];

        return (
          /* id: sol raydaki ve footer'daki /#<kategori> bağlantılarının hedefi.
             scroll-mt: yapışkan header'ın altında kalmasın. */
          <section
            key={category}
            id={category}
            style={categoryVars(category)}
            className="flex scroll-mt-16 flex-col gap-3"
          >
            <header className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-cat-bg">
                <Icon size={15} className="text-cat" aria-hidden="true" />
              </span>
              <h2 className="shrink-0 text-[15px] font-semibold tracking-tight text-fg">
                {meta.label}
              </h2>
              <span className="hidden shrink-0 text-xs text-subtle md:inline">{meta.blurb}</span>
              {/* Bölüm sınırını görünür kılan ince çizgi: başlıkla sayaç
                  arasındaki boşluğu doldurur, bölümleri birbirinden ayırır. */}
              <span aria-hidden="true" className="h-px flex-1 bg-border-subtle" />
              <span className="shrink-0 font-mono text-[11px] text-subtle">{tools.length}</span>
            </header>

            <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
              {tools.map((tool) => (
                <li key={tool.id} className="card-in" style={staggerDelay(cardIndex++)}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
