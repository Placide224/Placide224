import Link from "next/link";
import { requireCreator } from "@/lib/authz";
import { TranscriptionStudio } from "@/components/transcription-studio";

export default async function NewTranscriptionPage() {
  await requireCreator();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Nouvelle transcription</h1>
        <Link
          href="/admin/transcription"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Historique
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        L&apos;audio est analysé directement dans votre navigateur — rien n&apos;est
        envoyé au serveur tant que vous n&apos;enregistrez pas le résultat.
      </p>

      <div className="mt-6">
        <TranscriptionStudio />
      </div>
    </div>
  );
}
