import { lazy } from 'react';
import { FileCode2 } from 'lucide-react';
import type { ToolDefinition } from '../types';

const pasSql: ToolDefinition = {
  id: 'pas-sql',
  name: 'Delphi PAS → SQL',
  keywords: [
    'pascal', 'vcl', 'tquery', 'sql.text', 'sql.add', 'parambyname', 'unidac',
    'gömülü sql', 'çıkar', 'ayıkla', 'dönüşüm', 'migration', 'legacy',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: FileCode2,
  status: 'ready',
  component: lazy(() => import('./PasSqlTool')),
};

export default pasSql;
