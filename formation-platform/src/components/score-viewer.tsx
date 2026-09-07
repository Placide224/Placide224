"use client";

import { useEffect, useRef, useState } from "react";
import { downloadBlob } from "./transcription-view";

/**
 * Renders real staff notation from a MusicXML string, via
 * OpenSheetMusicDisplay. Dynamically imported so the ~2MB library only
 * loads when a creator actually has a result to look at, not on every
 * page in the app.
 */
export function ScoreViewer({ musicXml, filename }: { musicXml: string; filename: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  async function downloadPdf() {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    setExporting(true);
    setError(null);
    try {
      const [{ jsPDF }] = await Promise.all([import("jspdf"), import("svg2pdf.js")]);
      const width = svg.viewBox.baseVal.width || svg.clientWidth;
      const height = svg.viewBox.baseVal.height || svg.clientHeight;
      const pdf = new jsPDF(width > height ? "l" : "p", "pt", [width, height]);
      await pdf.svg(svg, { x: 0, y: 0, width, height });
      downloadBlob(pdf.output("blob"), `${filename}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'export PDF.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Partition</p>
        {!loading && !error && (
          <button
            type="button"
            onClick={downloadPdf}
            disabled={exporting}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting ? "Export…" : "Télécharger en PDF"}
          </button>
        )}
      </div>
      {loading && <p className="mt-2 text-sm text-slate-500">Affichage de la partition…</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div ref={containerRef} className="mt-3 w-full overflow-x-auto" />
    </div>
  );
}
