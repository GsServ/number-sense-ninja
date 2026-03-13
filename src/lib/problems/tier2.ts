import type { Problem, ProblemCategory, FractionVisualData } from '@/types';
import { HINTS } from '@/lib/problems/hints';

// ── Helpers ──

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
  while (b) {
    [a, b] = [b, a % b];
  }
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
    tier: 2,
    questionText,
    correctAnswer,
    isEstimation: false,
    hint: h.hint,
    trickName: h.trickName,
    detailedSteps,
    ...extra,
  };
}

// ── Generators ──

export function generateThreeDigitAdd(): Problem {
  const a = randInt(100, 999);
  const b = randInt(100, 999);
  const ans = a + b;
  return makeProblem('three_digit_add', `${a} + ${b}`, String(ans), [
    `Hundreds: ${Math.floor(a / 100)} + ${Math.floor(b / 100)} = ${Math.floor(a / 100) + Math.floor(b / 100)}.`,
    `Tens: ${Math.floor((a % 100) / 10)} + ${Math.floor((b % 100) / 10)} = ${Math.floor((a % 100) / 10) + Math.floor((b % 100) / 10)}.`,
    `Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}.`,
    `Combine with carries: ${a} + ${b} = ${ans}.`,
  ]);
}

export function generateThreeDigitSubBorrow(): Problem {
  // Include cases with zeros like 504-267, 800-356
  const templates = [
    () => {
      // X0Y - ABC pattern (zero in tens)
      const h = randInt(2, 9);
      const o = randInt(0, 9);
      const a = h * 100 + o; // e.g., 504
      const b = randInt(100, a - 1);
      return { a, b };
    },
    () => {
      // X00 - ABC pattern (zeros)
      const h = randInt(2, 9);
      const a = h * 100; // e.g., 800
      const b = randInt(100, a - 1);
      return { a, b };
    },
    () => {
      // General borrowing case
      let a: number, b: number;
      do {
        a = randInt(200, 999);
        b = randInt(100, a - 1);
      } while ((a % 10) >= (b % 10)); // ensure borrowing needed in ones
      return { a, b };
    },
  ];

  const { a, b } = pick(templates)();
  const ans = a - b;
  const rounded = Math.ceil(b / 10) * 10;
  const diff = rounded - b;

  return makeProblem('three_digit_sub_borrow', `${a} − ${b}`, String(ans), [
    `Round ${b} up to ${rounded}.`,
    `${a} − ${rounded} = ${a - rounded}.`,
    `Add back ${diff}: ${a - rounded} + ${diff} = ${ans}.`,
  ]);
}

export function generateFourDigitSub(): Problem {
  const a = randInt(1000, 9999);
  const b = randInt(100, a - 1);
  const ans = a - b;

  return makeProblem('four_digit_sub', `${a} − ${b}`, String(ans), [
    `${a} − ${b}:`,
    `Work from left to right, borrowing as needed.`,
    `Answer: ${ans}.`,
  ]);
}

export function generateWhatNumberAddedTo(): Problem {
  const y = randInt(50, 500);
  const x = randInt(10, y - 5);
  const ans = y - x;

  return makeProblem('what_number_added_to', `What number added to ${x} equals ${y}?`, String(ans), [
    `"? + ${x} = ${y}" means ? = ${y} − ${x}.`,
    `${y} − ${x} = ${ans}.`,
  ]);
}

export function generateMultFacts789(): Problem {
  const facts: [number, number][] = [
    [7, 7], [7, 8], [7, 9], [8, 8], [8, 9], [9, 9],
  ];
  const [a, b] = pick(facts);
  const product = a * b;

  // 50% normal, 50% reverse
  if (Math.random() < 0.5) {
    return makeProblem('mult_facts_789', `${a} \u00d7 ${b}`, String(product), [
      `${a} \u00d7 ${b} = ${product}.`,
    ]);
  } else {
    return makeProblem('mult_facts_789', `${product} = ${a} \u00d7 ___`, String(b), [
      `${a} \u00d7 ? = ${product}.`,
      `${product} \u00f7 ${a} = ${b}.`,
    ]);
  }
}

export function generateDivisionFacts(): Problem {
  const b = randInt(2, 12);
  const quotient = randInt(2, 12);
  const a = b * quotient;

  return makeProblem('division_facts', `${a} \u00f7 ${b}`, String(quotient), [
    `${b} \u00d7 ? = ${a}.`,
    `${b} \u00d7 ${quotient} = ${a}.`,
    `So ${a} \u00f7 ${b} = ${quotient}.`,
  ]);
}

