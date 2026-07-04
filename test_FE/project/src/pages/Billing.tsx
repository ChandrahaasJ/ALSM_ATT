import React, { useState } from 'react';
import {
  CreditCard, TrendingUp, Download, ChevronRight, CheckCircle, Zap,
  Users, Shield, Star, AlertTriangle, RefreshCw, ExternalLink, Clock
} from 'lucide-react';
import { Modal, ConfirmDialog } from '../components/Modal';
import { LineChart, BarChart } from '../components/Charts';
import { chartData } from '../data';
import { toast } from '../components/Toast';

const plans = [
  {
    id: 'starter', name: 'Starter', price: 99, description: 'For small teams getting started',
    features: ['5 Agents', '10 Workflows', '1M tokens/mo', '5 users', 'Email support'],
    popular: false,
  },
  {
    id: 'pro', name: 'Pro', price: 499, description: 'For growing organizations',
    features: ['25 Agents', '50 Workflows', '10M tokens/mo', '25 users', 'Priority support', 'Analytics', 'SSO'],
    popular: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: null, description: 'For large-scale operations',
    features: ['Unlimited Agents', 'Unlimited Workflows', 'Custom tokens', 'Unlimited users', 'Dedicated SLA', 'Custom integrations', 'SAML SSO', 'Audit logs'],
    popular: false,
  },
];

const invoices = [
  { id: 'inv-001', date: 'Jun 1, 2026', amount: '$499.00', status: 'paid', description: 'Pro Plan — June 2026' },
  { id: 'inv-002', date: 'May 1, 2026', amount: '$499.00', status: 'paid', description: 'Pro Plan — May 2026' },
  { id: 'inv-003', date: 'Apr 1, 2026', amount: '$499.00', status: 'paid', description: 'Pro Plan — April 2026' },
  { id: 'inv-004', date: 'Mar 1, 2026', amount: '$299.00', status: 'paid', description: 'Pro Plan — March 2026 (partial)' },
];

