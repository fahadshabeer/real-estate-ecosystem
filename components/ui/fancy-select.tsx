"use client";

import { ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from "react";

type NativeSelectProps = ComponentPropsWithoutRef<"select">;

type FancySelectProps = Omit<NativeSelectProps, "onChange"> & {
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
};

type OptionRow = {
  value: string;
  label: string;
  disabled?: boolean;
};

function flattenOptions(children: ReactNode): OptionRow[] {
  const rows: OptionRow[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const element = child as ReactElement<{ value?: string; disabled?: boolean; label?: string; children?: ReactNode }>;
    if (typeof child.type === "string" && child.type === "option") {
      const label = String(element.props.children ?? "");
      rows.push({
        value: String(element.props.value ?? label),
        label,
        disabled: Boolean(element.props.disabled),
      });
      return;
    }
    if (typeof child.type === "string" && child.type === "optgroup") {
      const groupLabel = element.props.label ? `${String(element.props.label)}: ` : "";
      Children.forEach(element.props.children, (optionChild) => {
        if (!isValidElement(optionChild)) return;
        const optionElement = optionChild as ReactElement<{
          value?: string;
          disabled?: boolean;
          children?: ReactNode;
        }>;
        if (typeof optionChild.type === "string" && optionChild.type === "option") {
          const optionLabel = String(optionElement.props.children ?? "");
          rows.push({
            value: String(optionElement.props.value ?? optionLabel),
            label: `${groupLabel}${optionLabel}`,
            disabled: Boolean(optionElement.props.disabled),
          });
        }
      });
    }
  });
  return rows;
}

export function FancySelect({ value, onChange, className, disabled, children, ...rest }: FancySelectProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const options = useMemo(() => flattenOptions(children), [children]);
  const selected = options.find((option) => option.value === String(value ?? "")) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleValue = (nextValue: string) => {
    if (!onChange) return;
    const event = {
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>;
    onChange(event);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`${className ?? ""} flex w-full items-center justify-between pr-10 text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="truncate">{selected?.label ?? "Select"}</span>
        <ChevronDown className={`pointer-events-none absolute right-3 h-4 w-4 text-[#7f8a99] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-[#dbe4eb] bg-white p-1 shadow-[0_16px_38px_rgba(31,42,68,0.14)]">
          {options.map((option) => {
            const active = option.value === selected?.value;
            return (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  handleValue(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                  active ? "bg-[#3aa4a8] text-white" : "text-[#1f2a44] hover:bg-[#eef5f8]"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      <select
        {...rest}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      >
        {children}
      </select>
    </div>
  );
}
