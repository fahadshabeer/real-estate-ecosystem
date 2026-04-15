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

type BrokerPerformance = {
  broker: string;
  deals: number;
};

export function DashboardBrokerChart({ data }: { data: BrokerPerformance[] }) {
  if (!data.length) {
    return (
      <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-[#dbe4eb] text-sm text-[#7f8a99]">
        No broker performance data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#dbe4eb" />
        <XAxis dataKey="broker" stroke="#7f8a99" />
        <YAxis stroke="#7f8a99" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #dbe4eb",
            borderRadius: 12,
          }}
        />
        <Bar dataKey="deals" fill="#3aa4a8" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
