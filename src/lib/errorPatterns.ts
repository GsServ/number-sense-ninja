import type { ProblemAttempt, ProblemCategory } from '@/types';
import { CATEGORY_DISPLAY_NAMES } from '@/types';

export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  category: ProblemCategory;
  count: number;
  examples: { question: string; studentAnswer: string; correctAnswer: string }[];
}

/**
 * Analyze wrong attempts and detect recurring error patterns.
 * Returns patterns sorted by frequency (most common first).
 */
export function detectErrorPatterns(attempts: ProblemAttempt[]): ErrorPattern[] {
  const wrong = attempts.filter(a => !a.isCorrect && a.studentAnswer !== '');
  if (wrong.length === 0) return [];

  const patterns: Map<string, ErrorPattern> = new Map();

  for (const a of wrong) {
    const detected = classifyError(a);
    for (const d of detected) {
      const key = `${a.category}::${d.id}`;
      const existing = patterns.get(key);
      const example = { question: a.questionText, studentAnswer: a.studentAnswer, correctAnswer: a.correctAnswer };
      if (existing) {
        existing.count++;
        if (existing.examples.length < 5) existing.examples.push(example);
      } else {
        patterns.set(key, {
          id: d.id,
          name: d.name,
          description: d.description,
          category: a.category,
          count: 1,
          examples: [example],
        });
      }
    }
  }

  return Array.from(patterns.values()).sort((a, b) => b.count - a.count);
}

interface DetectedError {
  id: string;
  name: string;
  description: string;
}

