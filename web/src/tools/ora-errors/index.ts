import { lazy } from 'react';
import { CircleAlert } from 'lucide-react';
import type { ToolDefinition } from '../types';

const oraErrors: ToolDefinition = {
  id: 'ora-errors',
  name: 'Oracle Error Codes',
  keywords: [
    'ora', 'oracle', 'error', 'exception', 'tns', 'plsql', 'lookup', 'reference',
    'hata kodu', 'sebep', 'arama', 'referans',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: CircleAlert,
  status: 'ready',
  component: lazy(() => import('./OraErrorsTool')),
};

export default oraErrors;
