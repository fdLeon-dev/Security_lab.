import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Password never stored. Input validated, evaluated, then discarded.
const schema = z.object({
  password: z.string().min(1).max(256),
});

type Check = { id: string; label: string; pass: boolean; info: string };

function charsetSize(password: string) {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 32;
  return size;
}

function approxEntropy(password: string) {
  const cs = charsetSize(password);
  return cs > 0 ? Math.round(password.length * Math.log2(cs) * 10) / 10 : 0;
}

function evaluate(password: string) {
  const checks: Check[] = [
    {
      id: "length12",
      label: "Mínimo 12 caracteres",
      pass: password.length >= 12,
      info: `Longitud: ${password.length}`,
    },
    {
      id: "uppercase",
      label: "Al menos una mayúscula",
      pass: /[A-Z]/.test(password),
      info: "",
    },
    {
      id: "lowercase",
      label: "Al menos una minúscula",
      pass: /[a-z]/.test(password),
      info: "",
    },
    {
      id: "digit",
      label: "Al menos un dígito",
      pass: /[0-9]/.test(password),
      info: "",
    },
    {
      id: "special",
      label: "Al menos un carácter especial",
      pass: /[^a-zA-Z0-9]/.test(password),
      info: "",
    },
    {
      id: "noSpaces",
      label: "Sin espacios",
      pass: !/\s/.test(password),
      info: "",
    },
    {
      id: "noRepeating",
      label: "Sin secuencias repetidas obvias (aaa, 111)",
      pass: !/(.)\1{2,}/.test(password),
      info: "",
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const entropy = approxEntropy(password);
  const score = Math.round((passed / checks.length) * 100);

  let strength: "weak" | "moderate" | "strong" | "very_strong";
  if (entropy < 40 || score < 50) strength = "weak";
  else if (entropy < 60 || score < 70) strength = "moderate";
  else if (entropy < 80 || score < 90) strength = "strong";
  else strength = "very_strong";

  return { checks, passed, total: checks.length, score, entropy, strength };
}

export async function POST(request: NextRequest) {
  try {
    const { password } = schema.parse(await request.json());
    // Password is evaluated in memory only — never persisted
    const result = evaluate(password);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid password policy request" }, { status: 400 });
  }
}
