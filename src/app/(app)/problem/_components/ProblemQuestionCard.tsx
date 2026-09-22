'use client';

import { useState } from 'react';

import CorrectCircleIcon from '@/assets/icons/common/cancel-circle.svg';
import DocumentsIcon from '@/assets/icons/settings/documents.svg';
import SkillsIcon from '@/assets/icons/settings/skills.svg';
import DoubleArrowIcon from '@/assets/icons/problem/double-arrow.svg';
import IncorrectCircleIcon from '@/assets/icons/problem/check-circle.svg';
import ReturnIcon from '@/assets/icons/problem/return.svg';
import { Button } from '@/components/common/Button';

import type { ProblemAttempt, ProblemQuestion, ProblemSolveStatus } from '../_types/problemSolving';
import ProblemStatusIcon from './ProblemStatusIcon';

type GradedStatus = Exclude<ProblemSolveStatus, 'pending'>;

type ProblemQuestionCardProps = {
  question: ProblemQuestion;
  initialAttempt?: ProblemAttempt;
  isLastQuestion: boolean;
  isReviewMode?: boolean;
  isBusy?: boolean;
  onDraftChange: (draft: { answer?: string; selectedChoiceId?: string }) => void;
  onSubmitAnswer: (submission: {
    answer: string;
    selectedChoiceId: string;
  }) => Promise<GradedStatus | null>;
  onSelfCheck: (status: GradedStatus) => Promise<void>;
  onRetry: () => Promise<boolean>;
  onNext: () => void;
};

