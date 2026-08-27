// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import JwtTool from './JwtTool';

/**
 * Çözücü (`jwt.ts`) saf ve tamamen kapsanmış durumda; burada sınanan başka
 * bir şey: çözülen değerin EKRANA nasıl döküldüğü.
 *
 * Bu ayrım önemli, çünkü aracın tek güvenlik uyarısı — `alg: none` — yalnızca
 * bu dosyada yaşıyor. `signed` alanını doğru hesaplamak, uyarıyı gerçekten
 * göstermekle aynı şey değil; ikincisi sessizce kaybolabilir ve testler yine
 * yeşil kalırdı.
 */

const output = () => screen.getByRole('region', { name: 'Çözülmüş' });

/** Test token'ı üretir — imza sahte, araç zaten doğrulamıyor. */
function makeToken(header: object, payload: object, signature = 'sig'): string {
  const encode = (value: object) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode(header)}.${encode(payload)}.${signature}`;
}

/** Türkçe kabukta aracı açıp verilen token'ı girer. */
async function paste(token: string) {
  const view = renderWithProviders(<JwtTool />, { locale: 'tr' });
  const box = screen.getByLabelText('JWT');
  await view.user.clear(box);
  // `paste` tuş tuş yazmıyor: 300 karakterlik bir token'ı harf harf girmek
  // testi saniyelere çıkarıyor ve sınanan şey klavye davranışı değil.
  await view.user.click(box);
  await view.user.paste(token);
  return view;
}

describe('JwtTool', () => {
  it('açılışta örnek token\'ı bölümlere ayırarak gösterir', () => {
    renderWithProviders(<JwtTool />, { locale: 'tr' });

    expect(output()).toHaveTextContent('HEADER');
    expect(output()).toHaveTextContent('PAYLOAD');
    expect(output()).toHaveTextContent('"alg": "HS256"');
    // Örnek payload Türkçe ad taşıyor: latin1 okunsa burada bozulurdu.
    expect(output()).toHaveTextContent('Ömer Çelikbaş');
  });

  it('imzalı token\'da algoritmayı, ama doğrulamadığını söyler', () => {
    renderWithProviders(<JwtTool />, { locale: 'tr' });

    expect(screen.getByText('HS256 ile imzalı · imza doğrulanmadı')).toBeInTheDocument();
  });

  it('alg:none token\'ında imzasız uyarısı çıkar', async () => {
    // Uyarının kendisi bu aracın var olma sebeplerinden biri: `alg: none`
    // kabul eden bir doğrulayıcı, imzasız token'ı geçerli sayar.
    await paste(makeToken({ alg: 'none' }, { sub: '42' }, ''));

    expect(screen.getByText('imzasız token')).toBeInTheDocument();
    expect(screen.queryByText(/ile imzalı/)).not.toBeInTheDocument();
  });

  it('imzası boş ama algoritması olan token da imzasız sayılır', async () => {
    await paste(makeToken({ alg: 'HS256' }, { sub: '42' }, ''));

    expect(screen.getByText('imzasız token')).toBeInTheDocument();
  });

  it('süresi geçmiş exp\'i çevrilmiş notla işaretler', async () => {
    // Sabit geçmiş bir an: testin bugüne bağlı olmaması için.
    const exp = Math.floor(Date.parse('2020-01-15T08:00:00Z') / 1000);
    await paste(makeToken({ alg: 'HS256' }, { exp }));

    expect(output()).toHaveTextContent('CLAIM');
    expect(output()).toHaveTextContent(/exp\s.*←\s*süresi geçmiş/);
  });

  it('henüz başlamamış nbf\'yi ayrı notla işaretler', async () => {
    const nbf = Math.floor(Date.parse('2099-01-15T08:00:00Z') / 1000);
    await paste(makeToken({ alg: 'HS256' }, { nbf }));

    expect(output()).toHaveTextContent(/nbf\s.*←\s*henüz geçerli değil/);
  });

  it('sorunsuz claim not almaz', async () => {
    const iat = Math.floor(Date.parse('2020-01-15T08:00:00Z') / 1000);
    await paste(makeToken({ alg: 'HS256' }, { iat }));

    expect(output()).toHaveTextContent(/iat\s/);
    expect(output()).not.toHaveTextContent('←');
  });

  it('zaman claim\'i yoksa CLAIM bölümü hiç açılmaz', async () => {
    await paste(makeToken({ alg: 'HS256' }, { sub: '42' }));

    expect(output()).toHaveTextContent('PAYLOAD');
    expect(output()).not.toHaveTextContent('CLAIM');
  });

  it('tarihi kullanıcının diline göre biçimler', async () => {
    const iat = Math.floor(Date.parse('2020-01-15T08:00:00Z') / 1000);
    await paste(makeToken({ alg: 'HS256' }, { iat }));

    // Gün ve saat makinenin saat dilimine bağlı; dile bağlı olan ay adı.
    expect(output()).toHaveTextContent(/Oca 2020/);
  });

  it('bozuk token\'da hatayı çevrilmiş gösterir, rozeti gizler', async () => {
    await paste('uc.parca.degil.bu');

    expect(screen.getByText(/tam olarak nokta ile ayrılmış üç parçadan/)).toBeInTheDocument();
    // Rozet `parsed.ok`'a bağlı: hata varken ne imzalı ne imzasız denmeli.
    expect(screen.queryByText('imzasız token')).not.toBeInTheDocument();
    expect(screen.queryByText(/ile imzalı/)).not.toBeInTheDocument();
  });

  it('Örnek düğmesi girdiyi geri getirir', async () => {
    const view = await paste(makeToken({ alg: 'none' }, { sub: '42' }, ''));

    await view.user.click(screen.getByRole('button', { name: /Örnek/ }));

    expect(output()).toHaveTextContent('Ömer Çelikbaş');
    expect(screen.getByText('HS256 ile imzalı · imza doğrulanmadı')).toBeInTheDocument();
  });
});
