import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line import/no-unresolved
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, CheckCircle2, MousePointerClick, Loader2, AlertCircle } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfPlacement {
  /** 0-indexed page number within the document. */
  page: number;
  /** Fraction (0-1) of the page width, measured from the left edge. */
  xRatio: number;
  /** Fraction (0-1) of the page height, measured from the TOP edge (screen convention). */
  yRatio: number;
}

interface PdfSignaturePlacerProps {
  pdfUrl: string;
  /** The signature/stamp image shown as a draggable marker while placing. */
  markerImageUrl: string;
  markerWidthPx?: number;
  label: string;
  onConfirm: (placement: PdfPlacement) => void;
  onSkip: () => void;
}

/**
 * Renders the deponent's actual uploaded PDF page-by-page and lets the
 * signer click anywhere on the real document to choose exactly where their
 * signature/stamp lands — Adobe Fill & Sign style — instead of a fixed
 * default position. The chosen page + ratio-based coordinates are handed
 * back to the caller, who persists them on the request and passes them to
 * pdfOverlayService so the final PDF places the mark at that exact spot.
 */
export const PdfSignaturePlacer: React.FC<PdfSignaturePlacerProps> = ({
  pdfUrl,
  markerImageUrl,
  markerWidthPx = 130,
  label,
  onConfirm,
  onSkip
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(0); // 0-indexed
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marker, setMarker] = useState<{ xRatio: number; yRatio: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Load the document once.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    pdfjsLib.getDocument(pdfUrl).promise
      .then((doc) => {
        if (cancelled) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        // Default to the last page, since that's where a signature block
        // conventionally sits — the signer can still navigate anywhere.
        setPageIndex(doc.numPages - 1);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('PDF load notice:', err?.message);
        setError('Could not load the original document for placement.');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      pdfDocRef.current?.destroy();
    };
  }, [pdfUrl]);

  // Render whichever page is active.
  useEffect(() => {
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    let cancelled = false;
    setIsLoading(true);
    setMarker(null);

    doc.getPage(pageIndex + 1).then((page) => {
      if (cancelled) return;
      const containerWidth = containerRef.current?.clientWidth || 600;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(containerWidth / unscaledViewport.width, 1.4);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setCanvasSize({ width: viewport.width, height: viewport.height });

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      renderTaskRef.current?.cancel();
      const task = page.render({ canvasContext: ctx, viewport, canvas });
      renderTaskRef.current = task;
      task.promise
        .then(() => { if (!cancelled) setIsLoading(false); })
        .catch((err: any) => {
          if (!cancelled && err?.name !== 'RenderingCancelledException') {
            console.warn('PDF page render notice:', err?.message);
            setIsLoading(false);
          }
        });
    }).catch((err) => {
      if (cancelled) return;
      console.warn('PDF page load notice:', err?.message);
      setError('Could not render this page.');
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [pageIndex]);

  const placeFromClientPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xRatio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const yRatio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    setMarker({ xRatio, yRatio });
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    placeFromClientPoint(e.clientX, e.clientY);
  };

  const handleMarkerPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const handleMarkerPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    placeFromClientPoint(e.clientX, e.clientY);
  };
  const handleMarkerPointerUp = () => setDragging(false);

  const markerWidthRatio = canvasSize.width ? markerWidthPx / canvasSize.width : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3" id="pdf-signature-placer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MousePointerClick className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-900">{label}</span>
        </div>
        {numPages > 1 && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono-code text-slate-500">
            <button
              type="button"
              onClick={() => setPageIndex(p => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              id="btn-pdf-placer-prev-page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>Page {pageIndex + 1} of {numPages}</span>
            <button
              type="button"
              onClick={() => setPageIndex(p => Math.min(numPages - 1, p + 1))}
              disabled={pageIndex === numPages - 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              id="btn-pdf-placer-next-page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {error ? (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative rounded-lg border border-slate-200 bg-slate-100 overflow-hidden mx-auto"
          style={{ maxWidth: '100%' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="block mx-auto cursor-crosshair max-w-full"
            id="pdf-signature-placer-canvas"
          />
          {marker && (
            <img
              src={markerImageUrl}
              alt="Placement marker"
              draggable={false}
              onPointerDown={handleMarkerPointerDown}
              onPointerMove={handleMarkerPointerMove}
              onPointerUp={handleMarkerPointerUp}
              className="absolute pointer-events-auto cursor-move border-2 border-dashed border-blue-500 bg-white/70 rounded touch-none select-none"
              style={{
                width: `${markerWidthPx}px`,
                left: `${marker.xRatio * 100}%`,
                top: `${marker.yRatio * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          )}
          {!marker && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1.5 rounded-full bg-slate-900/70 text-white text-[11px] font-semibold">
                Click anywhere on the document to place it
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={onSkip}
          className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          id="btn-pdf-placer-skip"
        >
          Use default position
        </button>
        <button
          type="button"
          disabled={!marker}
          onClick={() => marker && onConfirm({ page: pageIndex, xRatio: marker.xRatio, yRatio: marker.yRatio })}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs ${
            marker ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          id="btn-pdf-placer-confirm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Confirm Placement
        </button>
      </div>
    </div>
  );
};
