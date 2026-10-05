import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeTestAnalysis } from './testAnalysis';

const subjectId = 'subject-math';
const unitId = `${subjectId}:unit-1`;
const topicId = `${subjectId}:topic-1`;
const curriculum = {
  subject: 'Mathematics',
  subjectId,
  totalUnits: 1,
  totalTopics: 1,
  units: [{
    id: unitId,
    title: 'Unit One',
    name: 'Unit One',
    topics: [{ id: topicId, name: 'Linear equations', subtopics: ['Solving'], subtopicIds: [`${subjectId}:subtopic-1`] }],
  }],
};

const question = (overrides: Record<string, unknown> = {}) => ({
  questionNumber: 'Q1',
  topic: 'Linear equations',
  topicId,
  subjectId,
  unitId,
  relatedSubtopics: ['Solving'],
  relatedSubtopicIds: [`${subjectId}:subtopic-1`],
  cognitiveCategory: 'application',
  maxMarks: 5,
  scoredMarks: 3,
  mistakeType: 'concept',
  diagnosis: 'The operation was applied inconsistently.',
  howToFix: 'Keep the same operation on both sides.',
  ...overrides,
});

const response = (overrides: Record<string, unknown> = {}) => ({
  coverage: 'full',
  score: 6,
  totalMarks: 10,
  questionsBreakdown: [question(), question({ questionNumber: 'Q2', maxMarks: 5, scoredMarks: 3 })],
  topicBreakdown: [{ topic: 'Linear equations', topicId, status: 'Strong', mastery: 99, lostMarks: 0, notes: 'Keep practising.' }],
  nextTarget: { topic: 'Linear equations', topicId, unitId, headline: 'Practise sign handling.', recoveryPlan: [] },
  ...overrides,
});

const submission = {
  mode: 'upload' as const,
  title: 'Algebra test',
  subject: 'Mathematics',
  subjectId,
  curriculum,
  fileBase64: 'AA==',
  mimeType: 'application/pdf',
  allowUploadedWork: true,
};

const timestamp = '2026-10-01T12:00:00.000Z';

test('score and topic signal are derived from question marks, not model percentages', () => {
  const { record } = normalizeTestAnalysis(response({ percentage: 100, topicBreakdown: [{ topic: 'Linear equations', topicId, status: 'Strong', mastery: 100, lostMarks: 0, notes: 'Keep practising.' }] }), submission, timestamp);
  assert.equal(record.coverage, 'full');
  assert.equal(record.score, 6);
  assert.equal(record.totalMarks, 10);
  assert.equal(record.percentage, 60);
  assert.equal(record.topicBreakdown[0].mastery, 60);
  assert.equal(record.topicBreakdown[0].status, 'Developing');
  assert.equal(record.date, timestamp);
});

test('partial evidence never claims a whole-test score or percentage', () => {
  const { record, analyzedMarks } = normalizeTestAnalysis(response({ coverage: 'partial', score: 6, totalMarks: 10, percentage: 60 }), submission, timestamp);
  assert.equal(record.coverage, 'partial');
  assert.equal(record.partialEvidence, true);
  assert.equal(record.score, null);
  assert.equal(record.totalMarks, null);
  assert.equal(record.percentage, null);
  assert.deepEqual(analyzedMarks, { earned: 6, possible: 10, questionCount: 2 });
});

test('duplicate or malformed question rows are excluded and force partial coverage', () => {
  const { record } = normalizeTestAnalysis(response({ questionsBreakdown: [question(), question()] }), submission, timestamp);
  assert.equal(record.coverage, 'partial');
  assert.equal(record.percentage, null);
  assert.equal(record.questions.length, 1);
  assert.equal(record.topicBreakdown[0].mastery, null);
});

test('questions with IDs outside the confirmed curriculum are not credited', () => {
  assert.throws(
    () => normalizeTestAnalysis(response({ questionsBreakdown: [question({ topicId: 'some-other-topic' }), question({ questionNumber: 'Q2', topicId: 'some-other-topic' })] }), submission, timestamp),
    /no validated question rows/,
  );
});

test('a recovery target must resolve to one validated topic ID', () => {
  assert.throws(() => normalizeTestAnalysis(response({ nextTarget: { topic: 'Other topic', topicId: 'missing', headline: 'Revise.' } }), submission, timestamp), /did not resolve to one validated topic/);
});
