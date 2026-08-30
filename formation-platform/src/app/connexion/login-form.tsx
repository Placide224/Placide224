"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth-actions";

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Email
        <input
          type="email"
          name="email"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Mot de passe
        <input
          type="password"
          name="password"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
