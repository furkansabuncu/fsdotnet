import { lazy } from 'react';
import { Users } from 'lucide-react';
import type { ToolDefinition } from '../types';

const trData: ToolDefinition = {
  id: 'tr-data',
  name: 'Turkish Test Data',
  keywords: [
    'fake', 'mock', 'seed', 'tckn', 'iban', 'checksum', 'faker', 'sample',
    'sahte veri', 'test verisi', 'kimlik no', 'tohum', 'üret',
  ],
  category: 'testing',
  runtime: 'client',
  icon: Users,
  status: 'ready',
  component: lazy(() => import('./TurkishDataTool')),
};

export default trData;
