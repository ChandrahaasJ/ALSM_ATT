import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { ToastContainer } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Agents } from './pages/Agents';
import { Workflows } from './pages/Workflows';
import { Prompts } from './pages/Prompts';
import { Tools } from './pages/Tools';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Memory } from './pages/Memory';
import { Logs } from './pages/Logs';
import { Analytics } from './pages/Analytics';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';
import { Integrations } from './pages/Integrations';
import { Billing } from './pages/Billing';
import { Page } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = (p: Page) => setCurrentPage(p);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'agents': return <Agents />;
      case 'workflows': return <Workflows />;
      case 'prompts': return <Prompts />;
      case 'tools': return <Tools />;
      case 'knowledge': return <KnowledgeBase />;
      case 'memory': return <Memory />;
      case 'logs': return <Logs />;
      case 'analytics': return <Analytics />;
      case 'users': return <Users />;
      case 'settings': return <Settings />;
      case 'notifications': return <Notifications />;
      case 'integrations': return <Integrations />;
      case 'billing': return <Billing />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar
        current={currentPage}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <TopNav
        current={currentPage}
        onNavigate={navigate}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main
        className={`transition-all duration-300 pt-[60px] ${sidebarCollapsed ? 'pl-16' : 'pl-[220px]'}`}
      >
        <div className="p-6 max-w-[1400px] mx-auto">
          {renderPage()}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
