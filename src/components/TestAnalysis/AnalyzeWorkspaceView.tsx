import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Bot,
  Sparkles,
  Loader2,
  Camera,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { submitTestAnalysis } from '../../services/testAnalysis';

export const AnalyzeWorkspaceView: React.FC = () => {
  const {
    subjects,
    profile,
    curriculums,
    addTestResult,
    setSelectedTestId,
    testHistory,
    latestTest,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'recent'>('upload');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || '');
  const [testTitle, setTestTitle] = useState('');
  const [testScore, setTestScore] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [rawTextNotes, setRawTextNotes] = useState('');
  const selectedSubjectRecord = subjects.find((subject) => subject.name === selectedSubject);
  const selectedSubjectId = selectedSubjectRecord?.id;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (profile.privacy?.useUploadedWork === false) { setErrorMessage('File sharing with AI is turned off. Enable it in Profile → AI & Privacy Controls, or use manual text entry.'); return; }
    setUploadedFileName(null);
    setUploadedFileBase64(null);
    setUploadedMimeType(null);
    setErrorMessage(null);
    if (file.size > 8 * 1024 * 1024) { setErrorMessage('The selected file exceeds the 8 MB upload limit.'); return; }
    const extensionMime: Record<string, string> = {
      pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    };
    const extension = file.name.toLowerCase().split('.').pop() || '';
    const mime = file.type || extensionMime[extension] || '';
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
      setErrorMessage('Choose a PDF, JPEG, PNG, WebP, or GIF file. HEIC and other formats are not supported yet.');
      return;
    }
    setUploadedFileName(file.name);
    setUploadedMimeType(mime);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
      if (!base64) { setErrorMessage('The selected file could not be read. No assessment was saved.'); return; }
      setUploadedFileBase64(base64);
    };
    reader.onerror = () => setErrorMessage('The selected file could not be read. Please choose a readable PDF or image.');
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    if (activeTab === 'recent') return;
    const mode = activeTab === 'manual' ? 'manual' : 'upload';
    const scoreNum = Number(testScore);
    const totalNum = Number(totalMarks);
    const hasManualEvidence = rawTextNotes.trim().length > 0;
    if (!selectedSubject.trim()) { setErrorMessage('Choose or enter a subject before analyzing.'); return; }
    if (activeTab === 'upload' && profile.privacy?.useUploadedWork === false) { setErrorMessage('File sharing with AI is turned off in Privacy settings. Paste the test evidence manually or enable file sharing first.'); return; }
    if (activeTab === 'upload' && !uploadedFileBase64) { setErrorMessage('Upload a readable PDF or image. The actual file content is required for analysis.'); return; }
    if (activeTab === 'manual' && !hasManualEvidence) { setErrorMessage('Add question details or marked feedback for manual analysis.'); return; }
    if ((testScore.trim() && (!Number.isFinite(scoreNum) || scoreNum < 0)) || (totalMarks.trim() && (!Number.isFinite(totalNum) || totalNum <= 0))) { setErrorMessage('Enter valid non-negative marks, or leave them blank when the paper does not show a score.'); return; }
    if (testScore.trim() && totalMarks.trim() && scoreNum > totalNum) { setErrorMessage('Scored marks cannot exceed total marks.'); return; }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisNotice(null);
    try {
      const result = await submitTestAnalysis({
        mode,
        title: testTitle.trim() || uploadedFileName || 'Assessment',
        subject: selectedSubject.trim(),
        subjectId: selectedSubjectId,
        notes: mode === 'upload' ? rawTextNotes : undefined,
        rawText: mode === 'manual' ? rawTextNotes : undefined,
        fileBase64: mode === 'upload' ? uploadedFileBase64 || undefined : undefined,
        mimeType: mode === 'upload' ? uploadedMimeType || undefined : undefined,
        totalMarks: totalMarks.trim() ? totalNum : undefined,
        score: testScore.trim() ? scoreNum : undefined,
        studentContext: profile,
        previousTests: testHistory,
        curriculum: curriculums[selectedSubject],
        personalizedAi: profile.privacy?.personalizedAi !== false,
        allowUploadedWork: mode === 'upload' && profile.privacy?.useUploadedWork !== false,
      });
      addTestResult(result.record);
      if (result.partial) {
        setAnalysisNotice(`Partial evidence saved: ${result.analyzedMarks.questionCount} validated question row${result.analyzedMarks.questionCount === 1 ? '' : 's'} (${result.analyzedMarks.earned}/${result.analyzedMarks.possible} marks). Overall score and percentage remain unavailable until the marks are fully verified.`);
      } else {
        setAnalysisNotice('Analysis complete. The validated assessment has been saved.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Analysis unavailable. No assessment was saved.');
    } finally { setIsAnalyzing(false); }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#14281D]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#14281D]">
            AI Diagnostic Engine
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
          Analyze New Test
        </h2>
        <p className="text-xs text-gray-500 mt-1 max-w-2xl">
          Submit test photos, PDFs, or marked question notes. REBOUND isolates concept gaps, careless slips, and builds your immediate recovery plan.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'bg-[#14281D] text-[#B4F04C] shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Upload Image / PDF</span>
        </button>

        <button
          onClick={() => { setActiveTab('manual'); setUploadedFileName(null); setUploadedFileBase64(null); setUploadedMimeType(null); }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'manual'
              ? 'bg-[#14281D] text-[#B4F04C] shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Manual Question Marks</span>
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'recent'
              ? 'bg-[#14281D] text-[#B4F04C] shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Latest Diagnosis ({latestTest?.percentage ?? 'Not Enough Data'})</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'recent' ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#254533]/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#14281D] bg-[#14281D]/5 px-2.5 py-0.5 rounded-full">
                {latestTest?.subject || 'No assessment'}
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                {latestTest?.title || 'No recent diagnosis'}
              </h3>
            </div>
            <button
              onClick={() => {
                if (latestTest) setSelectedTestId(latestTest.id);
              }}
              className="px-4 py-2 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-bold text-xs shadow-md cursor-pointer"
            >
              Open Full Diagnosis Breakdown →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-2xl font-black text-rose-700">
                {latestTest ? latestTest.mistakeSummary.conceptMistakes : '—'}
              </span>
              <p className="text-xs font-bold text-rose-900 mt-1">Concept Mistakes</p>
              <p className="text-[11px] text-rose-600">Core logic misunderstandings</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-2xl font-black text-amber-700">
                {latestTest ? latestTest.mistakeSummary.carelessMistakes : '—'}
              </span>
              <p className="text-xs font-bold text-amber-900 mt-1">Careless Slips</p>
              <p className="text-[11px] text-amber-600">Units & math arithmetic</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-2xl font-black text-emerald-850">
                {latestTest ? latestTest.mistakeSummary.questionUnderstandingMistakes : '—'}
              </span>
              <p className="text-xs font-bold text-emerald-900 mt-1">Question Misread</p>
              <p className="text-[11px] text-emerald-600">Missed key question constraints</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#254533]/10 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
              <input
                list="analysis-subject-options"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                placeholder="Choose or enter subject"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#14281D] bg-white"
              />
              <datalist id="analysis-subject-options">
                {subjects.map((subject) => <option key={subject.id || subject.name} value={subject.name} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Test / Paper Title</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#14281D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Score</label>
                <input
                   type="number"
                   min="0"
                   step="any"
                   value={testScore}
                   placeholder="Read from paper"
                   onChange={(e) => setTestScore(e.target.value)}
                   className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-[#14281D] focus:outline-none focus:ring-2 focus:ring-[#14281D]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={totalMarks}
                  placeholder="Read from paper"
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14281D]"
                />
              </div>
            </div>
          </div>

          {activeTab === 'upload' ? (
            /* Upload Dropzone */
            <div className="border-2 border-dashed border-gray-300 hover:border-[#14281D] rounded-3xl p-8 text-center transition-colors bg-gray-50/50">
              <input
                type="file"
                id="analysis-upload"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/jpeg,image/png,image/webp,image/gif"
                disabled={profile.privacy?.useUploadedWork === false}
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="analysis-upload"
                className={`flex flex-col items-center justify-center space-y-3 ${profile.privacy?.useUploadedWork === false ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center shadow-2xs">
                  {uploadedFileName ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {profile.privacy?.useUploadedWork === false ? 'File sharing is turned off in Privacy settings' : uploadedFileName || 'Choose an exam photo, scanned test paper, or PDF'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports PDF, JPG, PNG, WebP, or GIF up to 8 MB
                  </p>
                </div>

                <span className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#14281D] shadow-2xs hover:bg-[#F4F6F4]">
                  {uploadedFileName ? 'Choose Different File' : 'Browse Files'}
                </span>
              </label>
              {profile.privacy?.useUploadedWork === false && <p className="mt-3 text-xs text-amber-800">Enable file sharing under Profile → AI & Privacy Controls, or switch to manual text entry.</p>}
            </div>
          ) : (
            /* Manual Question Notes Input */
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                Question Details & Notes (Optional)
              </label>
              <textarea
                rows={4}
                value={rawTextNotes}
                onChange={(e) => setRawTextNotes(e.target.value)}
                placeholder="Paste question breakdown, marks lost, or teacher comments..."
                className="w-full p-4 rounded-2xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] focus:outline-none"
              />
            </div>
          )}

          {/* AI Grounding Notice */}
          <div className="p-4 rounded-2xl bg-[#F4F6F4] border border-[#254533]/20 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#14281D] shrink-0 mt-0.5" />
            <p className="text-xs text-[#14281D] leading-relaxed font-medium">
              REBOUND never invents information. If uploaded photos are blurry or lack sufficient question marks, REBOUND will explicitly report{' '}
              <span className="font-bold underline">&ldquo;Not Enough Data&rdquo;</span> instead of guessing.
            </p>
          </div>

          {errorMessage && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{errorMessage}</div>}
          {analysisNotice && <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">{analysisNotice}</div>}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-3 rounded-2xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-black text-sm shadow-md flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#B4F04C]" />
                  <span>Analyzing Questions with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Complete Diagnostics</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
