import assert from 'node:assert/strict';
import test from 'node:test';
import type { TestRecord, TopicRecord } from '../types';
import {
  aggregateSubjectMastery,
  deriveRecurringMistakes,
  getTopicStatus,
  matchTopicIndex,
  normalizeTopicName,
  subjectStatus,
  topicMasteryFromEvidence,
} from './metrics';

const makeTopic = (overrides: Partial<TopicRecord> = {}): TopicRecord => ({
  id: 'topic-algebra',
  name: 'Algebra',
  subject: 'Mathematics',
  mastery: null,
  status: 'Not Enough Data',
  conceptUnderstanding: null,
  application: null,
  recall: null,
  history: [],
  aiInsight: '',
  mistakePatterns: [],
  ...overrides,
});

const makeTest = (
  id: string,
  date: string,
  mistakeType: 'concept' | 'careless' | 'question_understanding' = 'concept',
  topic = 'Algebra',
): TestRecord => ({
  id,
  title: `Assessment ${id}`,
  subject: 'Mathematics',
  subjectId: 'subject-math',
  date,
  score: 1,
  totalMarks: 2,
  percentage: 50,
  encouragement: '',
  mistakeSummary: { conceptMistakes: 1, carelessMistakes: 0, questionUnderstandingMistakes: 0, unidentified: 0 },
  questions: [{
    questionNumber: 'Q1', topic, topicId: 'topic-algebra', maxMarks: 2, scoredMarks: 1,
    mistakeType, diagnosis: 'The submitted response does not support the required step.',
    howToFix: 'Review the shown step and compare it with the course method.',
  }],
  topicBreakdown: [],
  nextTarget: { topic, topicId: 'topic-algebra', opportunityMarks: 1, headline: 'Review the recorded evidence.', recoveryPlan: [] },
});

test('topic mastery is derived from marks and a single isolated question remains Not Enough Data', () => {
  assert.equal(topicMasteryFromEvidence(makeTopic({
    mastery: 2,
    evidenceCount: 20,
    assessmentCount: 1,
    history: [{ date: '2026-01-01', mastery: 2, assessmentId: 'a1', earnedMarks: 0, possibleMarks: 8, questionCount: 1 }],
  })), null);
});

test('topic mastery uses sum of earned marks divided by sum of possible marks', () => {
  const topic = makeTopic({
    history: [
      { date: '2026-01-01', mastery: 99, assessmentId: 'a1', earnedMarks: 2, possibleMarks: 4, questionCount: 2 },
      { date: '2026-02-01', mastery: 99, assessmentId: 'a2', earnedMarks: 8, possibleMarks: 10, questionCount: 2 },
    ],
  });
  assert.equal(topicMasteryFromEvidence(topic), 71);
  assert.equal(getTopicStatus({ ...topic, mastery: 99 }), 'Developing');
});

test('an isolated mistake cannot make a topic weak when multiple supported questions were mostly correct', () => {
  const topic = makeTopic({
    history: [{ date: '2026-01-01', mastery: 0, assessmentId: 'a1', earnedMarks: 9, possibleMarks: 10, questionCount: 3 }],
  });
  assert.equal(topicMasteryFromEvidence(topic), 90);
  assert.equal(getTopicStatus({ ...topic, mastery: 0 }), 'Strong');
});

test('subject mastery is mark-weighted rather than averaging topics equally', () => {
  const smallTopic = makeTopic({ id: 'small', history: [{ date: '2026-01-01', mastery: 100, assessmentId: 'a1', earnedMarks: 1, possibleMarks: 1, questionCount: 2 }] });
  const largeTopic = makeTopic({ id: 'large', name: 'Calculus', history: [{ date: '2026-01-02', mastery: 0, assessmentId: 'a2', earnedMarks: 0, possibleMarks: 99, questionCount: 2 }] });
  assert.equal(aggregateSubjectMastery([smallTopic, largeTopic]), 1);
});

