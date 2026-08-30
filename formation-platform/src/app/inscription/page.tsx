import Link from "next/link";
import RegisterForm from "./register-form";

export default function InscriptionPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Créer un compte</h1>
      <p className="mt-1 text-sm text-slate-500">
        Inscrivez-vous pour suivre les formations du catalogue.
      </p>
      <RegisterForm />
      <p className="mt-6 text-sm text-slate-500">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-medium text-teal-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