export function Billing() {
  const [currentPlan] = useState('pro');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'invoices'>('overview');

  const tokenUsagePct = 78;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your subscription and usage</p>
        </div>
        <button onClick={() => toast('Invoice exported as PDF', 'success')} className="btn-secondary text-xs">
          <Download size={13} />Download Invoice
        </button>
      </div>

      {/* Current Plan Banner */}
      <div className="card p-5 bg-gradient-to-r from-blue-600/10 to-violet-600/10 border-blue-500/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center">
              <Star size={22} className="text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">Pro Plan</span>
                <span className="badge badge-blue">Current Plan</span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">$499/month • Renews July 1, 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCancelConfirm(true)} className="btn-secondary text-xs">Cancel Plan</button>
            <button onClick={() => setShowUpgrade(true)} className="btn-primary text-xs">
              <TrendingUp size={13} />Upgrade to Enterprise
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(['overview', 'usage', 'invoices'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`tab ${activeTab === t ? 'active' : ''}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Usage bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Token Usage', used: 7800000, limit: 10000000, unit: 'M tokens', pct: 78, warn: true },
              { label: 'Agents', used: 8, limit: 25, unit: 'agents', pct: 32, warn: false },
              { label: 'Team Members', used: 7, limit: 25, unit: 'users', pct: 28, warn: false },
            ].map(u => (
              <div key={u.label} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{u.label}</span>
                  <span className={`text-xs ${u.warn ? 'text-amber-400' : 'text-gray-500'}`}>{u.pct}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full transition-all duration-700 ${u.warn ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${u.pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{typeof u.used === 'number' && u.used > 1000000 ? (u.used / 1000000).toFixed(1) + 'M' : u.used} used</span>
                  <span>{typeof u.limit === 'number' && u.limit > 1000000 ? (u.limit / 1000000).toFixed(0) + 'M' : u.limit} {u.unit.includes('M') ? '' : u.unit}</span>
                </div>
                {u.warn && (
                  <div className="flex items-center gap-1.5 mt-2 text-amber-400 text-xs">
                    <AlertTriangle size={11} />
                    Approaching limit
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Payment Method + Next Invoice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Payment Method</h3>
                <button onClick={() => toast('Update payment method form opened', 'info')} className="btn-secondary text-xs">Update</button>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-800 border border-gray-700">
                <div className="w-10 h-8 rounded-md bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <CreditCard size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">•••• •••• •••• 4242</div>
                  <div className="text-xs text-gray-500">Visa — Expires 12/2028</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Next Invoice</h3>
              <div className="space-y-2">
                {[
                  { label: 'Plan', value: 'Pro Plan', align: 'right' },
                  { label: 'Period', value: 'July 1 – July 31', align: 'right' },
                  { label: 'Subtotal', value: '$499.00', align: 'right' },
                  { label: 'Tax (0%)', value: '$0.00', align: 'right' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="text-gray-300">{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2 border-t border-gray-800 mt-2">
                  <span className="text-white font-medium">Total due Jul 1</span>
                  <span className="text-white font-bold">$499.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Comparison */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Compare Plans</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-800">
              {plans.map(plan => (
                <div key={plan.id} className={`bg-gray-900 p-5 ${plan.popular ? 'ring-1 ring-blue-500/50' : ''}`}>
                  {plan.popular && <div className="badge badge-blue mb-3"><Star size={10} />Most Popular</div>}
                  <div className="text-base font-bold text-white">{plan.name}</div>
                  <div className="mt-1 mb-3">
                    {plan.price ? (
                      <span className="text-2xl font-bold text-white">${plan.price}<span className="text-sm text-gray-500 font-normal">/mo</span></span>
                    ) : (
                      <span className="text-xl font-bold text-white">Custom</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{plan.description}</p>
                  <ul className="space-y-2 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      if (plan.id === currentPlan) return;
                      if (plan.id === 'enterprise') { toast('Contact sales for Enterprise pricing', 'info'); return; }
                      setSelectedPlan(plan.id);
                      setShowUpgrade(true);
                    }}
                    className={`w-full text-xs ${plan.id === currentPlan ? 'btn-secondary opacity-50 cursor-default' : plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {plan.id === currentPlan ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Monthly Token Consumption</h3>
            <p className="text-xs text-gray-500 mb-4">Tokens used across all agents</p>
            <BarChart data={chartData.tokenUsage.map(d => ({ ...d, value: d.value * 0.4 + 2 }))} height={200} color="#8b5cf6" />
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Usage by Service</h3>
            <div className="space-y-3">
              {[
                { name: 'GPT-4o', tokens: 3200000, cost: 48, pct: 41 },
                { name: 'Claude 3.5', tokens: 2800000, cost: 42, pct: 36 },
                { name: 'GPT-4o-mini', tokens: 1500000, cost: 6, pct: 19 },
                { name: 'Embeddings', tokens: 300000, cost: 0.12, pct: 4 },
              ].map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-gray-300">{s.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 text-xs">{(s.tokens / 1000000).toFixed(1)}M tokens</span>
                      <span className="text-gray-300 text-xs">${s.cost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Invoice', 'Description', 'Date', 'Amount', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="table-row">
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{inv.id}</td>
                    <td className="px-5 py-3 text-gray-300">{inv.description}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{inv.date}</td>
                    <td className="px-5 py-3 text-white font-medium">{inv.amount}</td>
                    <td className="px-5 py-3">
                      <span className="badge badge-green"><CheckCircle size={10} />{inv.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toast(`Downloading ${inv.id}`, 'success')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <Download size={12} />PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <Modal open={showUpgrade} onClose={() => setShowUpgrade(false)} title="Upgrade Your Plan"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowUpgrade(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => { setShowUpgrade(false); toast('Plan upgraded successfully!', 'success'); }}>Confirm Upgrade</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="text-sm font-semibold text-blue-300">Enterprise Plan</div>
            <p className="text-xs text-gray-400 mt-1">You're upgrading to unlimited agents, workflows, and dedicated support. Your billing will be prorated for the current cycle.</p>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Current Plan', value: 'Pro — $499/mo' },
              { label: 'New Plan', value: 'Enterprise — Custom pricing' },
              { label: 'Effective Date', value: 'Today, July 4, 2026' },
              { label: 'Prorated Credit', value: '$415.22' },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-gray-500">{r.label}</span>
                <span className="text-gray-200">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={showCancelConfirm} onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => toast('Cancellation scheduled for end of billing period', 'info')}
        title="Cancel Subscription" message="Your plan will remain active until July 31, 2026. After that, your account will be downgraded to the free tier." confirmLabel="Cancel Subscription" danger />
    </div>
  );
}
