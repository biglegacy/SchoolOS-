import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SchoolProvider, useSchool } from './contexts/SchoolContext';
import { Header } from './components/common/Header';
import { Sidebar, NavTabId } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { LoginView } from './components/auth/LoginView';
import { SchoolRegistrationModal } from './components/auth/SchoolRegistrationModal';

// Views
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { SchoolAdminDashboard } from './components/dashboard/SchoolAdminDashboard';
import { StudentManagementView } from './components/students/StudentManagementView';
import { TeacherManagementView } from './components/teachers/TeacherManagementView';
import { ClassroomManagementView } from './components/classrooms/ClassroomManagementView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { ResultsAndExamsView } from './components/results/ResultsAndExamsView';
import { ReportsCenterView } from './components/reports/ReportsCenterView';
import { TerminalReportModal } from './components/reports/TerminalReportModal';
import { PromotionWorkflowView } from './components/promotion/PromotionWorkflowView';
import { FeesManagementView } from './components/fees/FeesManagementView';
import { StoreInventoryView } from './components/store/StoreInventoryView';
import { POSRegisterView } from './components/pos/POSRegisterView';
import { CommunicationsView } from './components/communications/CommunicationsView';
import { SchoolSettingsView } from './components/settings/SchoolSettingsView';
import { SchoolOwnerPortalsView } from './components/portals/SchoolOwnerPortalsView';
import { TeacherPortalView } from './components/portals/TeacherPortalView';
import { ParentPortalView } from './components/portals/ParentPortalView';
import { StudentPortalView } from './components/portals/StudentPortalView';
import { AccountantPortalView } from './components/portals/AccountantPortalView';
import { Student } from './types';

const MainAppLayout: React.FC = () => {
  const { currentUser, impersonatedSchoolId, impersonateSchool } = useAuth();
  const { school } = useSchool();
  const [activeTab, setActiveTab] = useState<NavTabId>('school_dashboard');
  const [isSchoolRegOpen, setIsSchoolRegOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reportModalStudent, setReportModalStudent] = useState<Student | null>(null);

  // Synchronize default tab on role switch
  useEffect(() => {
    if (currentUser?.role === 'superAdmin') {
      if (impersonatedSchoolId) {
        setActiveTab('school_dashboard');
      }
    } else if (currentUser?.role === 'teacher') {
      setActiveTab('teacher_portal');
    } else if (currentUser?.role === 'parent') {
      setActiveTab('parent_portal');
    } else if (currentUser?.role === 'student') {
      setActiveTab('student_portal');
    } else if (currentUser?.role === 'accountant') {
      setActiveTab('accountant_portal');
    } else {
      setActiveTab('school_dashboard');
    }
  }, [currentUser?.role, impersonatedSchoolId]);

  // 1. If user is not authenticated, render the compact Login interface exclusively
  if (!currentUser) {
    return (
      <>
        <LoginView onOpenRegister={() => setIsSchoolRegOpen(true)} />
        <SchoolRegistrationModal
          isOpen={isSchoolRegOpen}
          onClose={() => setIsSchoolRegOpen(false)}
        />
      </>
    );
  }

  // 2. If Super Admin is at the platform level (not impersonating a specific school), render dedicated Super Admin Workspace
  if (currentUser.role === 'superAdmin' && !impersonatedSchoolId) {
    return (
      <SuperAdminView 
        onImpersonateSchool={(sId) => {
          impersonateSchool(sId);
          setActiveTab('school_dashboard');
        }} 
      />
    );
  }

  const handleExitImpersonation = () => {
    impersonateSchool(null);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'school_dashboard':
        return <SchoolAdminDashboard onNavigate={setActiveTab} />;

      case 'portals':
        return <SchoolOwnerPortalsView />;

      case 'students':
        return <StudentManagementView onOpenReportModal={setReportModalStudent} />;

      case 'teachers':
        return <TeacherManagementView />;

      case 'classrooms':
        return <ClassroomManagementView />;

      case 'attendance':
        return <AttendanceView />;

      case 'results':
        return <ResultsAndExamsView />;

      case 'reports':
        return <ReportsCenterView />;

      case 'promotions':
        return <PromotionWorkflowView />;

      case 'fees':
        return <FeesManagementView />;

      case 'store':
        return <StoreInventoryView />;

      case 'pos':
        return <POSRegisterView />;

      case 'communications':
        return <CommunicationsView />;

      case 'analytics':
        return <ReportsCenterView />;

      case 'settings':
        return <SchoolSettingsView />;

      case 'teacher_portal':
        return <TeacherPortalView onNavigate={setActiveTab} />;

      case 'parent_portal':
        return <ParentPortalView />;

      case 'student_portal':
        return <StudentPortalView />;

      case 'accountant_portal':
        return <AccountantPortalView onNavigate={setActiveTab} />;

      default:
        return <SchoolAdminDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased selection:bg-teal-700 selection:text-white">
      
      {/* Super Admin Impersonation Banner */}
      {currentUser?.role === 'superAdmin' && impersonatedSchoolId && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-xs flex items-center justify-between text-amber-950 shadow-2xs z-40">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px]">
              SUPER ADMIN PREVIEW
            </span>
            <span>You are viewing <b>{school?.name}</b> live workspace as platform administrator.</span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Return to Super Admin Hub</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header 
        onOpenSchoolRegistration={() => setIsSchoolRegOpen(true)} 
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSchoolRegistration={() => setIsSchoolRegOpen(true)}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Scrollable Workspace View */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-7 pb-24 md:pb-7 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        isMenuOpen={isMobileMenuOpen}
      />

      {/* School Registration Modal */}
      <SchoolRegistrationModal
        isOpen={isSchoolRegOpen}
        onClose={() => setIsSchoolRegOpen(false)}
      />

      {/* Terminal Report Card Modal */}
      {reportModalStudent && (
        <TerminalReportModal
          isOpen={!!reportModalStudent}
          onClose={() => setReportModalStudent(null)}
          student={reportModalStudent}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <MainAppLayout />
      </SchoolProvider>
    </AuthProvider>
  );
}
