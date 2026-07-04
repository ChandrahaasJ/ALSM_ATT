export type Page =
  | 'dashboard'
  | 'agents'
  | 'workflows'
  | 'prompts'
  | 'tools'
  | 'knowledge'
  | 'memory'
  | 'logs'
  | 'analytics'
  | 'users'
  | 'settings'
  | 'notifications'
  | 'integrations'
  | 'billing';

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: 'active' | 'idle' | 'error' | 'paused';
  tasks: number;
  successRate: number;
  lastRun: string;
  tags: string[];
  description: string;
  tokens: number;
  latency: number;
}

export interface Workflow {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'failed' | 'completed' | 'scheduled';
  steps: number;
  lastRun: string;
  nextRun: string;
  runs: number;
  owner: string;
  description: string;
  duration: string;
}

export interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
  traceId: string;
  duration?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'developer';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  avatar: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  description: string;
  icon: string;
  lastSync: string;
}
