import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  RotateCcw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Server,
  Layers,
  Sparkles,
  ShieldAlert,
  Radio,
  Key,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';

interface SuperAdminSystemSettingsProps {
  onNavigateToCommAPI?: () => void;
}

export const SuperAdminSystemSettings: React.FC<SuperAdminSystemSettingsProps> = ({ onNavigateToCommAPI }) => {
  const { allSchools, resetDemoData, settings, updateSettings, platformCommunication } = useSchool();
  const [platformName, setPlatformName] = useState('SchoolOS Online');
  const [supportPhone, setSupportPhone] = useState('+233 20 000 0001');
  const [supportEmail, setSupportEmail] = useState('support@schoolos.online');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExecuteReset = () => {
    resetDemoData();
    setShowResetConfirm(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportData = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      schoolsCount: allSchools.length,
      platform: 'SchoolOS Online v2.4 Enterprise'
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schoolos-platform-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">System Settings & Platform Parameters</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure global platform variables, centralized communication endpoints, and database maintenance tools.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Database Snapshot</span>
        </button>
      </div>

      {/* Communications API Quick Link Banner */}
      <div className="bg-linear-to-r from-teal-950 to-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-teal-800/80 border border-teal-600 rounded-xl text-teal-300">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">Central Communications API Gateway</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                platformCommunication?.sms?.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
              }`}>
                {platformCommunication?.sms?.isActive ? 'ACTIVE' : 'CONFIG REQUIRED'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Provider: <span className="font-mono text-teal-300 capitalize">{platformCommunication?.sms?.provider || 'arkesel'}</span> | WhatsApp: <span className="font-mono text-teal-300 capitalize">{platformCommunication?.whatsapp?.provider || 'meta'}</span>
            </p>
          </div>
        </div>

        {onNavigateToCommAPI && (
          <button
            type="button"
            onClick={onNavigateToCommAPI}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Manage API Credentials</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Platform system settings saved successfully.</span>
        </div>
      )}

      {/* 2 Columns: Settings Form & Database Reset Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSaveSystem} className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Platform Global Parameters</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block font-bold text-slate-900">Platform Brand Name</label>
              <input
                type="text"
                required
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-900">Platform Support Email</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-900">Platform Helpline Phone</label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <div className="font-bold text-slate-900">System Maintenance Mode</div>
              <div className="text-[11px] text-slate-500">Temporarily restrict school portal access during migrations.</div>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-4 h-4 text-teal-700 rounded focus:ring-teal-600 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Save System Parameters
            </button>
          </div>
        </form>

        {/* Right 1 Col: Clean Database Diagnostics */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Database State
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600">Registered Institutions:</span>
                <span className="font-mono font-bold text-slate-900">{allSchools.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600">Database Engine:</span>
                <span className="font-mono font-bold text-teal-800">Clean State (Zero Mock)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600">Tenancy Isolation:</span>
                <span className="font-mono font-bold text-emerald-700">Enforced</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-700" />
                <span>Reset Database to Clean State</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl text-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Confirm Clean Database Reset</h4>
              <p className="text-slate-600 mt-1 leading-relaxed">
                This operation resets all registered schools, students, and transaction records to zero clean state. Only the root Super Admin account (<b>su@admin</b>) will be retained.
              </p>
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReset}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
