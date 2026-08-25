import { lazy } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { ToolDefinition } from '../types';

const xmlJson: ToolDefinition = {
  id: 'xml-json',
  name: 'XML ⇄ JSON',
  keywords: [
    'soap', 'xsd', 'attribute', 'namespace', 'cdata', 'newtonsoft', 'wsdl',
    'dönüştür', 'öznitelik', 'çevir',
  ],
  category: 'converters',
  runtime: 'client',
  icon: ArrowLeftRight,
  status: 'ready',
  component: lazy(() => import('./XmlJsonTool')),
};

export default xmlJson;
