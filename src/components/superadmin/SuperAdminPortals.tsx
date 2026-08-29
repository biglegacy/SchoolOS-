import React, { useState } from 'react';
import { 
  GraduationCap, 
  HeartHandshake, 
  User, 
  CreditCard, 
  ShieldCheck, 
  Check, 
  X, 
  Search, 
  Sliders, 
  Building2, 
  Sparkles, 
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { School, SubscriptionTier, FeatureKey } from '../../types';

interface SuperAdminPortalsProps {
  schools: School[];
  plans: SubscriptionTier[];
  onToggleSchoolFeature: (schoolId: string, feature: FeatureKey, value: boolean | undefined) => Promise<void>;
  onOpenOverrides: (school: School) => void;
}

export const SuperAdminPortals: React.FC<SuperAdminPortalsProps> = ({
  schools,
  plans,
  onToggleSchoolFeature,
  onOpenOverrides
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'matrix' | 'overview'>('matrix');

  const filteredSchools = (schools || []).filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlanFilter === 'all' || (s.subscriptionPlan || 'basic').toLowerCase() === selectedPlanFilter.toLowerCase();
    return matchesSearch && matchesPlan;
  });

  const getFeatureStatus = (school: School, feature: FeatureKey) => {
    const override = school.featureOverrides?.[feature];
    const plan = plans.find(p => p.id === school.planId || p.code === (school.subscriptionPlan || 'basic').toLowerCase());
    const planDefault = plan ? plan.features.includes(feature) : false;

    if (override !== undefined) {
      return {
        enabled: override,
        isOverride: true,
        overrideVal: override,
        planDefault
      };
    }
    return {
      enabled: planDefault,
      isOverride: false,
      overrideVal: undefined,
      planDefault
    };
  };

  const handleCycleOverride = async (school: School, feature: FeatureKey) => {
    const current = school.featureOverrides?.[feature];
    if (current === undefined) {
      // Plan default -> Force ON
      await onToggleSchoolFeature(school.id, feature, true);
    } else if (current === true) {
      // Force ON -> Force OFF
      await onToggleSchoolFeature(school.id, feature, false);
    } else {
      // Force OFF -> Remove override (Inherit)
      await onToggleSchoolFeature(school.id, feature, undefined);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">School Portals Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervise dedicated portal modules, subscription entitlements, and school-specific overrides.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            School Portals Matrix
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Portal Architecture & Specs
          </button>
        </div>
      </div>

      {/* 4 Portals Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Teacher Portal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
              Core Portal
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Teacher Portal</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Daily roll call, 30/70 SBA continuous marks entry, and student terminal remarks.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
            Included in: <b className="text-slate-800">BASIC, STANDARD, PREMIUM</b>
          </div>
        </div>

        {/* Parent Portal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
              Core Portal
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Parent Portal</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Terminal PDF reports, attendance alerts, fee balances, and payment verification.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
            Included in: <b className="text-slate-800">BASIC, STANDARD, PREMIUM</b>
          </div>
        </div>

        {/* Student Portal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
              Core Portal
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Student Portal</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Registered GES curriculum subjects, terminal grades, position ranks, and exam schedules.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
            Included in: <b className="text-slate-800">BASIC, STANDARD, PREMIUM</b>
          </div>
        </div>

        {/* Accountant / Bursar Console */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="bg-teal-50 text-teal-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-teal-200 uppercase">
              Extended Tier
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Bursar & POS Portal</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Fee collection register, store inventory sales, cashier till reconciliation, and audit logs.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
            Included in: <b className="text-slate-800">STANDARD, PREMIUM</b>
          </div>
        </div>

      </div>

      {/* View 1: School Portals Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4">
          
          {/* Table Header & Search Filter */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by school name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="all">All Subscription Plans</option>
                <option value="basic">BASIC Plan</option>
                <option value="standard">STANDARD Plan</option>
                <option value="premium">PREMIUM Plan</option>
              </select>
            </div>

            <div className="text-[11px] text-slate-500">
              Showing <b>{filteredSchools.length}</b> institutions • Click any portal badge to toggle override
            </div>
          </div>

          {/* Table */}
          {filteredSchools.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-400 space-y-1">
              <Building2 className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No schools matching search</p>
              <p className="text-[11px] text-slate-400">Try adjusting the plan filter or search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                    <th className="py-3 px-4">School & Code</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4 text-center">Teacher Portal</th>
                    <th className="py-3 px-4 text-center">Parent Portal</th>
                    <th className="py-3 px-4 text-center">Student Portal</th>
                    <th className="py-3 px-4 text-center">Accountant Portal</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredSchools.map(school => {
                    const teacherStatus = getFeatureStatus(school, 'teacher_portal');
                    const parentStatus = getFeatureStatus(school, 'parent_portal');
                    const studentStatus = getFeatureStatus(school, 'student_portal');
                    const accountantStatus = getFeatureStatus(school, 'accountant_portal');

                    return (
                      <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* School Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{school.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {school.shortCode} • {school.district}
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold uppercase text-teal-800 font-mono text-[10px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {school.subscriptionPlan}
                          </span>
                        </td>

                        {/* Teacher Portal Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleCycleOverride(school, 'teacher_portal')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              teacherStatus.overrideVal === true
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : teacherStatus.overrideVal === false
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : teacherStatus.enabled
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                            title="Click to cycle: Plan Default -> Force ON -> Force OFF"
                          >
                            {teacherStatus.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>
                              {teacherStatus.overrideVal === true ? 'Force ON' : teacherStatus.overrideVal === false ? 'Force OFF' : 'Active'}
                            </span>
                          </button>
                        </td>

                        {/* Parent Portal Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleCycleOverride(school, 'parent_portal')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              parentStatus.overrideVal === true
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : parentStatus.overrideVal === false
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : parentStatus.enabled
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                            title="Click to cycle: Plan Default -> Force ON -> Force OFF"
                          >
                            {parentStatus.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>
                              {parentStatus.overrideVal === true ? 'Force ON' : parentStatus.overrideVal === false ? 'Force OFF' : 'Active'}
                            </span>
                          </button>
                        </td>

                        {/* Student Portal Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleCycleOverride(school, 'student_portal')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              studentStatus.overrideVal === true
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : studentStatus.overrideVal === false
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : studentStatus.enabled
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                            title="Click to cycle: Plan Default -> Force ON -> Force OFF"
                          >
                            {studentStatus.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>
                              {studentStatus.overrideVal === true ? 'Force ON' : studentStatus.overrideVal === false ? 'Force OFF' : 'Active'}
                            </span>
                          </button>
                        </td>

                        {/* Accountant Portal Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleCycleOverride(school, 'accountant_portal')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              accountantStatus.overrideVal === true
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : accountantStatus.overrideVal === false
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : accountantStatus.enabled
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                            title="Click to cycle: Plan Default -> Force ON -> Force OFF"
                          >
                            {accountantStatus.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>
                              {accountantStatus.overrideVal === true ? 'Force ON' : accountantStatus.overrideVal === false ? 'Force OFF' : accountantStatus.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onOpenOverrides(school)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Full Overrides
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* View 2: Portal Architecture & Permissions */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Multi-Tenant Portal Authentication Model</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every school portal is isolated under its own school ID partition. Role-based access control (RBAC) verifies user claims on every request:
            </p>
            <ul className="text-xs text-slate-700 space-y-2 list-disc pl-5">
              <li><b>Teacher Accounts:</b> Scoped to assigned classrooms and assigned subjects for continuous assessment marks entry.</li>
              <li><b>Parent / Guardian Accounts:</b> Scoped exclusively to registered ward ID records for report cards and fee verification.</li>
              <li><b>Student Accounts:</b> Read-only access to terminal performance, rankings, and timetable schedules.</li>
              <li><b>Bursar / Cashier Accounts:</b> Scoped to store POS transactions and official fee payment receipts.</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>Subscription & Override Priority Resolution</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a user attempts to access any portal or sub-feature, the platform executes a 3-tier resolution algorithm:
            </p>
            <ol className="text-xs text-slate-700 space-y-2 list-decimal pl-5">
              <li><b>Platform Super Admin Role:</b> Automatically bypassed and granted platform-wide oversight.</li>
              <li><b>School Custom Override:</b> If Super Admin configured a Force ON / Force OFF override on the institution record, it takes immediate precedence.</li>
              <li><b>Active Plan Features Matrix:</b> If no custom override exists, access is resolved according to the school's assigned subscription tier (BASIC, STANDARD, PREMIUM).</li>
            </ol>
          </div>

        </div>
      )}

    </div>
  );
};
