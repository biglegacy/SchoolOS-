import React, { useState } from 'react';
import { 
  GraduationCap, 
  HeartHandshake, 
  User, 
  Check, 
  X, 
  Search, 
  Sliders, 
  Building2, 
  Sparkles, 
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Shield,
  Lock,
  Layers,
  Settings,
  ChevronRight,
  Eye,
  ExternalLink
} from 'lucide-react';
import { School, SubscriptionTier, FeatureKey } from '../../types';
import { Modal } from '../common/Modal';

interface SuperAdminPortalsProps {
  schools: School[];
  plans: SubscriptionTier[];
  onToggleSchoolFeature: (schoolId: string, feature: FeatureKey, value: boolean | undefined) => Promise<void>;
  onOpenOverrides: (school: School) => void;
}

interface PortalConfigDef {
  key: FeatureKey;
  name: string;
  badgeRole: string;
  icon: typeof GraduationCap;
  description: string;
  plans: string[];
  featuresList: string[];
  capabilities: { title: string; desc: string }[];
  accentColor: string;
  bgLight: string;
  borderColor: string;
}

const PORTAL_DEFINITIONS: PortalConfigDef[] = [
  {
    key: 'teacher_portal',
    name: 'Teacher Portal',
    badgeRole: 'TEACHER',
    icon: GraduationCap,
    description: 'Give teachers secure access to classrooms, students, attendance, subjects, results and academic tools.',
    plans: ['Basic', 'Standard', 'Premium'],
    featuresList: [
      'Teacher Dashboard & Quick Stats',
      'Assigned Classrooms & Roster',
      'Daily Attendance Marking',
      'GES 30/70 SBA Marks Entry',
      'Subject Assignments & Curriculum',
      'Terminal Assessment Remark Generator',
      'School Broadcast Notices & Alerts',
      'Teacher Profile & Password Security'
    ],
    capabilities: [
      { title: 'Classroom & Student Access', desc: 'Strictly restricted to teacher assigned classes and subjects' },
      { title: 'SBA Marks & SBA Entry', desc: 'Continuous assessment scoring with auto Ghanaian grading scale' },
      { title: 'Daily Attendance Roll Call', desc: 'Instant presence and absence marking with parent alerts' }
    ],
    accentColor: 'text-teal-700',
    bgLight: 'bg-teal-50',
    borderColor: 'border-teal-200'
  },
  {
    key: 'parent_portal',
    name: 'Parent Portal',
    badgeRole: 'PARENT / GUARDIAN',
    icon: HeartHandshake,
    description: 'Allow parents to securely monitor their children\'s attendance, results, fees, announcements and school activities.',
    plans: ['Basic', 'Standard', 'Premium'],
    featuresList: [
      'Parent Dashboard & Children Summary',
      'Real-time Daily Attendance Tracking',
      'Continuous Assessment & Exam Scores',
      'Official Ghanaian Terminal PDF Reports',
      'Fee Invoicing & Payment History',
      'Instant SMS & WhatsApp Notices',
      'School Calendar & Term Events',
      'Parent Account Profile Management'
    ],
    capabilities: [
      { title: 'Linked Children Sandbox', desc: 'Parents only see verified linked wards and students' },
      { title: 'Terminal Report Card PDFs', desc: 'View and download termly reports with teacher remarks' },
      { title: 'Fee Status & Ledger', desc: 'Live visibility into bills, paid sums, and outstanding arrears' }
    ],
    accentColor: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  {
    key: 'student_portal',
    name: 'Student Portal',
    badgeRole: 'STUDENT',
    icon: User,
    description: 'Give students secure access to their academic information, attendance, results and school announcements.',
    plans: ['Basic', 'Standard', 'Premium'],
    featuresList: [
      'Student Dashboard & Timetable',
      'Enrolled Subjects & Curriculum',
      'Personal Attendance History',
      'Terminal Exam Results & SBA',
      'Class Positions & Grade Ranks',
      'School Events & Notices',
      'Fee Clearance Status',
      'Student Profile Security'
    ],
    capabilities: [
      { title: 'Individual Academic Records', desc: 'Self-service view of termly performance and SBA scores' },
      { title: 'GES Subject Curriculum', desc: 'Registered subject listing and class timetable' },
      { title: 'Official Announcements', desc: 'Direct access to school events and termly notices' }
    ],
    accentColor: 'text-cyan-700',
    bgLight: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  }
];

export const SuperAdminPortals: React.FC<SuperAdminPortalsProps> = ({
  schools,
  plans,
  onToggleSchoolFeature,
  onOpenOverrides
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedPortalForManage, setSelectedPortalForManage] = useState<PortalConfigDef | null>(null);

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
    const planDefault = plan ? plan.features.includes(feature) : true; // Portals default to true on basic/standard/premium

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
      
      {/* 1. Header Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">School Portals</h2>
              <span className="bg-teal-50 text-teal-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-teal-200 uppercase">
                First-Class Services
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Manage the digital portals available to schools and their users.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              Platform Schools: <b className="text-slate-900 font-mono">{schools.length}</b>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Primary Portal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PORTAL_DEFINITIONS.map(portal => {
          const Icon = portal.icon;
          
          // Calculate enabled count across schools
          const enabledCount = schools.filter(s => getFeatureStatus(s, portal.key).enabled).length;

          return (
            <div 
              key={portal.key}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition-all"
            >
              <div className="space-y-3.5">
                
                {/* Icon & Status */}
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${portal.bgLight} ${portal.accentColor} flex items-center justify-center border ${portal.borderColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Enabled</span>
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{portal.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                {/* Plan Availability Pills */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10.5px] text-slate-500 font-medium mb-1.5">Availability by Plan:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {portal.plans.map(p => (
                      <span key={p} className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-[11px] text-slate-500 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span>Active Institutions:</span>
                  <span className="font-mono font-bold text-slate-900">{enabledCount} / {schools.length}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedPortalForManage(portal)}
                className="w-full py-2 bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. School Portals Matrix & Overrides Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4">
        
        {/* Table Filter & Search Toolbar */}
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

          <div className="text-[11px] text-slate-500 font-medium">
            Click any portal badge to toggle override: <span className="text-emerald-700 font-bold">Enabled</span> • <span className="text-rose-700 font-bold">Disabled</span> • <span className="text-slate-500">Plan Default</span>
          </div>
        </div>

        {/* Schools Portals Table */}
        {filteredSchools.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400 space-y-1">
            <Building2 className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No schools matching filter</p>
            <p className="text-[11px] text-slate-400">Try adjusting the plan filter or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                  <th className="py-3 px-4">School & District</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4 text-center">Teacher Portal</th>
                  <th className="py-3 px-4 text-center">Parent Portal</th>
                  <th className="py-3 px-4 text-center">Student Portal</th>
                  <th className="py-3 px-4 text-right">Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSchools.map(school => {
                  const teacherStatus = getFeatureStatus(school, 'teacher_portal');
                  const parentStatus = getFeatureStatus(school, 'parent_portal');
                  const studentStatus = getFeatureStatus(school, 'student_portal');

                  return (
                    <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* School Name & Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{school.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {school.shortCode} • {school.district} • {school.region}
                        </div>
                      </td>

                      {/* Plan Badge */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold uppercase text-teal-800 font-mono text-[10px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {school.subscriptionPlan || 'BASIC'}
                        </span>
                      </td>

                      {/* Teacher Portal Toggle Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleCycleOverride(school, 'teacher_portal')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            teacherStatus.overrideVal === true
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : teacherStatus.overrideVal === false
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : teacherStatus.enabled
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                          title={`Teacher Portal: ${teacherStatus.overrideVal !== undefined ? 'Custom Override' : 'Plan Default'} (${teacherStatus.enabled ? 'Enabled' : 'Disabled'})`}
                        >
                          {teacherStatus.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{teacherStatus.enabled ? 'Enabled' : 'Disabled'}</span>
                          {teacherStatus.isOverride && (
                            <span className="text-[8px] uppercase tracking-wider ml-0.5 opacity-90">(Override)</span>
                          )}
                        </button>
                      </td>

                      {/* Parent Portal Toggle Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleCycleOverride(school, 'parent_portal')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            parentStatus.overrideVal === true
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : parentStatus.overrideVal === false
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : parentStatus.enabled
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                          title={`Parent Portal: ${parentStatus.overrideVal !== undefined ? 'Custom Override' : 'Plan Default'} (${parentStatus.enabled ? 'Enabled' : 'Disabled'})`}
                        >
                          {parentStatus.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{parentStatus.enabled ? 'Enabled' : 'Disabled'}</span>
                          {parentStatus.isOverride && (
                            <span className="text-[8px] uppercase tracking-wider ml-0.5 opacity-90">(Override)</span>
                          )}
                        </button>
                      </td>

                      {/* Student Portal Toggle Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleCycleOverride(school, 'student_portal')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            studentStatus.overrideVal === true
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : studentStatus.overrideVal === false
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : studentStatus.enabled
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                          title={`Student Portal: ${studentStatus.overrideVal !== undefined ? 'Custom Override' : 'Plan Default'} (${studentStatus.enabled ? 'Enabled' : 'Disabled'})`}
                        >
                          {studentStatus.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{studentStatus.enabled ? 'Enabled' : 'Disabled'}</span>
                          {studentStatus.isOverride && (
                            <span className="text-[8px] uppercase tracking-wider ml-0.5 opacity-90">(Override)</span>
                          )}
                        </button>
                      </td>

                      {/* Full Overrides Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onOpenOverrides(school)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>Configure</span>
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

      {/* 4. Portal Configuration Modal when "Manage" is clicked */}
      {selectedPortalForManage && (
        <Modal
          isOpen={!!selectedPortalForManage}
          onClose={() => setSelectedPortalForManage(null)}
          title={`Configure ${selectedPortalForManage.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            
            {/* Header info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl ${selectedPortalForManage.bgLight} ${selectedPortalForManage.accentColor} flex items-center justify-center shrink-0 border ${selectedPortalForManage.borderColor}`}>
                <selectedPortalForManage.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{selectedPortalForManage.name}</h4>
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    ROLE: {selectedPortalForManage.badgeRole}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedPortalForManage.description}
                </p>
              </div>
            </div>

            {/* Core Capabilities */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Access Scope & Role Safeguards</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedPortalForManage.capabilities.map((cap, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
                    <div className="text-xs font-bold text-slate-900">{cap.title}</div>
                    <div className="text-[10.5px] text-slate-500 leading-snug">{cap.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Included Module Features */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Included Feature Modules</h5>
              <div className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedPortalForManage.featuresList.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Availability */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-teal-950">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-700" />
                <span>Subscription Plan Availability: <b>Basic, Standard, Premium</b></span>
              </div>
              <span className="bg-teal-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Active in All Tiers
              </span>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPortalForManage(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
