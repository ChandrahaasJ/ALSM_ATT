import React, { useState } from 'react';
import { Bell, Search, ChevronDown, ChevronRight, Settings, LogOut, User, HelpCircle, Command } from 'lucide-react';
import { Page } from '../types';
import { Dropdown } from './Dropdown';
import { notifications } from '../data';

interface TopNavProps {
  current: Page;
  onNavigate: (p: Page) => void;
  sidebarCollapsed: boolean;
}

const breadcrumbMap: Record<Page, string[]> = {
  dashboard: ['Dashboard'],
  agents: ['AI', 'Agents'],
  workflows: ['AI', 'Workflows'],
  prompts: ['AI', 'Prompts'],
  tools: ['AI', 'Tools'],
  knowledge: ['Data', 'Knowledge Base'],
  memory: ['Data', 'Memory'],
  logs: ['Data', 'Logs'],
  analytics: ['Data', 'Analytics'],
  users: ['Admin', 'Users'],
  settings: ['Admin', 'Settings'],
  notifications: ['Admin', 'Notifications'],
  integrations: ['Admin', 'Integrations'],
  billing: ['Admin', 'Billing'],
};

export function TopNav({ current, onNavigate, sidebarCollapsed }: TopNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const crumbs = breadcrumbMap[current] || [];
  const unread = notifications.filter(n => !n.read).length;

  return (
    <header
      className={`fixed top-0 right-0 h-[60px] bg-gray-950/90 backdrop-blur border-b border-gray-800 flex items-center gap-4 px-4 z-30 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-[220px]'}`}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {crumbs.map((c, i) => (
          <React.Fragment key={c}>
            {i > 0 && <ChevronRight size={12} className="text-gray-600 shrink-0" />}
            <span className={`text-sm shrink-0 ${i === crumbs.length - 1 ? 'text-white font-semibold' : 'text-gray-500'}`}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      {/* Search */}
      <div className="hidden md:flex relative">
        {searchOpen ? (
          <div className="flex items-center">
            <input
              autoFocus
              className="input w-64 pl-9 text-sm"
              placeholder="Search anything..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onBlur={() => { setSearchOpen(false); setSearchVal(''); }}
            />
            <Search size={14} className="absolute left-3 text-gray-500 pointer-events-none" />
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            <Search size={14} />
            <span className="hidden lg:block">Search</span>
            <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] bg-gray-700 px-1.5 py-0.5 rounded border border-gray-600">
              <Command size={9} />K
            </kbd>
          </button>
        )}
      </div>

      {/* Notifications */}
      <button
        onClick={() => onNavigate('notifications')}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* User menu */}
      <Dropdown
        align="right"
        trigger={
          <div className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">SC</div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-medium text-white leading-none">Sarah Chen</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Admin</div>
            </div>
            <ChevronDown size={12} className="text-gray-500 hidden md:block" />
          </div>
        }
        options={[
          { label: 'Profile', value: 'profile', icon: <User size={14} /> },
          { label: 'Settings', value: 'settings', icon: <Settings size={14} /> },
          { label: 'Help', value: 'help', icon: <HelpCircle size={14} /> },
          { label: 'Sign out', value: 'signout', icon: <LogOut size={14} />, danger: true, divider: true },
        ]}
        onSelect={v => { if (v === 'settings') onNavigate('settings'); }}
      />
    </header>
  );
}
