import { lazy } from 'react';
import { Wrench } from 'lucide-react';
import type { ToolDefinition } from '../types';

const mojibake: ToolDefinition = {
  id: 'mojibake',
  name: 'Mojibake Fixer',
  keywords: [
    'encoding', 'utf-8', 'cp1252', 'latin-1', 'garbled', 'charset', 'ftfy',
    'bozuk metin', 'kodlama', 'türkçe karakter', 'bozulma', 'onar',
  ],
  category: 'converters',
  runtime: 'client',
  icon: Wrench,
  status: 'ready',
  component: lazy(() => import('./MojibakeTool')),
};

export default mojibake;
