import React, { useState, useRef, useEffect } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  Building2, 
  Save, 
  CheckCircle2, 
  Calendar, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  FileText, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  FileSpreadsheet,
  Sliders,
  Percent,
  Calculator,
  Award,
  X,
  AlertTriangle,
  CreditCard,
  Layers
} from 'lucide-react';
import { uploadSchoolLogo, deleteSchoolLogoFile } from '../../lib/imageStorage';
import { SchoolSubscriptionPaymentView } from './SchoolSubscriptionPaymentView';

export const SchoolSettingsView: React.FC = () => {
  const { school, updateSchoolInfo } = useSchool();
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'billing'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: school?.name || '',
    shortCode: school?.shortCode || '',
    motto: school?.motto || '',
    address: school?.address || '',
    district: school?.district || '',
    region: school?.region || '',
    phone: school?.phone || '',
    email: school?.email || '',
    website: school?.website || '',
    registrationNumber: school?.registrationNumber || '',
    currentAcademicYear: school?.currentAcademicYear || '2026/2027',
    currentTerm: school?.currentTerm || 'Term 3',
    currency: school?.currency || 'GHS',
    logo: school?.logo || '',
    sbaMaxScore: school?.sbaMaxScore ?? 30,
    examMaxScore: school?.examMaxScore ?? 70,
    assessmentRatio: school?.assessmentRatio || '30/70',
    // Official Payment Channels
    bankName: school?.bankName || '',
    bankAccountNumber: school?.bankAccountNumber || '',
    bankAccountName: school?.bankAccountName || '',
    bankBranch: school?.bankBranch || '',
    momoProvider: school?.momoProvider || 'MTN Mobile Money',
    momoNumber: school?.momoNumber || '',
    momoAccountName: school?.momoAccountName || '',
    paymentInstructions: school?.paymentInstructions || '',
    // Institutional Leadership
    principalName: school?.principalName || '',
    principalTitle: school?.principalTitle || 'Head of Institution',
    principalPhone: school?.principalPhone || '',
  });

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || '',
        shortCode: school.shortCode || '',
        motto: school.motto || '',
        address: school.address || '',
        district: school.district || '',
        region: school.region || '',
        phone: school.phone || '',
        email: school.email || '',
        website: school.website || '',
        registrationNumber: school.registrationNumber || '',
        currentAcademicYear: school.currentAcademicYear || '2026/2027',
        currentTerm: school.currentTerm || 'Term 3',
        currency: school.currency || 'GHS',
        logo: school.logo || '',
        sbaMaxScore: school.sbaMaxScore ?? 30,
        examMaxScore: school.examMaxScore ?? 70,
        assessmentRatio: school.assessmentRatio || '30/70',
        bankName: school.bankName || '',
        bankAccountNumber: school.bankAccountNumber || '',
        bankAccountName: school.bankAccountName || '',
        bankBranch: school.bankBranch || '',
        momoProvider: school.momoProvider || 'MTN Mobile Money',
        momoNumber: school.momoNumber || '',
        momoAccountName: school.momoAccountName || '',
        paymentInstructions: school.paymentInstructions || '',
        principalName: school.principalName || '',
        principalTitle: school.principalTitle || 'Head of Institution',
        principalPhone: school.principalPhone || '',
      });
    }
  }, [school]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !school || isUploadingLogo) return;

    // Validate size (under 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit. Please select a smaller image.');
      return;
    }

    setIsUploadingLogo(true);
    setUploadProgress(15);
    setUploadError(null);

    try {
      // 1. Upload & compress logo quickly
      const logoUrl = await uploadSchoolLogo(school.id, file, (percent) => {
        setUploadProgress(percent);
      });
      
      // 2. Immediately update local form state and persist to database & Firestore
      setFormData(prev => ({ ...prev, logo: logoUrl }));
      await updateSchoolInfo({ logo: logoUrl });
      
      setUploadProgress(100);
      showToast('School logo updated and synchronized successfully!');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setUploadError(err?.message || 'Failed to update school logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmRemoveLogo = async () => {
    if (!school) return;
    setIsRemovingLogo(true);
    const previousLogo = formData.logo || school.logo;

    try {
      // 1. Clear local form state
      setFormData(prev => ({ ...prev, logo: '' }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 2. Authoritatively persist empty logo to context state & Firestore
      await updateSchoolInfo({ logo: '' });

      // 3. Clean up storage asset if stored in Firebase Storage
      if (previousLogo) {
        await deleteSchoolLogoFile(previousLogo);
      }

      setShowRemoveConfirmModal(false);
      showToast('School logo removed successfully. Initials badge is now active.');
    } catch (err: any) {
      console.error('Failed to remove school logo:', err);
      setUploadError('Failed to remove school logo. Please try again.');
    } finally {
      setIsRemovingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSchoolInfo(formData);
    setIsSaving(false);
    setSaveSuccess(true);
    showToast('School configuration saved and synced to Firebase!');
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Configuration &amp; Subscriptions</h1>
            <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-mono font-bold uppercase">
              {school?.shortCode || 'SCH'} Settings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school profile, upload institutional crest/logo, manage academic sessions, and renew termly subscriptions with Paystack.
          </p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" /> All Changes Synced to Firebase!
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Institutional Profile &amp; Crest</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'billing'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Paystack Subscription &amp; Billing</span>
        </button>
      </div>

      {activeTab === 'billing' ? (
        <SchoolSubscriptionPaymentView />
      ) : (
        <>
      {/* Logo & Branding Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Official School Crest / Logo</h3>
              <p className="text-[11px] text-slate-400">Stored authoritatively in Firebase and displayed across reports, receipts, and portal headers</p>
            </div>
          </div>
          {formData.logo && (
            <button
              type="button"
              onClick={() => setShowRemoveConfirmModal(true)}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Logo</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          {/* Logo Display Box */}
          <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-2 relative overflow-hidden shrink-0 group shadow-2xs">
            {formData.logo ? (
              <img 
                src={formData.logo} 
                alt={formData.name || 'School Logo'} 
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="text-center p-2">
                <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-base mx-auto mb-1.5 shadow-xs">
                  {formData.shortCode || (formData.name ? formData.name.slice(0, 3).toUpperCase() : 'SCH')}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">No Logo Uploaded</span>
              </div>
            )}

            {isUploadingLogo && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-3 text-center z-10">
                <RefreshCw className="w-6 h-6 text-teal-700 animate-spin" />
                <span className="text-xs font-bold text-teal-950">Uploading Crest...</span>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-teal-700 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="space-y-3 flex-1">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Upload School Logo</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                Upload a high-resolution PNG, JPG, or SVG image file (max 5MB). The uploaded crest will immediately appear in the top navigation header, terminal report cards, and fee receipts.
              </p>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
                id="school-logo-input"
              />
              <label
                htmlFor="school-logo-input"
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{formData.logo ? 'Change School Logo' : 'Upload School Crest'}</span>
              </label>

              {formData.logo && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRemoveConfirmModal(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>

                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Check className="w-3 h-3" /> Live Synced to Firestore
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Remove Logo Confirmation Modal */}
      {showRemoveConfirmModal && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !isRemovingLogo && setShowRemoveConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-150 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Remove School Crest?</h3>
                  <p className="text-xs text-slate-500">This will remove the current institutional logo.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isRemovingLogo && setShowRemoveConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Are you sure you want to remove the school logo? The school initials badge (<span className="font-mono font-bold text-teal-800">{formData.shortCode || 'SCH'}</span>) will be displayed on all navigation headers, terminal report cards, and official fee receipts instead.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRemovingLogo}
                onClick={() => setShowRemoveConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isRemovingLogo}
                onClick={handleConfirmRemoveLogo}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isRemovingLogo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isRemovingLogo ? 'Removing...' : 'Yes, Remove Logo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Section 1: Institution Biodata */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Institutional Identity & Contact Info</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official School Name *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Short Code / Acronym *</label>
              <input
                type="text"
                required
                value={formData.shortCode || ''}
                onChange={e => setFormData({ ...formData, shortCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">School Motto / Slogan</label>
              <input
                type="text"
                value={formData.motto || ''}
                onChange={e => setFormData({ ...formData, motto: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GES Registration / Accreditation ID</label>
              <input
                type="text"
                value={formData.registrationNumber || ''}
                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District / Municipality</label>
              <input
                type="text"
                value={formData.district || ''}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Region (Ghana)</label>
              <input
                type="text"
                value={formData.region || ''}
                onChange={e => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Postal Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official School Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone (Ghana)</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Website</label>
              <input
                type="text"
                placeholder="https://yourschool.edu.gh"
                value={formData.website || ''}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Institutional Leadership & Administration */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Award className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Institutional Leadership &amp; Endorsement Authority</h3>
          </div>
          <p className="text-xs text-slate-500">
            Official details for the head of institution. Displayed on student terminal progress reports, transcripts, and formal documentation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Principal / Headteacher Full Name</label>
              <input
                type="text"
                placeholder="e.g., Dr. Kwame Mensah"
                value={formData.principalName || ''}
                onChange={e => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Title</label>
              <select
                value={formData.principalTitle || 'Head of Institution'}
                onChange={e => setFormData({ ...formData, principalTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                <option value="Headteacher">Headteacher</option>
                <option value="Principal">Principal</option>
                <option value="Headmaster">Headmaster</option>
                <option value="Headmistress">Headmistress</option>
                <option value="Head of Institution">Head of Institution</option>
                <option value="Rector">Rector</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Principal Official Contact Phone</label>
              <input
                type="tel"
                placeholder="e.g., +233 24 123 4567"
                value={formData.principalPhone || ''}
                onChange={e => setFormData({ ...formData, principalPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Official Payment Channels (Bank & Mobile Money) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Official School Payment Channels (Bank &amp; Mobile Money)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Official account information where parents and guardians are authorized to deposit or transfer student fees. Never auto-generated; displayed only when explicitly saved here.
          </p>

          {/* Bank Details */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Official Bank Account Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g., GCB Bank, Ecobank, Stanbic"
                  value={formData.bankName || ''}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="Official Account Name"
                  value={formData.bankAccountName || ''}
                  onChange={e => setFormData({ ...formData, bankAccountName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="e.g., 1081130092812"
                  value={formData.bankAccountNumber || ''}
                  onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bank Branch</label>
                <input
                  type="text"
                  placeholder="e.g., Main Branch / Ring Road"
                  value={formData.bankBranch || ''}
                  onChange={e => setFormData({ ...formData, bankBranch: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Mobile Money Details */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Official Mobile Money Account Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Money Provider</label>
                <select
                  value={formData.momoProvider || 'MTN Mobile Money'}
                  onChange={e => setFormData({ ...formData, momoProvider: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money</option>
                  <option value="Telecel Cash">Telecel Cash</option>
                  <option value="AT Money">AT Money (AirtelTigo)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">MoMo Merchant / Wallet Number</label>
                <input
                  type="text"
                  placeholder="e.g., 0244123456"
                  value={formData.momoNumber || ''}
                  onChange={e => setFormData({ ...formData, momoNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">MoMo Registered Account Name</label>
                <input
                  type="text"
                  placeholder="Official Merchant / Wallet Name"
                  value={formData.momoAccountName || ''}
                  onChange={e => setFormData({ ...formData, momoAccountName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Official Fee Settlement Instructions</label>
              <textarea
                rows={2}
                placeholder="e.g., Please enter student full name or admission number as reference. Retain SMS confirmation receipt."
                value={formData.paymentInstructions || ''}
                onChange={e => setFormData({ ...formData, paymentInstructions: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Active Session */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Active Academic Session & Term Cycles</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Academic Year</label>
              <input
                type="text"
                value={formData.currentAcademicYear || '2026/2027'}
                onChange={e => setFormData({ ...formData, currentAcademicYear: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold font-mono border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Academic Term</label>
              <select
                value={formData.currentTerm || 'Term 3'}
                onChange={e => setFormData({ ...formData, currentTerm: e.target.value as any })}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3 (Promotional)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Currency</label>
              <select
                value={formData.currency || 'GHS'}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold font-mono border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                <option value="GHS">GHS (Ghanaian Cedi - ₵)</option>
                <option value="USD">USD (US Dollar - $)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Continuous Assessment (SBA) & Exam Scoring Ratio */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">Continuous Assessment (SBA) & Examination Model</h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg">
              Active: {formData.sbaMaxScore}/{formData.examMaxScore} Total
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Configure the maximum points allocated to Class Continuous Assessment (SBA) versus Terminal Examination. 
            All teacher score sheets, grade computations, and GES terminal reports automatically adapt to this ratio.
          </p>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            {[
              { id: '30/70', label: '30 / 70', sub: 'GES Standard', sba: 30, exam: 70 },
              { id: '50/50', label: '50 / 50', sub: 'Equal Weight', sba: 50, exam: 50 },
              { id: '40/60', label: '40 / 60', sub: 'Continuous Focus', sba: 40, exam: 60 },
              { id: '30/50', label: '30 / 50', sub: 'Total 80 Marks', sba: 30, exam: 50 },
              { id: '20/80', label: '20 / 80', sub: 'Exam Heavy', sba: 20, exam: 80 },
              { id: 'custom', label: 'Custom', sub: 'User Defined', sba: formData.sbaMaxScore, exam: formData.examMaxScore },
            ].map(preset => {
              const isSelected = preset.id === 'custom' 
                ? formData.assessmentRatio === 'custom' || (!['30/70', '50/50', '40/60', '30/50', '20/80'].includes(`${formData.sbaMaxScore}/${formData.examMaxScore}`))
                : formData.sbaMaxScore === preset.sba && formData.examMaxScore === preset.exam;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (preset.id !== 'custom') {
                      setFormData(prev => ({
                        ...prev,
                        sbaMaxScore: preset.sba,
                        examMaxScore: preset.exam,
                        assessmentRatio: preset.id,
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        assessmentRatio: 'custom',
                      }));
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`text-xs font-black font-mono ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>
                    {preset.label}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{preset.sub}</div>
                </button>
              );
            })}
          </div>

          {/* Custom / Adjustable Number Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Class Score / SBA Max</label>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">Continuous</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.sbaMaxScore}
                  onChange={e => {
                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                    setFormData(prev => ({ ...prev, sbaMaxScore: val, assessmentRatio: 'custom' }));
                  }}
                  className="w-full px-3 py-2 text-sm font-mono font-black border border-slate-200 bg-slate-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">marks</span>
              </div>
              <p className="text-[10px] text-slate-400">Class tests, projects, homework & quizzes</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Terminal Exam Max</label>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Examination</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.examMaxScore}
                  onChange={e => {
                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                    setFormData(prev => ({ ...prev, examMaxScore: val, assessmentRatio: 'custom' }));
                  }}
                  className="w-full px-3 py-2 text-sm font-mono font-black border border-slate-200 bg-slate-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">marks</span>
              </div>
              <p className="text-[10px] text-slate-400">End of term exam question paper marks</p>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Combined Maximum</label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Auto Calculated</span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {(formData.sbaMaxScore || 0) + (formData.examMaxScore || 0)} <span className="text-xs font-normal text-slate-500">marks</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-teal-600 h-full"
                  style={{ 
                    width: `${Math.round(((formData.sbaMaxScore || 0) / Math.max(1, (formData.sbaMaxScore || 0) + (formData.examMaxScore || 0))) * 100)}%` 
                  }}
                  title={`SBA: ${formData.sbaMaxScore}`}
                />
                <div 
                  className="bg-blue-600 h-full"
                  style={{ 
                    width: `${Math.round(((formData.examMaxScore || 0) / Math.max(1, (formData.sbaMaxScore || 0) + (formData.examMaxScore || 0))) * 100)}%` 
                  }}
                  title={`Exam: ${formData.examMaxScore}`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-medium text-slate-500">
                <span>SBA: {Math.round(((formData.sbaMaxScore || 0) / Math.max(1, (formData.sbaMaxScore || 0) + (formData.examMaxScore || 0))) * 100)}%</span>
                <span>Exam: {Math.round(((formData.examMaxScore || 0) / Math.max(1, (formData.sbaMaxScore || 0) + (formData.examMaxScore || 0))) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to Firebase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save School Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
      </>
      )}
    </div>
  );
};
