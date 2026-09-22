import type {
  ApiProblemAnswer,
  ApiProblemQuestion,
  ApiProblemSetDetail,
  ApiProblemSetResult,
  ApiProblemSetSummary,
  ApiProblemStatus,
} from '@/api/problem.api';

import type {
  ProblemMainCategory,
  ProblemSet,
  ProblemSubCategory,
  ProblemThumbnailType,
} from '../_types/problem';
import type {
  ProblemAnswer,
  ProblemQuestion,
  ProblemQuestionStatus,
  ProblemSetDetail,
  ProblemSetResult,
} from '../_types/problemSolving';

const FRONTEND_SUB_CATEGORIES = new Map<string, Exclude<ProblemSubCategory, 'all'>>([
  ['htmlcss', 'html-css'],
  ['css', 'html-css'],
  ['html', 'html-css'],
  ['javascript', 'javascript'],
  ['js', 'javascript'],
  ['react', 'react'],
  ['typescript', 'typescript'],
  ['ts', 'typescript'],
  ['nextjs', 'nextjs'],
]);

const BACKEND_SUB_CATEGORIES = new Map<string, Exclude<ProblemSubCategory, 'all'>>([
  ['java', 'java'],
  ['mysql', 'mysql'],
  ['python', 'python'],
  ['nodejs', 'nodejs'],
]);

const CS_SUB_CATEGORIES = new Map<string, Exclude<ProblemSubCategory, 'all'>>([
  ['network', 'network'],
  ['네트워크', 'network'],
  ['os', 'os'],
  ['운영체제', 'os'],
  ['database', 'database'],
  ['db', 'database'],
  ['데이터베이스', 'database'],
]);

function normalizeCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s._/-]/g, '');
}

function resolveCategory(category: string, subCategory: string) {
  const normalizedCategory = normalizeCategory(category);
  const normalizedSubCategory = normalizeCategory(subCategory);

  const frontendSubCategory = FRONTEND_SUB_CATEGORIES.get(normalizedSubCategory);
  const backendSubCategory = BACKEND_SUB_CATEGORIES.get(normalizedSubCategory);
  const csSubCategory = CS_SUB_CATEGORIES.get(normalizedSubCategory);

  if (normalizedCategory.includes('backend') || normalizedCategory.includes('백엔드')) {
    return { category: 'backend', subCategory: backendSubCategory } as const;
  }

  if (
    normalizedCategory === 'cs' ||
    normalizedCategory.includes('computerscience') ||
    normalizedCategory.includes('컴퓨터과학')
  ) {
    return { category: 'cs', subCategory: csSubCategory } as const;
  }

  if (backendSubCategory) {
    return { category: 'backend', subCategory: backendSubCategory } as const;
  }

  if (csSubCategory) {
    return { category: 'cs', subCategory: csSubCategory } as const;
  }

  return { category: 'frontend', subCategory: frontendSubCategory } as const;
}

function getThumbnailType(subCategory?: Exclude<ProblemSubCategory, 'all'>): ProblemThumbnailType {
  if (subCategory === 'html-css') {
    return 'html';
  }

  if (
    subCategory === 'javascript' ||
    subCategory === 'typescript' ||
    subCategory === 'react' ||
    subCategory === 'nextjs' ||
    subCategory === 'nodejs'
  ) {
    return 'js';
  }

  return 'css';
}

function getBadge(category: Exclude<ProblemMainCategory, 'all'>) {
  if (category === 'backend') {
    return 'BE' as const;
  }

  if (category === 'cs') {
    return 'CS' as const;
  }

  return 'FE' as const;
}

export function formatProblemDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return [getPart('year'), getPart('month'), getPart('day')].filter(Boolean).join('.');
}

export function mapProblemStatus(status?: ApiProblemStatus): ProblemQuestionStatus {
  if (status === 'wrong') {
    return 'incorrect';
  }

  return status ?? 'notStarted';
}

function mapProblemAnswer(answer?: ApiProblemAnswer): ProblemAnswer | undefined {
  if (!answer) {
    return undefined;
  }

  return {
    selectedChoiceId: answer.choiceId,
    answer: answer.text,
  };
}

export function mapProblemSetSummary(response: ApiProblemSetSummary): ProblemSet {
  const { category, subCategory } = resolveCategory(response.category, response.subCategory);

  return {
    id: response.id,
    title: response.title,
    category,
    subCategory,
    badge: getBadge(category),
    thumbnailType: getThumbnailType(subCategory),
    thumbnailUrl: response.thumbnailUrl,
    lastProgressDate: formatProblemDate(response.lastSolvedAt),
    createdAt: response.createdAt,
    solvedCount: response.solvedQuestionCount,
    totalCount: response.totalQuestionCount,
  };
}

export function mapProblemSetDetail(response: ApiProblemSetDetail): ProblemSetDetail {
  const problemSet = mapProblemSetSummary(response);

  return {
    summary: {
      id: problemSet.id,
      title: problemSet.title,
      lastProgressDate: problemSet.lastProgressDate ?? '-',
      thumbnailSrc: problemSet.thumbnailUrl ?? `/images/problem/${problemSet.thumbnailType}.png`,
      badge: problemSet.badge,
      solvedCount: problemSet.solvedCount,
      totalCount: problemSet.totalCount,
    },
    description: response.description,
    correctCount: response.correctQuestionCount,
    questions: [...response.questions]
      .sort((a, b) => a.order - b.order)
      .map((question) => ({
        id: question.id,
        no: question.order,
        title: question.title,
        type: question.type,
        status: mapProblemStatus(question.status),
      })),
  };
}

export function mapProblemQuestion(response: ApiProblemQuestion): ProblemQuestion {
  return {
    id: response.id,
    no: response.order,
    title: response.title,
    question: response.question,
    type: response.type,
    gradingMode: response.gradingMode,
    description: response.description,
    correctAnswer:
      response.correctAnswer?.text ??
      response.choices?.find((choice) => choice.id === response.correctAnswer?.choiceId)?.text,
    explanation: response.explanation,
    hint: response.hint ?? '',
    choices: response.choices?.map((choice) => ({ id: choice.id, label: choice.text })),
    myAnswer: mapProblemAnswer(response.myAnswer),
    status: mapProblemStatus(response.status),
    elapsedSeconds: response.elapsedSeconds ?? 0,
  };
}

export function mapProblemSetResult(response: ApiProblemSetResult): ProblemSetResult {
  return {
    problemSetId: response.problemSetId,
    title: response.title,
    totalCount: response.totalQuestionCount,
    solvedCount: response.solvedQuestionCount,
    correctCount: response.correctQuestionCount,
    wrongCount: response.wrongQuestionCount,
    skippedCount: response.skippedQuestionCount,
    awaitingSelfGradeCount: response.awaitingSelfGradeCount,
    accuracy: response.accuracy,
    totalElapsedSeconds: response.totalElapsedSeconds,
    completedAt: response.completedAt,
    questions: [...response.questions]
      .sort((a, b) => a.order - b.order)
      .map((question) => ({
        id: question.questionId,
        no: question.order,
        title: question.title,
        type: question.type,
        gradingMode: question.gradingMode,
        status: mapProblemStatus(question.status),
        elapsedSeconds: question.elapsedSeconds ?? 0,
        myAnswer: mapProblemAnswer(question.myAnswer),
        correctAnswer: mapProblemAnswer(question.correctAnswer),
        explanation: question.explanation,
      })),
  };
}
