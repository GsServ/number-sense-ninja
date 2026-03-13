import type { Problem, ProblemCategory } from '@/types';
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
    tier: 1,
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

export function generateSingleDigitAdd(): Problem {
  const a = randInt(1, 9);
  const b = randInt(1, 9);
  const ans = a + b;
  return makeProblem('single_digit_add', `${a} + ${b}`, String(ans), [
    `Start with ${a}.`,
    `Count up ${b} more: ${a} + ${b} = ${ans}.`,
  ]);
}

export function generateSingleDigitSub(): Problem {
  const a = randInt(5, 18);
  const b = randInt(1, Math.min(9, a - 1));
  const ans = a - b;
  return makeProblem('single_digit_sub', `${a} − ${b}`, String(ans), [
    `Start at ${a}.`,
    `Count back ${b}: ${a} − ${b} = ${ans}.`,
  ]);
}

export function generateTwoDigitAdd(): Problem {
  let a: number, b: number;
  if (Math.random() < 0.6) {
    // no carry: ones digits sum < 10
    do {
      a = randInt(10, 99);
      b = randInt(10, 99);
    } while ((a % 10) + (b % 10) >= 10);
  } else {
    // carry
    do {
      a = randInt(10, 99);
      b = randInt(10, 99);
    } while ((a % 10) + (b % 10) < 10);
  }
  const ans = a + b;
  const tensA = Math.floor(a / 10) * 10;
  const onesA = a % 10;
  const tensB = Math.floor(b / 10) * 10;
  const onesB = b % 10;
  return makeProblem('two_digit_add', `${a} + ${b}`, String(ans), [
    `Tens: ${tensA} + ${tensB} = ${tensA + tensB}.`,
    `Ones: ${onesA} + ${onesB} = ${onesA + onesB}.`,
    `Total: ${tensA + tensB} + ${onesA + onesB} = ${ans}.`,
  ]);
}

export function generateTwoDigitAddCarry(): Problem {
  let a: number, b: number;
  do {
    a = randInt(10, 99);
    b = randInt(10, 99);
  } while ((a % 10) + (b % 10) < 10);
  const ans = a + b;
  const onesSum = (a % 10) + (b % 10);
  return makeProblem('two_digit_add_carry', `${a} + ${b}`, String(ans), [
    `Ones: ${a % 10} + ${b % 10} = ${onesSum}. Write ${onesSum % 10}, carry ${Math.floor(onesSum / 10)}.`,
    `Tens: ${Math.floor(a / 10)} + ${Math.floor(b / 10)} + ${Math.floor(onesSum / 10)} = ${Math.floor(ans / 10)}.`,
    `Answer: ${ans}.`,
  ]);
}

export function generateTwoDigitSub(): Problem {
  let a: number, b: number;
  if (Math.random() < 0.5) {
    // no borrow
    do {
      a = randInt(10, 99);
      b = randInt(10, 99);
    } while (a <= b || (a % 10) < (b % 10));
  } else {
    // borrow
    do {
      a = randInt(10, 99);
      b = randInt(10, 99);
    } while (a <= b || (a % 10) >= (b % 10));
  }
  const ans = a - b;
  return makeProblem('two_digit_sub', `${a} − ${b}`, String(ans), [
    `${a} − ${b}:`,
    `Tens: ${Math.floor(a / 10) * 10} − ${Math.floor(b / 10) * 10} = ${(Math.floor(a / 10) - Math.floor(b / 10)) * 10}.`,
    `Ones: ${a % 10} − ${b % 10} = ${(a % 10) - (b % 10)}.`,
    `Answer: ${ans}.`,
  ]);
}

export function generateTwoDigitSubBorrow(): Problem {
  let a: number, b: number;
  do {
    a = randInt(10, 99);
    b = randInt(10, 99);
  } while (a <= b || (a % 10) >= (b % 10));
  const ans = a - b;
  const roundedB = Math.ceil(b / 10) * 10;
  const diff = roundedB - b;
  return makeProblem('two_digit_sub_borrow', `${a} − ${b}`, String(ans), [
    `Round ${b} up to ${roundedB}.`,
    `${a} − ${roundedB} = ${a - roundedB}.`,
    `Add back ${diff}: ${a - roundedB} + ${diff} = ${ans}.`,
  ]);
}

