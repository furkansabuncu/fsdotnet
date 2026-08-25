import { lazy } from 'react';
import { Hash } from 'lucide-react';
import type { ToolDefinition } from '../types';

const hash: ToolDefinition = {
  id: 'hash',
  name: 'Hash & HMAC',
  keywords: [
    'digest', 'checksum', 'sha256', 'sha512', 'md5', 'crc32', 'signature',
    'özet', 'sağlama', 'imza', 'parmak izi',
  ],
  category: 'security',
  runtime: 'client',
  icon: Hash,
  status: 'ready',
  component: lazy(() => import('./HashTool')),
};

export default hash;
