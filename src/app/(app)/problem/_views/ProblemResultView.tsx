'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/queries/auth/useCurrentUser';
import { useRetryProblemSetMutation } from '@/queries/problem/useProblemMutations';
import { useProblemSetDetail, useProblemSetResult } from '@/queries/problem/useProblemQueries';

import ProblemExitConfirmModal from '../_components/ProblemExitConfirmModal';
import ProblemResultTable from '../_components/ProblemResultTable';
import ProblemSetSummaryCard from '../_components/ProblemSetSummaryCard';
import ProblemSideToc from '../_components/ProblemSideToc';
import ProblemSolvingHeader from '../_components/ProblemSolvingHeader';
import { useProblemSolvingSession } from '../_contexts/ProblemSolvingSessionContext';
import type { ProblemResultRow } from '../_types/problemSolving';
import { formatElapsedTime } from '../_utils/formatElapsedTime';

type ProblemResultViewProps = {
  problemSetId: string;
};

export default function ProblemResultView({ problemSetId }: ProblemResultViewProps) {
  const router = useRouter();
  const { isHydrated, pauseSession, finishSession, resetSession } = useProblemSolvingSession();
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.account.userId;
  const detailQuery = useProblemSetDetail({
    problemSetId,
    enabled: currentUserQuery.isSuccess,
  });
  const resultQuery = useProblemSetResult({
    problemSetId,
    enabled: currentUserQuery.isSuccess,
  });
  const retryProblemSetMutation = useRetryProblemSetMutation();

  useEffect(() => {
    if (isHydrated) {
      finishSession();
    }
  }, [finishSession, isHydrated]);

  const error = currentUserQuery.error ?? detailQuery.error ?? resultQuery.error;
  const isLoading =
    !error &&
    (currentUserQuery.isPending ||
      (Boolean(userId) && (detailQuery.isPending || resultQuery.isPending)));

  if (isLoading) {
    return (
      <main className="bg-bg-1 flex min-h-dvh items-center justify-center text-[16px] font-medium text-gray-600">
        풀이 결과를 불러오는 중입니다.
      </main>
    );
  }

  const detail = detailQuery.data;
  const result = resultQuery.data;
  if (!userId || !detail || !result || error) {
    return (
      <main className="bg-bg-1 flex min-h-dvh flex-col items-center justify-center gap-4 text-[16px] font-medium text-gray-600">
        <p role="alert">
          {error instanceof Error ? error.message : '모든 문제를 푼 뒤 결과를 확인할 수 있습니다.'}
        </p>
        <button
          type="button"
          className="text-secondary-700 underline"
          onClick={() => {
            router.push(`/problem/${problemSetId}`);
          }}
        >
          문제집으로 돌아가기
        </button>
      </main>
    );
  }

  const firstQuestion = result.questions[0];
  const lastQuestion = result.questions[result.questions.length - 1];
  const firstQuestionHref = firstQuestion
    ? `/problem/${problemSetId}/questions/${firstQuestion.id}`
    : `/problem/${problemSetId}`;
  const lastQuestionHref = lastQuestion
    ? `/problem/${problemSetId}/questions/${lastQuestion.id}?from=result`
    : undefined;
  const resultRows: ProblemResultRow[] = result.questions.map((question) => ({
    questionId: question.id,
    no: question.no,
    title: question.title,
    status: question.status,
    elapsedTime: question.elapsedSeconds > 0 ? formatElapsedTime(question.elapsedSeconds) : '',
  }));
  const summary = {
    ...detail.summary,
    title: result.title,
    solvedCount: result.solvedCount,
    totalCount: result.totalCount,
  };

  const handleRestart = async () => {
    if (retryProblemSetMutation.isPending || result.questions.length === 0) return;
    try {
      const restartedSet = await retryProblemSetMutation.mutateAsync({ userId, problemSetId });
      resetSession();
      const restartedQuestion = restartedSet.questions[0];
      router.push(
        restartedQuestion
          ? `/problem/${problemSetId}/questions/${restartedQuestion.id}`
          : `/problem/${problemSetId}`,
      );
    } catch (retryError) {
      window.alert(
        retryError instanceof Error
          ? retryError.message
          : '문제집을 초기화하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const handleOpenExitModal = () => {
    setIsTocOpen(false);
    setIsExitModalOpen(true);
  };

  const handleExit = () => {
    pauseSession();
    router.push('/problem');
  };

  return (
    <main className="bg-bg-1 min-h-dvh">
      <ProblemSolvingHeader
        title="문제풀이 홈으로 나가기"
        backHref="/problem"
        elapsedTime={formatElapsedTime(result.totalElapsedSeconds)}
        current={result.solvedCount}
        total={result.totalCount}
        onMenuClick={() => {
          setIsTocOpen(true);
        }}
      />

      <div className="h-[calc(100dvh-80px)] overflow-y-auto">
        <div className="mx-auto w-[1060px] pt-[28px] pb-[46px]">
          <ProblemSetSummaryCard
            problemSetId={problemSetId}
            summary={summary}
            actionLabel={retryProblemSetMutation.isPending ? '초기화 중' : '처음부터 시작'}
            actionHref={firstQuestionHref}
            actionDisabled={retryProblemSetMutation.isPending || !firstQuestion}
            onActionClick={(event) => {
              event.preventDefault();
              if (!retryProblemSetMutation.isPending) {
                void handleRestart();
              }
            }}
            showProgress={false}
          />

          <ProblemResultTable problemSetId={problemSetId} rows={resultRows} />
        </div>
      </div>

      <ProblemSideToc
        problemSetId={problemSetId}
        questions={result.questions}
        isOpen={isTocOpen}
        onClose={() => {
          setIsTocOpen(false);
        }}
        questionHrefSuffix="?from=result"
        navigation={{
          previousHref: lastQuestionHref,
          previousDisabled: !lastQuestion,
          nextDisabled: true,
          onExitClick: handleOpenExitModal,
        }}
      />

      <ProblemExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={() => {
          setIsExitModalOpen(false);
        }}
        onSaveAndExit={handleExit}
        onExitWithoutSave={() => {
          resetSession();
          router.push('/problem');
        }}
      />
    </main>
  );
}
