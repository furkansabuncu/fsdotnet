export interface ToolGuideContent {
  /** Bölümün `h2`si — sorunun adı, aracın adı değil. */
  heading: string;
  body: string[];
  faq: { q: string; a: string }[];
}

/**
 * Aracın altındaki açıklama bölümü.
 *
 * İki iş yapıyor. Birincisi arama: bu tür sayfaların sıralanma sebebi
 * aracın kendisi değil, altındaki metindir — "Türkçe karakterler neden
 * Ã¼ oluyor" bir arama sorgusu, "Mojibake Fixer" değil. İkincisi ise ilk kez
 * gelen ziyaretçi: iki kutu ve bir düğme, bu şeyin ne zaman işine
 * yarayacağını söylemiyor.
 *
 * ToolPage içinde duruyor, aracın kendi component'inde DEĞİL — araç `lazy`
 * yükleniyor, yani metni oraya koymak onu hem ilk boyamadan hem de ileride
 * eklenecek ön-render çıktısından dışarıda bırakırdı.
 */
export default function ToolGuide({ guide }: { guide: ToolGuideContent }) {
  return (
    <article className="mt-4 flex max-w-[70ch] flex-col gap-4 border-t border-border-subtle pt-8">
      <h2 className="text-lg font-semibold tracking-tight text-fg">{guide.heading}</h2>

      {guide.body.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-6 text-muted">
          {paragraph}
        </p>
      ))}

      {guide.faq.length > 0 && (
        <dl className="mt-2 flex flex-col gap-4">
          {guide.faq.map((entry) => (
            <div key={entry.q} className="flex flex-col gap-1.5">
              {/* `dt` başlık rolü taşımıyor; soruları içeriye `h3` olarak
                  koymak sayfanın anahat yapısını doğru kuruyor. */}
              <dt>
                <h3 className="text-sm font-medium text-fg">{entry.q}</h3>
              </dt>
              <dd className="text-sm leading-6 text-muted">{entry.a}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
