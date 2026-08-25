// @vitest-environment jsdom
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { err, ok, type ToolResult } from '../tools/types';
import ConverterShell from './ConverterShell';

/**
 * Kabuk, on beş aracın ortak yüzeyi — buradaki bir hata hepsinde birden
 * görünür. Testler saf fonksiyonların yakalayamadığı kısma bakıyor:
 * girdiye tepki, hata gösterimi ve "son geçerli sonucu koru" davranışı.
 */

/** Girdiyi büyük harfe çeviren, `!` ile başlayınca hata veren sahte araç. */
function Harness({ initial = 'abc' }: { initial?: string }) {
  const [input, setInput] = useState(initial);
  const result: ToolResult<string> = input.startsWith('!')
    ? err('base64Alphabet')
    : ok(input.toUpperCase());

  return <ConverterShell input={input} onInputChange={setInput} result={result} />;
}

const input = () => screen.getByLabelText('Input');
const output = () => screen.getByRole('region', { name: 'Output' });

describe('ConverterShell', () => {
  it('çıktıyı gösterir', () => {
    renderWithProviders(<Harness />);
    expect(output()).toHaveTextContent('ABC');
  });

  it('yazdıkça çıktıyı günceller', async () => {
    const { user } = renderWithProviders(<Harness initial="" />);
    await user.type(input(), 'hi');
    expect(output()).toHaveTextContent('HI');
  });

  it('hata anahtarını çevrilmiş mesaja çevirir', async () => {
    const { user } = renderWithProviders(<Harness initial="" />);
    await user.type(input(), '!');
    expect(screen.getByText(/not valid base64/i)).toBeInTheDocument();
  });

  /* regex101 davranışı: hata anında çıktı paneli boşalmaz, son geçerli
     sonuç soluk kalır. Yarım yazılmış girdide panelin boşalıp dolması
     gözü yoruyor. */
  it('hata sırasında son geçerli çıktıyı korur', async () => {
    const { user } = renderWithProviders(<Harness initial="abc" />);
    expect(output()).toHaveTextContent('ABC');

    // Başa ekleniyor: sona yazmak önce girdiyi temizlemeyi gerektirir, o da
    // GEÇERLİ bir boş sonuç üretip korunacak değeri boşaltırdı.
    await user.type(input(), '!', { initialSelectionStart: 0, initialSelectionEnd: 0 });

    expect(output()).toHaveTextContent('ABC');
    expect(output().querySelector('pre')).toHaveClass('opacity-40');
  });

  /* Girdiyi temizlemek hata değil: boş girdi geçerli bir sonuç üretiyor, o
     yüzden korunacak "son geçerli" değer de boşalmalı. Eski çıktının orada
     kalması, kullanıcının sildiği şeyi hâlâ gösterirdi. */
  it('girdi temizlenince korunan çıktı da boşalır', async () => {
    const { user } = renderWithProviders(<Harness initial="abc" />);
    await user.clear(input());
    await user.type(input(), '!');
    expect(output()).toHaveTextContent('');
  });

  it('girdi geçersizken aria-invalid işaretler', async () => {
    const { user } = renderWithProviders(<Harness initial="" />);
    expect(input()).toHaveAttribute('aria-invalid', 'false');
    await user.type(input(), '!');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
  });

  it('temizle düğmesi girdiyi boşaltır', async () => {
    const { user } = renderWithProviders(<Harness initial="abc" />);
    await user.click(screen.getByRole('button', { name: 'Clear input' }));
    expect(input()).toHaveValue('');
  });

  it('girdi boşken temizle düğmesi kapalı', () => {
    renderWithProviders(<Harness initial="" />);
    expect(screen.getByRole('button', { name: 'Clear input' })).toBeDisabled();
  });

  it('bayt ve satır sayısını gösterir', async () => {
    const { user } = renderWithProviders(<Harness initial="" />);
    await user.type(input(), 'ab');
    // "ü" iki bayt: sayaç karakter değil BAYT saymalı.
    expect(screen.getAllByText('2 B, 1 line').length).toBeGreaterThan(0);
    await user.type(input(), 'ü');
    expect(screen.getAllByText('4 B, 1 line').length).toBeGreaterThan(0);
  });

  it('araç kendi etiketlerini verebilir', () => {
    renderWithProviders(
      <ConverterShell
        input="x"
        onInputChange={() => {}}
        result={ok('y')}
        inputLabel="RTF document"
        outputLabel="Plain text"
      />,
    );
    expect(screen.getByLabelText('RTF document')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Plain text' })).toBeInTheDocument();
  });

  it('çevrilmeyen ayrıntıyı hata mesajının yanında gösterir', () => {
    // Ayrıştırıcı konumu (`4:12`) çeviriye girmiyor ama görünmeli.
    renderWithProviders(
      <ConverterShell input="x" onInputChange={() => {}} result={err('xmlInvalid', '4:12')} />,
    );
    expect(screen.getByText(/4:12/)).toBeInTheDocument();
  });
});
