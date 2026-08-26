import { lazy } from 'react';
import { Stethoscope } from 'lucide-react';
import type { ToolDefinition } from '../types';

const sqlFix: ToolDefinition = {
  id: 'sql-fix',
  name: 'SQL Fixer',
  keywords: [
    'ora-00911', 'ora-00933', 'ora-00904', 'invalid character', 'missing keyword',
    't-sql', 'tsql', 'sql server', 'migrate', 'lint', 'top', 'offset fetch', 'rownum',
    'delphi', 'bozuk sorgu', 'çalışmıyor', 'hata', 'düzelt', 'onar', 'temizle',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: Stethoscope,
  status: 'ready',
  component: lazy(() => import('./SqlFixTool')),
};

export default sqlFix;
