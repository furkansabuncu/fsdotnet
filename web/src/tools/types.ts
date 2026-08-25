import type { ComponentType, LazyExoticComponent } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ToolCategory =
  | 'dotnet'
  | 'converters'
  | 'formatters'
  | 'security'
  | 'testing'
  | 'web';

/**
 * Katalogdaki her aracın kimliği.
 *
 * Açık bir birleşim tipi olması, sözlükteki `toolDescriptions` nesnesinin
 * `Record<ToolId, string>` ile doğrulanabilmesini sağlıyor: yeni bir araç
 * eklenip açıklaması yazılmazsa proje derlenmez.
 */
export type ToolId =
  | 'base64'
  | 'mojibake'
  | 'rtf'
  | 'unicode'
  | 'case'
  | 'tr-data'
  | 'in-list'
  | 'ora-errors'
  | 'bind-params'
  | 'sql-diff'
  | 'json-to-csharp'
  | 'sql-to-linq'
  | 'xml-json'
  | 'csv-json'
  | 'epoch'
  | 'sql-format'
  | 'code-format'
  | 'jwt'
  | 'hash'
  | 'uuid'
  | 'regex'
  | 'cron'
  | 'http-status'
  | 'color';

/**
 * Aracın nerede çalıştığı.
 *
 * 'client' varsayılandır: girdi tarayıcıdan hiç çıkmaz. Bir aracın 'server'
 * olması ancak gerçek bir parser/derleyici gerektiriyorsa kabul edilir
 * (ör. T-SQL → LINQ). Gerekçe: docs/adr/0001-client-side-by-default.md
 */
export type ToolRuntime = 'client' | 'server';

interface ToolBase {
  /** URL slug — /t/<id>. */
  id: ToolId;
  /**
   * Araç adı çevrilmez: "Base64", "JWT Decoder", "SQL → LINQ" gibi teknik
   * terimler Türkçe arayüzde de aynı okunur. Açıklama sözlükte
   * (`toolDescriptions`), ad burada.
   */
  name: string;
  /**
   * İsimde GEÇMEYEN arama terimleri — her iki dilde de. Arama açıklamaya
   * bakmaz (açıklama artık sözlükte), o yüzden Türkçe karşılıklar buraya
   * yazılır: kullanıcı "bozuk metin" arayınca Mojibake çıkmalı.
   */
  keywords: string[];
  category: ToolCategory;
  runtime: ToolRuntime;
  icon: LucideIcon;
}

/**
 * Araç durumu bir birleşim tipi: 'soon' bir aracın component'i olamaz,
 * 'ready' bir aracın component'i olmak zorunda. Planlanan bir aracı
 * yanlışlıkla route'lamak derleme hatası verir.
 */
export type ToolDefinition = ToolBase &
  (
    | { status: 'ready'; component: LazyExoticComponent<ComponentType> }
    | { status: 'soon'; component?: never }
  );

/**
 * Araç fonksiyonlarının döndürebileceği hata türleri.
 *
 * Düz metin değil ANAHTAR: mesajın kendisi sözlükte (`errors`), çünkü saf bir
 * dönüşüm fonksiyonu hangi dilde konuşulduğunu bilemez ve bilmemeli.
 */
export type ToolErrorKey =
  | 'base64Alphabet'
  | 'base64Length'
  | 'base64Utf8'
  | 'rtfNotRtf'
  | 'sqlInvalid'
  | 'epochEmpty'
  | 'epochUnparsable'
  | 'epochOutOfRange'
  | 'jwtEmpty'
  | 'jwtShape'
  | 'jwtSegment'
  | 'jwtJson'
  | 'colorEmpty'
  | 'colorInvalid'
  | 'csvEmpty'
  | 'csvNoRows'
  | 'inListEmpty'
  | 'jsonEmpty'
  | 'jsonInvalid'
  | 'jsonNotObject'
  | 'xmlEmpty'
  | 'xmlInvalid'
  | 'xmlRootShape'
  | 'xmlBadName'
  | 'formatUnknownLanguage'
  | 'cronEmpty'
  | 'cronFieldCount'
  | 'cronField'
  | 'cronUnreachable'
  | 'regexEmpty'
  | 'regexInvalid'
  | 'regexServerDown'
  | 'sqlSelectOnly'
  | 'sqlNoFrom';

/**
 * Her araç fonksiyonunun ortak dönüş tipi. Araçlar exception fırlatmaz —
 * geçersiz girdi beklenen bir durumdur, istisna değil.
 *
 * `detail` isteğe bağlı ve ÇEVRİLMEZ: ayrıştırıcıların ürettiği konum
 * (`4:12`), bozuk alan adı ya da motorun kendi mesajı gibi, kaynağı girdi
 * olan parçalar. Çevrilebilir kısım her zaman `error` anahtarındadır.
 */
export type ToolResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ToolErrorKey; detail?: string };

export function ok<T>(value: T): ToolResult<T> {
  return { ok: true, value };
}

export function err<T = never>(error: ToolErrorKey, detail?: string): ToolResult<T> {
  return detail === undefined ? { ok: false, error } : { ok: false, error, detail };
}
