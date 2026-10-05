import {
  TestRecord,
  StudentProfile,
  SubjectRecord,
  PracticeQuestion,
  SubjectCurriculum,
} from '../types';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 200_000;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/markdown',
]);

function assertBoundedText(value: unknown, field: string, maximum: number): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > maximum) {
    throw new Error(`${field} is invalid or too large.`);
  }
  return value;
}

function validateUpload(fileBase64?: string, mimeType?: string) {
  if (fileBase64 === undefined && mimeType === undefined) return;
  if (typeof fileBase64 !== 'string' || typeof mimeType !== 'string') {
    throw new Error('A file upload requires both file content and MIME type.');
  }
  const mime = mimeType.trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) throw new Error('Unsupported upload MIME type.');
  const dataUrl = fileBase64.match(/^data:([^;,]+);base64,(.*)$/s);
  if (dataUrl && dataUrl[1].toLowerCase() !== mime) throw new Error('The upload MIME type does not match its content declaration.');
  const data = (dataUrl ? dataUrl[2] : fileBase64).replace(/\s/g, '');
  if (!data || data.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
    throw new Error('The uploaded file content is not valid base64.');
  }
  const byteLength = Math.floor((data.length * 3) / 4) - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
  if (byteLength <= 0 || byteLength > MAX_UPLOAD_BYTES) throw new Error('The uploaded file must be between 1 byte and 8 MB.');
  let bytes: Uint8Array;
  try {
    const decoded = atob(data);
    bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    throw new Error('The uploaded file content could not be decoded.');
  }
  const starts = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (mime === 'application/pdf' && new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error('The uploaded PDF content could not be verified.');
  if (mime === 'image/jpeg' && !starts(0xff, 0xd8, 0xff)) throw new Error('The uploaded JPEG content could not be verified.');
  if (mime === 'image/png' && !starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) throw new Error('The uploaded PNG content could not be verified.');
  if (mime === 'image/gif' && new TextDecoder().decode(bytes.slice(0, 6)) !== 'GIF87a' && new TextDecoder().decode(bytes.slice(0, 6)) !== 'GIF89a') throw new Error('The uploaded GIF content could not be verified.');
  if (mime === 'image/webp' && (new TextDecoder().decode(bytes.slice(0, 4)) !== 'RIFF' || new TextDecoder().decode(bytes.slice(8, 12)) !== 'WEBP')) throw new Error('The uploaded WebP content could not be verified.');
}

async function requestJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`API error ${res.status}: Server returned invalid JSON.`);
  }
  if (!res.ok || data?.error) {
    throw new Error(data?.message || `API error ${res.status}: Request failed.`);
  }
  return data as T;
}

function safeProfile(profile?: StudentProfile) {
  if (!profile) return undefined;
  // Names, email, school, avatar data, login state, and notification preferences are not needed by Gemini.
  return {
    grade: assertBoundedText(profile.grade, 'grade', 100),
    course: assertBoundedText(profile.course, 'course', 200),
    curriculum: assertBoundedText(profile.curriculum, 'curriculum', 200),
    learningGoals: Array.isArray(profile.learningGoals)
      ? profile.learningGoals.slice(0, 10).map((goal) => assertBoundedText(goal, 'learning goal', 200)).filter(Boolean)
      : undefined,
  };
}

