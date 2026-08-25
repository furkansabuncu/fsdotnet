// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import { commandPalette } from './shared/useCommandPalette';

/**
 * Yönlendirme testleri.
 *
 * Saf fonksiyon testleri `locale.ts`'i kapsıyor ama rotaların onu doğru
 * bağladığını göstermiyor — dilin adrese taşınması sırasında kırılabilecek
 * şeyler tam olarak burada: yönlendirme döngüsü, kaybolan eski adresler,
 * dil değiştirince başka sayfaya düşmek.
 */
function renderAt(route: string) {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>,
    ),
  };
}

/** Adres çubuğu MemoryRouter'da yok; geçerli yolu bağlantılardan okuyoruz. */
const currentLocale = () =>
  screen.getByRole('link', { name: /Home|Ana sayfa/ }).getAttribute('href');

describe('dil önekli rotalar', () => {
  it('/en ana sayfayı İngilizce açar', async () => {
    renderAt('/en');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Developer tools for the/i,
    );
    expect(document.documentElement.lang).toBe('en');
  });

  it('/tr ana sayfayı Türkçe açar', async () => {
    renderAt('/tr');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /geliştirici araçları/i,
    );
    expect(document.documentElement.lang).toBe('tr');
  });

  it('araç sayfasını açar', async () => {
    renderAt('/en/t/base64');
    expect(await screen.findByRole('heading', { level: 1, name: 'Base64' })).toBeInTheDocument();
  });

  it('araç sayfası kendi başlığını ve canonical adresini yazar', async () => {
    renderAt('/en/t/jwt');
    await screen.findByRole('heading', { level: 1, name: 'JWT Decoder' });

    await waitFor(() => expect(document.title).toBe('JWT Decoder · fsdotnet'));
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      expect.stringContaining('/en/t/jwt'),
    );
  });

  /* Sitede bir süre dilsiz adresler yayındaydı; paylaşılmış bağlantılar
     kırılmamalı. */
  it('eski dilsiz adresi dilli karşılığına taşır', async () => {
    renderAt('/t/base64');
    expect(await screen.findByRole('heading', { level: 1, name: 'Base64' })).toBeInTheDocument();
  });

  it('kök adresi dilli ana sayfaya taşır', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(currentLocale()).toMatch(/^\/(en|tr)$/);
  });
});

describe('bulunamayan adresler', () => {
  it('bilinmeyen araç 404 verir', async () => {
    renderAt('/en/t/does-not-exist');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  /* `/foo` önce dil sanılıp `/en/foo`ya taşınıyor, orada 404'e düşüyor.
     İkinci turda önek geçerli bir dil olduğu için döngü oluşmuyor — bu test
     o döngünün geri gelmediğini bekliyor. */
  it('dil olmayan önek döngüye girmeden 404 verir', async () => {
    renderAt('/foo');
    expect(await screen.findByRole('heading', { name: /not found|bulunamadı/i })).toBeInTheDocument();
  });

  it('404 sayfası noindex işaretlenir', async () => {
    renderAt('/en/nope');
    await screen.findByRole('heading', { name: 'Page not found' });
    await waitFor(() =>
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, follow',
      ),
    );
  });
});

describe('dil değiştirici', () => {
  it('aynı araçta kalıp dili değiştirir', async () => {
    const { user } = renderAt('/en/t/base64');
    await screen.findByRole('heading', { level: 1, name: 'Base64' });

    await user.click(screen.getByRole('button', { name: 'tr' }));

    // Araç aynı kaldı, arayüz Türkçeleşti.
    expect(await screen.findByRole('heading', { level: 1, name: 'Base64' })).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.lang).toBe('tr'));
    expect(currentLocale()).toBe('/tr');
  });
});

describe('komut paleti', () => {
  /* Açık/kapalı durumu modül seviyesinde bir store'da (Header'daki düğme ile
     global Ctrl+K aynı React ağacını paylaşmıyor). O store test bitince
     sıfırlanmıyor: açık bırakan bir test, sonrakinde Ctrl+K'nın paleti
     KAPATMASINA yol açıyor. */
  beforeEach(() => commandPalette.close());

  it('Ctrl+K ile açılır, Escape ile kapanır', async () => {
    const { user } = renderAt('/en');
    await screen.findByRole('heading', { level: 1 });

    await user.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument(),
    );
  });

  it('arama sonucu daraltır', async () => {
    const { user } = renderAt('/en');
    await screen.findByRole('heading', { level: 1 });

    await user.keyboard('{Control>}k{/Control}');
    await user.type(await screen.findByRole('combobox'), 'cron');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Cron');
  });

  /* Palet, arama metnini SIFIRLAMAK için effect kullanmıyor — gövde ayrı bir
     component ve her açılışta baştan mount ediliyor. Bu test o tasarımın
     çalıştığını, yani ikinci açılışın temiz geldiğini doğruluyor. */
  it('yeniden açıldığında arama metni sıfırlanır', async () => {
    const { user } = renderAt('/en');
    await screen.findByRole('heading', { level: 1 });

    await user.keyboard('{Control>}k{/Control}');
    await user.type(await screen.findByRole('combobox'), 'cron');
    await user.keyboard('{Escape}');

    await user.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('combobox')).toHaveValue('');
  });

  it('Enter seçili aracı açar', async () => {
    const { user } = renderAt('/en');
    await screen.findByRole('heading', { level: 1 });

    await user.keyboard('{Control>}k{/Control}');
    await user.type(await screen.findByRole('combobox'), 'mojibake');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mojibake Fixer' }),
    ).toBeInTheDocument();
  });
});
