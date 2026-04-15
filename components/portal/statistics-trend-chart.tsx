"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  period: string;
  commission: number;
  approvals: number;
};

export function StatisticsTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
        <XAxis dataKey="period" stroke="#7f8a99" />
        <YAxis stroke="#7f8a99" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #dbe4eb",
            borderRadius: 12,
          }}
        />
        <Bar dataKey="commission" fill="#4aa5cc" radius={[8, 8, 0, 0]} />
        <Bar dataKey="approvals" fill="#3aa4a8" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
