export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export type Goal = "cut" | "maintain" | "bulk";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export const ACTIVITY_LEVEL_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "<3,000 steps/day — minimal daily movement",
  },
  {
    value: "lightly_active",
    label: "Lightly active",
    description: "3,000–6,000 steps/day — light movement / 1–3 days exercise",
  },
  {
    value: "moderately_active",
    label: "Moderately active",
    description: "6,000–10,000 steps/day — moderate walking / 3–5 days exercise",
  },
  {
    value: "very_active",
    label: "Very active",
    description: "10,000–14,000 steps/day — physical job / 6–7 days intense exercise",
  },
  {
    value: "extra_active",
    label: "Extra active",
    description: ">14,000 steps/day — heavy manual labor / double sessions",
  },
];

const GOAL_CALORIE_DELTA: Record<Goal, number> = {
  cut: -500,
  maintain: 0,
  bulk: 300,
};

// BMR is averaged across three formulas to smooth out each one's individual
// bias, rather than relying on a single equation.

export function calculateBmrMifflinStJeor(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function calculateBmrHarrisBenedict(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  return gender === "male"
    ? 13.397 * weightKg + 4.799 * heightCm - 5.677 * age + 88.362
    : 9.247 * weightKg + 3.098 * heightCm - 4.33 * age + 447.593;
}

export function calculateBmrOwen(gender: Gender, weightKg: number): number {
  return gender === "male" ? 879 + 10.2 * weightKg : 795 + 7.18 * weightKg;
}

export function calculateBmr(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const estimates = [
    calculateBmrMifflinStJeor(gender, weightKg, heightCm, age),
    calculateBmrHarrisBenedict(gender, weightKg, heightCm, age),
    calculateBmrOwen(gender, weightKg),
  ];
  return estimates.reduce((sum, value) => sum + value, 0) / estimates.length;
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateTargetCalories(tdee: number, goal: Goal): number {
  return tdee + GOAL_CALORIE_DELTA[goal];
}
