import type { Problem } from '@/types';

/**
 * Generate 3 plausible wrong answers (distractors) for a problem.
 * Returns an array of 4 shuffled choices including the correct answer.
 */
export function generateChoices(problem: Problem): string[] {
  const correct = problem.correctAnswer;
  const distractors = new Set<string>();

  // Try smart distractors first based on category
  const smart = getSmartDistractors(problem);
  for (const d of smart) {
    if (d !== correct && d !== '') distractors.add(d);
  }

  // Fill remaining with numeric offset distractors
  const num = parseFloat(correct);
  if (!isNaN(num) && !correct.includes('/')) {
    addNumericDistractors(num, problem, distractors, correct);
  } else if (correct.includes('/')) {
    addFractionDistractors(correct, distractors);
  } else {
    // Text answers (roman numerals, yes/no, etc.)
    addTextDistractors(correct, problem, distractors);
  }

  // Ensure we have exactly 3 distractors
  const result = Array.from(distractors).slice(0, 3);
  while (result.length < 3) {
    const fallback = generateFallback(correct, result);
    if (fallback && fallback !== correct && !result.includes(fallback)) {
      result.push(fallback);
    }
  }

  // Shuffle correct + distractors
  const choices = [correct, ...result];
  return shuffle(choices);
}

function getSmartDistractors(problem: Problem): string[] {
  const correct = problem.correctAnswer;
  const num = parseFloat(correct);
  const q = problem.questionText;

  switch (problem.category) {
    case 'basic_multiplication':
    case 'mult_facts_789': {
      // Off-by-one-factor: e.g. 7×8=56, distractors: 7×7=49, 7×9=63, 8×8=64
      const match = q.match(/(\d+)\s*×\s*(\d+)/);
      if (match) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        return [
          String(a * (b - 1)), String(a * (b + 1)),
          String((a - 1) * b), String((a + 1) * b),
        ].filter(d => d !== correct && parseInt(d) > 0);
      }
      return [];
    }

    case 'three_digit_sub_borrow':
    case 'four_digit_sub': {
      // Dropped leading digit, off by 10/100, reversed subtraction
      if (!isNaN(num)) {
        const results: string[] = [];
        const s = String(num);
        if (s.length > 1) results.push(s.slice(1)); // drop leading digit
        results.push(String(num + 10), String(num - 10));
        results.push(String(num + 100), String(num - 100));
        // Check if they might have added instead
        const match = q.match(/(\d+)\s*[−\-]\s*(\d+)/);
        if (match) results.push(String(parseInt(match[1]) + parseInt(match[2])));
        return results;
      }
      return [];
    }

    case 'what_number_added_to': {
      // Common: adding instead of subtracting, off-by-one borrow
      const match = q.match(/(\d+).*?(\d+)/);
      if (match && !isNaN(num)) {
        const x = parseInt(match[1]), y = parseInt(match[2]);
        return [String(x + y), String(num + 10), String(num - 10), String(Math.abs(num - 1))];
      }
      return [];
    }

    case 'money_conversion': {
      // Dime/nickel confusion: multiply/divide by wrong coin value
      if (!isNaN(num)) {
        return [String(num + 5), String(num - 5), String(num + 10), String(Math.max(1, num - 10))];
      }
      return [];
    }

    case 'order_of_operations':
    case 'multi_step_ops': {
      // PEMDAS violation: doing left to right
      const addMul = q.match(/(\d+)\s*\+\s*(\d+)\s*×\s*(\d+)/);
      if (addMul) {
        const a = parseInt(addMul[1]), b = parseInt(addMul[2]), c = parseInt(addMul[3]);
        return [String((a + b) * c), String(a + b + c), String(a * b + c)];
      }
      const subMul = q.match(/(\d+)\s*[−\-]\s*(\d+)\s*×\s*(\d+)/);
      if (subMul) {
        const a = parseInt(subMul[1]), b = parseInt(subMul[2]), c = parseInt(subMul[3]);
        return [String((a - b) * c), String(a - b - c), String(a + b * c + 1)];
      }
      return [];
    }

    case 'squaring': {
      // Common: doubling instead of squaring
      const match = q.match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1]);
        return [String(n * 2), String(n * n + n), String(n * n - 1), String((n + 1) * (n + 1))];
      }
      return [];
    }

    case 'area_triangle': {
      // Forgetting to divide by 2
      if (!isNaN(num)) {
        return [String(num * 2), String(num + 1), String(num - 1)];
      }
      return [];
    }

    case 'perimeter_rectangle': {
      // Only adding 2 sides (not doubling), or computing area
      const match = q.match(/(\d+).*?(\d+)/);
      if (match && !isNaN(num)) {
        const l = parseInt(match[1]), w = parseInt(match[2]);
        return [String(l + w), String(l * w), String(num + 2), String(num - 2)];
      }
      return [];
    }

    case 'perimeter_square': {
      // Squaring instead of ×4
      const match = q.match(/(\d+)/);
      if (match) {
        const s = parseInt(match[1]);
        return [String(s * s), String(s * 3), String(s * 4 + s)];
      }
      return [];
    }

    case 'area_square': {
      // ×4 instead of squaring
      const match = q.match(/(\d+)/);
      if (match) {
        const s = parseInt(match[1]);
        return [String(s * 4), String(s * s + 1), String(s * s - 1)];
      }
      return [];
    }

    case 'estimation_addition':
    case 'estimation_subtraction':
    case 'estimation_large_addition':
    case 'estimation_multiplication': {
      // Offer answers at different rounding levels
      if (!isNaN(num)) {
        const pct = Math.max(10, Math.round(Math.abs(num) * 0.08));
        return [String(num + pct), String(num - pct), String(Math.round(num * 1.15)), String(Math.round(num * 0.85))];
      }
      return [];
    }

    case 'division_remainder': {
      // Giving quotient instead of remainder, off by 1
      const match = q.match(/(\d+)\s*÷\s*(\d+)/);
      if (match && !isNaN(num)) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        const quotient = Math.floor(a / b);
        return [String(quotient), String(num + 1), String(Math.max(0, num - 1)), String(b - num)];
      }
      return [];
    }

    case 'clock_reading': {
      if (!isNaN(num)) {
        return [String(num + 15), String(Math.max(5, num - 15)), String(num + 30), String(num + 5)];
      }
      // Time format answers
      if (correct.includes(':')) {
        const [h, m] = correct.split(':').map(Number);
        return [
          `${h}:${String((m + 15) % 60).padStart(2, '0')}`,
          `${h + 1}:${String(m).padStart(2, '0')}`,
          `${h}:${String(Math.max(0, m - 15)).padStart(2, '0')}`,
        ];
      }
      return [];
    }

    case 'prime_numbers': {
      if (correct === 'yes' || correct === 'no') {
        return [correct === 'yes' ? 'no' : 'yes'];
      }
      if (!isNaN(num)) {
        // Nearby non-prime and prime
        return [String(num + 1), String(num - 1), String(num + 2)];
      }
      return [];
    }

    default:
      return [];
  }
}

