'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/queries/auth/useCurrentUser';
import {
  useSaveProblemAnswerMutation,
  useSelfGradeProblemQuestionMutation,
  useSubmitProblemAnswerMutation,
} from '@/queries/problem/useProblemMutations';
import { useProblemQuestion, useProblemSetDetail } from '@/queries/problem/useProblemQueries';

import ProblemExitConfirmModal from '../_components/ProblemExitConfirmModal';
import ProblemQuestionCard from '../_components/ProblemQuestionCard';
import ProblemSideToc from '../_components/ProblemSideToc';
import ProblemSolvingHeader from '../_components/ProblemSolvingHeader';
import { useProblemSolvingSession } from '../_contexts/ProblemSolvingSessionContext';
import { formatElapsedTime } from '../_utils/formatElapsedTime';
import { mapProblemAttempt } from '../_utils/mapProblemAttempt';

type ProblemQuestionViewProps = {
  problemSetId: string;
  questionId: string;
  isReviewMode?: boolean;
};

export default function ProblemQuestionView({
  problemSetId,
  questionId,
  isReviewMode = false,
}: ProblemQuestionViewProps) {
  const router = useRouter();
  const {
    totalElapsedSeconds,
    attempts,
    isHydrated,
    startQuestion,
    saveDraft,
    submitQuestion,
    gradeQuestion,
    pauseSession,
    finishSession,
    resetSession,
  } = useProblemSolvingSession();

  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.account.userId;
  const detailQuery = useProblemSetDetail({
    problemSetId,
    enabled: currentUserQuery.isSuccess,
  });
  const questionQuery = useProblemQuestion({
    problemSetId,
    questionId,
    enabled: currentUserQuery.isSuccess,
  });
  const saveAnswerMutation = useSaveProblemAnswerMutation();
  const submitAnswerMutation = useSubmitProblemAnswerMutation();
  const selfGradeMutation = useSelfGradeProblemQuestionMutation();
  const isBusy =
    saveAnswerMutation.isPending || submitAnswerMutation.isPending || selfGradeMutation.isPending;

  const apiAttempt = useMemo(
    () => (questionQuery.data ? mapProblemAttempt(questionQuery.data) : undefined),
    [questionQuery.data],
  );
  const question = questionQuery.data;

  useEffect(() => {
    if (isHydrated && question && apiAttempt) {
      startQuestion(question.id, { review: isReviewMode, initialAttempt: apiAttempt });
    }
    return pauseSession;
  }, [apiAttempt, isHydrated, isReviewMode, question, startQuestion, pauseSession]);

  const error = currentUserQuery.error ?? detailQuery.error ?? questionQuery.error;
  const isLoading =
    !error &&
    (currentUserQuery.isPending ||
      (Boolean(userId) && (detailQuery.isPending || questionQuery.isPending)));

  if (isLoading) {
    return (
      <main className="bg-bg-1 flex min-h-dvh items-center justify-center text-[16px] font-medium text-gray-600">
        문제를 불러오는 중입니다.
      </main>
    );
  }

  const detail = detailQuery.data;
  if (!userId || !detail || !question || !apiAttempt || error) {
    return (
      <main className="bg-bg-1 flex min-h-dvh flex-col items-center justify-center gap-4 text-[16px] font-medium text-gray-600">
        <p role="alert">{error instanceof Error ? error.message : '문제를 찾을 수 없습니다.'}</p>
        <button
          type="button"
          className="text-secondary-700 underline"
          onClick={() => {
            if (currentUserQuery.error) {
              void currentUserQuery.refetch();
              return;
            }

            void Promise.all([detailQuery.refetch(), questionQuery.refetch()]);
          }}
        >
          다시 시도
        </button>
      </main>
    );
  }

  const questionIndex = detail.questions.findIndex((item) => item.id === question.id);
  if (questionIndex < 0) {
    return (
      <main className="bg-bg-1 flex min-h-dvh items-center justify-center text-[16px] font-medium text-gray-600">
        문제집에 포함되지 않은 문제입니다.
      </main>
    );
  }

  const previousQuestion = detail.questions[questionIndex - 1];
  const sequentialNextQuestion = detail.questions[questionIndex + 1];
  const nextQuestion =
    sequentialNextQuestion ??
    (!isReviewMode
      ? detail.questions.find(
          (item) =>
            item.id !== question.id &&
            item.status === 'notStarted' &&
            !attempts[item.id]?.submitted,
        )
      : undefined);
  const isLastQuestion = !nextQuestion;
  const reviewQuery = isReviewMode ? '?from=result' : '';
  const sessionAttempt = attempts[question.id];
  const initialAttempt =
    apiAttempt.submitted || sessionAttempt?.submitted ? apiAttempt : (sessionAttempt ?? apiAttempt);
  const completedCount = detail.summary.solvedCount;

  const handleNext = () => {
    if (!nextQuestion) {
      finishSession();
      router.push(`/problem/${problemSetId}/result`);
      return;
    }

    router.push(`/problem/${problemSetId}/questions/${nextQuestion.id}${reviewQuery}`);
  };

  const handleOpenExitModal = () => {
    pauseSession();
    setIsTocOpen(false);
    setIsExitModalOpen(true);
  };

  const handleCloseExitModal = () => {
    setIsExitModalOpen(false);

    if (isReviewMode || !attempts[question.id]?.submitted) {
      startQuestion(question.id, { review: isReviewMode, initialAttempt: apiAttempt });
    }
  };

  const handleHeaderBack = () => {
    if (isReviewMode) {
      pauseSession();
      router.push(`/problem/${problemSetId}/result`);
      return;
    }

    handleOpenExitModal();
  };

  const handleSaveAndExit = async () => {
    const attempt = attempts[question.id] ?? apiAttempt;
    const hasDraft =
      question.type === 'shortAnswer'
        ? Boolean(attempt.answer.trim())
        : Boolean(attempt.selectedChoiceId);

    try {
      if (!attempt.submitted && hasDraft) {
        await saveAnswerMutation.mutateAsync({
          userId,
          problemSetId,
          questionId: question.id,
          answer: {
            answer: question.type === 'shortAnswer' ? attempt.answer : undefined,
            selectedChoiceId:
              question.type === 'multipleChoice' ? attempt.selectedChoiceId : undefined,
            elapsedSeconds: attempt.elapsedSeconds,
          },
        });
      }

      pauseSession();
      router.push(`/problem/${problemSetId}`);
    } catch (saveError) {
      window.alert(
        saveError instanceof Error
          ? saveError.message
          : '진행도를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return (
    <main className="bg-bg-1 min-h-dvh">
      <ProblemSolvingHeader
        title={
          isReviewMode
            ? '최종 결과로 돌아가기'
            : `${String(question.no).padStart(2, '0')}. ${question.title}`
        }
        backHref={isReviewMode ? `/problem/${problemSetId}/result` : `/problem/${problemSetId}`}
        onBack={handleHeaderBack}
        elapsedTime={formatElapsedTime(totalElapsedSeconds)}
        current={completedCount}
        total={detail.questions.length}
        onMenuClick={() => {
          setIsTocOpen(true);
        }}
      />

      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center py-[60px]">
        {isHydrated && (
          <ProblemQuestionCard
            key={JSON.stringify([question.id, isReviewMode, question.status, question.myAnswer])}
            question={question}
            initialAttempt={initialAttempt}
            isLastQuestion={isLastQuestion}
            isReviewMode={isReviewMode}
            isBusy={isBusy}
            onDraftChange={(draft) => {
              saveDraft(question.id, draft);
            }}
            onSubmitAnswer={async (submission) => {
              const elapsedSeconds =
                attempts[question.id]?.elapsedSeconds ?? apiAttempt.elapsedSeconds;
              const submittedQuestion = await submitAnswerMutation.mutateAsync({
                userId,
                problemSetId,
                questionId: question.id,
                answer: {
                  answer: question.type === 'shortAnswer' ? submission.answer : undefined,
                  selectedChoiceId:
                    question.type === 'multipleChoice' ? submission.selectedChoiceId : undefined,
                  elapsedSeconds,
                },
              });

              const status =
                submittedQuestion.status === 'correct'
                  ? 'correct'
                  : submittedQuestion.status === 'incorrect'
                    ? 'incorrect'
                    : null;
              const submittedAnswer = {
                answer: submittedQuestion.myAnswer?.answer ?? submission.answer,
                selectedChoiceId:
                  submittedQuestion.myAnswer?.selectedChoiceId ?? submission.selectedChoiceId,
              };

              if (
                submittedQuestion.gradingMode === 'self' &&
                submittedQuestion.status === 'awaitingSelfGrade'
              ) {
                submitQuestion(question.id, { ...submittedAnswer, status: 'pending' });
                return null;
              }

              if (!status) {
                throw new Error('채점 결과를 확인할 수 없습니다.');
              }

              submitQuestion(question.id, { ...submittedAnswer, status });

              return status;
            }}
            onSelfCheck={async (status) => {
              const gradedQuestion = await selfGradeMutation.mutateAsync({
                userId,
                problemSetId,
                questionId: question.id,
                status: status === 'correct' ? 'correct' : 'wrong',
              });
              if (gradedQuestion.status !== 'correct' && gradedQuestion.status !== 'incorrect') {
                throw new Error('채점 결과를 확인할 수 없습니다.');
              }
              gradeQuestion(question.id, gradedQuestion.status);
            }}
            onRetry={() => {
              window.alert('문제별 다시풀기는 서버 API가 지원된 이후 연결될 예정입니다.');
              return Promise.resolve(false);
            }}
            onNext={handleNext}
          />
        )}
      </div>

      <ProblemSideToc
        problemSetId={problemSetId}
        questions={detail.questions}
        isOpen={isTocOpen}
        onClose={() => {
          setIsTocOpen(false);
        }}
        navigation={{
          previousHref: previousQuestion
            ? `/problem/${problemSetId}/questions/${previousQuestion.id}${reviewQuery}`
            : undefined,
          nextHref: nextQuestion
            ? `/problem/${problemSetId}/questions/${nextQuestion.id}${reviewQuery}`
            : `/problem/${problemSetId}/result`,
          previousDisabled: !previousQuestion,
          nextDisabled: false,
          onExitClick: handleOpenExitModal,
        }}
        questionHrefSuffix={reviewQuery}
      />

      <ProblemExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={handleCloseExitModal}
        onSaveAndExit={() => {
          void handleSaveAndExit();
        }}
        onExitWithoutSave={() => {
          resetSession();
          router.push(`/problem/${problemSetId}`);
        }}
      />
    </main>
  );
}
