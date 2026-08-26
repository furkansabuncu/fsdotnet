import { lazy } from 'react';
import { KeyRound } from 'lucide-react';
import type { ToolDefinition } from '../types';

const oracleIdentity: ToolDefinition = {
  id: 'oracle-identity',
  name: 'Oracle Auto-Increment',
  keywords: [
    'sequence', 'trigger', 'identity', 'nextval', 'ora-00972', 'auto increment',
    'primary key', '11g', '12c', 'birincil anahtar', 'otomatik artan', 'tetikleyici',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: KeyRound,
  status: 'ready',
  component: lazy(() => import('./OracleIdentityTool')),
};

export default oracleIdentity;
