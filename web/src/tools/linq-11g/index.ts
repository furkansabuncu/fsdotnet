import { lazy } from 'react';
import { Bug } from 'lucide-react';
import type { ToolDefinition } from '../types';

const linq11g: ToolDefinition = {
  id: 'linq-11g',
  name: 'Oracle 11g LINQ Lint',
  keywords: [
    'ef core', 'entity framework', 'anyasync', 'ora-00904', 'cs0854', 'executeupdate',
    'skip take', 'fromsqlraw', 'ora-01795', 'linq', 'oracle 11g',
    'çalışma anında hata', 'runtime', 'denetle', 'kontrol',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: Bug,
  status: 'ready',
  component: lazy(() => import('./Linq11gTool')),
};

export default linq11g;
