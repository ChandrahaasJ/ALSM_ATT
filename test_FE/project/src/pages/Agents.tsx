import React, { useState } from 'react';
import {
  Bot, Plus, Search, Filter, MoreHorizontal, Play, Pause, RefreshCw,
  Trash2, Eye, Edit, Copy, Zap, Activity, ChevronDown, SlidersHorizontal,
  TrendingUp, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { agents } from '../data';
import { Agent } from '../types';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { Dropdown } from '../components/Dropdown';
import { Pagination } from '../components/Pagination';
import { toast } from '../components/Toast';

export function Agents() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [viewAgent, setViewAgent] = useState<Agent | null>(null);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [agentList, setAgentList] = useState(agents);
  const [createForm, setCreateForm] = useState({ name: '', model: 'GPT-4o', description: '', tags: '' });

  const filtered = agentList.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.model.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const perPage = 6;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () =>
    setSelected(selected.length === paged.length ? [] : paged.map(a => a.id));

  const toggleStatus = (agent: Agent) => {
    const next = agent.status === 'active' ? 'paused' : 'active';
    setAgentList(list => list.map(a => a.id === agent.id ? { ...a, status: next } : a));
    toast(`${agent.name} ${next === 'active' ? 'resumed' : 'paused'}`, next === 'active' ? 'success' : 'info');
  };

  const deleteConfirmed = () => {
    if (!deleteAgent) return;
    setAgentList(list => list.filter(a => a.id !== deleteAgent.id));
    toast(`${deleteAgent.name} deleted`, 'success');
    setDeleteAgent(null);
  };

  const handleCreate = () => {
    const newAgent: Agent = {
      id: `ag-${Date.now()}`,
      name: createForm.name || 'New Agent',
      model: createForm.model,
      status: 'idle',
      tasks: 0,
      successRate: 100,
      lastRun: 'Never',
      tags: createForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: createForm.description,
      tokens: 0,
      latency: 0,
    };
    setAgentList(list => [newAgent, ...list]);
    setShowCreate(false);
    setCreateForm({ name: '', model: 'GPT-4o', description: '', tags: '' });
    toast(`${newAgent.name} created successfully`, 'success');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Agents</h1>
          <p className="text-sm text-gray-500 mt-0.5">{agentList.length} agents configured</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
              {selected.length} selected
              <button onClick={() => { toast(`${selected.length} agents deleted`, 'success'); setSelected([]); }} className="text-red-400 hover:text-red-300">
                <Trash2 size={13} />
              </button>
            </div>
          )}
          <button className="btn-secondary text-xs"><SlidersHorizontal size={13} />Filters</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs"><Plus size={14} />New Agent</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active', value: agentList.filter(a => a.status === 'active').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Idle', value: agentList.filter(a => a.status === 'idle').length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Errors', value: agentList.filter(a => a.status === 'error').length, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Paused', value: agentList.filter(a => a.status === 'paused').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(s => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 cursor-pointer hover:border-gray-700 transition-all`} onClick={() => setStatusFilter(s.label.toLowerCase())}>
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <Bot size={16} className={s.color} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 w-full text-sm" placeholder="Search agents..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'active', 'idle', 'error', 'paused'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={selected.length === paged.length && paged.length > 0} onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 accent-blue-500 cursor-pointer" />
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Agent</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Model</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">Tasks</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">Success Rate</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">Last Run</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">Latency</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(a => (
                <tr key={a.id} className="table-row">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleSelect(a.id)}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800 accent-blue-500 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3" onClick={() => setViewAgent(a)}>
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center cursor-pointer hover:bg-blue-500/25 transition-colors">
                        <Bot size={14} className="text-blue-400" />
                      </div>
                      <div className="cursor-pointer">
                        <div className="text-sm text-white font-medium hover:text-blue-400 transition-colors">{a.name}</div>
                        <div className="text-[11px] text-gray-600 flex items-center gap-1">
                          {a.tags.map(t => <span key={t} className="badge badge-gray text-[10px]">{t}</span>)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-xs">{a.model}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${a.status === 'active' ? 'badge-green' : a.status === 'error' ? 'badge-red' : a.status === 'paused' ? 'badge-yellow' : 'badge-gray'}`}>
                      {a.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />}
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 text-sm">{a.tasks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${a.successRate >= 95 ? 'text-emerald-400' : a.successRate >= 90 ? 'text-amber-400' : 'text-red-400'}`}>
                      {a.successRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{a.lastRun}</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">{a.latency > 0 ? `${a.latency}ms` : '—'}</td>
                  <td className="px-4 py-3">
                    <Dropdown
                      align="right"
                      trigger={<button className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"><MoreHorizontal size={16} /></button>}
                      options={[
                        { label: 'View Details', value: 'view', icon: <Eye size={13} /> },
                        { label: 'Edit', value: 'edit', icon: <Edit size={13} /> },
                        { label: 'Duplicate', value: 'dup', icon: <Copy size={13} /> },
                        { label: a.status === 'active' ? 'Pause' : 'Resume', value: 'toggle', icon: a.status === 'active' ? <Pause size={13} /> : <Play size={13} /> },
                        { label: 'Delete', value: 'delete', icon: <Trash2 size={13} />, danger: true, divider: true },
                      ]}
                      onSelect={v => {
                        if (v === 'view') setViewAgent(a);
                        if (v === 'edit') setEditAgent(a);
                        if (v === 'toggle') toggleStatus(a);
                        if (v === 'delete') setDeleteAgent(a);
                        if (v === 'dup') toast(`${a.name} duplicated`, 'success');
                      }}
                    />
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-600">
                    No agents match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} />
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Agent"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={!createForm.name}>Create Agent</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Agent Name *</label>
            <input className="input w-full" placeholder="e.g. ContentBot Pro" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Model</label>
            <select className="input w-full" value={createForm.model} onChange={e => setCreateForm(f => ({ ...f, model: e.target.value }))}>
              {['GPT-4o', 'GPT-4o-mini', 'Claude 3.5', 'Claude 3', 'Gemini Pro'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Description</label>
            <textarea className="input w-full h-20 resize-none" placeholder="What does this agent do?" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Tags (comma-separated)</label>
            <input className="input w-full" placeholder="e.g. content, nlp, marketing" value={createForm.tags} onChange={e => setCreateForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* View Drawer */}
      <Drawer open={!!viewAgent} onClose={() => setViewAgent(null)} title={viewAgent?.name || ''}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setEditAgent(viewAgent); setViewAgent(null); }}>Edit</button>
            <button className="btn-primary" onClick={() => { toggleStatus(viewAgent!); setViewAgent(null); }}>
              {viewAgent?.status === 'active' ? 'Pause Agent' : 'Resume Agent'}
            </button>
          </>
        }
      >
        {viewAgent && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                <Bot size={28} className="text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white text-lg">{viewAgent.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${viewAgent.status === 'active' ? 'badge-green' : viewAgent.status === 'error' ? 'badge-red' : 'badge-gray'}`}>{viewAgent.status}</span>
                  <span className="text-xs text-gray-500">{viewAgent.model}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400">{viewAgent.description}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Tasks', value: viewAgent.tasks.toLocaleString(), icon: <Activity size={14} /> },
                { label: 'Success Rate', value: `${viewAgent.successRate}%`, icon: <CheckCircle2 size={14} /> },
                { label: 'Avg Latency', value: viewAgent.latency > 0 ? `${viewAgent.latency}ms` : '—', icon: <Clock size={14} /> },
                { label: 'Tokens Used', value: (viewAgent.tokens / 1000000).toFixed(1) + 'M', icon: <Zap size={14} /> },
              ].map(stat => (
                <div key={stat.label} className="card p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">{stat.icon}{stat.label}</div>
                  <div className="text-white font-semibold text-lg">{stat.value}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {viewAgent.tags.map(t => <span key={t} className="badge badge-blue">{t}</span>)}
              </div>
            </div>
            <div className="card p-4 space-y-2">
              <div className="text-xs font-medium text-gray-400">Recent Activity</div>
              <div className="text-xs text-gray-600">Last run: {viewAgent.lastRun}</div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${viewAgent.successRate}%` }} />
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit Drawer */}
      <Drawer open={!!editAgent} onClose={() => setEditAgent(null)} title={`Edit ${editAgent?.name}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditAgent(null)}>Cancel</button>
            <button className="btn-primary" onClick={() => { toast(`${editAgent?.name} updated`, 'success'); setEditAgent(null); }}>Save Changes</button>
          </>
        }
      >
        {editAgent && (
          <div className="space-y-4">
            <div><label className="text-xs text-gray-400 mb-1.5 block">Name</label><input className="input w-full" defaultValue={editAgent.name} /></div>
            <div><label className="text-xs text-gray-400 mb-1.5 block">Model</label>
              <select className="input w-full" defaultValue={editAgent.model}>
                {['GPT-4o', 'GPT-4o-mini', 'Claude 3.5', 'Claude 3'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-gray-400 mb-1.5 block">Description</label><textarea className="input w-full h-24 resize-none" defaultValue={editAgent.description} /></div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">System Prompt</label>
              <textarea className="input w-full h-32 resize-none font-mono text-xs" placeholder="You are a helpful assistant..." />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700">
              <span className="text-sm text-gray-300">Enable memory</span>
              <button className="w-10 h-5 bg-blue-600 rounded-full relative"><span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" /></button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteAgent}
        onClose={() => setDeleteAgent(null)}
        onConfirm={deleteConfirmed}
        title="Delete Agent"
        message={`Are you sure you want to delete "${deleteAgent?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
