import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Upload,
  BookOpen,
  Edit3,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  FileText,
  Loader2,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractCurriculumWithAI } from '../services/api';
import { CurriculumTopic, CurriculumUnit, SubjectCurriculum } from '../types';

const draftId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const emptyCurriculum = (subject: string): SubjectCurriculum => ({
  subject: subject.trim(),
  totalUnits: 0,
  totalTopics: 0,
  units: [],
});

const withCounts = (curriculum: SubjectCurriculum): SubjectCurriculum => ({
  ...curriculum,
  totalUnits: curriculum.units.length,
  totalTopics: curriculum.units.reduce((sum, unit) => sum + unit.topics.length, 0),
});

const isUsableCurriculum = (value: unknown): value is SubjectCurriculum => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SubjectCurriculum>;
  return typeof candidate.subject === 'string' && candidate.subject.trim().length > 0 &&
    Array.isArray(candidate.units) && candidate.units.length > 0 &&
    candidate.units.some((unit) => Boolean(unit && typeof unit.title === 'string' && unit.title.trim() && Array.isArray(unit.topics) && unit.topics.some((topic) => topic && typeof topic.name === 'string' && topic.name.trim())));
};

const fileMime = (file: File) => {
  const extension = file.name.toLowerCase().split('.').pop() || '';
  const extensionTypes: Record<string, string> = {
    pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  };
  return file.type || extensionTypes[extension] || '';
};

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, profile, updateProfile, saveCurriculum } = useApp();
  const [step, setStep] = useState<'welcome' | 'profile' | 'curriculum' | 'review'>('welcome');
  const [name, setName] = useState(profile.name || '');
  const [school, setSchool] = useState(profile.school || '');
  const [grade, setGrade] = useState(profile.grade || '');
  const [course, setCourse] = useState(profile.course || '');
  const [subjectsInput, setSubjectsInput] = useState(profile.subjects.join(', '));
  const [curriculumMode, setCurriculumMode] = useState<'syllabus' | 'textbook' | 'manual'>('syllabus');
  const [targetSubject, setTargetSubject] = useState(profile.subjects[0] || '');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<SubjectCurriculum | null>(null);

  if (!isOnboardingOpen) return null;

  const handleSaveProfile = () => {
    const parsedSubjects = subjectsInput.split(',').map((subject) => subject.trim()).filter(Boolean);
    updateProfile({ name, school, grade, course, subjects: parsedSubjects, onboarded: true });
    if (!targetSubject.trim() && parsedSubjects[0]) setTargetSubject(parsedSubjects[0]);
    setStep('curriculum');
  };

  const acceptCurriculum = (result: unknown) => {
    if (!isUsableCurriculum(result)) throw new Error('AI returned no usable units or topics. Add the structure manually instead.');
    setExtractedData(withCounts(result));
    setStep('review');
  };

  const extract = async (payload: Parameters<typeof extractCurriculumWithAI>[0]) => {
    setExtractionError(null);
    setIsExtracting(true);
    try {
      const result = await extractCurriculumWithAI(payload);
      acceptCurriculum(result);
    } catch (error) {
      setExtractionError(error instanceof Error ? `Curriculum extraction unavailable: ${error.message}` : 'Curriculum extraction unavailable. No curriculum was saved.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractCurriculum = async () => {
    const subject = targetSubject.trim();
    if (!subject) { setExtractionError('Enter the subject name before creating a curriculum.'); return; }
    if (!rawText.trim()) { setExtractionError('Paste substantive syllabus or course material text first.'); return; }
    await extract({
      rawText,
      subject,
      grade: profile.privacy?.personalizedAi === false ? '' : grade,
      course: profile.privacy?.personalizedAi === false ? '' : course,
      personalizedAi: profile.privacy?.personalizedAi !== false,
      allowUploadedWork: false,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const subject = targetSubject.trim();
    if (!subject) { setExtractionError('Enter the subject name before uploading course material.'); return; }
    if (profile.privacy?.useUploadedWork === false) { setExtractionError('File sharing with AI is turned off in Privacy settings. Paste text or enable file sharing first.'); return; }
    if (file.size > 8 * 1024 * 1024) { setExtractionError('This file exceeds the 8 MB upload limit.'); return; }
    const mimeType = fileMime(file);
    const textFile = ['text/plain', 'text/markdown'].includes(mimeType);
    if (!textFile && !['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) {
      setExtractionError('Choose a PDF, plain text, Markdown, JPEG, PNG, WebP, or GIF file. DOCX/HEIC are not supported yet.');
      return;
    }
    setSelectedFile(file);
    setExtractionError(null);
    if (textFile) {
      try {
        const text = await file.text();
        if (text.length > 200_000) throw new Error('Text file exceeds the 200,000 character limit.');
        if (!text.trim()) throw new Error('The selected text file is empty.');
        await extract({ rawText: text, subject, grade: profile.privacy?.personalizedAi === false ? '' : grade, course: profile.privacy?.personalizedAi === false ? '' : course, personalizedAi: profile.privacy?.personalizedAi !== false, allowUploadedWork: true });
      } catch (error) {
        setExtractionError(error instanceof Error ? `The selected file could not be used: ${error.message}` : 'The selected file could not be used. No curriculum was saved.');
      }
      return;
    }
    setIsExtracting(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('The selected file could not be read.'));
        reader.readAsDataURL(file);
      });
      const fileBase64 = dataUrl.split(',')[1];
      if (!fileBase64) throw new Error('The selected file has no readable content.');
      const result = await extractCurriculumWithAI({ fileBase64, mimeType, subject, grade: profile.privacy?.personalizedAi === false ? '' : grade, course: profile.privacy?.personalizedAi === false ? '' : course, personalizedAi: profile.privacy?.personalizedAi !== false, allowUploadedWork: true });
      acceptCurriculum(result);
    } catch (error) {
      setExtractionError(error instanceof Error ? `Curriculum extraction unavailable: ${error.message}` : 'Curriculum extraction unavailable. No curriculum was saved.');
    } finally {
      setIsExtracting(false);
    }
  };

  const startManual = () => {
    if (!targetSubject.trim()) { setExtractionError('Enter the subject name before building a curriculum.'); return; }
    setExtractionError(null);
    setExtractedData(emptyCurriculum(targetSubject));
    setStep('review');
  };

  const updateDraft = (updater: (curriculum: SubjectCurriculum) => SubjectCurriculum) => {
    setExtractedData((current) => current ? withCounts(updater(current)) : current);
  };
  const addUnit = () => updateDraft((current) => ({ ...current, units: [...current.units, { id: draftId('unit'), title: '', topics: [] }] }));
  const removeUnit = (unitId: string) => updateDraft((current) => ({ ...current, units: current.units.filter((unit) => unit.id !== unitId) }));
  const updateUnit = (unitId: string, title: string) => updateDraft((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, title } : unit) }));
  const addTopic = (unitId: string) => updateDraft((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: [...unit.topics, { id: draftId('topic'), name: '', subtopics: [] }] } : unit) }));
  const removeTopic = (unitId: string, topicId: string) => updateDraft((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.filter((topic) => topic.id !== topicId) } : unit) }));
  const updateTopic = (unitId: string, topicId: string, name: string) => updateDraft((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.map((topic) => topic.id === topicId ? { ...topic, name } : topic) } : unit) }));
  const addSubtopic = (unitId: string, topicId: string) => updateDraft((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.map((topic) => topic.id === topicId ? { ...topic, subtopics: [...topic.subtopics, ''] } : topic) } : unit) }));
  const updateSubtopic = (unitId: string, topicId: string, index: number, value: string) => updateDraft((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.map((topic) => topic.id === topicId ? { ...topic, subtopics: topic.subtopics.map((item, itemIndex) => itemIndex === index ? value : item) } : topic) } : unit) }));
  const removeSubtopic = (unitId: string, topicId: string, index: number) => updateDraft((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, topics: unit.topics.map((topic) => topic.id === topicId ? { ...topic, subtopics: topic.subtopics.filter((_item, itemIndex) => itemIndex !== index) } : topic) } : unit) }));

  const handleConfirmCurriculum = () => {
    if (!extractedData || !extractedData.subject.trim()) { setExtractionError('Add a subject before confirming.'); return; }
    const cleanUnits = extractedData.units.filter((unit) => unit.title.trim()).map((unit) => ({ ...unit, title: unit.title.trim(), topics: unit.topics.filter((topic) => topic.name.trim()).map((topic) => ({ ...topic, name: topic.name.trim(), subtopics: topic.subtopics.map((item) => item.trim()).filter(Boolean) })) })).filter((unit) => unit.topics.length > 0);
    if (!cleanUnits.length) { setExtractionError('Add at least one unit with one topic before confirming.'); return; }
    const confirmed = withCounts({ ...extractedData, subject: extractedData.subject.trim(), units: cleanUnits });
    saveCurriculum(confirmed);
    if (!profile.subjects.some((subject) => subject.trim().toLowerCase() === confirmed.subject.toLowerCase())) updateProfile({ subjects: [...profile.subjects, confirmed.subject] });
    setIsOnboardingOpen(false);
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#254533]/20 overflow-hidden my-8">
        <div className="h-1.5 bg-[#B4F04C]" />
        <button type="button" onClick={() => setIsOnboardingOpen(false)} aria-label="Close onboarding" className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"><X className="w-4 h-4" /></button>

        {step === 'welcome' && <div className="p-8 sm:p-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14281D] text-[#B4F04C] text-xs font-bold mb-6"><Sparkles className="w-3.5 h-3.5" />Academic Recovery &amp; Progress Coach</div>
          <h2 id="onboarding-title" className="text-3xl sm:text-4xl font-black tracking-tight text-[#14281D] mb-4">REBOUND</h2>
          <div className="max-w-md mx-auto mb-8 space-y-2"><p className="text-xl sm:text-2xl font-black text-[#14281D] leading-snug">&ldquo;Your score is a snapshot.<br /><span className="text-emerald-700">Your progress is the story.</span>&rdquo;</p><p className="text-sm font-medium text-gray-500 pt-2">Turn every test into your next step.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left max-w-lg mx-auto"><div className="p-3.5 rounded-2xl bg-[#F4F6F4] border border-[#254533]/20"><span className="text-xs font-bold text-[#14281D] block mb-1">1. Deep Diagnosis</span><p className="text-[11px] text-gray-600">Use assessment evidence to distinguish mistake categories.</p></div><div className="p-3.5 rounded-2xl bg-[#F4F6F4] border border-[#254533]/20"><span className="text-xs font-bold text-[#14281D] block mb-1">2. Recovery Plan</span><p className="text-[11px] text-gray-600">Build a focused sequence tied to the assessment.</p></div><div className="p-3.5 rounded-2xl bg-[#14281D] text-white border border-[#254533]"><span className="text-xs font-bold text-[#B4F04C] block mb-1">3. Track Progress</span><p className="text-[11px] text-[#9BB0A3]">Track performance only when enough evidence is recorded.</p></div></div>
          <button type="button" onClick={() => setStep('profile')} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-bold text-base shadow-xl transition-all cursor-pointer">Get Started<ArrowRight className="w-5 h-5" /></button>
        </div>}

        {step === 'profile' && <div className="p-8 sm:p-10"><div className="mb-6"><span className="text-xs font-bold uppercase tracking-wider text-[#14281D]">Step 1 of 2</span><h3 id="onboarding-title" className="text-2xl font-black text-[#14281D] mt-1">Student Academic Profile</h3><p className="text-xs text-gray-500 mt-1">Add optional profile details. AI requests only use the fields allowed by your privacy choices.</p></div><div className="space-y-4"><div><label htmlFor="onboarding-name" className="block text-xs font-bold text-gray-700 mb-1">Student Name</label><input id="onboarding-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Your name" className={inputClass} /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label htmlFor="onboarding-school" className="block text-xs font-bold text-gray-700 mb-1">School / Institute</label><input id="onboarding-school" value={school} onChange={(event) => setSchool(event.target.value)} placeholder="Optional" className={inputClass} /></div><div><label htmlFor="onboarding-grade" className="block text-xs font-bold text-gray-700 mb-1">Grade / Year</label><input id="onboarding-grade" value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="Optional" className={inputClass} /></div></div><div><label htmlFor="onboarding-course" className="block text-xs font-bold text-gray-700 mb-1">Course / Program</label><input id="onboarding-course" value={course} onChange={(event) => setCourse(event.target.value)} placeholder="Optional" className={inputClass} /></div><div><label htmlFor="onboarding-subjects" className="block text-xs font-bold text-gray-700 mb-1">Your Subjects (comma separated)</label><input id="onboarding-subjects" value={subjectsInput} onChange={(event) => setSubjectsInput(event.target.value)} placeholder="e.g. Mathematics, History, Biology" className={inputClass} /><span className="text-[11px] text-gray-400 mt-1 block">You can also name a new subject during curriculum setup.</span></div></div><div className="mt-8 flex items-center justify-between pt-4 border-t border-gray-100"><button type="button" onClick={() => setStep('welcome')} className="text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer">Back</button><button type="button" onClick={handleSaveProfile} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-bold text-sm shadow-md cursor-pointer">Continue to Curriculum Setup<ArrowRight className="w-4 h-4" /></button></div></div>}

        {step === 'curriculum' && <div className="p-8 sm:p-10"><div className="mb-6"><span className="text-xs font-bold uppercase tracking-wider text-[#14281D]">Step 2 of 2</span><h3 id="onboarding-title" className="text-2xl font-black text-[#14281D] mt-1">Personal Curriculum Setup</h3><p className="text-xs text-gray-500 mt-1">Use your own syllabus, course material, pasted text, or build a map manually. AI output is only a suggestion until you review and confirm it.</p></div><div className="grid grid-cols-3 gap-2.5 mb-6">{(['syllabus', 'textbook', 'manual'] as const).map((mode) => <button type="button" key={mode} onClick={() => setCurriculumMode(mode)} className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${curriculumMode === mode ? 'border-[#14281D] bg-[#F4F6F4] text-[#14281D] font-bold shadow-xs' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>{mode === 'syllabus' ? <FileText className="w-5 h-5 mx-auto mb-1" /> : mode === 'textbook' ? <BookOpen className="w-5 h-5 mx-auto mb-1" /> : <Edit3 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />}<span className="text-xs font-bold block">{mode === 'syllabus' ? 'Syllabus' : mode === 'textbook' ? 'Course Material' : 'Build Manually'}</span><span className="text-[10px] text-gray-500">{mode === 'manual' ? 'Your own structure' : 'AI suggestion + review'}</span></button>)}</div>{extractionError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-3">{extractionError}</p>}<div className="space-y-4"><div><label htmlFor="onboarding-subject" className="block text-xs font-bold text-gray-700 mb-1">Subject for this curriculum</label><input id="onboarding-subject" value={targetSubject} onChange={(event) => setTargetSubject(event.target.value)} placeholder="e.g. Biology, Algebra, World History" className={inputClass} /></div>{curriculumMode !== 'manual' && <><div className="border-2 border-dashed border-[#254533]/20 rounded-2xl p-4 text-center bg-[#FAF6EE]/50"><input id="onboarding-file" type="file" accept=".pdf,.txt,.md,.jpg,.jpeg,.png,.webp,.gif,application/pdf,text/plain,text/markdown,image/jpeg,image/png,image/webp,image/gif" onChange={handleFileUpload} disabled={isExtracting} className="sr-only" /><label htmlFor="onboarding-file" className="cursor-pointer flex flex-col items-center gap-2"><Upload className="w-6 h-6 text-[#14281D]" /><span className="text-xs font-bold text-[#14281D]">{selectedFile ? selectedFile.name : 'Upload syllabus or course material'}</span><span className="text-[11px] text-gray-500">PDF, text, Markdown, JPEG, PNG, WebP, or GIF · up to 8 MB</span><span className="px-3 py-1.5 rounded-xl bg-[#14281D] text-[#B4F04C] text-xs font-bold">{isExtracting ? 'Processing...' : 'Choose file'}</span></label></div><p className="text-[11px] text-[#557361] bg-[#F4F6F4] rounded-lg p-2">When file sharing is enabled, the selected file content is sent to Gemini for extraction. It is not described as local-only; your Privacy settings control this.</p><div><label htmlFor="onboarding-raw-text" className="block text-xs font-bold text-gray-700 mb-1">Or paste syllabus / course material text</label><textarea id="onboarding-raw-text" rows={5} value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Paste your real outline, chapters, units, topics, and subtopics..." className="w-full p-3.5 rounded-xl border border-gray-200 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] focus:outline-none" /></div></>}</div><div className="mt-8 flex items-center justify-between pt-4 border-t border-gray-100"><button type="button" onClick={() => setStep('profile')} className="text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer">Back</button>{curriculumMode === 'manual' ? <button type="button" onClick={startManual} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#14281D] text-[#B4F04C] font-bold text-sm cursor-pointer"><Edit3 className="w-4 h-4" />Build Curriculum</button> : <button type="button" onClick={handleExtractCurriculum} disabled={isExtracting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#14281D] text-[#B4F04C] font-bold text-sm disabled:opacity-50 cursor-pointer">{isExtracting ? <><Loader2 className="w-4 h-4 animate-spin" />Organizing...</> : <><Sparkles className="w-4 h-4" />Extract &amp; Review</>}</button>}</div></div>}

        {step === 'review' && extractedData && <div className="p-8 sm:p-10"><div className="flex items-start justify-between gap-3 mb-4"><div><span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{curriculumMode === 'manual' ? 'Manual draft' : 'AI suggestion — untrusted draft'}</span><h3 id="onboarding-title" className="text-2xl font-black text-[#14281D] mt-1">Review &amp; Edit Curriculum</h3></div><Layers className="w-6 h-6 text-[#14281D]" /></div><p className="text-xs text-gray-600 mb-4">Nothing has been saved. Edit every subject, unit, topic, and subtopic below, then use Confirm only when the map is accurate.</p>{extractionError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-3">{extractionError}</p>}<label htmlFor="review-subject" className="block text-xs font-bold text-gray-700 mb-1">Subject</label><input id="review-subject" value={extractedData.subject} onChange={(event) => setExtractedData({ ...extractedData, subject: event.target.value })} className={`${inputClass} mb-4`} /><div className="p-3.5 rounded-2xl bg-[#F4F6F4] border border-[#254533]/20 mb-4 flex items-center justify-between"><span className="text-xs font-bold text-[#14281D]">{extractedData.totalUnits} units · {extractedData.totalTopics} topics</span><button type="button" onClick={addUnit} className="px-2.5 py-1 text-xs font-bold bg-white text-[#14281D] rounded-lg border border-gray-200 flex items-center gap-1 cursor-pointer"><Plus className="w-3 h-3" />Add Unit</button></div><div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">{extractedData.units.map((unit: CurriculumUnit) => <div key={unit.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80"><div className="flex items-center gap-2 mb-3"><input aria-label="Unit title" value={unit.title} onChange={(event) => updateUnit(unit.id, event.target.value)} placeholder="Unit or chapter title" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#14281D]/20" /><button type="button" onClick={() => removeUnit(unit.id)} aria-label={`Remove ${unit.title || 'unit'}`} className="text-gray-400 hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div>{unit.topics.map((topic: CurriculumTopic) => <div key={topic.id} className="ml-3 mb-3 p-2.5 rounded-xl bg-white border border-gray-200"><div className="flex items-center gap-2"><input aria-label="Topic name" value={topic.name} onChange={(event) => updateTopic(unit.id, topic.id, event.target.value)} placeholder="Topic name" className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#14281D]/20" /><button type="button" onClick={() => removeTopic(unit.id, topic.id)} aria-label={`Remove ${topic.name || 'topic'}`} className="text-gray-400 hover:text-rose-500 cursor-pointer"><Trash2 className="w-3 h-3" /></button></div><div className="mt-2 space-y-1">{topic.subtopics.map((subtopic, index) => <div key={`${topic.id}-sub-${index}`} className="flex items-center gap-1.5"><input aria-label="Subtopic name" value={subtopic} onChange={(event) => updateSubtopic(unit.id, topic.id, index, event.target.value)} placeholder="Subtopic (optional)" className="flex-1 px-2.5 py-1 rounded-lg border border-gray-100 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#14281D]/20" /><button type="button" onClick={() => removeSubtopic(unit.id, topic.id, index)} aria-label="Remove subtopic" className="text-gray-400 hover:text-rose-500 cursor-pointer"><X className="w-3 h-3" /></button></div>)}</div><button type="button" onClick={() => addSubtopic(unit.id, topic.id)} className="mt-2 text-[10px] font-bold text-[#14281D] hover:underline cursor-pointer">+ Add subtopic</button></div>)}<button type="button" onClick={() => addTopic(unit.id)} className="ml-3 text-[10px] font-bold text-[#14281D] hover:underline cursor-pointer">+ Add topic</button></div>)}</div><div className="mt-8 flex items-center justify-between pt-4 border-t border-gray-100"><button type="button" onClick={() => setStep('curriculum')} className="text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer">Back to sources</button><button type="button" onClick={handleConfirmCurriculum} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md"><CheckCircle2 className="w-4 h-4" />Confirm curriculum</button></div></div>}
      </div>
    </div>
  );
};
