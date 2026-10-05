import { analyzeTestWithAI } from './api';
import { getTopicStatus, normalizeTopicName } from '../domain/metrics';
import {
  MistakeType,
  QuestionDiagnosis,
  StudentProfile,
  SubjectCurriculum,
  TestRecord,
} from '../types';

export type TestAnalysisMode = 'upload' | 'manual';

export interface TestAnalysisSubmission {
  mode: TestAnalysisMode;
  title: string;
  subject: string;
  subjectId?: string;
  curriculum?: SubjectCurriculum;
  notes?: string;
  rawText?: string;
  fileBase64?: string;
  mimeType?: string;
  score?: number;
  totalMarks?: number;
  studentContext?: StudentProfile;
  previousTests?: TestRecord[];
  personalizedAi?: boolean;
  allowUploadedWork?: boolean;
}

export interface NormalizedTestAnalysis {
  record: TestRecord;
  partial: boolean;
  analyzedMarks: { earned: number; possible: number; questionCount: number };
}

const MISTAKE_TYPES: MistakeType[] = ['concept', 'careless', 'question_understanding', 'correct', 'not_enough_data'];
const EPSILON = 0.01;

const text = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value.trim() : undefined;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const boundedMarks = (value: unknown, maximum?: number): value is number => finite(value) && value >= 0 && (maximum === undefined || value <= maximum);
const asObject = (value: unknown): Record<string, any> | undefined => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : undefined;
const closeEnough = (left: number, right: number) => Math.abs(left - right) <= EPSILON;

function normaliseQuestions(raw: Record<string, any>, subjectId?: string): QuestionDiagnosis[] {
  const candidates = Array.isArray(raw.questionsBreakdown) ? raw.questionsBreakdown : Array.isArray(raw.questions) ? raw.questions : [];
  const seenQuestionNumbers = new Set<string>();
  return candidates.flatMap((candidate: any) => {
    const row = asObject(candidate) ?? {};
    const questionNumber = text(row?.questionNumber ?? row?.question ?? row?.id);
    const topic = text(row?.topic);
    const maxMarks = row?.maxMarks;
    const scoredMarks = row?.scoredMarks;
    const mistakeType = MISTAKE_TYPES.includes(row?.mistakeType) ? row.mistakeType : undefined;
    const diagnosis = text(row?.diagnosis);
    const howToFix = text(row?.howToFix);
    const questionKey = questionNumber?.trim().toLocaleLowerCase();
    // A row is evidence only when its identity, marks, and diagnostic text are all present and reconciled.
    if (!questionNumber || !topic || !boundedMarks(maxMarks) || maxMarks <= 0 || !boundedMarks(scoredMarks, maxMarks) || !mistakeType || !diagnosis || !howToFix || !questionKey || seenQuestionNumbers.has(questionKey)) return [];
    seenQuestionNumbers.add(questionKey);
    return [{
      questionNumber,
      topic,
      topicId: text(row?.topicId),
      subjectId: text(row?.subjectId) || subjectId,
      unitId: text(row?.unitId),
      relatedSubtopics: Array.isArray(row?.relatedSubtopics) ? row.relatedSubtopics.map(text).filter((item): item is string => Boolean(item)) : [],
      relatedSubtopicIds: Array.isArray(row?.relatedSubtopicIds) ? row.relatedSubtopicIds.map(text).filter((item): item is string => Boolean(item)) : [],
      cognitiveCategory: ['concept', 'application', 'recall', 'not_enough_data'].includes(row?.cognitiveCategory) ? row.cognitiveCategory : undefined,
      maxMarks,
      scoredMarks,
      mistakeType,
      diagnosis,
      howToFix,
    } satisfies QuestionDiagnosis];
  });
}

