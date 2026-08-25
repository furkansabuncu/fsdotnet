import { lazy } from 'react';
import { Fingerprint } from 'lucide-react';
import type { ToolDefinition } from '../types';

const uuid: ToolDefinition = {
  id: 'uuid',
  name: 'UUID / GUID Generator',
  keywords: [
    'guid', 'v4', 'v7', 'random', 'identifier', 'bulk', 'rfc 9562', 'time ordered',
    'kimlik', 'benzersiz', 'üret', 'toplu',
  ],
  category: 'security',
  runtime: 'client',
  icon: Fingerprint,
  status: 'ready',
  component: lazy(() => import('./UuidTool')),
};

export default uuid;