const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤'];

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function normalizeAnswer(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function AnswerResultMessage({ status, className }: { status: GradedStatus; className?: string }) {
  const isCorrect = status === 'correct';

  return (
    <div className={cn('flex items-center gap-[12px]', className)}>
      <ProblemStatusIcon type={isCorrect ? 'correct' : 'incorrect'} />
      <p
        className={cn(
          'text-[18px] leading-[24px] font-bold tracking-normal',
          isCorrect ? 'text-success-subtle' : 'text-error',
        )}
      >
        {isCorrect ? '정답입니다!' : '오답입니다'}
      </p>
    </div>
  );
}

export default function ProblemQuestionCard({
  question,
  initialAttempt,
  isLastQuestion,
  isReviewMode = false,
  isBusy = false,
  onDraftChange,
  onSubmitAnswer,
  onSelfCheck,
  onRetry,
  onNext,
}: ProblemQuestionCardProps) {
  const wasSubmitted = Boolean(initialAttempt?.submitted);
  const initialGradedStatus =
    wasSubmitted && initialAttempt && initialAttempt.status !== 'pending'
      ? initialAttempt.status
      : null;
  const initialSelfCheck =
    question.gradingMode === 'self' && initialAttempt?.selfChecked ? initialGradedStatus : null;

  const [textAnswer, setTextAnswer] = useState(initialAttempt?.answer ?? '');
  const [selectedChoiceId, setSelectedChoiceId] = useState(initialAttempt?.selectedChoiceId ?? '');
  const [isHintVisible, setIsHintVisible] = useState(isReviewMode);
  const [isSubmitted, setIsSubmitted] = useState(wasSubmitted);
  const [submissionStatus, setSubmissionStatus] = useState<GradedStatus | null>(
    initialGradedStatus,
  );
  const [selfCheck, setSelfCheck] = useState<GradedStatus | null>(initialSelfCheck);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [actionError, setActionError] = useState('');

  const isWorking = isBusy || isSubmitting || isRetrying || isGrading;
  const canSubmit =
    !isSubmitted &&
    !isWorking &&
    (question.type === 'shortAnswer' ? textAnswer.trim().length > 0 : selectedChoiceId.length > 0);
  const canMoveNext =
    isSubmitted &&
    (question.gradingMode === 'auto' || Boolean(selfCheck) || question.status === 'skipped');
  const correctChoiceIndex = question.correctAnswer
    ? question.choices?.findIndex(
        (choice) => normalizeAnswer(choice.label) === normalizeAnswer(question.correctAnswer ?? ''),
      )
    : -1;
  const correctAnswerLabel = question.correctAnswer
    ? question.type === 'multipleChoice' &&
      correctChoiceIndex !== undefined &&
      correctChoiceIndex >= 0
      ? `${CIRCLED_NUMBERS[correctChoiceIndex] ?? `${correctChoiceIndex + 1}.`} ${question.correctAnswer}`
      : question.correctAnswer
    : null;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setActionError('');

    try {
      const status = await onSubmitAnswer({ answer: textAnswer, selectedChoiceId });
      setSubmissionStatus(status);
      setIsSubmitted(true);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : '답안 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelfCheck = async (status: GradedStatus) => {
    if (selfCheck || isWorking) {
      return;
    }

    setIsGrading(true);
    setActionError('');
    try {
      await onSelfCheck(status);
      setSelfCheck(status);
      setSubmissionStatus(status);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '채점 결과를 저장하지 못했습니다.');
    } finally {
      setIsGrading(false);
    }
  };

  const handleRetry = async () => {
    if (isWorking) return;
    setIsRetrying(true);
    setActionError('');

    try {
      const didRetry = await onRetry();
      if (!didRetry) {
        return;
      }

      setTextAnswer('');
      setSelectedChoiceId('');
      setIsHintVisible(false);
      setIsSubmitted(false);
      setSubmissionStatus(null);
      setSelfCheck(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : '다시 풀기를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const hintButton = (
    <Button
      variant="outline"
      size={54}
      width={110}
      disabled={!question.hint || isWorking}
      className="gap-[12px] leading-[24px]"
      onClick={() => {
        setIsHintVisible(true);
      }}
    >
      <SkillsIcon
        className="text-secondary-600 h-[18px] w-[18px] shrink-0 [&_*]:!fill-current [&_*]:!stroke-current"
        aria-hidden="true"
        focusable="false"
      />
      <span>힌트보기</span>
    </Button>
  );

  return (
    <section className="bg-bg-white w-[960px] rounded-[15px] px-[40px] py-[40px]">
      <div className="flex items-center gap-[12px] text-[16px] leading-[30px] font-medium">
        <span className="text-secondary-700 tracking-normal">
          문제 {String(question.no).padStart(2, '0')}.
        </span>
        <span className="tracking-[-0.02em] text-gray-700">{question.title}</span>
      </div>

      <h1 className="mt-[40px] text-[20px] leading-[30px] font-bold tracking-[-0.04em] text-gray-950">
        {question.question}
      </h1>

      {question.description && (
        <p className="mt-[12px] text-[16px] leading-[24px] whitespace-pre-wrap text-gray-700">
          {question.description}
        </p>
      )}

      {question.type === 'shortAnswer' && (
        <div className="mt-[60px] border-b border-gray-400">
          <input
            value={textAnswer}
            disabled={isSubmitted || isWorking}
            aria-label="서술형 답안"
            className="h-[38px] w-full bg-transparent px-[12px] text-[18px] leading-[24px] font-medium tracking-normal text-gray-900 outline-none disabled:text-gray-900"
            onChange={(event) => {
              const nextAnswer = event.target.value;
              setTextAnswer(nextAnswer);
              onDraftChange({ answer: nextAnswer });
            }}
          />
        </div>
      )}

      {question.type === 'multipleChoice' && (
        <ol className="mt-[40px] flex flex-col gap-[16px]">
          {question.choices?.map((choice, index) => {
            const isSelected = choice.id === selectedChoiceId;
            const selectedTextClassName = isSubmitted
              ? submissionStatus === 'correct'
                ? 'text-success'
                : 'text-error'
              : 'text-secondary-600';
            const selectedCircleClassName = isSubmitted
              ? submissionStatus === 'correct'
                ? 'border-success text-success'
                : 'border-error text-error'
              : 'border-secondary-600 text-secondary-600';

            return (
              <li key={choice.id}>
                <button
                  type="button"
                  disabled={isSubmitted || isWorking}
                  className={cn(
                    'flex items-center gap-[12px] text-[20px] leading-[24px] font-medium tracking-normal',
                    isSelected ? selectedTextClassName : 'text-gray-900',
                  )}
                  onClick={() => {
                    setSelectedChoiceId(choice.id);
                    onDraftChange({ selectedChoiceId: choice.id });
                  }}
                >
                  <span
                    className={cn(
                      'flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 text-[15px] leading-[20px] font-medium',
                      isSelected ? selectedCircleClassName : 'border-gray-500 text-gray-600',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span>{choice.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {isSubmitted && question.gradingMode === 'auto' && submissionStatus && (
        <>
          <AnswerResultMessage status={submissionStatus} className="mt-[28px]" />
          {correctAnswerLabel && (
            <p className="mt-[18px] flex items-center gap-[10px] font-medium tracking-normal text-gray-900">
              <span className="text-[20px] leading-[24px]">정답 :</span>
              <span className="flex min-h-[24px] items-center text-[18px] leading-[24px]">
                {correctAnswerLabel}
              </span>
            </p>
          )}
          {question.explanation && (
            <p className="mt-[12px] text-[18px] leading-[24px] font-medium tracking-normal text-gray-900">
              {question.explanation}
            </p>
          )}
        </>
      )}

      {isSubmitted && question.gradingMode === 'self' && question.status !== 'skipped' && (
        <div className="mt-[40px]">
          {!selfCheck ? (
            <>
              <p className="text-[18px] leading-[24px] font-bold text-gray-600">
                작성한 답안을 직접 채점해 주세요.
              </p>
              {question.explanation && (
                <p className="mt-[12px] text-[16px] leading-[24px] font-medium text-gray-700">
                  해설 : {question.explanation}
                </p>
              )}
              <div className="mt-[16px] w-[330px] overflow-hidden rounded-[10px] border border-gray-300">
                <button
                  type="button"
                  disabled={isWorking}
                  className="bg-bg-white flex h-[72px] w-full items-center gap-[16px] px-[20px] text-[16px] leading-[20px] font-medium text-gray-700"
                  onClick={() => {
                    void handleSelfCheck('correct');
                  }}
                >
                  <CorrectCircleIcon
                    className="h-[36px] w-[36px] shrink-0 text-gray-300 [&_path]:!fill-white [&_rect]:!fill-current"
                    aria-hidden="true"
                    focusable="false"
                  />
                  <span>정답</span>
                </button>
                <button
                  type="button"
                  disabled={isWorking}
                  className="bg-bg-white flex h-[72px] w-full items-center gap-[16px] border-t border-gray-300 px-[20px] text-[16px] leading-[20px] font-medium text-gray-700"
                  onClick={() => {
                    void handleSelfCheck('incorrect');
                  }}
                >
                  <IncorrectCircleIcon
                    className="h-[36px] w-[36px] shrink-0 text-gray-300 [&_path]:!fill-white [&_rect]:!fill-current"
                    aria-hidden="true"
                    focusable="false"
                  />
                  <span>오답</span>
                </button>
              </div>
            </>
          ) : (
            <AnswerResultMessage status={selfCheck} />
          )}

          {correctAnswerLabel && (
            <p className="mt-[18px] flex items-center gap-[10px] font-medium tracking-normal text-gray-900">
              <span className="text-[20px] leading-[24px]">정답 :</span>
              <span className="text-[18px] leading-[24px]">{correctAnswerLabel}</span>
            </p>
          )}
        </div>
      )}

      {isHintVisible && question.hint && (
        <div className="border-primary-700 mt-[32px] flex min-h-[96px] flex-col rounded-[10px] border-2 p-[20px]">
          <p className="text-[16px] leading-[24px] font-medium tracking-[-0.04em] text-gray-900">
            Hint 1.
          </p>
          <p className="mt-[8px] text-[18px] leading-[24px] font-medium tracking-normal text-gray-700">
            {question.hint}
          </p>
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-error mt-[20px] text-right text-[14px] font-medium">
          {actionError}
        </p>
      )}

      <div className="mt-[32px] flex justify-end gap-[10px]">
        {isSubmitted ? (
          <>
            {hintButton}
            <Button
              variant="outline"
              size={54}
              width={110}
              disabled={isWorking}
              className="gap-[12px] leading-[24px]"
              onClick={() => {
                void handleRetry();
              }}
            >
              <ReturnIcon
                className="h-[24px] w-[20px] shrink-0 text-gray-600 [&_path]:!fill-current"
                aria-hidden="true"
                focusable="false"
              />
              <span>{isRetrying ? '초기화 중' : '다시풀기'}</span>
            </Button>
            <Button
              size={54}
              width={isReviewMode && isLastQuestion ? 150 : 110}
              disabled={!canMoveNext || isWorking}
              className="gap-[12px] leading-[24px]"
              onClick={onNext}
            >
              <DoubleArrowIcon
                className="h-[24px] w-[20px] shrink-0 [&_path]:!fill-current"
                aria-hidden="true"
                focusable="false"
              />
              <span>
                {isReviewMode && isLastQuestion
                  ? '결과로 돌아가기'
                  : isLastQuestion
                    ? '결과보기'
                    : '다음문제'}
              </span>
            </Button>
          </>
        ) : (
          <>
            {hintButton}
            <Button
              size={54}
              width={110}
              disabled={!canSubmit}
              className="gap-[12px] leading-[24px]"
              onClick={() => {
                void handleSubmit();
              }}
            >
              <DocumentsIcon
                className="h-[18px] w-[18px] shrink-0 [&_*]:!fill-current [&_*]:!stroke-current"
                aria-hidden="true"
                focusable="false"
              />
              <span>{isSubmitting ? '제출 중' : '정답제출'}</span>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
