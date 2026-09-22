import { useQuery } from '@tanstack/react-query';

import {
  getProblemQuestion,
  getProblemSetDetail,
  getProblemSetResult,
  getProblemSets,
} from '@/api/problem.api';
import {
  mapProblemQuestion,
  mapProblemSetDetail,
  mapProblemSetResult,
  mapProblemSetSummary,
} from '@/app/(app)/problem/_utils/mapProblemApi';

import { problemQueryKeys } from './problemQueryKeys';

type UserQueryParams = {
  userId?: string;
  enabled?: boolean;
};

type ProblemSetQueryParams = UserQueryParams & {
  problemSetId: string;
};

type ProblemQuestionQueryParams = ProblemSetQueryParams & {
  questionId: string;
};

export function useProblemSets({ userId, enabled = true }: UserQueryParams) {
  return useQuery({
    queryKey: problemQueryKeys.sets(userId ?? ''),
    queryFn: async ({ signal }) => {
      if (!userId) {
        return [];
      }

      const problemSets = await getProblemSets({ signal });
      return problemSets.map(mapProblemSetSummary);
    },
    enabled: enabled && Boolean(userId),
  });
}

export function useProblemSetDetail({
  userId,
  problemSetId,
  enabled = true,
}: ProblemSetQueryParams) {
  return useQuery({
    queryKey: problemQueryKeys.detail(userId ?? '', problemSetId),
    queryFn: async ({ signal }) => {
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      return mapProblemSetDetail(await getProblemSetDetail({ problemSetId, signal }));
    },
    enabled: enabled && Boolean(userId) && Boolean(problemSetId),
  });
}

export function useProblemQuestion({
  userId,
  problemSetId,
  questionId,
  enabled = true,
}: ProblemQuestionQueryParams) {
  return useQuery({
    queryKey: problemQueryKeys.question(userId ?? '', problemSetId, questionId),
    queryFn: async ({ signal }) => {
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      return mapProblemQuestion(await getProblemQuestion({ problemSetId, questionId, signal }));
    },
    enabled: enabled && Boolean(userId) && Boolean(problemSetId) && Boolean(questionId),
  });
}

export function useProblemSetResult({
  userId,
  problemSetId,
  enabled = true,
}: ProblemSetQueryParams) {
  return useQuery({
    queryKey: problemQueryKeys.result(userId ?? '', problemSetId),
    queryFn: async ({ signal }) => {
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      return mapProblemSetResult(await getProblemSetResult({ problemSetId, signal }));
    },
    enabled: enabled && Boolean(userId) && Boolean(problemSetId),
  });
}
