import { lazy } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { ToolDefinition } from '../types';

const guidRaw: ToolDefinition = {
  id: 'guid-raw',
  name: 'GUID ⇄ RAW(16)',
  keywords: [
    'oracle raw', 'hextoraw', 'sys_guid', 'tobytearray', 'endian', 'byte order',
    'uniqueidentifier', 'bayt sırası', 'dönüştür', 'eşleşmiyor',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: ArrowLeftRight,
  status: 'ready',
  component: lazy(() => import('./GuidRawTool')),
};

export default guidRaw;
