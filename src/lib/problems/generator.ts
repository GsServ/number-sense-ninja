import type { Problem, ProblemCategory, ProblemTier } from '@/types';
import { TIER_CATEGORIES, ESTIMATION_CATEGORIES } from '@/types';
import { generateTier1Problem } from './tier1';
import {
  generateSingleDigitAdd, generateSingleDigitSub, generateTwoDigitAdd,
  generateTwoDigitAddCarry, generateTwoDigitSub, generateTwoDigitSubBorrow,
  generateMoneyConversion, generateClockReading, generateUnitConversion,
  generateGeometryFacts, generatePlaceValue, generateRounding,
  generateComparingNumbers, generateBasicMultiplication, generateNumberOrdering,
} from './tier1';
import { generateTier2Problem, generateEasyTier2Problem } from './tier2';
import {
  generateThreeDigitAdd, generateThreeDigitSubBorrow, generateFourDigitSub,
  generateWhatNumberAddedTo, generateMultFacts789, generateDivisionFacts,
  generateMultiStepOps, generateSequencesPatterns, generateRepeatedAddition,
  generateFractionShadedArea,
} from './tier2';
import { generateTier3Problem } from './tier3';
import {
  generateMultiplyBy11, generateMultiplyBy25, generateMultiplyBy50,
  generateSimplifyFractions, generatePerimeterRectangle, generatePerimeterSquare,
  generateAreaRectangle, generateAreaSquare, generateAreaTriangle,
  generateWordProblems, generateDecimalAddSub,
} from './tier3';
import { generateTier4Problem } from './tier4';
import {
  generateRomanToArabic, generateArabicToRoman, generateSeries1ToN,
  generateSeriesOddNumbers, generateSeriesArithmetic, generateOrderOfOperations,
  generateSquaring, generateDivisionRemainder, generatePercentages, generatePrimeNumbers,
} from './tier4';
import {
  generateEstimationAddition, generateEstimationSubtraction,
  generateEstimationLargeAddition, generateEstimationMultiplication,
} from './estimation';

const GENERATORS: Record<ProblemCategory, () => Problem> = {
  single_digit_add: generateSingleDigitAdd,
  single_digit_sub: generateSingleDigitSub,
  two_digit_add: generateTwoDigitAdd,
  two_digit_add_carry: generateTwoDigitAddCarry,
  two_digit_sub: generateTwoDigitSub,
  two_digit_sub_borrow: generateTwoDigitSubBorrow,
  money_conversion: generateMoneyConversion,
  clock_reading: generateClockReading,
  unit_conversion: generateUnitConversion,
  geometry_facts: generateGeometryFacts,
  place_value: generatePlaceValue,
  rounding: generateRounding,
  comparing_numbers: generateComparingNumbers,
  basic_multiplication: generateBasicMultiplication,
  number_ordering: generateNumberOrdering,
  estimation_addition: generateEstimationAddition,
  three_digit_add: generateThreeDigitAdd,
  three_digit_sub_borrow: generateThreeDigitSubBorrow,
  four_digit_sub: generateFourDigitSub,
  what_number_added_to: generateWhatNumberAddedTo,
  mult_facts_789: generateMultFacts789,
  division_facts: generateDivisionFacts,
  multi_step_ops: generateMultiStepOps,
  sequences_patterns: generateSequencesPatterns,
  repeated_addition: generateRepeatedAddition,
  fraction_shaded_area: generateFractionShadedArea,
  estimation_subtraction: generateEstimationSubtraction,
  estimation_large_addition: generateEstimationLargeAddition,
  multiply_by_11: generateMultiplyBy11,
  multiply_by_25: generateMultiplyBy25,
  multiply_by_50: generateMultiplyBy50,
  simplify_fractions: generateSimplifyFractions,
  perimeter_rectangle: generatePerimeterRectangle,
  perimeter_square: generatePerimeterSquare,
  area_rectangle: generateAreaRectangle,
  area_square: generateAreaSquare,
  area_triangle: generateAreaTriangle,
  word_problems: generateWordProblems,
  decimal_add_sub: generateDecimalAddSub,
  estimation_multiplication: generateEstimationMultiplication,
  roman_to_arabic: generateRomanToArabic,
  arabic_to_roman: generateArabicToRoman,
  series_1_to_n: generateSeries1ToN,
  series_odd_numbers: generateSeriesOddNumbers,
  series_arithmetic: generateSeriesArithmetic,
  order_of_operations: generateOrderOfOperations,
  squaring: generateSquaring,
  division_remainder: generateDivisionRemainder,
  percentages: generatePercentages,
  prime_numbers: generatePrimeNumbers,
};

export function generateProblem(category: ProblemCategory): Problem {
  return GENERATORS[category]();
}

export function generateRandomTierProblem(tier: ProblemTier): Problem {
  const cats = TIER_CATEGORIES[tier];
  const cat = cats[Math.floor(Math.random() * cats.length)];
  return generateProblem(cat);
}

export function generateTestSimProblems(): Problem[] {
  const problems: Problem[] = [];

  // Q1-9: Tier 1
  for (let i = 0; i < 9; i++) problems.push(generateTier1Problem());
  // Q10: ★ Estimation addition
  problems.push(generateEstimationAddition());

  // Q11-19: Mix Tier 1 (40%) and easy Tier 2 (60%)
  for (let i = 0; i < 9; i++) {
    problems.push(Math.random() < 0.4 ? generateTier1Problem() : generateEasyTier2Problem());
  }
  // Q20: ★ Estimation subtraction
  problems.push(generateEstimationSubtraction());

  // Q21-29: Tier 2
  for (let i = 0; i < 9; i++) problems.push(generateTier2Problem());
  // Q30: ★ Estimation large addition
  problems.push(generateEstimationLargeAddition());

  // Q31-39: Mix Tier 2 and easy Tier 3
  for (let i = 0; i < 9; i++) {
    problems.push(Math.random() < 0.5 ? generateTier2Problem() : generateTier3Problem());
  }
  // Q40: ★ Estimation multiplication
  problems.push(generateEstimationMultiplication());

  // Q41-49: Tier 3
  for (let i = 0; i < 9; i++) problems.push(generateTier3Problem());
  // Q50: ★ Estimation (random)
  problems.push(Math.random() < 0.5 ? generateEstimationLargeAddition() : generateEstimationMultiplication());

  // Q51-60: Tier 3
  for (let i = 0; i < 10; i++) problems.push(generateTier3Problem());

  // Q61-80: Tier 4
  for (let i = 0; i < 20; i++) problems.push(generateTier4Problem());

  return problems;
}
