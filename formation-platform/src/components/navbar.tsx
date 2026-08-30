import Link from "next/link";
import { getSessionUser } from "@/lib/authz";
import { signOutAction } from "@/lib/session-actions";

export default async function Navbar() {
  const user = await getSessionUser();
  const isCreator = user?.role === "ADMIN" || user?.role === "CREATOR";

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Formation<span className="text-teal-600">Studio</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/catalogue" className="hover:text-slate-900">
            Catalogue
          </Link>
          {user && (
            <Link href="/mon-apprentissage" className="hover:text-slate-900">
              Mon apprentissage
            </Link>
          )}
          {isCreator && (
            <Link href="/admin" className="hover:text-slate-900">
              Production
            </Link>
          )}
          {user ? (
            <form action={signOutAction}>
              <button type="submit" className="hover:text-slate-900">
                Déconnexion ({user.name})
              </button>
            </form>
          ) : (
            <Link
              href="/connexion"
              className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
            >
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
