import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Download, Calendar, RefreshCw, Zap, Bot, GitBranch, DollarSign } from 'lucide-react';
import { BarChart, LineChart, DonutChart } from '../components/Charts';
import { chartData, agents, workflows } from '../data';
import { toast } from '../components/Toast';

export function Analytics() {
  const [dateRange, setDateRange] = useState('7d');
  const [metric, setMetric] = useState<'volume' | 'tokens' | 'success'>('volume');

  const kpis = [
    { label: 'Total Tasks', value: '156,842', change: '+14.2%', up: true, icon: <Zap size={16} />, color: 'bg-blue-500/10 text-blue-400' },
    { label: 'Active Agents', value: '5', change: '+2', up: true, icon: <Bot size={16} />, color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Avg Success Rate', value: '97.1%', change: '+0.8%', up: true, icon: <TrendingUp size={16} />, color: 'bg-violet-500/10 text-violet-400' },
    { label: 'Token Cost', value: '$3,241', change: '+22.1%', up: false, icon: <DollarSign size={16} />, color: 'bg-amber-500/10 text-amber-400' },
  ];

  const agentPerf = agents.map(a => ({ label: a.name.split(' ')[0], value: a.tasks }));
  const successData = agents.map(a => ({ label: a.name.split(' ')[0], value: a.successRate }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance insights and usage metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-gray-800 border border-gray-700 overflow-hidden">
            {['1d', '7d', '30d', '90d'].map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${dateRange === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={() => toast('Analytics exported', 'success')} className="btn-secondary text-xs"><Download size={13} />Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="card p-5 hover:border-gray-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{k.value}</p>
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${k.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {k.change} vs last period
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.color.split(' ')[0]}`}>
                <span className={k.color.split(' ')[1]}>{k.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Task Volume</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tasks processed per day</p>
            </div>
            <div className="flex gap-1">
              {(['volume', 'tokens', 'success'] as const).map(m => (
                <button key={m} onClick={() => setMetric(m)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${metric === m ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <BarChart
            data={metric === 'volume' ? chartData.taskVolume : metric === 'tokens' ? chartData.tokenUsage : chartData.successRate}
            height={180}
            color={metric === 'volume' ? '#3b82f6' : metric === 'tokens' ? '#8b5cf6' : '#10b981'}
          />
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Token Usage Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly token consumption (millions)</p>
            </div>
          </div>
          <LineChart data={chartData.tokenUsage} height={180} color="#8b5cf6" />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Agent Task Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Tasks completed per agent</p>
          <DonutChart
            data={agents.slice(0, 5).map((a, i) => ({
              label: a.name.split(' ')[0],
              value: a.tasks,
              color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][i],
            }))}
          />
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-1">Agent Performance Comparison</h3>
          <p className="text-xs text-gray-500 mb-4">Success rates across all agents</p>
          <BarChart data={successData} height={160} color="#10b981" />
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Agent Performance Breakdown</h3>
          <button onClick={() => toast('Report exported', 'success')} className="btn-secondary text-xs"><Download size={13} />Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Agent', 'Model', 'Tasks', 'Success Rate', 'Avg Latency', 'Tokens Used', 'Cost'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.id} className="table-row">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <Bot size={13} className="text-blue-400" />
                      </div>
                      <span className="text-sm text-white font-medium">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{a.model}</td>
                  <td className="px-5 py-3 text-gray-300">{a.tasks.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden w-16">
                        <div className={`h-full rounded-full ${a.successRate >= 95 ? 'bg-emerald-500' : a.successRate >= 90 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${a.successRate}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${a.successRate >= 95 ? 'text-emerald-400' : a.successRate >= 90 ? 'text-amber-400' : 'text-red-400'}`}>{a.successRate}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{a.latency > 0 ? a.latency + 'ms' : '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{(a.tokens / 1000000).toFixed(1)}M</td>
                  <td className="px-5 py-3 text-gray-300 text-xs">${((a.tokens / 1000000) * 2.5).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Stats */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Workflow Run Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {[
            { label: 'Total Runs', value: workflows.reduce((s, w) => s + w.runs, 0).toLocaleString() },
            { label: 'Running Now', value: workflows.filter(w => w.status === 'running').length },
            { label: 'Failed (7d)', value: workflows.filter(w => w.status === 'failed').length },
            { label: 'Avg Duration', value: '8.4s' },
          ].map((s, i) => (
            <div key={s.label} className={`p-5 ${i < 3 ? 'border-r border-gray-800' : ''}`}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
