import type { StaticImageData } from 'next/image';

export type ProblemQuestionType = 'shortAnswer' | 'multipleChoice';

export type ProblemGradingMode = 'auto' | 'self';

export type ProblemSolveStatus = 'correct' | 'incorrect' | 'pending';

export type ProblemQuestionStatus =
  | 'notStarted'
  | 'correct'
  | 'incorrect'
  | 'skipped'
  | 'awaitingSelfGrade';

export type ProblemResultStatus = ProblemQuestionStatus;

export type ProblemChoice = {
  id: string;
  label: string;
};

export type ProblemAnswer = {
  selectedChoiceId?: string;
  answer?: string;
};

export type ProblemQuestionListItem = {
  id: string;
  no: number;
  title: string;
  type: ProblemQuestionType;
  status: ProblemQuestionStatus;
};

export type ProblemQuestion = {
  id: string;
  no: number;
  title: string;
  question: string;
  type: ProblemQuestionType;
  gradingMode: ProblemGradingMode;
  correctAnswer?: string;
  description?: string;
  explanation?: string;
  hint: string;
  choices?: ProblemChoice[];
  myAnswer?: ProblemAnswer;
  status?: ProblemQuestionStatus;
  elapsedSeconds?: number;
};

export type ProblemAttempt = {
  answer: string;
  selectedChoiceId: string;
  status: ProblemSolveStatus;
  elapsedSeconds: number;
  submitted: boolean;
  selfChecked: boolean;
};

export type ProblemSetSummary = {
  id: string;
  title: string;
  lastProgressDate: string;
  thumbnailSrc: string | StaticImageData;
  badge: 'FE' | 'BE' | 'CS';
  solvedCount: number;
  totalCount: number;
};

export type ProblemSetDetail = {
  summary: ProblemSetSummary;
  description?: string;
  questions: ProblemQuestionListItem[];
  correctCount: number;
};

export type ProblemResultRow = {
  questionId: string;
  no: number;
  title: string;
  status: ProblemResultStatus;
  elapsedTime: string;
};

export type ProblemResultQuestion = ProblemQuestionListItem & {
  gradingMode: ProblemGradingMode;
  elapsedSeconds: number;
  myAnswer?: ProblemAnswer;
  correctAnswer?: ProblemAnswer;
  explanation?: string;
};

export type ProblemSetResult = {
  problemSetId: string;
  title: string;
  totalCount: number;
  solvedCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  awaitingSelfGradeCount: number;
  accuracy: number;
  totalElapsedSeconds: number;
  completedAt?: string;
  questions: ProblemResultQuestion[];
};
