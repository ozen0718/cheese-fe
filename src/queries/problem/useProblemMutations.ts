import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  retryProblemQuestion,
  retryProblemSet,
  saveProblemAnswer,
  selfGradeProblemQuestion,
  skipProblemQuestion,
  submitProblemAnswer,
  type SaveProblemAnswer,
} from '@/api/problem.api';
import { mapProblemQuestion, mapProblemSetDetail } from '@/app/(app)/problem/_utils/mapProblemApi';
import type { ProblemQuestion } from '@/app/(app)/problem/_types/problemSolving';
import type { CurrentUser } from '@/api/auth.api';
import { authQueryKeys } from '@/queries/auth/authQueryKeys';

import { problemQueryKeys } from './problemQueryKeys';

type ProblemMutationVariables = {
  userId: string;
  problemSetId: string;
};

type ProblemQuestionMutationVariables = ProblemMutationVariables & {
  questionId: string;
};

type ProblemAnswerMutationVariables = ProblemQuestionMutationVariables & {
  answer: SaveProblemAnswer;
};

function useUpdateProblemCaches() {
  const queryClient = useQueryClient();

  const isCurrentUser = (userId: string) =>
    queryClient.getQueryData<CurrentUser>(authQueryKeys.me())?.account.userId === userId;

  return {
    isCurrentUser,
    async cancelQueries(variables: ProblemMutationVariables) {
      if (!isCurrentUser(variables.userId)) {
        throw new Error('로그인 정보를 다시 확인해 주세요.');
      }
      await queryClient.cancelQueries({
        queryKey: problemQueryKeys.byUser(variables.userId),
      });
    },
    async updateQuestion(
      variables: ProblemQuestionMutationVariables,
      data: ReturnType<typeof mapProblemQuestion>,
    ) {
      if (!isCurrentUser(variables.userId)) return;
      queryClient.setQueryData(
        problemQueryKeys.question(variables.userId, variables.problemSetId, variables.questionId),
        data,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: problemQueryKeys.detail(variables.userId, variables.problemSetId),
        }),
        queryClient.invalidateQueries({ queryKey: problemQueryKeys.sets(variables.userId) }),
        queryClient.invalidateQueries({
          queryKey: problemQueryKeys.result(variables.userId, variables.problemSetId),
        }),
      ]);
    },
  };
}

export function useSaveProblemAnswerMutation() {
  const { updateQuestion, cancelQueries } = useUpdateProblemCaches();

  return useMutation({
    mutationFn: async (variables: ProblemAnswerMutationVariables) =>
      mapProblemQuestion(await saveProblemAnswer(variables)),
    onMutate: cancelQueries,
    onSuccess: (data, variables) => updateQuestion(variables, data),
  });
}

export function useSubmitProblemAnswerMutation() {
  const { updateQuestion, cancelQueries } = useUpdateProblemCaches();

  return useMutation({
    mutationFn: async (variables: ProblemAnswerMutationVariables) =>
      mapProblemQuestion(await submitProblemAnswer(variables)),
    onMutate: cancelQueries,
    onSuccess: (data, variables) => updateQuestion(variables, data),
  });
}

export function useSkipProblemQuestionMutation() {
  const { updateQuestion, cancelQueries } = useUpdateProblemCaches();

  return useMutation({
    mutationFn: async (variables: ProblemAnswerMutationVariables) =>
      mapProblemQuestion(await skipProblemQuestion(variables)),
    onMutate: cancelQueries,
    onSuccess: (data, variables) => updateQuestion(variables, data),
  });
}

export function useRetryProblemSetMutation() {
  const queryClient = useQueryClient();
  const { cancelQueries, isCurrentUser } = useUpdateProblemCaches();

  return useMutation({
    mutationFn: async (variables: ProblemMutationVariables) =>
      mapProblemSetDetail(await retryProblemSet(variables)),
    onMutate: cancelQueries,
    onSuccess: async (data, variables) => {
      if (!isCurrentUser(variables.userId)) return;
      queryClient.setQueryData(
        problemQueryKeys.detail(variables.userId, variables.problemSetId),
        data,
      );
      queryClient.removeQueries({
        queryKey: problemQueryKeys.questions(variables.userId, variables.problemSetId),
      });
      queryClient.removeQueries({
        queryKey: problemQueryKeys.result(variables.userId, variables.problemSetId),
      });
      await queryClient.invalidateQueries({
        queryKey: problemQueryKeys.sets(variables.userId),
      });
    },
  });
}

export function useSelfGradeProblemQuestionMutation() {
  const { updateQuestion, cancelQueries } = useUpdateProblemCaches();

  return useMutation({
    mutationFn: async (
      variables: ProblemQuestionMutationVariables & { status: 'correct' | 'wrong' },
    ) => mapProblemQuestion(await selfGradeProblemQuestion(variables)),
    onMutate: cancelQueries,
    onSuccess: (data, variables) => updateQuestion(variables, data),
  });
}

export function useRetryProblemQuestionMutation() {
  const queryClient = useQueryClient();
  const { cancelQueries, isCurrentUser } = useUpdateProblemCaches();

  return useMutation({
    mutationFn: (variables: ProblemQuestionMutationVariables) => retryProblemQuestion(variables),
    onMutate: cancelQueries,
    onSuccess: async (data, variables: ProblemQuestionMutationVariables) => {
      if (!isCurrentUser(variables.userId)) return;
      queryClient.setQueryData<ProblemQuestion>(
        problemQueryKeys.question(variables.userId, variables.problemSetId, variables.questionId),
        (question) =>
          question && {
            ...question,
            status: data.status,
            myAnswer: undefined,
            elapsedSeconds: data.elapsedSeconds,
            correctAnswer: undefined,
            explanation: undefined,
          },
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: problemQueryKeys.bySet(variables.userId, variables.problemSetId),
        }),
        queryClient.invalidateQueries({ queryKey: problemQueryKeys.sets(variables.userId) }),
      ]);
    },
  });
}
