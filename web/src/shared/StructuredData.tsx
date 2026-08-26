/**
 * Google'a sayfanın NE olduğunu makine okunur biçimde söyleyen JSON-LD.
 *
 * Neden değer: araç rehberlerinde zaten gerçek soru-cevap çiftleri var.
 * `FAQPage` olarak işaretlendiklerinde arama sonucunda sorular açılır
 * biçimde çıkabiliyor — aynı içerik, çok daha büyük bir alan. `Breadcrumb`
 * ise sonuçtaki adres satırını "fsdotnet › .NET & Data › SQL Fixer" hâline
 * getiriyor.
 *
 * `<head>`e taşınmıyor: React 19 yalnızca `title`, `meta` ve `link`
 * etiketlerini hoist ediyor, ayrıca JSON-LD gövdede de geçerli — Google
 * belgesi açıkça "sayfanın herhangi bir yerinde" diyor. Ön-render'ın
 * `HEAD_TAG` kalıbı da bu yüzden bunu yakalamıyor, olduğu yerde kalıyor.
 */
export default function StructuredData({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      /* JSON.stringify çıktısı HTML'e gömülüyor: `</script>` içeren bir
         metin belgeyi erkenden kapatırdı. Kaçış tek karakterlik ve
         JSON tarafında anlamı değişmiyor. */
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
