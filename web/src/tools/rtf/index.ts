import { lazy } from 'react';
import { FileText } from 'lucide-react';
import type { ToolDefinition } from '../types';

const rtf: ToolDefinition = {
  id: 'rtf',
  name: 'RTF → Text',
  keywords: [
    'rich text format', 'richedit', 'dxrichedit', 'delphi', 'word', 'strip',
    'markup', 'codepage', 'cp1254', 'ansicpg',
    'zengin metin', 'düz metin', 'ayıkla', 'temizle', 'rapor',
  ],
  category: 'converters',
  runtime: 'client',
  icon: FileText,
  status: 'ready',
  component: lazy(() => import('./RtfTool')),
};

export default rtf;