export function generateMultiStepOps(): Problem {
  const type = Math.random() < 0.5 ? 'mult_chain' : 'add_mult';

  if (type === 'mult_chain') {
    const a = randInt(2, 5);
    const b = randInt(2, 5);
    const c = randInt(2, 5);
    const ans = a * b * c;
    return makeProblem('multi_step_ops', `${a} \u00d7 ${b} \u00d7 ${c}`, String(ans), [
      `First: ${a} \u00d7 ${b} = ${a * b}.`,
      `Then: ${a * b} \u00d7 ${c} = ${ans}.`,
    ]);
  } else {
    const a = randInt(2, 15);
    const b = randInt(2, 9);
    const c = randInt(2, 9);
    const ans = a + b * c;
    return makeProblem('multi_step_ops', `${a} + ${b} \u00d7 ${c}`, String(ans), [
      `Multiply first: ${b} \u00d7 ${c} = ${b * c}.`,
      `Then add: ${a} + ${b * c} = ${ans}.`,
    ]);
  }
}

export function generateSequencesPatterns(): Problem {
  const isArithmetic = Math.random() < 0.7;

  if (isArithmetic) {
    const start = randInt(2, 20);
    const diff = randInt(2, 10);
    const length = randInt(4, 6);
    const missingIdx = randInt(1, length - 1);
    const terms: (number | string)[] = [];
    for (let i = 0; i < length; i++) {
      const val = start + i * diff;
      terms.push(i === missingIdx ? '___' : val);
    }
    const ans = start + missingIdx * diff;
    return makeProblem('sequences_patterns', `Find the missing number: ${terms.join(', ')}`, String(ans), [
      `This is an arithmetic sequence with common difference ${diff}.`,
      `Pattern: start at ${start}, add ${diff} each time.`,
      `Missing term: ${start} + ${missingIdx} \u00d7 ${diff} = ${ans}.`,
    ]);
  } else {
    // Geometric: ratio 2 or 3
    const ratio = pick([2, 3]);
    const start = randInt(1, 5);
    const length = 5;
    const missingIdx = randInt(1, length - 1);
    const terms: (number | string)[] = [];
    for (let i = 0; i < length; i++) {
      const val = start * Math.pow(ratio, i);
      terms.push(i === missingIdx ? '___' : val);
    }
    const ans = start * Math.pow(ratio, missingIdx);
    return makeProblem('sequences_patterns', `Find the missing number: ${terms.join(', ')}`, String(ans), [
      `This is a geometric sequence with ratio ${ratio}.`,
      `Each term is multiplied by ${ratio}.`,
      `Missing term: ${ans}.`,
    ]);
  }
}

export function generateRepeatedAddition(): Problem {
  const val = randInt(3, 12);
  const count = randInt(3, 7);
  const ans = val * count;
  const terms = Array(count).fill(val).join(' + ');

  return makeProblem('repeated_addition', terms, String(ans), [
    `${val} is repeated ${count} times.`,
    `${val} \u00d7 ${count} = ${ans}.`,
  ]);
}

export function generateFractionShadedArea(): Problem {
  const gridLayouts: Record<number, [number, number]> = {
    2: [1, 2],
    3: [1, 3],
    4: [2, 2],
    6: [2, 3],
    8: [2, 4],
    9: [3, 3],
    10: [2, 5],
    12: [3, 4],
  };

  const totals = Object.keys(gridLayouts).map(Number);
  const total = pick(totals);
  const [rows, cols] = gridLayouts[total];
  const shaded = randInt(1, total - 1);

  const g = gcd(shaded, total);
  const numSimp = shaded / g;
  const denSimp = total / g;
  const ans = numSimp === 1 && denSimp === 1 ? '1' : `${numSimp}/${denSimp}`;

  const visualData: FractionVisualData = { total, shaded, cols, rows };

  return makeProblem(
    'fraction_shaded_area',
    `What fraction of the shape is shaded? (${shaded} of ${total} parts)`,
    ans,
    [
      `${shaded} out of ${total} parts are shaded: ${shaded}/${total}.`,
      g > 1 ? `Simplify: divide both by ${g}: ${numSimp}/${denSimp}.` : `${shaded}/${total} is already in lowest terms.`,
    ],
    { visualData },
  );
}

// ── Master Tier 2 ──

const tier2Generators = [
  generateThreeDigitAdd,
  generateThreeDigitSubBorrow,
  generateFourDigitSub,
  generateWhatNumberAddedTo,
  generateMultFacts789,
  generateDivisionFacts,
  generateMultiStepOps,
  generateSequencesPatterns,
  generateRepeatedAddition,
  generateFractionShadedArea,
];

const easyTier2Generators = [
  generateThreeDigitAdd,
  generateWhatNumberAddedTo,
  generateMultFacts789,
  generateDivisionFacts,
  generateRepeatedAddition,
];

export function generateTier2Problem(): Problem {
  return pick(tier2Generators)();
}

export function generateEasyTier2Problem(): Problem {
  return pick(easyTier2Generators)();
}
