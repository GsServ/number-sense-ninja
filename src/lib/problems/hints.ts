import type { ProblemCategory } from '@/types';

export const HINTS: Record<ProblemCategory, { trickName: string; hint: string; commonMistake: string }> = {
  // ── Tier 1 ──
  single_digit_add: {
    trickName: 'Counting On',
    hint: 'Start with the bigger number and count up by the smaller one.',
    commonMistake: 'Miscounting by starting with the smaller number.',
  },
  single_digit_sub: {
    trickName: 'Counting Back',
    hint: 'Start at the first number and count back by the second.',
    commonMistake: 'Subtracting in the wrong direction.',
  },
  two_digit_add: {
    trickName: 'Add Tens Then Ones',
    hint: 'Add the tens digits first, then the ones digits, and combine.',
    commonMistake: 'Forgetting to add tens and ones separately.',
  },
  two_digit_add_carry: {
    trickName: 'Carry the Ten',
    hint: 'When ones add to 10+, carry 1 to the tens column.',
    commonMistake: 'Forgetting to carry the extra ten.',
  },
  two_digit_sub: {
    trickName: 'Subtract Tens Then Ones',
    hint: 'Subtract tens first, then ones. Combine the results.',
    commonMistake: 'Subtracting the smaller digit from the larger in the ones place.',
  },
  two_digit_sub_borrow: {
    trickName: 'Round and Adjust',
    hint: 'Round the number you are subtracting up, subtract, then add back the difference.',
    commonMistake: 'Forgetting to borrow from the tens place.',
  },
  money_conversion: {
    trickName: 'Know Your Coins',
    hint: 'DIME = 10 cents (not 5!), NICKEL = 5 cents, QUARTER = 25 cents, PENNY = 1 cent.',
    commonMistake: 'Confusing DIME (10\u00a2) with NICKEL (5\u00a2).',
  },
  clock_reading: {
    trickName: 'Think About the Clock',
    hint: "Don't just subtract the digits \u2014 think about hours and minutes on a real clock. 60 minutes = 1 hour.",
    commonMistake: 'Subtracting time digits instead of thinking in hours/minutes.',
  },
  unit_conversion: {
    trickName: 'Memorize Key Facts',
    hint: '1 hour = 60 min, 1 foot = 12 in, 1 yard = 3 ft, 1 meter = 100 cm.',
    commonMistake: 'Mixing up which direction to multiply or divide.',
  },
  geometry_facts: {
    trickName: 'Shape Properties',
    hint: 'Triangle = 3 sides, Rectangle/Square = 4 sides, Pentagon = 5, Hexagon = 6, Octagon = 8.',
    commonMistake: 'Confusing hexagons (6) with octagons (8).',
  },
  place_value: {
    trickName: 'Know Your Places',
    hint: 'From the right: ones, tens, hundreds, thousands. Read the digit at that position.',
    commonMistake: 'Counting positions from the wrong end.',
  },
  rounding: {
    trickName: 'Look Right, Decide',
    hint: 'Look at the digit to the right of the rounding place. 5+ rounds up, 0\u20134 rounds down.',
    commonMistake: 'Rounding down when the digit is exactly 5.',
  },
  comparing_numbers: {
    trickName: 'Check Each Number',
    hint: 'Compare each number to the target one at a time. Count the ones that qualify.',
    commonMistake: 'Skipping a number or miscounting.',
  },
  basic_multiplication: {
    trickName: 'Times Table Recall',
    hint: 'Practice the hard ones: 7\u00d78=56, 8\u00d79=72, 6\u00d77=42, 6\u00d78=48.',
    commonMistake: 'Confusing nearby products like 7\u00d78=56 vs 7\u00d79=63.',
  },
  number_ordering: {
    trickName: 'Scan the List',
    hint: 'Read each number carefully. Find the one just above or just below the target.',
    commonMistake: 'Picking a number that equals the target instead of one greater/less than it.',
  },
  estimation_addition: {
    trickName: 'Round and Add',
    hint: 'Round each number to the nearest hundred, then add the rounded values.',
    commonMistake: 'Rounding incorrectly or forgetting to round one of the numbers.',
  },

  // ── Tier 2 ──
  three_digit_add: {
    trickName: 'Left to Right Addition',
    hint: 'Add hundreds first, then tens, then ones. Watch for carries rippling up.',
    commonMistake: 'Forgetting a carry from ones to tens or tens to hundreds.',
  },
  three_digit_sub_borrow: {
    trickName: 'Round and Adjust',
    hint: 'Round the subtracted number up to the nearest 10 or 100, subtract, then add back the difference.',
    commonMistake: 'Failing to borrow across a zero (e.g., 504 \u2212 267).',
  },
  four_digit_sub: {
    trickName: 'Subtract Left to Right',
    hint: 'Work from left to right, adjusting as needed. Watch out when the answer has fewer digits.',
    commonMistake: 'Writing extra leading zeros or miscounting digits.',
  },
  what_number_added_to: {
    trickName: 'Flip to Subtraction',
    hint: '"What + A = B" is the same as "B \u2212 A". Just subtract!',
    commonMistake: 'Adding instead of subtracting.',
  },
  mult_facts_789: {
    trickName: 'Lock In the Tricky Facts',
    hint: '7\u00d78=56, 8\u00d79=72, 7\u00d79=63, 9\u00d79=81, 8\u00d78=64. Memorize these!',
    commonMistake: 'Confusing 7\u00d78=56 with 7\u00d79=63 or 8\u00d79=72.',
  },
  division_facts: {
    trickName: 'Think Multiplication',
    hint: 'For A \u00f7 B, ask yourself "B times what equals A?"',
    commonMistake: 'Mixing up dividend and divisor.',
  },
  multi_step_ops: {
    trickName: 'Order of Operations',
    hint: 'Do multiplication/division before addition/subtraction (unless grouped).',
    commonMistake: 'Going left to right without respecting multiplication priority.',
  },
  sequences_patterns: {
    trickName: 'Find the Pattern',
    hint: 'Look at the difference (or ratio) between consecutive terms. Apply it to find the missing one.',
    commonMistake: 'Using the wrong common difference or confusing addition with multiplication patterns.',
  },
  repeated_addition: {
    trickName: 'Convert to Multiplication',
    hint: 'Count how many times the number repeats and multiply: 6+6+6+6 = 6\u00d74.',
    commonMistake: 'Miscounting the number of terms.',
  },
  fraction_shaded_area: {
    trickName: 'Cut in Half',
    hint: 'Count the shaded parts over total parts. Always simplify to lowest terms.',
    commonMistake: 'Forgetting to reduce the fraction.',
  },
  estimation_subtraction: {
    trickName: 'Round and Subtract',
    hint: 'Round both numbers to the nearest hundred, then subtract.',
    commonMistake: 'Rounding both numbers in the same direction, making the estimate too far off.',
  },
  estimation_large_addition: {
    trickName: 'Round and Add',
    hint: 'Round each number to the nearest hundred or thousand, then add.',
    commonMistake: 'Losing track of place value when rounding large numbers.',
  },

  // ── Tier 3 ──
  multiply_by_11: {
    trickName: 'Add Consecutive Pairs',
    hint: 'For AB \u00d7 11: write A, then A+B, then B. If A+B \u2265 10, carry the 1.',
    commonMistake: 'Forgetting to carry when the middle digit sum is 10 or more.',
  },
  multiply_by_25: {
    trickName: 'Divide by 4 + Suffix',
    hint: 'N \u00d7 25: divide N by 4. Quotient gives hundreds, remainder: 0\u219200, 1\u219225, 2\u219250, 3\u219275.',
    commonMistake: 'Getting the remainder wrong or forgetting the suffix.',
  },
  multiply_by_50: {
    trickName: 'Divide by 2 + Suffix',
    hint: 'N \u00d7 50: divide N by 2. If even, append 00. If odd, use (N\u22121)/2 then append 50.',
    commonMistake: 'Forgetting to append 50 for odd numbers.',
  },
  simplify_fractions: {
    trickName: 'Find the GCD',
    hint: 'Divide both numerator and denominator by their greatest common divisor.',
    commonMistake: 'Not fully reducing (e.g., reducing 8/12 to 4/6 instead of 2/3).',
  },
  perimeter_rectangle: {
    trickName: 'Perimeter = 2(L + W)',
    hint: 'Add the length and width, then double it.',
    commonMistake: 'Forgetting to double, or only adding two sides.',
  },
  perimeter_square: {
    trickName: 'Perimeter = 4 \u00d7 Side',
    hint: 'All four sides are equal. Multiply the side by 4.',
    commonMistake: 'Squaring the side instead of multiplying by 4.',
  },
  area_rectangle: {
    trickName: 'Area = L \u00d7 W',
    hint: 'Multiply the length by the width.',
    commonMistake: 'Adding instead of multiplying.',
  },
  area_square: {
    trickName: 'Area = Side\u00b2',
    hint: 'Multiply the side by itself.',
    commonMistake: 'Multiplying by 4 (that gives perimeter, not area).',
  },
  area_triangle: {
    trickName: 'Area = \u00bd \u00d7 Base \u00d7 Height',
    hint: 'Multiply base times height, then divide by 2.',
    commonMistake: 'Forgetting to divide by 2.',
  },
  word_problems: {
    trickName: 'Read Carefully',
    hint: 'Identify the numbers and the operation (total = add, difference = subtract, each/per = multiply).',
    commonMistake: 'Using the wrong operation for the word clues.',
  },
  decimal_add_sub: {
    trickName: 'Line Up the Decimal',
    hint: 'Align the decimal points, then add or subtract as normal.',
    commonMistake: 'Not lining up the decimal points properly.',
  },
  estimation_multiplication: {
    trickName: 'Round and Multiply',
    hint: 'Round each factor to the nearest ten, then multiply.',
    commonMistake: 'Rounding both numbers the same direction, overshooting the estimate.',
  },

  // ── Tier 4 ──
  roman_to_arabic: {
    trickName: 'Read Left to Right',
    hint: 'Add values left to right. If a smaller numeral precedes a larger one, subtract it (IV=4, IX=9).',
    commonMistake: 'Forgetting the subtraction rule (e.g., reading IX as 11 instead of 9).',
  },
  arabic_to_roman: {
    trickName: 'Break Into Parts',
    hint: 'Break the number into thousands, hundreds, tens, ones and convert each.',
    commonMistake: 'Using too many repeated numerals (e.g., IIII instead of IV).',
  },
  series_1_to_n: {
    trickName: 'Gauss Formula',
    hint: '1+2+3+\u2026+n = n(n+1)/2. Multiply n by (n+1), then divide by 2.',
    commonMistake: 'Forgetting to divide by 2.',
  },
  series_odd_numbers: {
    trickName: 'Count of Odds Squared',
    hint: '1+3+5+\u2026+(2k\u22121) = k\u00b2. Count how many odd numbers, then square that count.',
    commonMistake: 'Miscounting the number of odd terms.',
  },
  series_arithmetic: {
    trickName: 'Middle \u00d7 Count',
    hint: 'Find the average of first and last terms, then multiply by the number of terms.',
    commonMistake: 'Miscounting the number of terms in the series.',
  },
  order_of_operations: {
    trickName: 'PEMDAS',
    hint: 'Parentheses, Exponents, Multiply/Divide (left to right), Add/Subtract (left to right).',
    commonMistake: 'Doing addition before multiplication.',
  },
  squaring: {
    trickName: 'Memorize Common Squares',
    hint: 'Know 1\u00b2=1, 2\u00b2=4, \u2026 12\u00b2=144, 13\u00b2=169, 14\u00b2=196, 15\u00b2=225.',
    commonMistake: 'Doubling instead of squaring (e.g., 7\u00b2=14 instead of 49).',
  },
  division_remainder: {
    trickName: 'Multiply Down',
    hint: 'Find the largest multiple of the divisor that fits, then subtract to get the remainder.',
    commonMistake: 'Giving the quotient instead of the remainder.',
  },
  percentages: {
    trickName: 'Fraction Shortcut',
    hint: '50% = \u00bd, 25% = \u00bc, 10% = \u00f710, 75% = \u00be. Use these to compute quickly.',
    commonMistake: 'Moving the decimal the wrong way for 10%.',
  },
  prime_numbers: {
    trickName: 'Check Small Divisors',
    hint: 'A prime has no divisors other than 1 and itself. Check 2, 3, 5, 7 up to the square root.',
    commonMistake: 'Thinking 1 is prime (it is not) or forgetting that 2 is prime.',
  },
};