function normaliseTopics(raw: Record<string, any>, questions: QuestionDiagnosis[], date: string): TestRecord['topicBreakdown'] {
  const candidates = Array.isArray(raw.topicBreakdown) ? raw.topicBreakdown : [];
  const groups = new Map<string, QuestionDiagnosis[]>();
  for (const question of questions) {
    const key = question.topicId || normalizeTopicName(question.topic);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), question]);
  }
  return [...groups.values()].flatMap((rows) => {
    const first = rows[0];
    const earnedMarks = rows.reduce((sum, row) => sum + row.scoredMarks, 0);
    const possibleMarks = rows.reduce((sum, row) => sum + row.maxMarks, 0);
    if (!first || possibleMarks <= 0) return [];
    const mastery = rows.length >= 2 ? Math.round((earnedMarks / possibleMarks) * 100) : null;
    const history = [{ date, assessmentId: 'current', mastery: mastery ?? 0, earnedMarks, possibleMarks, questionCount: rows.length }];
    const status = getTopicStatus({ mastery, history });
    const noteCandidates = candidates.flatMap((candidate: any) => {
      const row = asObject(candidate) ?? {};
      const candidateTopic = text(row.topic);
      const exactId = first.topicId && text(row.topicId) === first.topicId;
      const uniqueName = !first.topicId && candidateTopic && normalizeTopicName(candidateTopic) === normalizeTopicName(first.topic) &&
        candidates.filter((item: any) => normalizeTopicName(text(asObject(item)?.topic) || '') === normalizeTopicName(first.topic)).length === 1;
      const notes = text(row.notes);
      return (exactId || uniqueName) && notes ? [notes] : [];
    });
    return [{
      topic: first.topic,
      topicId: first.topicId,
      canonicalId: first.topicId,
      unitId: first.unitId,
      evidenceCount: rows.length,
      mastery,
      status,
      lostMarks: Math.max(0, possibleMarks - earnedMarks),
      notes: noteCandidates[0] || `Recorded ${rows.length} question${rows.length === 1 ? '' : 's'}: ${earnedMarks} of ${possibleMarks} marks earned.`,
    }];
  });
}

function summaryFromEvidence(questions: QuestionDiagnosis[]): TestRecord['mistakeSummary'] {
  return questions.reduce((summary, question) => {
    if (question.mistakeType === 'concept') summary.conceptMistakes += 1;
    else if (question.mistakeType === 'careless') summary.carelessMistakes += 1;
    else if (question.mistakeType === 'question_understanding') summary.questionUnderstandingMistakes += 1;
    else if (question.mistakeType === 'not_enough_data') summary.unidentified += 1;
    return summary;
  }, { conceptMistakes: 0, carelessMistakes: 0, questionUnderstandingMistakes: 0, unidentified: 0 });
}

function normaliseNextTarget(raw: Record<string, any>, questions: QuestionDiagnosis[], topics: TestRecord['topicBreakdown'], subjectId?: string, curriculum?: SubjectCurriculum) {
  const source = asObject(raw.nextTarget);
  const requestedId = text(source?.topicId);
  const requestedName = text(source?.topic);
  const matchingQuestions = requestedId
    ? questions.filter((question) => question.topicId === requestedId)
    : questions.filter((question) => normalizeTopicName(question.topic) === normalizeTopicName(requestedName));
  const targetKeys = new Set(matchingQuestions.map((question) => question.topicId || normalizeTopicName(question.topic)));
  if (!matchingQuestions.length || targetKeys.size !== 1) throw new Error('Not Enough Data: the recovery target did not resolve to one validated topic. No assessment was saved.');
  const evidence = matchingQuestions[0];
  if (curriculum && (!evidence.topicId || !evidence.unitId)) throw new Error('Not Enough Data: the recovery target is missing its confirmed curriculum IDs. No assessment was saved.');
  if (source?.unitId && evidence.unitId && source.unitId !== evidence.unitId) throw new Error('The recovery plan unit does not match the validated topic. No assessment was saved.');
  const topic = evidence.topic;
  const headline = text(source?.headline) || (questions[0]?.howToFix) || (topics[0]?.notes);
  if (!topic || !headline) throw new Error('Not Enough Data: no validated diagnostic target was returned. No assessment was saved.');
  const plan = Array.isArray(source?.recoveryPlan) ? source.recoveryPlan.flatMap((candidate: any, index: number) => {
    const row = asObject(candidate) ?? {};
    const title = text(row?.title);
    const detail = text(row?.detail);
    const status = ['not_started', 'in_progress', 'completed'].includes(row?.status) ? row.status : undefined;
    if (!title || !detail || !status) return [];
    return [{ stepNumber: finite(row?.stepNumber) ? row.stepNumber : index + 1, title, detail, status,
      subjectId, topicId: evidence.topicId, unitId: evidence.unitId }];
  }) : [];
  const evidenceTopic = topics.find((item) => evidence.topicId ? item.topicId === evidence.topicId : normalizeTopicName(item.topic) === normalizeTopicName(evidence.topic));
  return {
    topic,
    subjectId,
    topicId: evidence.topicId,
    unitId: evidence.unitId,
    opportunityMarks: evidenceTopic?.lostMarks ?? 0,
    headline,
    recoveryPlan: plan,
  };
}

