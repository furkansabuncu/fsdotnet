import { lazy } from 'react';
import { Binary } from 'lucide-react';
import type { ToolDefinition } from '../types';

const base64: ToolDefinition = {
  id: 'base64',
  name: 'Base64',
  keywords: ['btoa', 'atob', 'rfc4648', 'url safe', 'encode', 'decode', 'kodla', 'çöz', 'şifrele'],
  category: 'converters',
  runtime: 'client',
  icon: Binary,
  status: 'ready',
  component: lazy(() => import('./Base64Tool')),
};

export default base64;
