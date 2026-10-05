import React, { useEffect, useState } from 'react';
import {
  User,
  BookOpen,
  School,
  GraduationCap,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Shield,
  Save,
  Bell,
  Send,
  ShieldCheck,
  Upload,
  FileText,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from '../Auth/GoogleSignInButton';
import { extractCurriculumWithAI } from '../../services/api';
import { CurriculumTopic, CurriculumUnit, SubjectCurriculum } from '../../types';

const draftId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const cloneCurriculum = (curriculum: SubjectCurriculum): SubjectCurriculum => JSON.parse(JSON.stringify(curriculum)) as SubjectCurriculum;
const withCounts = (curriculum: SubjectCurriculum): SubjectCurriculum => ({
  ...curriculum,
  totalUnits: curriculum.units.length,
  totalTopics: curriculum.units.reduce((sum, unit) => sum + unit.topics.length, 0),
});
const isUsableCurriculum = (curriculum: SubjectCurriculum) => Boolean(
  curriculum?.subject?.trim() && Array.isArray(curriculum.units) &&
  curriculum.units.some((unit) => unit.title?.trim() && unit.topics?.some((topic) => topic.name?.trim())),
);

export const ProfileView: React.FC = () => {
  const {
    profile,
    updateProfile,
    curriculums,
    saveCurriculum,
    resetAllData,
    setIsOnboardingOpen,
    notificationPermission,
    requestBrowserNotifications,
    triggerRecoveryNudge,
    notificationsEnabled,
    setNotificationsEnabled,
    nudgeIntervalMinutes,
    setNudgeIntervalMinutes,
    setIsNotificationCenterOpen,
    setIsStudentProfileModalOpen,
  } = useApp();

  const { user, status: authStatus, isCloudEnabled } = useAuth();
  const isAuthenticated = authStatus === 'authenticated';

  const [name, setName] = useState(profile.name);
  const [school, setSchool] = useState(profile.school);
  const [grade, setGrade] = useState(profile.grade);
  const [course, setCourse] = useState(profile.course);
  const [subjectsStr, setSubjectsStr] = useState(profile.subjects.join(', '));
  const [isSaved, setIsSaved] = useState(false);

  // Curriculum management
  const [selectedSubject, setSelectedSubject] = useState(profile.subjects[0] || '');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const activeSubjectName = customSubjectInput.trim() || selectedSubject;
  const activeCurriculum = activeSubjectName ? curriculums[activeSubjectName] : undefined;

  const [rawSyllabusText, setRawSyllabusText] = useState('');
  const [uploadedSyllabusFile, setUploadedSyllabusFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pendingCurriculum, setPendingCurriculum] = useState<SubjectCurriculum | null>(null);
  const [draftCurriculum, setDraftCurriculum] = useState<SubjectCurriculum | null>(activeCurriculum ? cloneCurriculum(activeCurriculum) : null);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);

  useEffect(() => {
    setDraftCurriculum(activeCurriculum ? cloneCurriculum(activeCurriculum) : activeSubjectName ? { subject: activeSubjectName, totalUnits: 0, totalTopics: 0, units: [] } : null);
    setPendingCurriculum(null);
    setCurriculumError(null);
    setUploadedSyllabusFile(null);
  }, [activeSubjectName, activeCurriculum]);

  const currentCurriculum = pendingCurriculum || draftCurriculum;
  const updateDraftCurriculum = (updater: (curriculum: SubjectCurriculum) => SubjectCurriculum) => {
    if (pendingCurriculum) setPendingCurriculum((current) => current ? withCounts(updater(current)) : current);
    else setDraftCurriculum((current) => current ? withCounts(updater(current)) : current);
  };

  const handleSyllabusFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!activeSubjectName.trim()) { setCurriculumError('Choose or enter the subject for this curriculum first.'); return; }
    if (profile.privacy?.useUploadedWork === false) { setCurriculumError('File sharing with AI is turned off in Privacy settings. Paste text manually or enable file sharing first.'); return; }
    if (file.size > 8 * 1024 * 1024) { setCurriculumError('This file exceeds the 8 MB upload limit.'); return; }
    const extension = file.name.toLowerCase().split('.').pop() || '';
    const extensionTypes: Record<string, string> = { pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
    const mimeType = file.type || extensionTypes[extension] || '';
    const isTextFile = ['text/plain', 'text/markdown'].includes(mimeType);
    if (!isTextFile && !['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) {
      setCurriculumError('Choose a PDF, plain text, Markdown, JPEG, PNG, WebP, or GIF file. DOCX/HEIC are not supported yet.');
      return;
    }
    setUploadedSyllabusFile(file);
    setCurriculumError(null);
    setIsExtracting(true);

    try {
      if (isTextFile) {
        const text = await file.text();
        if (text.length > 200_000) throw new Error('Text file exceeds the 200,000 character limit.');
        const res = await extractCurriculumWithAI({
          rawText: text,
          subject: activeSubjectName,
          grade: profile.privacy?.personalizedAi === false ? '' : grade,
          course: profile.privacy?.personalizedAi === false ? '' : course,
          personalizedAi: profile.privacy?.personalizedAi !== false,
          allowUploadedWork: true,
        });
        if (!isUsableCurriculum(res)) throw new Error('AI returned no usable units or topics. Add the structure manually instead.');
        setPendingCurriculum(withCounts(res));
      } else {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            if (!base64) throw new Error('The selected file has no readable content.');
              const res = await extractCurriculumWithAI({
                fileBase64: base64,
                mimeType,
                subject: activeSubjectName,
                grade: profile.privacy?.personalizedAi === false ? '' : grade,
                course: profile.privacy?.personalizedAi === false ? '' : course,
                personalizedAi: profile.privacy?.personalizedAi !== false,
                allowUploadedWork: true,
              });
            if (!isUsableCurriculum(res)) throw new Error('AI returned no usable units or topics. Add the structure manually instead.');
            setPendingCurriculum(withCounts(res));
          } catch (err) {
            setCurriculumError(err instanceof Error ? `Curriculum extraction unavailable: ${err.message}` : 'Curriculum extraction unavailable. No curriculum was saved.');
          } finally {
            setIsExtracting(false);
          }
        };
        reader.onerror = () => { setCurriculumError('The selected file could not be read. No curriculum was saved.'); setIsExtracting(false); };
        reader.readAsDataURL(file);
        return; // reader onload handles state
      }
    } catch (e) {
      setCurriculumError(e instanceof Error ? `Curriculum extraction unavailable: ${e.message}` : 'Curriculum extraction unavailable. No curriculum was saved.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveProfile = () => {
    const updatedSubs = subjectsStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    updateProfile({
      name,
      avatarInitials: Array.from(name.trim().split(/\s+/).filter(Boolean).slice(0, 2), (part) => part[0] || '').join('').toUpperCase(),
      school,
      grade,
      course,
      subjects: updatedSubs,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleRunCurriculumExtraction = async () => {
    if (!activeSubjectName.trim()) { setCurriculumError('Choose or enter the subject for this curriculum first.'); return; }
    if (!rawSyllabusText.trim()) { setCurriculumError('Paste syllabus or course material text first.'); return; }
    setCurriculumError(null);
    setIsExtracting(true);
    try {
      const res = await extractCurriculumWithAI({
        rawText: rawSyllabusText,
        subject: activeSubjectName,
        grade: profile.privacy?.personalizedAi === false ? '' : grade,
        course: profile.privacy?.personalizedAi === false ? '' : course,
        personalizedAi: profile.privacy?.personalizedAi !== false,
        allowUploadedWork: false,
      });
      if (!res || !Array.isArray(res.units) || !res.units.some((unit) => unit.title?.trim() && unit.topics?.some((topic) => topic.name?.trim()))) {
        throw new Error('AI returned no usable units or topics. Add the structure manually instead.');
      }
      setPendingCurriculum(withCounts(res));
      setRawSyllabusText('');
    } catch (e) {
      setCurriculumError(e instanceof Error ? `Curriculum extraction unavailable: ${e.message}` : 'Curriculum extraction unavailable. No curriculum was saved.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveUnit = (unitId: string) => updateDraftCurriculum((current) => ({ ...current, units: current.units.filter((unit) => unit.id !== unitId) }));
  const handleAddUnit = () => {
    const blankUnit: CurriculumUnit = { id: draftId('unit'), title: '', topics: [] };
    if (pendingCurriculum) {
      setPendingCurriculum((current) => current ? withCounts({ ...current, units: [...current.units, blankUnit] }) : current);
      return;
    }
    setDraftCurriculum((current) => {
      const base = current || { subject: activeSubjectName.trim(), totalUnits: 0, totalTopics: 0, units: [] };
      return withCounts({ ...base, units: [...base.units, blankUnit] });
    });
  };
  const handleUpdateUnit = (unitId: string, title: string) => updateDraftCurriculum((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, title } : unit) }));
  const handleAddTopic = (unitId: string) => updateDraftCurriculum((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: [...unit.topics, { id: draftId('topic'), name: '', subtopics: [] }] } : unit) }));
  const handleRemoveTopic = (unitId: string, topicId: string) => updateDraftCurriculum((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.filter((topic) => topic.id !== topicId) } : unit) }));
  const handleUpdateTopic = (unitId: string, topicId: string, name: string) => updateDraftCurriculum((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.map((topic) => topic.id === topicId ? { ...topic, name } : topic) } : unit) }));
  const handleAddSubtopic = (unitId: string, topicId: string) => updateDraftCurriculum((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.map((topic) => topic.id === topicId ? { ...topic, subtopics: [...topic.subtopics, ''] } : topic) } : unit) }));
  const handleUpdateSubtopic = (unitId: string, topicId: string, index: number, value: string) => updateDraftCurriculum((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.map((topic) => topic.id === topicId ? { ...topic, subtopics: topic.subtopics.map((item, itemIndex) => itemIndex === index ? value : item) } : topic) } : unit) }));
  const handleRemoveSubtopic = (unitId: string, topicId: string, index: number) => updateDraftCurriculum((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.map((topic) => topic.id === topicId ? { ...topic, subtopics: topic.subtopics.filter((_item, itemIndex) => itemIndex !== index) } : topic) } : unit) }));

  const handleConfirmCurriculum = () => {
    if (!currentCurriculum) { setCurriculumError('Add a curriculum before confirming.'); return; }
    const units = currentCurriculum.units.filter((unit) => unit.title.trim()).map((unit) => ({ ...unit, title: unit.title.trim(), topics: unit.topics.filter((topic) => topic.name.trim()).map((topic) => ({ ...topic, name: topic.name.trim(), subtopics: topic.subtopics.map((item) => item.trim()).filter(Boolean) })) })).filter((unit) => unit.topics.length > 0);
    if (!activeSubjectName.trim() || !units.length) { setCurriculumError('Add at least one unit with one topic before confirming.'); return; }
    const confirmed = withCounts({ ...currentCurriculum, subject: activeSubjectName.trim(), units });
    saveCurriculum(confirmed);
    setDraftCurriculum(cloneCurriculum(confirmed));
    setPendingCurriculum(null);
    setCurriculumError(null);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const personalizedAi = profile.privacy?.personalizedAi !== false;
  const useUploadedWork = profile.privacy?.useUploadedWork !== false;
  const setPrivacyPreference = (key: 'personalizedAi' | 'useUploadedWork', value: boolean) => {
    updateProfile({
      privacy: {
        personalizedAi: profile.privacy?.personalizedAi ?? true,
        useUploadedWork: profile.privacy?.useUploadedWork ?? true,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#14281D]">
          Student Profile & Learning Map
        </h2>
        <p className="text-xs text-[#557361] mt-1">
          Manage your local browser student profile, academic background, and custom course curriculums.
        </p>
      </div>

      {/* 0. STUDENT PROFILE & CLOUD ACCOUNT CARD */}
      <div className="bg-[#14281D] rounded-3xl p-6 sm:p-7 text-white border border-[#254533] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B4F04C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#14281D] flex items-center justify-center shadow-md shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  {user?.displayName || profile.name || (isAuthenticated ? 'Student Account' : 'Local Student Profile')}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isAuthenticated
                    ? 'bg-[#B4F04C] text-[#14281D]'
                    : 'bg-white/20 text-[#D7E7B8]'
                }`}>
                  {isAuthenticated ? 'Cloud Synced' : isCloudEnabled ? 'Signed Out' : 'Browser only'}
                </span>
              </div>
              <p className="text-xs text-[#9BB0A3] mt-0.5">
                {isAuthenticated
                  ? `Signed in as ${user?.email}. Your workspace syncs automatically with Supabase.`
                  : isCloudEnabled
                  ? 'Sign in with Google to sync your progress across devices.'
                  : 'Records stay in this browser.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isCloudEnabled && (
              <GoogleSignInButton variant="compact" />
            )}
            <button
              onClick={() => setIsStudentProfileModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {profile.name ? 'Edit local details' : 'Set local details'}
            </button>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-3xl p-6 border border-[#E2EAE4] shadow-xs" aria-labelledby="privacy-heading">
        <div className="mb-4">
          <h3 id="privacy-heading" className="text-base font-black text-[#14281D]">AI & Privacy Controls</h3>
          <p className="text-xs text-gray-500 mt-1">Your choices are saved in this browser and applied to AI requests.</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-[#F4F6F4]">
            <div>
              <p className="text-xs font-bold text-[#14281D]">Use prior study context for personalization</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Controls sharing grade/course details, previous tests, recurring mistakes, and topic-specific auto-filled coach prompts. The selected course map remains necessary to map assessment topics.</p>
            </div>
            <button type="button" role="switch" aria-checked={personalizedAi} onClick={() => setPrivacyPreference('personalizedAi', !personalizedAi)} className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors ${personalizedAi ? 'bg-[#14281D]' : 'bg-gray-300'}`}>
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${personalizedAi ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-[#F4F6F4]">
            <div>
              <p className="text-xs font-bold text-[#14281D]">Allow uploaded files to be sent to AI</p>
              <p className="text-[11px] text-gray-500 mt-0.5">When enabled, a file is sent only after you explicitly run analysis or extraction. Pasted text remains a separate, explicit submission.</p>
            </div>
            <button type="button" role="switch" aria-checked={useUploadedWork} onClick={() => setPrivacyPreference('useUploadedWork', !useUploadedWork)} className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors ${useUploadedWork ? 'bg-[#14281D]' : 'bg-gray-300'}`}>
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${useUploadedWork ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <p className="text-[11px] text-[#557361]">No anonymous usage analytics or product-improvement telemetry are collected or sent in this build. The optional profile email is not included in AI prompts.</p>
        </div>
      </section>

      {/* 1. STUDENT ACADEMIC PROFILE FORM */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE4] shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#14281D] text-[#B4F04C] font-black flex items-center justify-center text-lg border border-[#254533] shadow-xs">
              {profile.avatarInitials || 'S'}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#14281D]">{profile.name || 'Student profile'}</h3>
              <p className="text-xs text-[#557361]">{profile.school || 'Details stored in this browser'}</p>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            className="px-4 py-2 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4 text-[#B4F04C]" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Student Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">School / Institute</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Grade / Year</label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Course / Program</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Active Subjects (comma separated)
            </label>
            <input
              type="text"
              value={subjectsStr}
              onChange={(e) => setSubjectsStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. PERSONAL CURRICULUM SETUP & MANAGER (Section 3) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE4] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B4F04C] border border-[#14281D]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#14281D]">
                Course Alignment
              </span>
            </div>
            <h3 className="text-lg font-black text-[#14281D] mt-0.5">
              Personal Curriculum Learning Map
            </h3>
            <p className="text-xs text-[#557361]">
              Build and review the topic map used to interpret assessment evidence.
            </p>
          </div>

          {/* Subject selector & custom input */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Enter or select subject..."
              value={customSubjectInput}
              onChange={(e) => setCustomSubjectInput(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#254533]/30 bg-white text-[#14281D] font-bold text-xs focus:ring-2 focus:ring-[#14281D] focus:outline-none w-44"
            />
            {profile.subjects.length > 0 && (
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCustomSubjectInput(e.target.value);
                }}
                className="px-3.5 py-2 rounded-xl border border-[#254533]/30 bg-[#F4F6F4] text-[#14281D] font-extrabold text-xs focus:outline-none"
              >
                <option value="">Choose Existing Subject...</option>
                {profile.subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleAddUnit}
              className="px-3 py-2 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Unit</span>
            </button>
          </div>
        </div>

        {/* Upload course material or paste text. Files are sent to Gemini only when enabled and explicitly submitted. */}
        <div className="mb-6 p-5 rounded-3xl bg-white border border-[#254533]/20 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-extrabold text-[#14281D]">Add course material ({activeSubjectName || 'choose a subject'})</h4><p className="text-xs text-[#557361] mt-0.5">AI creates a draft from the actual file or text; it never saves extraction automatically.</p></div><span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#14281D] text-[#B4F04C]">Gemini AI</span></div>
          <div className="border-2 border-dashed border-[#254533]/20 hover:border-[#14281D] rounded-2xl p-5 text-center transition-colors bg-[#FAF6EE]/50"><input type="file" id="syllabus-file-upload" accept=".pdf,.txt,.md,.jpg,.jpeg,.png,.webp,.gif,application/pdf,text/plain,text/markdown,image/jpeg,image/png,image/webp,image/gif" disabled={!useUploadedWork || !activeSubjectName.trim()} onChange={handleSyllabusFileUpload} className="sr-only" /><label htmlFor="syllabus-file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2"><div className="w-12 h-12 rounded-2xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center shadow-xs">{isExtracting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}</div><p className="text-xs font-bold text-[#14281D]">{uploadedSyllabusFile ? uploadedSyllabusFile.name : `Upload ${activeSubjectName || 'selected subject'} material`}</p><p className="text-[11px] text-gray-500">PDF, text, Markdown, JPEG, PNG, WebP, or GIF · up to 8 MB</p><span className="px-3.5 py-1.5 rounded-xl bg-[#14281D] text-[#B4F04C] text-xs font-bold">{isExtracting ? 'Extracting...' : useUploadedWork ? 'Choose course file' : 'File sharing is off'}</span></label></div>
          <p className="text-[11px] text-[#557361] bg-[#F4F6F4] rounded-lg p-2">When enabled, the selected file content is sent to Gemini for extraction. Your Privacy setting controls whether file sharing is allowed.</p>
          <div className="space-y-2 pt-2 border-t border-gray-100"><label htmlFor="profile-raw-syllabus" className="text-xs font-bold text-gray-700 block">Or paste syllabus / course material text</label><textarea id="profile-raw-syllabus" rows={3} value={rawSyllabusText} onChange={(event) => setRawSyllabusText(event.target.value)} placeholder="Paste real units, topics, and subtopics..." className="w-full p-3 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-[#14281D] focus:outline-none bg-white" /><div className="flex items-center justify-between gap-3"><span className="text-[11px] text-[#557361]">AI organizes Subject → Unit → Topic → Subtopic.</span><button type="button" onClick={handleRunCurriculumExtraction} disabled={isExtracting || !rawSyllabusText.trim() || !activeSubjectName.trim()} className="px-4 py-2 rounded-xl bg-[#14281D] text-[#B4F04C] font-extrabold text-xs disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"><Sparkles className="w-3.5 h-3.5" />{isExtracting ? 'Extracting...' : 'Extract text'}</button></div></div>
        </div>

        {curriculumError && <p role="alert" className="mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{curriculumError}</p>}
        {currentCurriculum ? <div className={`p-4 rounded-2xl border mb-6 ${pendingCurriculum ? 'bg-amber-50 border-amber-200' : 'bg-[#FAF6EE] border-[#254533]/20'}`}><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center shrink-0"><Layers className="w-5 h-5" /></div><div><p className="text-xs font-extrabold text-[#14281D]">{pendingCurriculum ? 'Draft curriculum — review before saving' : `Curriculum map: ${currentCurriculum.totalUnits} units · ${currentCurriculum.totalTopics} topics`}</p><p className="text-[11px] text-[#557361] mt-0.5">{pendingCurriculum ? 'AI output is untrusted. Edit it below, then confirm to make it official.' : 'Changes are a local draft until you confirm them.'}</p></div></div><div className="flex items-center gap-2"><button type="button" onClick={handleAddUnit} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-[#14281D] text-xs font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5" />Add unit</button><button type="button" onClick={handleConfirmCurriculum} className="px-3 py-2 rounded-xl bg-[#14281D] text-[#B4F04C] text-xs font-black flex items-center gap-1 cursor-pointer"><CheckCircle2 className="w-4 h-4" />Confirm &amp; save</button></div></div>{pendingCurriculum && <button type="button" onClick={() => setPendingCurriculum(null)} className="mt-3 text-[11px] font-bold text-gray-600 hover:underline cursor-pointer">Discard AI draft</button>}</div> : <div className="p-6 rounded-2xl bg-[#FAF6EE] border border-[#E2EAE4] mb-6 text-center space-y-2"><p className="text-xs font-bold text-[#14281D]">No curriculum saved for {activeSubjectName || 'this subject'}</p><p className="text-xs text-gray-500">Choose a subject, upload or paste real material, or add a unit manually.</p></div>}

        <div className="space-y-3">{currentCurriculum?.units.map((unit: CurriculumUnit) => <div key={unit.id} className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-[#14281D]/30 transition-colors shadow-2xs"><div className="flex items-center gap-2 mb-3"><input aria-label="Unit title" value={unit.title} onChange={(event) => handleUpdateUnit(unit.id, event.target.value)} placeholder="Unit or chapter title" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#14281D]/20" /><button type="button" onClick={() => handleRemoveUnit(unit.id)} aria-label={`Remove ${unit.title || 'unit'}`} className="text-gray-400 hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div>{unit.topics.map((topic: CurriculumTopic) => <div key={topic.id} className="ml-3 mb-3 p-2.5 rounded-xl bg-[#F4F6F4] border border-gray-200"><div className="flex items-center gap-2"><input aria-label="Topic name" value={topic.name} onChange={(event) => handleUpdateTopic(unit.id, topic.id, event.target.value)} placeholder="Topic name" className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#14281D]/20" /><button type="button" onClick={() => handleRemoveTopic(unit.id, topic.id)} aria-label={`Remove ${topic.name || 'topic'}`} className="text-gray-400 hover:text-rose-500 cursor-pointer"><Trash2 className="w-3 h-3" /></button></div><div className="mt-2 space-y-1">{topic.subtopics.map((subtopic, index) => <div key={`${topic.id}-sub-${index}`} className="flex items-center gap-1.5"><input aria-label="Subtopic name" value={subtopic} onChange={(event) => handleUpdateSubtopic(unit.id, topic.id, index, event.target.value)} placeholder="Subtopic (optional)" className="flex-1 px-2.5 py-1 rounded-lg border border-gray-100 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#14281D]/20" /><button type="button" onClick={() => handleRemoveSubtopic(unit.id, topic.id, index)} aria-label="Remove subtopic" className="text-gray-400 hover:text-rose-500 cursor-pointer"><Trash2 className="w-3 h-3" /></button></div>)}</div><button type="button" onClick={() => handleAddSubtopic(unit.id, topic.id)} className="mt-2 text-[10px] font-bold text-[#14281D] hover:underline cursor-pointer">+ Add subtopic</button></div>)}<button type="button" onClick={() => handleAddTopic(unit.id)} className="ml-3 text-[10px] font-bold text-[#14281D] hover:underline cursor-pointer">+ Add topic</button></div>)}</div>
      </div>

      {/* 3. RECOVERY NOTIFICATIONS & MOTIVATIONAL NUDGES */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE4] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center border border-[#254533] shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#14281D]">
                Recovery Plan Notifications
              </h3>
              <p className="text-xs text-gray-500">
                Gentle, empathetic browser nudges for pending recovery milestones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerRecoveryNudge()}
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-[#F4F6F4] text-gray-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#14281D]" />
              <span>Send Test Nudge</span>
            </button>
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs font-bold transition-colors cursor-pointer"
            >
              Open Center
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F4F6F4] border border-gray-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Browser API Status
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#14281D] capitalize">
                {notificationPermission === 'granted' ? 'Authorized ✅' : notificationPermission}
              </span>
            </div>
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestBrowserNotifications}
                className="mt-2 text-xs font-bold text-[#14281D] hover:underline cursor-pointer"
              >
                Enable in Browser
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F6F4] border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Automated Reminders
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">
                {notificationsEnabled ? 'Active' : 'Muted'}
              </span>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  notificationsEnabled
                    ? 'bg-[#14281D] text-[#B4F04C]'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F6F4] border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Interval Schedule
            </span>
            <div className="flex items-center gap-1.5">
              {[15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setNudgeIntervalMinutes(mins)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    nudgeIntervalMinutes === mins
                      ? 'bg-[#14281D] text-[#B4F04C]'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Local data controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-[#14281D]">Local Data & Setup</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            All saved progress lives in this browser. Deleting it removes your profile, curricula, assessments, practice history, and plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#F4F6F4] hover:bg-[#E8EFEA] text-[#14281D] font-bold text-xs border border-[#254533]/20 cursor-pointer"
          >
            Open setup wizard
          </button>
          <button
            onClick={() => {
              if (window.confirm('Delete all REBOUND data stored in this browser? This cannot be undone.')) resetAllData();
            }}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Delete local data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
