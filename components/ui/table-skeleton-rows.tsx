"use client";

export function TableSkeletonRows({ rows = 5, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rowIndex}`} className="border-t border-[#ecf1f5]">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${colIndex}`} className="px-4 py-3">
              <div className="h-4 w-full max-w-[180px] animate-pulse rounded-md bg-[#e6edf3]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
