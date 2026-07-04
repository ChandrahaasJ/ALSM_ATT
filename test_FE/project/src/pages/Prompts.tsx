import React, { useState } from 'react';
import {
  FileText, Plus, Search, MoreHorizontal, Copy, Edit, Trash2,
  Eye, Star, TrendingUp, GitBranch, Clock, Zap
} from 'lucide-react';
import { prompts } from '../data';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { Dropdown } from '../components/Dropdown';
import { Pagination } from '../components/Pagination';
import { toast } from '../components/Toast';

export function Prompts() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [viewPrompt, setViewPrompt] = useState<typeof prompts[0] | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<typeof prompts[0] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [promptList, setPromptList] = useState(prompts);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'versions'>('edit');
  const [promptContent, setPromptContent] = useState(`You are a professional content writer specializing in B2B SaaS.

# Task
Write a {{word_count}}-word blog post about {{topic}} targeting {{audience}}.

# Guidelines
- Use clear, concise language
- Include actionable insights
- Start with a compelling hook
- End with a strong call to action

# Output Format
Return the blog post in markdown format with proper headings.`);

  const categories = ['all', ...Array.from(new Set(promptList.map(p => p.category)))];
  const filtered = promptList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    return matchSearch && matchCat;
  });
  const perPage = 8;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Prompt Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">{promptList.length} prompts • {promptList.reduce((s, p) => s + p.uses, 0).toLocaleString()} total uses</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs"><Star size={13} />Favorites</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs"><Plus size={14} />New Prompt</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Prompts', value: promptList.length, icon: <FileText size={16} />, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Active', value: promptList.filter(p => p.status === 'active').length, icon: <Zap size={16} />, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Total Uses', value: promptList.reduce((s, p) => s + p.uses, 0).toLocaleString(), icon: <TrendingUp size={16} />, color: 'text-violet-400 bg-violet-500/10' },
          { label: 'Avg Tokens', value: Math.round(promptList.reduce((s, p) => s + p.tokens, 0) / promptList.length), icon: <Clock size={16} />, color: 'text-amber-400 bg-amber-500/10' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color.split(' ')[1]}`}>
              <span className={s.color.split(' ')[0]}>{s.icon}</span>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 w-full text-sm" placeholder="Search prompts..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => { setActiveCategory(c); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${activeCategory === c ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700'}`}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
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
                {['Prompt', 'Category', 'Model', 'Status', 'Version', 'Uses', 'Tokens', 'Modified', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewPrompt(p)}>
                      <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                        <FileText size={13} className="text-violet-400" />
                      </div>
                      <span className="text-white font-medium hover:text-blue-400 transition-colors">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge badge-gray text-xs">{p.category}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.model}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${p.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.version}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{p.uses.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.tokens}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.lastModified}</td>
                  <td className="px-4 py-3">
                    <Dropdown
                      align="right"
                      trigger={<button className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/5"><MoreHorizontal size={16} /></button>}
                      options={[
                        { label: 'Edit', value: 'edit', icon: <Edit size={13} /> },
                        { label: 'Duplicate', value: 'dup', icon: <Copy size={13} /> },
                        { label: 'View Versions', value: 'ver', icon: <GitBranch size={13} /> },
                        { label: 'Delete', value: 'del', icon: <Trash2 size={13} />, danger: true, divider: true },
                      ]}
                      onSelect={v => {
                        if (v === 'edit') setViewPrompt(p);
                        if (v === 'dup') toast(`"${p.name}" duplicated`, 'success');
                        if (v === 'ver') toast('Version history loaded', 'info');
                        if (v === 'del') setDeletePrompt(p);
                      }}
                    />
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-600">No prompts found.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} />
      </div>

      {/* Prompt Editor Drawer */}
      <Drawer open={!!viewPrompt} onClose={() => setViewPrompt(null)} title={`Edit: ${viewPrompt?.name}`} width="w-[600px]"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setViewPrompt(null)}>Cancel</button>
            <button className="btn-ghost text-xs" onClick={() => toast('Running test...', 'info')}>Test Prompt</button>
            <button className="btn-primary" onClick={() => { toast('Prompt saved', 'success'); setViewPrompt(null); }}>Save</button>
          </>
        }
      >
        {viewPrompt && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="badge badge-gray">{viewPrompt.category}</span>
              <span className="badge badge-blue">{viewPrompt.model}</span>
              <span className="badge badge-gray">{viewPrompt.version}</span>
              <span className={`badge ${viewPrompt.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>{viewPrompt.status}</span>
            </div>
            <div className="flex gap-1 border-b border-gray-800 pb-2">
              {(['edit', 'preview', 'versions'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`tab ${activeTab === t ? 'active' : ''}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {activeTab === 'edit' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">System Prompt</label>
                  <textarea
                    className="input w-full h-64 resize-none font-mono text-xs leading-relaxed"
                    value={promptContent}
                    onChange={e => setPromptContent(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>~{Math.round(promptContent.length / 4)} tokens</span>
                  <span>•</span>
                  <span>{promptContent.split('\n').length} lines</span>
                  <span>•</span>
                  <span>{(promptContent.match(/\{\{.*?\}\}/g) || []).length} variables</span>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Temperature</label>
                  <input type="range" min="0" max="2" step="0.1" defaultValue="0.7" className="w-full accent-blue-500" />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>Precise (0)</span><span>Creative (2)</span></div>
                </div>
              </div>
            )}
            {activeTab === 'preview' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
                  <div className="text-xs text-gray-500 mb-2">Rendered prompt with test variables:</div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {promptContent.replace('{{word_count}}', '1500').replace('{{topic}}', 'AI automation').replace('{{audience}}', 'CTOs')}
                  </pre>
                </div>
              </div>
            )}
            {activeTab === 'versions' && (
              <div className="space-y-2">
                {[{ v: 'v3.2', date: '2 days ago', author: 'Sarah Chen', note: 'Improved output formatting' },
                  { v: 'v3.1', date: '1 week ago', author: 'Mike Torres', note: 'Added tone guidelines' },
                  { v: 'v3.0', date: '2 weeks ago', author: 'Sarah Chen', note: 'Major rewrite for clarity' },
                  { v: 'v2.5', date: '1 month ago', author: 'System', note: 'Auto-saved' },
                ].map(ver => (
                  <div key={ver.v} className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <div>
                      <div className="flex items-center gap-2"><span className="badge badge-blue text-xs">{ver.v}</span><span className="text-xs text-white">{ver.note}</span></div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{ver.author} • {ver.date}</div>
                    </div>
                    <button onClick={() => toast(`Restored ${ver.v}`, 'success')} className="btn-ghost text-xs">Restore</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Prompt" size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => { setShowCreate(false); toast('Prompt created', 'success'); }}>Create Prompt</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-400 mb-1.5 block">Name *</label><input className="input w-full" placeholder="e.g. Email Drafter" /></div>
            <div><label className="text-xs text-gray-400 mb-1.5 block">Category</label><input className="input w-full" placeholder="e.g. Marketing" /></div>
          </div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Model</label>
            <select className="input w-full"><option>GPT-4o</option><option>GPT-4o-mini</option><option>Claude 3.5</option></select>
          </div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Prompt Content</label>
            <textarea className="input w-full h-40 resize-none font-mono text-xs" placeholder="Write your prompt here... Use {{variable}} for dynamic values." />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deletePrompt} onClose={() => setDeletePrompt(null)}
        onConfirm={() => { setPromptList(l => l.filter(p => p.id !== deletePrompt?.id)); toast('Prompt deleted', 'success'); setDeletePrompt(null); }}
        title="Delete Prompt" message={`Delete "${deletePrompt?.name}"?`} confirmLabel="Delete" danger />
    </div>
  );
}
