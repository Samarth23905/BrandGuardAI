import React, { useEffect, useState } from 'react';
import { brandService } from '../../services/brandService';
import { TerminologyRule } from '../../types';
import { SeverityBadge } from '../../components/SeverityBadge';
import { PlusCircle, SpellCheck, Trash2 } from 'lucide-react';

export const TerminologyPage: React.FC = () => {
  const [rules, setRules] = useState<TerminologyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [term, setTerm] = useState('');
  const [termType, setTermType] = useState<any>('RESTRICTED');
  const [replacementOrAlternative, setReplacementOrAlternative] = useState('');
  const [ruleContext, setRuleContext] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [severity, setSeverity] = useState<any>('MINOR');

  const fetchRules = async () => {
    try {
      const data = await brandService.listTerminology();
      setRules(data);
    } catch (err) {
      console.error('Failed to load terminology:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await brandService.createTerminology({
        term,
        termType,
        replacementOrAlternative,
        ruleContext,
        caseSensitive,
        severity,
        isActive: true,
      });
      setShowModal(false);
      setTerm('');
      setReplacementOrAlternative('');
      fetchRules();
    } catch (err) {
      console.error('Failed to create rule:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this terminology rule?')) return;
    try {
      await brandService.deleteTerminology(id);
      setRules((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Terminology & Vocabulary Rules</h1>
          <p className="text-sm text-slate-500">
            Control banned words, product naming capitalizations, and required brand vocabulary.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Terminology Rule</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading terminology rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No terminology rules configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Term Pattern</th>
                  <th className="px-6 py-3">Rule Type</th>
                  <th className="px-6 py-3">Preferred Replacement</th>
                  <th className="px-6 py-3">Severity</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">"{r.term}"</td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-slate-700">{r.termType.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-emerald-700 font-semibold">
                      {r.replacementOrAlternative ? `"${r.replacementOrAlternative}"` : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <SeverityBadge severity={r.severity} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button onClick={() => handleDelete(r._id)} className="text-slate-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Add Terminology Rule</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Term / Word *</label>
                <input
                  type="text"
                  required
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. Fitfuel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Type</label>
                  <select
                    value={termType}
                    onChange={(e) => setTermType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="RESTRICTED">Restricted / Banned</option>
                    <option value="PRODUCT_NAMING">Product Naming Convention</option>
                    <option value="PREFERRED_ALTERNATIVE">Preferred Alternative</option>
                    <option value="APPROVED">Approved Brand Term</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Replacement / Alternative</label>
                <input
                  type="text"
                  value={replacementOrAlternative}
                  onChange={(e) => setReplacementOrAlternative(e.target.value)}
                  placeholder="e.g. FitFuel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="caseSensitive"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="caseSensitive" className="text-xs text-slate-700">
                  Case sensitive match
                </label>
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
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
