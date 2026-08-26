import { lazy } from 'react';
import { Languages } from 'lucide-react';
import type { ToolDefinition } from '../types';

const turkishCulture: ToolDefinition = {
  id: 'turkish-culture',
  name: 'Turkish Culture Lint',
  keywords: [
    'tr-tr', 'toupper', 'tolower', 'invariantculture', 'cultureinfo', 'ca1305', 'ca1310',
    'turkish i', 'dotted i', 'string comparison', 'parse', 'ondalık ayracı',
    'kültür', 'türkçe karakter', 'büyük harf', 'küçük harf', 'denetle',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: Languages,
  status: 'ready',
  component: lazy(() => import('./TurkishCultureTool')),
};

export default turkishCulture;
