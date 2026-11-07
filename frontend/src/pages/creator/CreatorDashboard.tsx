import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentService } from '../../services/contentService';
import { ContentSubmission } from '../../types';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ScoreBadge } from '../../components/ScoreBadge';
import { PlusCircle, FileText, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export const CreatorDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await contentService.listSubmissions();
        setSubmissions(data);
      } catch (err) {
        console.error('Failed to load creator submissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const total = submissions.length;
  const approved = submissions.filter((s) => s.status === 'APPROVED').length;
  const inReview = submissions.filter((s) => s.status === 'READY_FOR_REVIEW' || s.status === 'IN_REVIEW').length;
  const needsRevision = submissions.filter((s) => s.status === 'NEEDS_REVISION').length;

  const avgScore = total > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.latestScore || 0), 0) / total)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Creator Studio</h1>
          <p className="text-sm text-slate-500">Draft, verify, revise, and track marketing copy compliance.</p>
        </div>
        <Link
          to="/creator/submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Content Submission</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Submissions" value={total} icon={FileText} color="blue" />
        <StatCard title="Avg Compliance Score" value={`${avgScore}/100`} icon={CheckCircle} color="emerald" />
        <StatCard title="In Review Queue" value={inReview} icon={Clock} color="purple" />
        <StatCard title="Needs Revision" value={needsRevision} icon={AlertTriangle} color="amber" />
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">Recent Content Submissions</h3>
          <Link to="/creator/submissions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No submissions yet. Click "New Content Submission" to analyze your first marketing copy!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-xs font-semibold uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Title & Channel</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Version</th>
                  <th className="px-6 py-3.5">Compliance Score</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.slice(0, 5).map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{sub.title}</div>
                      <div className="text-xs text-slate-400">{sub.channel || 'General Copy'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {sub.contentType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      V{sub.currentVersionNumber}
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={sub.latestScore} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/creator/analysis/${sub._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>Analysis</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
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
