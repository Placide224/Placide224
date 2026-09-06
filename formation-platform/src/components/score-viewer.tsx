"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders real staff notation from a MusicXML string, via
 * OpenSheetMusicDisplay. Dynamically imported so the ~2MB library only
 * loads when a creator actually has a result to look at, not on every
 * page in the app.
 */
export function ScoreViewer({ musicXml }: { musicXml: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);
      try {
        const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          drawTitle: false,
          backend: "svg",
        });
        await osmd.load(musicXml);
        if (cancelled) return;
        osmd.render();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossible d'afficher la partition.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [musicXml]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-medium text-slate-700">Partition</p>
      {loading && <p className="mt-2 text-sm text-slate-500">Affichage de la partition…</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div ref={containerRef} className="mt-3 w-full overflow-x-auto" />
    </div>
  );
}
