import { createOrganization } from "@/lib/organization-actions";

export default function NewOrganisationPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900">Nouvelle organisation</h1>
      <form action={createOrganization} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nom
          <input
            name="name"
            required
            placeholder="Lycée Savorgnan, Assurances Congo SA..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Type
          <select
            name="type"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          >
            <option value="INDEPENDENT">Indépendant</option>
            <option value="SCHOOL">École</option>
            <option value="UNIVERSITY">Université</option>
            <option value="COMPANY">Entreprise</option>
            <option value="GOVERNMENT">Administration</option>
            <option value="NGO">ONG</option>
          </select>
        </label>
        <button
          type="submit"
          className="mt-2 self-start rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Créer l&apos;organisation
        </button>
      </form>
    </div>
  );
}
