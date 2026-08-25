import { describe, expect, it } from 'vitest';
import { rtfToText } from './rtf';

/** Testleri okunur tutmak için: başarılı sonucun metnini döndürür. */
function text(rtf: string, forced?: number): string {
  const result = rtfToText(rtf, forced);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value.text;
}

const HEADER = String.raw`{\rtf1\ansi\ansicpg1254\deff0`;

describe('rtfToText', () => {
  describe('temel yapı', () => {
    it('düz metni çıkarır', () => {
      expect(text(String.raw`{\rtf1\ansi Merhaba}`)).toBe('Merhaba');
    });

    it('biçimlendirme kontrollerini düşürür', () => {
      expect(text(String.raw`{\rtf1\ansi\pard\f0\fs20\b Kalın\b0  düz}`)).toBe('Kalın düz');
    });

    it('kontrol sözcüğünden sonraki TEK boşluk sonlandırıcıdır, metin değil', () => {
      // \fs20 sonrası boşluk yenir; ikinci boşluk metne girer.
      expect(text(String.raw`{\rtf1\ansi\fs20  iki}`)).toBe('iki');
    });

    it('\\pard ile \\par karışmaz', () => {
      expect(text(String.raw`{\rtf1\ansi\pard A\par\pard B}`)).toBe('A\nB');
    });

    it('kaynak dosyadaki satır sonları metin değildir', () => {
      expect(text('{\\rtf1\\ansi A\r\nB}')).toBe('AB');
    });

    it('kaçırılmış süslü parantezleri metin olarak alır', () => {
      expect(text(String.raw`{\rtf1\ansi \{a\} \\ b}`)).toBe('{a} \\ b');
    });
  });

  describe('metin üreten kontroller', () => {
    it.each([
      [String.raw`{\rtf1\ansi A\par B}`, 'A\nB'],
      [String.raw`{\rtf1\ansi A\line B}`, 'A\nB'],
      [String.raw`{\rtf1\ansi A\tab B}`, 'A\tB'],
      [String.raw`{\rtf1\ansi A\emdash B}`, 'A—B'],
      [String.raw`{\rtf1\ansi \ldblquote alıntı\rdblquote}`, '“alıntı”'],
      // Sonlandırıcı boşluk yenir; gerçek RTF ayırmak için \tab ya da iki
      // boşluk yazar. Beklenti bilerek boşluksuz.
      [String.raw`{\rtf1\ansi \bullet madde}`, '•madde'],
      [String.raw`{\rtf1\ansi \bullet  madde}`, '• madde'],
    ])('%s → %j', (rtf, expected) => {
      expect(text(rtf)).toBe(expected);
    });
  });

  describe('atlanan hedefler', () => {
    it('font tablosunu çıktıya almaz', () => {
      const rtf = String.raw`{\rtf1\ansi{\fonttbl{\f0\fnil Tahoma;}}Metin}`;
      expect(text(rtf)).toBe('Metin');
    });

    it('renk tablosunu ve stylesheet\'i atlar', () => {
      const rtf = String.raw`{\rtf1\ansi{\colortbl ;\red0\green0\blue0;}{\stylesheet{\s0 Normal;}}Metin}`;
      expect(text(rtf)).toBe('Metin');
    });

    it('\\* ile işaretli hedefi atlar', () => {
      const rtf = String.raw`{\rtf1\ansi{\*\generator Riched20 10.0.19041}Metin}`;
      expect(text(rtf)).toBe('Metin');
    });

    it('\\info bloğunu atlar', () => {
      const rtf = String.raw`{\rtf1\ansi{\info{\author Biri}{\title Başlık}}Gövde}`;
      expect(text(rtf)).toBe('Gövde');
    });

    it('atlanan hedef bittikten sonra metin yeniden akar', () => {
      const rtf = String.raw`{\rtf1\ansi A{\*\generator X}B}`;
      expect(text(rtf)).toBe('AB');
    });
  });

  describe('kod sayfası — Türkçe (cp1254)', () => {
    // Delphi/DevExpress RTF'inin gerçek biçimi: Türkçe harfler tek byte.
    // cp1254: ı=FD  ğ=F0  ş=FE  ö=F6  ü=FC  ç=E7  Ö=D6  Ç=C7  İ=DD  Ş=DE  Ğ=D0
    it.each([
      [String.raw`\'fd`, 'ı'],
      [String.raw`\'f0`, 'ğ'],
      [String.raw`\'fe`, 'ş'],
      [String.raw`\'f6`, 'ö'],
      [String.raw`\'fc`, 'ü'],
      [String.raw`\'e7`, 'ç'],
      [String.raw`\'dd`, 'İ'],
      [String.raw`\'de`, 'Ş'],
      [String.raw`\'d0`, 'Ğ'],
    ])('%s → %s', (escape, expected) => {
      expect(text(`${HEADER} ${escape}}`)).toBe(expected);
    });

    it('gerçek bir rapor satırını çözer', () => {
      const rtf = `${HEADER}{\\fonttbl{\\f0\\fnil\\fcharset162 Tahoma;}}
\\viewkind4\\uc1\\pard\\f0\\fs20 Tan\\'fd: G\\'f6\\'f0\\'fcs a\\'f0r\\'fds\\'fd\\par
Sonu\\'e7: Normal\\par}`;
      expect(text(rtf)).toBe('Tanı: Göğüs ağrısı\nSonuç: Normal');
    });

    it('cp1252 olarak okunursa Türkçe harfler bozulur — regresyon koruması', () => {
      // Aynı byte'lar Latin-1'de ý/ð/þ verir. Kod sayfasını yok saymanın
      // sonucunu testte sabitliyoruz ki yanlışlıkla varsayılana düşülmesin.
      expect(text(`${HEADER} Tan\\'fd}`, 1252)).toBe('Taný');
      expect(text(`${HEADER} Tan\\'fd}`)).toBe('Tanı');
    });

    it('çok byte\'lı koşuyu birlikte çözer', () => {
      // UTF-8 olarak bildirilmiş RTF: "ş" iki byte (C5 9F).
      const rtf = String.raw`{\rtf1\ansi\ansicpg65001 ba\'c5\'9f}`;
      expect(text(rtf)).toBe('baş');
    });
  });

  describe('Unicode kaçışları', () => {
    it('\\uN karakteri üretir', () => {
      expect(text(String.raw`{\rtf1\ansi\u351 ?}`)).toBe('ş');
    });

    it('negatif \\uN 16-bit işaretli olarak yorumlanır', () => {
      // 8364 (€) işaretli 16-bit'te -57172 olarak yazılabilir.
      expect(text(String.raw`{\rtf1\ansi\u-57172 ?}`)).toBe('€');
    });

    it('\\ucN kadar yedek karakter atlanır', () => {
      expect(text(String.raw`{\rtf1\ansi\uc2\u351 ??son}`)).toBe('şson');
    });

    it('yedek olarak gelen \\\'hh de atlanır', () => {
      expect(text(String.raw`{\rtf1\ansi\uc1\u351\'3fson`.concat('}'))).toBe('şson');
    });

    it('\\uc0 hiç yedek atlamaz', () => {
      expect(text(String.raw`{\rtf1\ansi\uc0\u351 son}`)).toBe('şson');
    });
  });

  describe('ikili veri', () => {
    // \binN sonrası N byte ham veridir. Atlanmazsa çıktıya çöp dökülür —
    // bu aracın en görünür bozulma biçimi olurdu.
    it('\\binN kadar ham byte atlanır', () => {
      expect(text(String.raw`{\rtf1\ansi A\bin5 #####B}`)).toBe('AB');
    });

    it('parametresiz \\bin metni yutmaz', () => {
      expect(text(String.raw`{\rtf1\ansi A\bin B}`)).toBe('AB');
    });
  });

  describe('sağlamlık', () => {
    it('bilinmeyen kod sayfası 1252\'ye düşer ve raporda bunu söyler', () => {
      const result = rtfToText(String.raw`{\rtf1\ansi\ansicpg99999 A}`);
      expect(result).toMatchObject({ ok: true, value: { text: 'A', codepage: 1252 } });
    });

    it('kapanmamış grup metni yine de verir', () => {
      expect(text(String.raw`{\rtf1\ansi{\b A`)).toBe('A');
    });

    it('sonu yarım kalan kaçış çökmez', () => {
      expect(text('{\\rtf1\\ansi A\\')).toBe('A');
    });

    it('atlanan hedef içindeki \\u karakteri çıktıya girmez', () => {
      expect(text(String.raw`{\rtf1\ansi{\*\generator \u351 ?}A}`)).toBe('A');
    });
  });

  describe('hata durumu', () => {
    it.each(['', 'düz metin', '<html></html>', '{ \\par }'])('%j → rtfNotRtf', (input) => {
      expect(rtfToText(input)).toEqual({ ok: false, error: 'rtfNotRtf' });
    });
  });

  describe('rapor', () => {
    it('bildirilen kod sayfasını döndürür', () => {
      const result = rtfToText(`${HEADER} A}`);
      expect(result).toMatchObject({ ok: true, value: { codepage: 1254, declared: true } });
    });

    it('\\ansicpg yoksa 1252\'ye düşer ve bunu bildirir', () => {
      const result = rtfToText(String.raw`{\rtf1\ansi A}`);
      expect(result).toMatchObject({ ok: true, value: { codepage: 1252, declared: false } });
    });

    it('elle seçilen kod sayfası bildirileni ezer', () => {
      const result = rtfToText(`${HEADER} A}`, 1252);
      expect(result).toMatchObject({ ok: true, value: { codepage: 1252, declared: true } });
    });
  });
});
