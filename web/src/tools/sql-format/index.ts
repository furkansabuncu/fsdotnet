import { lazy } from 'react';
import { AlignLeft } from 'lucide-react';
import type { ToolDefinition } from '../types';

const sqlFormat: ToolDefinition = {
  id: 'sql-format',
  name: 'SQL Formatter',
  keywords: [
    'beautify', 'pretty print', 'minify', 'indent', 'oracle', 'plsql', 'tsql',
    'postgres', 'mysql', 'query',
    'biçimlendir', 'girintile', 'sıkıştır', 'sorgu', 'düzenle',
  ],
  category: 'formatters',
  // ADR-0001: planda ScriptDom ile sunucudaydı; ScriptDom Oracle okumadığı ve
  // üretim sorgusu tarayıcıdan çıkmaması gerektiği için client'a alındı.
  runtime: 'client',
  icon: AlignLeft,
  status: 'ready',
  component: lazy(() => import('./SqlFormatTool')),
};

export default sqlFormat;
