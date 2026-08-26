// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import DateFormatTool from './DateFormatTool';

/**
 * Saf fonksiyonların göremediği kısım: kalıbın üç hedefe DOĞRU satırda
 * düşmesi, uyarıların çevrilmiş metne dönüşmesi ve kaynak lehçe
 * değiştiğinde aynı harflerin başka anlama gelmesi.
 */

/* `getByLabelText(/pattern/)` kullanılamıyor: kopyala düğmelerinin
   erişilebilir adı da "…pattern" ile bitiyor. Sayfadaki tek metin kutusu
   bu, o yüzden rol yeterli. */
const patternBox = () => screen.getByRole('textbox');

/** Bir lehçe satırındaki kalıbı, satır başlığından bularak okur. */
function row(name: string): HTMLElement {
  const label = screen.getByText(name, { selector: 'span' });
  const item = label.closest('li');
  if (!item) throw new Error(`${name} satırı bulunamadı`);
  return item;
}

describe('DateFormatTool', () => {
  it('açılışta üç çeviriyi ve örnek çıktıyı gösterir', () => {
    renderWithProviders(<DateFormatTool />);

    expect(patternBox()).toHaveValue('DD.MM.YYYY HH24:MI');
    expect(within(row('.NET')).getByText('dd.MM.yyyy HH:mm')).toBeInTheDocument();
    expect(within(row('dayjs')).getByText('DD.MM.YYYY HH:mm')).toBeInTheDocument();
    expect(within(row('Delphi')).getByText('dd.mm.yyyy hh:nn')).toBeInTheDocument();
    // Örnek an mount'ta okunuyor, yani gün/saat makineye bağlı — sabit olan
    // ayraçlar ve alan genişlikleri.
    expect(screen.getByText(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it('yazdıkça çevirileri günceller', async () => {
    const { user } = renderWithProviders(<DateFormatTool />);

    await user.clear(patternBox());
    await user.type(patternBox(), 'YYYY-MM-DD');

    expect(within(row('.NET')).getByText('yyyy-MM-dd')).toBeInTheDocument();
    expect(within(row('Delphi')).getByText('yyyy-mm-dd')).toBeInTheDocument();
  });

  it('kaynak lehçe değişince aynı harfler başka anlama gelir', async () => {
    const { user } = renderWithProviders(<DateFormatTool />);

    await user.clear(patternBox());
    await user.type(patternBox(), 'mm');

    // Kaynak Oracle: mm = ay → Delphi'de de ay.
    expect(within(row('Delphi')).getByText('mm')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '.NET' }));

    // Kaynak .NET: mm = dakika → Delphi'de nn.
    expect(within(row('Delphi')).getByText('nn')).toBeInTheDocument();
  });

  it('Oracle çıplak HH uyarısını çevrilmiş olarak gösterir', async () => {
    const { user } = renderWithProviders(<DateFormatTool />);

    await user.clear(patternBox());
    await user.type(patternBox(), 'HH:MI');

    expect(screen.getByText(/HH12, not 24-hour/i)).toBeInTheDocument();
  });

  it('karşılığı olmayan alanı adıyla bildirir', async () => {
    const { user } = renderWithProviders(<DateFormatTool />);

    await user.clear(patternBox());
    await user.type(patternBox(), 'YYYY Q');

    expect(within(row('.NET')).getByText(/left out: Quarter/i)).toBeInTheDocument();
  });

  it('hazır kalıp hem kalıbı hem kaynak lehçeyi değiştirir', async () => {
    const { user } = renderWithProviders(<DateFormatTool />);

    await user.click(screen.getByRole('button', { name: 'dd.mm.yyyy hh:nn:ss' }));

    expect(patternBox()).toHaveValue('dd.mm.yyyy hh:nn:ss');
    // Delphi seçildiyse hedefler arasında Delphi değil Oracle var.
    expect(within(row('Oracle')).getByText('DD.MM.YYYY HH24:MI:SS')).toBeInTheDocument();
  });

  it('geçersiz girdide hata gösterir', async () => {
    const { user } = renderWithProviders(<DateFormatTool />);

    await user.clear(patternBox());

    expect(screen.getByText(/enter a date format pattern/i)).toBeInTheDocument();
    expect(screen.queryByText('dd.MM.yyyy HH:mm')).not.toBeInTheDocument();
  });

  it('başvuru tablosu her lehçe için sütun taşır', () => {
    renderWithProviders(<DateFormatTool />);

    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Oracle' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Year, 4 digits' })).toBeInTheDocument();
    // Aynı satırda dört lehçenin token'ı yan yana durmalı.
    const yearRow = within(table).getByRole('rowheader', { name: 'Year, 4 digits' }).closest('tr');
    expect(yearRow).toHaveTextContent('YYYYyyyyYYYYyyyy');
  });
});
