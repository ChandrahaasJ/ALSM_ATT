import React, { useState } from 'react';
import {
  LayoutDashboard, Bot, GitBranch, FileText, Wrench, BookOpen, Brain,
  ScrollText, BarChart3, Users, Settings, Bell, Plug, CreditCard,
  ChevronLeft, ChevronRight, Zap, Circle
} from 'lucide-react';
import { Page } from '../types';

const navItems: { id: Page; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'agents', label: 'Agents', icon: <Bot size={18} />, badge: 8 },
  { id: 'workflows', label: 'Workflows', icon: <GitBranch size={18} />, badge: 7 },
  { id: 'prompts', label: 'Prompts', icon: <FileText size={18} /> },
  { id: 'tools', label: 'Tools', icon: <Wrench size={18} /> },
  { id: 'knowledge', label: 'Knowledge Base', icon: <BookOpen size={18} /> },
  { id: 'memory', label: 'Memory', icon: <Brain size={18} /> },
  { id: 'logs', label: 'Logs', icon: <ScrollText size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { id: 'users', label: 'Users', icon: <Users size={18} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: 4 },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard size={18} /> },
];

const groups = [
  { label: 'Overview', items: ['dashboard'] },
  { label: 'AI', items: ['agents', 'workflows', 'prompts', 'tools'] },
  { label: 'Data', items: ['knowledge', 'memory', 'logs', 'analytics'] },
  { label: 'Admin', items: ['users', 'integrations', 'notifications', 'settings', 'billing'] },
];

interface SidebarProps {
  current: Page;
  onNavigate: (p: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ current, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gray-950 border-r border-gray-800 flex flex-col z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-[220px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-gray-800 shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-none">AI OpsCenter</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Enterprise</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {groups.map(g => {
          const groupItems = navItems.filter(n => g.items.includes(n.id));
          return (
            <div key={g.label}>
              {!collapsed && <div className="px-3 pb-1 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">{g.label}</div>}
              <div className="space-y-0.5">
                {groupItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`sidebar-item w-full ${current === item.id ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                    {!collapsed && item.badge !== undefined && (
                      <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge !== undefined && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Status + collapse */}
      <div className="shrink-0 border-t border-gray-800 px-2 py-3 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <Circle size={6} className="text-emerald-400 fill-emerald-400 animate-pulse-dot" />
            <span className="text-xs text-emerald-400 font-medium">All systems operational</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors text-sm ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
