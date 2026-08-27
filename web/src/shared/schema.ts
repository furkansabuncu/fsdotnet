import { absoluteUrl, type Locale } from '../i18n/locale';
import type { ToolGuideContent } from './ToolGuide';

/**
 * JSON-LD nesneleri.
 *
 * Saf fonksiyonlar, component değil: çıktı arama motoruna gidiyor ve
 * gözle kontrol edilmiyor, yani test edilebilir olması şart. Bir alan
 * sessizce boş kalırsa kimse fark etmez — Google da o işaretlemeyi yok
 * sayar ve neden sıralanmadığımızı aylarca aramayız.
 */

const SITE_NAME = 'fsdotnet';

export interface SchemaContext {
  siteUrl: string;
  locale: Locale;
}

/** Ana sayfa: sitenin kendisi. */
export function websiteSchema(
  { siteUrl, locale }: SchemaContext,
  { name, description }: { name: string; description: string },
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: name,
    description,
    url: absoluteUrl(siteUrl, locale),
    inLanguage: locale,
  };
}

export interface ToolSchemaInput {
  /** Araç adı — çevrilmiyor. */
  name: string;
  description: string;
  /** Dil öneki olmadan yol: `/t/base64`. */
  path: string;
  /** Kırıntı yolundaki ana sayfa etiketi. */
  homeLabel: string;
  categoryLabel: string;
  guide?: ToolGuideContent;
}

/**
 * Araç sayfası: uygulamanın kendisi, kırıntı yolu ve — rehberi varsa —
 * soru-cevaplar.
 *
 * `FAQPage` yalnızca sayfada GERÇEKTEN görünen sorular için üretiliyor.
 * Kullanıcının göremediği bir soruyu işaretlemek Google'ın yapılandırılmış
 * veri politikasının ihlali ve yaptırımı sayfanın tamamen düşmesi.
 */
export function toolSchema(
  { siteUrl, locale }: SchemaContext,
  { name, description, path, homeLabel, categoryLabel, guide }: ToolSchemaInput,
): object[] {
  const url = absoluteUrl(siteUrl, locale, path);

  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `${name} · ${SITE_NAME}`,
      description,
      url,
      applicationCategory: 'DeveloperApplication',
      // Tarayıcıda çalışıyor, yani kurulum yok ve her işletim sistemi geçerli.
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      inLanguage: locale,
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: homeLabel, item: absoluteUrl(siteUrl, locale) },
        { '@type': 'ListItem', position: 2, name: categoryLabel },
        { '@type': 'ListItem', position: 3, name, item: url },
      ],
    },
  ];

  if (guide !== undefined && guide.faq.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faq.map((entry) => ({
        '@type': 'Question',
        name: entry.q,
        acceptedAnswer: { '@type': 'Answer', text: entry.a },
      })),
    });
  }

  return schemas;
}

export interface RuleSchemaInput {
  title: string;
  hint: string;
  /** Dil öneki olmadan yol: `/r/sql-fix-glued-keyword`. */
  path: string;
  homeLabel: string;
  catalogLabel: string;
}

/**
 * Kural sayfası: teknik bir makale ve kırıntı yolu.
 *
 * `FAQPage` YOK — sayfada soru-cevap yok ve olmayan bir yapıyı işaretlemek
 * Google'ın yapılandırılmış veri politikasının ihlali, yaptırımı da sayfanın
 * tamamen düşmesi.
 */
export function ruleSchema(
  { siteUrl, locale }: SchemaContext,
  { title, hint, path, homeLabel, catalogLabel }: RuleSchemaInput,
): object[] {
  const url = absoluteUrl(siteUrl, locale, path);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: title,
      description: hint,
      url,
      inLanguage: locale,
      isAccessibleForFree: true,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl(siteUrl, locale) },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: homeLabel, item: absoluteUrl(siteUrl, locale) },
        { '@type': 'ListItem', position: 2, name: catalogLabel, item: absoluteUrl(siteUrl, locale, '/r') },
        { '@type': 'ListItem', position: 3, name: title, item: url },
      ],
    },
  ];
}
