import Link from 'next/link';

import ArrowIcon from '@/assets/icons/common/arrow.svg';
import DoubleArrowIcon from '@/assets/icons/problem/double-arrow.svg';
import { Button } from '@/components/common/Button';

import type { ProblemQuestionListItem } from '../_types/problemSolving';

type ProblemSideTocNavigation = {
  previousHref?: string;
  previousDisabled?: boolean;
  nextHref?: string;
  nextDisabled?: boolean;
  onExitClick?: () => void;
};

type ProblemSideTocProps = {
  problemSetId: string;
  questions: ProblemQuestionListItem[];
  isOpen: boolean;
  onClose: () => void;
  navigation?: ProblemSideTocNavigation;
  questionHrefSuffix?: string;
  isBusy?: boolean;
  onNavigate?: (href: string) => void;
};

type SideNavigationButtonProps = {
  href?: string;
  disabled?: boolean;
  direction: 'previous' | 'next';
  label: string;
  onNavigate?: (href: string) => void;
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function SideNavigationArrow({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <span
      className="flex h-[16px] w-[16px] shrink-0 items-center justify-center overflow-visible text-gray-500"
      aria-hidden="true"
    >
      <ArrowIcon
        className={cn('block h-[16px] w-[10px] shrink-0', direction === 'next' && 'rotate-180')}
        focusable="false"
      />
    </span>
  );
}

function SideNavigationButton({
  href,
  disabled = false,
  direction,
  label,
  onNavigate,
}: SideNavigationButtonProps) {
  const isDisabled = disabled || !href;
  const content = (
    <>
      {direction === 'previous' && <SideNavigationArrow direction="previous" />}
      <span>{label}</span>
      {direction === 'next' && <SideNavigationArrow direction="next" />}
    </>
  );
  if (isDisabled || !href) {
    return (
      <Button variant="outlinePrimary" size={46} fullWidth disabled className="gap-[5px]">
        {content}
      </Button>
    );
  }

  return (
    <Button asChild variant="outlinePrimary" size={46} fullWidth className="gap-[5px]">
      <Link
        href={href}
        onClick={
          onNavigate
            ? (event) => {
                event.preventDefault();
                onNavigate(href);
              }
            : undefined
        }
      >
        {content}
      </Link>
    </Button>
  );
}

export default function ProblemSideToc({
  problemSetId,
  questions,
  isOpen,
  onClose,
  navigation,
  questionHrefSuffix = '',
  isBusy = false,
  onNavigate,
}: ProblemSideTocProps) {
  return (
    <aside
      className={cn(
        'bg-bg-white fixed top-[80px] right-0 z-30 flex h-[calc(100dvh-80px)] w-[388px] flex-col px-[32px] py-[32px] shadow-[-16px_0_40px_rgb(0_0_0_/_0.08)] transition-transform duration-200',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex h-[30px] items-center justify-between">
        <h2 className="text-[20px] leading-[30px] font-bold text-gray-950">목차</h2>

        <button
          type="button"
          aria-label="목차 닫기"
          className="flex h-[32px] w-[32px] items-center justify-center text-gray-500"
          onClick={onClose}
        >
          <DoubleArrowIcon className="h-[16px] w-[14px]" aria-hidden="true" focusable="false" />
        </button>
      </div>

      <div className="mt-[20px] h-px w-full bg-gray-300" />

      <nav className="mt-[12px] flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-[20px]">
          {questions.map((question) => (
            <li key={question.id} className="flex h-[46px] items-center justify-between gap-[12px]">
              <p className="flex min-w-0 flex-1 items-center gap-[4px] text-[16px] leading-[24px] font-medium text-gray-950">
                <span className="shrink-0 font-medium">
                  {String(question.no).padStart(2, '0')}.
                </span>
                <span className="truncate">{question.title}</span>
              </p>

              <Button
                asChild
                size={38}
                width={68}
                className="shrink-0 !rounded-[10px] !text-[14px] leading-[20px]"
              >
                <Link
                  href={`/problem/${problemSetId}/questions/${question.id}${questionHrefSuffix}`}
                  aria-disabled={isBusy}
                  onClick={(event) => {
                    if (isBusy || onNavigate) event.preventDefault();
                    if (!isBusy && onNavigate)
                      onNavigate(
                        `/problem/${problemSetId}/questions/${question.id}${questionHrefSuffix}`,
                      );
                  }}
                >
                  문제 선택
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {navigation && (
        <div className="mt-[24px] border-t border-gray-300 pt-[20px]">
          <div className="grid grid-cols-2 gap-[12px]">
            <SideNavigationButton
              href={navigation.previousHref}
              disabled={isBusy || navigation.previousDisabled}
              onNavigate={onNavigate}
              direction="previous"
              label="이전문제"
            />
            <SideNavigationButton
              href={navigation.nextHref}
              disabled={isBusy || navigation.nextDisabled}
              onNavigate={onNavigate}
              direction="next"
              label="다음문제"
            />
          </div>

          <Button
            size={46}
            fullWidth
            className="mt-[10px]"
            onClick={navigation.onExitClick}
            disabled={isBusy}
          >
            저장하고 종료하기
          </Button>
        </div>
      )}
    </aside>
  );
}
