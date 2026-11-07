import React, { useEffect, useState } from 'react';
import { brandService } from '../../services/brandService';
import { BrandGuideline, GuidelineCategory } from '../../types';
import { SeverityBadge } from '../../components/SeverityBadge';
import { PlusCircle, BookOpen, Trash2, Edit2, CheckCircle2, ShieldCheck } from 'lucide-react';

export const KnowledgeHubPage: React.FC = () => {
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<any>('TONE');
  const [ruleDescription, setRuleDescription] = useState('');
  const [severity, setSeverity] = useState<any>('MAJOR');

  const fetchGuidelines = async () => {
    try {
      const data = await brandService.listGuidelines(selectedCategory || undefined);
      setGuidelines(data);
    } catch (err) {
      console.error('Failed to load guidelines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuidelines();
  }, [selectedCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await brandService.createGuideline({ title, category, ruleDescription, severity, isActive: true });
      setShowModal(false);
      setTitle('');
      setRuleDescription('');
      fetchGuidelines();
    } catch (err) {
      console.error('Failed to create guideline:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand guideline?')) return;
    try {
      await brandService.deleteGuideline(id);
      setGuidelines((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      console.error('Failed to delete guideline:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Brand Guidelines Management</h1>
          <p className="text-sm text-slate-500">
            Define tone, style, positioning, and accessibility rules evaluated by the AI engine.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Brand Rule</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-semibold">
        {['', 'TONE', 'STYLE', 'MESSAGING', 'ACCESSIBILITY', 'POLICY'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === cat ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat || 'All Guidelines'}
          </button>
        ))}
      </div>

      {/* Guidelines Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading guidelines...</div>
      ) : guidelines.length === 0 ? (
        <div className="p-16 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
          No guidelines found in this category. Click "Add Brand Rule" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidelines.map((g) => (
            <div key={g._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{g.title}</span>
                    <SeverityBadge severity={g.severity} />
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
                    {g.category}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(g._id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{g.ruleDescription}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Status: Enabled</span>
                <span>{new Date(g.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Add Brand Guideline Rule</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Empowering & Professional Tone"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="TONE">Tone & Voice</option>
                    <option value="STYLE">Style & Claims</option>
                    <option value="MESSAGING">Messaging Pillars</option>
                    <option value="ACCESSIBILITY">Accessibility</option>
                    <option value="POLICY">Policy & Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity *</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="CRITICAL">Critical (-25 pts)</option>
                    <option value="MAJOR">Major (-10 pts)</option>
                    <option value="MINOR">Minor (-3 pts)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Description *</label>
                <textarea
                  required
                  rows={4}
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="Explain exactly what is permitted or forbidden..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  Save Guideline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
