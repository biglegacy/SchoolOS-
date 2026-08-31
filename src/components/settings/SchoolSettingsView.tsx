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
  Award
} from 'lucide-react';
import { uploadSchoolLogo } from '../../lib/imageStorage';

export const SchoolSettingsView: React.FC = () => {
  const { school, updateSchoolInfo } = useSchool();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
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

  const handleRemoveLogo = async () => {
    if (!school) return;
    if (confirm('Are you sure you want to remove the school logo? The school initials badge will be used instead.')) {
      setFormData(prev => ({ ...prev, logo: '' }));
      await updateSchoolInfo({ logo: '' });
      showToast('School logo removed successfully.');
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Configuration & Branding</h1>
            <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-mono font-bold uppercase">
              {school?.shortCode || 'SCH'} Settings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school profile, upload institutional crest/logo, set academic sessions, and manage official details.
          </p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" /> All Changes Synced to Firebase!
          </span>
        )}
      </div>

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
              onClick={handleRemoveLogo}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
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

            <div className="flex items-center gap-3">
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
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Check className="w-3 h-3" /> Live Synced to Firestore
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};