test('subject improvement compares aggregate marks within each assessment, not an unrelated topic history row', () => {
  const topics = [
    makeTopic({ id: 'topic-a', history: [{ date: '2026-01-01', mastery: 90, assessmentId: 'assessment-1', earnedMarks: 9, possibleMarks: 10, questionCount: 2 }] }),
    makeTopic({ id: 'topic-b', name: 'Geometry', history: [{ date: '2026-01-01', mastery: 0, assessmentId: 'assessment-1', earnedMarks: 0, possibleMarks: 10, questionCount: 2 }] }),
    makeTopic({ id: 'topic-c', name: 'Statistics', history: [{ date: '2026-02-01', mastery: 20, assessmentId: 'assessment-2', earnedMarks: 2, possibleMarks: 10, questionCount: 2 }] }),
  ];
  assert.equal(aggregateSubjectMastery(topics), 37);
  assert.equal(subjectStatus(topics), 'Needs Attention');
});

test('subject status reports Improving when the latest dated subject assessment aggregate rises', () => {
  const topics = [
    makeTopic({ id: 'topic-a', history: [
      { date: '2026-01-01', mastery: 40, assessmentId: 'assessment-1', earnedMarks: 4, possibleMarks: 10, questionCount: 2 },
      { date: '2026-02-01', mastery: 80, assessmentId: 'assessment-2', earnedMarks: 8, possibleMarks: 10, questionCount: 2 },
    ] }),
    makeTopic({ id: 'topic-b', name: 'Geometry', history: [
      { date: '2026-01-01', mastery: 60, assessmentId: 'assessment-1', earnedMarks: 6, possibleMarks: 10, questionCount: 2 },
      { date: '2026-02-01', mastery: 70, assessmentId: 'assessment-2', earnedMarks: 7, possibleMarks: 10, questionCount: 2 },
    ] }),
  ];
  assert.equal(subjectStatus(topics), 'Improving');
});

test('practice evidence requires repeated attempts and ten questions, then uses correct/total', () => {
  assert.equal(topicMasteryFromEvidence(makeTopic({
    practiceEvidence: { attempts: 2, totalQuestions: 9, correctAnswers: 8, bestPercentage: 100, lastPercentage: 80, lastDate: '2026-02-01' },
  })), null);
  assert.equal(topicMasteryFromEvidence(makeTopic({
    practiceEvidence: { attempts: 2, totalQuestions: 10, correctAnswers: 8, bestPercentage: 100, lastPercentage: 80, lastDate: '2026-02-01' },
  })), 80);
});

test('topic statuses require supported marks evidence and use the centralized thresholds', () => {
  assert.equal(getTopicStatus({ mastery: 95, evidenceCount: 3 }), 'Not Enough Data');
  assert.equal(getTopicStatus({ mastery: 95, history: [{ date: '2026-01-01', mastery: 95, assessmentId: 'a', earnedMarks: 19, possibleMarks: 20, questionCount: 3 }] }), 'Strong');
});

test('canonical IDs win and duplicate name-only matches are rejected', () => {
  assert.equal(normalizeTopicName('  Élan—A + B  '), 'élan a b');
  const duplicateNames = [
    { id: 'topic-one', name: 'Introduction' },
    { id: 'topic-two', name: 'Introduction' },
  ];
  assert.equal(matchTopicIndex(duplicateNames, { topic: 'Introduction' }), -1);
  assert.equal(matchTopicIndex(duplicateNames, { topic: 'Different model wording', topicId: 'topic-two' }), 1);
});

test('recurring mistakes require the same topic and category in distinct assessments', () => {
  const first = makeTest('assessment-1', '2026-01-01');
  assert.equal(deriveRecurringMistakes([first]).length, 0);
  assert.equal(deriveRecurringMistakes([first, { ...first }]).length, 0, 'duplicate IDs are one assessment');
  assert.equal(deriveRecurringMistakes([first, makeTest('assessment-2', '2026-02-01')]).length, 1);
  assert.equal(deriveRecurringMistakes([first, makeTest('assessment-2', '2026-02-01', 'careless')]).length, 0);
});
