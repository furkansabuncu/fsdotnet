import { lazy } from 'react';
import { Variable } from 'lucide-react';
import type { ToolDefinition } from '../types';

const bindParams: ToolDefinition = {
  id: 'bind-params',
  name: 'Bind Parameters',
  keywords: [
    'bind variable', 'parameter', 'substitute', 'debug', 'oracle', 'sql server', 'log',
    'parametre', 'yerine koy', 'sorgu', 'çalıştır',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: Variable,
  status: 'ready',
  component: lazy(() => import('./BindParamsTool')),
};

export default bindParams;
