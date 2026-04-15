"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      theme="light"
      position="top-right"
      toastOptions={{
        className: "border border-[#dbe4eb] bg-white text-[#1f2a44]",
      }}
    />
  );
}
