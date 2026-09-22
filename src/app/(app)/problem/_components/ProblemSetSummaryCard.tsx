import Image from 'next/image';
import Link from 'next/link';

import type { MouseEventHandler } from 'react';

import { Button } from '@/components/common/Button';

import ProblemActionIcon from './ProblemActionIcon';
import type { ProblemSetSummary } from '../_types/problemSolving';

type ProblemSetSummaryCardProps = {
  problemSetId: string;
  summary: ProblemSetSummary;
  actionLabel: string;
  actionHref: string;
  actionDisabled?: boolean;
  onActionClick?: MouseEventHandler<HTMLAnchorElement>;
  showProgress?: boolean;
};

export default function ProblemSetSummaryCard({
  problemSetId,
  summary,
  actionLabel,
  actionHref,
  actionDisabled = false,
  onActionClick,
  showProgress = true,
}: ProblemSetSummaryCardProps) {
  const progressPercent =
    summary.totalCount <= 0
      ? 0
      : Math.min(100, Math.max(0, (summary.solvedCount / summary.totalCount) * 100));
  const actionContent = (
    <>
      <ProblemActionIcon className="h-[16px] w-[16px] shrink-0" />
      <span>{actionLabel}</span>
    </>
  );

  return (
    <section className="bg-bg-white mx-auto flex h-[151.52px] w-[1060px] overflow-hidden rounded-[15px]">
      <div className="relative h-[151.52px] w-[250px] shrink-0 overflow-hidden rounded-[15px]">
        <Image
          src={summary.thumbnailSrc}
          alt={`${summary.title} 썸네일`}
          fill
          sizes="250px"
          className="rounded-[15px] object-cover"
        />

        <span className="bg-bg-white absolute top-[12px] left-[12px] flex h-[24px] w-[38px] items-center justify-center rounded-full text-[12px] leading-[24px] font-bold">
          {summary.badge}
        </span>
      </div>

      <div className="flex flex-1 items-center pr-[40px] pl-[32px]">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-[20px] leading-[30px] font-bold text-gray-950">{summary.title}</h1>

          <p className="mt-[12px] text-[14px] leading-[30px] font-medium text-gray-600">
            마지막 진행일 : {summary.lastProgressDate}
          </p>

          {showProgress && (
            <div className="mt-[12px] flex w-[500px] flex-col items-end">
              <div className="h-[16px] w-full rounded-full bg-gray-300">
                <div
                  className="bg-secondary-600 h-full rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <span className="mt-[4px] text-[14px] leading-[20px] font-medium text-gray-700">
                {summary.solvedCount}/{summary.totalCount} 완료
              </span>
            </div>
          )}
        </div>

        <Button
          asChild={!actionDisabled}
          disabled={actionDisabled}
          size={46}
          paddingX={12}
          className="ml-[32px] shrink-0 gap-[16px] !text-[16px]"
        >
          {actionDisabled ? (
            actionContent
          ) : (
            <Link href={actionHref} onClick={onActionClick}>
              {actionContent}
            </Link>
          )}
        </Button>
      </div>

      <span className="sr-only">문제 세트 ID: {problemSetId}</span>
    </section>
  );
}
