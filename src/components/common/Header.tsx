import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { Calendar, CheckCircle2, AlertCircle, Building2, LogOut, ShieldCheck, User, Menu, X } from 'lucide-react';
import { GhanaFlagBadge } from './EmptyState';
import { SchoolOSLogo } from './SchoolOSLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenSchoolRegistration?: () => void;
  onOpenNotificationModal?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}) => {
  const { currentUser, logout } = useAuth();
  const { school } = useSchool();

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'superAdmin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'schoolOwner': return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'principal': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'teacher': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'accountant': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'parent': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'student': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'superAdmin': return 'Super Admin';
      case 'schoolOwner': return 'School Owner';
      case 'principal': return 'Principal';
      case 'teacher': return 'Class Teacher';
      case 'accountant': return 'Accountant';
      case 'parent': return 'Parent';
      case 'student': return 'Student';
      default: return 'User';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6">
      {/* Left branding, hamburger toggle & School Context */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Toggle Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-teal-700" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        )}

        {currentUser?.role === 'superAdmin' ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <SchoolOSLogo size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs font-bold text-slate-900 tracking-tight uppercase truncate">SchoolOS</h1>
                <span className="bg-purple-50 text-purple-700 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-purple-200 uppercase">SUPER ADMIN</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate hidden sm:block">Multi-School Cloud Infrastructure</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            {school?.logo ? (
              <img 
                src={school.logo} 
                alt={school.name} 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-teal-700 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {school?.shortCode || 'SCH'}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate uppercase max-w-[120px] sm:max-w-[200px] md:max-w-[260px]">
                  {school?.name || 'SchoolOS'}
                </h2>
                {school?.status === 'active' ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5" /> GES Verified
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0">
                    <AlertCircle className="w-2.5 h-2.5" /> {school?.status?.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.2 flex-wrap font-medium">
                <span className="flex items-center gap-1 text-teal-800 font-semibold truncate">
                  <Calendar className="w-3 h-3 text-teal-600 shrink-0" /> {school?.currentAcademicYear} • {school?.currentTerm}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side telemetry and user controls */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Real-time telemetry badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full shadow-2xs">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider">Real-Time Sync</span>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* PWA In-App Install Button */}
        <PWAInstallButton />

        {/* User Profile Card */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser?.fullName}</p>
            <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-sm border ${getRoleBadgeColor(currentUser?.role)} mt-0.5`}>
              {getRoleLabel(currentUser?.role)}
            </span>
          </div>

          {currentUser?.avatarUrl ? (
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.fullName} 
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center border border-teal-200 shrink-0">
              {currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'U'}
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Sign Out to Login Screen"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
