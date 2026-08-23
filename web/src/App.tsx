import { Route, Routes } from 'react-router';
import CommandPalette from './shared/CommandPalette';
import Footer from './shared/Footer';
import Header from './shared/Header';
import Sidebar from './shared/Sidebar';
import HomePage from './pages/HomePage';
import ToolPage from './pages/ToolPage';

export default function App() {
  return (
    /* aurora: index.css'teki sabit konumlu renk lekesi katmanı. */
    <div className="aurora flex min-h-full flex-col">
      <Header />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-4">
        <Sidebar />

        {/* min-w-0: olmadan flex öğesi içeriğinin altına inemez ve geniş
            ızgara/kod blokları sayfayı yatay kaydırtır. */}
        <main className="min-w-0 flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/t/:toolId" element={<ToolPage />} />
            <Route path="*" element={<ToolPage />} />
          </Routes>
        </main>
      </div>

      <Footer />
      <CommandPalette />
    </div>
  );
}
