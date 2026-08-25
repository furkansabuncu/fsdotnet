import { lazy } from 'react';
import { Braces } from 'lucide-react';
import type { ToolDefinition } from '../types';

const codeFormat: ToolDefinition = {
  id: 'code-format',
  name: 'JSON / XML / HTML / CSS',
  keywords: [
    'prettier', 'beautify', 'indent', 'minify', 'format', 'pretty print',
    'biçimlendir', 'güzelleştir', 'girinti', 'küçült', 'sıkıştır',
  ],
  category: 'formatters',
  runtime: 'client',
  icon: Braces,
  status: 'ready',
  component: lazy(() => import('./CodeFormatTool')),
};

export default codeFormat;
