import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Check, 
  Trash2, 
  ShieldCheck, 
  Sparkles,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { SubscriptionTier, FeatureKey } from '../../types';
import { formatGHS } from '../../utils/formatting';
import { Modal } from '../common/Modal';

interface SuperAdminPlansProps {
  plans: SubscriptionTier[];
  onSavePlan: (plan: SubscriptionTier) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
}

const ALL_AVAILABLE_FEATURES: { key: FeatureKey; label: string; description: string }[] = [
  { key: 'students', label: 'Student Management', description: 'Student records, profiles, and bio-data' },
  { key: 'teachers', label: 'Teacher Management', description: 'Staff directory, classes, and subjects assignment' },
  { key: 'classrooms', label: 'Classrooms & Arms', description: 'Class streams, levels, and capacities' },
  { key: 'subjects', label: 'Subject Curriculum', description: 'Academic subjects and curriculum planning' },
  { key: 'attendance', label: 'Daily Attendance', description: 'Student & teacher daily presence registry' },
  { key: 'examinations', label: 'Examinations Module', description: 'Exam timetables, grading scales, assessment' },
  { key: 'results', label: 'Continuous Assessment & SBA', description: 'Marks entry, class rankings, and scores' },
  { key: 'reports', label: 'Terminal Report Cards', description: 'Official PDF Ghanaian termly report cards' },
  { key: 'promotions', label: 'Term/Year Promotions', description: 'Bulk academic session rollover & promotions' },
  { key: 'fees', label: 'Fee Collection & Receipts', description: 'Fee billing, tracking, and printed receipts' },
  { key: 'store', label: 'School Store / Inventory', description: 'Uniforms, books, inventory tracking' },
  { key: 'pos', label: 'Point of Sale (POS)', description: 'Direct cashier counter terminal' },
  { key: 'communications', label: 'SMS & WhatsApp Broadcasts', description: 'Terminal parent notifications and alerts' },
  { key: 'analytics', label: 'Advanced Analytics', description: 'Financial analytics, performance insights' },
  { key: 'users_portals', label: 'Role-Based User Accounts', description: 'Granular user credential accounts' },
  { key: 'settings', label: 'School System Settings', description: 'Grading scale, school crest, and terms' },
  { key: 'teacher_portal', label: 'Dedicated Teacher Portal', description: 'Teacher marks entry and attendance console' },
  { key: 'parent_portal', label: 'Dedicated Parent Portal', description: 'Parent grade access, attendance, and bills' },
  { key: 'student_portal', label: 'Dedicated Student Portal', description: 'Student homework and report cards access' },
  { key: 'accountant_portal', label: 'Bursar & Accountant Portal', description: 'Financial cashier & ledger console' },
];

export const SuperAdminPlans: React.FC<SuperAdminPlansProps> = ({
  plans,
  onSavePlan,
  onDeletePlan
}) => {
  const [editingPlan, setEditingPlan] = useState<SubscriptionTier | null>(null);
  const [isNewPlan, setIsNewPlan] = useState(false);

  const handleOpenEdit = (plan: SubscriptionTier) => {
    setIsNewPlan(false);
    setEditingPlan({ ...plan });
  };

  const handleOpenCreate = () => {
    setIsNewPlan(true);
    const newPlan: SubscriptionTier = {
      id: `plan_${Date.now()}`,
      name: 'CUSTOM TIER',
      code: `custom_${Date.now().toString().slice(-4)}`,
      priceGHS: 450,
      billingPeriod: 'term',
      description: 'Customized educational platform subscription tier.',
      studentLimit: 500,
      isActive: true,
      displayOrder: plans.length + 1,
      features: ['students', 'teachers', 'classrooms', 'subjects', 'attendance', 'results', 'reports', 'fees', 'settings'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingPlan(newPlan);
  };

  const toggleFeatureInEditing = (featureKey: FeatureKey) => {
    if (!editingPlan) return;
    const exists = editingPlan.features.includes(featureKey);
    const updatedFeatures = exists
      ? editingPlan.features.filter(f => f !== featureKey)
      : [...editingPlan.features, featureKey];
    
    setEditingPlan({ ...editingPlan, features: updatedFeatures });
  };

  const handleSaveModal = async () => {
    if (!editingPlan) return;
    await onSavePlan(editingPlan);
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Subscription Plans & Pricing Tiers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure pricing, billing intervals, student limits, and feature entitlements for Ghanaian schools.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isCore = ['plan_basic', 'plan_standard', 'plan_premium'].includes(plan.id);

          return (
            <div 
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 transition-all ${
                plan.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-4">
                
                {/* Top Badge & Title */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {plan.code}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">{plan.name}</h3>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    plan.isActive 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Pricing & Billing Period */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {formatGHS(plan.priceGHS)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium uppercase ml-1">
                      / {plan.billingPeriod}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Up to {plan.studentLimit} students</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {plan.description}
                </p>

                {/* Features List Summary */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 mb-2">
                    Included Features ({plan.features.length})
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs text-slate-600 max-h-48 overflow-y-auto pr-1">
                    {plan.features.map(fKey => {
                      const featInfo = ALL_AVAILABLE_FEATURES.find(af => af.key === fKey);
                      return (
                        <div key={fKey} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span className="text-[11px] font-medium text-slate-800 truncate">
                            {featInfo?.label || fKey}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Plan</span>
                </button>

                {!isCore && (
                  <button
                    onClick={() => onDeletePlan(plan.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Delete custom plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Edit / Create Plan Modal */}
      {editingPlan && (
        <Modal
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          title={isNewPlan ? 'Create New Subscription Plan' : `Edit Plan: ${editingPlan.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-xs">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Plan Display Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Plan Code (Identifier)</label>
                <input
                  type="text"
                  value={editingPlan.code}
                  onChange={(e) => setEditingPlan({ ...editingPlan, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Price (GH₵)</label>
                <input
                  type="number"
                  value={editingPlan.priceGHS}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priceGHS: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Billing Period</label>
                <select
                  value={editingPlan.billingPeriod}
                  onChange={(e) => setEditingPlan({ ...editingPlan, billingPeriod: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="term">Per Term</option>
                  <option value="year">Per Academic Year</option>
                  <option value="month">Per Month</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Student Capacity Limit</label>
                <input
                  type="number"
                  value={editingPlan.studentLimit}
                  onChange={(e) => setEditingPlan({ ...editingPlan, studentLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Status</label>
                <select
                  value={editingPlan.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.value === 'true' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="true">Active & Visible to Schools</option>
                  <option value="false">Disabled / Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Description</label>
              <textarea
                rows={2}
                value={editingPlan.description}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* Feature Checkboxes Matrix */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-900">
                  Feature Entitlements ({editingPlan.features.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPlan({ ...editingPlan, features: ALL_AVAILABLE_FEATURES.map(f => f.key) })}
                    className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setEditingPlan({ ...editingPlan, features: [] })}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {ALL_AVAILABLE_FEATURES.map(feat => {
                  const isChecked = editingPlan.features.includes(feat.key);
                  return (
                    <label
                      key={feat.key}
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-teal-50/70 border-teal-300 text-teal-950 font-bold' 
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeatureInEditing(feat.key)}
                        className="mt-0.5 rounded text-teal-700 focus:ring-teal-600"
                      />
                      <div className="min-w-0">
                        <div className="text-xs truncate">{feat.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{feat.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Save Subscription Tier
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
