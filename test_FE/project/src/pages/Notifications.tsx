import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { notifications as initialNotifs } from '../data';
import { Notification } from '../types';
import { ConfirmDialog } from '../components/Modal';
import { toast } from '../components/Toast';

const typeIcon = (t: Notification['type']) => {
  if (t === 'error') return <AlertCircle size={16} className="text-red-400 shrink-0" />;
  if (t === 'warning') return <AlertTriangle size={16} className="text-amber-400 shrink-0" />;
  if (t === 'success') return <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />;
  return <Info size={16} className="text-blue-400 shrink-0" />;
};

const typeBorder: Record<Notification['type'], string> = {
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  success: 'border-l-emerald-500',
  info: 'border-l-blue-500',
};

export function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>(initialNotifs);
  const [filter, setFilter] = useState<'all' | 'unread' | 'error' | 'warning' | 'success' | 'info'>('all');
  const [clearAll, setClearAll] = useState(false);

  const filtered = notifs.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const markRead = (id: string) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const markAllRead = () => { setNotifs(n => n.map(x => ({ ...x, read: true }))); toast('All marked as read', 'success'); };
  const deleteNotif = (id: string) => setNotifs(n => n.filter(x => x.id !== id));
  const clearAllConfirm = () => { setNotifs([]); toast('All notifications cleared', 'success'); };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-xs"><CheckCheck size={13} />Mark all read</button>
          )}
          {notifs.length > 0 && (
            <button onClick={() => setClearAll(true)} className="btn-secondary text-xs"><Trash2 size={13} />Clear all</button>
          )}
        </div>
      </div>

      {/* Type summaries */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { f: 'error' as const, label: 'Errors', icon: <AlertCircle size={15} className="text-red-400" />, bg: 'bg-red-500/10' },
          { f: 'warning' as const, label: 'Warnings', icon: <AlertTriangle size={15} className="text-amber-400" />, bg: 'bg-amber-500/10' },
          { f: 'success' as const, label: 'Success', icon: <CheckCircle2 size={15} className="text-emerald-400" />, bg: 'bg-emerald-500/10' },
          { f: 'info' as const, label: 'Info', icon: <Info size={15} className="text-blue-400" />, bg: 'bg-blue-500/10' },
        ].map(s => (
          <div key={s.f} className="card p-4 flex items-center gap-3 cursor-pointer hover:border-gray-700 transition-all" onClick={() => setFilter(s.f)}>
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>{s.icon}</div>
            <div>
              <div className="text-xl font-bold text-white">{notifs.filter(n => n.type === s.f).length}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'unread', 'error', 'warning', 'success', 'info'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800 border border-gray-700 hover:border-gray-600'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && unreadCount > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1 rounded-full">{unreadCount}</span>}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Bell size={32} className="mx-auto text-gray-700 mb-3" />
            <p className="text-sm text-gray-600">No notifications</p>
          </div>
        )}
        {filtered.map(n => (
          <div
            key={n.id}
            className={`card border-l-4 ${typeBorder[n.type]} p-4 hover:border-gray-700 transition-all group ${!n.read ? 'bg-white/[0.02]' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{typeIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${!n.read ? 'text-white' : 'text-gray-300'}`}>{n.title}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-gray-600 mt-1 block">{n.timestamp}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Mark as read">
                    <Check size={13} />
                  </button>
                )}
                <button onClick={() => deleteNotif(n.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Dismiss">
                  <X size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={clearAll}
        onClose={() => setClearAll(false)}
        onConfirm={clearAllConfirm}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This cannot be undone."
        confirmLabel="Clear All"
        danger
      />
    </div>
  );
}
