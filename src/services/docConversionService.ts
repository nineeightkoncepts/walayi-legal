import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadConvertedPdf } from './documentStorageService';
import { CommissioningRequest } from '../types';

/**
 * True for a Microsoft Word upload (.docx or legacy .doc), by MIME type or,
 * failing that, filename extension (browsers/OSes sometimes hand back a
 * generic octet-stream MIME type for a real .docx).
 */
export const isWordDocument = (mimeType?: string, fileName?: string): boolean => {
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return true;
  if (mimeType === 'application/msword') return true;
  const name = (fileName || '').toLowerCase();
  return name.endsWith('.docx') || name.endsWith('.doc');
};

const PAGE_WIDTH_PX = 794; // A4 @ 96dpi
const PAGE_HEIGHT_PX = 1123;

async function renderHtmlToPdfBytes(html: string): Promise<Uint8Array> {
  const container = document.createElement('div');
  container.style.cssText = `position:fixed; left:-99999px; top:0; width:${PAGE_WIDTH_PX}px; padding:64px 60px; background:#ffffff; font-family: Georgia, 'Times New Roman', serif; font-size:14px; line-height:1.6; color:#0f172a;`;
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: PAGE_WIDTH_PX
    });

    const pdf = new jsPDF({ unit: 'px', format: [PAGE_WIDTH_PX, PAGE_HEIGHT_PX] });
    const sliceHeightPx = PAGE_HEIGHT_PX * (canvas.width / PAGE_WIDTH_PX);
    const totalPages = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage([PAGE_WIDTH_PX, PAGE_HEIGHT_PX]);
      const thisSliceHeight = Math.min(sliceHeightPx, canvas.height - i * sliceHeightPx);

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = thisSliceHeight;
      const ctx = sliceCanvas.getContext('2d');
      if (!ctx) continue;
      ctx.drawImage(canvas, 0, i * sliceHeightPx, canvas.width, thisSliceHeight, 0, 0, canvas.width, thisSliceHeight);

      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
      const renderedHeightPx = (thisSliceHeight / canvas.width) * PAGE_WIDTH_PX;
      pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_PX, renderedHeightPx);
    }

    return new Uint8Array(pdf.output('arraybuffer'));
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Converts a real .docx file's actual bytes into real PDF pages — the
 * genuine paragraphs, headings, bold/italic and lists from the uploaded
 * document (via mammoth's docx-to-HTML conversion), rendered to an A4 page
 * image, not a placeholder summary. Legacy binary .doc (pre-2007 Word) has
 * no viable pure-browser parser and will throw; callers should treat that
 * as "not convertible" and fall back accordingly.
 */
export async function convertWordBytesToPdfBytes(sourceBytes: ArrayBuffer): Promise<Uint8Array> {
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: sourceBytes });
  if (!html || !html.trim()) {
    throw new Error('WORD_CONVERSION_EMPTY');
  }
  return renderHtmlToPdfBytes(html);
}

/**
 * Resolves a URL guaranteed to be a real, openable PDF for a commissioning
 * request's original document — used by BOTH the interactive
 * click-to-place-your-signature step and the final signed-instrument
 * download, so a Word upload gets exactly the same real-document treatment
 * a PDF upload always has. A native PDF is used as-is. A Word (.docx)
 * upload is converted once and the result cached back onto the request
 * (convertedPdfUrl) so every later placement/download reuses the identical
 * file — converting again on each call could subtly reflow the content and
 * invalidate a signature position a party already chose.
 *
 * Throws NO_OVERLAYABLE_ORIGINAL when there's nothing to overlay onto (no
 * upload at all) or WORD_CONVERSION_FAILED for a genuinely unconvertible
 * file (e.g. legacy binary .doc) — callers should fall back to the
 * synthetic certificate PDF in either case.
 */
export async function ensureOverlayablePdfUrl(request: CommissioningRequest): Promise<string> {
  if (request.originalMimeType === 'application/pdf' && request.rawFileUrl) {
    return request.rawFileUrl;
  }

  if (request.convertedPdfUrl) {
    return request.convertedPdfUrl;
  }

  if (!request.rawFileUrl || !isWordDocument(request.originalMimeType, request.fileName)) {
    throw new Error('NO_OVERLAYABLE_ORIGINAL');
  }

  const res = await fetch(request.rawFileUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch original document (HTTP ${res.status})`);
  }
  const sourceBytes = await res.arrayBuffer();

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await convertWordBytesToPdfBytes(sourceBytes);
  } catch (e) {
    console.warn('Word-to-PDF conversion failed (likely legacy .doc):', e);
    throw new Error('WORD_CONVERSION_FAILED');
  }

  const url = await uploadConvertedPdf(request.id, pdfBytes);

  // Best-effort cache — if this write fails, the next call just converts
  // again rather than the whole operation failing.
  updateDoc(doc(db, 'commissioningRequests', request.id), { convertedPdfUrl: url }).catch((err) => {
    console.warn('Could not persist converted PDF url:', err?.message);
  });

  return url;
}
