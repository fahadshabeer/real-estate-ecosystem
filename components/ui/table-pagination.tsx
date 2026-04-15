"use client";

type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export function TablePagination({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-end gap-4 border-t border-[#ecf1f5] px-4 py-3 text-sm text-[#7f8a99]">
      <span>
        Currently at Page: {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-[#1f2a44] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={currentPage >= totalPages}
        className="rounded-md border border-[#dbe4eb] bg-white px-3 py-1.5 text-[#1f2a44] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

