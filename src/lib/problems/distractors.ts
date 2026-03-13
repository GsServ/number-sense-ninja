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
    if (d !== correct && d !== '' && d !== undefined) distractors.add(d);
  }

  // Fill remaining with numeric offset distractors
  if (distractors.size < 3) {
    const num = parseFloat(correct);
    if (!isNaN(num) && !correct.includes('/')) {
      addNumericDistractors(num, problem, distractors, correct);
    } else if (correct.includes('/')) {
      addFractionDistractors(correct, distractors);
    } else {
      addTextDistractors(correct, problem, distractors);
    }
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
    // ── Tier 1 ──

    case 'single_digit_add': {
      // Off by 1, off by 2, wrong operation (subtraction)
      const match = q.match(/(\d+)\s*\+\s*(\d+)/);
      if (match) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        return [String(a + b + 1), String(a + b - 1), String(Math.abs(a - b))].filter(d => parseInt(d) >= 0);
      }
      return [];
    }

    case 'single_digit_sub': {
      const match = q.match(/(\d+)\s*[−\-]\s*(\d+)/);
      if (match) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        return [String(a - b + 1), String(a - b - 1), String(a + b)].filter(d => parseInt(d) >= 0);
      }
      return [];
    }

    case 'two_digit_add':
    case 'two_digit_add_carry': {
      const match = q.match(/(\d+)\s*\+\s*(\d+)/);
      if (match && !isNaN(num)) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        const results: string[] = [];
        // Forgot carry: add tens and ones separately without carry
        const onesSum = (a % 10) + (b % 10);
        if (onesSum >= 10) {
          results.push(String(num - 10)); // forgot to carry
        }
        results.push(String(num + 10)); // extra carry
        results.push(String(num + 1), String(num - 1));
        // Subtracted instead of added
        if (a > b) results.push(String(a - b));
        return results;
      }
      return [];
    }

    case 'two_digit_sub':
    case 'two_digit_sub_borrow': {
      const match = q.match(/(\d+)\s*[−\-]\s*(\d+)/);
      if (match && !isNaN(num)) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        const results: string[] = [];
        results.push(String(num + 10)); // borrow error
        results.push(String(num - 10)); // borrow error other way
        results.push(String(a + b)); // added instead
        results.push(String(num + 1), String(num - 1));
        return results.filter(d => parseInt(d) >= 0);
      }
      return [];
    }

    case 'basic_multiplication':
    case 'mult_facts_789': {
      const match = q.match(/(\d+)\s*×\s*(\d+)/);
      if (match) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        // Check if it's a reverse problem: "56 = 7 × ___"
        const revMatch = q.match(/(\d+)\s*=\s*(\d+)\s*×/);
        if (revMatch) {
          const product = parseInt(revMatch[1]), factor = parseInt(revMatch[2]);
          const ans = product / factor;
          return [String(ans + 1), String(ans - 1), String(ans + 2)].filter(d => parseInt(d) > 0);
        }
        return [
          String(a * (b - 1)), String(a * (b + 1)),
          String((a - 1) * b), String((a + 1) * b),
        ].filter(d => d !== correct && parseInt(d) > 0);
      }
      return [];
    }

    case 'money_conversion': {
      if (!isNaN(num)) {
        const results: string[] = [];
        // Common coin confusion: quarter=25, dime=10, nickel=5
        if (q.includes('quarter')) {
          results.push(String(num + 25), String(num - 25));
          // Confused quarter value with 20
          const qMatch = q.match(/(\d+)\s*quarter/);
          if (qMatch) results.push(String(parseInt(qMatch[1]) * 20));
        }
        if (q.includes('dime')) {
          results.push(String(num + 10), String(num - 10));
        }
        if (q.includes('nickel')) {
          results.push(String(num + 5), String(num - 5));
        }
        results.push(String(num + 5), String(num - 5), String(num + 10));
        return results.filter(d => parseInt(d) > 0);
      }
      return [];
    }

    case 'clock_reading': {
      if (correct.includes(':')) {
        const [h, m] = correct.split(':').map(Number);
        return [
          `${h}:${String((m + 15) % 60).padStart(2, '0')}`,
          `${((h % 12) + 1) || 12}:${String(m).padStart(2, '0')}`,
          `${h}:${String(Math.abs((m - 15 + 60) % 60)).padStart(2, '0')}`,
        ];
      }
      // Minutes elapsed answer
      if (!isNaN(num)) {
        return [String(num + 15), String(Math.max(5, num - 15)), String(num + 30), String(num + 5)];
      }
      return [];
    }

    case 'unit_conversion': {
      // Use wrong conversion factors
      const match = q.match(/(\d+)\s+(\w+)\s*=\s*___\s*(\w+)/);
      if (match && !isNaN(num)) {
        const n = parseInt(match[1]);
        const from = match[2];
        const results: string[] = [];
        // Common factor confusions
        if (from === 'hours') {
          results.push(String(n * 100), String(n * 30), String(n * 24)); // confused with 100, half hour, day
        } else if (from === 'feet') {
          results.push(String(n * 10), String(n * 3), String(n * 6)); // confused 12 with 10, 3, 6
        } else if (from === 'yards') {
          results.push(String(n * 12), String(n * 2), String(n * 6)); // confused with feet/inches
        } else if (from === 'meters') {
          results.push(String(n * 10), String(n * 1000), String(n * 50)); // confused with 10, 1000
        }
        results.push(String(num + n), String(num - n));
        return results.filter(d => parseInt(d) > 0 && d !== correct);
      }
      return [];
    }

    case 'geometry_facts': {
      // Use side counts of OTHER shapes
      const allSides = [3, 4, 5, 6, 8];
      return allSides.filter(s => String(s) !== correct).map(String);
    }

    case 'place_value': {
      // Use OTHER digits from the number as distractors
      const numMatch = q.match(/of\s+([\d,]+)/);
      if (numMatch) {
        const numStr = numMatch[1].replace(/,/g, '');
        const digits = [...new Set(numStr.split(''))].filter(d => d !== correct);
        // If not enough unique digits, add 0 and other single digits
        if (digits.length < 3) {
          for (let d = 0; d <= 9; d++) {
            if (String(d) !== correct && !digits.includes(String(d))) {
              digits.push(String(d));
            }
            if (digits.length >= 5) break;
          }
        }
        return digits;
      }
      return [];
    }

    case 'rounding': {
      // Common rounding mistakes
      const roundMatch = q.match(/Round\s+(\d+)\s+to\s+the\s+nearest\s+(\d+)/);
      if (roundMatch && !isNaN(num)) {
        const original = parseInt(roundMatch[1]);
        const roundTo = parseInt(roundMatch[2]);
        const results: string[] = [];
        // Rounded wrong direction
        if (num > original) {
          results.push(String(num - roundTo)); // rounded down instead of up
        } else {
          results.push(String(num + roundTo)); // rounded up instead of down
        }
        // Rounded to wrong place value
        if (roundTo === 10) {
          results.push(String(Math.round(original / 100) * 100)); // rounded to 100 instead
        } else {
          results.push(String(Math.round(original / 10) * 10)); // rounded to 10 instead
        }
        // Off by one rounding unit
        results.push(String(num + roundTo), String(num - roundTo));
        return results.filter(d => parseInt(d) >= 0 && d !== correct);
      }
      return [];
    }

    case 'comparing_numbers': {
      // Off by 1 count, total count, zero
      if (!isNaN(num)) {
        const count = (q.match(/,/g) || []).length + 1; // approx count of numbers
        return [String(num + 1), String(Math.max(0, num - 1)), String(count), String(0)]
          .filter(d => d !== correct);
      }
      return [];
    }

    case 'number_ordering': {
      // Extract all numbers from the list and use them as distractors
      const listMatch = q.match(/list:\s*([\d,\s]+),\s*what/);
      if (listMatch) {
        const numbers = listMatch[1].split(',').map(s => s.trim()).filter(s => s !== correct);
        return shuffle(numbers).slice(0, 4);
      }
      // Fallback: nearby numbers
      if (!isNaN(num)) {
        return [String(num + 1), String(num - 1), String(num + 2), String(num - 2)]
          .filter(d => parseInt(d) >= 0);
      }
      return [];
    }

    // ── Tier 2 ──

    case 'three_digit_add': {
      const match = q.match(/(\d+)\s*\+\s*(\d+)/);
      if (match && !isNaN(num)) {
        return [String(num + 10), String(num - 10), String(num + 100), String(num - 1)];
      }
      return [];
    }

    case 'three_digit_sub_borrow':
    case 'four_digit_sub': {
      if (!isNaN(num)) {
        const results: string[] = [];
        const s = String(num);
        if (s.length > 1) results.push(s.slice(1)); // drop leading digit
        results.push(String(num + 10), String(num - 10));
        results.push(String(num + 100), String(num - 100));
        const match = q.match(/(\d+)\s*[−\-]\s*(\d+)/);
        if (match) results.push(String(parseInt(match[1]) + parseInt(match[2]))); // added instead
        return results;
      }
      return [];
    }

    case 'what_number_added_to': {
      const match = q.match(/(\d+).*?(\d+)/);
      if (match && !isNaN(num)) {
        const x = parseInt(match[1]), y = parseInt(match[2]);
        return [String(x + y), String(num + 10), String(num - 10), String(Math.abs(num - 1))];
      }
      return [];
    }

    case 'division_facts': {
      // Off by one quotient, nearby products
      const match = q.match(/(\d+)\s*÷\s*(\d+)/);
      if (match && !isNaN(num)) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        return [String(num + 1), String(num - 1), String(num + 2), String(b)]
          .filter(d => parseInt(d) > 0 && d !== correct);
      }
      return [];
    }

    case 'multi_step_ops': {
      // PEMDAS violations
      const addMul = q.match(/(\d+)\s*\+\s*(\d+)\s*×\s*(\d+)/);
      if (addMul) {
        const a = parseInt(addMul[1]), b = parseInt(addMul[2]), c = parseInt(addMul[3]);
        return [String((a + b) * c), String(a + b + c), String(a * b + c)];
      }
      const mulChain = q.match(/(\d+)\s*×\s*(\d+)\s*×\s*(\d+)/);
      if (mulChain) {
        const a = parseInt(mulChain[1]), b = parseInt(mulChain[2]), c = parseInt(mulChain[3]);
        const ans = a * b * c;
        return [String(ans + a), String(a * b + c), String(a + b * c)];
      }
      if (!isNaN(num)) return [String(num + 1), String(num - 1), String(num + 2)];
      return [];
    }

    case 'sequences_patterns': {
      // Use adjacent terms in the sequence or common arithmetic errors
      const termsMatch = q.match(/Find the missing number:\s*([\d_,\s]+)/);
      if (termsMatch && !isNaN(num)) {
        const parts = termsMatch[1].split(',').map(s => s.trim());
        const numbers = parts.filter(p => p !== '___' && !isNaN(parseInt(p))).map(Number);
        // Use numbers from the sequence as distractors
        const distractors = numbers.filter(n => String(n) !== correct);
        // Also add off-by-common-difference
        if (numbers.length >= 2) {
          const diff = Math.abs(numbers[1] - numbers[0]);
          distractors.push(num + diff, num - diff);
        }
        return [...new Set(distractors)].map(String).filter(d => d !== correct);
      }
      return [];
    }

    case 'repeated_addition': {
      // Count terms from the question, off by one repeat
      if (!isNaN(num)) {
        const match = q.match(/(\d+)/g);
        if (match) {
          const val = parseInt(match[0]);
          const count = match.length;
          return [String(val * (count + 1)), String(val * (count - 1)), String(num + val)]
            .filter(d => parseInt(d) > 0 && d !== correct);
        }
      }
      return [];
    }

    case 'fraction_shaded_area': {
      // Wrong simplification, unsimplified, flipped fraction
      if (correct.includes('/')) {
        const [n, d] = correct.split('/').map(Number);
        const results: string[] = [];
        // Unsimplified
        results.push(`${n * 2}/${d * 2}`);
        // Off by one numerator
        if (n + 1 < d) results.push(`${n + 1}/${d}`);
        if (n - 1 > 0) results.push(`${n - 1}/${d}`);
        // Complement fraction
        results.push(`${d - n}/${d}`);
        return results.filter(d => d !== correct);
      }
      return [];
    }

    // ── Tier 3 ──

    case 'multiply_by_11': {
      const match = q.match(/(\d+)\s*×\s*11/);
      if (match && !isNaN(num)) {
        const n = parseInt(match[1]);
        return [
          String(n * 10 + n), // just appended digit instead of carrying
          String(num + 11),   // off by 11
          String(num - 11),   // off by 11
          String(n * 12),     // confused with ×12
        ].filter(d => parseInt(d) > 0 && d !== correct);
      }
      return [];
    }

    case 'multiply_by_25': {
      const match = q.match(/(\d+)\s*×\s*25/);
      if (match && !isNaN(num)) {
        const n = parseInt(match[1]);
        return [
          String(n * 20),  // confused 25 with 20
          String(num + 25),
          String(num - 25),
          String(n * 24),  // off by one factor
        ].filter(d => parseInt(d) > 0 && d !== correct);
      }
      return [];
    }

    case 'multiply_by_50': {
      const match = q.match(/(\d+)\s*×\s*50/);
      if (match && !isNaN(num)) {
        const n = parseInt(match[1]);
        return [
          String(n * 5),   // forgot a zero
          String(num + 50),
          String(num - 50),
          String(n * 100),  // doubled instead of halved
        ].filter(d => parseInt(d) > 0 && d !== correct);
      }
      return [];
    }

    case 'simplify_fractions': {
      if (correct.includes('/')) {
        const [sn, sd] = correct.split('/').map(Number);
        // Parse original fraction from question
        const fMatch = q.match(/Simplify\s+(\d+)\/(\d+)/);
        if (fMatch) {
          const origN = parseInt(fMatch[1]), origD = parseInt(fMatch[2]);
          const results: string[] = [];
          // Not fully simplified (divided by smaller factor)
          if (origN / sn > 2) {
            const partialFactor = Math.floor(Math.sqrt(origN / sn));
            if (partialFactor > 1) {
              results.push(`${origN / partialFactor}/${origD / partialFactor}`);
            }
          }
          // Original unsimplified
          results.push(`${origN}/${origD}`);
          // Off by one
          if (sn + 1 < sd) results.push(`${sn + 1}/${sd}`);
          if (sn - 1 > 0) results.push(`${sn - 1}/${sd}`);
          // Flipped
          if (sd !== sn) results.push(`${sd - sn}/${sd}`);
          return results.filter(d => d !== correct);
        }
      }
      return [];
    }

    case 'perimeter_rectangle': {
      const match = q.match(/length\s*=\s*(\d+).*?width\s*=\s*(\d+)/);
      if (match && !isNaN(num)) {
        const l = parseInt(match[1]), w = parseInt(match[2]);
        return [
          String(l + w),     // forgot to double
          String(l * w),     // computed area instead
          String(num + 2),
          String(num - 2),
        ];
      }
      return [];
    }

    case 'perimeter_square': {
      const match = q.match(/side\s+(\d+)/);
      if (match) {
        const s = parseInt(match[1]);
        return [String(s * s), String(s * 3), String(s * 4 + s), String(s * 2)];
      }
      return [];
    }

    case 'area_rectangle': {
      const match = q.match(/length\s*=\s*(\d+).*?width\s*=\s*(\d+)/);
      if (match && !isNaN(num)) {
        const l = parseInt(match[1]), w = parseInt(match[2]);
        return [
          String(2 * (l + w)),  // computed perimeter instead
          String(num + l),
          String(num + w),
          String(num - 1),
        ].filter(d => parseInt(d) > 0);
      }
      return [];
    }

    case 'area_square': {
      const match = q.match(/side\s+(\d+)/);
      if (match) {
        const s = parseInt(match[1]);
        return [String(s * 4), String(s * s + 1), String(s * s - 1), String(s * 2)];
      }
      return [];
    }

    case 'area_triangle': {
      const match = q.match(/base\s*=\s*(\d+).*?height\s*=\s*(\d+)/);
      if (match && !isNaN(num)) {
        const b = parseInt(match[1]), h = parseInt(match[2]);
        return [
          String(b * h),       // forgot to divide by 2
          String(num + 1),
          String(num - 1),
          String(b + h),       // added instead of multiplied
        ].filter(d => parseInt(d) > 0);
      }
      return [];
    }

    case 'word_problems': {
      if (!isNaN(num)) {
        // Extract numbers from the problem
        const numbers = q.match(/\d+/g)?.map(Number) || [];
        const results: string[] = [];
        // Try all basic operations between the main numbers
        if (numbers.length >= 2) {
          const a = numbers[0], b = numbers[1];
          const ops = [a + b, Math.abs(a - b), a * b];
          for (const r of ops) {
            if (String(r) !== correct) results.push(String(r));
          }
        }
        results.push(String(num + 1), String(num - 1));
        return results.filter(d => parseInt(d) >= 0 && d !== correct);
      }
      return [];
    }

    case 'decimal_add_sub': {
      if (!isNaN(num)) {
        const isDecimal = correct.includes('.');
        const results: string[] = [];
        // Off by 0.1 (misaligned decimal)
        results.push(isDecimal ? (num + 0.1).toFixed(1) : String(num + 1));
        results.push(isDecimal ? (num - 0.1).toFixed(1) : String(num - 1));
        // Off by 1 (decimal place error)
        results.push(isDecimal ? (num + 1).toFixed(1) : String(num + 10));
        results.push(isDecimal ? (num - 1).toFixed(1) : String(num - 10));
        // Off by 10 (big decimal error)
        if (num > 10) results.push(isDecimal ? (num + 10).toFixed(1) : String(num + 100));
        return results.filter(d => parseFloat(d) >= 0 && d !== correct);
      }
      return [];
    }

    // ── Tier 4 ──

    case 'roman_to_arabic': {
      // Nearby numbers, common misreads
      if (!isNaN(num)) {
        return [String(num + 1), String(num - 1), String(num + 5), String(num + 10)]
          .filter(d => parseInt(d) > 0 && d !== correct);
      }
      return [];
    }

    case 'arabic_to_roman': {
      const n = parseRomanish(correct);
      if (n > 0) {
        const results: string[] = [];
        for (const off of [1, -1, 5, -5, 10]) {
          const val = n + off;
          if (val > 0 && val < 4000) {
            results.push(toRomanSimple(val));
          }
        }
        return results.filter(d => d !== correct);
      }
      return [];
    }

    case 'series_1_to_n': {
      // Common formula errors: n², n(n-1)/2, forgot to divide
      const nMatch = q.match(/\+\s*…\s*\+\s*(\d+)/);
      if (nMatch && !isNaN(num)) {
        const n = parseInt(nMatch[1]);
        return [
          String(n * n),              // confused with n²
          String(n * (n - 1) / 2),    // off by one in formula
          String(n * (n + 1)),        // forgot to divide by 2
          String(num + n),            // added n extra
        ].filter(d => parseInt(d) > 0 && d !== correct);
      }
      return [];
    }

    case 'series_odd_numbers': {
      // Sum of first k odd = k². Distractors: (k±1)², k*2, etc.
      if (!isNaN(num)) {
        const k = Math.round(Math.sqrt(num));
        return [
          String((k + 1) * (k + 1)),
          String((k - 1) * (k - 1)),
          String(k * 2),
          String(num + k),
        ].filter(d => parseInt(d) > 0 && d !== correct);
      }
      return [];
    }

    case 'series_arithmetic': {
      if (!isNaN(num)) {
        // Parse first and last terms
        const terms = q.match(/\d+/g)?.map(Number) || [];
        if (terms.length >= 2) {
          const first = terms[0], last = terms[terms.length - 1];
          return [
            String(first + last),           // just added first and last
            String(num + first),
            String(num - first),
            String(Math.round(num * 1.1)),
          ].filter(d => parseInt(d) > 0 && d !== correct);
        }
      }
      return [];
    }

    case 'order_of_operations': {
      // PEMDAS violations
      const addMul = q.match(/(\d+)\s*\+\s*(\d+)\s*×\s*(\d+)/);
      if (addMul) {
        const a = parseInt(addMul[1]), b = parseInt(addMul[2]), c = parseInt(addMul[3]);
        return [String((a + b) * c), String(a + b + c), String(a * b + c)];
      }
      const mulSub = q.match(/(\d+)\s*×\s*(\d+)\s*[−\-]\s*(\d+)/);
      if (mulSub) {
        const a = parseInt(mulSub[1]), b = parseInt(mulSub[2]), c = parseInt(mulSub[3]);
        return [String(a * (b - c)), String(a + b - c), String(a * b + c)];
      }
      const subMul = q.match(/(\d+)\s*[−\-]\s*(\d+)\s*×\s*(\d+)/);
      if (subMul) {
        const a = parseInt(subMul[1]), b = parseInt(subMul[2]), c = parseInt(subMul[3]);
        return [String((a - b) * c), String(a - b - c), String(a + b * c + 1)];
      }
      return [];
    }

    case 'squaring': {
      const match = q.match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1]);
        return [String(n * 2), String(n * n + n), String(n * n - 1), String((n + 1) * (n + 1))];
      }
      return [];
    }

    case 'division_remainder': {
      const match = q.match(/(\d+)\s*÷\s*(\d+)/);
      if (match && !isNaN(num)) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        const quotient = Math.floor(a / b);
        return [
          String(quotient),           // gave quotient instead of remainder
          String(num + 1),
          String(Math.max(0, num - 1)),
          String(b - num),            // subtracted wrong way
        ].filter(d => parseInt(d) >= 0 && d !== correct);
      }
      return [];
    }

    case 'percentages': {
      if (!isNaN(num)) {
        // Extract the number being percentaged
        const nMatch = q.match(/of\s+(\d+)/);
        if (nMatch) {
          const base = parseInt(nMatch[1]);
          const results: string[] = [];
          // Wrong percentage shortcuts
          if (q.includes('50%')) {
            results.push(String(base / 4), String(base * 0.1), String(num + 1));
          } else if (q.includes('25%')) {
            results.push(String(base / 2), String(base * 0.1), String(num + 1));
          } else if (q.includes('10%')) {
            results.push(String(base / 4), String(base / 2), String(num * 2));
          } else if (q.includes('75%')) {
            results.push(String(base / 2), String(base / 4), String(base * 0.1));
          }
          results.push(String(num + 1), String(Math.max(1, num - 1)));
          return results.filter(d => parseFloat(d) > 0 && d !== correct);
        }
      }
      return [];
    }

    case 'prime_numbers': {
      if (correct === 'yes' || correct === 'no') {
        return [correct === 'yes' ? 'no' : 'yes'];
      }
      if (!isNaN(num)) {
        // For "first prime after X" - give nearby primes and composites
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
        const nearbyPrimes = primes.filter(p => p !== num && Math.abs(p - num) <= 10);
        const results = nearbyPrimes.map(String);
        // Add a composite number nearby
        results.push(String(num + 1));
        return results.filter(d => d !== correct);
      }
      return [];
    }

    // ── Estimation ──

    case 'estimation_addition':
    case 'estimation_subtraction':
    case 'estimation_large_addition':
    case 'estimation_multiplication': {
      if (!isNaN(num)) {
        const pct = Math.max(10, Math.round(Math.abs(num) * 0.08));
        return [String(num + pct), String(num - pct), String(Math.round(num * 1.15)), String(Math.round(num * 0.85))];
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

  const offsets = magnitude < 20
    ? [1, 2, 3, -1, -2, -3]
    : magnitude < 100
      ? [1, 2, 5, 10, -1, -2, -5, -10]
      : magnitude < 1000
        ? [1, 10, 100, -1, -10, -100, 2, -2]
        : [1, 10, 100, 1000, -1, -10, -100, -1000];

  for (const off of offsets) {
    if (set.size >= 6) break;
    const val = num + off;
    if (val < 0 && !problem.questionText.includes('−')) continue;
    const str = isDecimal ? val.toFixed(1) : String(val);
    if (str !== correct && str !== '' && (val !== 0 || problem.category.includes('sub'))) {
      set.add(str);
    }
  }
}

function addFractionDistractors(correct: string, set: Set<string>): void {
  const parts = correct.split('/');
  if (parts.length !== 2) return;
  const n = parseInt(parts[0]), d = parseInt(parts[1]);
  if (isNaN(n) || isNaN(d)) return;

  set.add(`${n * 2}/${d * 2}`);
  if (n + 1 < d) set.add(`${n + 1}/${d}`);
  if (n - 1 > 0) set.add(`${n - 1}/${d}`);
  if (d !== n) set.add(`${d - n}/${d}`);
  set.add(`${n}/${d + 1}`);
}

function addTextDistractors(correct: string, problem: Problem, set: Set<string>): void {
  if (problem.category === 'arabic_to_roman') {
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
  return correct + '?';
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
