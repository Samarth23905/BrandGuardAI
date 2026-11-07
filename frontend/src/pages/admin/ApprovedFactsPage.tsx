import React, { useEffect, useState } from 'react';
import { brandService } from '../../services/brandService';
import { ApprovedFact } from '../../types';
import { PlusCircle, CheckCircle, Trash2 } from 'lucide-react';

export const ApprovedFactsPage: React.FC = () => {
  const [facts, setFacts] = useState<ApprovedFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [factStatement, setFactStatement] = useState('');
  const [category, setCategory] = useState<any>('PRODUCT');
  const [productRef, setProductRef] = useState('');
  const [verificationEvidence, setVerificationEvidence] = useState('');

  const fetchFacts = async () => {
    try {
      const data = await brandService.listFacts();
      setFacts(data);
    } catch (err) {
      console.error('Failed to load facts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await brandService.createFact({
        title,
        factStatement,
        category,
        productRef,
        verificationEvidence,
        isActive: true,
      });
      setShowModal(false);
      setTitle('');
      setFactStatement('');
      fetchFacts();
    } catch (err) {
      console.error('Failed to create fact:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this approved product fact?')) return;
    try {
      await brandService.deleteFact(id);
      setFacts((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error('Failed to delete fact:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Approved Product Facts</h1>
          <p className="text-sm text-slate-500">
            Authoritative specifications, quantities, and nutritional benchmarks verified by laboratory records.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Approved Fact</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading facts...</div>
        ) : facts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 col-span-2 bg-white rounded-2xl border border-slate-200">
            No approved facts added yet.
          </div>
        ) : (
          facts.map((f) => (
            <div key={f._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900">{f.title}</div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
                    {f.category} {f.productRef ? `&bull; ${f.productRef}` : ''}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(f._id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs font-semibold text-slate-800 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                "{f.factStatement}"
              </p>

              {f.verificationEvidence && (
                <div className="text-[11px] text-slate-500 italic">
                  <strong>Verification Evidence:</strong> {f.verificationEvidence}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Add Approved Fact</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fact Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. FitFuel Whey Protein Specification"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="PRODUCT">Product Specification</option>
                  <option value="PRICING">Pricing & Discount</option>
                  <option value="INGREDIENT">Ingredients & Sourcing</option>
                  <option value="PERFORMANCE">Performance Metrics</option>
                  <option value="COMPANY">Company Standards</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Authoritative Fact Statement *</label>
                <textarea
                  required
                  rows={3}
                  value={factStatement}
                  onChange={(e) => setFactStatement(e.target.value)}
                  placeholder="e.g. FitFuel Whey contains exactly 25g protein per serving."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Reference</label>
                <input
                  type="text"
                  value={productRef}
                  onChange={(e) => setProductRef(e.target.value)}
                  placeholder="e.g. FitFuel Whey"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lab / Audit Verification Document Ref</label>
                <input
                  type="text"
                  value={verificationEvidence}
                  onChange={(e) => setVerificationEvidence(e.target.value)}
                  placeholder="e.g. Laboratory Formulation Sheet FF-WHEY-2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
