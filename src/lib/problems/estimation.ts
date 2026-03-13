import type { Problem, ProblemCategory } from '@/types';
import { HINTS } from '@/lib/problems/hints';

let _counter = 0;
function uuid(): string {
  _counter++;
  return `p_${Date.now()}_${_counter}_${Math.random().toString(36).slice(2, 8)}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeEstimation(
  category: ProblemCategory,
  tier: 1 | 2 | 3,
  questionText: string,
  exact: number,
  detailedSteps: string[],
): Problem {
  const h = HINTS[category];
  return {
    id: uuid(),
    category,
    tier,
    questionText: `★ ${questionText}`,
    correctAnswer: String(exact),
    isEstimation: true,
    estimationRange: {
      exact,
      low: Math.floor(exact * 0.95),
      high: Math.ceil(exact * 1.05),
    },
    hint: h.hint,
    trickName: h.trickName,
    detailedSteps,
  };
}

export function generateEstimationAddition(): Problem {
  const a = randInt(1, 9) * 100 + randInt(-49, 49);
  const b = randInt(1, 9) * 100 + randInt(-49, 49);
  const c = randInt(1, 5) * 100 + randInt(-49, 49);
  const exact = a + b + c;
  const ra = Math.round(a / 100) * 100;
  const rb = Math.round(b / 100) * 100;
  const rc = Math.round(c / 100) * 100;

  return makeEstimation('estimation_addition', 1, `${a} + ${b} + ${c}`, exact, [
    `Round: ${a} → ${ra}, ${b} → ${rb}, ${c} → ${rc}.`,
    `${ra} + ${rb} + ${rc} = ${ra + rb + rc}.`,
    `Exact: ${exact}. Estimate: ${ra + rb + rc}.`,
  ]);
}

export function generateEstimationSubtraction(): Problem {
  const a = randInt(15, 50) * 100 + randInt(-99, 99);
  const b = randInt(10, Math.floor(a / 100) - 2) * 100 + randInt(-99, 99);
  const exact = a - b;
  const ra = Math.round(a / 100) * 100;
  const rb = Math.round(b / 100) * 100;

  return makeEstimation('estimation_subtraction', 2, `${a} − ${b}`, exact, [
    `Round: ${a} → ${ra}, ${b} → ${rb}.`,
    `${ra} − ${rb} = ${ra - rb}.`,
    `Exact: ${exact}. Estimate: ${ra - rb}.`,
  ]);
}

export function generateEstimationLargeAddition(): Problem {
  const a = randInt(3, 9) * 100 + randInt(10, 90);
  const b = randInt(2, 8) * 100 + randInt(10, 90);
  const c = randInt(1, 6) * 100 + randInt(10, 90);
  const exact = a + b + c;
  const ra = Math.round(a / 100) * 100;
  const rb = Math.round(b / 100) * 100;
  const rc = Math.round(c / 100) * 100;

  return makeEstimation('estimation_large_addition', 2, `${a} + ${b} + ${c}`, exact, [
    `Round: ${a} → ${ra}, ${b} → ${rb}, ${c} → ${rc}.`,
    `${ra} + ${rb} + ${rc} = ${ra + rb + rc}.`,
    `Exact: ${exact}. Estimate: ${ra + rb + rc}.`,
  ]);
}

export function generateEstimationMultiplication(): Problem {
  const a = randInt(12, 49);
  const b = randInt(12, 49);
  const exact = a * b;
  const ra = Math.round(a / 10) * 10;
  const rb = Math.round(b / 10) * 10;

  return makeEstimation('estimation_multiplication', 3, `${a} × ${b}`, exact, [
    `Round: ${a} → ${ra}, ${b} → ${rb}.`,
    `${ra} × ${rb} = ${ra * rb}.`,
    `Exact: ${exact}. Estimate: ${ra * rb}.`,
  ]);
}
