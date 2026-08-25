import { lazy } from 'react';
import { Globe } from 'lucide-react';
import type { ToolDefinition } from '../types';

const httpStatus: ToolDefinition = {
  id: 'http-status',
  name: 'HTTP Status Codes',
  keywords: [
    '404', '500', '422', 'rfc', 'aspnetcore', 'statuscodes', 'reference', 'teapot',
    'durum kodu', 'hata kodu', 'sabit', 'referans',
  ],
  category: 'web',
  runtime: 'client',
  icon: Globe,
  status: 'ready',
  component: lazy(() => import('./HttpStatusTool')),
};

export default httpStatus;
