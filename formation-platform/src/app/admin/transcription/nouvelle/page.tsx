import Link from "next/link";
import { requireCreator } from "@/lib/authz";
import { TranscriptionStudio } from "@/components/transcription-studio";

export default async function NewTranscriptionPage() {
  await requireCreator();

  return (
    <div>
      <Link href="/admin/transcription" className="text-sm text-teal-700 hover:underline">
        ← Retour à l&apos;historique
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Nouvelle transcription</h1>
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
