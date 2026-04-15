"use client";

import { toast } from "sonner";

export function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  return error instanceof Error ? error.message : fallback;
}

export async function runWithToast<T>(options: {
  loading: string;
  success: string | ((result: T) => string);
  action: () => Promise<T>;
  error?: string | ((error: unknown) => string);
  description?: string | ((result: T) => string | undefined);
}) {
  const toastId = toast.loading(options.loading);
  try {
    const result = await options.action();
    const successMessage =
      typeof options.success === "function" ? options.success(result) : options.success;
    const description =
      typeof options.description === "function" ? options.description(result) : options.description;

    toast.success(successMessage, { id: toastId, description });
    return result;
  } catch (error) {
    const errorMessage =
      typeof options.error === "function"
        ? options.error(error)
        : options.error ?? getErrorMessage(error, "Request failed.");
    toast.error(errorMessage, { id: toastId });
    throw error;
  }
}

