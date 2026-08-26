import { lazy } from 'react';
import { GitMerge } from 'lucide-react';
import type { ToolDefinition } from '../types';

const mergeSql: ToolDefinition = {
  id: 'merge-sql',
  name: 'Oracle MERGE Builder',
  keywords: [
    'upsert', 'merge into', 'using dual', 'ora-38104', 'when matched', 'insert or update',
    'birleştir', 'güncelle ya da ekle', 'üret',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: GitMerge,
  status: 'ready',
  component: lazy(() => import('./MergeSqlTool')),
};

export default mergeSql;
