import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SchoolOSLogo } from '../common/SchoolOSLogo';
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Clock, 
  Eye, 
  EyeOff
} from 'lucide-react';

interface LoginViewProps {
  onOpenRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onOpenRegister }) => {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<{ 
    type: 'PENDING' | 'REJECTED' | 'SUSPENDED' | 'INVALID'; 
    message: string; 
    schoolName?: string 
  } | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) return;

    setIsLoading(true);
    setAuthError(null);
    setShowForgotNotice(false);

    setTimeout(() => {
      const result = login(emailOrUsername.trim(), password);
      setIsLoading(false);
      if (!result.success) {
        setAuthError({
          type: result.error || 'INVALID',
          message: result.message || 'Invalid credentials. Please try again.',
          schoolName: result.schoolName
        });
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-slate-800">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <SchoolOSLogo size="xl" roundedClassName="rounded-2xl" className="mx-auto shadow-md" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SchoolOS</h1>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Online Education Cloud</p>
          </div>
        </div>

        {/* Status Error / Pending Alert Banner */}
        {authError && (
          <div 
            className={`p-4 rounded-xl border text-xs leading-relaxed ${
              authError.type === 'PENDING' 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : authError.type === 'REJECTED'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : authError.type === 'SUSPENDED'
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {authError.type === 'PENDING' ? (
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-slate-900">
                  {authError.type === 'PENDING' && 'Registration Awaiting Approval'}
                  {authError.type === 'REJECTED' && 'Registration Declined'}
                  {authError.type === 'SUSPENDED' && 'Account Suspended'}
                  {authError.type === 'INVALID' && 'Authentication Failed'}
                </div>
                <p className="text-slate-700">{authError.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Forgot Password Notice */}
        {showForgotNotice && (
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/80 text-xs text-teal-900 leading-relaxed">
            <p className="font-semibold text-slate-900 mb-1">Reset Password</p>
            <p className="text-slate-700">
              Please contact your school administrator or system platform support to initiate a secure credential reset for your account.
            </p>
          </div>
        )}

        {/* Compact Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm shadow-slate-200/60 space-y-5">
          <div className="text-center pb-1">
            <h2 className="text-base font-bold text-slate-900">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to access your portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Email / Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-teal-800/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowForgotNotice(!showForgotNotice)}
              className="text-xs text-slate-500 hover:text-teal-700 font-medium cursor-pointer transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>© {new Date().getFullYear()} SchoolOS Online</p>
        </div>

      </div>
    </div>
  );
};
