import React, { useState } from 'react';
import { UserProfile, School, Student } from '../../types';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  MessageSquare, 
  Phone, 
  ExternalLink, 
  Mail, 
  Share2, 
  Sparkles 
} from 'lucide-react';
import { 
  buildCredentialMessage, 
  copyToClipboard, 
  normalizePhoneForMessaging 
} from './portalUtils';

interface SendCredentialsModalProps {
  user: UserProfile;
  school: School | null;
  students: Student[];
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const SendCredentialsModal: React.FC<SendCredentialsModalProps> = ({
  user,
  school,
  students,
  onClose,
  onToast
}) => {
  // Compute linked students summary for parents
  let linkedStudentsSummary = '';
  if (user.role === 'parent' && user.linkedStudentIds && user.linkedStudentIds.length > 0) {
    const wardNames = user.linkedStudentIds.map(sId => {
      const s = students.find(item => item.id === sId || item.admissionNumber === sId);
      return s ? `${s.firstName} ${s.lastName} (${s.admissionNumber})` : sId;
    });
    linkedStudentsSummary = wardNames.join(', ');
  }

  const defaultMessage = buildCredentialMessage(
    school?.name || 'SchoolOS Online',
    window.location.origin,
    {
      fullName: user.fullName,
      role: user.role,
      emailOrUsername: user.email || user.username || '',
      password: user.password || 'password123',
      linkedStudentsSummary: linkedStudentsSummary || undefined
    }
  );

  const [messageText, setMessageText] = useState(defaultMessage);
  const [recipientPhone, setRecipientPhone] = useState(user.phone || '');
  const [isCopied, setIsCopied] = useState(false);

  const normalizedPhone = normalizePhoneForMessaging(recipientPhone);

  const handleCopyNotice = async () => {
    const success = await copyToClipboard(messageText);
    if (success) {
      setIsCopied(true);
      onToast(`Copied portal access notice for ${user.fullName} to clipboard.`);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    if (!normalizedPhone) {
      alert("Please provide a valid contact phone number with country code for WhatsApp.");
      return;
    }
    const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onToast(`Opened WhatsApp chat for ${user.fullName}`);
  };

  const handleSendSMS = () => {
    if (!recipientPhone) {
      alert("Please enter a phone number for SMS delivery.");
      return;
    }
    const url = `sms:${recipientPhone}?body=${encodeURIComponent(messageText)}`;
    window.location.href = url;
    onToast(`Prepared SMS dispatch for ${user.fullName}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Send Portal Credentials</h3>
              <p className="text-[11px] text-slate-500">Dispatch access details to {user.fullName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipient Phone Field */}
        <div className="space-y-1 text-xs">
          <label className="block font-bold text-slate-700">Recipient Phone (Ghana / International)</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g. 024 123 4567 or +233 24 123 4567"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
          </div>
          {normalizedPhone && (
            <p className="text-[10px] text-teal-700 font-mono">
              WhatsApp normalized target: +{normalizedPhone}
            </p>
          )}
        </div>

        {/* Message Editor */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-slate-700">Invitation Notice Content</label>
            <button
              type="button"
              onClick={() => setMessageText(defaultMessage)}
              className="text-[10px] text-teal-700 hover:underline font-semibold"
            >
              Reset Template
            </button>
          </div>
          <textarea
            rows={7}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-teal-600 focus:bg-white resize-none"
          />
        </div>

        {/* Dispatch Options */}
        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>

            {/* Native SMS */}
            <button
              type="button"
              onClick={handleSendSMS}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Send via SMS</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleCopyNotice}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Notice Text'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
