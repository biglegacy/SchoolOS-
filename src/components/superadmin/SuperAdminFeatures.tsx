import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Check, 
  X, 
  Building2, 
  ShieldCheck, 
  RotateCcw, 
  Save, 
  HelpCircle,
  Sparkles,
  SlidersHorizontal,
  Info,
  Layers,
  Search
} from 'lucide-react';
import { School, SubscriptionTier, FeatureKey } from '../../types';

interface SuperAdminFeaturesProps {
  schools: School[];
  plans: SubscriptionTier[];
  selectedSchoolForOverride?: School | null;
  initialTab?: 'matrix' | 'overrides';
  onSaveOverrides: (schoolId: string, overrides: Record<string, boolean>) => Promise<void>;
}

const ALL_FEATURE_ITEMS: { key: FeatureKey; label: string; group: string; description: string }[] = [
  { key: 'students', label: 'Students Bio & Directory', group: 'Core', description: 'Student admission records, profiles, and bio-data' },
  { key: 'teachers', label: 'Teachers & Staff Directory', group: 'Core', description: 'Staff directory, classes, and subjects assignment' },
  { key: 'classrooms', label: 'Classrooms & Arms', group: 'Core', description: 'Class streams, levels, and capacities' },
  { key: 'subjects', label: 'Academic Curriculum', group: 'Core', description: 'Academic subjects and curriculum planning' },
  { key: 'attendance', label: 'Daily Attendance', group: 'Academics', description: 'Student & teacher daily presence registry' },
  { key: 'examinations', label: 'Examinations Module', group: 'Academics', description: 'Exam timetables, grading scales, assessment' },
  { key: 'results', label: 'Continuous Assessment (SBA)', group: 'Academics', description: 'Marks entry, 30/70 SBA, class rankings' },
  { key: 'reports', label: 'Terminal PDF Report Cards', group: 'Academics', description: 'Official PDF Ghanaian termly report cards' },
  { key: 'promotions', label: 'Academic Year Promotions', group: 'Academics', description: 'Bulk academic session rollover & promotions' },
  { key: 'fees', label: 'Fee Collection & Receipts', group: 'Finance', description: 'Fee billing, tracking, and printed receipts' },
  { key: 'store', label: 'School Inventory & Store', group: 'Operations', description: 'Uniforms, books, inventory tracking' },
  { key: 'pos', label: 'Point of Sale (POS Cashier)', group: 'Operations', description: 'Direct cashier counter terminal' },
  { key: 'communications', label: 'SMS & WhatsApp Broadcasts', group: 'Operations', description: 'Parent notifications and alerts' },
  { key: 'analytics', label: 'Advanced Analytics', group: 'Executive', description: 'Financial analytics, performance insights' },
  { key: 'users_portals', label: 'Role-Based User Accounts', group: 'Governance', description: 'Granular user credential accounts' },
  { key: 'settings', label: 'School System Settings', group: 'Governance', description: 'Grading scale, school crest, and terms' },
  { key: 'teacher_portal', label: 'Dedicated Teacher Portal', group: 'Portals', description: 'Teacher marks entry and attendance console' },
  { key: 'parent_portal', label: 'Dedicated Parent Portal', group: 'Portals', description: 'Parent grade access, attendance, and bills' },
  { key: 'student_portal', label: 'Dedicated Student Portal', group: 'Portals', description: 'Student homework and report cards access' },
  { key: 'accountant_portal', label: 'Bursar & Accountant Portal', group: 'Portals', description: 'Financial cashier & ledger console' },
];

