import { lazy } from 'react';
import { List } from 'lucide-react';
import type { ToolDefinition } from '../types';

const inList: ToolDefinition = {
  id: 'in-list',
  name: 'IN (…) Builder',
  keywords: [
    'in clause', 'where', 'bulk', 'ids', 'ora-01795', 'chunk', 'oracle', 'paste',
    'liste', 'toplu', 'kimlik', 'parçala', 'sorgu',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: List,
  status: 'ready',
  component: lazy(() => import('./InListTool')),
};

export default inList;
