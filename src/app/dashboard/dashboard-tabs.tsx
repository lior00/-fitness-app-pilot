"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardTabs({
  defaultTab,
  dayPanel,
  calendarPanel,
}: {
  defaultTab: "day" | "calendar";
  dayPanel: ReactNode;
  calendarPanel: ReactNode;
}) {
  return (
    // Keyed on defaultTab so navigating between date/calendar links (which
    // re-render this component with a new defaultTab prop, but don't remount
    // it since it's the same route) actually resets which tab is active —
    // defaultValue alone only applies on first mount.
    <Tabs key={defaultTab} defaultValue={defaultTab}>
      <TabsList className="w-full">
        <TabsTrigger value="day" className="flex-1">
          Day
        </TabsTrigger>
        <TabsTrigger value="calendar" className="flex-1">
          Calendar
        </TabsTrigger>
      </TabsList>
      <TabsContent value="day" className="space-y-6 pt-4">
        {dayPanel}
      </TabsContent>
      <TabsContent value="calendar" className="space-y-2 pt-4">
        {calendarPanel}
      </TabsContent>
    </Tabs>
  );
}
