import type { ProblemAttempt, ProblemQuestion } from '../_types/problemSolving';

export function mapProblemAttempt(question: ProblemQuestion): ProblemAttempt {
  const status =
    question.status === 'correct' || question.status === 'incorrect' ? question.status : 'pending';

  return {
    answer: question.myAnswer?.answer ?? '',
    selectedChoiceId: question.myAnswer?.selectedChoiceId ?? '',
    status,
    elapsedSeconds: question.elapsedSeconds ?? 0,
    submitted: Boolean(question.status && question.status !== 'notStarted'),
    selfChecked: status !== 'pending',
  };
}
