import React, { useState } from 'react';
import { 
  Sliders, 
  Check, 
  X, 
  Building2, 
  ShieldCheck, 
  RotateCcw, 
  Save, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { School, SubscriptionTier, FeatureKey } from '../../types';

interface SuperAdminFeaturesProps {
  schools: School[];
  plans: SubscriptionTier[];
  selectedSchoolForOverride?: School | null;
  onSaveOverrides: (schoolId: string, overrides: Record<string, boolean>) => Promise<void>;
}

const ALL_FEATURE_ITEMS: { key: FeatureKey; label: string; group: string }[] = [
  { key: 'students', label: 'Students Bio & Directory', group: 'Core' },
  { key: 'teachers', label: 'Teachers & Staff Directory', group: 'Core' },
  { key: 'classrooms', label: 'Classrooms & Arms', group: 'Core' },
  { key: 'subjects', label: 'Academic Curriculum', group: 'Core' },
  { key: 'attendance', label: 'Daily Attendance', group: 'Academics' },
  { key: 'examinations', label: 'Examinations Module', group: 'Academics' },
  { key: 'results', label: 'Continuous Assessment (SBA)', group: 'Academics' },
  { key: 'reports', label: 'Terminal PDF Report Cards', group: 'Academics' },
  { key: 'promotions', label: 'Academic Year Promotions', group: 'Academics' },
  { key: 'fees', label: 'Fee Collection & Receipts', group: 'Finance' },
  { key: 'store', label: 'School Inventory & Store', group: 'Operations' },
  { key: 'pos', label: 'Point of Sale (POS Cashier)', group: 'Operations' },
  { key: 'communications', label: 'SMS & WhatsApp Broadcasts', group: 'Operations' },
  { key: 'analytics', label: 'Advanced Executive Analytics', group: 'Executive' },
  { key: 'users_portals', label: 'User Account Access Management', group: 'Governance' },
  { key: 'settings', label: 'School System Customization', group: 'Governance' },
  { key: 'teacher_portal', label: 'Dedicated Teacher Portal', group: 'Portals' },
  { key: 'parent_portal', label: 'Dedicated Parent Portal', group: 'Portals' },
  { key: 'student_portal', label: 'Dedicated Student Portal', group: 'Portals' },
  { key: 'accountant_portal', label: 'Bursar / Cashier Console', group: 'Portals' },
];

export const SuperAdminFeatures: React.FC<SuperAdminFeaturesProps> = ({
  schools,
  plans,
  selectedSchoolForOverride,
  onSaveOverrides
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'overrides'>('matrix');
  const [targetSchoolId, setTargetSchoolId] = useState<string>(
    selectedSchoolForOverride ? selectedSchoolForOverride.id : (schools[0]?.id || '')
  );

  const selectedSchool = schools.find(s => s.id === targetSchoolId) || null;
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>(
    selectedSchool?.featureOverrides || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelectSchool = (sId: string) => {
    setTargetSchoolId(sId);
    const sc = schools.find(s => s.id === sId);
    setLocalOverrides(sc?.featureOverrides || {});
    setSavedSuccess(false);
  };

  const handleToggleOverride = (key: FeatureKey) => {
    const current = localOverrides[key];
    const updated = { ...localOverrides };

    if (current === undefined) {
      // Default -> Force ON
      updated[key] = true;
    } else if (current === true) {
      // Force ON -> Force OFF
      updated[key] = false;
    } else {
      // Force OFF -> Remove override (Inherit from Plan)
      delete updated[key];
    }

    setLocalOverrides(updated);
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    if (!targetSchoolId) return;
    setIsSaving(true);
    await onSaveOverrides(targetSchoolId, localOverrides);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetOverrides = () => {
    setLocalOverrides({});
    setSavedSuccess(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Tab Toggle */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Feature Entitlements & Custom Overrides</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit feature tiers or grant/restrict individual capabilities on a per-school basis.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tier Feature Matrix
          </button>
          <button
            onClick={() => setActiveTab('overrides')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overrides'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            School Custom Overrides
          </button>
        </div>
      </div>

      {/* View 1: Tier Feature Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Platform Feature Entitlement Matrix</span>
            <span className="text-[11px] text-slate-400">Comparing active tiers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                  <th className="py-3 px-4 min-w-[220px]">Module Feature</th>
                  <th className="py-3 px-4">Group</th>
                  {plans.map(p => (
                    <th key={p.id} className="py-3 px-4 text-center font-mono">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">GH₵{p.priceGHS}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {ALL_FEATURE_ITEMS.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{item.label}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.group}
                      </span>
                    </td>
                    {plans.map(p => {
                      const hasFeature = p.features.includes(item.key);
                      return (
                        <td key={p.id} className="py-2.5 px-4 text-center">
                          {hasFeature ? (
                            <Check className="w-4 h-4 text-teal-700 mx-auto" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Per-School Overrides Manager */}
      {activeTab === 'overrides' && (
        <div className="space-y-6">
          
          {/* School Selector Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="block text-xs font-bold text-slate-900">
                Select Educational Institution to Override:
              </label>

              <select
                value={targetSchoolId}
                onChange={(e) => handleSelectSchool(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 max-w-sm"
              >
                {schools.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subscriptionPlan.toUpperCase()}) — {s.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {selectedSchool && (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-teal-950">{selectedSchool.name}</span>
                  <span className="text-teal-800 font-mono text-[11px]">
                    (Assigned Plan: <b>{selectedSchool.subscriptionPlan.toUpperCase()}</b>)
                  </span>
                </div>

                <div className="text-[11px] text-teal-800">
                  {Object.keys(localOverrides).length} Active Custom Override(s)
                </div>
              </div>
            )}
          </div>

          {/* Overrides Table */}
          {selectedSchool && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="text-xs text-slate-500">
                  Click on any feature status to cycle: 
                  <span className="font-bold text-slate-700 ml-1">Plan Default</span> → 
                  <span className="font-bold text-emerald-700 ml-1">Force ON</span> → 
                  <span className="font-bold text-rose-700 ml-1">Force OFF</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetOverrides}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Plan</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Overrides'}</span>
                  </button>
                </div>
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Feature overrides successfully applied to {selectedSchool.name}.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALL_FEATURE_ITEMS.map(item => {
                  const overrideVal = localOverrides[item.key];
                  
                  // Plan default evaluation
                  const schoolPlan = plans.find(p => p.id === selectedSchool.planId || p.code === selectedSchool.subscriptionPlan);
                  const defaultFromPlan = schoolPlan ? schoolPlan.features.includes(item.key) : false;

                  return (
                    <div 
                      key={item.key}
                      onClick={() => handleToggleOverride(item.key)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        overrideVal === true
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                          : overrideVal === false
                          ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.label}</div>
                        <div className="text-[10px] text-slate-400">
                          Group: {item.group} • Default: {defaultFromPlan ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>

                      <div>
                        {overrideVal === true && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Force ON
                          </span>
                        )}
                        {overrideVal === false && (
                          <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Force OFF
                          </span>
                        )}
                        {overrideVal === undefined && (
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            Plan Default
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
