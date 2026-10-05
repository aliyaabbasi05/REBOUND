import {
  CognitiveCategory,
  MistakeType,
  RecurringMistakeItem,
  SubjectRecord,
  TestRecord,
  TopicRecord,
  TopicStatus,
} from '../types';

/** Keep topic classification in one place so ingestion and UI cannot disagree. */
const STATUS_THRESHOLDS = { strong: 80, developing: 60, needsPractice: 40 } as const;

type EvidenceHistory = NonNullable<TopicRecord['history']>;
type EvidenceTopic = Pick<TopicRecord, 'mastery' | 'history' | 'evidenceCount' | 'assessmentCount' | 'practiceEvidence'>;
type TopicRef = Pick<TopicRecord, 'id' | 'canonicalId' | 'name'>;

const normalizePercentage = (value: number): number => Math.max(0, Math.min(100, value));
const validPair = (earned: unknown, possible: unknown): earned is number =>
  typeof earned === 'number' && Number.isFinite(earned) && earned >= 0 &&
  typeof possible === 'number' && Number.isFinite(possible) && possible > 0 && earned <= possible;

export const normalizeTopicName = (value: string | null | undefined): string =>
  String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

const validAssessmentEvidence = (history: EvidenceHistory = []) => history.filter((entry) =>
  validPair(entry.earnedMarks, entry.possibleMarks) && (entry.questionCount ?? 0) > 0
);

const eligibleAssessmentTotals = (topic: EvidenceTopic) => {
  const rows = validAssessmentEvidence(topic.history ?? []);
  const questionCount = rows.reduce((sum, row) => sum + Math.max(0, row.questionCount ?? 0), 0);
  const assessmentIds = new Set(rows.map((row) => row.assessmentId || row.date));
  const sufficient = questionCount >= 2 || assessmentIds.size >= 2;
  return sufficient
    ? {
        earned: rows.reduce((sum, row) => sum + (row.earnedMarks ?? 0), 0),
        possible: rows.reduce((sum, row) => sum + (row.possibleMarks ?? 0), 0),
        questionCount,
      }
    : { earned: 0, possible: 0, questionCount };
};

const eligiblePracticeTotals = (topic: EvidenceTopic) => {
  const practice = topic.practiceEvidence;
  const total = Math.max(0, Number.isFinite(practice?.totalQuestions) ? practice!.totalQuestions : 0);
  const correct = Math.max(0, Math.min(total, Number.isFinite(practice?.correctAnswers) ? practice!.correctAnswers! : 0));
  return practice && practice.attempts >= 2 && total >= 10 && practice.correctAnswers !== undefined
    ? { earned: correct, possible: total, questionCount: total }
    : { earned: 0, possible: 0, questionCount: total };
};

export const topicEvidenceTotals = (topic: EvidenceTopic): { earned: number; possible: number; questionCount: number } => {
  const assessment = eligibleAssessmentTotals(topic);
  const practice = eligiblePracticeTotals(topic);
  return {
    // A mark from an assessment and a correct/incorrect practice question are
    // both recorded evidence units; the ratio remains an explicit weighted sum.
    earned: assessment.earned + practice.earned,
    possible: assessment.possible + practice.possible,
    questionCount: assessment.questionCount + practice.questionCount,
  };
};

export const topicEvidenceCount = (topic: EvidenceTopic): number => topicEvidenceTotals(topic).questionCount;

/** Compute only from validated earned/possible marks or sufficiently repeated quiz answers. */
export const topicMasteryFromEvidence = (topic: EvidenceTopic): number | null => {
  const { earned, possible } = topicEvidenceTotals(topic);
  if (!possible) return null;
  return Math.round(normalizePercentage((earned / possible) * 100));
};

export const hasSufficientTopicEvidence = (topic: EvidenceTopic): boolean => topicMasteryFromEvidence(topic) !== null;