export function normalizeTestAnalysis(rawResult: unknown, submission: TestAnalysisSubmission, now = new Date().toISOString()): NormalizedTestAnalysis {
  const raw = asObject(rawResult)?.analysis && asObject(asObject(rawResult)?.analysis) || asObject(rawResult);
  if (!raw) throw new Error('Not Enough Data: the analysis response was empty. No assessment was saved.');
  const subject = text(submission.subject);
  if (!subject) throw new Error('Choose or enter a subject before analyzing.');
  if (submission.curriculum && normalizeTopicName(submission.curriculum.subject) !== normalizeTopicName(subject)) {
    throw new Error('The selected subject does not match the confirmed curriculum. No assessment was saved.');
  }
  if (submission.curriculum?.subjectId && submission.subjectId && submission.curriculum.subjectId !== submission.subjectId) {
    throw new Error('The selected subject ID does not match the confirmed curriculum. No assessment was saved.');
  }
  const rawQuestionCandidates = Array.isArray(raw.questionsBreakdown) ? raw.questionsBreakdown : Array.isArray(raw.questions) ? raw.questions : [];
  const parsedQuestions = normaliseQuestions(raw, submission.subjectId);
  const curriculumTopics = submission.curriculum?.units.flatMap((unit) => unit.topics.map((topic) => ({ unit, topic }))) ?? [];
  const questions = parsedQuestions.filter((question) => {
    if (question.subjectId && submission.subjectId && question.subjectId !== submission.subjectId) return false;
    if (!submission.curriculum) return true;
    if (!question.topicId) return false;
    const entry = curriculumTopics.find(({ topic }) => topic.id === question.topicId);
    if (!entry || (question.unitId && question.unitId !== entry.unit.id)) return false;
    const availableSubtopicIds = new Set(entry.topic.subtopicIds ?? []);
    return (question.relatedSubtopicIds ?? []).every((id) => availableSubtopicIds.has(id));
  });
  if (!questions.length) throw new Error('Not Enough Data: no validated question rows with marks were returned. No assessment was saved.');
  const uniqueQuestionCount = new Set(questions.map((question) => question.questionNumber.trim().toLocaleLowerCase())).size;
  const everyQuestionValidated = questions.length === rawQuestionCandidates.length && uniqueQuestionCount === questions.length;
  const topics = normaliseTopics(raw, questions, now);
  const analyzedMarks = {
    earned: questions.reduce((sum, question) => sum + question.scoredMarks, 0),
    possible: questions.reduce((sum, question) => sum + question.maxMarks, 0),
    questionCount: questions.length,
  };

  const requestedCoverage = raw.coverage === 'full' || raw.coverage === 'partial' || raw.coverage === 'unclear' ? raw.coverage : undefined;
  const score = finite(raw.score) ? raw.score : finite(submission.score) ? submission.score : requestedCoverage === 'full' ? analyzedMarks.earned : undefined;
  const totalMarks = finite(raw.totalMarks) ? raw.totalMarks : finite(submission.totalMarks) ? submission.totalMarks : requestedCoverage === 'full' ? analyzedMarks.possible : undefined;
  const computedPercentage = boundedMarks(score) && boundedMarks(totalMarks) && totalMarks > 0 && score <= totalMarks
    ? Math.round((score / totalMarks) * 100)
    : undefined;
  const submittedMarksMatch = (submission.score === undefined || !finite(raw.score) || closeEnough(raw.score, submission.score)) &&
    (submission.totalMarks === undefined || !finite(raw.totalMarks) || closeEnough(raw.totalMarks, submission.totalMarks));
  const validOverall = submittedMarksMatch && boundedMarks(score) && boundedMarks(totalMarks) && totalMarks > 0 && score <= totalMarks;
  const rowsReconcile = validOverall && closeEnough(analyzedMarks.earned, score) && closeEnough(analyzedMarks.possible, totalMarks);
  const modelPercentageDisagrees = finite(raw.percentage) && validOverall && !closeEnough(raw.percentage, computedPercentage!);
  const isFull = requestedCoverage !== 'partial' && requestedCoverage !== 'unclear' && everyQuestionValidated && rowsReconcile;
  const coverage = isFull ? 'full' : (requestedCoverage === 'unclear' ? 'unclear' : 'partial');
  const nextTarget = normaliseNextTarget(raw, questions, topics, submission.subjectId, submission.curriculum);
  const sourceRecurring = asObject(raw.recurringPattern);
  const recurringPattern = sourceRecurring && typeof sourceRecurring.detected === 'boolean' && text(sourceRecurring.message) && text(sourceRecurring.topic)
    ? { detected: sourceRecurring.detected, message: sourceRecurring.message, topic: sourceRecurring.topic }
    : undefined;
  const coverageNotes = text(raw.coverageNotes) || (!isFull
    ? 'Only validated question-level evidence was saved; overall marks were not fully reconciled.'
    : modelPercentageDisagrees ? 'The displayed percentage was recomputed from validated earned and possible marks.' : undefined);

  const record: TestRecord = {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: text(submission.title) || 'Assessment analysis',
    subject,
    subjectId: submission.subjectId,
    date: now,
    score: isFull ? score : null,
    totalMarks: isFull ? totalMarks : null,
    percentage: isFull ? computedPercentage! : null,
    coverage,
    partialEvidence: !isFull,
    analyzedMarks,
    coverageNotes,
    encouragement: text(raw.encouragement) || '',
    mistakeSummary: summaryFromEvidence(questions),
    questions,
    topicBreakdown: topics,
    recurringPattern,
    nextTarget,
  };
  return { record, partial: !isFull, analyzedMarks };
}