export function generateMoneyConversion(): Problem {
  const coins: { name: string; value: number }[] = [
    { name: 'penny', value: 1 },
    { name: 'pennies', value: 1 },
    { name: 'nickel', value: 5 },
    { name: 'nickels', value: 5 },
    { name: 'dime', value: 10 },
    { name: 'dimes', value: 10 },
    { name: 'quarter', value: 25 },
    { name: 'quarters', value: 25 },
  ];

  const templates = [
    () => {
      const nq = randInt(1, 4);
      const nd = randInt(1, 5);
      const nn = randInt(0, 3);
      const total = nq * 25 + nd * 10 + nn * 5;
      return {
        q: `${nq} quarter${nq > 1 ? 's' : ''}, ${nd} dime${nd > 1 ? 's' : ''}, and ${nn} nickel${nn !== 1 ? 's' : ''} = ___ cents`,
        a: String(total),
        steps: [
          `${nq} quarter${nq > 1 ? 's' : ''} = ${nq * 25}\u00a2.`,
          `${nd} dime${nd > 1 ? 's' : ''} = ${nd * 10}\u00a2.`,
          `${nn} nickel${nn !== 1 ? 's' : ''} = ${nn * 5}\u00a2.`,
          `Total: ${nq * 25} + ${nd * 10} + ${nn * 5} = ${total}\u00a2.`,
        ],
      };
    },
    () => {
      const nq = randInt(2, 6);
      const total = nq * 25;
      return {
        q: `${nq} quarters = ___ cents`,
        a: String(total),
        steps: [`${nq} \u00d7 25 = ${total}\u00a2.`],
      };
    },
    () => {
      const nd = randInt(2, 9);
      const np = randInt(1, 9);
      const total = nd * 10 + np;
      return {
        q: `${nd} dimes and ${np} ${np === 1 ? 'penny' : 'pennies'} = ___ cents`,
        a: String(total),
        steps: [
          `${nd} dimes = ${nd * 10}\u00a2.`,
          `${np} ${np === 1 ? 'penny' : 'pennies'} = ${np}\u00a2.`,
          `Total: ${nd * 10} + ${np} = ${total}\u00a2.`,
        ],
      };
    },
    () => {
      const target = randInt(3, 8) * 25;
      const ans = target / 25;
      return {
        q: `How many quarters make ${target} cents?`,
        a: String(ans),
        steps: [`${target} \u00f7 25 = ${ans} quarters.`],
      };
    },
  ];

  const t = pick(templates)();
  return makeProblem('money_conversion', t.q, t.a, t.steps);
}

export function generateClockReading(): Problem {
  const startHour = randInt(1, 12);
  const startMin = randInt(0, 11) * 5;
  const elapsedHours = randInt(0, 3);
  const elapsedMins = randInt(1, 11) * 5;

  let endMin = startMin + elapsedMins;
  let endHour = startHour + elapsedHours;
  if (endMin >= 60) {
    endMin -= 60;
    endHour += 1;
  }
  if (endHour > 12) endHour -= 12;

  const fmtMin = (m: number) => (m < 10 ? `0${m}` : `${m}`);
  const startStr = `${startHour}:${fmtMin(startMin)}`;
  const endStr = `${endHour}:${fmtMin(endMin)}`;
  const totalElapsed = elapsedHours * 60 + elapsedMins;

  const templates = [
    {
      q: `What time is it ${totalElapsed} minutes after ${startStr}?`,
      a: endStr,
      steps: [
        `Start at ${startStr}.`,
        `Add ${elapsedHours} hour${elapsedHours !== 1 ? 's' : ''} and ${elapsedMins} minutes.`,
        `${startStr} + ${totalElapsed} min = ${endStr}.`,
      ],
    },
    {
      q: `How many minutes from ${startStr} to ${endStr}?`,
      a: String(totalElapsed),
      steps: [
        `From ${startStr} to ${endStr}:`,
        `${elapsedHours} hour${elapsedHours !== 1 ? 's' : ''} = ${elapsedHours * 60} min.`,
        `Plus ${elapsedMins} more minutes.`,
        `Total: ${totalElapsed} minutes.`,
      ],
    },
  ];

  const t = pick(templates);
  return makeProblem('clock_reading', t.q, t.a, t.steps);
}

