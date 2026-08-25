import { err, ok, type ToolResult } from '../types';

/**
 * RTF `\ansicpg<N>` kod sayfası numarasından tarayıcının TextDecoder etiketine.
 *
 * Tek byte'lı sayfaların hepsi Encoding Standard'da zorunlu, yani tabloya
 * ihtiyaç yok — decoder işi yapıyor. Çok byte'lı olanlar (932/936/949/950)
 * da destekleniyor; bu yüzden `\'hh` byte'ları tek tek değil, ARDIŞIK KOŞU
 * hâlinde biriktirilip birlikte çözülüyor.
 */
const CODEPAGE_LABELS: Record<number, string> = {
  874: 'windows-874',
  932: 'shift_jis',
  936: 'gbk',
  949: 'euc-kr',
  950: 'big5',
  1250: 'windows-1250',
  1251: 'windows-1251',
  1252: 'windows-1252',
  1253: 'windows-1253',
  1254: 'windows-1254',
  1255: 'windows-1255',
  1256: 'windows-1256',
  1257: 'windows-1257',
  1258: 'windows-1258',
  10000: 'macintosh',
  65001: 'utf-8',
};

export const SUPPORTED_CODEPAGES = [1254, 1252, 1250, 1251, 1253, 1257, 65001] as const;

/**
 * İçeriği metin OLMAYAN hedefler — tamamı atlanır.
 *
 * `\*` ile işaretlenmiş her hedef de atlanır (spec'in "anlamıyorsan atla"
 * kuralı). Bu listede olmayan bir hedefin metni çıktıya girer; liste bilerek
 * dar tutuldu, çünkü fazladan eleman eklemek METİN KAYBETTİRİR.
 */
const SKIP_DESTINATIONS = new Set([
  'fonttbl',
  'colortbl',
  'stylesheet',
  'listtable',
  'listoverridetable',
  'revtbl',
  'rsidtbl',
  'generator',
  'info',
  'pict',
  'object',
  'objdata',
  'themedata',
  'colorschememapping',
  'latentstyles',
  'datastore',
  'xmlnstbl',
  'filetbl',
  'panose',
  'falt',
  'fname',
]);

/** Metin üreten kontrol sözcükleri. */
const TEXT_CONTROLS: Record<string, string> = {
  par: '\n',
  sect: '\n',
  line: '\n',
  page: '\n',
  tab: '\t',
  cell: '\t',
  row: '\n',
  nestcell: '\t',
  nestrow: '\n',
  emdash: '—',
  endash: '–',
  lquote: '‘',
  rquote: '’',
  ldblquote: '“',
  rdblquote: '”',
  bullet: '•',
  enspace: ' ',
  emspace: ' ',
};

/** `\` sonrası tek karakterlik simgeler. */
const SYMBOL_CONTROLS: Record<string, string> = {
  '\\': '\\',
  '{': '{',
  '}': '}',
  '~': ' ', // bölünmez boşluk
  '_': '‑', // bölünmez tire
  '-': '', // isteğe bağlı tire — görünmez
  '\n': '\n', // kaynak dosyadaki \<LF> paragraf demektir
  '\r': '\n',
};

interface GroupState {
  /** Bu grup ve altındakiler metin üretmez. */
  ignore: boolean;
  /** `\uN` sonrası atlanacak yedek karakter sayısı (`\ucN`). */
  ucSkip: number;
}

export interface RtfReport {
  text: string;
  /** Kullanılan kod sayfası. */
  codepage: number;
  /** Belgede `\ansicpg` bulundu mu — bulunmadıysa varsayılana düşüldü. */
  declared: boolean;
}

function isLetter(char: string | undefined): boolean {
  return char !== undefined && ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z'));
}

function isDigit(char: string | undefined): boolean {
  return char !== undefined && char >= '0' && char <= '9';
}

/**
 * RTF belgesinden düz metin çıkarır.
 *
 * Türkçe için kritik nokta kod sayfası: Delphi/DevExpress RTF'i Türkçe
 * harfleri `\'fd` gibi tek byte olarak yazar ve başlıkta `\ansicpg1254`
 * bildirir. Bu byte'ı Latin-1 sanan bir okuyucu "Tanı" yerine "Taný" üretir —
 * yani mojibake'i kaynağında yaratır.
 *
 * @param forced Bildirilen kod sayfasını ez (belgede `\ansicpg` yoksa gerekir).
 */
