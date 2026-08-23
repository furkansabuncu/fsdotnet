import {
  AlignLeft,
  ArrowLeftRight,
  Braces,
  CalendarClock,
  Clock,
  Database,
  Fingerprint,
  Globe,
  Hash,
  KeyRound,
  Palette,
  Regex,
  Table,
} from 'lucide-react';
import type { ToolDefinition } from './types';

/**
 * Henüz yazılmamış araçlar.
 *
 * Bunlar katalogda 'soon' rozetiyle görünür ama route'lanmaz — tip birleşimi
 * gereği component'leri yok, yani yanlışlıkla açılmaları derleme zamanında
 * engelleniyor. Bir araç yazıldığında buradan çıkar, kendi klasörüne taşınır.
 *
 * Açıklamalar burada değil sözlükte (`i18n/*.ts` → `toolDescriptions`).
 * Anahtar listesi burada yazılır: her iki dildeki arama terimleri, isimde
 * geçmeyenler.
 */
export const PLANNED_TOOLS: readonly ToolDefinition[] = [
  {
    id: 'json-to-csharp',
    name: 'JSON → C#',
    keywords: ['poco', 'class', 'record', 'roslyn', 'deserialize', 'dto', 'sınıf', 'model'],
    category: 'dotnet',
    runtime: 'server',
    icon: Braces,
    status: 'soon',
  },
  {
    id: 'sql-to-linq',
    name: 'SQL → LINQ',
    keywords: ['entity framework', 'ef core', 'query', 'scriptdom', 'tsql', 'sorgu', 'çevir'],
    category: 'dotnet',
    runtime: 'server',
    icon: Database,
    status: 'soon',
  },
  {
    id: 'xml-json',
    name: 'XML ⇄ JSON',
    keywords: ['soap', 'xsd', 'attribute', 'namespace', 'dönüştür', 'öznitelik'],
    category: 'converters',
    runtime: 'client',
    icon: ArrowLeftRight,
    status: 'soon',
  },
  {
    id: 'csv-json',
    name: 'CSV → JSON / SQL',
    keywords: ['excel', 'tsv', 'delimiter', 'insert into', 'seed', 'tablo', 'ayraç'],
    category: 'converters',
    runtime: 'client',
    icon: Table,
    status: 'soon',
  },
  {
    id: 'epoch',
    name: 'Epoch Converter',
    keywords: ['unix', 'timestamp', 'utc', 'datetimeoffset', 'ticks', 'zaman damgası', 'tarih', 'saat'],
    category: 'converters',
    runtime: 'client',
    icon: Clock,
    status: 'soon',
  },
  {
    id: 'sql-format',
    name: 'SQL Formatter',
    keywords: ['beautify', 'pretty print', 'minify', 'tsql', 'biçimlendir', 'girintile'],
    category: 'formatters',
    runtime: 'server',
    icon: AlignLeft,
    status: 'soon',
  },
  {
    id: 'code-format',
    name: 'JSON / HTML / CSS Formatter',
    keywords: ['prettier', 'beautify', 'indent', 'minify', 'lint', 'biçimlendir', 'güzelleştir'],
    category: 'formatters',
    runtime: 'client',
    icon: Braces,
    status: 'soon',
  },
  {
    id: 'jwt',
    name: 'JWT Decoder',
    keywords: ['json web token', 'bearer', 'claims', 'exp', 'signature', 'jeton', 'çöz', 'imza'],
    category: 'security',
    runtime: 'client',
    icon: KeyRound,
    status: 'soon',
  },
  {
    id: 'hash',
    name: 'Hash & HMAC',
    keywords: ['digest', 'checksum', 'sha256', 'md5', 'signature', 'özet', 'şifrele', 'imza'],
    category: 'security',
    runtime: 'client',
    icon: Hash,
    status: 'soon',
  },
  {
    id: 'uuid',
    name: 'UUID / GUID Generator',
    keywords: ['guid', 'v4', 'v5', 'random', 'identifier', 'bulk', 'kimlik', 'benzersiz', 'üret'],
    category: 'security',
    runtime: 'client',
    icon: Fingerprint,
    status: 'soon',
  },
  {
    id: 'regex',
    name: 'Regex Tester',
    keywords: ['regular expression', 'match', 'capture group', 'pattern', 'dotnet', 'düzenli ifade', 'desen', 'eşleşme'],
    category: 'testing',
    runtime: 'server',
    icon: Regex,
    status: 'soon',
  },
  {
    id: 'cron',
    name: 'Cron Expression',
    keywords: ['crontab', 'schedule', 'quartz', 'hangfire', 'next run', 'zamanlama', 'görev', 'planla'],
    category: 'testing',
    runtime: 'client',
    icon: CalendarClock,
    status: 'soon',
  },
  {
    id: 'http-status',
    name: 'HTTP Status Codes',
    keywords: ['404', '500', 'header', 'rfc', 'aspnetcore', 'reference', 'durum kodu', 'hata kodu', 'başlık'],
    category: 'web',
    runtime: 'client',
    icon: Globe,
    status: 'soon',
  },
  {
    id: 'color',
    name: 'Color Converter',
    keywords: ['palette', 'contrast', 'accessibility', 'a11y', 'oklch', 'wcag', 'renk', 'palet', 'kontrast', 'erişilebilirlik'],
    category: 'web',
    runtime: 'client',
    icon: Palette,
    status: 'soon',
  },
];
