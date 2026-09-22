import Link from 'next/link';

import { Button } from '@/components/common/Button';

import type { ProblemResultRow } from '../_types/problemSolving';
import ProblemActionIcon from './ProblemActionIcon';
import ProblemStatusIcon from './ProblemStatusIcon';

type ProblemResultTableProps = {
  problemSetId: string;
  rows: ProblemResultRow[];
};

function ResultStatusIcon({ status }: { status: ProblemResultRow['status'] }) {
  if (status === 'correct') {
    return <ProblemStatusIcon type="correct" />;
  }
  if (status === 'incorrect') {
    return <ProblemStatusIcon type="incorrect" />;
  }
  if (status === 'awaitingSelfGrade' || status === 'notStarted') {
    return (
      <span className="text-[16px] text-gray-600">
        {status === 'awaitingSelfGrade' ? '채점 대기' : '미풀이'}
      </span>
    );
  }
  return <ProblemStatusIcon type="skipped" />;
}

export default function ProblemResultTable({ problemSetId, rows }: ProblemResultTableProps) {
  return (
    <section className="bg-bg-white mt-[32px] w-[1060px] rounded-[15px] px-[40px] py-[40px]">
      <div className="relative h-[74px] border-b border-gray-300 text-gray-950">
        <span className="absolute top-[12px] left-[80px] text-[24px] leading-[30px] font-bold tracking-[-0.02em]">
          문제명
        </span>
        <span className="absolute top-[12px] left-[410px] text-[24px] leading-[30px] font-bold tracking-[-0.02em]">
          정답 결과
        </span>
        <span className="absolute top-[12px] left-[602px] text-[24px] leading-[30px] font-bold tracking-[-0.02em]">
          소요시간
        </span>
        <span className="absolute top-[12px] right-[80px] text-[24px] leading-[30px] font-bold tracking-[-0.02em]">
          복습
        </span>
      </div>

      <div className="mt-[24px] flex flex-col gap-[24px]">
        {rows.map((row) => {
          const reviewHref = `/problem/${problemSetId}/questions/${row.questionId}?from=result`;

          return (
            <div key={row.questionId} className="relative h-[46px] text-gray-950">
              <Link
                href={reviewHref}
                className="absolute top-0 left-[40px] flex h-[46px] w-[360px] items-center gap-[8px] text-[20px] leading-[30px]"
              >
                <span className="shrink-0 font-bold">{String(row.no).padStart(2, '0')}.</span>
                <span className="truncate font-medium">{row.title}</span>
              </Link>

              <div className="absolute top-0 left-[398px] flex h-[46px] w-[120px] items-center justify-center">
                <ResultStatusIcon status={row.status} />
              </div>

              <div className="absolute top-0 left-[580px] flex h-[46px] w-[120px] items-center justify-center text-[20px] leading-[30px] font-medium">
                {row.elapsedTime}
              </div>

              <Button
                asChild
                size={46}
                width={114}
                className="absolute top-0 right-[40px] gap-[12px] !text-[16px]"
              >
                <Link href={reviewHref}>
                  <ProblemActionIcon className="h-[16px] w-[16px] shrink-0" />
                  <span>복습하기</span>
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
