import { lazy } from 'react';
import { Table2 } from 'lucide-react';
import type { ToolDefinition } from '../types';

const ddlEntity: ToolDefinition = {
  id: 'ddl-entity',
  name: 'DDL → EF Core Entity',
  keywords: [
    'create table', 'scaffold', 'entity framework', 'ientitytypeconfiguration',
    'number precision', 'varchar2', 'reverse engineer', 'poco',
    'tablo', 'varlık', 'eşleme', 'üret',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: Table2,
  status: 'ready',
  component: lazy(() => import('./DdlEntityTool')),
};

export default ddlEntity;