export function rtfToText(input: string, forced?: number): ToolResult<RtfReport> {
  if (!/^\s*\{\s*\\rtf/.test(input)) return err('rtfNotRtf');

  const declaredMatch = /\\ansicpg(\d+)/.exec(input);
  const declared = declaredMatch !== null;
  const requested = forced ?? (declaredMatch ? Number(declaredMatch[1]) : 1252);

  // Bilinmeyen sayfa: 1252'ye düş. Atmak yerine düşmek doğru — kullanıcı
  // yine de metnin çoğunu görsün, sonra elle kod sayfası seçebilsin.
  // Rapor GERÇEKTEN kullanılanı taşır: "cp99999 kullanıldı" demek yalan olur.
  const label = CODEPAGE_LABELS[requested];
  const codepage = label === undefined ? 1252 : requested;
  const decoder = new TextDecoder(label ?? 'windows-1252');

  const out: string[] = [];
  let byteRun: number[] = [];

  /** Biriken kod sayfası byte'larını tek seferde çöz — çok byte'lı sayfalar
      ancak böyle doğru çalışır. */
  const flush = () => {
    if (byteRun.length > 0) {
      out.push(decoder.decode(new Uint8Array(byteRun)));
      byteRun = [];
    }
  };

  const stack: GroupState[] = [{ ignore: false, ucSkip: 1 }];
  let group = stack[0] as GroupState;
  /** `\uN` sonrası atlanacak yedek karakter sayacı. */
  let skip = 0;

  let i = 0;
  while (i < input.length) {
    const char = input[i] as string;

    if (char === '{') {
      flush();
      group = { ignore: group.ignore, ucSkip: group.ucSkip };
      stack.push(group);
      skip = 0;
      i += 1;
      continue;
    }

    if (char === '}') {
      flush();
      stack.pop();
      group = stack[stack.length - 1] ?? { ignore: false, ucSkip: 1 };
      skip = 0;
      i += 1;
      continue;
    }

    if (char !== '\\') {
      // Kaynak dosyadaki satır sonu RTF'in kendi biçimidir, metin değil.
      if (char === '\r' || char === '\n') {
        i += 1;
        continue;
      }
      if (skip > 0) {
        skip -= 1;
      } else if (!group.ignore) {
        flush();
        out.push(char);
      }
      i += 1;
      continue;
    }

    const next = input[i + 1];
    if (next === undefined) break;

    // \'hh — kod sayfası byte'ı
    if (next === "'") {
      const hex = input.slice(i + 2, i + 4);
      i += 4;
      if (skip > 0) {
        skip -= 1;
      } else if (!group.ignore) {
        const byte = Number.parseInt(hex, 16);
        if (!Number.isNaN(byte)) byteRun.push(byte);
      }
      continue;
    }

    // Kontrol sözcüğü: \word[-]<digits>[ ]
    if (isLetter(next)) {
      let j = i + 1;
      while (isLetter(input[j])) j += 1;
      const word = input.slice(i + 1, j);

      let param: number | undefined;
      let numStart = j;
      if (input[j] === '-') j += 1;
      while (isDigit(input[j])) j += 1;
      if (j > numStart) param = Number(input.slice(numStart, j));

      // Tek bir boşluk sözcüğün sonlandırıcısıdır, metin değildir.
      if (input[j] === ' ') j += 1;
      i = j;

      if (word === 'u') {
        // \uN — negatif değerler işaretli 16-bit olarak yazılır.
        if (param !== undefined) {
          if (!group.ignore) {
            flush();
            out.push(String.fromCharCode(param < 0 ? param + 0x10000 : param));
          }
          skip = group.ucSkip;
        }
        continue;
      }

      if (word === 'uc') {
        if (param !== undefined) group.ucSkip = param;
        continue;
      }

      if (word === 'bin') {
        // Ardından ham ikili veri gelir; metin değil, atlanmalı.
        if (param !== undefined && param > 0) i += param;
        continue;
      }

      if (SKIP_DESTINATIONS.has(word)) {
        group.ignore = true;
        continue;
      }

      const text = TEXT_CONTROLS[word];
      if (text !== undefined && !group.ignore) {
        flush();
        out.push(text);
      }
      // Diğer her şey biçimlendirme (\b, \fs20, \pard…) — sessizce düşer.
      continue;
    }

    // \* — "anlamadığın bu hedefi atla"
    if (next === '*') {
      group.ignore = true;
      i += 2;
      continue;
    }

    const symbol = SYMBOL_CONTROLS[next];
    i += 2;
    if (symbol !== undefined && symbol !== '' && !group.ignore) {
      if (skip > 0) skip -= 1;
      else {
        flush();
        out.push(symbol);
      }
    }
  }

  flush();

  // Satır sonlarını normalize et ve baştaki/sondaki boşluğu at; RTF neredeyse
  // her zaman kapanış öncesi fazladan bir \par taşır.
  const text = out.join('').replace(/[ \t]+\n/g, '\n').trim();

  return ok({ text, codepage, declared });
}
