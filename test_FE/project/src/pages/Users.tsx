import { useState } from 'react';
import {
  Users as UsersIcon, Search, MoreHorizontal, Edit, Trash2, Shield,
  Mail, Clock, CheckCircle, XCircle, AlertCircle, UserPlus, Download
} from 'lucide-react';
import { users } from '../data';
import { User } from '../types';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { Dropdown } from '../components/Dropdown';
import { Pagination } from '../components/Pagination';
import { toast } from '../components/Toast';

const roleBadge: Record<User['role'], string> = {
  admin: 'badge-red',
  developer: 'badge-blue',
  editor: 'badge-green',
  viewer: 'badge-gray',
};

const statusIcon = (s: User['status']) => {
  if (s === 'active') return <CheckCircle size={13} className="text-emerald-400" />;
  if (s === 'inactive') return <XCircle size={13} className="text-gray-600" />;
  return <AlertCircle size={13} className="text-amber-400" />;
};

export function Users() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [userList, setUserList] = useState(users);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [activeTab, setActiveTab] = useState<'details' | 'permissions' | 'activity'>('details');

  const roles = ['all', 'admin', 'developer', 'editor', 'viewer'];
  const perPage = 8;

  const filtered = userList.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleInvite = () => {
    const emails = inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean);
    if (!emails.length) return;
    setShowInvite(false);
    setInviteEmails('');
    toast(`${emails.length} invitation${emails.length > 1 ? 's' : ''} sent`, 'success');
  };

  const handleDeleteUser = () => {
    if (!deleteUser) return;
    setUserList(l => l.filter(u => u.id !== deleteUser.id));
    toast(`${deleteUser.name} removed`, 'success');
    setDeleteUser(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{userList.length} members in your organization</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast('User list exported', 'success')} className="btn-secondary text-xs"><Download size={13} />Export</button>
          <button onClick={() => setShowInvite(true)} className="btn-primary text-xs"><UserPlus size={14} />Invite Users</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: userList.length, color: 'text-white' },
          { label: 'Active', value: userList.filter(u => u.status === 'active').length, color: 'text-emerald-400' },
          { label: 'Pending', value: userList.filter(u => u.status === 'pending').length, color: 'text-amber-400' },
          { label: 'Inactive', value: userList.filter(u => u.status === 'inactive').length, color: 'text-gray-500' },
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
          <input className="input pl-9 w-full text-sm" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {roles.map(r => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${roleFilter === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white bg-gray-800 border border-gray-700'}`}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paged.map(user => (
          <div key={user.id} className="card p-4 hover:border-gray-700 transition-all flex items-center gap-4 group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              user.status === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}>
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">{user.name}</span>
                {statusIcon(user.status)}
              </div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`badge text-xs ${roleBadge[user.role]}`}><Shield size={9} />{user.role}</span>
                <span className="text-[10px] text-gray-600 flex items-center gap-1"><Clock size={9} />{user.lastActive}</span>
              </div>
            </div>
            <Dropdown
              align="right"
              trigger={<button className="p-1.5 rounded text-gray-600 hover:text-gray-300 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"><MoreHorizontal size={16} /></button>}
              options={[
                { label: 'View Profile', value: 'view', icon: <UsersIcon size={13} /> },
                { label: 'Edit Role', value: 'edit', icon: <Edit size={13} /> },
                { label: 'Send Email', value: 'email', icon: <Mail size={13} /> },
                { label: 'Remove', value: 'del', icon: <Trash2 size={13} />, danger: true, divider: true },
              ]}
              onSelect={v => {
                if (v === 'view') { setViewUser(user); setActiveTab('details'); }
                if (v === 'edit') { setViewUser(user); setActiveTab('permissions'); }
                if (v === 'email') toast(`Email sent to ${user.email}`, 'success');
                if (v === 'del') setDeleteUser(user);
              }}
            />
          </div>
        ))}
      </div>
      <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} />

      {/* User Drawer */}
      <Drawer open={!!viewUser} onClose={() => setViewUser(null)} title={viewUser?.name || ''}
        footer={
          <>
            <button className="btn-danger text-xs" onClick={() => { setDeleteUser(viewUser); setViewUser(null); }}>Remove User</button>
            <button className="btn-primary" onClick={() => { toast('Changes saved', 'success'); setViewUser(null); }}>Save Changes</button>
          </>
        }
      >
        {viewUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
                {viewUser.avatar}
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{viewUser.name}</div>
                <div className="text-sm text-gray-500">{viewUser.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${roleBadge[viewUser.role]}`}>{viewUser.role}</span>
                  {statusIcon(viewUser.status)}
                  <span className="text-xs text-gray-600">{viewUser.status}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 border-b border-gray-800 pb-2">
              {(['details', 'permissions', 'activity'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`tab ${activeTab === t ? 'active' : ''}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'details' && (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1.5 block">Full Name</label><input className="input w-full" defaultValue={viewUser.name} /></div>
                <div><label className="text-xs text-gray-400 mb-1.5 block">Email</label><input className="input w-full" defaultValue={viewUser.email} /></div>
                <div><label className="text-xs text-gray-400 mb-1.5 block">Last Active</label><div className="text-sm text-gray-400 py-2">{viewUser.lastActive}</div></div>
              </div>
            )}
            {activeTab === 'permissions' && (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1.5 block">Role</label>
                  <select className="input w-full" defaultValue={viewUser.role}>
                    {['admin', 'developer', 'editor', 'viewer'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Manage Agents', enabled: viewUser.role !== 'viewer' },
                    { label: 'Edit Prompts', enabled: viewUser.role !== 'viewer' },
                    { label: 'View Analytics', enabled: true },
                    { label: 'Manage Users', enabled: viewUser.role === 'admin' },
                    { label: 'Billing Access', enabled: viewUser.role === 'admin' },
                  ].map(p => (
                    <div key={p.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700">
                      <span className="text-sm text-gray-300">{p.label}</span>
                      <button className={`w-10 h-5 rounded-full relative transition-colors ${p.enabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${p.enabled ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'activity' && (
              <div className="space-y-2">
                {[
                  { action: 'Logged in via SSO', time: 'Just now' },
                  { action: 'Edited "ContentBot Pro" agent', time: '2 hr ago' },
                  { action: 'Viewed Analytics dashboard', time: '3 hr ago' },
                  { action: 'Created workflow "Lead Enrichment"', time: '1 day ago' },
                  { action: 'Invited alex@acme.com', time: '3 days ago' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-400 flex-1">{a.action}</span>
                    <span className="text-[10px] text-gray-600 shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Members"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleInvite} disabled={!inviteEmails.trim()}>Send Invites</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Email Addresses (comma or line separated)</label>
            <textarea className="input w-full h-28 resize-none text-sm" placeholder="alice@company.com&#10;bob@company.com&#10;carol@company.com" value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Role</label>
            <select className="input w-full" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              {['admin', 'developer', 'editor', 'viewer'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            Invites expire after 7 days. Users will receive an email with a sign-in link.
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteUser} onClose={() => setDeleteUser(null)} onConfirm={handleDeleteUser}
        title="Remove User" message={`Remove ${deleteUser?.name} from the organization? They will lose all access immediately.`} confirmLabel="Remove" danger />
    </div>
  );
}
