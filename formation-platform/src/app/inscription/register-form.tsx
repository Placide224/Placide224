"use client";

import { useActionState, useState } from "react";
import { registerAccount } from "@/lib/auth-actions";

type AccountType = "apprenant" | "formateur" | "professionnel";

export default function RegisterForm({
  defaultAccountType = "apprenant",
}: {
  defaultAccountType?: AccountType;
}) {
  const [state, formAction, pending] = useActionState(registerAccount, undefined);
  const [accountType, setAccountType] = useState<AccountType>(defaultAccountType);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <div className="flex rounded-lg border border-slate-300 p-1 text-sm">
        {(
          [
            { value: "apprenant", label: "Apprenant" },
            { value: "formateur", label: "Formateur" },
            { value: "professionnel", label: "Professionnel" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setAccountType(opt.value)}
            className={`flex-1 rounded-md px-2 py-1.5 font-medium transition ${
              accountType === opt.value
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="accountType" value={accountType} />

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {accountType === "professionnel" ? "Nom du contact" : "Nom complet"}
        <input
          type="text"
          name="name"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
      </label>
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
          minLength={8}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
      </label>

      {accountType === "professionnel" && (
        <>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nom de l&apos;organisation
            <input
              type="text"
              name="organizationName"
              required
              placeholder="Lycée Savorgnan, Assurances Congo SA..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Type d&apos;organisation
            <select
              name="organizationType"
              defaultValue="COMPANY"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            >
              <option value="COMPANY">Entreprise</option>
              <option value="SCHOOL">École</option>
              <option value="UNIVERSITY">Université</option>
              <option value="GOVERNMENT">Administration</option>
              <option value="NGO">ONG</option>
            </select>
          </label>
        </>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-600 disabled:opacity-60"
      >
        {pending ? "Création..." : "Créer mon compte"}
      </button>
    </form>
  );
}
