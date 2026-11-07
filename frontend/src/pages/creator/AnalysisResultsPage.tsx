import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentService } from '../../services/contentService';
import { ContentSubmission, ContentVersion, AnalysisResult, ClaimFinding, CorrectionSuggestion } from '../../types';
import { ScoreBadge } from '../../components/ScoreBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Volume2,
  Eye,
  Wand2,
} from 'lucide-react';

export const AnalysisResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<ContentSubmission | null>(null);
  const [version, setVersion] = useState<ContentVersion | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [findings, setFindings] = useState<ClaimFinding[]>([]);
  const [suggestions, setSuggestions] = useState<CorrectionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        const data = await contentService.getSubmission(id);
        setSubmission(data.submission);
        setAnalysis(data.latestAnalysis);
        setFindings(data.findings || []);
        setSuggestions(data.suggestions || []);
        if (data.versions && data.versions.length > 0) {
          setVersion(data.versions[data.versions.length - 1]);
        }
      } catch (err) {
        console.error('Failed to load analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-sm font-medium text-slate-500">Retrieving compliance findings...</span>
      </div>
    );
  }

  if (!submission || !analysis) {
    return (
      <div className="py-12 text-center text-slate-500">
        Submission analysis could not be located.
      </div>
    );
  }

  const score = analysis.overallScore.finalScore;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Version {submission.currentVersionNumber}
            </span>
            <StatusBadge status={submission.status} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{submission.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyzed via {analysis.aiModelUsed} &bull; {analysis.processingTimeMs}ms execution time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/creator/workspace/${submission._id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            <span>Open Correction Workspace</span>
          </Link>
          <Link
            to={`/creator/history/${submission._id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
          >
            <span>Version History</span>
          </Link>
        </div>
      </div>

      {/* Score Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Compliance Score</span>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-5xl font-black text-slate-900 tracking-tight">{score}</span>
              <span className="text-slate-400 font-semibold text-lg">/ 100</span>
            </div>
            <div className="mt-3">
              <ScoreBadge score={score} size="md" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
            Initial: 100 &bull; Total Deductions: -{analysis.overallScore.totalDeductions} pts
          </p>
        </div>

        {/* Claims Breakdown Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Claims Verification Summary</span>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-2xl font-black text-emerald-700">{analysis.claimsSummary.supported}</div>
              <div className="text-[11px] font-semibold text-emerald-600 uppercase mt-0.5">Supported</div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="text-2xl font-black text-red-700">{analysis.claimsSummary.contradicted}</div>
              <div className="text-[11px] font-semibold text-red-600 uppercase mt-0.5">Contradicted</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="text-2xl font-black text-amber-700">{analysis.claimsSummary.unsupported}</div>
              <div className="text-[11px] font-semibold text-amber-600 uppercase mt-0.5">Unsupported</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-slate-700">{analysis.claimsSummary.totalClaims}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase mt-0.5">Total Claims</div>
            </div>
          </div>
        </div>

        {/* Tone & Accessibility Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>Brand Tone Alignment</span>
              <span className={analysis.toneEvaluation.isCompliant ? 'text-emerald-600' : 'text-amber-600'}>
                {analysis.toneEvaluation.isCompliant ? 'Compliant' : 'Deviation'}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-800">{analysis.toneEvaluation.detectedTone}</div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{analysis.toneEvaluation.explanation}</p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>Text Accessibility</span>
              <span className="text-indigo-600">{analysis.accessibilityEvaluation.readingEaseScore}/100</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">{analysis.accessibilityEvaluation.readingGradeLevel}</div>
          </div>
        </div>
      </div>

      {/* Original Content Snippet */}
      {version && (
        <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Submitted Copy (Version {version.versionNumber})</span>
            <span>{version.wordCount} Words</span>
          </div>
          <p className="text-sm font-mono leading-relaxed text-slate-200 whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {version.rawContent}
          </p>
        </div>
      )}

      {/* Extracted Claims and Verification Evidence */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Extracted Claims & Truth Verification Details</h3>

        <div className="space-y-3">
          {findings.map((f, idx) => {
            const statusConfig = {
              SUPPORTED: { bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
              CONTRADICTED: { bg: 'bg-red-50/50', border: 'border-red-200', text: 'text-red-700', icon: XCircle },
              UNSUPPORTED: { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
              AMBIGUOUS: { bg: 'bg-purple-50/50', border: 'border-purple-200', text: 'text-purple-700', icon: HelpCircle },
            }[f.verificationStatus];

            const Icon = statusConfig.icon;

            return (
              <div key={f._id || idx} className={`p-4 rounded-xl border ${statusConfig.border} ${statusConfig.bg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 shrink-0 ${statusConfig.text}`} />
                    <span className="font-bold text-sm text-slate-900">"{f.claimText}"</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {f.claimCategory}
                    </span>
                    <SeverityBadge severity={f.severity} />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusConfig.text}`}>
                      {f.verificationStatus}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{f.explanation}</p>

                {/* Evidence snippet */}
                {f.matchedEvidenceChunks && f.matchedEvidenceChunks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-start gap-2 text-[11px] text-slate-500">
                    <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span>
                      <strong className="text-slate-700 font-semibold">{f.matchedEvidenceChunks[0].documentTitle}:</strong>{' '}
                      "{f.matchedEvidenceChunks[0].snippet}"
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
