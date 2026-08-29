import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  Clock, 
  Ban, 
  Eye, 
  Check, 
  X, 
  Unlock, 
  Sliders, 
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  Edit2,
  PowerOff,
  Sparkles
} from 'lucide-react';
import { School, SubscriptionTier } from '../../types';
import { formatDate, formatGHS } from '../../utils/formatting';
import { Modal } from '../common/Modal';

interface SuperAdminSchoolsProps {
  schools: School[];
  plans: SubscriptionTier[];
  initialFilter?: 'all' | 'pending' | 'active' | 'suspended';
  onApproveSchool: (schoolId: string) => Promise<void>;
  onRejectSchool: (schoolId: string) => Promise<void>;
  onSuspendSchool: (schoolId: string) => Promise<void>;
  onUpdateSchool?: (schoolId: string, data: Partial<School>) => Promise<void>;
  onAssignPlan: (schoolId: string, planId: string) => Promise<void>;
  onImpersonateSchool: (schoolId: string) => void;
  onOpenOverrides: (school: School) => void;
  onOpenSchoolRegistration?: () => void;
}

export const SuperAdminSchools: React.FC<SuperAdminSchoolsProps> = ({
  schools,
  plans,
  initialFilter = 'all',
  onApproveSchool,
  onRejectSchool,
  onSuspendSchool,
  onUpdateSchool,
  onAssignPlan,
  onImpersonateSchool,
  onOpenOverrides,
  onOpenSchoolRegistration
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewSchool, setReviewSchool] = useState<School | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [planModalSchool, setPlanModalSchool] = useState<School | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const pendingCount = (schools || []).filter(s => s.status === 'pending').length;
  const activeCount = (schools || []).filter(s => s.status === 'active').length;
  const suspendedCount = (schools || []).filter(s => s.status === 'suspended').length;

  const filteredSchools = (schools || []).filter(s => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.district && s.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.region && s.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleOpenPlanModal = (school: School) => {
    setPlanModalSchool(school);
    setSelectedPlanId(school.planId || 'plan_basic');
  };

  const handleSavePlanAssignment = async () => {
    if (!planModalSchool || !selectedPlanId) return;
    await onAssignPlan(planModalSchool.id, selectedPlanId);
    setPlanModalSchool(null);
  };

  const handleSaveSchoolEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || !onUpdateSchool) return;

    setIsSubmittingEdit(true);
    try {
      await onUpdateSchool(editingSchool.id, {
        name: editingSchool.name,
        shortCode: editingSchool.shortCode,
        motto: editingSchool.motto,
        address: editingSchool.address,
        district: editingSchool.district,
        region: editingSchool.region,
        phone: editingSchool.phone,
        email: editingSchool.email,
        ownerName: editingSchool.ownerName,
        ownerPhone: editingSchool.ownerPhone,
        ownerEmail: editingSchool.ownerEmail,
        status: editingSchool.status,
        subscriptionPlan: editingSchool.subscriptionPlan,
        subscriptionExpiry: editingSchool.subscriptionExpiry,
      });
      setEditingSchool(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Title and Super Admin-Only Register School Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Registered Schools Directory</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-mono font-bold uppercase">
              {schools.length} Total Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Super Admin authoritative platform management: approve, reject, edit, suspend, and configure institutional subscriptions.
          </p>
        </div>

        {onOpenSchoolRegistration && (
          <button
            onClick={onOpenSchoolRegistration}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register School</span>
          </button>
        )}
      </div>

      {/* Top Filter Bar & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Schools ({schools.length})
          </button>
          
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'active'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            onClick={() => setFilter('suspended')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'suspended'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suspended ({suspendedCount})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search school, proprietor, district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

      </div>

      {/* Schools Table or Empty State */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredSchools.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No schools found matching your filter</p>
            <p className="text-[11px] text-slate-400">Click "Register School" to manually onboard an institution.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (Hidden on tablet/desktop) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredSchools.map((school) => (
                <div key={school.id} className="p-4 space-y-3">
                  {/* Top: Logo, Name, Code, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {school.logo ? (
                          <img src={school.logo} alt={school.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{school.shortCode || school.name.slice(0, 3).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{school.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                          <span>{school.shortCode}</span>
                          <span>•</span>
                          <span className="truncate">{school.district || 'Ghana'}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      school.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : school.status === 'pending'
                        ? 'bg-amber-50 text-amber-900 border border-amber-300'
                        : school.status === 'suspended'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {school.status}
                    </span>
                  </div>

                  {/* Middle: Details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Proprietor</span>
                      <div className="font-semibold text-slate-800 truncate">{school.ownerName || 'Admin'}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{school.ownerPhone || school.phone}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Subscription</span>
                      <div className="font-bold text-teal-800 uppercase font-mono text-[11px]">{school.subscriptionPlan}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Exp: {formatDate(school.subscriptionExpiry)}</div>
                    </div>
                  </div>

                  {/* Bottom: Mobile Actions Bar */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 flex-wrap">
                    <button
                      onClick={() => setReviewSchool(school)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer min-h-[36px]"
                    >
                      Review
                    </button>

                    {school.status === 'pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onApproveSchool(school.id)}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer min-h-[36px]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onRejectSchool(school.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {school.status === 'active' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onImpersonateSchool(school.id)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer min-h-[36px]"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-700" />
                          <span>Enter Portal</span>
                        </button>
                        {onUpdateSchool && (
                          <button
                            onClick={() => setEditingSchool({ ...school })}
                            className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Edit School"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onSuspendSchool(school.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Suspend"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {school.status === 'suspended' && (
                      <button
                        onClick={() => onSuspendSchool(school.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer min-h-[36px]"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unsuspend</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                    <th className="py-3 px-4">Institution Profile</th>
                    <th className="py-3 px-4">Location & GES Code</th>
                    <th className="py-3 px-4">Proprietor / Lead Admin</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Subscription</th>
                    <th className="py-3 px-4 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredSchools.map((school) => (
                    <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* School Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {school.logo ? (
                              <img src={school.logo} alt={school.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{school.shortCode || school.name.slice(0, 3).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{school.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                              <span>{school.shortCode}</span>
                              <span>•</span>
                              <span>{school.email || 'no-email@school.edu'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location & GES Code */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{school.district || 'District'}, {school.region || 'Region'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">GES: {school.registrationNumber || 'Pending'}</div>
                      </td>

                      {/* Proprietor */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-semibold">{school.ownerName || 'Admin'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{school.ownerPhone || school.phone}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          school.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : school.status === 'pending'
                            ? 'bg-amber-50 text-amber-900 border border-amber-300'
                            : school.status === 'suspended'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {school.status}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold uppercase text-teal-800 font-mono text-[11px]">
                          {school.subscriptionPlan}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Exp: {formatDate(school.subscriptionExpiry)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          
                          {/* Review / View Details */}
                          <button
                            onClick={() => setReviewSchool(school)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Review
                          </button>

                          {/* Edit School Details */}
                          {onUpdateSchool && (
                            <button
                              onClick={() => setEditingSchool({ ...school })}
                              className="p-1 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit School Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Pending specific actions */}
                          {school.status === 'pending' && (
                            <>
                              <button
                                onClick={() => onApproveSchool(school.id)}
                                className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => onRejectSchool(school.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Reject Registration"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Active specific actions */}
                          {school.status === 'active' && (
                            <>
                              <button
                                onClick={() => onImpersonateSchool(school.id)}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="Enter School Portal as Super Admin"
                              >
                                <Eye className="w-3.5 h-3.5 text-teal-700" />
                                <span>Enter Portal</span>
                              </button>

                              <button
                                onClick={() => handleOpenPlanModal(school)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                                title="Assign Plan"
                              >
                                Plan
                              </button>

                              <button
                                onClick={() => onOpenOverrides(school)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                                title="Feature Overrides"
                              >
                                Overrides
                              </button>

                              <button
                                onClick={() => onSuspendSchool(school.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Deactivate / Suspend School"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Suspended specific actions */}
                          {school.status === 'suspended' && (
                            <button
                              onClick={() => onSuspendSchool(school.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Unsuspend</span>
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Review School Details Modal */}
      {reviewSchool && (
        <Modal
          isOpen={!!reviewSchool}
          onClose={() => setReviewSchool(null)}
          title={`Institution Details: ${reviewSchool.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-xs">
            
            {/* Status & Plan Bar */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 ${
                  reviewSchool.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : reviewSchool.status === 'pending'
                    ? 'bg-amber-50 text-amber-900 border border-amber-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {reviewSchool.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plan</span>
                <span className="text-xs font-bold text-teal-800 uppercase font-mono mt-0.5 block">
                  {reviewSchool.subscriptionPlan}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expires</span>
                <span className="text-xs font-mono text-slate-700 mt-0.5 block">
                  {formatDate(reviewSchool.subscriptionExpiry)}
                </span>
              </div>
            </div>

            {/* Biodata grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Name</span>
                <p className="font-bold text-slate-900">{reviewSchool.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Short Code / Tag</span>
                <p className="font-mono font-bold text-teal-800">{reviewSchool.shortCode}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proprietor / Lead Owner</span>
                <p className="font-semibold text-slate-900">{reviewSchool.ownerName || '—'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Contact</span>
                <p className="font-mono text-slate-700">{reviewSchool.ownerPhone || reviewSchool.phone || '—'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">District / Region</span>
                <p className="text-slate-800">{reviewSchool.district || '—'}, {reviewSchool.region || 'Ghana'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Date</span>
                <p className="font-mono text-slate-900">{formatDate(reviewSchool.createdAt)}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setReviewSchool(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>

              {reviewSchool.status === 'pending' && (
                <>
                  <button
                    onClick={async () => {
                      await onRejectSchool(reviewSchool.id);
                      setReviewSchool(null);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs cursor-pointer border border-rose-200"
                  >
                    Decline Registration
                  </button>
                  <button
                    onClick={async () => {
                      await onApproveSchool(reviewSchool.id);
                      setReviewSchool(null);
                    }}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    Approve & Activate School
                  </button>
                </>
              )}
            </div>

          </div>
        </Modal>
      )}

      {/* Edit School Details Modal */}
      {editingSchool && (
        <Modal
          isOpen={!!editingSchool}
          onClose={() => setEditingSchool(null)}
          title={`Edit School: ${editingSchool.name}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveSchoolEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={editingSchool.name || ''}
                  onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Code *</label>
                <input
                  type="text"
                  required
                  value={editingSchool.shortCode || ''}
                  onChange={(e) => setEditingSchool({ ...editingSchool, shortCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-600 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Proprietor Name</label>
                <input
                  type="text"
                  value={editingSchool.ownerName || ''}
                  onChange={(e) => setEditingSchool({ ...editingSchool, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Proprietor Phone</label>
                <input
                  type="tel"
                  value={editingSchool.ownerPhone || editingSchool.phone || ''}
                  onChange={(e) => setEditingSchool({ ...editingSchool, ownerPhone: e.target.value, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">District / Municipality</label>
                <input
                  type="text"
                  value={editingSchool.district || ''}
                  onChange={(e) => setEditingSchool({ ...editingSchool, district: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Region</label>
                <input
                  type="text"
                  value={editingSchool.region || ''}
                  onChange={(e) => setEditingSchool({ ...editingSchool, region: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editingSchool.status || 'active'}
                  onChange={(e) => setEditingSchool({ ...editingSchool, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                >
                  <option value="active">Active (Operational)</option>
                  <option value="pending">Pending Review</option>
                  <option value="suspended">Suspended / Deactivated</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subscription Plan</label>
                <select
                  value={editingSchool.subscriptionPlan || 'free'}
                  onChange={(e) => setEditingSchool({ ...editingSchool, subscriptionPlan: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                >
                  <option value="free">Free / Trial</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSchool(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                {isSubmittingEdit ? 'Saving...' : 'Save School Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Plan Modal */}
      {planModalSchool && (
        <Modal
          isOpen={!!planModalSchool}
          onClose={() => setPlanModalSchool(null)}
          title={`Assign Plan: ${planModalSchool.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Select the subscription tier for <b>{planModalSchool.name}</b>.
            </p>

            <div className="space-y-2">
              {plans.map(plan => (
                <label
                  key={plan.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPlanId === plan.id
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="selected_plan"
                      checked={selectedPlanId === plan.id}
                      onChange={() => setSelectedPlanId(plan.id)}
                      className="text-teal-700 focus:ring-teal-600"
                    />
                    <div>
                      <div className="font-bold">{plan.name}</div>
                      <div className="text-[10px] text-slate-500">{plan.studentLimit} Students Limit</div>
                    </div>
                  </div>
                  <span className="font-mono text-teal-800 font-bold">
                    {formatGHS(plan.priceGHS)} / {plan.billingPeriod}
                  </span>
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setPlanModalSchool(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlanAssignment}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Save Plan Assignment
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
