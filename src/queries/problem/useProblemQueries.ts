import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { useCurrentUser } from '@/queries/auth/useCurrentUser';
import { getVisibleProblemSets } from '@/app/(app)/problem/_utils/getVisibleProblemSets';

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
  enabled?: boolean;
};

type ProblemSetQueryParams = UserQueryParams & {
  problemSetId: string;
};

type ProblemQuestionQueryParams = ProblemSetQueryParams & {
  questionId: string;
};

function retryProblemQuery(failureCount: number, error: Error) {
  if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return false;
  return failureCount < 1;
}

export function useProblemSets({ enabled = true }: UserQueryParams = {}) {
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.account.userId;
  return useQuery({
    retry: retryProblemQuery,
    queryKey: problemQueryKeys.sets(userId ?? ''),
    select: getVisibleProblemSets,
    queryFn: async ({ signal }) => {
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      const problemSets = await getProblemSets({ signal });
      return problemSets.map(mapProblemSetSummary);
    },
    enabled: enabled && currentUserQuery.isSuccess && Boolean(userId),
  });
}

export function useProblemSetDetail({ problemSetId, enabled = true }: ProblemSetQueryParams) {
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.account.userId;
  return useQuery({
    retry: retryProblemQuery,
    queryKey: problemQueryKeys.detail(userId ?? '', problemSetId),
    queryFn: async ({ signal }) => {
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      return mapProblemSetDetail(await getProblemSetDetail({ problemSetId, signal }));
    },
    enabled: enabled && currentUserQuery.isSuccess && Boolean(userId) && Boolean(problemSetId),
  });
}

export function useProblemQuestion({
  problemSetId,
  questionId,
  enabled = true,
}: ProblemQuestionQueryParams) {
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.account.userId;
  return useQuery({
    retry: retryProblemQuery,
    queryKey: problemQueryKeys.question(userId ?? '', problemSetId, questionId),
    queryFn: async ({ signal }) => {
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      return mapProblemQuestion(await getProblemQuestion({ problemSetId, questionId, signal }));
    },
    enabled:
      enabled &&
      currentUserQuery.isSuccess &&
      Boolean(userId) &&
      Boolean(problemSetId) &&
      Boolean(questionId),
  });
}

export function useProblemSetResult({ problemSetId, enabled = true }: ProblemSetQueryParams) {
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.account.userId;
  return useQuery({
    retry: retryProblemQuery,
    queryKey: problemQueryKeys.result(userId ?? '', problemSetId),
    queryFn: async ({ signal }) => {
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      return mapProblemSetResult(await getProblemSetResult({ problemSetId, signal }));
    },
    enabled: enabled && currentUserQuery.isSuccess && Boolean(userId) && Boolean(problemSetId),
  });
}
