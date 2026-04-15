function currentYear() {
  return String(new Date().getFullYear());
}

export async function nextDeterministicId(prefix: string, counterKey: string, pad = 4) {
  const key = `re.meta.counter.${counterKey}`;
  let nextValue = 1;
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    const current = Number(window.localStorage.getItem(key) ?? "0");
    nextValue = Number.isFinite(current) ? current + 1 : 1;
    window.localStorage.setItem(key, String(nextValue));
  }

  return `${prefix}-${currentYear()}-${String(nextValue).padStart(pad, "0")}`;
}
