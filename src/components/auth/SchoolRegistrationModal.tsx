import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, User, CheckCircle2, ShieldAlert, CreditCard } from 'lucide-react';
import { GhanaFlagBadge } from '../common/EmptyState';
import { SubscriptionPlan } from '../../types';

interface SchoolRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchoolRegistrationModal: React.FC<SchoolRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { registerSchool } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<{ message: string; schoolId?: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: School Info
    schoolName: '',
    motto: '',
    address: '',
    district: 'Ga East Municipal',
    region: 'Greater Accra',
    schoolEmail: '',
    schoolPhone: '',
    logoUrl: '',
    
    // Step 2: Owner Info
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    
    // Step 3: Verification & Plan
    registrationNumber: '',
    subscriptionPlan: 'basic' as SubscriptionPlan,
  });

  const ghanaRegions = [
    'Greater Accra',
    'Ashanti',
    'Central',
    'Eastern',
    'Western',
    'Western North',
    'Volta',
    'Oti',
    'Northern',
    'North East',
    'Savannah',
    'Upper East',
    'Upper West',
    'Bono',
    'Bono East',
    'Ahafo'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await registerSchool(
        {
          name: formData.schoolName,
          motto: formData.motto,
          address: formData.address,
          district: formData.district,
          region: formData.region,
          email: formData.schoolEmail || formData.ownerEmail,
          phone: formData.schoolPhone || formData.ownerPhone,
          logo: formData.logoUrl,
          registrationNumber: formData.registrationNumber || `GES/REG/${Math.floor(10000 + Math.random() * 90000)}`,
          subscriptionPlan: formData.subscriptionPlan,
          planId: `plan_${formData.subscriptionPlan}`,
        },
        {
          name: formData.ownerName,
          email: formData.ownerEmail,
          phone: formData.ownerPhone,
          password: formData.password || 'password123',
        }
      );

      setSuccessResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSuccessResult(null);
    setFormData({
      schoolName: '',
      motto: '',
      address: '',
      district: 'Ga East Municipal',
      region: 'Greater Accra',
      schoolEmail: '',
      schoolPhone: '',
      logoUrl: '',
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      password: '',
      registrationNumber: '',
      subscriptionPlan: 'basic',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Register Institution on SchoolOS"
      subtitle="Complete educational institution onboarding. Submitted for Super Admin verification."
      maxWidth="3xl"
    >
      {successResult ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-900">Registration Submitted Successfully</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {successResult.message}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left max-w-lg mx-auto text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pending Super Admin Verification</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              In accordance with security policies, the school status is currently <span className="font-bold">PENDING</span>. Dashboard access will be enabled once Platform Administration reviews and approves the registration.
            </p>
          </div>

          <div className="pt-3">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              Return to Login Screen
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step Progress Tracker */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-teal-800' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${step >= 1 ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'}`}>1</span>
              <span>Institution Info</span>
            </div>
            <div className="h-0.5 w-12 bg-slate-200" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-teal-800' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${step >= 2 ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>
              <span>Proprietor & Admin</span>
            </div>
            <div className="h-0.5 w-12 bg-slate-200" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 3 ? 'text-teal-800' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${step >= 3 ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'}`}>3</span>
              <span>GES EMIS & Plan</span>
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Institution Details</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official School Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">School Motto / Slogan</label>
                  <input
                    type="text"
                    value={formData.motto}
                    onChange={e => setFormData({ ...formData, motto: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Region (Ghana) *</label>
                  <select
                    value={formData.region}
                    onChange={e => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  >
                    {ghanaRegions.map(r => (
                      <option key={r} value={r}>{r} Region</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District / Municipal Area *</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address / Box *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official School Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.schoolEmail}
                    onChange={e => setFormData({ ...formData, schoolEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official School Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.schoolPhone}
                    onChange={e => setFormData({ ...formData, schoolPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  disabled={!formData.schoolName || !formData.address}
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Continue to Owner Information →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <User className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Proprietor / Administrator Account</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proprietor / Head Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proprietor Email (Account Username) *</label>
                  <input
                    type="email"
                    required
                    value={formData.ownerEmail}
                    onChange={e => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formData.ownerPhone}
                    onChange={e => setFormData({ ...formData, ownerPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!formData.ownerName || !formData.ownerEmail || !formData.password}
                  onClick={() => setStep(3)}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Continue to Accreditation & Plan →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">GES Accreditation & Subscription Plan</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GES EMIS Code / Certificate Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Subscription Tier</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className={`p-3 border rounded-xl cursor-pointer flex flex-col justify-between ${formData.subscriptionPlan === 'basic' ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <input
                        type="radio"
                        name="plan"
                        value="basic"
                        checked={formData.subscriptionPlan === 'basic'}
                        onChange={() => setFormData({ ...formData, subscriptionPlan: 'basic' })}
                        className="sr-only"
                      />
                      <div>
                        <div className="text-xs font-bold">Basic Tier</div>
                        <div className="text-[10px] text-slate-500">Up to 250 Students</div>
                      </div>
                      <div className="text-xs font-bold text-teal-800 mt-2">GH₵ 350 / term</div>
                    </label>

                    <label className={`p-3 border rounded-xl cursor-pointer flex flex-col justify-between ${formData.subscriptionPlan === 'standard' ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <input
                        type="radio"
                        name="plan"
                        value="standard"
                        checked={formData.subscriptionPlan === 'standard'}
                        onChange={() => setFormData({ ...formData, subscriptionPlan: 'standard' })}
                        className="sr-only"
                      />
                      <div>
                        <div className="text-xs font-bold">Standard Tier</div>
                        <div className="text-[10px] text-slate-500">Up to 600 Students</div>
                      </div>
                      <div className="text-xs font-bold text-teal-800 mt-2">GH₵ 550 / term</div>
                    </label>

                    <label className={`p-3 border rounded-xl cursor-pointer flex flex-col justify-between ${formData.subscriptionPlan === 'premium' ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <input
                        type="radio"
                        name="plan"
                        value="premium"
                        checked={formData.subscriptionPlan === 'premium'}
                        onChange={() => setFormData({ ...formData, subscriptionPlan: 'premium' })}
                        className="sr-only"
                      />
                      <div>
                        <div className="text-xs font-bold">Premium Tier</div>
                        <div className="text-[10px] text-slate-500">Up to 2,500 Students</div>
                      </div>
                      <div className="text-xs font-bold text-teal-800 mt-2">GH₵ 850 / term</div>
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <GhanaFlagBadge size="sm" />
                    <span>Includes Complete GES Curriculum Setup:</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Standard 30% Continuous Assessment + 70% Terminal Examination auto-grading, student billing in GH₵, SMS broadcast gateway, and point-of-sale inventory.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Submit School Registration</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
};
