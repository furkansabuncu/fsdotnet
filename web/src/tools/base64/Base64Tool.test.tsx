// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import Base64Tool from './Base64Tool';

/**
 * Kodlayıcının kendisi (`base64.ts`) tablo testleriyle kapsanmış durumda.
 * Burada sınanan, iki anahtarın arayüzde ne yaptığı: yön değiştirince
 * etiketlerin de yer değiştirmesi ve URL-safe kutusunun gerçekten §5
 * alfabesine geçmesi.
 *
 * İkincisi göründüğünden önemli: kutu yalnızca kodlama yönünde anlamlı, ve
 * çözerken de görünseydi kullanıcı onu işaretleyip hiçbir şey değişmediğini
 * görürdü.
 */

/* `+` ve `/` üreten bir girdi; standart ile §5 alfabesi ancak böyle ayrışır.
   `>>>?` → "Pj4+Pw==" (standart) / "Pj4-Pw" (URL-safe). */
const DIVERGES = '>>>?';

const output = () => screen.getByRole('region', { name: 'Base64' });
const urlSafeBox = () => screen.queryByRole('checkbox', { name: /URL-safe/ });

describe('Base64Tool', () => {
  it('URL-safe kutusu standart alfabeyi §5 alfabesine çevirir', async () => {
    const { user } = renderWithProviders(<Base64Tool />, { locale: 'tr' });

    await user.click(screen.getByLabelText('Düz metin'));
    await user.paste(DIVERGES);
    expect(output()).toHaveTextContent('Pj4+Pw==');

    await user.click(urlSafeBox()!);

    // `+` → `-`, ve dolgu düşer: adres çubuğunda kaçış gerektirmeyen biçim.
    expect(output()).toHaveTextContent('Pj4-Pw');
    expect(output()).not.toHaveTextContent('Pj4+Pw==');
  });

  it('çözme yönünde URL-safe kutusu hiç gösterilmez', async () => {
    const { user } = renderWithProviders(<Base64Tool />, { locale: 'tr' });

    expect(urlSafeBox()).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'çöz' }));

    // Anlamsız bir anahtarı göstermek, işaretleyip sonuç beklemeye davet eder.
    expect(urlSafeBox()).not.toBeInTheDocument();
  });

  it('yön değişince giriş ve çıkış etiketleri de yer değiştirir', async () => {
    const { user } = renderWithProviders(<Base64Tool />, { locale: 'tr' });

    expect(screen.getByLabelText('Düz metin')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'çöz' }));

    expect(screen.getByLabelText('Base64')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Düz metin' })).toBeInTheDocument();
  });
});