function safeHistory(history?: TestRecord[]) {
  if (!history) return undefined;
  if (!Array.isArray(history) || history.length > 30) throw new Error('Test history is too large.');
  return history.map((test) => ({
    subject: assertBoundedText(test.subject, 'test subject', 200),
    subjectId: assertBoundedText(test.subjectId, 'test subjectId', 120),
    score: test.score,
    totalMarks: test.totalMarks,
    percentage: test.percentage,
    questions: Array.isArray(test.questions)
      ? test.questions.slice(0, 50).map((question) => ({
          topic: assertBoundedText(question.topic, 'question topic', 200),
          topicId: assertBoundedText(question.topicId, 'question topicId', 120),
          subjectId: assertBoundedText(question.subjectId, 'question subjectId', 120),
          unitId: assertBoundedText(question.unitId, 'question unitId', 120),
          relatedSubtopics: Array.isArray(question.relatedSubtopics) ? question.relatedSubtopics.slice(0, 20).map((item) => assertBoundedText(item, 'related subtopic', 300)).filter(Boolean) : [],
          relatedSubtopicIds: Array.isArray(question.relatedSubtopicIds) ? question.relatedSubtopicIds.slice(0, 20).map((item) => assertBoundedText(item, 'related subtopicId', 120)).filter(Boolean) : [],
          mistakeType: question.mistakeType,
          cognitiveCategory: question.cognitiveCategory,
          questionNumber: assertBoundedText(question.questionNumber, 'question number', 100),
          diagnosis: assertBoundedText(question.diagnosis, 'question diagnosis', 2_000),
          howToFix: assertBoundedText(question.howToFix, 'question howToFix', 2_000),
          maxMarks: question.maxMarks,
          scoredMarks: question.scoredMarks,
        }))
      : [],
    topicBreakdown: Array.isArray(test.topicBreakdown)
      ? test.topicBreakdown.slice(0, 50).map((topic) => ({
          topic: assertBoundedText(topic.topic, 'topic', 200),
          topicId: assertBoundedText(topic.topicId, 'topicId', 120),
          subjectId: assertBoundedText((topic as any).subjectId, 'topic subjectId', 120),
          unitId: assertBoundedText((topic as any).unitId, 'topic unitId', 120),
          mastery: topic.mastery,
          status: topic.status,
          lostMarks: topic.lostMarks,
        }))
      : [],
  }));
}

function safeCurriculums(curriculums?: Record<string, SubjectCurriculum>) {
  if (!curriculums || typeof curriculums !== 'object') return {};
  return Object.fromEntries(Object.entries(curriculums).slice(0, 30).map(([key, curriculum]) => [key, {
    subject: assertBoundedText(curriculum.subject, 'curriculum subject', 200),
    subjectId: assertBoundedText(curriculum.subjectId, 'curriculum subjectId', 120),
    totalUnits: curriculum.totalUnits,
    totalTopics: curriculum.totalTopics,
    units: Array.isArray(curriculum.units) ? curriculum.units.slice(0, 100).map((unit) => ({
      id: assertBoundedText(unit.id, 'unit id', 120), title: assertBoundedText(unit.title, 'unit title', 300),
      topics: Array.isArray(unit.topics) ? unit.topics.slice(0, 100).map((topic) => ({
        id: assertBoundedText(topic.id, 'topic id', 120), name: assertBoundedText(topic.name, 'topic name', 300),
        subtopics: Array.isArray(topic.subtopics) ? topic.subtopics.slice(0, 100).map((item) => assertBoundedText(item, 'subtopic', 300)).filter(Boolean) : [],
        subtopicIds: Array.isArray(topic.subtopicIds) ? topic.subtopicIds.slice(0, 100).map((item) => assertBoundedText(item, 'subtopicId', 120)).filter(Boolean) : [],
      })) : [],
    })) : [],
  }]));
}

function safeSubjects(subjects?: SubjectRecord[]) {
  if (!Array.isArray(subjects)) return [];
  return subjects.slice(0, 30).map((subject) => ({
    id: assertBoundedText(subject.id, 'subject id', 120), name: assertBoundedText(subject.name, 'subject name', 200), status: subject.status, mastery: subject.mastery,
    topics: Array.isArray(subject.topics) ? subject.topics.slice(0, 50).map((topic) => ({ id: assertBoundedText(topic.id, 'topic id', 120), name: assertBoundedText(topic.name, 'topic name', 200), topicId: assertBoundedText(topic.canonicalId || topic.id, 'topicId', 120), unitId: assertBoundedText(topic.unitId, 'unitId', 120), status: topic.status, mastery: topic.mastery })) : [],
  }));
}

function safePracticeHistory(history?: any[]) {
  if (!Array.isArray(history)) return [];
  return history.slice(0, 30).map((item: any) => ({
    subject: assertBoundedText(item?.subject, 'practice subject', 200), subjectId: assertBoundedText(item?.subjectId, 'practice subjectId', 120), topic: assertBoundedText(item?.topic, 'practice topic', 200), topicId: assertBoundedText(item?.topicId, 'practice topicId', 120), unitId: assertBoundedText(item?.unitId, 'practice unitId', 120),
    score: item?.score, totalQuestions: item?.totalQuestions, date: assertBoundedText(item?.date, 'practice date', 80),
    questionResults: Array.isArray(item?.questionResults) ? item.questionResults.slice(0, 50).map((result: any) => ({ questionId: assertBoundedText(result?.questionId, 'question result id', 120), selectedIndex: result?.selectedIndex, correctIndex: result?.correctIndex, isCorrect: result?.isCorrect })) : [],
  }));
}