const categoryEvidence = (topic: TopicRecord, category: Exclude<CognitiveCategory, 'not_enough_data'>): number | null => {
  const entries = (topic.cognitiveHistory ?? []).filter((entry) => entry.category === category && validPair(entry.earnedMarks, entry.possibleMarks));
  const count = entries.reduce((sum, entry) => sum + entry.questionCount, 0);
  const assessments = new Set(entries.map((entry) => entry.assessmentId));
  if (count < 2 && assessments.size < 2) return null;
  const possible = entries.reduce((sum, entry) => sum + entry.possibleMarks, 0);
  if (!possible) return null;
  return Math.round(normalizePercentage((entries.reduce((sum, entry) => sum + entry.earnedMarks, 0) / possible) * 100));
};

export const getTopicStatus = (topic: {
  mastery: number | null;
  history?: EvidenceHistory;
  evidenceCount?: number;
  assessmentCount?: number;
  practiceEvidence?: TopicRecord['practiceEvidence'];
}): TopicStatus => {
  const mastery = topicMasteryFromEvidence({ ...topic, history: topic.history ?? [] });
  if (mastery === null) return 'Not Enough Data';
  const rows = validAssessmentEvidence(topic.history ?? []);
  const previous = rows.length >= 2 ? rows[rows.length - 2].mastery : null;
  if (previous !== null && previous !== undefined && mastery > previous) return 'Improving';
  if (mastery >= STATUS_THRESHOLDS.strong) return 'Strong';
  if (mastery >= STATUS_THRESHOLDS.developing) return 'Developing';
  if (mastery >= STATUS_THRESHOLDS.needsPractice) return 'Needs Practice';
  return 'Needs Attention';
};

export const aggregateSubjectMastery = (topics: TopicRecord[]): number | null => {
  const rows = topics.map((topic) => topicEvidenceTotals(topic)).filter((row) => row.possible > 0);
  const possible = rows.reduce((sum, row) => sum + row.possible, 0);
  if (!possible) return null;
  return Math.round(normalizePercentage((rows.reduce((sum, row) => sum + row.earned, 0) / possible) * 100));
};

