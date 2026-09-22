import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as api from '../src/api/problem.api.ts';
import { ApiError } from '../src/api/client.ts';
import {
  mapProblemQuestion,
  mapProblemSetDetail,
  mapProblemSetResult,
  mapProblemStatus,
} from '../src/app/(app)/problem/_utils/mapProblemApi.ts';
import { mapProblemAttempt } from '../src/app/(app)/problem/_utils/mapProblemAttempt.ts';
import { problemQueryKeys } from '../src/queries/problem/problemQueryKeys.ts';

const question = {
  id: 'question-1',
  problemSetId: 'set-1',
  order: 1,
  title: '배열 메서드',
  type: 'multipleChoice',
  gradingMode: 'auto',
  question: '배열 끝에 값을 추가하는 메서드는?',
  choices: [
    { id: 'choice-1', text: 'push' },
    { id: 'choice-2', text: 'pop' },
  ],
};
const summary = {
  id: 'set-1',
  title: 'JavaScript',
  category: 'frontend',
  subCategory: 'javascript',
  totalQuestionCount: 3,
  solvedQuestionCount: 1,
  correctQuestionCount: 1,
  createdAt: '2026-09-01T00:00:00Z',
};
const request = { problemSetId: 'set-1', questionId: 'question-1', userId: 'must-not-be-sent' };
const answer = { selectedChoiceId: 'choice-1', elapsedSeconds: 21 };

const requests = [
  ['목록', () => api.getProblemSets(request), 'GET', '/problem-sets'],
  ['상세', () => api.getProblemSetDetail(request), 'GET', '/problem-sets/set-1'],
  [
    '문제',
    () => api.getProblemQuestion(request),
    'GET',
    '/problem-sets/set-1/questions/question-1',
  ],
  ['결과', () => api.getProblemSetResult(request), 'GET', '/problem-sets/set-1/result'],
  [
    '임시 저장',
    () => api.saveProblemAnswer({ ...request, answer }),
    'PUT',
    '/problem-sets/set-1/questions/question-1/answer',
    { choiceId: 'choice-1', elapsedSeconds: 21 },
  ],
  [
    '제출',
    () => api.submitProblemAnswer({ ...request, answer: { answer: 'push', elapsedSeconds: 8 } }),
    'POST',
    '/problem-sets/set-1/questions/question-1/submit',
    { text: 'push', elapsedSeconds: 8 },
  ],
  [
    '건너뛰기',
    () => api.skipProblemQuestion({ ...request, answer: { elapsedSeconds: 4 } }),
    'POST',
    '/problem-sets/set-1/questions/question-1/skip',
    { elapsedSeconds: 4 },
  ],
  ['문제집 재시도', () => api.retryProblemSet(request), 'POST', '/problem-sets/set-1/retry'],
  [
    '문제 재시도',
    () => api.retryProblemQuestion(request),
    'POST',
    '/problem-sets/set-1/questions/question-1/retry',
  ],
  [
    '직접 정답 채점',
    () => api.selfGradeProblemQuestion({ ...request, status: 'correct' }),
    'PUT',
    '/problem-sets/set-1/questions/question-1/self-grade',
    { status: 'correct' },
  ],
  [
    '직접 오답 채점',
    () => api.selfGradeProblemQuestion({ ...request, status: 'wrong' }),
    'PUT',
    '/problem-sets/set-1/questions/question-1/self-grade',
    { status: 'wrong' },
  ],
];

for (const [name, call, method, path, body] of requests) {
  test(`${name}: 문서의 경로·메서드·본문과 쿠키 인증 사용`, async (t) => {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      calls++;
      assert.equal(url, `/backend-api${path}`);
      assert.equal(options.method, method);
      assert.equal(options.credentials, 'include');
      assert.equal(options.headers.get('Accept'), 'application/json');
      assert.deepEqual(options.body ? JSON.parse(options.body) : undefined, body);
      if (body) assert.equal(options.headers.get('Content-Type'), 'application/json');
      return Response.json(question);
    });
    assert.deepEqual(await call(), question);
    assert.equal(calls, 1);
  });
}

test('조회 취소 신호 전달 및 브라우저 응답 캐시 방지', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.signal, controller.signal);
    assert.equal(options.cache, 'no-store');
    return Response.json([]);
  });
  await api.getProblemSets({ signal: controller.signal });
});

test('인증 만료 시 성공한 답안처럼 처리하지 않는다', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
  );
  await assert.rejects(
    api.submitProblemAnswer({ ...request, answer }),
    (error) =>
      error instanceof ApiError && error.status === 401 && error.message === '로그인이 필요합니다.',
  );
});

test('직접 채점 실패 시 백엔드 검증 메시지 보존', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ message: ['먼저 답안을 제출해 주세요.'] }, { status: 400 }),
  );
  await assert.rejects(
    api.selfGradeProblemQuestion({ ...request, status: 'wrong' }),
    /먼저 답안을 제출/,
  );
});

