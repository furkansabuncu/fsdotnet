/**
 * Paket boyutu bütçesi.
 *
 * Kayıt defteri büyüdükçe giriş paketi de büyüyor ve bunu kimse ölçmüyorsa
 * gerileme ancak birinin aklına gelince fark ediliyor. Burada ölçülen şey
 * "toplam çıktı" değil — ÖNEMLİ OLAN İLK YÜKLEME: her ziyaretçinin indirdiği
 * giriş paketi ile CSS. Araç paketleri tembel yükleniyor, yani bir aracın
 * ağırlığı yalnızca o aracı açanı ilgilendiriyor; onlara ayrı ve gevşek bir
 * tavan konuyor ki tek bir bağımlılık sessizce şişmesin.
 *
 * Ölçü gzip'li: kullanıcı telin üstünden onu indiriyor. Ham boyut yalnızca
 * ayrıştırma maliyetine dair bir ipucu, o yüzden raporda var ama bütçede yok.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const KB = 1024;

/*
 * Tavanlar ölçülen değerin biraz üstünde: bütçe, farkında olmadan büyümeyi
 * yakalamak için var, her commit'te elle güncellenecek bir sayı olmak için
 * değil. Bir tavanı yükseltmek serbest — ama bilerek ve tek başına bir
 * değişiklik olarak.
 */
const BUDGET = {
  /* Giriş paketi + CSS: router, kayıt defteri, i18n sözlükleri, kabuk. */
  firstLoad: 200 * KB,
  /* Tek bir tembel parça. `sqlFormat` (sql-formatter) şu an en büyüğü. */
  chunk: 90 * KB,
};

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'assets');

const files = readdirSync(assets)
  .filter((name) => name.endsWith('.js') || name.endsWith('.css'))
  .map((name) => {
    const bytes = readFileSync(join(assets, name));
    return { name, raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
  });

/* Giriş paketinin adı `index-<özet>.js`; tembel parçalar component adını
   taşıyor. Ada bakmak kırılgan görünüyor ama Vite'ın `entryFileNames`
   ayarıyla belirlenmiş bir sözleşme, ve alternatifi manifest okumak — o da
   yalnızca `build.manifest` açıkken var. */
const isEntry = (name) => /^index-[A-Za-z0-9_-]+\.(js|css)$/.test(name);

const entry = files.filter((file) => isEntry(file.name));
const chunks = files.filter((file) => !isEntry(file.name)).sort((a, b) => b.gzip - a.gzip);

const firstLoad = entry.reduce((total, file) => total + file.gzip, 0);
const kb = (bytes) => `${(bytes / KB).toFixed(1)} kB`;

console.log(`first load  ${kb(firstLoad)} gzip / ${kb(entry.reduce((t, f) => t + f.raw, 0))} raw`);
for (const file of chunks.slice(0, 3)) console.log(`  ${file.name.padEnd(34)} ${kb(file.gzip)} gzip`);
console.log(`${chunks.length} lazy chunks`);

const over = [];
if (firstLoad > BUDGET.firstLoad) over.push(`first load ${kb(firstLoad)} > ${kb(BUDGET.firstLoad)}`);
for (const file of chunks) {
  if (file.gzip > BUDGET.chunk) over.push(`${file.name} ${kb(file.gzip)} > ${kb(BUDGET.chunk)}`);
}

if (over.length > 0) {
  console.error(`\nbundle budget exceeded:\n${over.map((line) => `  ${line}`).join('\n')}`);
  console.error('\nRaise the limit in scripts/size.mjs only as a deliberate, separate change.');
  process.exit(1);
}
