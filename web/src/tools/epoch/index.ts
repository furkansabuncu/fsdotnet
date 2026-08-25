import { lazy } from 'react';
import { Clock } from 'lucide-react';
import type { ToolDefinition } from '../types';

const epoch: ToolDefinition = {
  id: 'epoch',
  name: 'Epoch Converter',
  keywords: [
    'unix', 'timestamp', 'utc', 'datetimeoffset', 'ticks', 'iso 8601', 'millis',
    'zaman damgası', 'tarih', 'saat', 'çevir',
  ],
  category: 'converters',
  runtime: 'client',
  icon: Clock,
  status: 'ready',
  component: lazy(() => import('./EpochTool')),
};

export default epoch;
