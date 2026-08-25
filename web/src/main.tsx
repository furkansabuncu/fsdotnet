import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

/*
 * Router en dışta: dil artık adresten okunuyor, yani `I18nProvider` rotanın
 * içinde duruyor (`LocaleLayout`). Sağlayıcı burada kalsaydı `:locale`
 * parametresini göremezdi.
 */
createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
