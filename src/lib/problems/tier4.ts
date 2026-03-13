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
    tier: 4,
    questionText,
    correctAnswer,
    isEstimation: false,
    hint: h.hint,
    trickName: h.trickName,
    detailedSteps,
    ...extra,
  };
}

// Roman numeral helpers
const ROMAN_MAP: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRoman(num: number): string {
  let result = '';
  for (const [val, sym] of ROMAN_MAP) {
    while (num >= val) {
      result += sym;
      num -= val;
    }
  }
  return result;
}

function fromRoman(s: string): number {
  const vals: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = vals[s[i]];
    const next = i + 1 < s.length ? vals[s[i + 1]] : 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

export function generateRomanToArabic(): Problem {
  const num = randInt(1, 399);
  const roman = toRoman(num);
  return makeProblem('roman_to_arabic', `Convert to a number: ${roman}`, String(num), [
    `Read left to right: ${roman}.`,
    `If smaller before larger, subtract. Otherwise add.`,
    `${roman} = ${num}.`,
  ]);
}

export function generateArabicToRoman(): Problem {
  const num = randInt(1, 399);
  const roman = toRoman(num);
  return makeProblem('arabic_to_roman', `Convert to Roman numerals: ${num}`, roman, [
    `Break down: ${num}.`,
    `Convert each part to Roman numerals.`,
    `${num} = ${roman}.`,
  ], { acceptableAnswers: [roman.toLowerCase()] });
}

export function generateSeries1ToN(): Problem {
  const n = randInt(5, 20);
  const ans = (n * (n + 1)) / 2;
  return makeProblem('series_1_to_n', `1 + 2 + 3 + … + ${n} = ?`, String(ans), [
    `Use formula: n(n+1)/2.`,
    `${n} × ${n + 1} = ${n * (n + 1)}.`,
    `${n * (n + 1)} ÷ 2 = ${ans}.`,
  ]);
}

export function generateSeriesOddNumbers(): Problem {
  const k = randInt(3, 10);
  const lastOdd = 2 * k - 1;
  const ans = k * k;
  const terms = Array.from({ length: Math.min(k, 4) }, (_, i) => 2 * i + 1).join(' + ');
  const display = k > 4 ? `${terms} + … + ${lastOdd}` : Array.from({ length: k }, (_, i) => 2 * i + 1).join(' + ');
  return makeProblem('series_odd_numbers', `${display} = ?`, String(ans), [
    `Count of odd numbers: ${k}.`,
    `Sum of first k odd numbers = k².`,
    `${k}² = ${ans}.`,
  ]);
}

export function generateSeriesArithmetic(): Problem {
  const first = randInt(2, 20);
  const diff = randInt(2, 8);
  const count = randInt(4, 7);
  const terms: number[] = [];
  for (let i = 0; i < count; i++) terms.push(first + i * diff);
  const last = terms[count - 1];
  const middle = (first + last) / 2;
  const ans = middle * count;
  const display = terms.slice(0, 3).join(' + ') + ' + … + ' + last;
  return makeProblem('series_arithmetic', `${display} = ?`, String(ans), [
    `First = ${first}, Last = ${last}, Count = ${count}.`,
    `Middle = (${first} + ${last}) / 2 = ${middle}.`,
    `Sum = middle × count = ${middle} × ${count} = ${ans}.`,
  ]);
}

export function generateOrderOfOperations(): Problem {
  const templates = [
    () => {
      const a = randInt(2, 15);
      const b = randInt(2, 9);
      const c = randInt(2, 9);
      return { q: `${a} + ${b} × ${c}`, a: a + b * c, steps: [`Multiply first: ${b} × ${c} = ${b * c}.`, `Add: ${a} + ${b * c} = ${a + b * c}.`] };
    },
    () => {
      const a = randInt(2, 9);
      const b = randInt(2, 9);
      const c = randInt(1, 10);
      return { q: `${a} × ${b} − ${c}`, a: a * b - c, steps: [`Multiply first: ${a} × ${b} = ${a * b}.`, `Subtract: ${a * b} − ${c} = ${a * b - c}.`] };
    },
    () => {
      const a = randInt(10, 30);
      const b = randInt(2, 6);
      const c = randInt(2, 6);
      return { q: `${a} − ${b} × ${c}`, a: a - b * c, steps: [`Multiply first: ${b} × ${c} = ${b * c}.`, `Subtract: ${a} − ${b * c} = ${a - b * c}.`] };
    },
  ];
  const t = pick(templates)();
  return makeProblem('order_of_operations', t.q, String(t.a), t.steps);
}

export function generateSquaring(): Problem {
  const n = randInt(2, 15);
  const ans = n * n;
  return makeProblem('squaring', `${n}²`, String(ans), [
    `${n} × ${n} = ${ans}.`,
  ]);
}

export function generateDivisionRemainder(): Problem {
  const divisor = pick([3, 4, 5, 6, 7, 8, 9]);
  const quotient = randInt(10, 80);
  const remainder = randInt(1, divisor - 1);
  const dividend = quotient * divisor + remainder;
  return makeProblem('division_remainder', `${dividend} ÷ ${divisor} has a remainder of ___`, String(remainder), [
    `${divisor} × ${quotient} = ${quotient * divisor}.`,
    `${dividend} − ${quotient * divisor} = ${remainder}.`,
    `Remainder: ${remainder}.`,
  ]);
}

export function generatePercentages(): Problem {
  const templates = [
    () => { const n = randInt(2, 20) * 2; return { q: `50% of ${n}`, a: n / 2, steps: [`50% = ½. ${n} ÷ 2 = ${n / 2}.`] }; },
    () => { const n = randInt(2, 20) * 4; return { q: `25% of ${n}`, a: n / 4, steps: [`25% = ¼. ${n} ÷ 4 = ${n / 4}.`] }; },
    () => { const n = randInt(2, 50) * 10; return { q: `10% of ${n}`, a: n / 10, steps: [`10% = ÷10. ${n} ÷ 10 = ${n / 10}.`] }; },
    () => { const n = randInt(2, 10) * 4; return { q: `75% of ${n}`, a: (n * 3) / 4, steps: [`75% = ¾. ${n} × 3 ÷ 4 = ${(n * 3) / 4}.`] }; },
  ];
  const t = pick(templates)();
  return makeProblem('percentages', t.q, String(t.a), t.steps);
}

export function generatePrimeNumbers(): Problem {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  if (Math.random() < 0.5) {
    // "Is X prime?"
    const candidates = [...primes.slice(0, 8), 4, 6, 8, 9, 10, 12, 14, 15];
    const n = pick(candidates);
    const isPrime = primes.includes(n);
    return makeProblem('prime_numbers', `Is ${n} a prime number? (yes or no)`, isPrime ? 'yes' : 'no', [
      isPrime
        ? `${n} is only divisible by 1 and ${n}. It is prime.`
        : `${n} is divisible by ${findSmallestFactor(n)}. It is NOT prime.`,
    ], { acceptableAnswers: isPrime ? ['yes', 'y', 'true'] : ['no', 'n', 'false'] });
  } else {
    // "First prime after X"
    const target = pick([4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 30]);
    const nextPrime = primes.find(p => p > target)!;
    return makeProblem('prime_numbers', `The first prime number after ${target} is ___`, String(nextPrime), [
      `Check numbers after ${target}: ${nextPrime} is prime.`,
    ]);
  }
}

function findSmallestFactor(n: number): number {
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return i;
  }
  return n;
}

const tier4Generators = [
  generateRomanToArabic,
  generateArabicToRoman,
  generateSeries1ToN,
  generateSeriesOddNumbers,
  generateSeriesArithmetic,
  generateOrderOfOperations,
  generateSquaring,
  generateDivisionRemainder,
  generatePercentages,
  generatePrimeNumbers,
];

export function generateTier4Problem(): Problem {
  return pick(tier4Generators)();
}