export function generateUnitConversion(): Problem {
  const conversions = [
    { from: 'hours', to: 'minutes', factor: 60, range: [1, 10] as [number, number] },
    { from: 'feet', to: 'inches', factor: 12, range: [1, 8] as [number, number] },
    { from: 'yards', to: 'feet', factor: 3, range: [1, 15] as [number, number] },
    { from: 'meters', to: 'centimeters', factor: 100, range: [1, 5] as [number, number] },
  ];

  const c = pick(conversions);
  const n = randInt(c.range[0], c.range[1]);
  const ans = n * c.factor;

  return makeProblem('unit_conversion', `${n} ${c.from} = ___ ${c.to}`, String(ans), [
    `1 ${c.from.replace(/s$/, '')} = ${c.factor} ${c.to}.`,
    `${n} \u00d7 ${c.factor} = ${ans} ${c.to}.`,
  ]);
}

export function generateGeometryFacts(): Problem {
  const shapes: { name: string; sides: number }[] = [
    { name: 'triangle', sides: 3 },
    { name: 'rectangle', sides: 4 },
    { name: 'square', sides: 4 },
    { name: 'pentagon', sides: 5 },
    { name: 'hexagon', sides: 6 },
    { name: 'octagon', sides: 8 },
  ];

  const s = pick(shapes);
  const askCorners = Math.random() < 0.5;
  const prop = askCorners ? 'corners' : 'sides';

  return makeProblem(
    'geometry_facts',
    `How many ${prop} does a ${s.name} have?`,
    String(s.sides),
    [`A ${s.name} has ${s.sides} ${prop}.`],
  );
}

export function generatePlaceValue(): Problem {
  const digits = randInt(3, 4);
  const num = digits === 3 ? randInt(100, 999) : randInt(1000, 9999);
  const numStr = String(num);

  const places: { name: string; index: number }[] = digits === 3
    ? [
        { name: 'ones', index: numStr.length - 1 },
        { name: 'tens', index: numStr.length - 2 },
        { name: 'hundreds', index: numStr.length - 3 },
      ]
    : [
        { name: 'ones', index: numStr.length - 1 },
        { name: 'tens', index: numStr.length - 2 },
        { name: 'hundreds', index: numStr.length - 3 },
        { name: 'thousands', index: numStr.length - 4 },
      ];

  const p = pick(places);
  const ans = numStr[p.index];

  return makeProblem(
    'place_value',
    `What digit is in the ${p.name} place of ${num.toLocaleString()}?`,
    ans,
    [`In ${num.toLocaleString()}, the ${p.name} digit is ${ans}.`],
  );
}

export function generateRounding(): Problem {
  const roundTo = Math.random() < 0.5 ? 10 : 100;
  const num = roundTo === 10 ? randInt(11, 999) : randInt(101, 9999);
  const ans = Math.round(num / roundTo) * roundTo;
  const lookDigit = roundTo === 10 ? num % 10 : Math.floor((num % 100) / 10);
  const direction = lookDigit >= 5 ? 'up' : 'down';

  return makeProblem(
    'rounding',
    `Round ${num} to the nearest ${roundTo}.`,
    String(ans),
    [
      `Look at the digit to the right of the ${roundTo === 10 ? 'tens' : 'hundreds'} place: ${lookDigit}.`,
      `${lookDigit} is ${lookDigit >= 5 ? '5 or more' : 'less than 5'}, so round ${direction}.`,
      `${num} rounds to ${ans}.`,
    ],
  );
}

