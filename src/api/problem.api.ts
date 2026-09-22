import { apiClient } from './client';

export type ApiProblemStatus = 'notStarted' | 'correct' | 'wrong' | 'skipped';

export type ApiProblemAnswer = {
  choiceId?: string;
  text?: string;
};

export type ApiProblemSetSummary = {
  id: string;
  title: string;
  description?: string;
  category: string;
  subCategory: string;
  thumbnailUrl?: string;
  totalQuestionCount: number;
  solvedQuestionCount: number;
  correctQuestionCount: number;
  lastSolvedAt?: string;
  createdAt: string;
};

export type ApiProblemQuestionSummary = {
  id: string;
  order: number;
  title: string;
  type: 'multipleChoice' | 'shortAnswer';
  status?: ApiProblemStatus;
};

export type ApiProblemSetDetail = ApiProblemSetSummary & {
  questions: ApiProblemQuestionSummary[];
};

export type ApiProblemChoice = {
  id: string;
  text: string;
};

export type ApiProblemQuestion = {
  id: string;
  problemSetId: string;
  order: number;
  title: string;
  type: 'multipleChoice' | 'shortAnswer';
  question: string;
  description?: string;
  hint?: string;
  choices?: ApiProblemChoice[];
  myAnswer?: ApiProblemAnswer;
  status?: ApiProblemStatus;
  elapsedSeconds?: number;
};

export type ApiProblemResultQuestion = {
  questionId: string;
  order: number;
  title: string;
  type: 'multipleChoice' | 'shortAnswer';
  status: Exclude<ApiProblemStatus, 'notStarted'>;
  elapsedSeconds: number;
  myAnswer?: ApiProblemAnswer;
  correctAnswer?: ApiProblemAnswer;
};

export type ApiProblemSetResult = {
  problemSetId: string;
  title: string;
  totalQuestionCount: number;
  solvedQuestionCount: number;
  correctQuestionCount: number;
  wrongQuestionCount: number;
  skippedQuestionCount: number;
  accuracy: number;
  totalElapsedSeconds: number;
  completedAt?: string;
  questions: ApiProblemResultQuestion[];
};

export type SaveProblemAnswer = {
  selectedChoiceId?: string;
  answer?: string;
  elapsedSeconds: number;
};

type ProblemRequest = {
  signal?: AbortSignal;
};

type ProblemSetRequest = ProblemRequest & {
  problemSetId: string;
};

type ProblemQuestionRequest = ProblemSetRequest & {
  questionId: string;
};

type ProblemAnswerRequest = ProblemQuestionRequest & {
  answer: SaveProblemAnswer;
};

function toSaveAnswerBody(answer: SaveProblemAnswer) {
  return {
    choiceId: answer.selectedChoiceId,
    text: answer.answer,
    elapsedSeconds: answer.elapsedSeconds,
  };
}

export function getProblemSets({ signal }: ProblemRequest = {}) {
  return apiClient<ApiProblemSetSummary[]>('/backend-api/problem-sets', {
    method: 'GET',
    signal,
    cache: 'no-store',
  });
}

export function getProblemSetDetail({ problemSetId, signal }: ProblemSetRequest) {
  return apiClient<ApiProblemSetDetail>(`/backend-api/problem-sets/${problemSetId}`, {
    method: 'GET',
    signal,
    cache: 'no-store',
  });
}

export function getProblemQuestion({ problemSetId, questionId, signal }: ProblemQuestionRequest) {
  return apiClient<ApiProblemQuestion>(
    `/backend-api/problem-sets/${problemSetId}/questions/${questionId}`,
    {
      method: 'GET',
      signal,
      cache: 'no-store',
    },
  );
}

export function saveProblemAnswer({ problemSetId, questionId, answer }: ProblemAnswerRequest) {
  return apiClient<ApiProblemQuestion>(
    `/backend-api/problem-sets/${problemSetId}/questions/${questionId}/answer`,
    {
      method: 'PUT',
      body: JSON.stringify(toSaveAnswerBody(answer)),
    },
  );
}

export function submitProblemAnswer({ problemSetId, questionId, answer }: ProblemAnswerRequest) {
  return apiClient<ApiProblemQuestion>(
    `/backend-api/problem-sets/${problemSetId}/questions/${questionId}/submit`,
    {
      method: 'POST',
      body: JSON.stringify(toSaveAnswerBody(answer)),
    },
  );
}

export function skipProblemQuestion({ problemSetId, questionId, answer }: ProblemAnswerRequest) {
  return apiClient<ApiProblemQuestion>(
    `/backend-api/problem-sets/${problemSetId}/questions/${questionId}/skip`,
    {
      method: 'POST',
      body: JSON.stringify(toSaveAnswerBody(answer)),
    },
  );
}

export function getProblemSetResult({ problemSetId, signal }: ProblemSetRequest) {
  return apiClient<ApiProblemSetResult>(`/backend-api/problem-sets/${problemSetId}/result`, {
    method: 'GET',
    signal,
    cache: 'no-store',
  });
}

export function retryProblemSet({ problemSetId }: ProblemSetRequest) {
  return apiClient<ApiProblemSetDetail>(`/backend-api/problem-sets/${problemSetId}/retry`, {
    method: 'POST',
  });
}
