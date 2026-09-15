import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import { CommissioningRequest, DocumentMarkPlacement } from '../types';
import { buildCertifiedInstrumentPdf, downloadCertifiedInstrumentPdf } from './pdfService';

/**
 * Real "Fill & Sign" style finishing: takes the ACTUAL uploaded PDF bytes and
 * places the deponent's and commissioner's signatures (and the commissioner's
 * digital stamp) directly onto the document's own last page — the original
 * content is never redrawn or replaced, only marked up, exactly like Adobe
 * Fill & Sign. A WALAYI verification page (QR code, hash digests, statutory
 * citations — reusing the existing jsPDF-built certificate page) is appended
 * after the original pages so the instrument still carries independently
 * verifiable metadata.
 *
 * This only works when the source file was a real PDF (rawFileUrl +
 * originalMimeType === 'application/pdf'); pdf-lib has no way to parse a
 * .doc/.docx. For anything else, callers should fall back to the synthetic
 * certificate PDF (downloadCertifiedInstrumentPdf in pdfService.ts).
 */

const INK = rgb(0x0f / 255, 0x17 / 255, 0x2a / 255);
const MUTED = rgb(0x64 / 255, 0x74 / 255, 0x8b / 255);
const LINE = rgb(0xcb / 255, 0xd5 / 255, 0xe1 / 255);

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch original document (HTTP ${res.status})`);
  }
  return res.arrayBuffer();
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function embedImageFromDataUrl(pdfDoc: PDFDocument, dataUrl: string) {
  const bytes = dataUrlToBytes(dataUrl);
  return dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')
    ? pdfDoc.embedJpg(bytes)
    : pdfDoc.embedPng(bytes);
}

function drawCenteredText(page: PDFPage, text: string, cx: number, y: number, size: number, font: PDFFont, color = INK) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - w / 2, y, size, font, color });
}

/** Draws the commissioner's official digital stamp — a round dual-ring seal. */
function drawDigitalStamp(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  cx: number,
  cy: number,
  radius: number,
  request: CommissioningRequest
) {
  page.drawCircle({ x: cx, y: cy, size: radius, borderColor: INK, borderWidth: 1.4, color: undefined });
  page.drawCircle({ x: cx, y: cy, size: radius - 5, borderColor: INK, borderWidth: 0.7, color: undefined });

  drawCenteredText(page, 'COMMISSIONER', cx, cy + 11, 6, fontBold);
  drawCenteredText(page, 'FOR OATHS', cx, cy + 4, 6, fontBold);
  drawCenteredText(page, 'REPUBLIC OF UGANDA', cx, cy - 6, 4.5, font, MUTED);
  const serial = request.commissionerSealSerial || `UG-CFO-${new Date().getFullYear()}-${request.certificateNumber.slice(-4)}`;
  drawCenteredText(page, serial, cx, cy - 13, 4.5, font, MUTED);
}

const formatDate = (iso?: string): string => {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Places both parties' signatures — reusing whatever is already stored on
 * the request (which itself comes from either a fresh capture or, when
 * available, each party's saved profile signature) — plus the commissioner's
 * digital stamp, directly onto the real document's last page.
 */
/** Resolves which page a mark lands on: the signer's chosen page if valid, else the document's last page. */
function resolveMarkPage(pages: PDFPage[], placement?: DocumentMarkPlacement): PDFPage {
  if (placement && placement.page >= 0 && placement.page < pages.length) {
    return pages[placement.page];
  }
  return pages[pages.length - 1];
}

/** Converts a signer-chosen ratio (top-down, screen convention) into a PDF point (bottom-up) on that page. */
function placementToPoint(page: PDFPage, placement: DocumentMarkPlacement): { x: number; y: number } {
  const { width, height } = page.getSize();
  return { x: placement.xRatio * width, y: height - placement.yRatio * height };
}

async function placeSignaturesOnOriginal(pdfDoc: PDFDocument, request: CommissioningRequest) {
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width: lastPageWidth } = lastPage.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const boxW = 190;
  const boxH = 46;
  const baseY = 86;
  const defaultLeftX = 48;
  const defaultRightX = lastPageWidth - 48 - boxW;

  // --- Deponent's designated provision — the signer's chosen spot, or a
  // default bottom-left box on the last page if they skipped placement. ---
  const deponentPage = resolveMarkPage(pages, request.deponentMarkPlacement);
  const deponentPoint = request.deponentMarkPlacement
    ? placementToPoint(deponentPage, request.deponentMarkPlacement)
    : null;
  const deponentX = deponentPoint ? deponentPoint.x - boxW / 2 : defaultLeftX;
  const deponentY = deponentPoint ? deponentPoint.y - boxH / 2 : baseY;

  deponentPage.drawText('DEPONENT SIGNATURE', { x: deponentX, y: deponentY + boxH + 6, size: 7, font: fontBold, color: MUTED });
  deponentPage.drawRectangle({ x: deponentX, y: deponentY, width: boxW, height: boxH, borderColor: LINE, borderWidth: 0.8 });

  const isThumb = request.deponentExecutionMethod === 'THUMBPRINT';
  const deponentAsset = isThumb ? request.deponentThumbprintDataUrl : request.deponentSignatureDataUrl;
  if (deponentAsset && deponentAsset.startsWith('data:image')) {
    try {
      const img = await embedImageFromDataUrl(pdfDoc, deponentAsset);
      const dims = img.scaleToFit(boxW - 16, boxH - 14);
      deponentPage.drawImage(img, {
        x: deponentX + (boxW - dims.width) / 2,
        y: deponentY + (boxH - dims.height) / 2,
        width: dims.width,
        height: dims.height
      });
    } catch {
      drawCenteredText(deponentPage, request.deponentName, deponentX + boxW / 2, deponentY + boxH / 2 - 4, 11, font);
    }
  } else {
    drawCenteredText(deponentPage, request.deponentName, deponentX + boxW / 2, deponentY + boxH / 2 - 4, 11, font);
  }
  deponentPage.drawText(request.deponentName, { x: deponentX, y: deponentY - 12, size: 8, font: fontBold, color: INK });
  deponentPage.drawText(
    `${isThumb ? 'Thumbprint' : 'Signature'} • ${formatDate(request.deponentSignedAt)}`,
    { x: deponentX, y: deponentY - 23, size: 6.5, font, color: MUTED }
  );

  // --- Commissioner's designated provision (signature + digital stamp) —
  // again the signer's chosen spot, or a default bottom-right box. ---
  const commissionerPage = resolveMarkPage(pages, request.commissionerMarkPlacement);
  const commissionerPoint = request.commissionerMarkPlacement
    ? placementToPoint(commissionerPage, request.commissionerMarkPlacement)
    : null;
  const commissionerX = commissionerPoint ? commissionerPoint.x - boxW / 2 : defaultRightX;
  const commissionerY = commissionerPoint ? commissionerPoint.y - boxH / 2 : baseY;

  commissionerPage.drawText('COMMISSIONER ATTESTATION', { x: commissionerX, y: commissionerY + boxH + 6, size: 7, font: fontBold, color: MUTED });
  commissionerPage.drawRectangle({ x: commissionerX, y: commissionerY, width: boxW, height: boxH, borderColor: LINE, borderWidth: 0.8 });

  const commissionerName = request.assignedProfessionalName || 'Commissioner for Oaths';
  if (request.commissionerSignatureDataUrl && request.commissionerSignatureDataUrl.startsWith('data:image')) {
    try {
      const img = await embedImageFromDataUrl(pdfDoc, request.commissionerSignatureDataUrl);
      const dims = img.scaleToFit(boxW - 16, boxH - 14);
      commissionerPage.drawImage(img, {
        x: commissionerX + (boxW - dims.width) / 2,
        y: commissionerY + (boxH - dims.height) / 2,
        width: dims.width,
        height: dims.height
      });
    } catch {
      drawCenteredText(commissionerPage, commissionerName, commissionerX + boxW / 2, commissionerY + boxH / 2 - 4, 11, font);
    }
  } else {
    drawCenteredText(commissionerPage, commissionerName, commissionerX + boxW / 2, commissionerY + boxH / 2 - 4, 11, font);
  }
  commissionerPage.drawText(commissionerName, { x: commissionerX, y: commissionerY - 12, size: 8, font: fontBold, color: INK });
  commissionerPage.drawText(`Sealed • ${formatDate(request.commissionerSignedAt)}`, { x: commissionerX, y: commissionerY - 23, size: 6.5, font, color: MUTED });

  // Digital stamp, just to the left of the commissioner's box, on whichever
  // page that box ended up on.
  const stampCx = Math.max(30, commissionerX - 30);
  drawDigitalStamp(commissionerPage, font, fontBold, stampCx, commissionerY + boxH / 2, 26, request);
}

/**
 * Builds the final signed instrument: the deponent's real uploaded PDF, with
 * both signatures and the commissioner's digital stamp placed on its last
 * page, plus an appended WALAYI verification page. Throws if the request
 * has no overlayable original (caller should fall back to the synthetic
 * certificate PDF in that case).
 */
export async function buildSignedOriginalInstrument(request: CommissioningRequest): Promise<Uint8Array> {
  if (!request.rawFileUrl || request.originalMimeType !== 'application/pdf') {
    throw new Error('NO_OVERLAYABLE_ORIGINAL');
  }

  const originalBytes = await fetchBytes(request.rawFileUrl);
  const pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });

  await placeSignaturesOnOriginal(pdfDoc, request);

  // Append the existing verification/certificate page (QR, hash digests,
  // statutory citations) so the instrument keeps independently verifiable
  // metadata alongside the real, unmodified original content.
  try {
    const certPdf = await buildCertifiedInstrumentPdf(request);
    const certBytes = certPdf.output('arraybuffer') as ArrayBuffer;
    const certDoc = await PDFDocument.load(certBytes);
    const [certPage] = await pdfDoc.copyPages(certDoc, [0]);
    pdfDoc.addPage(certPage);
  } catch (e) {
    // The signed original is still valid and complete without the
    // verification page — never let this sink the whole download.
    console.warn('Could not append verification page to signed instrument:', e);
  }

  return pdfDoc.save();
}

function triggerPdfDownload(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Single entry point every "download the final document" action should
 * call. Prefers the real overlay-onto-original result; transparently falls
 * back to the synthetic certificate PDF when the source wasn't a PDF (or
 * anything about the overlay fails), so a download never simply breaks.
 */
export async function downloadFinalInstrumentPdf(request: CommissioningRequest): Promise<void> {
  const code = request.securityNumber || request.certificateNumber;
  const safe = String(code).replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const bytes = await buildSignedOriginalInstrument(request);
    triggerPdfDownload(bytes, `WALAYI_Certified_Instrument_${safe}.pdf`);
  } catch (e: any) {
    if (e?.message !== 'NO_OVERLAYABLE_ORIGINAL') {
      console.warn('Signed-original instrument build failed, falling back to certificate PDF:', e?.message);
    }
    await downloadCertifiedInstrumentPdf(request);
  }
}
