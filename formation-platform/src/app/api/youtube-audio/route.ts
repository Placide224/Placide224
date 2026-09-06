import ytdl from "@distube/ytdl-core";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ytdl-core streams Node buffers and needs real Node APIs — not available
// on the Edge runtime.
export const runtime = "nodejs";

const MAX_DURATION_SEC = 300; // keep in sync with the client-side cap

/**
 * Proxies a YouTube video's audio track to the browser, which then decodes
 * it with the Web Audio API exactly like an uploaded file — no ffmpeg on
 * the server, no video ever touches disk here.
 *
 * This relies on an unofficial method (reverse-engineered from YouTube's
 * player, not an official API) that can break whenever YouTube changes
 * something, and downloading YouTube audio outside YouTube's own tools can
 * conflict with YouTube's Terms of Service — the creator-facing UI requires
 * an explicit rights confirmation before calling this before this endpoint
 * is used for anything.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "CREATOR")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let url: string;
  try {
    const body = await request.json();
    url = String(body?.url ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!url || !ytdl.validateURL(url)) {
    return NextResponse.json({ error: "Lien YouTube invalide." }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);

    const lengthSeconds = Number(info.videoDetails.lengthSeconds);
    if (Number.isFinite(lengthSeconds) && lengthSeconds > MAX_DURATION_SEC) {
      return NextResponse.json(
        { error: `Cette vidéo dépasse ${Math.round(MAX_DURATION_SEC / 60)} minutes.` },
        { status: 400 },
      );
    }

    const format = ytdl.chooseFormat(info.formats, { filter: "audioonly", quality: "highestaudio" });

    const chunks: Buffer[] = [];
    for await (const chunk of ytdl.downloadFromInfo(info, { format })) {
      chunks.push(chunk as Buffer);
    }
    const audio = Buffer.concat(chunks);

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": format.mimeType?.split(";")[0] ?? "audio/webm",
        "X-Video-Title": encodeURIComponent(info.videoDetails.title ?? ""),
      },
    });
  } catch (err) {
    console.error("YouTube audio extraction failed:", err);
    const detail = err instanceof Error ? err.message : "inconnue";
    return NextResponse.json(
      {
        error:
          `Échec de l'extraction (${detail}). Cette méthode n'est pas l'API officielle de YouTube : ` +
          `elle peut échouer selon la vidéo (privée, restreinte, live) ou si YouTube a changé son lecteur.`,
      },
      { status: 502 },
    );
  }
}
