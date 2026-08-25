import { lazy } from 'react';
import { Table } from 'lucide-react';
import type { ToolDefinition } from '../types';

const csvJson: ToolDefinition = {
  id: 'csv-json',
  name: 'CSV → JSON / SQL',
  keywords: [
    'excel', 'tsv', 'delimiter', 'insert into', 'seed', 'rfc 4180', 'oracle',
    'tablo', 'ayraç', 'içe aktar', 'dönüştür',
  ],
  category: 'converters',
  runtime: 'client',
  icon: Table,
  status: 'ready',
  component: lazy(() => import('./CsvTool')),
};

export default csvJson;