function classifyError(a: ProblemAttempt): DetectedError[] {
  const errors: DetectedError[] = [];
  const student = a.studentAnswer.trim();
  const correct = a.correctAnswer.trim();
  const studentNum = parseFloat(student);
  const correctNum = parseFloat(correct);

  if (isNaN(studentNum) || isNaN(correctNum)) {
    // Non-numeric answers (roman numerals, yes/no, fractions)
    if (a.category === 'simplify_fractions' || a.category === 'fraction_shaded_area') {
      if (student.includes('/') && correct.includes('/')) {
        errors.push({ id: 'fraction_not_simplified', name: 'Fraction not simplified', description: 'Gave correct fraction but didn\'t reduce to lowest terms' });
      }
    }
    if (errors.length === 0) {
      errors.push({ id: 'generic_wrong', name: 'Incorrect answer', description: `Answered "${student}" instead of "${correct}"` });
    }
    return errors;
  }

  const diff = studentNum - correctNum;
  const absDiff = Math.abs(diff);

  // ── Dropped leading digit ──
  // e.g., correct=2532, student=532 — student answer is correct mod 1000
  if (correctNum >= 100 && studentNum > 0 && studentNum < correctNum) {
    const correctStr = String(Math.abs(correctNum));
    const studentStr = String(Math.abs(studentNum));
    if (correctStr.endsWith(studentStr) && correctStr.length > studentStr.length) {
      errors.push({
        id: 'dropped_leading_digit',
        name: 'Dropped leading digit',
        description: `Wrote ${student} instead of ${correct} — missing the leading ${correctStr.slice(0, correctStr.length - studentStr.length)}`,
      });
    }
  }

  // ── Off by one ──
  if (absDiff === 1) {
    errors.push({
      id: 'off_by_one',
      name: 'Off by one',
      description: `Answer was ${diff > 0 ? 'one too high' : 'one too low'} (${student} instead of ${correct})`,
    });
  }

  // ── Off by 10 / power of 10 ──
  if (absDiff === 10 || absDiff === 100 || absDiff === 1000) {
    errors.push({
      id: 'off_by_power_of_10',
      name: `Off by ${absDiff}`,
      description: `Likely a carry/borrow error across the ${absDiff === 10 ? 'tens' : absDiff === 100 ? 'hundreds' : 'thousands'} place`,
    });
  }

  // ── Reversed operation (added instead of subtracted, or vice versa) ──
  if (a.category.includes('sub') || a.category === 'what_number_added_to') {
    // Check if student might have added instead of subtracted
    // For "A - B = ?", if student answered A + B
    const match = a.questionText.match(/(\d+)\s*[−\-]\s*(\d+)/);
    if (match) {
      const opA = parseInt(match[1]);
      const opB = parseInt(match[2]);
      if (studentNum === opA + opB) {
        errors.push({
          id: 'wrong_operation',
          name: 'Added instead of subtracted',
          description: `Looks like addition was done instead of subtraction`,
        });
      }
    }
  }
  if (a.category.includes('add')) {
    const match = a.questionText.match(/(\d+)\s*\+\s*(\d+)/);
    if (match) {
      const opA = parseInt(match[1]);
      const opB = parseInt(match[2]);
      if (Math.abs(studentNum - Math.abs(opA - opB)) < 1) {
        errors.push({
          id: 'wrong_operation',
          name: 'Subtracted instead of added',
          description: 'Looks like subtraction was done instead of addition',
        });
      }
    }
  }

  // ── Multiplication off by one factor ──
  if (a.category === 'basic_multiplication' || a.category === 'mult_facts_789') {
    const match = a.questionText.match(/(\d+)\s*×\s*(\d+)/);
    if (match) {
      const factA = parseInt(match[1]);
      const factB = parseInt(match[2]);
      // Check if student answer equals a×(b±1) or (a±1)×b
      if (studentNum === factA * (factB + 1) || studentNum === factA * (factB - 1) ||
          studentNum === (factA + 1) * factB || studentNum === (factA - 1) * factB) {
        errors.push({
          id: 'mult_off_by_one_factor',
          name: 'Off by one factor',
          description: `Likely confused ${factA}×${factB}=${correct} with a neighboring fact`,
        });
      }
    }
  }

  // ── Forgot to borrow ──
  if ((a.category === 'three_digit_sub_borrow' || a.category === 'four_digit_sub' || a.category === 'two_digit_sub_borrow') && absDiff > 1) {
    // If any digit of the student answer is 10 more than the correct digit
    // or 10 less in the next column, it's likely a borrow error
    const cDigits = String(correctNum).split('').reverse();
    const sDigits = String(studentNum).split('').reverse();
    for (let i = 0; i < Math.min(cDigits.length, sDigits.length); i++) {
      const cd = parseInt(cDigits[i]);
      const sd = parseInt(sDigits[i]);
      if (Math.abs(sd - cd) >= 8 && absDiff < correctNum * 0.5) {
        errors.push({
          id: 'borrow_error',
          name: 'Borrow/carry error',
          description: 'A digit is wrong in a way that suggests forgetting to borrow',
        });
        break;
      }
    }
  }

  // ── Estimation too far off ──
  if (a.isEstimation && correctNum !== 0) {
    const pctOff = Math.abs(diff / correctNum) * 100;
    if (pctOff > 20) {
      errors.push({
        id: 'estimation_way_off',
        name: 'Estimation way off',
        description: `Off by ${Math.round(pctOff)}% — try rounding each number to the nearest hundred before computing`,
      });
    } else if (pctOff > 5) {
      errors.push({
        id: 'estimation_close',
        name: 'Estimation just outside range',
        description: `Off by ${Math.round(pctOff)}% — needed within 5%. Round more carefully.`,
      });
    }
  }

  // ── Coin confusion (money) ──
  if (a.category === 'money_conversion') {
    // Check if the answer could result from confusing dime/nickel values
    if (absDiff > 0 && absDiff % 5 === 0) {
      errors.push({
        id: 'coin_confusion',
        name: 'Possible coin value confusion',
        description: 'Double-check: Penny=1¢, Nickel=5¢, Dime=10¢, Quarter=25¢',
      });
    }
  }

  // ── Order of operations ──
  if (a.category === 'order_of_operations' || a.category === 'multi_step_ops') {
    const match = a.questionText.match(/(\d+)\s*\+\s*(\d+)\s*×\s*(\d+)/);
    if (match) {
      const opA = parseInt(match[1]);
      const opB = parseInt(match[2]);
      const opC = parseInt(match[3]);
      if (studentNum === (opA + opB) * opC) {
        errors.push({
          id: 'pemdas_violation',
          name: 'Did addition before multiplication',
          description: 'Remember: multiply/divide BEFORE add/subtract (PEMDAS)',
        });
      }
    }
  }

  // ── Generic fallback ──
  if (errors.length === 0) {
    errors.push({
      id: 'generic_wrong',
      name: 'Incorrect answer',
      description: `Answered ${student} instead of ${correct}`,
    });
  }

  return errors;
}

/**
 * Get all wrong attempts from recent sessions.
 */
export function getRecentMistakes(
  sessions: { attempts: ProblemAttempt[] }[],
  limit = 50,
): ProblemAttempt[] {
  const mistakes: ProblemAttempt[] = [];
  for (let i = sessions.length - 1; i >= 0 && mistakes.length < limit; i--) {
    const session = sessions[i];
    for (let j = session.attempts.length - 1; j >= 0 && mistakes.length < limit; j--) {
      const a = session.attempts[j];
      if (!a.isCorrect && a.studentAnswer !== '') {
        mistakes.push(a);
      }
    }
  }
  return mistakes;
}
