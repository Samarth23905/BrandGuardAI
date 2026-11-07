import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { Organisation } from '../../types';
import { Settings, Shield, Sliders, CheckCircle2 } from 'lucide-react';

export const OrgSettingsPage: React.FC = () => {
  const [org, setOrg] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [minPassingScore, setMinPassingScore] = useState(70);
  const [blockCriticalViolations, setBlockCriticalViolations] = useState(true);
  const [allowCreatorSelfApproval, setAllowCreatorSelfApproval] = useState(false);
  const [criticalWeight, setCriticalWeight] = useState(25);
  const [majorWeight, setMajorWeight] = useState(10);
  const [minorWeight, setMinorWeight] = useState(3);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const data = await authService.getOrganisation();
        setOrg(data);
        if (data.settings) {
          setMinPassingScore(data.settings.minPassingScore);
          setBlockCriticalViolations(data.settings.blockCriticalViolations);
          setAllowCreatorSelfApproval(data.settings.allowCreatorSelfApproval);
          if (data.settings.scoringWeights) {
            setCriticalWeight(data.settings.scoringWeights.critical);
            setMajorWeight(data.settings.scoringWeights.major);
            setMinorWeight(data.settings.scoringWeights.minor);
          }
        }
      } catch (err) {
        console.error('Failed to load org settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.updateOrganisationSettings({
        minPassingScore,
        blockCriticalViolations,
        allowCreatorSelfApproval,
        scoringWeights: {
          critical: criticalWeight,
          major: majorWeight,
          minor: minorWeight,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  if (loading) return <div className="py-20 text-center text-xs text-slate-400">Loading settings...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Governance & Scoring Policies</h1>
        <p className="text-sm text-slate-500">
          Configure approval gating, deduction weights, and self-approval restrictions for {org?.name}.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Governance configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Approval Gating Rules</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <div className="font-bold text-xs text-slate-900">Block Approval on Critical Violations</div>
                <div className="text-[11px] text-slate-500">
                  Submissions with contradicted specs or prohibited guarantees cannot be approved until revised.
                </div>
              </div>
              <input
                type="checkbox"
                checked={blockCriticalViolations}
                onChange={(e) => setBlockCriticalViolations(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <div className="font-bold text-xs text-slate-900">Allow Creator Self-Approval</div>
                <div className="text-[11px] text-slate-500">
                  Strictly discouraged. When disabled, creators are barred from approving their own marketing copy.
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowCreatorSelfApproval}
                onChange={(e) => setAllowCreatorSelfApproval(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Deterministic Scoring Deduction Weights</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
              <label className="block text-[11px] font-bold text-red-700 uppercase">Critical Penalty</label>
              <div className="mt-2 flex items-center gap-1 font-bold text-sm text-red-900">
                <span>-</span>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={criticalWeight}
                  onChange={(e) => setCriticalWeight(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-white border border-red-200 rounded text-center"
                />
                <span>pts</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
              <label className="block text-[11px] font-bold text-amber-700 uppercase">Major Penalty</label>
              <div className="mt-2 flex items-center gap-1 font-bold text-sm text-amber-900">
                <span>-</span>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={majorWeight}
                  onChange={(e) => setMajorWeight(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-white border border-amber-200 rounded text-center"
                />
                <span>pts</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <label className="block text-[11px] font-bold text-blue-700 uppercase">Minor Penalty</label>
              <div className="mt-2 flex items-center gap-1 font-bold text-sm text-blue-900">
                <span>-</span>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={minorWeight}
                  onChange={(e) => setMinorWeight(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-white border border-blue-200 rounded text-center"
                />
                <span>pts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            Save Governance Policies
          </button>
        </div>
      </form>
    </div>
  );
};
