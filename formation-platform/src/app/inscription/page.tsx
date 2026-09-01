import Link from "next/link";
import RegisterForm from "./register-form";

const COPY = {
  apprenant: {
    title: "Créer un compte apprenant",
    subtitle: "Inscrivez-vous pour suivre les formations du catalogue.",
  },
  formateur: {
    title: "Créer un compte formateur",
    subtitle: "Créez et publiez vos propres formations sur FormationStudio.",
  },
  professionnel: {
    title: "Créer un compte professionnel",
    subtitle:
      "Pour une école, une entreprise ou une institution : créez votre organisation et invitez vos formateurs.",
  },
} as const;

type AccountType = keyof typeof COPY;

function resolveType(value: string | string[] | undefined): AccountType {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "formateur" || v === "professionnel" ? v : "apprenant";
}

export default async function InscriptionPage({
  searchParams,
}: PageProps<"/inscription">) {
  const params = await searchParams;
  const accountType = resolveType(params.type);
  const copy = COPY[accountType];

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{copy.subtitle}</p>
      <RegisterForm defaultAccountType={accountType} />
      <p className="mt-6 text-sm text-slate-500">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-medium text-teal-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
