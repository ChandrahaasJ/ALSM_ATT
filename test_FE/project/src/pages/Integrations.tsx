import React, { useState } from 'react';
import {
  Plug, Search, RefreshCw, CheckCircle, XCircle, AlertCircle,
  ExternalLink, Plus, Trash2, Settings, ChevronRight, Link
} from 'lucide-react';
import { integrations } from '../data';
import { Integration } from '../types';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { toast } from '../components/Toast';

const statusIcon = (s: Integration['status']) => {
  if (s === 'connected') return <CheckCircle size={14} className="text-emerald-400" />;
  if (s === 'error') return <AlertCircle size={14} className="text-red-400" />;
  return <XCircle size={14} className="text-gray-600" />;
};

const categoryColors: Record<string, string> = {
  'AI Models': 'badge-blue', 'Communication': 'badge-green', 'Development': 'badge-gray',
  'CRM': 'badge-purple', 'Social Media': 'badge-red', 'Knowledge': 'badge-yellow',
  'Billing': 'badge-green', 'Support': 'badge-blue', 'Analytics': 'badge-blue',
  'Vector DB': 'badge-purple',
};

export function Integrations() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [integrationList, setIntegrationList] = useState(integrations);
  const [viewIntegration, setViewIntegration] = useState<Integration | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<Integration | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [configTab, setConfigTab] = useState<'config' | 'logs' | 'events'>('config');

  const categories = ['all', ...Array.from(new Set(integrationList.map(i => i.category)))];

  const filtered = integrationList.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || i.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setShowConnect(false);
      toast('Integration connected successfully', 'success');
    }, 2000);
  };

  const handleSync = (id: string) => {
    setIntegrationList(l => l.map(i => i.id === id ? { ...i, lastSync: 'Just now' } : i));
    toast('Sync initiated', 'info');
  };

  const handleDisconnect = () => {
    if (!disconnectTarget) return;
    setIntegrationList(l => l.map(i => i.id === disconnectTarget.id ? { ...i, status: 'disconnected', lastSync: 'Never' } : i));
    toast(`${disconnectTarget.name} disconnected`, 'info');
    setDisconnectTarget(null);
  };

  const connected = integrationList.filter(i => i.status === 'connected').length;
  const errors = integrationList.filter(i => i.status === 'error').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Integrations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{connected} connected • {errors} with issues</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs"><ExternalLink size={13} />Browse All</button>
          <button onClick={() => setShowConnect(true)} className="btn-primary text-xs"><Plus size={14} />Add Integration</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Connected', value: connected, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Disconnected', value: integrationList.filter(i => i.status === 'disconnected').length, color: 'text-gray-400', bg: 'bg-gray-500/10' },
          { label: 'Errors', value: errors, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Categories', value: new Set(integrationList.map(i => i.category)).size, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <Plug size={16} className={s.color} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 w-full text-sm" placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'connected', 'disconnected', 'error'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800 border border-gray-700'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select className="input text-sm py-1.5" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(integration => (
          <div key={integration.id} className="card p-5 hover:border-gray-700 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                  integration.status === 'connected' ? 'bg-blue-500/15 text-blue-400' :
                  integration.status === 'error' ? 'bg-red-500/15 text-red-400' :
                  'bg-gray-800 text-gray-500'
                }`}>
                  {integration.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{integration.name}</div>
                  <span className={`badge text-[10px] ${categoryColors[integration.category] || 'badge-gray'}`}>{integration.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {statusIcon(integration.status)}
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">{integration.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600">Last sync: {integration.lastSync}</span>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {integration.status === 'connected' && (
                  <>
                    <button onClick={() => handleSync(integration.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Sync">
                      <RefreshCw size={13} />
                    </button>
                    <button onClick={() => { setViewIntegration(integration); setConfigTab('config'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="Configure">
                      <Settings size={13} />
                    </button>
                    <button onClick={() => setDisconnectTarget(integration)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Disconnect">
                      <XCircle size={13} />
                    </button>
                  </>
                )}
                {integration.status === 'disconnected' && (
                  <button onClick={() => { setViewIntegration(integration); setConfigTab('config'); }} className="btn-primary text-xs py-1">
                    <Link size={12} />Connect
                  </button>
                )}
                {integration.status === 'error' && (
                  <button onClick={() => { setViewIntegration(integration); setConfigTab('config'); }} className="btn-danger text-xs py-1">
                    <AlertCircle size={12} />Fix
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Config Drawer */}
      <Drawer open={!!viewIntegration} onClose={() => setViewIntegration(null)} title={`${viewIntegration?.name} Integration`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setViewIntegration(null)}>Cancel</button>
            <button className="btn-primary" onClick={() => { toast(`${viewIntegration?.name} saved`, 'success'); setViewIntegration(null); }}>Save Configuration</button>
          </>
        }
      >
        {viewIntegration && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                viewIntegration.status === 'connected' ? 'bg-blue-500/15 text-blue-400' : 'bg-gray-800 text-gray-500'
              }`}>{viewIntegration.icon}</div>
              <div>
                <div className="font-semibold text-white">{viewIntegration.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {statusIcon(viewIntegration.status)}
                  <span className="text-xs text-gray-500 capitalize">{viewIntegration.status}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400">{viewIntegration.description}</p>
            <div className="flex gap-1 border-b border-gray-800 pb-2">
              {(['config', 'logs', 'events'] as const).map(t => (
                <button key={t} onClick={() => setConfigTab(t)} className={`tab ${configTab === t ? 'active' : ''}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {configTab === 'config' && (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1.5 block">API Key / Token</label>
                  <input className="input w-full font-mono text-xs" type="password" defaultValue={viewIntegration.status === 'connected' ? '••••••••••••••••' : ''} placeholder="Paste your API key here" />
                </div>
                <div><label className="text-xs text-gray-400 mb-1.5 block">Webhook URL</label>
                  <input className="input w-full font-mono text-xs" defaultValue="https://hooks.aiops.io/webhook/int-001" readOnly />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <span className="text-sm text-gray-300">Enable real-time sync</span>
                  <button className={`w-10 h-5 rounded-full relative ${viewIntegration.status === 'connected' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full ${viewIntegration.status === 'connected' ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            )}
            {configTab === 'logs' && (
              <div className="space-y-2">
                {[
                  { msg: 'Sync completed: 24 documents imported', time: '8 hr ago', ok: true },
                  { msg: 'Rate limit warning: 80% of hourly quota', time: '1 day ago', ok: false },
                  { msg: 'Connection established', time: '3 days ago', ok: true },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700 text-xs">
                    {l.ok ? <CheckCircle size={13} className="text-emerald-400" /> : <AlertCircle size={13} className="text-amber-400" />}
                    <span className="text-gray-300 flex-1">{l.msg}</span>
                    <span className="text-gray-600">{l.time}</span>
                  </div>
                ))}
              </div>
            )}
            {configTab === 'events' && (
              <div className="space-y-2">
                {['document.created', 'document.updated', 'document.deleted', 'sync.completed', 'error.occurred'].map(event => (
                  <div key={event} className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <span className="text-xs font-mono text-gray-300">{event}</span>
                    <button className="w-8 h-4 bg-blue-600 rounded-full relative">
                      <span className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* New Integration Modal */}
      <Modal open={showConnect} onClose={() => { setShowConnect(false); setConnecting(false); }} title="Add Integration"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowConnect(false)} disabled={connecting}>Cancel</button>
            <button className="btn-primary" onClick={handleConnect} disabled={connecting}>
              {connecting ? <><RefreshCw size={14} className="animate-spin" />Connecting...</> : <><Link size={14} />Connect</>}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="input pl-9 w-full text-sm" placeholder="Search available integrations..." />
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {['Zapier', 'Notion', 'Airtable', 'Linear', 'Jira', 'Datadog', 'PagerDuty', 'Twilio', 'SendGrid'].map(name => (
              <div key={name} className="p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-blue-500/50 cursor-pointer transition-colors text-center">
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mx-auto mb-1.5 text-xs font-bold text-gray-300">{name[0]}</div>
                <div className="text-xs text-gray-400">{name}</div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!disconnectTarget} onClose={() => setDisconnectTarget(null)} onConfirm={handleDisconnect}
        title="Disconnect Integration" message={`Disconnect ${disconnectTarget?.name}? Any workflows using this integration will pause.`} confirmLabel="Disconnect" danger />
    </div>
  );
}
