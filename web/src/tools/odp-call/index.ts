import { lazy } from 'react';
import { Terminal } from 'lucide-react';
import type { ToolDefinition } from '../types';

const odpCall: ToolDefinition = {
  id: 'odp-call',
  name: 'Procedure → ODP.NET',
  keywords: [
    'sys_refcursor', 'ref cursor', 'oraclecommand', 'oracleparameter', 'bindbyname',
    'ora-06502', 'stored procedure', 'pl/sql', 'plsql',
    'prosedür', 'çağrı', 'imza', 'parametre',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: Terminal,
  status: 'ready',
  component: lazy(() => import('./OdpCallTool')),
};

export default odpCall;
