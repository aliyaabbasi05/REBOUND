import React, { useEffect, useState } from 'react';
import { X, User, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StudentProfileModal: React.FC = () => {
  const {
    isStudentProfileModalOpen,
    setIsStudentProfileModalOpen,
    profile,
    updateProfile,
  } = useApp();
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');

  useEffect(() => {
    if (isStudentProfileModalOpen) {
      setName(profile.name || '');
      setEmail(profile.email || '');
    }
  }, [isStudentProfileModalOpen, profile.name, profile.email]);

  if (!isStudentProfileModalOpen) return null;

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const safeName = name.trim().slice(0, 120);
    const safeEmail = email.trim().slice(0, 254);
    const initials = Array.from(safeName.split(/\s+/).filter(Boolean).slice(0, 2), (part) => part[0] || '').join('').toUpperCase();
    updateProfile({ name: safeName, email: safeEmail, avatarInitials: initials });
    setIsStudentProfileModalOpen(false);
  };

  const clearProfileLabel = () => {
    updateProfile({ name: '', email: '', avatarInitials: '' });
    setName('');
    setEmail('');
    setIsStudentProfileModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="presentation">
      <section className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="local-profile-title">
        <header className="p-6 bg-[#14281D] text-white flex items-center justify-between border-b border-[#254533]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B4F04C] text-[#14281D] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="local-profile-title" className="text-base font-bold">Local student profile</h2>
              <p className="text-xs text-[#9BB0A3]">A label only — not an account or sign-in</p>
            </div>
          </div>
          <button type="button" onClick={() => setIsStudentProfileModalOpen(false)} aria-label="Close profile editor" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#9BB0A3] hover:text-white flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </header>

        <form onSubmit={saveProfile} className="p-6 space-y-4">
          <label className="block">
            <span className="block text-xs font-bold text-gray-700 mb-1">Student name</span>
            <input type="text" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional display name" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#14281D] focus:outline-none" />
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-gray-700 mb-1">Email label <span className="font-normal text-gray-400">(optional)</span></span>
            <input type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Not used to sign in" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#14281D] focus:outline-none" />
          </label>

          <div className="p-3.5 rounded-2xl bg-[#F4F6F4] border border-[#E2EAE4] flex items-start gap-2.5 text-xs text-[#385644] leading-relaxed">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>This profile label and your progress are stored in this browser; there is no OAuth or cloud sync. When you explicitly run an AI feature, the selected assessment/course content and relevant study context are sent to the configured Gemini service for processing. The optional email is not sent in AI requests.</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#14281D] text-[#B4F04C] font-bold text-sm">Save local profile</button>
            <button type="button" onClick={clearProfileLabel} className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs">Clear label</button>
          </div>
        </form>
      </section>
    </div>
  );
};
