import React, { useState, useEffect } from 'react';
import {
  Bot, GitBranch, Zap, TrendingUp, TrendingDown, AlertTriangle,
  Activity, ChevronRight, RefreshCw, Clock, ArrowUpRight, CheckCircle2,
  AlertCircle, Cpu
} from 'lucide-react';
import { BarChart, LineChart, DonutChart } from '../components/Charts';
import { CardSkeleton, TableSkeleton } from '../components/Skeleton';
import { agents, workflows, logs, chartData } from '../data';
import { Page } from '../types';
import { toast } from '../components/Toast';

interface DashboardProps {
  onNavigate: (p: Page) => void;
}

function StatCard({ label, value, change, icon, color, loading }: {
  label: string; value: string; change?: string; positive?: boolean;
  icon: React.ReactNode; color: string; loading: boolean;
}) {
  if (loading) return <div className="card p-5 h-28 skeleton" />;
  return (
    <div className={`card p-5 hover:border-gray-700 transition-all duration-200 group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1.5 flex items-center gap-1 ${change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              {change.startsWith('+') ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {change} vs last week
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'volume' | 'tokens' | 'success'>('volume');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast('Dashboard data refreshed', 'success');
    }, 1500);
  };

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const runningWF = workflows.filter(w => w.status === 'running').length;
  const errorLogs = logs.filter(l => l.level === 'error').length;

  const chartConfig = {
    volume: { data: chartData.taskVolume, color: '#3b82f6', label: 'Task Volume' },
    tokens: { data: chartData.tokenUsage, color: '#8b5cf6', label: 'Token Usage (M)' },
    success: { data: chartData.successRate, color: '#10b981', label: 'Success Rate (%)' },
  };
  const chart = chartConfig[activeTab];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Operations Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Friday, July 4, 2026 — Real-time monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className={`btn-secondary text-xs ${refreshing ? 'opacity-60 pointer-events-none' : ''}`}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => onNavigate('agents')} className="btn-primary text-xs">
            <Zap size={14} />
            New Agent
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? <CardSkeleton count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Agents" value={`${activeAgents}/8`} change="+2" icon={<Bot size={18} className="text-blue-400" />} color="bg-blue-500/15" loading={false} />
          <StatCard label="Running Workflows" value={`${runningWF}`} change="+1" icon={<GitBranch size={18} className="text-emerald-400" />} color="bg-emerald-500/15" loading={false} />
          <StatCard label="Tasks Today" value="24,381" change="+12.4%" icon={<Activity size={18} className="text-violet-400" />} color="bg-violet-500/15" loading={false} />
          <StatCard label="Error Rate" value="2.8%" change="-0.4%" icon={<AlertTriangle size={18} className="text-amber-400" />} color="bg-amber-500/15" loading={false} />
        </div>
      )}

      {/* Main charts + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Performance Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 days</p>
            </div>
            <div className="flex gap-1">
              {(['volume', 'tokens', 'success'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${activeTab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                  {chartConfig[t].label}
                </button>
              ))}
            </div>
          </div>
          {loading ? <div className="skeleton h-40 rounded-xl" /> : (
            <BarChart data={chart.data} height={160} color={chart.color} />
          )}
        </div>

        {/* Agent Status Donut */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Agent Status</h2>
              <p className="text-xs text-gray-500 mt-0.5">All agents</p>
            </div>
            <button onClick={() => onNavigate('agents')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>
          {loading ? <div className="skeleton h-32 rounded-xl" /> : (
            <DonutChart data={[
              { label: 'Active', value: agents.filter(a => a.status === 'active').length, color: '#10b981' },
              { label: 'Idle', value: agents.filter(a => a.status === 'idle').length, color: '#3b82f6' },
              { label: 'Error', value: agents.filter(a => a.status === 'error').length, color: '#ef4444' },
              { label: 'Paused', value: agents.filter(a => a.status === 'paused').length, color: '#f59e0b' },
            ]} />
          )}
          <button onClick={() => onNavigate('agents')} className="w-full mt-4 btn-secondary text-xs">
            Manage Agents
          </button>
        </div>
      </div>

      {/* Recent Activity + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Logs */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            <button onClick={() => onNavigate('logs')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View logs <ChevronRight size={12} />
            </button>
          </div>
          {loading ? <TableSkeleton rows={5} cols={4} /> : (
            <div>
              {logs.slice(0, 6).map(log => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3 border-b border-gray-800 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <div className={`mt-0.5 shrink-0 ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-amber-400' : log.level === 'debug' ? 'text-gray-600' : 'text-emerald-400'}`}>
                    {log.level === 'error' ? <AlertCircle size={14} /> : log.level === 'warn' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate">{log.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-600">{log.service}</span>
                      <span className="text-[10px] text-gray-700">•</span>
                      <span className="text-[10px] text-gray-600">{log.timestamp.split(' ')[1]}</span>
                    </div>
                  </div>
                  <span className={`badge text-[10px] ${log.level === 'error' ? 'badge-red' : log.level === 'warn' ? 'badge-yellow' : log.level === 'debug' ? 'badge-gray' : 'badge-green'}`}>
                    {log.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">System Health</h2>
          {loading ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div> : (
            <div className="space-y-4">
              {[
                { label: 'API Gateway', pct: 98, status: 'healthy', latency: '42ms' },
                { label: 'Vector Store', pct: 76, status: 'healthy', latency: '89ms' },
                { label: 'Model Router', pct: 85, status: 'healthy', latency: '12ms' },
                { label: 'Token Budget', pct: 78, status: 'warning', latency: '—' },
                { label: 'Task Queue', pct: 34, status: 'healthy', latency: '—' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">{item.latency}</span>
                      <span className={`badge text-[10px] ${item.status === 'healthy' ? 'badge-green' : 'badge-yellow'}`}>{item.status}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <Cpu size={12} />
              <span>99.7% uptime — 30 days</span>
            </div>
            <button onClick={() => onNavigate('analytics')} className="w-full mt-3 btn-secondary text-xs">
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Top Agents Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Top Agents by Volume</h2>
          <button onClick={() => onNavigate('agents')} className="btn-secondary text-xs">
            <Bot size={13} /> Manage Agents
          </button>
        </div>
        {loading ? <TableSkeleton rows={5} cols={6} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-gray-500 font-medium">Agent</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Model</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3 text-right text-gray-500 font-medium">Tasks</th>
                  <th className="px-4 py-3 text-right text-gray-500 font-medium">Success</th>
                  <th className="px-4 py-3 text-right text-gray-500 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody>
                {agents.slice(0, 5).map(a => (
                  <tr key={a.id} className="table-row cursor-pointer" onClick={() => onNavigate('agents')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                          <Bot size={13} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{a.name}</div>
                          <div className="text-gray-600 text-[10px]">{a.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{a.model}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${a.status === 'active' ? 'badge-green' : a.status === 'error' ? 'badge-red' : a.status === 'paused' ? 'badge-yellow' : 'badge-gray'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">{a.tasks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={a.successRate >= 95 ? 'text-emerald-400' : a.successRate >= 90 ? 'text-amber-400' : 'text-red-400'}>
                        {a.successRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{a.latency}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
