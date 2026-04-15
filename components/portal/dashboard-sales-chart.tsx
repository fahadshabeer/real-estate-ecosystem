"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlySale = {
  month: string;
  sold: number;
  pending: number;
  reserved: number;
};

export function DashboardSalesChart({ data }: { data: MonthlySale[] }) {
  if (!data.length) {
    return (
      <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-[#dbe4eb] text-sm text-[#7f8a99]">
        No sales trend data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
        <XAxis dataKey="month" stroke="#7f8a99" />
        <YAxis stroke="#7f8a99" />
        <Legend />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #dbe4eb",
            borderRadius: 12,
          }}
        />
        <Bar dataKey="sold" fill="#3aa4a8" radius={[8, 8, 0, 0]} />
        <Bar dataKey="reserved" fill="#f59e0b" radius={[8, 8, 0, 0]} />
        <Line
          type="monotone"
          dataKey="pending"
          stroke="#0ea5e9"
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: "#0ea5e9" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