export function generateComparingNumbers(): Problem {
  const target = randInt(20, 80);
  const count = randInt(4, 6);
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(randInt(target - 30, target + 30));
  }
  const greaterCount = numbers.filter((n) => n > target).length;
  const listStr = numbers.join(', ');

  return makeProblem(
    'comparing_numbers',
    `How many of these are greater than ${target}: ${listStr}?`,
    String(greaterCount),
    [
      `Compare each to ${target}:`,
      ...numbers.map((n) => `${n} ${n > target ? '>' : n === target ? '=' : '<'} ${target}`),
      `${greaterCount} number${greaterCount !== 1 ? 's are' : ' is'} greater than ${target}.`,
    ],
  );
}

export function generateBasicMultiplication(): Problem {
  // Weight toward 7, 8, 9
  const weighted = [2, 3, 4, 5, 6, 7, 7, 8, 8, 9, 9];
  const a = pick(weighted);
  const b = pick(weighted);
  const ans = a * b;

  return makeProblem('basic_multiplication', `${a} \u00d7 ${b}`, String(ans), [
    `${a} \u00d7 ${b} = ${ans}.`,
  ]);
}

export function generateNumberOrdering(): Problem {
  const target = randInt(20, 200);
  const count = randInt(4, 6);
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(randInt(target - 20, target + 20));
  }
  // Remove duplicates of target
  const filtered = numbers.filter((n) => n !== target);
  if (filtered.length < 3) {
    filtered.push(target + randInt(1, 10), target - randInt(1, 10));
  }

  const askLargestLess = Math.random() < 0.5;
  const listStr = filtered.join(', ');

  if (askLargestLess) {
    const lessThan = filtered.filter((n) => n < target).sort((a, b) => b - a);
    if (lessThan.length === 0) {
      // Ensure at least one number less than target
      const fallback = target - randInt(1, 10);
      filtered.push(fallback);
      const newList = filtered.join(', ');
      return makeProblem(
        'number_ordering',
        `From the list: ${newList}, what is the largest number less than ${target}?`,
        String(fallback),
        [`Numbers less than ${target}: ${fallback}.`, `Largest: ${fallback}.`],
      );
    }
    const ans = lessThan[0];
    return makeProblem(
      'number_ordering',
      `From the list: ${listStr}, what is the largest number less than ${target}?`,
      String(ans),
      [
        `Numbers less than ${target}: ${lessThan.join(', ')}.`,
        `Largest of those: ${ans}.`,
      ],
    );
  } else {
    const greaterThan = filtered.filter((n) => n > target).sort((a, b) => a - b);
    if (greaterThan.length === 0) {
      const fallback = target + randInt(1, 10);
      filtered.push(fallback);
      const newList = filtered.join(', ');
      return makeProblem(
        'number_ordering',
        `From the list: ${newList}, what is the smallest number greater than ${target}?`,
        String(fallback),
        [`Numbers greater than ${target}: ${fallback}.`, `Smallest: ${fallback}.`],
      );
    }
    const ans = greaterThan[0];
    return makeProblem(
      'number_ordering',
      `From the list: ${listStr}, what is the smallest number greater than ${target}?`,
      String(ans),
      [
        `Numbers greater than ${target}: ${greaterThan.join(', ')}.`,
        `Smallest of those: ${ans}.`,
      ],
    );
  }
}

// ── Master Tier 1 ──

const tier1Generators = [
  generateSingleDigitAdd,
  generateSingleDigitSub,
  generateTwoDigitAdd,
  generateTwoDigitAddCarry,
  generateTwoDigitSub,
  generateTwoDigitSubBorrow,
  generateMoneyConversion,
  generateClockReading,
  generateUnitConversion,
  generateGeometryFacts,
  generatePlaceValue,
  generateRounding,
  generateComparingNumbers,
  generateBasicMultiplication,
  generateNumberOrdering,
];

export function generateTier1Problem(): Problem {
  return pick(tier1Generators)();
}