export async function analyzeTestWithAI(payload: {
  testData: any;
  subject: string;
  totalMarks?: number;
  scoredMarks?: number;
  studentContext?: StudentProfile;
  previousTests?: TestRecord[];
  fileBase64?: string;
  mimeType?: string;
  rawText?: string;
  curriculum?: SubjectCurriculum;
  personalizedAi?: boolean;
  allowUploadedWork?: boolean;
}) {
  if (payload.fileBase64 && payload.allowUploadedWork !== true) throw new Error('File sharing with AI is turned off in Privacy settings.');
  validateUpload(payload.fileBase64, payload.mimeType);
  const rawText = assertBoundedText(payload.rawText, 'rawText', MAX_TEXT_LENGTH);
  const notes = assertBoundedText(payload.testData?.notes, 'testData.notes', MAX_TEXT_LENGTH);
  const personalizedAi = payload.personalizedAi !== false;
  if (!payload.fileBase64 && (!rawText || rawText.trim().length < 12) && (!notes || notes.trim().length < 12)) {
    throw new Error('Not Enough Data: submit the actual test PDF/image or substantive test text. A filename alone cannot be analyzed.');
  }
  const safeTestData = payload.testData && typeof payload.testData === 'object'
    ? {
        notes,
        totalMarks: payload.totalMarks,
        scoredMarks: payload.scoredMarks,
      }
    : { notes, totalMarks: payload.totalMarks, scoredMarks: payload.scoredMarks };
  return requestJson<any>('/api/gemini/analyze-test', {
    subject: payload.subject,
    totalMarks: payload.totalMarks,
    scoredMarks: payload.scoredMarks,
    fileBase64: payload.fileBase64,
    mimeType: payload.mimeType,
    curriculum: payload.curriculum,
    personalizedAi,
    allowUploadedWork: payload.allowUploadedWork === true,
    testData: safeTestData,
    studentContext: personalizedAi ? safeProfile(payload.studentContext) : {},
    previousTests: personalizedAi ? safeHistory(payload.previousTests) : [],
    rawText,
  });
}

export async function extractCurriculumWithAI(payload: {
  rawText?: string;
  subject: string;
  grade?: string;
  course?: string;
  fileBase64?: string;
  mimeType?: string;
  personalizedAi?: boolean;
  allowUploadedWork?: boolean;
}): Promise<SubjectCurriculum> {
  if (payload.fileBase64 && payload.allowUploadedWork !== true) throw new Error('File sharing with AI is turned off in Privacy settings.');
  validateUpload(payload.fileBase64, payload.mimeType);
  const rawText = assertBoundedText(payload.rawText, 'rawText', MAX_TEXT_LENGTH);
  if (!payload.fileBase64 && (!rawText || rawText.trim().length < 12)) {
    throw new Error('Not Enough Data: submit the actual syllabus PDF/image or substantive syllabus text.');
  }
  return requestJson<SubjectCurriculum>('/api/gemini/extract-curriculum', {
    subject: payload.subject,
    grade: payload.personalizedAi === false ? '' : payload.grade,
    course: payload.personalizedAi === false ? '' : payload.course,
    fileBase64: payload.fileBase64,
    mimeType: payload.mimeType,
    personalizedAi: payload.personalizedAi !== false,
    allowUploadedWork: payload.allowUploadedWork === true,
    rawText,
  });
}

