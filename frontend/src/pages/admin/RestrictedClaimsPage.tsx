import React, { useEffect, useState } from 'react';
import { brandService } from '../../services/brandService';
import { RestrictedClaim } from '../../types';
import { SeverityBadge } from '../../components/SeverityBadge';
import { PlusCircle, ShieldAlert, Trash2 } from 'lucide-react';

export const RestrictedClaimsPage: React.FC = () => {
  const [restricted, setRestricted] = useState<RestrictedClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [restrictedPattern, setRestrictedPattern] = useState('');
  const [category, setCategory] = useState<any>('PROHIBITED_GUARANTEE');
  const [reason, setReason] = useState('');
  const [riskSeverity, setRiskSeverity] = useState<any>('CRITICAL');
  const [suggestedAlternative, setSuggestedAlternative] = useState('');

  const fetchRestricted = async () => {
    try {
      const data = await brandService.listRestricted();
      setRestricted(data);
    } catch (err) {
      console.error('Failed to load restricted claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestricted();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await brandService.createRestricted({
        restrictedPattern,
        category,
        reason,
        riskSeverity,
        suggestedAlternative,
        isActive: true,
      });
      setShowModal(false);
      setRestrictedPattern('');
      setReason('');
      fetchRestricted();
    } catch (err) {
      console.error('Failed to create restricted claim:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this restricted claim rule?')) return;
    try {
      await brandService.deleteRestricted(id);
      setRestricted((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error('Failed to delete restricted claim:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Restricted Claims & Prohibited Phrasing</h1>
          <p className="text-sm text-slate-500">
            Enforce zero-tolerance policies on medical guarantees, false performance promises, and unverified superlatives.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Restricted Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading restricted claims...</div>
        ) : restricted.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 col-span-2 bg-white rounded-2xl border border-slate-200">
            No restricted claims configured.
          </div>
        ) : (
          restricted.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    {r.category}
                  </span>
                  <div className="mt-1 font-mono font-bold text-sm text-slate-900">"{r.restrictedPattern}"</div>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={r.riskSeverity} />
                  <button onClick={() => handleDelete(r._id)} className="text-slate-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                <strong>Policy Reason:</strong> {r.reason}
              </p>

              {r.suggestedAlternative && (
                <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <strong>Compliant Alternative:</strong> "{r.suggestedAlternative}"
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Add Restricted Claim Policy</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Restricted Phrase / Pattern *</label>
                <input
                  type="text"
                  required
                  value={restrictedPattern}
                  onChange={(e) => setRestrictedPattern(e.target.value)}
                  placeholder="e.g. Guaranteed 100% muscle growth in 30 days"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Violation Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="PROHIBITED_GUARANTEE">Prohibited Guarantee</option>
                    <option value="UNSUPPORTED_HEALTH">Unsupported Medical</option>
                    <option value="MISLEADING_PERFORMANCE">Misleading Performance</option>
                    <option value="UNVERIFIED_COMPARISON">Unverified Superlative</option>
                    <option value="RESTRICTED_PROMOTIONAL">Restricted Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={riskSeverity}
                    onChange={(e) => setRiskSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="CRITICAL">Critical (-25 pts)</option>
                    <option value="MAJOR">Major (-10 pts)</option>
                    <option value="MINOR">Minor (-3 pts)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Compliance Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this phrase is forbidden (e.g. FTC compliance)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recommended Alternative</label>
                <input
                  type="text"
                  value={suggestedAlternative}
                  onChange={(e) => setSuggestedAlternative(e.target.value)}
                  placeholder="e.g. Formulated to support your daily fitness progression"
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
                <button type="submit" className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
                  Save Restricted Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
