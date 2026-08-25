import { lazy } from 'react';
import { CalendarClock } from 'lucide-react';
import type { ToolDefinition } from '../types';

const cron: ToolDefinition = {
  id: 'cron',
  name: 'Cron Expression',
  keywords: [
    'crontab', 'schedule', 'quartz', 'hangfire', 'next run', 'trigger',
    'zamanlama', 'görev', 'planla', 'sonraki çalışma',
  ],
  category: 'testing',
  runtime: 'client',
  icon: CalendarClock,
  status: 'ready',
  component: lazy(() => import('./CronTool')),
};

export default cron;
