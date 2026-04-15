"use client";

type FancyStepperProps = {
  steps: string[];
  currentStep: number;
  onStepClick?: (index: number) => void;
};

export function FancyStepper({ steps, currentStep, onStepClick }: FancyStepperProps) {
  const safeCurrent = Math.max(0, Math.min(currentStep, steps.length - 1));
  const progress = steps.length <= 1 ? 100 : (safeCurrent / (steps.length - 1)) * 100;

  return (
    <div className="mb-5 rounded-md border border-[#dbe4eb] bg-[#f8fafc] p-4">
      <div className="relative mb-3 h-2 rounded-full bg-[#e7edf2]">
        <div
          className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-[#3aa4a8] to-[#2e7e98] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {steps.map((label, index) => {
          const isCompleted = index < safeCurrent;
          const isActive = index === safeCurrent;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onStepClick?.(index)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition ${
                isActive
                  ? "border-[#3aa4a8] bg-[#e8f7f8] text-[#1f2a44]"
                  : isCompleted
                    ? "border-[#cde7e8] bg-white text-[#2d7f8f]"
                    : "border-[#dbe4eb] bg-white text-[#7f8a99]"
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                  isActive
                    ? "bg-[#3aa4a8] text-white"
                    : isCompleted
                      ? "bg-[#dff3f4] text-[#2d7f8f]"
                      : "bg-[#eef3f7] text-[#7f8a99]"
                }`}
              >
                {index + 1}
              </span>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
