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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function makeProblem(
  category: ProblemCategory,
  questionText: string,
  correctAnswer: string,
  detailedSteps: string[],
  extra?: Partial<Problem>,
): Problem {
  const h = HINTS[category];
  return {
    id: uuid(),
    category,
    tier: 3,
    questionText,
    correctAnswer,
    isEstimation: false,
    hint: h.hint,
    trickName: h.trickName,
    detailedSteps,
    ...extra,
  };
}

export function generateMultiplyBy11(): Problem {
  if (Math.random() < 0.6) {
    // 2-digit
    const n = randInt(11, 99);
    const ans = n * 11;
    const a = Math.floor(n / 10);
    const b = n % 10;
    const mid = a + b;
    const steps = mid < 10
      ? [`Write digits: ${a}, ${mid}, ${b}.`, `${n} × 11 = ${ans}.`]
      : [`${a} + ${b} = ${mid} (≥10, so carry 1).`, `Digits: ${a + 1}, ${mid % 10}, ${b}.`, `${n} × 11 = ${ans}.`];
    return makeProblem('multiply_by_11', `${n} × 11`, String(ans), steps);
  } else {
    // 3-digit
    const n = randInt(100, 250);
    const ans = n * 11;
    return makeProblem('multiply_by_11', `${n} × 11`, String(ans), [
      `Write last digit: ${n % 10}.`,
      `Add consecutive pairs right to left, carry if ≥10.`,
      `${n} × 11 = ${ans}.`,
    ]);
  }
}

export function generateMultiplyBy25(): Problem {
  const n = randInt(12, 400);
  const ans = n * 25;
  const q = Math.floor(n / 4);
  const r = n % 4;
  const suffix = ['00', '25', '50', '75'][r];

  return makeProblem('multiply_by_25', `${n} × 25`, String(ans), [
    `${n} ÷ 4 = ${q} remainder ${r}.`,
    `Suffix for R${r}: "${suffix}".`,
    `Answer: ${q}${suffix} = ${ans}.`,
  ]);
}

export function generateMultiplyBy50(): Problem {
  const n = randInt(11, 500);
  const ans = n * 50;
  const half = Math.floor(n / 2);
  const isEven = n % 2 === 0;

  return makeProblem('multiply_by_50', `${n} × 50`, String(ans), [
    `${n} ÷ 2 = ${half}${isEven ? '' : ' remainder 1'}.`,
    isEven ? `Append "00": ${half}00 = ${ans}.` : `Append "50": ${half}50 = ${ans}.`,
  ]);
}

export function generateSimplifyFractions(): Problem {
  const den = pick([4, 6, 8, 9, 10, 12, 15, 16, 18, 20]);
  const num = randInt(2, den - 1);
  const g = gcd(num, den);
  const sNum = num / g;
  const sDen = den / g;
  const ans = sNum === sDen ? '1' : `${sNum}/${sDen}`;

  return makeProblem('simplify_fractions', `Simplify ${num}/${den}`, ans, [
    `GCD of ${num} and ${den} is ${g}.`,
    `${num} ÷ ${g} = ${sNum}, ${den} ÷ ${g} = ${sDen}.`,
    `Simplified: ${ans}.`,
  ]);
}

export function generatePerimeterRectangle(): Problem {
  const l = randInt(3, 20);
  const w = randInt(2, 15);
  const ans = 2 * (l + w);
  return makeProblem('perimeter_rectangle', `Perimeter of a rectangle: length = ${l}, width = ${w}`, String(ans), [
    `P = 2 × (L + W) = 2 × (${l} + ${w}) = 2 × ${l + w} = ${ans}.`,
  ]);
}

export function generatePerimeterSquare(): Problem {
  const s = randInt(2, 25);
  const ans = 4 * s;
  return makeProblem('perimeter_square', `Perimeter of a square with side ${s}`, String(ans), [
    `P = 4 × ${s} = ${ans}.`,
  ]);
}

export function generateAreaRectangle(): Problem {
  const l = randInt(3, 15);
  const w = randInt(2, 12);
  const ans = l * w;
  return makeProblem('area_rectangle', `Area of a rectangle: length = ${l}, width = ${w}`, String(ans), [
    `A = L × W = ${l} × ${w} = ${ans}.`,
  ]);
}

