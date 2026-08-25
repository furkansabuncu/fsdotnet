import { lazy } from 'react';
import { KeyRound } from 'lucide-react';
import type { ToolDefinition } from '../types';

const jwt: ToolDefinition = {
  id: 'jwt',
  name: 'JWT Decoder',
  keywords: [
    'json web token', 'bearer', 'claims', 'exp', 'iat', 'signature', 'base64url',
    'jeton', 'çöz', 'imza', 'oturum',
  ],
  category: 'security',
  runtime: 'client',
  icon: KeyRound,
  status: 'ready',
  component: lazy(() => import('./JwtTool')),
};

export default jwt;
