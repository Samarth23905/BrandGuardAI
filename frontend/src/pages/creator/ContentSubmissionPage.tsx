import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentService } from '../../services/contentService';
import { Sparkles, Send, FileText, ArrowRight, AlertCircle, Wand2 } from 'lucide-react';

export const ContentSubmissionPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('AD_COPY');
  const [targetAudience, setTargetAudience] = useState('');
  const [channel, setChannel] = useState('Instagram & Social Media');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await contentService.createSubmission({
        title,
        contentType,
        targetAudience,
        channel,
        content,
      });

      navigate(`/creator/analysis/${res.submission._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit content for analysis.');
      setLoading(false);
    }
  };

  const loadPreset = (type: 'violation' | 'compliant') => {
    if (type === 'violation') {
      setTitle('FitFuel Whey Summer Blast Promo');
      setChannel('Instagram Ads & Influencer Reel');
      setContent(
        'Introducing the new FitFuel Whey! Our supplement contains 40g protein per serving and guarantees 100% muscle growth in 30 days. Experience steroid-like gains and see why we are the best supplement in India. Visit fitfuel.com to order your bulking powder today!'
      );
    } else {
      setTitle('FitFuel Whey Post-Workout Nutritional Post');
      setChannel('Official Blog & Newsletter');
      setContent(
        'Fuel your training with FitFuel Whey. Each serving provides 25g protein and 120 kcal to support daily protein intake and assist muscle recovery after tough workouts. Formulated with clean micro-filtered whey isolate in an FDA-registered facility. Learn more at fitfuel.com.'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Submit Content for AI Analysis</h1>
          <p className="text-sm text-slate-500">
            Submit marketing copy to extract claims, verify facts against knowledge base, and receive compliance scoring.
          </p>
        </div>

        {/* Quick Demo Pre-fills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadPreset('violation')}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Load High-Risk Sample</span>
          </button>
          <button
            type="button"
            onClick={() => loadPreset('compliant')}
            className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Load Compliant Sample</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Submission Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FitFuel Summer Ad Campaign"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Content Type *</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
            >
              <option value="AD_COPY">Advertising Copy</option>
              <option value="SOCIAL_POST">Social Media Post</option>
              <option value="PRODUCT_DESCRIPTION">Product Description</option>
              <option value="BLOG_POST">Blog Post</option>
              <option value="PRESS_RELEASE">Press Release</option>
              <option value="EMAIL_NEWSLETTER">Email Newsletter</option>
              <option value="GENERAL_COPY">General Marketing Copy</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Distribution Channel</label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="e.g. Meta Ads, Instagram Reels, Landing Page"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Athletes, gym-goers aged 18-35"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">Marketing Copy Content *</label>
            <span className="text-xs text-slate-400 font-mono">
              {wordCount} words &bull; {charCount} chars
            </span>
          </div>
          <textarea
            required
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or write your promotional copy, ad headlines, or product claims here..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-sans leading-relaxed"
          />
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Claim Extraction & Verification...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Submit & Analyze Compliance</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
