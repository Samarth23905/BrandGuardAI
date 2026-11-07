import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { StatCard } from '../../components/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const GovernanceAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const metrics = await analyticsService.getGovernanceMetrics();
        setData(metrics);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-500">Loading Governance Analytics...</div>;
  }

  const summary = data?.summary || {};
  const scoreBands = data?.scoreBands || [];
  const timelineTrends = data?.timelineTrends || [];
  const topViolations = data?.topViolations || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Brand Governance Analytics</h1>
        <p className="text-sm text-slate-500">
          Executive monitoring of brand compliance health, recurring risk patterns, and approval velocity.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Submissions" value={summary.totalSubmissions || 0} icon={FileText} color="blue" />
        <StatCard title="Approval Rate" value={`${summary.approvalRate || 0}%`} icon={Percent} color="emerald" />
        <StatCard title="Avg Compliance Score" value={`${summary.avgComplianceScore || 0}/100`} icon={ShieldCheck} color="purple" />
        <StatCard title="Critical Violations" value={summary.criticalViolations || 0} icon={AlertTriangle} color="red" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Compliance Score Distribution Bands</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBands} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreBands.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Submissions & Score Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Submissions & Score Trajectory</h3>
          <div className="h-64">
            {timelineTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Not enough historical data points yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2.5} name="Avg Score" />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total Volume" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Recurring Brand Violations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Most Frequently Detected Copy Deviations</h3>
        {topViolations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No violations detected in records.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Flagged Claim Text</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Occurrences</th>
                  <th className="py-2.5 px-4">Policy Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topViolations.map((v: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">"{v._id}"</td>
                    <td className="py-3 px-4">{v.category}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        v.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {v.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{v.count}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-sm truncate">{v.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
