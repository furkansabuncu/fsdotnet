// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import SqlFixTool from './SqlFixTool';

/**
 * Saf fonksiyonların göremediği kısım: bulguların çevrilmiş metne
 * dönüşmesi, tek tek kapatılabilmesi ve düzeltilmiş metnin girdiye
 * taşınıp İKİNCİ turu açması.
 */

const query = () => screen.getByLabelText(/Query that will not run/i);
const output = () => screen.getByRole('region', { name: /With the selected fixes/i });
const findings = () => screen.getByRole('list');

describe('SqlFixTool', () => {
  it('açılışta T-SQL örneğini denetler ve düzeltilmişini gösterir', () => {
    renderWithProviders(<SqlFixTool />);

    expect(output()).toHaveTextContent('SELECT * FROM (');
    expect(output()).toHaveTextContent('WHERE ROWNUM <= 10');
    expect(output()).toHaveTextContent("k.baslik = 'Sessiz Ev'");
    // Köşeli parantez, AS, @ ve ISNULL hepsi aynı turda gitmeli.
    expect(output()).not.toHaveTextContent('[ad]');
    expect(output()).not.toHaveTextContent('@kanal');
    expect(output()).not.toHaveTextContent('ISNULL');
  });

  it('bulguları çevrilmiş başlık ve konumla listeler', () => {
    renderWithProviders(<SqlFixTool />);

    // Örnekte iki tablo takma adı var (FROM ve JOIN), yani iki ayrı bulgu.
    expect(within(findings()).getAllByText('AS before a table alias')).toHaveLength(2);
    expect(within(findings()).getByText('Bind variable written with @')).toBeInTheDocument();
    // Konum satır:sütun — çevrilmez, girdiden gelir.
    expect(within(findings()).getAllByText(/^\d+:\d+$/).length).toBeGreaterThan(0);
  });

  it('bir düzeltme kapatılınca çıktıdan çıkar', async () => {
    const { user } = renderWithProviders(<SqlFixTool />);

    const row = within(findings()).getByText('Bind variable written with @').closest('li');
    await user.click(within(row!).getByRole('checkbox'));

    expect(output()).toHaveTextContent('@kanal');
    // Ötekiler uygulanmaya devam etmeli.
    expect(output()).not.toHaveTextContent('[ad]');
  });

  it('otomatik düzeltmesi olmayan bulguda onay kutusu yoktur', async () => {
    const { user } = renderWithProviders(<SqlFixTool />);

    await user.clear(query());
    await user.type(query(), 'select charindex(a, b) from t');

    const row = within(findings()).getByText(/without a direct equivalent/i).closest('li');
    expect(within(row!).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(row!).getByText('no auto-fix')).toBeInTheDocument();
  });

  it('temiz sorguda bulgu listesi çıkmaz', async () => {
    const { user } = renderWithProviders(<SqlFixTool />);

    await user.clear(query());
    await user.type(query(), 'select a from t');

    expect(screen.getByText('nothing found')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('Delphi string’i çözülünce ikinci tur yeni bulgular açar', async () => {
    const { user } = renderWithProviders(<SqlFixTool />);

    await user.click(screen.getByRole('button', { name: 'Delphi string' }));

    // İlk turda TEK bulgu: sarmalayıcı çözülmeden içerisi incelenemez.
    expect(within(findings()).getAllByRole('listitem')).toHaveLength(1);
    expect(within(findings()).getByText('This is source code, not SQL')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Move to input/i }));

    expect((query() as HTMLTextAreaElement).value).toContain('select k.baslik');
    expect(screen.getByText('nothing found')).toBeInTheDocument();
  });

  it('yapıştırma hasarı örneğini temizler', async () => {
    const { user } = renderWithProviders(<SqlFixTool />);

    await user.click(screen.getByRole('button', { name: 'Paste damage' }));

    expect(output()).toHaveTextContent("ad = 'Ali'");
    expect(output()).not.toHaveTextContent('SQL>');
  });

  it('girdi boşken hata gösterir', async () => {
    const { user } = renderWithProviders(<SqlFixTool />);

    await user.clear(query());

    expect(screen.getByText(/paste a query to check/i)).toBeInTheDocument();
  });
});
