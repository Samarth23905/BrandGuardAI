import React, { useEffect, useState } from 'react';
import { reviewService } from '../../services/reviewService';
import { History, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export const ApprovalHistoryPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await reviewService.listReviews();
        setReviews(data);
      } catch (err) {
        console.error('Failed to load review history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Approval & Governance Audit History</h1>
        <p className="text-sm text-slate-500">Historical log of all reviewer decisions and approvals.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading audit history...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">No review decisions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-xs font-semibold uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Submission</th>
                  <th className="px-6 py-3.5">Reviewer</th>
                  <th className="px-6 py-3.5">Decision</th>
                  <th className="px-6 py-3.5">Summary Note</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {rev.submissionId?.title || 'Submission'}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {rev.reviewerId?.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          rev.decision === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rev.decision === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rev.decision}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                      {rev.decisionSummary}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(rev.completedAt).toLocaleString()}
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
