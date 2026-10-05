import React, { useState } from 'react';
import {
  X,
  Upload,
  Camera,
  FileText,
  Sliders,
  Sparkles,
  Loader2,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { submitTestAnalysis } from '../../services/testAnalysis';

export const AnalyzeNewTestModal: React.FC = () => {
  const {
    isAnalyzeModalOpen,
    setIsAnalyzeModalOpen,
    subjects,
    profile,
    testHistory,
    addTestResult,
    curriculums,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || '');
  const [testTitle, setTestTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [scoredMarks, setScoredMarks] = useState('');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const selectedSubjectRecord = subjects.find((subject) => subject.name === selectedSubject);
  const selectedSubjectId = selectedSubjectRecord?.id;

  if (!isAnalyzeModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (profile.privacy?.useUploadedWork === false) { setErrorMessage('File sharing with AI is turned off. Enable it in Profile → AI & Privacy Controls, or use manual text entry.'); return; }
    setFileName(null);
    setFileBase64(null);
    setMimeType(null);
    setErrorMessage(null);
    if (file.size > 8 * 1024 * 1024) { setErrorMessage('The selected file exceeds the 8 MB upload limit.'); return; }
    const extensions: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
    const extension = file.name.toLowerCase().split('.').pop() || '';
    const type = file.type || extensions[extension] || '';
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type)) {
      setErrorMessage('Choose a PDF, JPEG, PNG, WebP, or GIF file. Other formats are not supported yet.');
      return;
    }
    setFileName(file.name);
    if (!testTitle) setTestTitle(file.name.replace(/\.[^/.]+$/, ''));
    setMimeType(type);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
      if (!base64) { setErrorMessage('The selected file could not be read. No assessment was saved.'); return; }
      setFileBase64(base64);
    };
    reader.onerror = () => setErrorMessage('The selected file could not be read. No assessment was saved.');
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    const mode = activeTab;
    if (!testTitle.trim()) { setErrorMessage('Please enter a test title.'); return; }
    if (mode === 'upload' && !fileBase64) { setErrorMessage('Upload a readable PDF or image. The actual file content is required for analysis.'); return; }
    if (mode === 'manual' && !notes.trim()) { setErrorMessage('Add marked questions or feedback for manual analysis.'); return; }
    if (!selectedSubject.trim()) { setErrorMessage('Choose or enter a subject before analyzing.'); return; }
    if (mode === 'upload' && profile.privacy?.useUploadedWork === false) { setErrorMessage('File sharing with AI is turned off in Privacy settings. Paste the test evidence manually or enable file sharing first.'); return; }
    const totalValue = totalMarks.trim() ? Number(totalMarks) : undefined;
    const scoreValue = scoredMarks.trim() ? Number(scoredMarks) : undefined;
    if ((totalValue !== undefined && (!Number.isFinite(totalValue) || totalValue <= 0)) || (scoreValue !== undefined && (!Number.isFinite(scoreValue) || scoreValue < 0)) || (scoreValue !== undefined && totalValue !== undefined && scoreValue > totalValue)) { setErrorMessage('Enter valid marks, or leave them blank when REBOUND should read them from the paper.'); return; }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisNotice(null);
    try {
      const result = await submitTestAnalysis({
        mode,
        title: testTitle.trim(),
        subject: selectedSubject.trim(),
        subjectId: selectedSubjectId,
        notes: mode === 'manual' ? notes : undefined,
        rawText: mode === 'manual' ? notes : undefined,
        fileBase64: mode === 'upload' ? fileBase64 || undefined : undefined,
        mimeType: mode === 'upload' ? mimeType || undefined : undefined,
        totalMarks: totalValue,
        score: scoreValue,
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
        setIsAnalyzeModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Analysis unavailable. No assessment was saved.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#254533]/20 overflow-hidden my-6">
        {/* Top Header */}
        <div className="p-6 sm:p-7 border-b border-[#254533]/20 flex items-center justify-between bg-[#14281D] text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#B4F04C]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B4F04C]">
                Real AI Diagnostic Pipeline
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Analyze Test Paper
            </h3>
            <p className="text-xs text-[#9BB0A3] mt-0.5">
              Upload your actual test paper, marked sheet, or digital assessment
            </p>
          </div>
          <button
            onClick={() => setIsAnalyzeModalOpen(false)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#9BB0A3] hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-6 sm:px-7 pt-4 border-b border-gray-100 flex items-center gap-2 overflow-x-auto bg-[#F4F6F4]/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'upload'
                ? 'bg-[#14281D] text-[#B4F04C] shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Test PDF / Image</span>
          </button>

          <button
            onClick={() => { setActiveTab('manual'); setFileName(null); setFileBase64(null); setMimeType(null); }}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'manual'
                ? 'bg-[#14281D] text-[#B4F04C] shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Photo / PDF Upload Area */}
          {activeTab === 'upload' && (
            <div className="p-6 border-2 border-dashed border-[#254533]/20 hover:border-[#14281D] rounded-3xl bg-[#FAF6EE]/60 text-center transition-colors">
              <input
                type="file"
                id="test-file-input"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/jpeg,image/png,image/webp,image/gif"
                disabled={profile.privacy?.useUploadedWork === false}
                onChange={handleFileUpload}
              />
              <label
                htmlFor="test-file-input"
                className={`flex flex-col items-center justify-center space-y-2 ${profile.privacy?.useUploadedWork === false ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#14281D]">
                    {profile.privacy?.useUploadedWork === false ? 'File sharing is turned off in Privacy settings' : fileName ? fileName : 'Upload marked test sheet, PDF or image'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    PDF, JPEG, PNG, WebP, or GIF · up to 8 MB
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-[#14281D] text-[#B4F04C] text-xs font-bold shadow-xs">
                  Choose File
                </span>
              </label>
            </div>
          )}

          {/* Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
              <input
                list="modal-subject-options"
                type="text"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                placeholder="Choose or enter your subject"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-[#14281D] focus:ring-2 focus:ring-[#14281D] focus:outline-none bg-white"
              />
              <datalist id="modal-subject-options">
                {subjects.map((subject) => <option key={subject.id || subject.name} value={subject.name} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Test Title</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#14281D] focus:outline-none"
                placeholder="e.g. Midterm Chapter Test"
              />
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Scored Marks</label>
              <input
                type="number"
                min="0"
                step="any"
                value={scoredMarks}
                placeholder="Read from paper"
                onChange={(e) => setScoredMarks(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-[#14281D] focus:ring-2 focus:ring-[#14281D] focus:outline-none"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#14281D] focus:outline-none"
              />
            </div>
          </div>

          {/* Test Questions & Student Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700">
                Additional Notes or Specific Mistake Feedback
              </label>
              <span className="text-[11px] text-gray-400">Optional</span>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lost marks in Q3 formula calculation, or Q5 misread question prompt..."
              className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#14281D] focus:outline-none bg-white"
            />
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#14281D]" />
              REBOUND classifies mistakes strictly based on evidence. Untested topics are preserved as &ldquo;Not Enough Data&rdquo;.
            </p>
          </div>

          {analysisNotice && <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">{analysisNotice}</div>}
          {errorMessage && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl font-medium border border-rose-200">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={() => setIsAnalyzeModalOpen(false)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-bold text-sm shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Deep Diagnosis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Diagnostic Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
