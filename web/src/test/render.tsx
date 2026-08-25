import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/locale';

interface Options {
  locale?: Locale;
  /** Router'ın başlangıç adresi — dil önekli yol beklenir. */
  route?: string;
}

/**
 * Bir component'i çalışabileceği en küçük bağlamla render eder.
 *
 * İki sarmalayıcı da zorunlu: `useI18n` sağlayıcı olmadan fırlatıyor, ve
 * sağlayıcının kendisi dil değiştirmek için router'a ihtiyaç duyuyor.
 * Testlerin bunu tek tek kurması, sarmalayıcıyı unutan bir testin
 * anlaşılmaz bir hatayla patlaması demekti.
 */
export function renderWithProviders(
  ui: ReactNode,
  { locale = 'en', route = `/${locale}` }: Options = {},
) {
  return {
    // Klavye etkileşimi olan her test bunu istiyor; her dosyada yeniden
    // kurmak yerine buradan veriliyor.
    user: userEvent.setup(),
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <I18nProvider locale={locale}>{ui}</I18nProvider>
      </MemoryRouter>,
    ),
  };
}
