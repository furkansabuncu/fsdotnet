import { lazy } from 'react';
import { ScanText } from 'lucide-react';
import type { ToolDefinition } from '../types';

const unicode: ToolDefinition = {
  id: 'unicode',
  name: 'Unicode Inspector',
  keywords: [
    'code point', 'invisible', 'zero width', 'nbsp', 'bom', 'nfc', 'nfd', 'normalize',
    'grapheme', 'emoji', 'trojan source',
    'görünmez karakter', 'kod noktası', 'normalizasyon', 'boşluk', 'temizle',
  ],
  category: 'converters',
  runtime: 'client',
  icon: ScanText,
  status: 'ready',
  component: lazy(() => import('./UnicodeTool')),
};

export default unicode;
