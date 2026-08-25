import { lazy } from 'react';
import { GitCompare } from 'lucide-react';
import type { ToolDefinition } from '../types';

const sqlDiff: ToolDefinition = {
  id: 'sql-diff',
  name: 'SQL Diff',
  keywords: [
    'diff', 'compare', 'view', 'procedure', 'version', 'change', 'highlight',
    'karşılaştır', 'fark', 'sürüm', 'değişiklik', 'vurgula',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: GitCompare,
  status: 'ready',
  component: lazy(() => import('./SqlDiffTool')),
};

export default sqlDiff;
