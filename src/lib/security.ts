import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
});

export const securePasswordSchema = z
  .string()
  .min(10)
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

export function sanitizeText(text: string) {
  return text.replace(/[<>]/g, "").trim();
}