export const SuperAdminFeatures: React.FC<SuperAdminFeaturesProps> = ({
  schools,
  plans,
  selectedSchoolForOverride,
  initialTab = 'matrix',
  onSaveOverrides
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'overrides'>(initialTab);
  const [targetSchoolId, setTargetSchoolId] = useState<string>(
    selectedSchoolForOverride ? selectedSchoolForOverride.id : (schools[0]?.id || '')
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedSchoolForOverride) {
      setTargetSchoolId(selectedSchoolForOverride.id);
      setActiveTab('overrides');
    }
  }, [selectedSchoolForOverride]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const selectedSchool = schools.find(s => s.id === targetSchoolId) || null;
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>(
    selectedSchool?.featureOverrides || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (selectedSchool) {
      setLocalOverrides(selectedSchool.featureOverrides || {});
    }
  }, [targetSchoolId]);

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

  const filteredFeatures = ALL_FEATURE_ITEMS.filter(f => 
    f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header & Tab Toggle */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {activeTab === 'matrix' ? 'Feature Management' : 'School Feature Overrides'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'matrix' 
              ? 'Comprehensive platform matrix of system modules and portal entitlements across subscription tiers.'
              : 'Configure institution-specific feature overrides and granular portal exceptions.'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Feature Management
          </button>
          <button
            onClick={() => setActiveTab('overrides')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overrides'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            School Feature Overrides
          </button>
        </div>
      </div>

      {/* View 1: Tier Feature Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search feature module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Showing <b>{filteredFeatures.length}</b> system capabilities across {plans.length} tiers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                  <th className="py-3 px-4 min-w-[220px]">Module / Capability</th>
                  <th className="py-3 px-4">Category</th>
                  {plans.map(p => (
                    <th key={p.id} className="py-3 px-4 text-center font-mono">
                      <div className="uppercase">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">GH₵{p.priceGHS} / term</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFeatures.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.label}</div>
                      <div className="text-[10.5px] text-slate-400 leading-snug">{item.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">
                        {item.group}
                      </span>
                    </td>
                    {plans.map(p => {
                      const hasFeature = p.features.includes(item.key);
                      return (
                        <td key={p.id} className="py-3 px-4 text-center">
                          {hasFeature ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                              <X className="w-3 h-3" />
                            </span>
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
                Select Institution for Feature Overrides:
              </label>

              <select
                value={targetSchoolId}
                onChange={(e) => handleSelectSchool(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 max-w-sm"
              >
                {schools.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subscriptionPlan?.toUpperCase() || 'BASIC'})
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
                    (Tier: <b>{selectedSchool.subscriptionPlan?.toUpperCase() || 'BASIC'}</b>)
                  </span>
                </div>

                <div className="text-[11px] text-teal-900 font-semibold">
                  {Object.keys(localOverrides).length} Active Custom Override(s) Configured
                </div>
              </div>
            )}
          </div>

          {/* Overrides Table with Section 10 Breakdown */}
          {selectedSchool && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Module & Portal Entitlement Overrides</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Click any card to cycle state: <span className="font-bold text-slate-700">Plan Default</span> → <span className="font-bold text-emerald-700">Force Enabled</span> → <span className="font-bold text-rose-700">Force Disabled</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetOverrides}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All to Plan</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
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

              {/* Grid of features with clear Plan / Override / Final breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALL_FEATURE_ITEMS.map(item => {
                  const overrideVal = localOverrides[item.key];
                  
                  // Plan default evaluation
                  const schoolPlan = plans.find(p => p.id === selectedSchool.planId || p.code === (selectedSchool.subscriptionPlan || 'basic').toLowerCase());
                  const defaultFromPlan = schoolPlan ? schoolPlan.features.includes(item.key) : false;
                  
                  // Final effective status
                  const finalStatus = overrideVal !== undefined ? overrideVal : defaultFromPlan;

                  return (
                    <div 
                      key={item.key}
                      onClick={() => handleToggleOverride(item.key)}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        overrideVal === true
                          ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                          : overrideVal === false
                          ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.label}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Category: {item.group}
                          </div>
                        </div>

                        {/* Final Effective Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          finalStatus
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}>
                          {finalStatus ? <Check className="w-3 h-3 text-emerald-700" /> : <X className="w-3 h-3 text-rose-700" />}
                          <span>Final: {finalStatus ? 'Enabled' : 'Disabled'}</span>
                        </span>
                      </div>

                      {/* Explicit Breakdown (Plan / Override / Final) matching prompt requirement */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[10.5px]">
                        <div>
                          <span className="text-slate-400">Plan Default: </span>
                          <b className={defaultFromPlan ? 'text-slate-800' : 'text-slate-400'}>
                            {defaultFromPlan ? 'Enabled' : 'Disabled'}
                          </b>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-400">Override: </span>
                          {overrideVal === true && <b className="text-emerald-700 font-bold">Force ON</b>}
                          {overrideVal === false && <b className="text-rose-700 font-bold">Force OFF</b>}
                          {overrideVal === undefined && <span className="text-slate-500">None (Inherit)</span>}
                        </div>
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
