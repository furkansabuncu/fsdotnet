import { lazy } from 'react';
import { Plug } from 'lucide-react';
import type { ToolDefinition } from '../types';

const connString: ToolDefinition = {
  id: 'conn-string',
  name: 'Oracle Connection String',
  keywords: [
    'easy connect', 'tnsnames', 'descriptor', 'data source', 'odp.net', 'service_name',
    'sid', 'ora-12154', 'bağlantı dizesi', 'çöz', 'kur', 'maskele',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: Plug,
  status: 'ready',
  component: lazy(() => import('./ConnStringTool')),
};

export default connString;
