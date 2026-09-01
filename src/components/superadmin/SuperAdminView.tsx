import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { School, SubscriptionTier, PlatformCommunicationSettings, FeatureKey } from '../../types';
import { SuperAdminLayout, SuperAdminNavId } from './SuperAdminLayout';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { SuperAdminSchools } from './SuperAdminSchools';
import { SuperAdminPortals } from './SuperAdminPortals';
import { SuperAdminPlans } from './SuperAdminPlans';
import { SuperAdminSubscriptions } from './SuperAdminSubscriptions';
import { SuperAdminBilling } from './SuperAdminBilling';
import { SuperAdminFeatures } from './SuperAdminFeatures';
import { SuperAdminBroadcastSMS } from './SuperAdminBroadcastSMS';
import { SuperAdminBroadcastWhatsApp } from './SuperAdminBroadcastWhatsApp';
import { SuperAdminNotifications } from './SuperAdminNotifications';
import { SuperAdminAudit } from './SuperAdminAudit';
import { SuperAdminPlatformReports } from './SuperAdminPlatformReports';
import { SuperAdminSecurity } from './SuperAdminSecurity';
import { SuperAdminProfile } from './SuperAdminProfile';
import { SuperAdminSystemSettings } from './SuperAdminSystemSettings';
import { SuperAdminCommunicationAPI } from './SuperAdminCommunicationAPI';
import { SuperAdminPaystackSettings } from './SuperAdminPaystackSettings';
import { SchoolRegistrationModal } from '../auth/SchoolRegistrationModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SuperAdminViewProps {
  onImpersonateSchool?: (schoolId: string) => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onImpersonateSchool }) => {
  const { 
    allSchools, 
    auditLogs, 
    plans,
    approveSchool, 
    rejectSchool, 
    suspendSchool, 
    updateAnySchool,
    createPlan, 
    updatePlan, 
    deletePlan, 
    setSchoolFeatureOverride, 
    assignSchoolPlan,
    platformCommunication,
    updatePlatformCommunication
  } = useSchool();

  const [activeNav, setActiveNav] = useState<SuperAdminNavId>('overview_dashboard');
  const [selectedSchoolForOverride, setSelectedSchoolForOverride] = useState<School | null>(null);
  const [isRegisterSchoolOpen, setIsRegisterSchoolOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const pendingSchoolsCount = (allSchools || []).filter(s => s.status === 'pending').length;

  const handleApproveSchool = async (schoolId: string) => {
    const sc = allSchools.find(s => s.id === schoolId);
    await approveSchool(schoolId);
    showNotification(`Approved and activated "${sc?.name || 'School'}".`);
  };

  const handleRejectSchool = async (schoolId: string) => {
    const sc = allSchools.find(s => s.id === schoolId);
    await rejectSchool(schoolId);
    showNotification(`Declined registration for "${sc?.name || 'School'}".`);
  };

  const handleSuspendSchool = async (schoolId: string) => {
    const sc = allSchools.find(s => s.id === schoolId);
    await suspendSchool(schoolId);
    showNotification(`Updated operational access for "${sc?.name || 'School'}".`);
  };

  const handleUpdateSchool = async (schoolId: string, data: Partial<School>) => {
    const sc = allSchools.find(s => s.id === schoolId);
    await updateAnySchool(schoolId, data);
    showNotification(`Updated institutional record for "${sc?.name || 'School'}".`);
  };

  const handleAssignPlan = async (schoolId: string, planId: string) => {
    const sc = allSchools.find(s => s.id === schoolId);
    const pl = plans.find(p => p.id === planId);
    await assignSchoolPlan(schoolId, planId);
    showNotification(`Assigned "${pl?.name || 'Plan'}" to "${sc?.name || 'School'}".`);
  };

  const handleSavePlan = async (plan: SubscriptionTier) => {
    const exists = plans.some(p => p.id === plan.id);
    if (exists) {
      await updatePlan(plan.id, plan);
      showNotification(`Updated plan "${plan.name}".`);
    } else {
      await createPlan(plan);
      showNotification(`Created new subscription tier "${plan.name}".`);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    await deletePlan(planId);
    showNotification('Subscription plan deleted.');
  };

  const handleSaveOverrides = async (schoolId: string, overrides: Record<string, boolean>) => {
    const sc = allSchools.find(s => s.id === schoolId);
    for (const [featureKey, value] of Object.entries(overrides)) {
      await setSchoolFeatureOverride(schoolId, featureKey as any, value);
    }
    showNotification(`Custom feature overrides saved for "${sc?.name || 'School'}".`);
  };

  const handleToggleSchoolFeature = async (schoolId: string, feature: FeatureKey, value: boolean | undefined) => {
    const sc = allSchools.find(s => s.id === schoolId);
    await setSchoolFeatureOverride(schoolId, feature, value);
    showNotification(`Updated ${feature.replace('_', ' ')} status for "${sc?.name || 'School'}".`);
  };

  const handleSaveCommunication = async (settings: PlatformCommunicationSettings) => {
    await updatePlatformCommunication(settings);
    showNotification('Platform communication gateway settings updated successfully.');
  };

  const handleOpenOverrides = (school: School) => {
    setSelectedSchoolForOverride(school);
    setActiveNav('services_overrides');
  };

  const handleImpersonate = (schoolId: string) => {
    if (onImpersonateSchool) {
      onImpersonateSchool(schoolId);
    }
  };

  return (
    <SuperAdminLayout
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      pendingSchoolsCount={pendingSchoolsCount}
    >
      {/* Toast Notification */}
      {notification && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xs transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* OVERVIEW DASHBOARD */}
      {activeNav === 'overview_dashboard' && (
        <SuperAdminDashboard
          schools={allSchools}
          plans={plans}
          auditLogs={auditLogs}
          onNavigate={(nav: any) => {
            if (nav === 'schools_pending') setActiveNav('schools_pending');
            else if (nav === 'plans') setActiveNav('sub_plans');
            else if (nav === 'features') setActiveNav('services_features');
            else if (nav === 'portals') setActiveNav('services_portals');
            else if (nav === 'sms') setActiveNav('comm_sms');
            else if (nav === 'whatsapp') setActiveNav('comm_whatsapp');
            else if (nav === 'audit') setActiveNav('platform_audit');
            else setActiveNav('schools_all');
          }}
          onApproveSchool={(sc) => handleApproveSchool(sc.id)}
          onRejectSchool={(sc) => handleRejectSchool(sc.id)}
          onReviewSchool={(sc) => {
            setActiveNav('schools_all');
          }}
          onImpersonateSchool={handleImpersonate}
          onOpenSchoolRegistration={() => setIsRegisterSchoolOpen(true)}
        />
      )}

      {/* SCHOOL MANAGEMENT VIEWS */}
      {(activeNav === 'schools_all' || activeNav === 'schools_pending' || activeNav === 'schools_active' || activeNav === 'schools_suspended') && (
        <SuperAdminSchools
          schools={allSchools}
          plans={plans}
          initialFilter={
            activeNav === 'schools_pending' ? 'pending' :
            activeNav === 'schools_active' ? 'active' :
            activeNav === 'schools_suspended' ? 'suspended' : 'all'
          }
          onApproveSchool={handleApproveSchool}
          onRejectSchool={handleRejectSchool}
          onSuspendSchool={handleSuspendSchool}
          onUpdateSchool={handleUpdateSchool}
          onAssignPlan={handleAssignPlan}
          onImpersonateSchool={handleImpersonate}
          onOpenOverrides={handleOpenOverrides}
          onOpenSchoolRegistration={() => setIsRegisterSchoolOpen(true)}
        />
      )}

      {/* SCHOOL SERVICES: SCHOOL PORTALS */}
      {activeNav === 'services_portals' && (
        <SuperAdminPortals
          schools={allSchools}
          plans={plans}
          onToggleSchoolFeature={handleToggleSchoolFeature}
          onOpenOverrides={handleOpenOverrides}
        />
      )}

      {/* SCHOOL SERVICES: FEATURE MANAGEMENT */}
      {activeNav === 'services_features' && (
        <SuperAdminFeatures
          schools={allSchools}
          plans={plans}
          initialTab="matrix"
          selectedSchoolForOverride={selectedSchoolForOverride}
          onSaveOverrides={handleSaveOverrides}
        />
      )}

      {/* SCHOOL SERVICES: SCHOOL FEATURE OVERRIDES */}
      {activeNav === 'services_overrides' && (
        <SuperAdminFeatures
          schools={allSchools}
          plans={plans}
          initialTab="overrides"
          selectedSchoolForOverride={selectedSchoolForOverride}
          onSaveOverrides={handleSaveOverrides}
        />
      )}

      {/* SUBSCRIPTIONS: PLANS */}
      {activeNav === 'sub_plans' && (
        <SuperAdminPlans
          plans={plans}
          onSavePlan={handleSavePlan}
          onDeletePlan={handleDeletePlan}
        />
      )}

      {/* SUBSCRIPTIONS: SUBSCRIPTIONS OVERVIEW */}
      {activeNav === 'sub_subscriptions' && (
        <SuperAdminSubscriptions
          schools={allSchools}
          plans={plans}
          onAssignPlan={handleAssignPlan}
          onImpersonateSchool={handleImpersonate}
          onOpenOverrides={handleOpenOverrides}
        />
      )}

      {/* SUBSCRIPTIONS: BILLING & PAYSTACK REVENUE */}
      {activeNav === 'sub_billing' && (
        <SuperAdminPaystackSettings />
      )}

      {/* COMMUNICATION & SETTINGS: CENTRAL COMMUNICATIONS API */}
      {(activeNav === 'comm_api' || activeNav === 'settings_comm_api') && (
        <SuperAdminCommunicationAPI
          initialSettings={platformCommunication}
          onSaveCommunication={handleSaveCommunication}
        />
      )}

      {/* COMMUNICATION: BROADCAST SMS */}
      {activeNav === 'comm_sms' && (
        <SuperAdminBroadcastSMS
          schools={allSchools}
          communicationSettings={platformCommunication}
          onSendBroadcast={async ({ recipientGroup, message, senderId }) => {
            showNotification(`SMS broadcast sent to ${recipientGroup.replace('_', ' ')}.`);
          }}
        />
      )}

      {/* COMMUNICATION: BROADCAST WHATSAPP */}
      {activeNav === 'comm_whatsapp' && (
        <SuperAdminBroadcastWhatsApp
          schools={allSchools}
          communicationSettings={platformCommunication}
          onSendBroadcast={async ({ recipientGroup, message, template }) => {
            showNotification(`WhatsApp broadcast dispatched to ${recipientGroup.replace('_', ' ')}.`);
          }}
        />
      )}

      {/* COMMUNICATION: PLATFORM NOTIFICATIONS */}
      {activeNav === 'comm_notifications' && (
        <SuperAdminNotifications
          schools={allSchools}
        />
      )}

      {/* PLATFORM: REPORTS */}
      {activeNav === 'platform_reports' && (
        <SuperAdminPlatformReports
          schools={allSchools}
          plans={plans}
          auditLogs={auditLogs}
        />
      )}

      {/* PLATFORM: AUDIT LOGS / ACTIVITY */}
      {(activeNav === 'platform_audit' || activeNav === 'platform_activity') && (
        <SuperAdminAudit auditLogs={auditLogs} />
      )}

      {/* SYSTEM: SETTINGS */}
      {activeNav === 'system_settings' && (
        <SuperAdminSystemSettings onNavigateToCommAPI={() => setActiveNav('settings_comm_api')} />
      )}

      {/* SYSTEM: SECURITY */}
      {activeNav === 'system_security' && (
        <SuperAdminSecurity />
      )}

      {/* SYSTEM: ADMINISTRATOR PROFILE */}
      {activeNav === 'system_profile' && (
        <SuperAdminProfile />
      )}

      {/* Super Admin School Registration Modal */}
      <SchoolRegistrationModal
        isOpen={isRegisterSchoolOpen}
        onClose={() => setIsRegisterSchoolOpen(false)}
      />

    </SuperAdminLayout>
  );
};
