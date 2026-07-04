import React, { useState } from 'react';
import {
  BookOpen, Plus, Search, Upload, RefreshCw, MoreHorizontal, Eye,
  Trash2, FileText, Database, Clock, Cpu, CheckCircle2, Loader
} from 'lucide-react';
import { knowledgeDocs } from '../data';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { Dropdown } from '../components/Dropdown';
import { Pagination } from '../components/Pagination';
import { toast } from '../components/Toast';

export function KnowledgeBase() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [docs, setDocs] = useState(knowledgeDocs);
  const [viewDoc, setViewDoc] = useState<typeof knowledgeDocs[0] | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<typeof knowledgeDocs[0] | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [semanticQuery, setSemanticQuery] = useState('');
  const [searchResults, setSearchResults] = useState<null | { text: string; doc: string; score: number }[]>(null);
  const [searching, setSearching] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<string[]>([]);

  const categories = ['all', ...Array.from(new Set(docs.map(d => d.category)))];
  const filtered = docs.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || d.category === catFilter;
    return matchSearch && matchCat;
  });
  const perPage = 8;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const runSemanticSearch = () => {
    if (!semanticQuery) return;
    setSearching(true);
    setSearchResults(null);
    setTimeout(() => {
      setSearching(false);
      setSearchResults([
        { text: 'The product roadmap for Q3 includes three major features: AI-powered recommendations, real-time collaboration, and advanced analytics.', doc: 'Q2 Product Roadmap', score: 0.94 },
        { text: 'Engineering teams should follow the RFC process for any change affecting more than 2 services. PRs must include test coverage above 80%.', doc: 'Engineering Best Practices', score: 0.87 },
        { text: 'All customer-facing content must be reviewed by the legal team before publication. See the compliance checklist in Appendix A.', doc: 'Legal & Compliance Guide', score: 0.81 },
      ]);
    }, 1500);
  };

  const totalTokens = docs.filter(d => d.status === 'indexed').reduce((s, d) => s + d.tokens, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-0.5">{docs.filter(d => d.status === 'indexed').length} indexed documents • {(totalTokens / 1000).toFixed(0)}K tokens</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSearch(true)} className="btn-secondary text-xs"><Search size={13} />Semantic Search</button>
          <button onClick={() => setShowUpload(true)} className="btn-primary text-xs"><Upload size={13} />Upload Docs</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Documents', value: docs.length, icon: <FileText size={16} />, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Total Chunks', value: docs.reduce((s, d) => s + d.chunks, 0).toLocaleString(), icon: <Database size={16} />, color: 'text-violet-400 bg-violet-500/10' },
          { label: 'Token Count', value: (totalTokens / 1000).toFixed(0) + 'K', icon: <Cpu size={16} />, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Processing', value: docs.filter(d => d.status === 'processing').length, icon: <Loader size={16} />, color: 'text-amber-400 bg-amber-500/10' },
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
          <input className="input pl-9 w-full text-sm" placeholder="Search documents..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => { setCatFilter(c); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${catFilter === c ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800 border border-gray-700'}`}>
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
                {['Document', 'Source', 'Category', 'Status', 'Chunks', 'Tokens', 'Indexed', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(doc => (
                <tr key={doc.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewDoc(doc)}>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                        <FileText size={13} className="text-amber-400" />
                      </div>
                      <span className="text-sm text-white font-medium hover:text-blue-400 transition-colors">{doc.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge badge-gray text-xs">{doc.source}</span></td>
                  <td className="px-4 py-3"><span className="badge badge-blue text-xs">{doc.category}</span></td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${doc.status === 'indexed' ? 'badge-green' : 'badge-yellow'}`}>
                      {doc.status === 'processing' && <Loader size={10} className="animate-spin" />}
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{doc.chunks > 0 ? doc.chunks : '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{doc.tokens > 0 ? doc.tokens.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{doc.indexed}</td>
                  <td className="px-4 py-3">
                    <Dropdown
                      align="right"
                      trigger={<button className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/5"><MoreHorizontal size={16} /></button>}
                      options={[
                        { label: 'View', value: 'view', icon: <Eye size={13} /> },
                        { label: 'Re-index', value: 'reindex', icon: <RefreshCw size={13} /> },
                        { label: 'Delete', value: 'del', icon: <Trash2 size={13} />, danger: true, divider: true },
                      ]}
                      onSelect={v => {
                        if (v === 'view') setViewDoc(doc);
                        if (v === 'reindex') { toast(`Re-indexing "${doc.title}"...`, 'info'); }
                        if (v === 'del') setDeleteDoc(doc);
                      }}
                    />
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-600">No documents found.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} />
      </div>

      {/* View Drawer */}
      <Drawer open={!!viewDoc} onClose={() => setViewDoc(null)} title={viewDoc?.title || ''}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setViewDoc(null)}>Close</button>
            <button className="btn-primary" onClick={() => { toast('Re-indexing started', 'info'); setViewDoc(null); }}>Re-index</button>
          </>
        }
      >
        {viewDoc && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-gray">{viewDoc.source}</span>
              <span className="badge badge-blue">{viewDoc.category}</span>
              <span className={`badge ${viewDoc.status === 'indexed' ? 'badge-green' : 'badge-yellow'}`}>{viewDoc.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Chunks', value: viewDoc.chunks || '—' },
                { label: 'Tokens', value: viewDoc.tokens > 0 ? viewDoc.tokens.toLocaleString() : '—' },
                { label: 'Last Indexed', value: viewDoc.indexed },
                { label: 'Document ID', value: viewDoc.id },
              ].map(s => (
                <div key={s.label} className="card p-3">
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className="text-sm text-white font-medium">{s.value}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">Sample Chunk Preview</div>
              <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400 leading-relaxed">
                [Chunk 1/42] This document outlines the strategic priorities for Q2 and Q3, covering product development milestones, team structure changes, and key performance metrics to be tracked...
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Documents" size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => { setShowUpload(false); toast('Documents uploaded and queued for indexing', 'success'); }}>Upload & Index</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer"
            onClick={() => setUploadFiles([...uploadFiles, 'document.pdf', 'handbook.docx'])}>
            <Upload size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">Drop files here or <span className="text-blue-400">browse</span></p>
            <p className="text-xs text-gray-600 mt-1">PDF, DOCX, TXT, MD — max 50MB each</p>
          </div>
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              {uploadFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <FileText size={14} className="text-amber-400" />
                  <span className="text-sm text-gray-300 flex-1">{f}</span>
                  <CheckCircle2 size={14} className="text-emerald-400" />
                </div>
              ))}
            </div>
          )}
          <div><label className="text-xs text-gray-400 mb-1.5 block">Category</label><select className="input w-full"><option>Engineering</option><option>Product</option><option>Sales</option><option>Marketing</option><option>Legal</option></select></div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Chunk Size</label>
            <input type="range" min={256} max={2048} step={256} defaultValue={512} className="w-full accent-blue-500" />
            <div className="flex justify-between text-[10px] text-gray-600"><span>Small (256)</span><span>Large (2048)</span></div>
          </div>
        </div>
      </Modal>

      {/* Semantic Search Modal */}
      <Modal open={showSearch} onClose={() => { setShowSearch(false); setSearchResults(null); setSemanticQuery(''); }} title="Semantic Search" size="lg"
        footer={
          <button className="btn-secondary" onClick={() => { setShowSearch(false); setSearchResults(null); }}>Close</button>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Ask a question about your knowledge base..." value={semanticQuery} onChange={e => setSemanticQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSemanticSearch()} />
            <button onClick={runSemanticSearch} disabled={!semanticQuery || searching} className="btn-primary">
              {searching ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>
          {searching && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>}
          {searchResults && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">{searchResults.length} results found</p>
              {searchResults.map((r, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge badge-amber text-xs" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>{r.doc}</span>
                    <span className="text-xs text-emerald-400 font-medium">{(r.score * 100).toFixed(0)}% match</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteDoc} onClose={() => setDeleteDoc(null)}
        onConfirm={() => { setDocs(d => d.filter(x => x.id !== deleteDoc?.id)); toast('Document deleted', 'success'); setDeleteDoc(null); }}
        title="Delete Document" message={`Delete "${deleteDoc?.title}"? All indexed chunks will be removed.`} confirmLabel="Delete" danger />
    </div>
  );
}
