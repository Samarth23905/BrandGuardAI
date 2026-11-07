import React, { useEffect, useState } from 'react';
import { brandService } from '../../services/brandService';
import { ApprovedClaim } from '../../types';
import { PlusCircle, FileText, Trash2, CheckCircle2 } from 'lucide-react';

export const ApprovedClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<ApprovedClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [claimStatement, setClaimStatement] = useState('');
  const [category, setCategory] = useState('MARKETING');
  const [permittedContext, setPermittedContext] = useState('');

  const fetchClaims = async () => {
    try {
      const data = await brandService.listClaims();
      setClaims(data);
    } catch (err) {
      console.error('Failed to load approved claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await brandService.createClaim({
        claimStatement,
        category,
        permittedContext,
        isActive: true,
      });
      setShowModal(false);
      setClaimStatement('');
      fetchClaims();
    } catch (err) {
      console.error('Failed to create claim:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this approved claim?')) return;
    try {
      await brandService.deleteClaim(id);
      setClaims((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error('Failed to delete claim:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Approved Promotional Claims</h1>
          <p className="text-sm text-slate-500">
            Verified marketing statements pre-cleared for use in ad copy and social channels.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Approved Claim</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading claims...</div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 col-span-2 bg-white rounded-2xl border border-slate-200">
            No approved claims added yet.
          </div>
        ) : (
          claims.map((c) => (
            <div key={c._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide bg-indigo-50 px-2 py-0.5 rounded">
                  {c.category}
                </span>
                <button onClick={() => handleDelete(c._id)} className="text-slate-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{c.claimStatement}"
              </p>

              {c.permittedContext && (
                <div className="text-[11px] text-slate-500">
                  <strong>Permitted Context:</strong> {c.permittedContext}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Add Approved Claim</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Claim Statement *</label>
                <textarea
                  required
                  rows={3}
                  value={claimStatement}
                  onChange={(e) => setClaimStatement(e.target.value)}
                  placeholder="e.g. Supports daily protein intake and assists muscle recovery."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="MARKETING">Marketing Copy</option>
                  <option value="PROMOTIONAL">Promotional Offers</option>
                  <option value="PRODUCT_DESCRIPTION">Product Packaging</option>
                  <option value="GENERAL">General Communications</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Permitted Context</label>
                <input
                  type="text"
                  value={permittedContext}
                  onChange={(e) => setPermittedContext(e.target.value)}
                  placeholder="e.g. When paired with regular training context"
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
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                  Save Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
