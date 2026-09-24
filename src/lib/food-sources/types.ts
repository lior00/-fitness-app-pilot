export type FoodSource = "usda" | "off" | "il" | "custom";

export type NormalizedFood = {
  source: FoodSource;
  externalId?: string;
  name: string;
  brand?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultPortionG?: number;
  defaultPortionLabel?: string;
  // True when caloriesPer100g/macros were derived by scaling a per-serving
  // value (USDA Branded results always report this way), rather than coming
  // directly from the source as a true per-100g figure. The serving-size
  // field that scaling depends on can be wrong at the source — this flag
  // exists to surface that risk, not to hide it.
  isServingConverted?: boolean;
};
