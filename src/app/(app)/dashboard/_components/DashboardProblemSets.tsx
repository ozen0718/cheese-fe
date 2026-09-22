'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import ProblemCard from '@/app/(app)/problem/_components/ProblemCard';
import { useCurrentUser } from '@/queries/auth/useCurrentUser';
import { useProblemSets } from '@/queries/problem/useProblemQueries';
import DashboardCarouselNavButton from './DashboardCarouselNavButton';
import DashboardSectionHeader from './DashboardSectionHeader';

import { getInProgressProblemSets } from '../_lib/problem-sets';

import { ProblemSolvingIcon } from '@/assets/icons/sidebar';

const PROBLEM_CARD_WIDTH = 231;
const PROBLEM_CARD_GAP = 12;
const PROBLEM_CARD_SCROLL_STEP = PROBLEM_CARD_WIDTH + PROBLEM_CARD_GAP;
const PROBLEM_CARD_VISIBLE_COUNT = 4;

function getProblemCarouselMaxStartIndex(totalCount: number) {
  return Math.max(0, totalCount - PROBLEM_CARD_VISIBLE_COUNT);
}

export default function DashboardProblemSets() {
  const [startIndex, setStartIndex] = useState(0);

  const currentUserQuery = useCurrentUser();
  const problemSetsQuery = useProblemSets({
    enabled: currentUserQuery.isSuccess,
  });

  const practiceSets = useMemo(
    () => getInProgressProblemSets(problemSetsQuery.data ?? []),
    [problemSetsQuery.data],
  );
  const error = currentUserQuery.error ?? problemSetsQuery.error;
  const isLoading =
    !error &&
    (currentUserQuery.isPending || (currentUserQuery.isSuccess && problemSetsQuery.isPending));

  const maxStartIndex = getProblemCarouselMaxStartIndex(practiceSets.length);
  const visibleStartIndex = Math.min(startIndex, maxStartIndex);

  const canGoPrev = visibleStartIndex > 0;
  const canGoNext = visibleStartIndex < maxStartIndex;

  const handlePrev = () => {
    setStartIndex(Math.max(0, visibleStartIndex - 1));
  };

  const handleNext = () => {
    setStartIndex(Math.min(maxStartIndex, visibleStartIndex + 1));
  };

  return (
    <section>
      <DashboardSectionHeader icon={<ProblemSolvingIcon />} title="문제풀이" />

      {isLoading ? (
        <div
          role="status"
          className="flex min-h-[188px] items-center justify-center rounded-[10px] border border-gray-300 bg-white p-8 text-[15px] font-medium text-gray-600"
        >
          진행 중인 문제풀이를 불러오는 중입니다.
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex min-h-[188px] flex-col items-center justify-center gap-4 rounded-[10px] border border-gray-300 bg-white p-8 text-center text-[15px] font-medium text-gray-600"
        >
          <p>{error instanceof Error ? error.message : '문제풀이를 불러오지 못했습니다.'}</p>
          <button
            type="button"
            className="text-secondary-700 underline"
            onClick={() => {
              if (currentUserQuery.error) {
                void currentUserQuery.refetch();
                return;
              }

              void problemSetsQuery.refetch();
            }}
          >
            다시 시도
          </button>
        </div>
      ) : practiceSets.length > 0 ? (
        <div className="group relative h-[250px] w-full overflow-visible">
          <div className="-mx-2 overflow-hidden px-2 pb-3">
            <div
              className="flex w-max gap-3 transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${visibleStartIndex * PROBLEM_CARD_SCROLL_STEP}px)`,
              }}
            >
              {practiceSets.map((problemSet) => (
                <div key={problemSet.id} className="w-[231px] shrink-0">
                  <ProblemCard problemSet={problemSet} />
                </div>
              ))}
            </div>
          </div>

          {canGoPrev ? (
            <DashboardCarouselNavButton
              label="이전 문제풀이 보기"
              direction="left"
              onClick={handlePrev}
            />
          ) : null}

          {canGoNext ? (
            <DashboardCarouselNavButton
              label="다음 문제풀이 보기"
              direction="right"
              onClick={handleNext}
            />
          ) : null}
        </div>
      ) : (
        <div className="flex min-h-[188px] flex-col items-center justify-center rounded-[10px] border border-gray-300 bg-white p-8 text-center">
          <p className="text-text-muted text-[15px] leading-[22px] font-medium">
            진행 중인 문제풀이가 없습니다.
          </p>

          <Link
            href="/problem"
            className="mt-3 text-[15px] leading-[22px] font-medium hover:underline"
          >
            문제풀이 시작하기
          </Link>
        </div>
      )}
    </section>
  );
}
