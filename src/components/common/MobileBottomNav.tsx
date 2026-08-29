import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NavTabId } from './Sidebar';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  GraduationCap, 
  Menu, 
  FileSpreadsheet, 
  FileText, 
  HeartHandshake, 
  User, 
  Calculator, 
  Building2,
  CalendarCheck2,
  ShoppingCart
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMenu,
  isMenuOpen
}) => {
  const { currentUser, impersonatedSchoolId } = useAuth();
  const role = currentUser?.role || 'schoolOwner';

  interface BottomNavItem {
    id: NavTabId | 'menu';
    label: string;
    icon: React.FC<{ className?: string }>;
    onClick?: () => void;
  }

  const getNavItems = (): BottomNavItem[] => {
    if (role === 'superAdmin' && !impersonatedSchoolId) {
      return [
        { id: 'superadmin_dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'superadmin_schools', label: 'Schools', icon: Building2 },
        { id: 'superadmin_subscriptions', label: 'Plans', icon: CreditCard },
        { id: 'superadmin_audit', label: 'Activity', icon: FileText },
        { id: 'menu', label: 'More', icon: Menu, onClick: onOpenMenu },
      ];
    }

    if (role === 'teacher') {
      return [
        { id: 'teacher_portal', label: 'Portal', icon: GraduationCap },
        { id: 'attendance', label: 'Roll Call', icon: CalendarCheck2 },
        { id: 'results', label: 'Marks', icon: FileSpreadsheet },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
      ];
    }

    if (role === 'parent') {
      return [
        { id: 'parent_portal', label: 'Wards', icon: HeartHandshake },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'fees', label: 'Fees', icon: CreditCard },
        { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
      ];
    }

    if (role === 'student') {
      return [
        { id: 'student_portal', label: 'Learning', icon: User },
        { id: 'results', label: 'Results', icon: FileSpreadsheet },
        { id: 'reports', label: 'Report', icon: FileText },
        { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
      ];
    }

    if (role === 'accountant') {
      return [
        { id: 'accountant_portal', label: 'Console', icon: Calculator },
        { id: 'fees', label: 'Fees', icon: CreditCard },
        { id: 'pos', label: 'POS', icon: ShoppingCart },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
      ];
    }

    // Default: School Owner / Principal
    return [
      { id: 'school_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'students', label: 'Students', icon: Users },
      { id: 'fees', label: 'Fees', icon: CreditCard },
      { id: 'attendance', label: 'Roll Call', icon: CalendarCheck2 },
      { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 flex items-center justify-around shadow-lg safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isMenu = item.id === 'menu';
        const isActive = isMenu ? isMenuOpen : activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else {
                setActiveTab(item.id as NavTabId);
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-teal-700 font-bold bg-teal-50/80'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 transition-transform ${isActive ? 'scale-110 text-teal-700' : 'text-slate-400'}`} />
            <span className="text-[10px] leading-tight truncate max-w-[60px] text-center">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
