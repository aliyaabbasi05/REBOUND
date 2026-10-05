import {
  StudentProfile,
  SubjectRecord,
  TopicRecord,
  TestRecord,
  RecurringMistakeItem,
  SubjectCurriculum,
} from '../types';

export const INITIAL_PROFILE: StudentProfile = {
  name: '',
  email: '',
  school: '',
  grade: '',
  course: '',
  country: '',
  curriculum: '',
  avatarInitials: '',
  subjects: [],
  onboarded: false,
  streakDays: 0,
  streakDaysCompleted: [],
  learningGoals: [],
  privacy: {
    personalizedAi: true,
    useUploadedWork: true,
  },
};

export const INITIAL_TOPICS: TopicRecord[] = [];

export const INITIAL_SUBJECTS: SubjectRecord[] = [];

export const INITIAL_TEST_HISTORY: TestRecord[] = [];

export const INITIAL_RECURRING_MISTAKES: RecurringMistakeItem[] = [];

export const INITIAL_CURRICULUMS: Record<string, SubjectCurriculum> = {};
