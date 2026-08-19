import type { ToolCategory } from './types';

export const CATEGORY_ORDER: ToolCategory[] = [
  'converters',
  'formatters',
  'security',
  'testing',
  'web',
];

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  converters: 'Converters',
  formatters: 'Formatters',
  security: 'Security & Tokens',
  testing: 'Testing',
  web: 'Web & Design',
};
