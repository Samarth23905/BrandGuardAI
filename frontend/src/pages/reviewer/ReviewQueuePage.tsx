import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewService } from '../../services/reviewService';
import { ContentSubmission } from '../../types';
import { ScoreBadge } from '../../components/ScoreBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { Inbox, ArrowRight, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<ContentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await reviewService.getReviewQueue();
        setQueue(data);
      } catch (err) {
        console.error('Failed to load review queue:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reviewer Governance Queue</h1>
          <p className="text-sm text-slate-500">
            Authorize or request revisions on pending marketing copy. AI never automatically publishes.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          <span>{queue.length} Submissions Awaiting Action</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading review queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-16 text-center text-sm text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">All submissions reviewed!</p>
            <p className="text-xs text-slate-400 mt-1">No content is currently waiting in the governance queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-xs font-semibold uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Submission & Channel</th>
                  <th className="px-6 py-3.5">Creator</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Critical Flags</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{sub.title}</div>
                      <div className="text-xs text-slate-400">
                        {sub.contentType.replace('_', ' ')} &bull; {sub.channel || 'General'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-semibold text-slate-800">{sub.creatorId?.name || 'Creator'}</div>
                      <div className="text-slate-400">{sub.creatorId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={sub.latestScore} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      {(sub.criticalViolationsCount || 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{sub.criticalViolationsCount} Critical</span>
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>0 Critical</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/reviewer/review/${sub._id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        <span>Review</span>
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
