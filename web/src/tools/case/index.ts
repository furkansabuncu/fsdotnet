import { lazy } from 'react';
import { CaseSensitive } from 'lucide-react';
import type { ToolDefinition } from '../types';

const caseConvert: ToolDefinition = {
  id: 'case',
  name: 'Case Converter',
  keywords: [
    'camelcase', 'snake_case', 'pascalcase', 'kebab-case', 'constant', 'identifier',
    'naming', 'turkish i',
    'kasa', 'büyük harf', 'küçük harf', 'adlandırma', 'çevir',
  ],
  category: 'converters',
  runtime: 'client',
  icon: CaseSensitive,
  status: 'ready',
  component: lazy(() => import('./CaseTool')),
};

export default caseConvert;
