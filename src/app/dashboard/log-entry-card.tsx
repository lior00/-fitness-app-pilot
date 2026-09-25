"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteLogGroup, updateLogQuantity } from "../meals/actions";

type FoodLogRow = {
  id: string;
  log_group_id: string;
  quantity_g: number;
  calories: number;
  food_items: { name: string } | null;
  custom_meals: { name: string } | null;
};

export function LogEntryCard({ group, date }: { group: FoodLogRow[]; date: string }) {
  const [editing, setEditing] = useState(false);
  const groupCalories = group.reduce((sum, r) => sum + r.calories, 0);
  const mealName = group[0].custom_meals?.name;

  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            {mealName && <p className="text-sm font-medium">{mealName}</p>}
            {editing
              ? group.map((row) => (
                  <form
                    key={row.id}
                    action={updateLogQuantity}
                    className="flex items-center gap-1.5 text-sm text-neutral-600"
                  >
                    <input type="hidden" name="logId" value={row.id} />
                    <input type="hidden" name="loggedDate" value={date} />
                    <span>{row.food_items?.name} —</span>
                    <Input
                      name="quantityG"
                      type="number"
                      defaultValue={row.quantity_g}
                      className="h-6 w-16 px-1.5 text-xs"
                    />
                    <span>g ({row.calories} kcal)</span>
                    <Button size="xs" variant="ghost" type="submit">
                      Update
                    </Button>
                  </form>
                ))
              : group.map((row) => (
                  <p key={row.id} className="text-sm text-neutral-600">
                    {row.food_items?.name} — {Math.round(row.quantity_g)}g ({row.calories} kcal)
                  </p>
                ))}
          </div>

          {editing ? (
            <div className="flex shrink-0 items-center gap-1">
              <form action={deleteLogGroup.bind(null, group[0].log_group_id, date)}>
                <Button size="xs" variant="ghost" type="submit">
                  Delete
                </Button>
              </form>
              <Button size="xs" variant="ghost" type="button" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="xs" variant="ghost" type="button" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
        <p className="text-xs text-neutral-400">{groupCalories} kcal total</p>
      </CardContent>
    </Card>
  );
}