export const subjectStatus = (topics: TopicRecord[], mastery = aggregateSubjectMastery(topics)): TopicStatus => {
  if (mastery === null || !topics.some(hasSufficientTopicEvidence)) return 'Not Enough Data';
  const byAssessment = new Map<string, { date: string; earned: number; possible: number }>();
  for (const topic of topics) {
    for (const row of validAssessmentEvidence(topic.history ?? [])) {
      const assessmentId = row.assessmentId || row.date;
      const current = byAssessment.get(assessmentId) ?? { date: row.date, earned: 0, possible: 0 };
      current.date = row.date > current.date ? row.date : current.date;
      current.earned += row.earnedMarks ?? 0;
      current.possible += row.possibleMarks ?? 0;
      byAssessment.set(assessmentId, current);
    }
  }
  const assessments = [...byAssessment.values()]
    .filter((assessment) => assessment.possible > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (assessments.length >= 2) {
    const previous = assessments[assessments.length - 2];
    const latest = assessments[assessments.length - 1];
    if (latest.earned / latest.possible > previous.earned / previous.possible) return 'Improving';
  }
  if (mastery >= STATUS_THRESHOLDS.strong) return 'Strong';
  if (mastery >= STATUS_THRESHOLDS.developing) return 'Developing';
  if (mastery >= STATUS_THRESHOLDS.needsPractice) return 'Needs Practice';
  return 'Needs Attention';
};

/** Stable IDs win. Name fallback is allowed only when it resolves uniquely. */
export const matchTopicIndex = (
  topics: TopicRef[],
  candidate: { topic?: string; topicId?: string; canonicalId?: string },
): number => {
  const canonicalId = candidate.topicId || candidate.canonicalId;
  if (canonicalId) {
    return topics.findIndex((topic) => topic.id === canonicalId || topic.canonicalId === canonicalId);
  }
  const name = normalizeTopicName(candidate.topic);
  if (!name) return -1;
  const matches = topics.map((topic, index) => normalizeTopicName(topic.name) === name ? index : -1).filter((index) => index >= 0);
  return matches.length === 1 ? matches[0] : -1;
};

export const boundedPracticeEvidence = (
  previous: TopicRecord['practiceEvidence'], score: number, totalQuestions: number, date: string,
): NonNullable<TopicRecord['practiceEvidence']> => {
  const safeTotal = Math.max(0, Math.round(Number.isFinite(totalQuestions) ? totalQuestions : 0));
  const safeScore = Math.max(0, Math.min(safeTotal, Math.round(Number.isFinite(score) ? score : 0)));
  const percentage = safeTotal > 0 ? Math.round((safeScore / safeTotal) * 100) : 0;
  return {
    attempts: Math.max(0, previous?.attempts ?? 0) + 1,
    totalQuestions: Math.max(0, previous?.totalQuestions ?? 0) + safeTotal,
    correctAnswers: Math.max(0, previous?.correctAnswers ?? 0) + safeScore,
    bestPercentage: Math.max(0, Math.min(100, previous?.bestPercentage ?? 0), percentage),
    lastPercentage: percentage,
    lastDate: date,
  };
};

const isMistakeType = (value: MistakeType): boolean => value === 'concept' || value === 'careless' || value === 'question_understanding';

/** A pattern requires the same canonical topic/type in at least two distinct assessments. */
export const deriveRecurringMistakes = (tests: TestRecord[]): RecurringMistakeItem[] => {
  const groups = new Map<string, { topic: string; subject: string; subjectId: string; topicId: string; unitId?: string; mistakeType: MistakeType; description: string; occurrences: RecurringMistakeItem['occurrences']; assessments: Set<string> }>();
  for (const test of tests) {
    if (!test || typeof test !== 'object') continue;
    const assessmentId = test.id || `${test.title}:${test.date}`;
    for (const question of Array.isArray(test.questions) ? test.questions : []) {
      if (!question || !isMistakeType(question.mistakeType) || !test.subjectId || !question.topicId) continue;
      const key = `${test.subjectId}|${question.topicId}|${question.mistakeType}`;
      const existing = groups.get(key);
      const occurrence = { assessmentId, testTitle: test.title, date: test.date, question: question.questionNumber };
      if (existing) {
        if (!existing.assessments.has(assessmentId)) {
          existing.assessments.add(assessmentId);
          existing.occurrences.push(occurrence);
        }
        if (!existing.description && question.diagnosis) existing.description = question.diagnosis;
      } else {
        groups.set(key, {
          topic: question.topic, subject: test.subject, subjectId: test.subjectId, topicId: question.topicId, unitId: question.unitId,
          mistakeType: question.mistakeType,
          description: question.diagnosis || question.howToFix || 'Repeated mistake in stored assessment data.',
          occurrences: [occurrence], assessments: new Set([assessmentId]),
        });
      }
    }
  }
  return Array.from(groups.values()).filter((group) => group.assessments.size >= 2).map((group, index) => ({
    id: `recurring-${normalizeTopicName(group.subject)}-${normalizeTopicName(group.topic)}-${group.mistakeType}-${index}`,
    topic: group.topic, subject: group.subject, subjectId: group.subjectId, topicId: group.topicId, unitId: group.unitId,
    mistakeType: group.mistakeType,
    description: group.description, occurrences: group.occurrences,
  }));
};

export const normalizeSubject = (subject: SubjectRecord): SubjectRecord => {
  const topics = (Array.isArray(subject.topics) ? subject.topics : []).map((topic) => ({
    ...topic,
    mastery: topicMasteryFromEvidence(topic),
    status: getTopicStatus(topic),
    conceptUnderstanding: categoryEvidence(topic, 'concept'),
    application: categoryEvidence(topic, 'application'),
    recall: categoryEvidence(topic, 'recall'),
  }));
  const mastery = aggregateSubjectMastery(topics);
  return { ...subject, topics, mastery, status: subjectStatus(topics, mastery) };
};
