import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, CheckCircle2, ArrowRight, FileCheck, Layers, Users, BarChart3 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight">
            BrandGuard <span className="text-indigo-400 font-medium">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg shadow-md transition-all shadow-indigo-600/30"
          >
            Launch Platform
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Brand Governance & Content Compliance</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-100">
          Create Freely.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-teal-300">
            Publish Confidently.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          The intelligent checkpoint between content creation and publication. BrandGuard AI extracts factual claims,
          retrieves approved corporate evidence via RAG, scores compliance deterministically, and guides human approvals.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-base font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <span>Explore Demo Organization</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-7 py-3.5 rounded-xl border border-slate-700 transition-colors"
          >
            Register Your Brand
          </Link>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">RAG Document Intelligence</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Upload PDF, DOCX, and TXT brand manuals. Semantic embeddings index specifications and permitted claims for instant verification.
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Deterministic Scoring</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Scoring is never hallucinated. Penalties are mathematically deducted (-25 Critical, -10 Major, -3 Minor) with clear violation trails.
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Human Approval Workflow</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              AI suggests, but humans govern. Authorized reviewers inspect diffs, verify claims, and approve content with strict anti-self-approval rules.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 text-center text-xs text-slate-500">
        BrandGuard AI &copy; 2026. Create Freely. Publish Confidently.
      </footer>
    </div>
  );
};
