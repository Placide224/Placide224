import Link from "next/link";
import LoginForm from "./login-form";

export default async function ConnexionPage({
  searchParams,
}: PageProps<"/connexion">) {
  const { callbackUrl } = await searchParams;
  const target = typeof callbackUrl === "string" ? callbackUrl : "/mon-apprentissage";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>
      <p className="mt-1 text-sm text-slate-500">
        Accédez à votre espace apprenant ou de production.
      </p>
      <LoginForm callbackUrl={target} />
      <p className="mt-6 text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-teal-700 hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
