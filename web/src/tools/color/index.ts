import { lazy } from 'react';
import { Palette } from 'lucide-react';
import type { ToolDefinition } from '../types';

const color: ToolDefinition = {
  id: 'color',
  name: 'Color Converter',
  keywords: [
    'hex', 'rgb', 'hsl', 'oklch', 'palette', 'contrast', 'accessibility', 'a11y', 'wcag',
    'renk', 'palet', 'kontrast', 'erişilebilirlik', 'çevir',
  ],
  category: 'web',
  runtime: 'client',
  icon: Palette,
  status: 'ready',
  component: lazy(() => import('./ColorTool')),
};

export default color;
