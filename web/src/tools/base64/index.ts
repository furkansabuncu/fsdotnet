import { lazy } from 'react';
import type { ToolDefinition } from '../types';

const base64: ToolDefinition = {
  id: 'base64',
  name: 'Base64 Encoder / Decoder',
  description: 'Encode and decode Base64, with URL-safe output and correct UTF-8 handling.',
  category: 'converters',
  keywords: ['btoa', 'atob', 'rfc4648', 'url safe', 'encode', 'decode'],
  runtime: 'client',
  component: lazy(() => import('./Base64Tool')),
};

export default base64;