export async function submitTestAnalysis(submission: TestAnalysisSubmission): Promise<NormalizedTestAnalysis> {
  const mode = submission.mode;
  const notes = text(submission.notes);
  const rawText = text(submission.rawText);
  if (mode === 'upload') {
    if (!submission.fileBase64 || !text(submission.mimeType)) throw new Error('Upload a readable PDF or image. The actual file content is required for analysis.');
    if (submission.allowUploadedWork !== true) throw new Error('File sharing with AI is turned off in Privacy settings.');
  }
  if (mode === 'manual' && !rawText && !notes) throw new Error('Add question details or marked feedback for manual analysis.');
  const payload = {
    testData: { title: text(submission.title), notes, totalMarks: submission.totalMarks, scoredMarks: submission.score },
    subject: submission.subject.trim(),
    subjectId: submission.subjectId,
    totalMarks: submission.totalMarks,
    scoredMarks: submission.score,
    studentContext: submission.studentContext,
    previousTests: submission.previousTests,
    curriculum: submission.curriculum,
    confirmedCurriculum: submission.curriculum,
    fileBase64: mode === 'upload' ? submission.fileBase64 : undefined,
    mimeType: mode === 'upload' ? submission.mimeType : undefined,
    rawText: mode === 'manual' ? rawText : undefined,
    personalizedAi: submission.personalizedAi !== false,
    allowUploadedWork: mode === 'upload' && submission.allowUploadedWork === true,
  };
  const result = await analyzeTestWithAI(payload as Parameters<typeof analyzeTestWithAI>[0]);
  return normalizeTestAnalysis(result, submission);
}
