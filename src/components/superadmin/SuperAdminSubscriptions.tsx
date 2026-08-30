import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  ChevronRight,
  ShieldCheck,
  Edit2,
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { School, SubscriptionTier } from '../../types';
import { formatDate, formatGHS } from '../../utils/formatting';
import { Modal } from '../common/Modal';

interface SuperAdminSubscriptionsProps {
  schools: School[];
  plans: SubscriptionTier[];
  onAssignPlan: (schoolId: string, planId: string) => Promise<void>;
  onImpersonateSchool: (schoolId: string) => void;
  onOpenOverrides: (school: School) => void;
}

export const SuperAdminSubscriptions: React.FC<SuperAdminSubscriptionsProps> = ({
  schools,
  plans,
  onAssignPlan,
  onImpersonateSchool,
  onOpenOverrides
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedSchoolForPlan, setSelectedSchoolForPlan] = useState<School | null>(null);
  const [newPlanId, setNewPlanId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredSchools = (schools || []).filter(school => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || (school.subscriptionPlan || 'basic').toLowerCase() === tierFilter.toLowerCase();
    return matchesSearch && matchesTier;
  });

  const getPlanDetails = (school: School) => {
    const pCode = (school.subscriptionPlan || 'basic').toLowerCase();
    return plans.find(p => p.id === school.planId || p.code === pCode) || plans[0];
  };

  const handleOpenChangePlan = (school: School) => {
    setSelectedSchoolForPlan(school);
    setNewPlanId(school.planId || 'plan_basic');
  };

  const handleSavePlanChange = async () => {
    if (!selectedSchoolForPlan || !newPlanId) return;
    setIsUpdating(true);
    try {
      await onAssignPlan(selectedSchoolForPlan.id, newPlanId);
      setSelectedSchoolForPlan(null);
    } finally {
      setIsUpdating(false);
    }
  };

  // Metrics
  const basicCount = schools.filter(s => (s.subscriptionPlan || '').toLowerCase() === 'basic').length;
  const standardCount = schools.filter(s => (s.subscriptionPlan || '').toLowerCase() === 'standard').length;
  const premiumCount = schools.filter(s => (s.subscriptionPlan || '').toLowerCase() === 'premium').length;

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Active School Subscriptions</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor institutional tier assignments, academic term renewals, and subscription entitlements across Ghana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
            Active Subscriptions: <b className="text-teal-800 font-mono">{schools.length}</b>
          </div>
        </div>
      </div>

      {/* Tier Distribution Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              BASIC TIER
            </span>
            <div className="text-2xl font-black text-slate-900">{basicCount} <span className="text-xs font-normal text-slate-400">Schools</span></div>
            <div className="text-[11px] text-slate-500">GH₵350 / term per school</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              STANDARD TIER
            </span>
            <div className="text-2xl font-black text-slate-900">{standardCount} <span className="text-xs font-normal text-slate-400">Schools</span></div>
            <div className="text-[11px] text-slate-500">GH₵550 / term per school</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              PREMIUM TIER
            </span>
            <div className="text-2xl font-black text-slate-900">{premiumCount} <span className="text-xs font-normal text-slate-400">Schools</span></div>
            <div className="text-[11px] text-slate-500">GH₵850 / term per school</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search school name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">All Subscription Tiers</option>
              <option value="basic">BASIC Plan (GH₵350)</option>
              <option value="standard">STANDARD Plan (GH₵550)</option>
              <option value="premium">PREMIUM Plan (GH₵850)</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500">
            Showing <b>{filteredSchools.length}</b> schools
          </div>
        </div>

        {/* Table Content */}
        {filteredSchools.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400 space-y-1">
            <Building2 className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No subscriptions matching filter</p>
            <p className="text-[11px] text-slate-400">Try adjusting the search query or tier dropdown.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                  <th className="py-3 px-4">School & Code</th>
                  <th className="py-3 px-4">Current Tier</th>
                  <th className="py-3 px-4">Termly Fee</th>
                  <th className="py-3 px-4">Term Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSchools.map(school => {
                  const plan = getPlanDetails(school);

                  return (
                    <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{school.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {school.shortCode} • {school.district} • {school.region}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold uppercase text-teal-800 font-mono text-[10px] bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                          {school.subscriptionPlan || 'BASIC'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {formatGHS(plan?.priceGHS || 350)} / term
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">Active Academic Term</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {school.subscriptionExpiry ? formatDate(school.subscriptionExpiry) : 'Term End'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenChangePlan(school)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Change Tier</span>
                          </button>

                          <button
                            onClick={() => onOpenOverrides(school)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Overrides
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Assignment Modal */}
      {selectedSchoolForPlan && (
        <Modal
          isOpen={!!selectedSchoolForPlan}
          onClose={() => setSelectedSchoolForPlan(null)}
          title={`Assign Plan: ${selectedSchoolForPlan.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-500">
              Select the subscription tier for <b>{selectedSchoolForPlan.name}</b>. All feature modules and student capacity limits will update automatically.
            </p>

            <div className="space-y-2">
              {plans.map(p => (
                <label
                  key={p.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    newPlanId === p.id 
                      ? 'bg-teal-50/80 border-teal-500 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="planChoice"
                      value={p.id}
                      checked={newPlanId === p.id}
                      onChange={() => setNewPlanId(p.id)}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({p.code})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Capacity: {p.studentLimit} students • {p.features.length} features
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-teal-800">{formatGHS(p.priceGHS)}</div>
                    <div className="text-[10px] text-slate-400">per term</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSchoolForPlan(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlanChange}
                disabled={isUpdating}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Apply Tier'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
