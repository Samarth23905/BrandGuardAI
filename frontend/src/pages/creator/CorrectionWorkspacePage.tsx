import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentService } from '../../services/contentService';
import { ContentSubmission, ContentVersion, CorrectionSuggestion } from '../../types';
import { Wand2, Check, X, RefreshCw, ArrowRight, ArrowLeft, AlertCircle, FileCheck } from 'lucide-react';

export const CorrectionWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<ContentSubmission | null>(null);
  const [version, setVersion] = useState<ContentVersion | null>(null);
  const [suggestions, setSuggestions] = useState<CorrectionSuggestion[]>([]);
  const [revisedContent, setRevisedContent] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await contentService.getSubmission(id);
        setSubmission(data.submission);
        setSuggestions(data.suggestions || []);
        if (data.versions && data.versions.length > 0) {
          const latest = data.versions[data.versions.length - 1];
          setVersion(latest);
          setRevisedContent(latest.rawContent);
        }
      } catch (err) {
        console.error('Failed to load workspace:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleApplySingleSuggestion = (suggestion: CorrectionSuggestion) => {
    if (revisedContent.includes(suggestion.originalText)) {
      const updated = revisedContent.replace(suggestion.originalText, suggestion.suggestedReplacement);
      setRevisedContent(updated);
      setSuggestions((prev) =>
        prev.map((s) => (s._id === suggestion._id ? { ...s, status: 'ACCEPTED' } : s))
      );
    }
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s._id === suggestionId ? { ...s, status: 'REJECTED' } : s))
    );
  };

  const handleApplyAllPending = () => {
    let text = revisedContent;
    const updatedSuggestions = suggestions.map((s) => {
      if (s.status === 'PENDING' && text.includes(s.originalText)) {
        text = text.replace(s.originalText, s.suggestedReplacement);
        return { ...s, status: 'ACCEPTED' as const };
      }
      return s;
    });
    setRevisedContent(text);
    setSuggestions(updatedSuggestions);
  };

  const handleSaveAndRevalidate = async () => {
    if (!submission || !revisedContent.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const accepted = suggestions.filter((s) => s.status === 'ACCEPTED');
      const correctionsApplied = accepted.map((s) => ({
        originalText: s.originalText,
        replacementText: s.suggestedReplacement,
      }));

      await contentService.submitRevision(submission._id, {
        content: revisedContent,
        notes: revisionNotes || `Applied ${accepted.length} compliant corrections`,
        correctionsApplied,
      });

      navigate(`/creator/analysis/${submission._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit revision for revalidation.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-500">Loading Correction Workspace...</div>;
  }

  if (!submission || !version) {
    return <div className="py-12 text-center text-slate-500">Content not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/creator/analysis/${submission._id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Analysis</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Correction Workspace</h1>
          <p className="text-sm text-slate-500">
            Accept AI-generated compliant suggestions or edit manually. Resubmission triggers full revalidation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleApplyAllPending}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
          >
            Apply All Suggestions
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSaveAndRevalidate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Save & Revalidate Revision</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Two Column Layout: Editor & Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Revision Editor */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Revision Editor (Version {version.versionNumber + 1})</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {revisedContent.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            rows={10}
            value={revisedContent}
            onChange={(e) => setRevisedContent(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-sans leading-relaxed"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Revision Notes (Optional)</label>
            <input
              type="text"
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="e.g. Corrected protein spec to 25g and removed 100% guarantee"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Right Column: AI Suggestion Cards */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-600" />
            <span>AI Correction Suggestions ({suggestions.length})</span>
          </h3>

          {suggestions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No correction suggestions for this version. Copy adheres to compliance rules!
            </div>
          ) : (
            suggestions.map((s) => (
              <div
                key={s._id}
                className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition-colors ${
                  s.status === 'ACCEPTED'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : s.status === 'REJECTED'
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    {s.problemType}
                  </span>
                  <span className="text-[11px] font-semibold uppercase text-slate-400">
                    Status: {s.status}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Original flagged text:</div>
                  <div className="text-xs font-mono bg-red-50 text-red-800 p-2 rounded-lg mt-1 line-through">
                    "{s.originalText}"
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Suggested compliant replacement:</div>
                  <div className="text-xs font-mono bg-emerald-50 text-emerald-800 p-2 rounded-lg mt-1 font-semibold">
                    "{s.suggestedReplacement}"
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic">
                  <strong>Rationale:</strong> {s.rationale}
                </p>

                {s.status === 'PENDING' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleRejectSuggestion(s._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySingleSuggestion(s)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept & Replace</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