test('객관식 정답 ID를 선택지 문구로 변환하고 설명과 해설 분리', () => {
  const mapped = mapProblemQuestion({
    ...question,
    correctAnswer: { choiceId: 'choice-1' },
    description: '문제 설명',
    explanation: 'push는 배열 끝에 추가합니다.',
    status: 'correct',
  });
  assert.equal(mapped.correctAnswer, 'push');
  assert.equal(mapped.description, '문제 설명');
  assert.equal(mapped.explanation, 'push는 배열 끝에 추가합니다.');
});

test('서버에서 공개하지 않은 정답이나 해설을 만들어내지 않는다', () => {
  const mapped = mapProblemQuestion({ ...question, description: '문제 설명' });
  assert.equal(mapped.correctAnswer, undefined);
  assert.equal(mapped.explanation, undefined);
  assert.equal(mapped.elapsedSeconds, 0);
});

test('자동 채점 서술형은 서버 채점 결과로 완료한다', () => {
  const mapped = mapProblemQuestion({
    ...question,
    type: 'shortAnswer',
    status: 'wrong',
    correctAnswer: { text: 'push' },
    myAnswer: { text: 'pop' },
    elapsedSeconds: 14,
  });
  assert.equal(mapped.gradingMode, 'auto');
  assert.deepEqual(mapProblemAttempt(mapped), {
    answer: 'pop',
    selectedChoiceId: '',
    status: 'incorrect',
    elapsedSeconds: 14,
    submitted: true,
    selfChecked: true,
  });
});

test('직접 채점 대기는 제출된 답안으로 복원하되 완료 처리하지 않는다', () => {
  const mapped = mapProblemQuestion({
    ...question,
    type: 'shortAnswer',
    gradingMode: 'self',
    status: 'awaitingSelfGrade',
    myAnswer: { text: '답안' },
  });
  const attempt = mapProblemAttempt(mapped);
  assert.equal(mapped.gradingMode, 'self');
  assert.equal(mapped.status, 'awaitingSelfGrade');
  assert.equal(attempt.submitted, true);
  assert.equal(attempt.selfChecked, false);
  assert.equal(attempt.status, 'pending');
});

test('임시 저장 답안과 소요시간은 제출 전 상태로 복원한다', () => {
  const attempt = mapProblemAttempt(
    mapProblemQuestion({
      ...question,
      status: 'notStarted',
      myAnswer: { choiceId: 'choice-2' },
      elapsedSeconds: 12,
    }),
  );
  assert.equal(attempt.selectedChoiceId, 'choice-2');
  assert.equal(attempt.elapsedSeconds, 12);
  assert.equal(attempt.submitted, false);
});

test('건너뛴 문제를 오답으로 바꾸거나 미제출로 취급하지 않는다', () => {
  assert.equal(mapProblemStatus('skipped'), 'skipped');
  const attempt = mapProblemAttempt(mapProblemQuestion({ ...question, status: 'skipped' }));
  assert.equal(attempt.submitted, true);
  assert.equal(attempt.status, 'pending');
});

test('목차를 서버 order 순으로 정렬하며 원본을 변경하지 않는다', () => {
  const questions = [
    { ...question, id: 'third', order: 3 },
    { ...question, id: 'first', order: 1 },
  ];
  const detail = mapProblemSetDetail({ ...summary, questions });
  assert.deepEqual(
    detail.questions.map((item) => item.id),
    ['first', 'third'],
  );
  assert.equal(questions[0].id, 'third');
});

test('부분 결과의 미풀이·채점 대기와 누락된 소요시간 보존', () => {
  const result = mapProblemSetResult({
    problemSetId: 'set-1',
    title: 'JavaScript',
    totalQuestionCount: 2,
    solvedQuestionCount: 0,
    correctQuestionCount: 0,
    wrongQuestionCount: 0,
    skippedQuestionCount: 0,
    awaitingSelfGradeCount: 1,
    accuracy: 0,
    totalElapsedSeconds: 10,
    questions: [
      {
        questionId: 'q2',
        order: 2,
        title: '미풀이',
        type: 'shortAnswer',
        gradingMode: 'auto',
        status: 'notStarted',
      },
      {
        questionId: 'q1',
        order: 1,
        title: '대기',
        type: 'shortAnswer',
        gradingMode: 'self',
        status: 'awaitingSelfGrade',
        elapsedSeconds: 10,
      },
    ],
  });
  assert.equal(result.awaitingSelfGradeCount, 1);
  assert.deepEqual(
    result.questions.map((item) => item.status),
    ['awaitingSelfGrade', 'notStarted'],
  );
  assert.equal(result.questions[1].elapsedSeconds, 0);
});

test('계정·문제집별 답안 및 결과 캐시가 분리된다', () => {
  assert.notDeepEqual(
    problemQueryKeys.question('user-a', 'set-1', 'q1'),
    problemQueryKeys.question('user-b', 'set-1', 'q1'),
  );
  assert.notDeepEqual(
    problemQueryKeys.result('user-a', 'set-1'),
    problemQueryKeys.result('user-a', 'set-2'),
  );
});
