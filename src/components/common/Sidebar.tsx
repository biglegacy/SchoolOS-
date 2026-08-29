import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { FeatureKey } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  School, 
  CalendarCheck2, 
  FileSpreadsheet, 
  FileText, 
  ArrowUpRightSquare, 
  CreditCard, 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  Layers, 
  History,
  HeartHandshake,
  User,
  Calculator,
  Building2,
  Sliders,
  Radio,
  KeyRound,
  X
} from 'lucide-react';

export type NavTabId = 
  | 'superadmin_dashboard'
  | 'superadmin_schools'
  | 'superadmin_subscriptions'
  | 'superadmin_features'
  | 'superadmin_api'
  | 'superadmin_audit'
  | 'superadmin_settings'
  | 'school_dashboard'
  | 'portals'
  | 'students'
  | 'teachers'
  | 'classrooms'
  | 'attendance'
  | 'results'
  | 'reports'
  | 'promotions'
  | 'fees'
  | 'store'
  | 'pos'
  | 'communications'
  | 'analytics'
  | 'settings'
  | 'teacher_portal'
  | 'parent_portal'
  | 'student_portal'
  | 'accountant_portal';

interface SidebarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  onOpenSchoolRegistration?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen = false,
  onClose,
}) => {
  const { currentUser, allSchools, impersonatedSchoolId } = useAuth();
  const { hasAccess } = useSchool();
  const role = currentUser?.role || 'schoolOwner';

  const pendingCount = (allSchools || []).filter(s => s.status === 'pending').length;

  interface NavItem {
    id: NavTabId;
    label: string;
    icon: React.FC<{ className?: string }>;
    featureKey?: FeatureKey;
    badge?: string | number;
    badgeColor?: string;
  }

  interface NavGroup {
    groupTitle?: string;
    items: NavItem[];
  }

  const handleSelectTab = (tabId: NavTabId) => {
    setActiveTab(tabId);
    if (onClose) {
      onClose();
    }
  };

  const getNavGroups = (): NavGroup[] => {
    // If Super Admin is NOT currently impersonating a school, show full platform management
    if (role === 'superAdmin' && !impersonatedSchoolId) {
      return [
        {
          groupTitle: 'PLATFORM GOVERNANCE',
          items: [
            { id: 'superadmin_dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
            { 
              id: 'superadmin_schools', 
              label: 'Schools & Approvals', 
              icon: Building2, 
              badge: pendingCount > 0 ? `${pendingCount} Pending` : undefined, 
              badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300' 
            },
            { id: 'superadmin_subscriptions', label: 'Subscriptions & Plans', icon: CreditCard },
            { id: 'superadmin_features', label: 'Feature Overrides', icon: Sliders },
            { id: 'superadmin_api', label: 'SMS & WhatsApp API', icon: Radio },
            { id: 'superadmin_audit', label: 'Platform Audit Logs', icon: History },
          ]
        }
      ];
    }

    if (role === 'teacher') {
      return [
        {
          groupTitle: 'TEACHING WORKSPACE',
          items: [
            { id: 'teacher_portal', label: 'My Teacher Portal', icon: GraduationCap },
            { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck2, featureKey: 'attendance' },
            { id: 'results', label: 'Exams & Continuous Assessment', icon: FileSpreadsheet, featureKey: 'results' },
            { id: 'reports', label: 'Terminal Report Cards', icon: FileText, featureKey: 'reports' },
          ]
        },
        {
          groupTitle: 'CAMPUS CONTEXT',
          items: [
            { id: 'students', label: 'Class Students', icon: Users, featureKey: 'students' },
            { id: 'classrooms', label: 'Classrooms & Streams', icon: Layers, featureKey: 'classrooms' },
          ]
        }
      ];
    }

    if (role === 'parent') {
      return [
        {
          groupTitle: 'PARENT PORTAL',
          items: [
            { id: 'parent_portal', label: 'My Ward(s) Overview', icon: HeartHandshake },
            { id: 'reports', label: 'Terminal Report Cards', icon: FileText, featureKey: 'reports' },
            { id: 'fees', label: 'School Fees & Receipts', icon: CreditCard, featureKey: 'fees' },
          ]
        }
      ];
    }

    if (role === 'student') {
      return [
        {
          groupTitle: 'STUDENT PORTAL',
          items: [
            { id: 'student_portal', label: 'My Learning Dashboard', icon: User },
            { id: 'results', label: 'My Exam Results', icon: FileSpreadsheet, featureKey: 'results' },
            { id: 'reports', label: 'My Report Card', icon: FileText, featureKey: 'reports' },
          ]
        }
      ];
    }

    if (role === 'accountant') {
      return [
        {
          groupTitle: 'BURSARY & FINANCE',
          items: [
            { id: 'accountant_portal', label: 'Bursary Console', icon: Calculator },
            { id: 'fees', label: 'School Fees Collection', icon: CreditCard, featureKey: 'fees' },
            { id: 'pos', label: 'POS Cashier Register', icon: ShoppingCart, featureKey: 'pos' },
            { id: 'store', label: 'Store Inventory', icon: Package, featureKey: 'store' },
            { id: 'analytics', label: 'Financial & POS Reports', icon: BarChart3, featureKey: 'analytics' },
          ]
        },
        {
          groupTitle: 'STUDENTS & GUARDIANS',
          items: [
            { id: 'students', label: 'Student Accounts', icon: Users, featureKey: 'students' },
            { id: 'communications', label: 'Fee Reminder Broadcasts', icon: MessageSquare, featureKey: 'communications' },
          ]
        }
      ];
    }

    // Default: School Owner / Principal or Super Admin viewing a school
    return [
      {
        groupTitle: 'ADMINISTRATIVE CORE',
        items: [
          { id: 'school_dashboard', label: 'School Dashboard', icon: LayoutDashboard },
          { id: 'portals', label: 'Portals & Users', icon: KeyRound },
          { id: 'students', label: 'Students & Admissions', icon: Users, featureKey: 'students' },
          { id: 'teachers', label: 'Teachers & Staff', icon: GraduationCap, featureKey: 'teachers' },
          { id: 'classrooms', label: 'Classrooms & Streams', icon: Layers, featureKey: 'classrooms' },
        ]
      },
      {
        groupTitle: 'ACADEMICS & ASSESSMENTS',
        items: [
          { id: 'attendance', label: 'Daily Roll Call', icon: CalendarCheck2, featureKey: 'attendance' },
          { id: 'results', label: 'Results & Examinations', icon: FileSpreadsheet, featureKey: 'results' },
          { id: 'reports', label: 'GES Terminal Reports', icon: FileText, featureKey: 'reports' },
          { id: 'promotions', label: 'Promotion Workflow', icon: ArrowUpRightSquare, featureKey: 'promotions' },
        ]
      },
      {
        groupTitle: 'FINANCE & COMMERCE',
        items: [
          { id: 'fees', label: 'School Fees & Billing', icon: CreditCard, featureKey: 'fees' },
          { id: 'store', label: 'Store & Inventory', icon: Package, featureKey: 'store' },
          { id: 'pos', label: 'POS Cashier Register', icon: ShoppingCart, featureKey: 'pos' },
        ]
      },
      {
        groupTitle: 'ENGAGEMENT & SETTINGS',
        items: [
          { id: 'communications', label: 'SMS & WhatsApp Center', icon: MessageSquare, featureKey: 'communications' },
          { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3, featureKey: 'analytics' },
          { id: 'settings', label: 'School Settings', icon: Settings, featureKey: 'settings' },
        ]
      }
    ];
  };

  const rawGroups = getNavGroups();
  const navGroups = rawGroups.map(group => {
    const accessibleItems = group.items.filter(item => {
      if (!item.featureKey) return true;
      if (role === 'superAdmin') return true;
      return hasAccess(item.featureKey);
    });
    return { ...group, items: accessibleItems };
  }).filter(group => group.items.length > 0);

  const renderNavigationContent = () => (
    <>
      <div className="p-3.5 flex-1 overflow-y-auto space-y-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.groupTitle && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 flex items-center gap-1.5">
                <div className="w-1 h-2.5 bg-teal-600 rounded-full"></div>
                <span>{group.groupTitle}</span>
              </div>
            )}
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-all rounded-xl text-left cursor-pointer min-h-[44px] ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/80 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ${item.badgeColor || 'bg-teal-100 text-teal-800'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* GES Curriculum Standard Badge */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 m-2 rounded-xl">
        <div className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center justify-between">
          <span>Curriculum Standard</span>
          <span className="font-mono text-teal-700 font-bold">● GES 30/70</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-1.5">
          <div className="h-full bg-teal-600 rounded-full" style={{ width: '85%' }}></div>
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500 font-semibold">
          <span>CA Marks: 30%</span>
          <span className="text-slate-400">Exam: 70%</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 flex-col shrink-0 min-h-[calc(100vh-64px)]">
        {renderNavigationContent()}
      </aside>

      {/* Mobile Slide-Out Drawer with Backdrop Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={onClose}
        >
          <div 
            className="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-250"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Drawer Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-teal-700 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  OS
                </div>
                <span className="text-xs font-black text-slate-900 tracking-tight uppercase">Navigation Menu</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            {renderNavigationContent()}
          </div>
        </div>
      )}
    </>
  );
};
