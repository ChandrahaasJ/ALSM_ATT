import React, { useState } from 'react';
import { Brain, Search, Plus, Trash2, Clock, Bot, Database, Filter, MoreHorizontal, RefreshCw } from 'lucide-react';
import { memoryEntries } from '../data';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Dropdown } from '../components/Dropdown';
import { toast } from '../components/Toast';

const typeColors: Record<string, string> = {
  Episodic: 'badge-blue',
  Semantic: 'badge-green',
  Procedural: 'badge-purple',
};

export function Memory() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [entries, setEntries] = useState(memoryEntries);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<typeof memoryEntries[0] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const agents = ['all', ...Array.from(new Set(entries.map(e => e.agent)))];
  const types = ['all', 'Episodic', 'Semantic', 'Procedural'];

  const filtered = entries.filter(e => {
    const matchSearch = e.content.toLowerCase().includes(search.toLowerCase()) || e.agent.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    const matchAgent = agentFilter === 'all' || e.agent === agentFilter;
    return matchSearch && matchType && matchAgent;
  });

  const totalTokens = entries.reduce((s, e) => s + e.tokens, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Memory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{entries.length} memory entries • {totalTokens} tokens</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { toast('Memory store cleared for expired entries', 'info'); }} className="btn-secondary text-xs"><RefreshCw size={13} />Cleanup</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs"><Plus size={14} />Add Memory</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Episodic', value: entries.filter(e => e.type === 'Episodic').length, color: 'badge-blue', bg: 'bg-blue-500/10' },
          { label: 'Semantic', value: entries.filter(e => e.type === 'Semantic').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Procedural', value: entries.filter(e => e.type === 'Procedural').length, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Expiring', value: entries.filter(e => e.expires !== 'Never').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3 cursor-pointer hover:border-gray-700 transition-all" onClick={() => setTypeFilter(s.label === 'Expiring' ? 'all' : s.label)}>
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <Brain size={16} className={s.color.startsWith('text') ? s.color : 'text-blue-400'} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 w-full text-sm" placeholder="Search memories..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800 border border-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
        <select className="input text-sm py-1.5" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
          {agents.map(a => <option key={a} value={a}>{a === 'all' ? 'All Agents' : a}</option>)}
        </select>
      </div>

      {/* Memory Cards */}
      <div className="space-y-3">
        {filtered.map(entry => (
          <div key={entry.id} className="card hover:border-gray-700 transition-all duration-200">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Brain size={14} className="text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`badge text-xs ${typeColors[entry.type] || 'badge-gray'}`}>{entry.type}</span>
                    <span className="badge badge-gray text-xs flex items-center gap-1"><Bot size={10} />{entry.agent}</span>
                    <span className="badge badge-gray text-xs flex items-center gap-1"><Clock size={10} />Expires: {entry.expires}</span>
                  </div>
                  <p className={`text-sm text-gray-300 leading-relaxed ${expanded === entry.id ? '' : 'line-clamp-2'}`}>{entry.content}</p>
                  {entry.content.length > 100 && (
                    <button onClick={() => setExpanded(expanded === entry.id ? null : entry.id)} className="text-xs text-blue-400 hover:text-blue-300 mt-1">
                      {expanded === entry.id ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-600">{entry.tokens}t</span>
                  <Dropdown
                    align="right"
                    trigger={<button className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/5"><MoreHorizontal size={16} /></button>}
                    options={[
                      { label: 'Edit', value: 'edit', icon: <Brain size={13} /> },
                      { label: 'Pin', value: 'pin', icon: <Database size={13} /> },
                      { label: 'Delete', value: 'del', icon: <Trash2 size={13} />, danger: true, divider: true },
                    ]}
                    onSelect={v => {
                      if (v === 'edit') toast('Memory editor opened', 'info');
                      if (v === 'pin') toast('Memory pinned', 'success');
                      if (v === 'del') setDeleteEntry(entry);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 pl-11">
                <span className="text-[10px] text-gray-600">Created: {entry.created}</span>
                <span className="text-[10px] text-gray-700">•</span>
                <span className="text-[10px] text-gray-600">{entry.id}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center text-gray-600">
            No memory entries match your filters.
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Memory Entry"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => { setShowCreate(false); toast('Memory entry added', 'success'); }}>Add Memory</button>
          </>
        }
      >
        <div className="space-y-4">
          <div><label className="text-xs text-gray-400 mb-1.5 block">Agent</label>
            <select className="input w-full">{['SupportAgent', 'ContentBot Pro', 'ResearchBot', 'CodeReviewer'].map(a => <option key={a}>{a}</option>)}</select>
          </div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Memory Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['Episodic', 'Semantic', 'Procedural'].map(t => (
                <button key={t} className="p-3 rounded-lg border border-gray-700 text-xs text-gray-400 hover:border-blue-500 hover:text-white transition-all">{t}</button>
              ))}
            </div>
          </div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Content</label>
            <textarea className="input w-full h-28 resize-none text-sm" placeholder="What should the agent remember?" />
          </div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Expiry</label>
            <select className="input w-full"><option>Never</option><option>7 days</option><option>30 days</option><option>90 days</option></select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteEntry} onClose={() => setDeleteEntry(null)}
        onConfirm={() => { setEntries(e => e.filter(x => x.id !== deleteEntry?.id)); toast('Memory entry deleted', 'success'); setDeleteEntry(null); }}
        title="Delete Memory" message="Delete this memory entry? The agent will lose access to this information." confirmLabel="Delete" danger />
    </div>
  );
}