function addNumericDistractors(num: number, problem: Problem, set: Set<string>, correct: string): void {
  const isDecimal = correct.includes('.');
  const magnitude = Math.max(1, Math.abs(num));

  // Small offsets
  const offsets = magnitude < 20
    ? [1, 2, 3, -1, -2, -3]
    : magnitude < 100
      ? [1, 2, 5, 10, -1, -2, -5, -10]
      : magnitude < 1000
        ? [1, 10, 100, -1, -10, -100, 2, -2]
        : [1, 10, 100, 1000, -1, -10, -100, -1000];

  for (const off of offsets) {
    if (set.size >= 6) break; // generate extras, we'll pick 3
    const val = num + off;
    if (val < 0 && !problem.questionText.includes('−')) continue; // no negative if problem doesn't involve subtraction
    const str = isDecimal ? val.toFixed(1) : String(val);
    if (str !== correct && str !== '' && val !== 0 || problem.category.includes('sub')) {
      set.add(str);
    }
  }
}

function addFractionDistractors(correct: string, set: Set<string>): void {
  const parts = correct.split('/');
  if (parts.length !== 2) return;
  const n = parseInt(parts[0]), d = parseInt(parts[1]);
  if (isNaN(n) || isNaN(d)) return;

  // Unsimplified version
  set.add(`${n * 2}/${d * 2}`);
  // Off by one
  if (n + 1 < d) set.add(`${n + 1}/${d}`);
  if (n - 1 > 0) set.add(`${n - 1}/${d}`);
  // Flipped
  if (d !== n) set.add(`${d - n}/${d}`);
  // Different denominator
  set.add(`${n}/${d + 1}`);
}

function addTextDistractors(correct: string, problem: Problem, set: Set<string>): void {
  if (problem.category === 'arabic_to_roman') {
    // Generate nearby roman numerals
    const num = parseRomanish(correct);
    if (num > 0) {
      for (const off of [1, -1, 5, -5, 10, -10]) {
        const val = num + off;
        if (val > 0 && val < 4000) {
          set.add(toRomanSimple(val));
        }
      }
    }
  }

  if (correct === 'yes' || correct === 'no') {
    set.add(correct === 'yes' ? 'no' : 'yes');
  }
}

function generateFallback(correct: string, existing: string[]): string {
  const num = parseFloat(correct);
  if (!isNaN(num)) {
    for (let i = 1; i < 100; i++) {
      const candidates = [String(num + i), String(num - i)];
      for (const c of candidates) {
        if (c !== correct && !existing.includes(c) && parseFloat(c) >= 0) return c;
      }
    }
  }
  // For text answers
  return correct + '?'; // This shouldn't happen in practice
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Simple roman numeral helpers for distractor generation
const ROMAN_VALS: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRomanSimple(n: number): string {
  let result = '';
  for (const [val, sym] of ROMAN_VALS) {
    while (n >= val) { result += sym; n -= val; }
  }
  return result;
}

function parseRomanish(s: string): number {
  const vals: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  const upper = s.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const cur = vals[upper[i]] ?? 0;
    const next = i + 1 < upper.length ? (vals[upper[i + 1]] ?? 0) : 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}
