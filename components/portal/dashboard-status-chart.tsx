"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type PropertyStatus = {
  name: string;
  value: number;
  color: string;
};

export function DashboardStatusChart({ data }: { data: PropertyStatus[] }) {
  if (!data.length) {
    return (
      <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-[#dbe4eb] text-sm text-[#7f8a99]">
        No inventory status data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #dbe4eb",
            borderRadius: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
