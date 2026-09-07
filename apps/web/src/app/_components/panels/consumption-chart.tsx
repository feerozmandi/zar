"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@xennic/ui";

const sample = [
  { period: "فردا", kwh: 310 },
  { period: "میان‌باری", kwh: 1240 },
  { period: "شب", kwh: 520 },
];

/** نمودار مصرف — داده‌ی نمونه؛ در فاز ۲ از metrics هر قبض خوانده می‌شود */
export function ConsumptionChart() {
  return (
    <Card>
      <CardContent className="h-64 p-6">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={sample}>
            <CartesianGrid strokeOpacity={0.2} strokeDasharray="3 3" />
            <XAxis dataKey="period" reversed />
            <YAxis orientation="right" />
            <Tooltip />
            <Bar dataKey="kwh" fill="var(--xennic-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
