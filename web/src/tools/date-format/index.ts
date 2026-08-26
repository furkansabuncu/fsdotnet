import { lazy } from 'react';
import { CalendarClock } from 'lucide-react';
import type { ToolDefinition } from '../types';

const dateFormat: ToolDefinition = {
  id: 'date-format',
  name: 'Date Format Converter',
  keywords: [
    'to_char', 'formatdatetime', 'tostring', 'dayjs', 'moment', 'nls_date_format',
    'hh24', 'mi', 'nn', 'yyyy', 'pattern', 'mask', 'delphi',
    'tarih biçimi', 'tarih formatı', 'kalıp', 'maske', 'saat', 'çevir',
  ],
  category: 'dotnet',
  runtime: 'client',
  icon: CalendarClock,
  status: 'ready',
  component: lazy(() => import('./DateFormatTool')),
};

export default dateFormat;
