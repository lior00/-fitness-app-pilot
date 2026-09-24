import { z } from "zod";

export const genderSchema = z.enum(["male", "female"]);
export const activityLevelSchema = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
]);
export const goalSchema = z.enum(["cut", "maintain", "bulk"]);
export const unitSystemSchema = z.enum(["metric", "imperial"]);
export const foodRegionSchema = z.enum(["us", "il"]);

export const onboardingSchema = z
  .object({
    foodRegion: foodRegionSchema,
    gender: genderSchema,
    age: z.coerce.number().int().min(13, "Must be at least 13").max(120, "Enter a valid age"),
    unitSystem: unitSystemSchema,
    heightCm: z.coerce.number().min(1).max(300).optional(),
    heightFt: z.coerce.number().int().min(0).max(8).optional(),
    heightIn: z.coerce.number().min(0).max(11.9).optional(),
    weightKg: z.coerce.number().min(1).max(400).optional(),
    weightLbs: z.coerce.number().min(1).max(900).optional(),
    activityLevel: activityLevelSchema,
    goal: goalSchema,
  })
  .superRefine((data, ctx) => {
    if (data.unitSystem === "metric") {
      if (!data.heightCm) {
        ctx.addIssue({ code: "custom", message: "Height is required", path: ["heightCm"] });
      }
      if (!data.weightKg) {
        ctx.addIssue({ code: "custom", message: "Weight is required", path: ["weightKg"] });
      }
    } else {
      if (!data.heightFt && !data.heightIn) {
        ctx.addIssue({ code: "custom", message: "Height is required", path: ["heightFt"] });
      }
      if (!data.weightLbs) {
        ctx.addIssue({ code: "custom", message: "Weight is required", path: ["weightLbs"] });
      }
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export function ftInToCm(feet: number, inches: number): number {
  return feet * 30.48 + inches * 2.54;
}

export function lbsToKg(lbs: number): number {
  return lbs * 0.45359237;
}

export function resolveMetrics(data: OnboardingInput): { heightCm: number; weightKg: number } {
  if (data.unitSystem === "metric") {
    return { heightCm: data.heightCm!, weightKg: data.weightKg! };
  }
  return {
    heightCm: ftInToCm(data.heightFt ?? 0, data.heightIn ?? 0),
    weightKg: lbsToKg(data.weightLbs!),
  };
}
