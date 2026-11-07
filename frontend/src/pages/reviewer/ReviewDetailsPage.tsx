import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { contentService } from '../../services/contentService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { ContentSubmission, ContentVersion, AnalysisResult, ClaimFinding, ReviewComment } from '../../types';
import { ScoreBadge } from '../../components/ScoreBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  Send,
} from 'lucide-react';

export const ReviewDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<ContentSubmission | null>(null);
  const [version, setVersion] = useState<ContentVersion | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [findings, setFindings] = useState<ClaimFinding[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | null>(null);
  const [decisionSummary, setDecisionSummary] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) return;
      try {
        const data = await contentService.getSubmission(id);
        setSubmission(data.submission);
        setAnalysis(data.latestAnalysis);
        setFindings(data.findings || []);
        setComments(data.comments || []);
        if (data.versions && data.versions.length > 0) {
          setVersion(data.versions[data.versions.length - 1]);
        }
      } catch (err) {
        console.error('Failed to load review details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    try {
      const added = await reviewService.addComment(id, newComment);
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleExecuteDecision = async () => {
    if (!id || !decisionType || !decisionSummary.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      await reviewService.submitDecision(id, decisionType, decisionSummary, decisionNotes);
      navigate('/reviewer/queue');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit reviewer decision.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-sm text-slate-500">Loading review...</div>;
  if (!submission || !analysis) return <div className="py-12 text-center text-slate-500">Submission not found.</div>;

  const isOwnSubmission = submission.creatorId?._id === user?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/reviewer/queue')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
              V{submission.currentVersionNumber}
            </span>
            <StatusBadge status={submission.status} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{submission.title}</h1>
          <p className="text-xs text-slate-500">
            Submitted by {submission.creatorId?.name} ({submission.creatorId?.email}) &bull;{' '}
            {submission.channel || 'General Copy'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDecisionType('CHANGES_REQUESTED');
              setDecisionSummary('Revisions required before approval.');
            }}
            className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Request Changes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDecisionType('REJECTED');
              setDecisionSummary('Rejected due to unacceptable brand risk.');
            }}
            className="px-4 py-2 bg-red-50 border border-red-200 text-red-800 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>

          <button
            type="button"
            disabled={isOwnSubmission || (submission.criticalViolationsCount || 0) > 0}
            onClick={() => {
              setDecisionType('APPROVED');
              setDecisionSummary('Verified against brand guidelines and approved for publication.');
            }}
            title={
              isOwnSubmission
                ? 'Creators cannot approve their own submissions.'
                : (submission.criticalViolationsCount || 0) > 0
                ? 'Approval blocked: Unresolved critical violations.'
                : 'Approve content'
            }
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve Content</span>
          </button>
        </div>
      </div>

      {isOwnSubmission && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Compliance Policy: You submitted this content. A separate authorized reviewer must approve it.</span>
        </div>
      )}

      {/* Copy Inspection and Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Copy View */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Submitted Copy Body</span>
              <ScoreBadge score={analysis.overallScore.finalScore} size="sm" />
            </div>
            <p className="text-sm font-mono leading-relaxed text-slate-200 whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {version?.rawContent}
            </p>
          </div>

          {/* Feedback & Comments Thread */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Reviewer Feedback Thread ({comments.length})</span>
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{c.authorId?.name}</span>
                      <span className="text-slate-400 font-normal">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add feedback note for creator..."
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Flagged Findings & RAG Evidence */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">AI Claim Verification Findings</h3>

          <div className="space-y-3">
            {findings.map((f, idx) => (
              <div
                key={f._id || idx}
                className={`p-4 rounded-xl border ${
                  f.isViolation ? 'bg-red-50/40 border-red-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900">"{f.claimText}"</span>
                  <SeverityBadge severity={f.severity} />
                </div>
                <p className="text-xs text-slate-600 mt-1">{f.explanation}</p>

                {f.matchedEvidenceChunks && f.matchedEvidenceChunks.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-start gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span>
                      <strong className="text-slate-700">{f.matchedEvidenceChunks[0].documentTitle}:</strong>{' '}
                      "{f.matchedEvidenceChunks[0].snippet}"
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      {decisionType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">
              Confirm Decision: {decisionType.replace('_', ' ')}
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Decision Summary / Reason *
              </label>
              <input
                type="text"
                required
                value={decisionSummary}
                onChange={(e) => setDecisionSummary(e.target.value)}
                placeholder="Brief reason for approval or rejection..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Notes / Guidance (Optional)
              </label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Specific guidance for the creator..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDecisionType(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !decisionSummary.trim()}
                onClick={handleExecuteDecision}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Recording Decision...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
