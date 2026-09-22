'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/queries/auth/useCurrentUser';
import { useProblemSetDetail } from '@/queries/problem/useProblemQueries';

import ProblemExitConfirmModal from '../_components/ProblemExitConfirmModal';
import ProblemSetSummaryCard from '../_components/ProblemSetSummaryCard';
import ProblemSideToc from '../_components/ProblemSideToc';
import ProblemSolvingHeader from '../_components/ProblemSolvingHeader';
import ProblemTocCard from '../_components/ProblemTocCard';
import { useProblemSolvingSession } from '../_contexts/ProblemSolvingSessionContext';
import { formatElapsedTime } from '../_utils/formatElapsedTime';

type ProblemSetIntroViewProps = {
  problemSetId: string;
};

export default function ProblemSetIntroView({ problemSetId }: ProblemSetIntroViewProps) {
  const router = useRouter();
  const { totalElapsedSeconds, pauseSession, resetSession } = useProblemSolvingSession();
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const currentUserQuery = useCurrentUser();

  const detailQuery = useProblemSetDetail({
    problemSetId,
    enabled: currentUserQuery.isSuccess,
  });

  const detail = detailQuery.data;
  const error = currentUserQuery.error ?? detailQuery.error;
  const isLoading =
    !error && (currentUserQuery.isPending || (currentUserQuery.isSuccess && detailQuery.isPending));

  if (isLoading) {
    return (
      <main className="bg-bg-1 flex min-h-dvh items-center justify-center text-[16px] font-medium text-gray-600">
        문제집을 불러오는 중입니다.
      </main>
    );
  }

  if (!detail || error) {
    return (
      <main className="bg-bg-1 flex min-h-dvh flex-col items-center justify-center gap-4 text-[16px] font-medium text-gray-600">
        <p role="alert">{error instanceof Error ? error.message : '문제집을 찾을 수 없습니다.'}</p>
        <button
          type="button"
          className="text-secondary-700 underline"
          onClick={() => {
            if (currentUserQuery.error) {
              void currentUserQuery.refetch();
              return;
            }

            void detailQuery.refetch();
          }}
        >
          다시 시도
        </button>
      </main>
    );
  }

  const firstUnsolvedQuestion = detail.questions.find(
    (question) => question.status === 'notStarted',
  );
  const firstQuestion = firstUnsolvedQuestion ?? detail.questions[0];
  const firstQuestionHref = firstQuestion
    ? `/problem/${problemSetId}/questions/${firstQuestion.id}`
    : `/problem/${problemSetId}`;

  const handleOpenExitModal = () => {
    setIsTocOpen(false);
    setIsExitModalOpen(true);
  };

  const handleExit = () => {
    pauseSession();
    router.push('/problem');
  };

  const handleExitWithoutSave = () => {
    resetSession();
    router.push('/problem');
  };

  return (
    <main className="bg-bg-1 min-h-dvh">
      <ProblemSolvingHeader
        title="문제풀이 홈으로 나가기"
        backHref="/problem"
        elapsedTime={formatElapsedTime(totalElapsedSeconds)}
        current={detail.summary.solvedCount}
        total={detail.summary.totalCount}
        onMenuClick={() => {
          setIsTocOpen(true);
        }}
      />

      <div className="h-[calc(100dvh-80px)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto w-[1060px] pt-[28px] pb-[68px]">
          <ProblemSetSummaryCard
            problemSetId={problemSetId}
            summary={detail.summary}
            actionLabel={detail.summary.solvedCount > 0 ? '이어서 시작' : '시작하기'}
            actionHref={firstQuestionHref}
          />

          <ProblemTocCard problemSetId={problemSetId} questions={detail.questions} />
        </div>
      </div>

      <ProblemSideToc
        problemSetId={problemSetId}
        questions={detail.questions}
        isOpen={isTocOpen}
        onClose={() => {
          setIsTocOpen(false);
        }}
        navigation={{
          previousDisabled: true,
          nextHref: firstQuestionHref,
          nextDisabled: !firstQuestion,
          onExitClick: handleOpenExitModal,
        }}
      />

      <ProblemExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={() => {
          setIsExitModalOpen(false);
        }}
        onSaveAndExit={handleExit}
        onExitWithoutSave={handleExitWithoutSave}
      />
    </main>
  );
}
