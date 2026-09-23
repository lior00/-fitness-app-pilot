export type FoodSource = "usda" | "off" | "custom";

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
};
