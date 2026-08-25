import { lazy } from 'react';
import { Database } from 'lucide-react';
import type { ToolDefinition } from '../types';

const sqlToLinq: ToolDefinition = {
  id: 'sql-to-linq',
  name: 'SQL → LINQ',
  keywords: [
    'entity framework', 'ef core', 'query', 'select', 'join', 'dbcontext', 'dbset',
    'sorgu', 'çevir', 'birleştir',
  ],
  category: 'dotnet',
  // T-SQL ayrıştırıcısı (ScriptDom) Oracle okumadığı için sunucuya gitmiyor.
  runtime: 'client',
  icon: Database,
  status: 'ready',
  component: lazy(() => import('./SqlToLinqTool')),
};

export default sqlToLinq;
