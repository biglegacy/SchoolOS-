import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Clock, 
  CheckCircle2, 
  Ban, 
  Users, 
  Sliders, 
  SlidersHorizontal,
  Layers, 
  CreditCard, 
  Wallet,
  MessageSquare, 
  MessageCircle,
  Bell,
  BarChart3,
  History, 
  Activity,
  Settings, 
  ShieldCheck,
  User,
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  Radio,
  Key
} from 'lucide-react';

export type SuperAdminNavId = 
  | 'overview_dashboard'
  | 'schools_all'
  | 'schools_pending'
  | 'schools_active'
  | 'schools_suspended'
  | 'services_portals'
  | 'services_features'
  | 'services_overrides'
  | 'sub_plans'
  | 'sub_subscriptions'
  | 'sub_billing'
  | 'comm_api'
  | 'comm_sms'
  | 'comm_whatsapp'
  | 'comm_notifications'
  | 'platform_reports'
  | 'platform_audit'
  | 'platform_activity'
  | 'system_settings'
  | 'settings_comm_api'
  | 'system_security'
  | 'system_profile';

interface SuperAdminLayoutProps {
  activeNav: SuperAdminNavId;
  setActiveNav: (nav: SuperAdminNavId) => void;
  pendingSchoolsCount: number;
  children: React.ReactNode;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  activeNav,
  setActiveNav,
  pendingSchoolsCount,
  children
}) => {
  const { currentUser, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleNavClick = (id: SuperAdminNavId) => {
    setActiveNav(id);
    setIsMobileDrawerOpen(false);
  };

  const getSectionTitle = (id: SuperAdminNavId): string => {
    switch (id) {
      case 'overview_dashboard': return 'Dashboard Overview';
      case 'schools_all': return 'All Registered Schools';
      case 'schools_pending': return 'Pending School Approvals';
      case 'schools_active': return 'Active Educational Institutions';
      case 'schools_suspended': return 'Suspended Institutions';
      case 'services_portals': return 'School Portals Management';
      case 'services_features': return 'Feature Management';
      case 'services_overrides': return 'School Feature Overrides';
      case 'sub_plans': return 'Subscription Plans';
      case 'sub_subscriptions': return 'School Subscriptions';
      case 'sub_billing': return 'Billing & Revenue';
      case 'comm_api': return 'Central Communications API';
      case 'comm_sms': return 'SMS Broadcast Service';
      case 'comm_whatsapp': return 'WhatsApp Business Service';
      case 'comm_notifications': return 'System Notifications';
      case 'platform_reports': return 'Platform Reports & Analytics';
      case 'platform_audit': return 'Audit Logs';
      case 'platform_activity': return 'Platform Activity';
      case 'system_settings': return 'System Settings';
      case 'settings_comm_api': return 'Communications API Settings';
      case 'system_security': return 'Security & Access';
      case 'system_profile': return 'Administrator Profile';
      default: return 'Super Admin Console';
    }
  };

  const navGroups = [
    {
      groupTitle: 'OVERVIEW',
      items: [
        { id: 'overview_dashboard' as SuperAdminNavId, label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      groupTitle: 'SCHOOL MANAGEMENT',
      items: [
        { id: 'schools_all' as SuperAdminNavId, label: 'All Schools', icon: Building2 },
        { 
          id: 'schools_pending' as SuperAdminNavId, 
          label: 'Pending Approvals', 
          icon: Clock,
          badge: pendingSchoolsCount > 0 ? pendingSchoolsCount : undefined,
          badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
        },
        { id: 'schools_active' as SuperAdminNavId, label: 'Active Schools', icon: CheckCircle2 },
        { id: 'schools_suspended' as SuperAdminNavId, label: 'Suspended Schools', icon: Ban },
      ]
    },
    {
      groupTitle: 'SCHOOL SERVICES',
      items: [
        { id: 'services_portals' as SuperAdminNavId, label: 'School Portals', icon: Users },
        { id: 'services_features' as SuperAdminNavId, label: 'Feature Management', icon: Sliders },
        { id: 'services_overrides' as SuperAdminNavId, label: 'School Feature Overrides', icon: SlidersHorizontal },
      ]
    },
    {
      groupTitle: 'SUBSCRIPTIONS',
      items: [
        { id: 'sub_plans' as SuperAdminNavId, label: 'Plans', icon: Layers },
        { id: 'sub_subscriptions' as SuperAdminNavId, label: 'Subscriptions', icon: CreditCard },
        { id: 'sub_billing' as SuperAdminNavId, label: 'Billing', icon: Wallet },
      ]
    },
    {
      groupTitle: 'COMMUNICATION',
      items: [
        { id: 'comm_api' as SuperAdminNavId, label: 'Communications API', icon: Key },
        { id: 'comm_sms' as SuperAdminNavId, label: 'SMS Broadcast', icon: MessageSquare },
        { id: 'comm_whatsapp' as SuperAdminNavId, label: 'WhatsApp Broadcast', icon: MessageCircle },
        { id: 'comm_notifications' as SuperAdminNavId, label: 'Notifications', icon: Bell },
      ]
    },
    {
      groupTitle: 'PLATFORM',
      items: [
        { id: 'platform_reports' as SuperAdminNavId, label: 'Reports', icon: BarChart3 },
        { id: 'platform_audit' as SuperAdminNavId, label: 'Audit Logs', icon: History },
        { id: 'platform_activity' as SuperAdminNavId, label: 'Platform Activity', icon: Activity },
      ]
    },
    {
      groupTitle: 'SETTINGS & SYSTEM',
      items: [
        { id: 'system_settings' as SuperAdminNavId, label: 'System Settings', icon: Settings },
        { id: 'settings_comm_api' as SuperAdminNavId, label: 'Communications API', icon: Radio },
        { id: 'system_security' as SuperAdminNavId, label: 'Security & Access', icon: ShieldCheck },
        { id: 'system_profile' as SuperAdminNavId, label: 'Admin Profile', icon: User },
      ]
    }
  ];

  const renderNavLinks = (isDrawer = false) => (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      {navGroups.map((group, idx) => (
        <div key={idx} className="space-y-1">
          {(!isCollapsed || isDrawer) ? (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
              {group.groupTitle}
            </div>
          ) : (
            <div className="w-8 mx-auto border-t border-slate-200 my-2" />
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center ${isCollapsed && !isDrawer ? 'justify-center px-0' : 'justify-between px-3'} py-2 text-xs transition-all rounded-xl cursor-pointer min-h-[40px] ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/90 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-700'}`} />
                      {(!isCollapsed || isDrawer) && <span className="truncate text-[12.5px]">{item.label}</span>}
                    </div>

                    {(!isCollapsed || isDrawer) && item.badge !== undefined && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold shrink-0 ${item.badgeColor || 'bg-teal-100 text-teal-800'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Tooltip on collapsed state */}
                  {isCollapsed && !isDrawer && (
                    <div className="fixed left-16 ml-2 hidden group-hover:flex items-center z-50 pointer-events-none">
                      <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in duration-150">
                        {item.label}
                        {item.badge !== undefined && (
                          <span className="ml-1.5 bg-amber-400 text-slate-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-900 selection:bg-teal-700 selection:text-white">
      
      {/* Super Admin Desktop Collapsible Sidebar */}
      <aside 
        className={`hidden md:flex bg-white border-r border-slate-200 flex-col shrink-0 transition-all duration-200 z-30 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-3.5 border-b border-slate-200 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-800 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                OS
              </div>
              <div className="min-w-0 leading-tight">
                <div className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>SchoolOS</span>
                  <span className="bg-teal-100 text-teal-800 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-teal-200">
                    ROOT
                  </span>
                </div>
                <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Super Admin
                </div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-xl bg-teal-800 text-white font-black text-sm flex items-center justify-center shadow-xs">
              OS
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Group Items */}
        {renderNavLinks(false)}

        {/* Sidebar Footer User Info & Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">Super Admin</div>
                <div className="text-[10px] font-mono text-slate-500 truncate">{currentUser?.email || 'su@admin'}</div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Logout from Super Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full flex justify-center p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Slide-Out Drawer for Super Admin */}
      {isMobileDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div 
            className="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-250"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-teal-800 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  OS
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">SchoolOS</div>
                  <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Super Admin</div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavLinks(true)}

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 truncate">Super Admin</div>
              <button
                onClick={logout}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Super Admin Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 z-20 shrink-0">
          {/* Mobile Hamburger Menu Toggle */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
              aria-label="Toggle menu"
            >
              {isMobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb & Section Name */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs font-medium text-slate-400 hidden sm:inline">Platform</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[160px] sm:max-w-none">
                {getSectionTitle(activeNav)}
              </h1>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Platform Online</span>
            </div>

            {/* Profile Avatar Pill */}
            <button
              onClick={() => setActiveNav('system_profile')}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:bg-slate-50 p-1 rounded-xl transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 border border-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                SU
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">Super Administrator</div>
                <div className="text-[10px] text-teal-700 font-medium">Platform Root</div>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 justify-center"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-7 bg-slate-50/90 pb-20 md:pb-7">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};
