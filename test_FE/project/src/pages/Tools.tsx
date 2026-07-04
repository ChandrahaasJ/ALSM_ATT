import { useState } from 'react';
import {
  Wrench, Plus, Search, MoreHorizontal, Play, Settings, Trash2,
  Eye, Zap, AlertTriangle
} from 'lucide-react';
import { tools } from '../data';
import { Modal } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { Dropdown } from '../components/Dropdown';
import { toast } from '../components/Toast';

const typeBadge: Record<string, string> = {
  Search: 'badge-blue', Compute: 'badge-purple', Data: 'badge-green',
  Communication: 'badge-yellow', Vision: 'badge-red', Document: 'badge-gray',
  Productivity: 'badge-blue',
};

export function Tools() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewTool, setViewTool] = useState<typeof tools[0] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toolList, setToolList] = useState(tools);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'test'>('overview');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const types = ['all', ...Array.from(new Set(toolList.map(t => t.type)))];
  const filtered = toolList.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const runTest = () => {
    if (!testInput) return;
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(JSON.stringify({
        status: 'success',
        tool: viewTool?.name,
        input: testInput,
        output: 'Mock result: The tool executed successfully and returned 3 items.',
        duration: Math.round(Math.random() * 800 + 200) + 'ms',
        tokens_used: Math.round(Math.random() * 200 + 50),
      }, null, 2));
    }, 1500);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tools</h1>
          <p className="text-sm text-gray-500 mt-0.5">{toolList.length} tools registered</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs"><Link size={13} />API Docs</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs"><Plus size={14} />Register Tool</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Tools', value: toolList.filter(t => t.status === 'active').length, color: 'text-emerald-400' },
          { label: 'Total Calls Today', value: toolList.reduce((s, t) => s + t.calls, 0).toLocaleString(), color: 'text-blue-400' },
          { label: 'Avg Success Rate', value: (toolList.reduce((s, t) => s + t.successRate, 0) / toolList.length).toFixed(1) + '%', color: 'text-violet-400' },
          { label: 'Maintenance', value: toolList.filter(t => t.status === 'maintenance').length, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 w-full text-sm" placeholder="Search tools..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800 border border-gray-700'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(tool => (
          <div key={tool.id} className="card p-5 hover:border-gray-700 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.status === 'active' ? 'bg-emerald-500/15' : tool.status === 'maintenance' ? 'bg-amber-500/15' : 'bg-gray-800'}`}>
                  <Wrench size={18} className={tool.status === 'active' ? 'text-emerald-400' : tool.status === 'maintenance' ? 'text-amber-400' : 'text-gray-600'} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{tool.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`badge text-[10px] ${typeBadge[tool.type] || 'badge-gray'}`}>{tool.type}</span>
                    <span className={`badge text-[10px] ${tool.status === 'active' ? 'badge-green' : tool.status === 'maintenance' ? 'badge-yellow' : 'badge-gray'}`}>{tool.status}</span>
                  </div>
                </div>
              </div>
              <Dropdown
                align="right"
                trigger={<button className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"><MoreHorizontal size={16} /></button>}
                options={[
                  { label: 'View & Test', value: 'view', icon: <Eye size={13} /> },
                  { label: 'Configure', value: 'config', icon: <Settings size={13} /> },
                  { label: 'Run Test', value: 'test', icon: <Play size={13} /> },
                  { label: 'Delete', value: 'del', icon: <Trash2 size={13} />, danger: true, divider: true },
                ]}
                onSelect={v => {
                  if (v === 'view') { setViewTool(tool); setActiveTab('overview'); }
                  if (v === 'config') { setViewTool(tool); setActiveTab('config'); }
                  if (v === 'test') { setViewTool(tool); setActiveTab('test'); }
                  if (v === 'del') { setToolList(l => l.filter(t => t.id !== tool.id)); toast(`${tool.name} removed`, 'success'); }
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mb-4">{tool.description}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Calls', value: tool.calls.toLocaleString() },
                { label: 'Success', value: tool.successRate + '%' },
                { label: 'Latency', value: tool.latency },
              ].map(s => (
                <div key={s.label} className="bg-gray-800/60 rounded-lg p-2">
                  <div className="text-xs font-semibold text-white">{s.value}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-gray-600">Auth: {tool.auth}</span>
              <button onClick={() => { setViewTool(tool); setActiveTab('test'); }} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Play size={11} /> Test
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tool Drawer */}
      <Drawer open={!!viewTool} onClose={() => setViewTool(null)} title={viewTool?.name || ''}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setViewTool(null)}>Close</button>
            <button className="btn-primary" onClick={() => { toast(`${viewTool?.name} configuration saved`, 'success'); setViewTool(null); }}>Save Config</button>
          </>
        }
      >
        {viewTool && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${typeBadge[viewTool.type] || 'badge-gray'}`}>{viewTool.type}</span>
              <span className={`badge ${viewTool.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>{viewTool.status}</span>
              <span className="badge badge-gray">{viewTool.auth}</span>
            </div>
            <p className="text-sm text-gray-400">{viewTool.description}</p>
            <div className="flex gap-1 border-b border-gray-800 pb-2">
              {(['overview', 'config', 'test'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`tab ${activeTab === t ? 'active' : ''}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Calls', value: viewTool.calls.toLocaleString() },
                    { label: 'Success Rate', value: viewTool.successRate + '%' },
                    { label: 'Avg Latency', value: viewTool.latency },
                    { label: 'Auth Method', value: viewTool.auth },
                  ].map(s => (
                    <div key={s.label} className="card p-3">
                      <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                      <div className="text-sm text-white font-medium">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'config' && (
              <div className="space-y-4">
                <div><label className="text-xs text-gray-400 mb-1.5 block">API Endpoint</label><input className="input w-full font-mono text-xs" defaultValue="https://api.example.com/v1/tool" /></div>
                <div><label className="text-xs text-gray-400 mb-1.5 block">API Key</label><input className="input w-full" type="password" placeholder="••••••••••••••••" /></div>
                <div><label className="text-xs text-gray-400 mb-1.5 block">Timeout (ms)</label><input className="input w-full" type="number" defaultValue={5000} /></div>
                <div><label className="text-xs text-gray-400 mb-1.5 block">Rate Limit (req/min)</label><input className="input w-full" type="number" defaultValue={100} /></div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <span className="text-sm text-gray-300">Enable caching</span>
                  <button className="w-10 h-5 bg-blue-600 rounded-full relative"><span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" /></button>
                </div>
              </div>
            )}
            {activeTab === 'test' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Test Input (JSON)</label>
                  <textarea className="input w-full h-28 resize-none font-mono text-xs" placeholder='{"query": "test input", "options": {}}' value={testInput} onChange={e => setTestInput(e.target.value)} />
                </div>
                <button onClick={runTest} disabled={!testInput || testing} className="btn-primary w-full text-sm">
                  {testing ? <><RefreshCw size={14} className="animate-spin" />Running...</> : <><Play size={14} />Run Test</>}
                </button>
                {testResult && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Response</label>
                    <pre className="input w-full text-[11px] leading-relaxed h-40 overflow-y-auto whitespace-pre-wrap font-mono">{testResult}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Register Tool"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => { setShowCreate(false); toast('Tool registered', 'success'); }}>Register</button>
          </>
        }
      >
        <div className="space-y-4">
          <div><label className="text-xs text-gray-400 mb-1.5 block">Tool Name *</label><input className="input w-full" placeholder="e.g. Slack Notifier" /></div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Type</label>
            <select className="input w-full"><option>Search</option><option>Communication</option><option>Data</option><option>Compute</option><option>Other</option></select>
          </div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">API Endpoint</label><input className="input w-full font-mono text-sm" placeholder="https://api.example.com/v1/..." /></div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Description</label><textarea className="input w-full h-20 resize-none" placeholder="What does this tool do?" /></div>
        </div>
      </Modal>
    </div>
  );
}

function RefreshCw({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