export async function askAICoach(payload: {
  messages: { role: string; content: string }[];
  studentProfile?: StudentProfile;
  currentFocus?: any;
  subjects?: SubjectRecord[];
  testHistory?: TestRecord[];
  recurringMistakes?: any[];
  curriculums?: Record<string, SubjectCurriculum>;
  activeRecoveryPlan?: any;
  practiceHistory?: any[];
}): Promise<{ reply: string }> {
  if (!Array.isArray(payload.messages) || payload.messages.length > 40) throw new Error('Conversation is too large.');
  const messages = payload.messages.map((message) => {
    if (!['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > 4_000) {
      throw new Error('Conversation contains an invalid message.');
    }
    return { role: message.role, content: message.content };
  });
  const personalizedAi = payload.studentProfile?.privacy?.personalizedAi !== false;
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const requestMessages = personalizedAi ? messages : latestUserMessage ? [latestUserMessage] : [];
  return requestJson<{ reply: string }>('/api/gemini/coach-chat', {
    messages: requestMessages,
    personalizedAi,
    subjects: personalizedAi ? safeSubjects(payload.subjects) : [],
    currentFocus: personalizedAi && payload.currentFocus && typeof payload.currentFocus === 'object' ? {
      subject: assertBoundedText(payload.currentFocus.subject, 'focus subject', 200), subjectId: assertBoundedText(payload.currentFocus.subjectId, 'focus subjectId', 120), topic: assertBoundedText(payload.currentFocus.topic, 'focus topic', 200), topicId: assertBoundedText(payload.currentFocus.topicId, 'focus topicId', 120), unitId: assertBoundedText(payload.currentFocus.unitId, 'focus unitId', 120),
    } : {},
    testHistory: personalizedAi ? safeHistory(payload.testHistory) : [],
    recurringMistakes: personalizedAi ? payload.recurringMistakes : [],
    curriculums: personalizedAi ? safeCurriculums(payload.curriculums) : {},
    activeRecoveryPlan: personalizedAi && payload.activeRecoveryPlan && typeof payload.activeRecoveryPlan === 'object' ? {
      subject: assertBoundedText(payload.activeRecoveryPlan.subject, 'recovery subject', 200), subjectId: assertBoundedText(payload.activeRecoveryPlan.subjectId, 'recovery subjectId', 120), topic: assertBoundedText(payload.activeRecoveryPlan.topic, 'recovery topic', 200), topicId: assertBoundedText(payload.activeRecoveryPlan.topicId, 'recovery topicId', 120), unitId: assertBoundedText(payload.activeRecoveryPlan.unitId, 'recovery unitId', 120),
      steps: Array.isArray(payload.activeRecoveryPlan.steps) ? payload.activeRecoveryPlan.steps.slice(0, 4).map((step: any) => ({ stepNumber: step?.stepNumber, title: assertBoundedText(step?.title, 'recovery title', 300), detail: assertBoundedText(step?.detail, 'recovery detail', 2_000), status: step?.status, subjectId: assertBoundedText(step?.subjectId, 'step subjectId', 120), topicId: assertBoundedText(step?.topicId, 'step topicId', 120), unitId: assertBoundedText(step?.unitId, 'step unitId', 120) })) : [],
    } : {},
    practiceHistory: personalizedAi ? safePracticeHistory(payload.practiceHistory) : [],
  });
}

export async function generatePracticeQuestions(payload: {
  topic: string;
  subject: string;
  subjectId?: string;
  topicId?: string;
  unitId?: string;
  mistakeFocus?: string;
  relevantMistakes?: any[];
  count?: number;
  curriculum?: SubjectCurriculum;
  personalizedAi?: boolean;
}): Promise<{ topic: string; topicId?: string; questions: PracticeQuestion[] }> {
  const count = payload.count === undefined ? 5 : payload.count;
  if (count !== 5) throw new Error('Practice question count must be exactly 5.');
  return requestJson<{ topic: string; topicId?: string; questions: PracticeQuestion[] }>('/api/gemini/generate-practice', {
    topic: payload.topic,
    subject: payload.subject,
    subjectId: payload.subjectId,
    topicId: payload.topicId,
    unitId: payload.unitId,
    curriculum: payload.curriculum,
    personalizedAi: payload.personalizedAi !== false,
    mistakeFocus: payload.personalizedAi === false ? undefined : assertBoundedText(payload.mistakeFocus, 'mistakeFocus', 500),
    relevantMistakes: payload.personalizedAi === false ? [] : Array.isArray(payload.relevantMistakes)
      ? payload.relevantMistakes.slice(0, 10).map((mistake: any) => ({
          topic: assertBoundedText(mistake?.topic, 'mistake topic', 200),
          mistakeType: assertBoundedText(mistake?.mistakeType, 'mistake type', 40),
          description: assertBoundedText(mistake?.description, 'mistake description', 500),
          occurrences: Array.isArray(mistake?.occurrences) ? mistake.occurrences.length : Number(mistake?.occurrences) || 0,
        }))
      : [],
    count,
  });
}
