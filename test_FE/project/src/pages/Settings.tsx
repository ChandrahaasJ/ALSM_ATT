import React, { useState } from 'react';
import {
  Settings as SettingsIcon, User, Shield, Bell, Palette, Database, Key,
  Webhook, Save, Eye, EyeOff, Plus, Trash2, Copy
} from 'lucide-react';
import { toast } from '../components/Toast';
import { Modal } from '../components/Modal';

const sections = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  { id: 'security', label: 'Security & Auth', icon: <Shield size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'api', label: 'API Keys', icon: <Key size={16} /> },
  { id: 'webhooks', label: 'Webhooks', icon: <Webhook size={16} /> },
  { id: 'data', label: 'Data & Privacy', icon: <Database size={16} /> },
];

export function Settings() {
  const [activeSection, setActiveSection] = useState('general');
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [orgName, setOrgName] = useState('Acme Corporation');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [twoFactor, setTwoFactor] = useState(true);
  const [ssoEnabled, setSsoEnabled] = useState(true);


  const [apiKeys, setApiKeys] = useState([
    { id: 'key-001', name: 'Production API Key', key: 'sk-prod-••••••••••••••••••••••••••••••••', created: '2026-01-15', lastUsed: '2 min ago', scopes: ['read', 'write', 'admin'] },
    { id: 'key-002', name: 'Development Key', key: 'sk-dev-••••••••••••••••••••••••••••••••', created: '2026-03-22', lastUsed: '1 hr ago', scopes: ['read', 'write'] },
    { id: 'key-003', name: 'CI/CD Pipeline', key: 'sk-ci-•••••••••••••••••••••••••••••••••', created: '2026-05-10', lastUsed: 'Yesterday', scopes: ['read'] },
  ]);

  const [notifSettings, setNotifSettings] = useState({
    agentErrors: true, workflowFailed: true, usageAlerts: true,
    weeklyReport: false, newFeatures: true, securityAlerts: true,
    emailDigest: false, slackNotifs: true,
  });

  const saveSection = () => toast('Settings saved', 'success');

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white">General Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-400 mb-1.5 block">Organization Name</label><input className="input w-full" value={orgName} onChange={e => setOrgName(e.target.value)} /></div>
              <div><label className="text-xs text-gray-400 mb-1.5 block">Slug</label><input className="input w-full" defaultValue="acme-corp" /></div>
              <div><label className="text-xs text-gray-400 mb-1.5 block">Default Timezone</label>
                <select className="input w-full" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'].map(tz => <option key={tz}>{tz}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400 mb-1.5 block">Language</label>
                <select className="input w-full" value={language} onChange={e => setLanguage(e.target.value)}>
                  {[['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['ja', 'Japanese']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Organization Description</label>
              <textarea className="input w-full h-24 resize-none" defaultValue="Enterprise AI operations and automation platform." />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-800 border border-gray-700">
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Usage Telemetry</div>
                <div className="text-xs text-gray-500 mt-0.5">Help improve the platform by sending anonymous usage data</div>
              </div>
              <button onClick={() => toast('Setting updated', 'success')} className="w-10 h-5 bg-blue-600 rounded-full relative">
                <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white">Profile Settings</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white">SC</div>
              <div>
                <button className="btn-secondary text-xs mb-1">Change Avatar</button>
                <p className="text-xs text-gray-600">JPG, PNG up to 2MB</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-400 mb-1.5 block">First Name</label><input className="input w-full" defaultValue="Sarah" /></div>
              <div><label className="text-xs text-gray-400 mb-1.5 block">Last Name</label><input className="input w-full" defaultValue="Chen" /></div>
              <div><label className="text-xs text-gray-400 mb-1.5 block">Email</label><input className="input w-full" defaultValue="sarah@acme.com" /></div>
              <div><label className="text-xs text-gray-400 mb-1.5 block">Title</label><input className="input w-full" defaultValue="Head of AI Operations" /></div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white">Security & Authentication</h2>
            <div className="space-y-3">
              {[
                { label: 'Two-Factor Authentication', desc: 'Require 2FA for all users', state: twoFactor, set: setTwoFactor },
                { label: 'SSO Enforcement', desc: 'Require login via SAML SSO', state: ssoEnabled, set: setSsoEnabled },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between p-4 rounded-xl bg-gray-800 border border-gray-700">
                  <div>
                    <div className="text-sm font-medium text-white">{s.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                  </div>
                  <button onClick={() => { s.set(!s.state); toast(`${s.label} ${!s.state ? 'enabled' : 'disabled'}`, 'success'); }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${s.state ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${s.state ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Change Password</h3>
              <div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1.5 block">Current Password</label><input type="password" className="input w-full" placeholder="••••••••" /></div>
                <div><label className="text-xs text-gray-400 mb-1.5 block">New Password</label><input type="password" className="input w-full" placeholder="••••••••" /></div>
                <div><label className="text-xs text-gray-400 mb-1.5 block">Confirm Password</label><input type="password" className="input w-full" placeholder="••••••••" /></div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-sm font-medium text-red-400 mb-1">Danger Zone</div>
              <div className="text-xs text-gray-400 mb-3">Permanently delete your organization and all data. This cannot be undone.</div>
              <button onClick={() => toast('Contact support to delete your account', 'error')} className="btn-danger text-xs">Delete Organization</button>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">API Keys</h2>
              <button onClick={() => setShowNewKey(true)} className="btn-primary text-xs"><Plus size={13} />Create API Key</button>
            </div>
            <div className="space-y-3">
              {apiKeys.map(key => (
                <div key={key.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{key.name}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <code className="text-xs text-gray-500 font-mono">{showKeyValue ? 'sk-prod-a1b2c3d4e5f6g7h8i9j0' : key.key}</code>
                        <button onClick={() => toast('Key copied to clipboard', 'success')} className="text-gray-600 hover:text-gray-300"><Copy size={12} /></button>
                        <button onClick={() => setShowKeyValue(!showKeyValue)} className="text-gray-600 hover:text-gray-300">
                          {showKeyValue ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {key.scopes.map(s => <span key={s} className="badge badge-gray text-[10px]">{s}</span>)}
                        <span className="text-[10px] text-gray-600">Last used: {key.lastUsed}</span>
                      </div>
                    </div>
                    <button onClick={() => { setApiKeys(k => k.filter(x => x.id !== key.id)); toast('API key revoked', 'success'); }}
                      className="text-gray-600 hover:text-red-400 transition-colors ml-3">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white">Notification Preferences</h2>
            {Object.entries(notifSettings).map(([key, val]) => {
              const labels: Record<string, { label: string; desc: string }> = {
                agentErrors: { label: 'Agent Errors', desc: 'Notify when an agent exceeds error threshold' },
                workflowFailed: { label: 'Workflow Failures', desc: 'Alert when a workflow fails or is blocked' },
                usageAlerts: { label: 'Usage Alerts', desc: 'Warn when approaching plan limits' },
                weeklyReport: { label: 'Weekly Summary', desc: 'Weekly performance digest email' },
                newFeatures: { label: 'New Features', desc: 'Product announcements and updates' },
                securityAlerts: { label: 'Security Alerts', desc: 'Login attempts and security events' },
                emailDigest: { label: 'Email Digest', desc: 'Daily email summary of all alerts' },
                slackNotifs: { label: 'Slack Notifications', desc: 'Send notifications to connected Slack workspace' },
              };
              const info = labels[key];
              if (!info) return null;
              return (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-800 border border-gray-700">
                  <div>
                    <div className="text-sm font-medium text-white">{info.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{info.desc}</div>
                  </div>
                  <button
                    onClick={() => { setNotifSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] })); toast(`Setting updated`, 'success'); }}
                    className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${val ? 'bg-blue-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${val ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white capitalize">{sections.find(s => s.id === activeSection)?.label}</h2>
            <div className="card p-8 text-center text-gray-600">
              Settings for this section will appear here.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your organization preferences</p>
        </div>
        {activeSection !== 'api' && (
          <button onClick={saveSection} className="btn-primary text-xs"><Save size={13} />Save Changes</button>
        )}
      </div>

      <div className="flex gap-5">
        {/* Sidebar nav */}
        <div className="w-48 shrink-0">
          <div className="card p-2 space-y-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === s.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="card p-6">{renderSection()}</div>
        </div>
      </div>

      {/* New API Key Modal */}
      <Modal open={showNewKey} onClose={() => setShowNewKey(false)} title="Create API Key"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowNewKey(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => {
              setApiKeys(k => [...k, { id: `key-${Date.now()}`, name: newKeyName || 'New Key', key: 'sk-new-••••••••••••••••••', created: '2026-07-04', lastUsed: 'Never', scopes: ['read'] }]);
              setShowNewKey(false); setNewKeyName(''); toast('API key created', 'success');
            }} disabled={!newKeyName}>Create</button>
          </>
        }
      >
        <div className="space-y-4">
          <div><label className="text-xs text-gray-400 mb-1.5 block">Key Name *</label><input className="input w-full" placeholder="e.g. Production API Key" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} /></div>
          <div><label className="text-xs text-gray-400 mb-1.5 block">Scopes</label>
            <div className="space-y-2">
              {['read', 'write', 'admin'].map(scope => (
                <label key={scope} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked={scope === 'read'} className="w-4 h-4 accent-blue-500 rounded" />
                  <span className="text-sm text-gray-300 capitalize">{scope}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
