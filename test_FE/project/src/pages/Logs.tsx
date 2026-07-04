import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Download, AlertCircle, AlertTriangle, Info, Bug, Clock, Loader } from 'lucide-react';
import { logs as initialLogs } from '../data';
import { Log } from '../types';
import { Pagination } from '../components/Pagination';
import { Drawer } from '../components/Drawer';
import { Select } from '../components/Dropdown';
import { toast } from '../components/Toast';

const levelIcon = (level: Log['level']) => {
  if (level === 'error') return <AlertCircle size={14} className="text-red-400" />;
  if (level === 'warn') return <AlertTriangle size={14} className="text-amber-400" />;
  if (level === 'debug') return <Bug size={14} className="text-gray-600" />;
  return <Info size={14} className="text-blue-400" />;
};

const levelBadge = { error: 'badge-red', warn: 'badge-yellow', info: 'badge-blue', debug: 'badge-gray' };

export function Logs() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [logList] = useState<Log[]>(initialLogs);
  const [viewLog, setViewLog] = useState<Log | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'performance'>('all');
  const perPage = 10;

  const services = ['all', ...Array.from(new Set(logList.map(l => l.service)))];

  const filtered = logList.filter(l => {
    const matchSearch = l.message.toLowerCase().includes(search.toLowerCase()) || l.service.toLowerCase().includes(search.toLowerCase()) || l.traceId.includes(search);
    const matchLevel = levelFilter === 'all' || l.level === levelFilter;
    const matchService = serviceFilter === 'all' || l.service === serviceFilter;
    const matchTab = activeTab === 'all' ? true : activeTab === 'errors' ? (l.level === 'error' || l.level === 'warn') : l.duration !== undefined;
    return matchSearch && matchLevel && matchService && matchTab;
  });

  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (!autoRefresh) return;
    const i = setInterval(() => {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 500);
    }, 5000);
    return () => clearInterval(i);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); toast('Logs refreshed', 'info'); }, 800);
  };

  const handleExport = () => toast('Logs exported as CSV', 'success');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logList.length} entries • last updated just now</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs">
            <span className="text-gray-400">Auto-refresh</span>
            <button
              onClick={() => setAutoRefresh(a => !a)}
              className={`w-8 h-4 rounded-full relative transition-colors ${autoRefresh ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoRefresh ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
          <button onClick={handleRefresh} className="btn-secondary text-xs">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleExport} className="btn-secondary text-xs"><Download size={13} />Export</button>
        </div>
      </div>

      {/* Log level summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { level: 'error', label: 'Errors', color: 'text-red-400 bg-red-500/10', count: logList.filter(l => l.level === 'error').length },
          { level: 'warn', label: 'Warnings', color: 'text-amber-400 bg-amber-500/10', count: logList.filter(l => l.level === 'warn').length },
          { level: 'info', label: 'Info', color: 'text-blue-400 bg-blue-500/10', count: logList.filter(l => l.level === 'info').length },
          { level: 'debug', label: 'Debug', color: 'text-gray-400 bg-gray-500/10', count: logList.filter(l => l.level === 'debug').length },
        ].map(s => (
          <div key={s.level} className="card p-4 cursor-pointer hover:border-gray-700 transition-all"
            onClick={() => { setLevelFilter(s.level); setActiveTab('all'); }}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color.split(' ')[1]}`}>
                {levelIcon(s.level as Log['level'])}
              </div>
              <div>
                <div className={`text-xl font-bold ${s.color.split(' ')[0]}`}>{s.count}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(['all', 'errors', 'performance'] as const).map(t => (
          <button key={t} onClick={() => { setActiveTab(t); setPage(1); }}
            className={`tab ${activeTab === t ? 'active' : ''}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === t ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>
              {t === 'all' ? logList.length : t === 'errors' ? logList.filter(l => l.level === 'error' || l.level === 'warn').length : logList.filter(l => l.duration).length}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 w-full text-sm font-mono" placeholder="Search logs or trace ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={levelFilter} onChange={v => { setLevelFilter(v); setPage(1); }}
          options={[{ label: 'All Levels', value: 'all' }, ...['error', 'warn', 'info', 'debug'].map(l => ({ label: l.charAt(0).toUpperCase() + l.slice(1), value: l }))]} />
        <Select value={serviceFilter} onChange={v => { setServiceFilter(v); setPage(1); }}
          options={services.map(s => ({ label: s === 'all' ? 'All Services' : s, value: s }))} />
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['', 'Timestamp', 'Level', 'Service', 'Message', 'Trace ID', 'Duration'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(log => (
                <tr key={log.id} className="table-row cursor-pointer font-mono" onClick={() => setViewLog(log)}>
                  <td className="pl-4 py-3">{levelIcon(log.level)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${levelBadge[log.level]}`}>{log.level}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{log.service}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate font-sans">{log.message}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{log.traceId}</td>
                  <td className="px-4 py-3 text-gray-500">{log.duration ? `${log.duration}ms` : '—'}</td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-600 font-sans">No logs match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} />
      </div>

      {/* Log Detail Drawer */}
      <Drawer open={!!viewLog} onClose={() => setViewLog(null)} title="Log Entry Details"
        footer={<button className="btn-secondary" onClick={() => setViewLog(null)}>Close</button>}
      >
        {viewLog && (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              {levelIcon(viewLog.level)}
              <span className={`badge ${levelBadge[viewLog.level]}`}>{viewLog.level.toUpperCase()}</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Timestamp', value: viewLog.timestamp },
                { label: 'Service', value: viewLog.service },
                { label: 'Trace ID', value: viewLog.traceId },
                { label: 'Duration', value: viewLog.duration ? viewLog.duration + 'ms' : 'N/A' },
              ].map(field => (
                <div key={field.label} className="flex gap-4">
                  <span className="text-gray-600 w-24 shrink-0">{field.label}</span>
                  <span className="text-gray-300">{field.value}</span>
                </div>
              ))}
            </div>
            <div>
              <span className="text-gray-600 block mb-2">Message</span>
              <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">{viewLog.message}</div>
            </div>
            <div>
              <span className="text-gray-600 block mb-2">Stack Trace</span>
              <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-500 h-32 overflow-y-auto">
                {viewLog.level === 'error' ? `Error: ${viewLog.message}\n  at Agent.execute (agent.js:142)\n  at WorkflowRunner.step (workflow.js:89)\n  at async run (index.js:23)` : 'No stack trace available.'}
              </div>
            </div>
            <button onClick={() => toast('Trace ID copied', 'success')} className="btn-secondary w-full text-xs font-sans">Copy Trace ID</button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