export function generateAreaSquare(): Problem {
  const s = randInt(2, 15);
  const ans = s * s;
  return makeProblem('area_square', `Area of a square with side ${s}`, String(ans), [
    `A = ${s}² = ${s} × ${s} = ${ans}.`,
  ]);
}

export function generateAreaTriangle(): Problem {
  const b = randInt(4, 20);
  const h = randInt(2, 16);
  // ensure integer area
  const base = b % 2 === 0 ? b : b + 1;
  const ans = (base * h) / 2;
  return makeProblem('area_triangle', `Area of a triangle: base = ${base}, height = ${h}`, String(ans), [
    `A = ½ × base × height = ½ × ${base} × ${h} = ${(base * h)} ÷ 2 = ${ans}.`,
  ]);
}

export function generateWordProblems(): Problem {
  const templates = [
    () => {
      const name1 = pick(['Amy', 'Ben', 'Carlos', 'Dina']);
      const name2 = pick(['Eli', 'Fay', 'Gus', 'Hana']);
      const more = randInt(5, 30);
      const total = randInt(more + 5, more + 50);
      const ans = total - more;
      return {
        q: `${name1} has ${more} MORE stickers than ${name2}. ${name1} has ${total} stickers. How many does ${name2} have?`,
        a: String(ans),
        steps: [`${name2} has ${total} − ${more} = ${ans} stickers.`],
      };
    },
    () => {
      const rows = randInt(2, 6);
      const cols = randInt(4, 10);
      const item = pick(['oranges', 'apples', 'books', 'chairs']);
      const ans = rows * cols;
      return {
        q: `A box has ${rows} rows of ${cols} ${item}. How many ${item} in total?`,
        a: String(ans),
        steps: [`${rows} rows × ${cols} = ${ans} ${item}.`],
      };
    },
    () => {
      const each = randInt(3, 12);
      const count = randInt(3, 8);
      const ans = each * count;
      return {
        q: `Each bag has ${each} marbles. There are ${count} bags. How many marbles total?`,
        a: String(ans),
        steps: [`${each} × ${count} = ${ans} marbles.`],
      };
    },
    () => {
      const total = randInt(20, 100);
      const gave = randInt(5, total - 5);
      const ans = total - gave;
      return {
        q: `Sam had ${total} coins and gave away ${gave}. How many coins does Sam have left?`,
        a: String(ans),
        steps: [`${total} − ${gave} = ${ans} coins left.`],
      };
    },
  ];

  const t = pick(templates)();
  return makeProblem('word_problems', t.q, t.a, t.steps);
}

export function generateDecimalAddSub(): Problem {
  const isAdd = Math.random() < 0.5;
  const a = randInt(10, 99);
  const ad = randInt(1, 9);
  const b = randInt(10, 99);
  const bd = randInt(1, 9);
  const aVal = a + ad / 10;
  const bVal = b + bd / 10;

  if (isAdd) {
    const ans = Math.round((aVal + bVal) * 10) / 10;
    return makeProblem('decimal_add_sub', `${aVal.toFixed(1)} + ${bVal.toFixed(1)}`, String(ans), [
      `Line up decimals: ${aVal.toFixed(1)} + ${bVal.toFixed(1)}.`,
      `Add: ${ans}.`,
    ]);
  } else {
    const big = Math.max(aVal, bVal);
    const small = Math.min(aVal, bVal);
    const ans = Math.round((big - small) * 10) / 10;
    return makeProblem('decimal_add_sub', `${big.toFixed(1)} − ${small.toFixed(1)}`, String(ans), [
      `Line up decimals: ${big.toFixed(1)} − ${small.toFixed(1)}.`,
      `Subtract: ${ans}.`,
    ]);
  }
}

const tier3Generators = [
  generateMultiplyBy11,
  generateMultiplyBy25,
  generateMultiplyBy50,
  generateSimplifyFractions,
  generatePerimeterRectangle,
  generatePerimeterSquare,
  generateAreaRectangle,
  generateAreaSquare,
  generateAreaTriangle,
  generateWordProblems,
  generateDecimalAddSub,
];

export function generateTier3Problem(): Problem {
  return pick(tier3Generators)();
}
