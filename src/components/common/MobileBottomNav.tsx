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
  ShoppingCart,
  MessageSquare
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
        { id: 'results', label: 'Marks', icon: FileSpreadsheet },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'students', label: 'Pupils', icon: Users },
        { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
      ];
    }

    if (role === 'parent') {
      return [
        { id: 'parent_portal', label: 'Wards', icon: HeartHandshake },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'fees', label: 'Fees', icon: CreditCard },
        { id: 'communications', label: 'Notices', icon: MessageSquare },
        { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
      ];
    }

    if (role === 'student') {
      return [
        { id: 'student_portal', label: 'Learn', icon: User },
        { id: 'results', label: 'Scores', icon: FileSpreadsheet },
        { id: 'reports', label: 'Report', icon: FileText },
        { id: 'attendance', label: 'Roll Log', icon: CalendarCheck2 },
        { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
      ];
    }

    if (role === 'accountant') {
      return [
        { id: 'accountant_portal', label: 'Bursary', icon: Calculator },
        { id: 'fees', label: 'Fees', icon: CreditCard },
        { id: 'pos', label: 'Store POS', icon: ShoppingCart },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
      ];
    }

    // Default: School Owner / Principal
    return [
      { id: 'school_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'students', label: 'Students', icon: Users },
      { id: 'fees', label: 'Fees', icon: CreditCard },
      { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
      { id: 'menu', label: 'Menu', icon: Menu, onClick: onOpenMenu },
    ];
  };

  const navItems = getNavItems();

  const isItemActive = (itemId: NavTabId | 'menu'): boolean => {
    if (itemId === 'menu') {
      return isMenuOpen;
    }

    if (isMenuOpen) {
      return false;
    }

    if (activeTab === itemId) {
      return true;
    }

    // Contextual active mapping for role views
    if (role === 'teacher') {
      if (itemId === 'teacher_portal') {
        return !['results', 'reports', 'students'].includes(activeTab);
      }
    } else if (role === 'parent') {
      if (itemId === 'parent_portal') {
        return !['reports', 'fees', 'communications'].includes(activeTab);
      }
    } else if (role === 'student') {
      if (itemId === 'student_portal') {
        return !['results', 'reports', 'attendance'].includes(activeTab);
      }
    } else if (role === 'accountant') {
      if (itemId === 'accountant_portal') {
        return !['fees', 'pos', 'students'].includes(activeTab);
      }
    }

    return false;
  };

  return (
    <nav 
      id="mobile-bottom-navigation-bar" 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 py-1 flex items-center justify-around shadow-lg safe-area-bottom select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isItemActive(item.id);

        return (
          <button
            key={item.id}
            id={`bottom-nav-${item.id}`}
            type="button"
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else {
                setActiveTab(item.id as NavTabId);
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-xl transition-all cursor-pointer relative ${
              isActive
                ? 'text-teal-700 font-bold bg-teal-50/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 active:bg-slate-100 font-medium'
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 transition-transform ${isActive ? 'scale-110 text-teal-700' : 'text-slate-400'}`} />
            <span className="text-[10.5px] leading-tight whitespace-nowrap text-center">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
