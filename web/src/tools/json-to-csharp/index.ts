import { lazy } from 'react';
import { Braces } from 'lucide-react';
import type { ToolDefinition } from '../types';

const jsonToCsharp: ToolDefinition = {
  id: 'json-to-csharp',
  name: 'JSON → C# / TS',
  keywords: [
    'poco', 'class', 'record', 'dto', 'deserialize', 'interface', 'typescript', 'model',
    'sınıf', 'nesne', 'arayüz', 'tip', 'üret',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: Braces,
  status: 'ready',
  component: lazy(() => import('./JsonToCsharpTool')),
};

export default jsonToCsharp;
