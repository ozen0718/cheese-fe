import type { ProblemSet } from '../_types/problem';

const LEGACY_PROBLEM_SET_CUTOFF = Date.parse('2026-09-22T06:22:04Z');

export function getVisibleProblemSets(problemSets: ProblemSet[]) {
  return problemSets.filter((problemSet) => {
    // 삭제 API가 없어 제거 요청된 기존 샘플을 화면에서만 숨긴다.
    // 이후 새로 등록되는 동명 문제집은 그대로 표시한다.
    const isLegacySample =
      problemSet.title === 'JavaScript 기초' ||
      problemSet.title.startsWith('e2e set problem-178919');
    const wasCreatedBeforeCleanup = Date.parse(problemSet.createdAt) <= LEGACY_PROBLEM_SET_CUTOFF;

    return !isLegacySample || !wasCreatedBeforeCleanup;
  });
}
