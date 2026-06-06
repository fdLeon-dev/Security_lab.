"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@deviceslab.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (response?.error) {
      setError("Credenciales inválidas.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">Acceso privado</h1>
        <p className="mt-2 text-sm text-slate-400">Inicia sesión para gestionar tu plataforma académica.</p>

        <label className="mt-6 block text-sm text-slate-300">Email</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 transition focus:ring-2"
          type="email"
          required
        />

        <label className="mt-4 block text-sm text-slate-300">Password</label>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 transition focus:ring-2"
          type="password"
          required
        />

        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
        >
          {loading ? "Validando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
