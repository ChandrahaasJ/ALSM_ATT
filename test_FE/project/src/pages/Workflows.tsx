import React, { useState } from 'react';
import {
  GitBranch, Plus, Search, Play, Pause, MoreHorizontal, Eye, Edit,
  Trash2, CheckCircle2, ChevronRight,
  ArrowRight, Zap
} from 'lucide-react';
import { workflows } from '../data';
import { Workflow } from '../types';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { Dropdown } from '../components/Dropdown';
import { Pagination } from '../components/Pagination';
import { toast } from '../components/Toast';

const statusBadge = (s: Workflow['status']) => {
  const map = { running: 'badge-green', paused: 'badge-yellow', failed: 'badge-red', completed: 'badge-blue', scheduled: 'badge-gray' };
  return map[s] || 'badge-gray';
};

export function Workflows() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewWF, setViewWF] = useState<Workflow | null>(null);
  const [deleteWF, setDeleteWF] = useState<Workflow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [workflowList, setWorkflowList] = useState(workflows);
  const [activeTab, setActiveTab] = useState<'list' | 'builder'>('list');

  const filtered = workflowList.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const perPage = 6;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleWF = (wf: Workflow) => {
    const next = wf.status === 'running' ? 'paused' : 'running';
    setWorkflowList(list => list.map(w => w.id === wf.id ? { ...w, status: next } : w));
    toast(`"${wf.name}" ${next}`, next === 'running' ? 'success' : 'info');
  };

  const deleteConfirmed = () => {
    if (!deleteWF) return;
    setWorkflowList(list => list.filter(w => w.id !== deleteWF.id));
    toast(`"${deleteWF.name}" deleted`, 'success');
    setDeleteWF(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Workflows</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workflowList.length} workflows configured</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab(t => t === 'list' ? 'builder' : 'list')} className="btn-secondary text-xs">
            {activeTab === 'list' ? <><Zap size={13} />Flow Builder</> : <><GitBranch size={13} />List View</>}
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs"><Plus size={14} />New Workflow</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { s: 'running', label: 'Running', color: 'text-emerald-400' },
          { s: 'scheduled', label: 'Scheduled', color: 'text-blue-400' },
          { s: 'paused', label: 'Paused', color: 'text-amber-400' },
          { s: 'failed', label: 'Failed', color: 'text-red-400' },
          { s: 'completed', label: 'Completed', color: 'text-gray-400' },
        ].map(({ s, label, color }) => (
          <div key={s} className="card p-4 text-center cursor-pointer hover:border-gray-700 transition-all" onClick={() => setStatusFilter(s)}>
            <div className={`text-2xl font-bold ${color}`}>{workflowList.filter(w => w.status === s).length}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {activeTab === 'builder' ? (
        <div className="card p-6">
          <div className="text-center py-8">
            <div className="text-sm font-semibold text-white mb-2">Visual Flow Builder</div>
            <p className="text-xs text-gray-500 mb-6">Drag and drop nodes to build your workflow</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {['Trigger', 'Agent', 'Condition', 'Transform', 'Action', 'Output'].map((node, i) => (
                <React.Fragment key={node}>
                  <div className={`px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer transition-all hover:scale-105 ${
                    i === 0 ? 'bg-green-500/15 border-green-500/30 text-green-400' :
                    i === 5 ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
                    'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      {i === 0 ? <Zap size={14} /> : i === 1 ? <GitBranch size={14} /> : <ChevronRight size={14} />}
                      {node}
                    </div>
                  </div>
                  {i < 5 && <ArrowRight size={14} className="text-gray-700" />}
                </React.Fragment>
              ))}
            </div>
            <button onClick={() => toast('Flow saved as draft', 'success')} className="btn-primary mt-8 text-sm">
              Save Flow
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input className="input pl-9 w-full text-sm" placeholder="Search workflows..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'running', 'scheduled', 'paused', 'failed', 'completed'].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Workflow', 'Status', 'Steps', 'Runs', 'Last Run', 'Next Run', 'Owner', ''].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-xs text-gray-500 font-medium ${h === '' ? 'w-10' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(wf => (
                    <tr key={wf.id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="cursor-pointer" onClick={() => setViewWF(wf)}>
                          <div className="text-sm text-white font-medium hover:text-blue-400 transition-colors">{wf.name}</div>
                          <div className="text-[11px] text-gray-600">{wf.description.substring(0, 40)}...</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${statusBadge(wf.status)}`}>
                          {wf.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />}
                          {wf.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{wf.steps} steps</td>
                      <td className="px-4 py-3 text-gray-300">{wf.runs.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{wf.lastRun}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{wf.nextRun}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-300">
                            {wf.owner.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-xs text-gray-400 hidden lg:block">{wf.owner}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Dropdown
                          align="right"
                          trigger={<button className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"><MoreHorizontal size={16} /></button>}
                          options={[
                            { label: 'View', value: 'view', icon: <Eye size={13} /> },
                            { label: wf.status === 'running' ? 'Pause' : 'Run', value: 'toggle', icon: wf.status === 'running' ? <Pause size={13} /> : <Play size={13} /> },
                            { label: 'Edit', value: 'edit', icon: <Edit size={13} /> },
                            { label: 'Delete', value: 'delete', icon: <Trash2 size={13} />, danger: true, divider: true },
                          ]}
                          onSelect={v => {
                            if (v === 'view') setViewWF(wf);
                            if (v === 'toggle') toggleWF(wf);
                            if (v === 'edit') toast('Edit workflow opened', 'info');
                            if (v === 'delete') setDeleteWF(wf);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-600">No workflows match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} />
          </div>
        </>
      )}

      {/* View Drawer */}
      <Drawer open={!!viewWF} onClose={() => setViewWF(null)} title={viewWF?.name || ''}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setViewWF(null)}>Close</button>
            <button className="btn-primary" onClick={() => { toggleWF(viewWF!); setViewWF(null); }}>
              {viewWF?.status === 'running' ? 'Pause' : 'Run Now'}
            </button>
          </>
        }
      >
        {viewWF && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className={`badge ${statusBadge(viewWF.status)}`}>{viewWF.status}</span>
              <span className="text-xs text-gray-500">{viewWF.id}</span>
            </div>
            <p className="text-sm text-gray-400">{viewWF.description}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Runs', value: viewWF.runs.toLocaleString() },
                { label: 'Steps', value: viewWF.steps.toString() },
                { label: 'Avg Duration', value: viewWF.duration },
                { label: 'Owner', value: viewWF.owner },
              ].map(s => (
                <div key={s.label} className="card p-3">
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className="text-sm text-white font-medium">{s.value}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 mb-3">Workflow Steps</div>
              <div className="space-y-2">
                {Array.from({ length: viewWF.steps }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'}`}>{i + 1}</div>
                    <span className="text-xs text-gray-300">Step {i + 1}: {['Trigger', 'Fetch Data', 'Process', 'Validate', 'Transform', 'Route', 'Execute', 'Notify', 'Log', 'Complete'][i % 10]}</span>
                    {i < 4 && <CheckCircle2 size={13} className="text-emerald-400 ml-auto" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Workflow"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => { setShowCreate(false); toast('Workflow created', 'success'); }}>Create</button>
          </>
        }
      >
        <div className="space-y-4">
          <div><label className="text-xs text-gray-400 mb-1.5 block">Workflow Name *</label><input className="input w-full" placeholder="e.g. Lead Enrichment Pipeline" /></div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Description</label><textarea className="input w-full h-20 resize-none" placeholder="What does this workflow do?" /></div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Trigger Type</label>
            <select className="input w-full">
              {['Webhook', 'Schedule', 'Manual', 'Event', 'API Call'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Owner</label><input className="input w-full" placeholder="Team or user name" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteWF} onClose={() => setDeleteWF(null)} onConfirm={deleteConfirmed}
        title="Delete Workflow" message={`Delete "${deleteWF?.name}"? All run history will be lost.`} confirmLabel="Delete" danger />
    </div>
  );
}
