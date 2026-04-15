import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
});

const rawEnv = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
};

const parsedEnv = envSchema.safeParse(rawEnv);

export const appEnv = parsedEnv.success ? parsedEnv.data : rawEnv;

export function isApiConfigured() {
  return Boolean(rawEnv.NEXT_PUBLIC_API_BASE_URL?.trim());
}
