"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCreator } from "@/lib/authz";

const noteSchema = z.object({
  pitch: z.string().min(1).max(8),
  midi: z.number().int().min(0).max(127),
  start: z.number().min(0),
  duration: z.number().min(0),
});

const drumHitSchema = z.object({
  type: z.enum(["kick", "snare", "hihat_closed", "hihat_open"]),
  start: z.number().min(0),
});

const saveTranscriptionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  source: z.enum(["UPLOAD", "RECORDING"]),
  tempo: z.number().positive().max(400),
  key: z.string().min(1).max(20),
  durationSec: z.number().min(0).max(600),
  notes: z.array(noteSchema).max(20000),
  drums: z.array(drumHitSchema).max(20000),
});

export type SaveTranscriptionInput = z.infer<typeof saveTranscriptionSchema>;

export async function saveTranscription(input: SaveTranscriptionInput) {
  const user = await requireCreator();
  const data = saveTranscriptionSchema.parse(input);

  const transcription = await prisma.transcription.create({
    data: {
      title: data.title,
      source: data.source,
      tempo: data.tempo,
      key: data.key,
      durationSec: data.durationSec,
      notes: data.notes,
      drums: data.drums,
      creatorId: user.id,
    },
  });

  revalidatePath("/admin/transcription");
  redirect(`/admin/transcription/${transcription.id}`);
}

export async function deleteTranscription(id: string) {
  const user = await requireCreator();
  const transcription = await prisma.transcription.findUnique({
    where: { id },
    select: { creatorId: true },
  });
  if (!transcription) throw new Error("Transcription introuvable");
  if (transcription.creatorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Vous n'avez pas accès à cette transcription");
  }

  await prisma.transcription.delete({ where: { id } });
  revalidatePath("/admin/transcription");
  redirect("/admin/transcription");
}
