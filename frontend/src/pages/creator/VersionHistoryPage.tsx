import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentService } from '../../services/contentService';
import { ContentSubmission, ContentVersion } from '../../types';
import { ScoreBadge } from '../../components/ScoreBadge';
import { History, ArrowRight, ArrowLeft, GitCompare, CheckCircle2, TrendingUp } from 'lucide-react';

export const VersionHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<ContentSubmission | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedV1, setSelectedV1] = useState<number>(1);
  const [selectedV2, setSelectedV2] = useState<number>(2);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await contentService.getSubmission(id);
        setSubmission(data.submission);
        setVersions(data.versions || []);
        if (data.versions && data.versions.length >= 2) {
          setSelectedV1(1);
          setSelectedV2(data.versions.length);
        }
      } catch (err) {
        console.error('Failed to load version history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const loadComparison = async () => {
      if (!id || selectedV1 === selectedV2 || versions.length < 2) return;
      try {
        const data = await contentService.compareVersions(id, selectedV1, selectedV2);
        setComparison(data);
      } catch (err) {
        console.error('Failed to compare versions:', err);
      }
    };
    loadComparison();
  }, [id, selectedV1, selectedV2, versions]);

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-500">Loading version history...</div>;
  }

  if (!submission) {
    return <div className="py-12 text-center text-slate-500">Submission not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/creator/analysis/${submission._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Analysis</span>
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Version Control & Audit History</h1>
        <p className="text-sm text-slate-500">{submission.title} &bull; Total Versions: {versions.length}</p>
      </div>

      {/* Version Timeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {versions.map((ver) => (
          <div key={ver._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                Version {ver.versionNumber}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(ver.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">{ver.notes || 'No revision notes'}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{ver.wordCount} words</span>
              {ver.correctionsApplied && ver.correctionsApplied.length > 0 && (
                <span className="text-emerald-600 font-semibold">
                  {ver.correctionsApplied.length} fixes applied
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-Side Comparison Box */}
      {versions.length >= 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900">Compare Revisions</h3>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Compare V</span>
                <select
                  value={selectedV1}
                  onChange={(e) => setSelectedV1(Number(e.target.value))}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold"
                >
                  {versions.map((v) => (
                    <option key={v._id} value={v.versionNumber}>
                      V{v.versionNumber}
                    </option>
                  ))}
                </select>
              </div>

              <span>with V</span>

              <div className="flex items-center gap-1.5">
                <select
                  value={selectedV2}
                  onChange={(e) => setSelectedV2(Number(e.target.value))}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold"
                >
                  {versions.map((v) => (
                    <option key={v._id} value={v.versionNumber}>
                      V{v.versionNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {comparison && (
            <>
              {/* Score Delta Highlight */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Compliance Score Delta</span>
                    <div className="font-bold text-base text-slate-900">
                      V{selectedV1}: {comparison.v1.analysis?.overallScore.finalScore || 0} &rarr; V{selectedV2}:{' '}
                      {comparison.v2.analysis?.overallScore.finalScore || 0}{' '}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ml-2 ${
                        comparison.scoreDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {comparison.scoreDelta >= 0 ? `+${comparison.scoreDelta}` : comparison.scoreDelta} pts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-bold text-emerald-600">{comparison.resolvedIssuesCount}</span> issues resolved
                </div>
              </div>

              {/* Side by side raw copy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-xs uppercase text-slate-500 mb-2">Version {selectedV1} Copy</div>
                  <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {comparison.v1.version.rawContent}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-xs uppercase text-slate-500 mb-2">Version {selectedV2} Copy</div>
                  <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {comparison.v2.version.rawContent}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
