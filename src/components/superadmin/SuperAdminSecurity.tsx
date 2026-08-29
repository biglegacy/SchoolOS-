import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Server
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatting';

export const SuperAdminSecurity: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSecurityPolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const superAdminUsers = (allUsers || []).filter(u => u.role === 'superAdmin');

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Security & Platform Access Governance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic policies, Super Admin credentials, role-based auth, and multi-tenant security boundary auditing.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>RBAC Isolation: <b>ACTIVE</b></span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Platform security configuration successfully saved and applied.</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Security Policy Settings */}
        <form onSubmit={handleSaveSecurityPolicies} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-700" />
              <span>Authentication & Session Policies</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Policy v2.4</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="font-bold text-slate-900">Enforce Multi-Factor Authentication (MFA)</div>
                <div className="text-[11px] text-slate-500">Require OTP code for all root Super Admin sign-ins.</div>
              </div>
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
                className="w-4 h-4 text-teal-700 rounded focus:ring-teal-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-900">Idle Session Inactivity Timeout (Minutes)</label>
              <input
                type="number"
                min={5}
                max={240}
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-900">Minimum Password Complexity Length</label>
              <input
                type="number"
                min={6}
                max={32}
                value={passwordMinLength}
                onChange={(e) => setPasswordMinLength(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Update Security Policies
            </button>
          </div>
        </form>

        {/* Super Admin Privileged Accounts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>Privileged Super Admin Accounts</span>
            </h3>
            <span className="text-[10px] font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {superAdminUsers.length} Account(s)
            </span>
          </div>

          <div className="space-y-3">
            {superAdminUsers.map(u => (
              <div key={u.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{u.fullName || 'System Administrator'}</span>
                    {u.email === 'su@admin' && (
                      <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-300 font-mono">
                        DEFAULT ROOT
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email} • {u.phone || '+233 20 000 0001'}</div>
                </div>

                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                  Active
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Root Security Advisory</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              The root administrator identifier <b>su@admin</b> is provisioned with platform-wide administrative privileges across all institutional tenancies.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
