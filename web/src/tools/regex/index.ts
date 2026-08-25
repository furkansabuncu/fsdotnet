import { lazy } from 'react';
import { Regex } from 'lucide-react';
import type { ToolDefinition } from '../types';

const regex: ToolDefinition = {
  id: 'regex',
  name: 'Regex Tester',
  keywords: [
    'regular expression', 'match', 'capture group', 'pattern', 'dotnet', 'replace',
    'düzenli ifade', 'desen', 'eşleşme', 'yakalama', 'değiştir',
  ],
  category: 'testing',
  /* Sitedeki TEK sunucu aracı: .NET motoru taklit edilemez (denge grupları,
     koşullu desenler, `\d`'nin Unicode davranışı). Sunucu yoksa araç yine
     çalışır — JavaScript motoruna düşer ve bunu söyler. */
  runtime: 'server',
  icon: Regex,
  status: 'ready',
  component: lazy(() => import('./RegexTool')),
};

export default regex;
