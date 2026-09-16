import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CommissioningRequest } from '../types';

/**
 * Programmatic PDF generation for the final certified legal instrument.
 *
 * The certified output is ALWAYS a PDF, regardless of whether the uploaded
 * source document was a PDF or a Word (.doc/.docx) file. The instrument is
 * rebuilt here as a clean, deterministic A4 PDF so it renders identically in
 * every browser (and doesn't depend on html2canvas, which cannot parse the
 * oklch colours emitted by Tailwind v4).
 *
 * It carries BOTH executed signatures — the deponent's (or thumbprint) in the
 * deponent's designated provision, and the commissioner's in the commissioner's
 * designated provision — together with the official seal, the WALAYI
 * verification number, and a verification QR code.
 */

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

// Palette (hex — jsPDF is colour-space agnostic, so no oklch issues)
const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#CBD5E1';
const ACCENT = '#0D1B3D';
const GOLD = '#92400E';
const SEAL = '#0D1B3D';

const formatDate = (iso?: string): string => {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

const setText = (pdf: jsPDF, hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  pdf.setTextColor(r, g, b);
};
const setDraw = (pdf: jsPDF, hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  pdf.setDrawColor(r, g, b);
};
const setFill = (pdf: jsPDF, hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  pdf.setFillColor(r, g, b);
};

/** Draw a simple official round seal with the serial and authority text. */
function drawSeal(pdf: jsPDF, cx: number, cy: number, radius: number, request: CommissioningRequest) {
  setDraw(pdf, SEAL);
  pdf.setLineWidth(1.4);
  pdf.circle(cx, cy, radius, 'S');
  pdf.setLineWidth(0.7);
  pdf.circle(cx, cy, radius - 5, 'S');

  setText(pdf, SEAL);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.text('COMMISSIONER', cx, cy - 10, { align: 'center' });
  pdf.text('FOR OATHS', cx, cy - 3, { align: 'center' });
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  const serial = request.commissionerSealSerial || `UG-CFO-${new Date().getFullYear()}-${request.certificateNumber.slice(-4)}`;
  pdf.text('REPUBLIC OF UGANDA', cx, cy + 5, { align: 'center' });
  pdf.text(serial, cx, cy + 12, { align: 'center' });
}

/** Try to place a signature/thumbprint image; on failure fall back to a typed name. */
function placeSignature(
  pdf: jsPDF,
  dataUrl: string | undefined,
  fallbackName: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Signature box
  setDraw(pdf, LINE);
  pdf.setLineWidth(0.5);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.rect(x, y, w, h, 'S');
  pdf.setLineDashPattern([], 0);

  if (dataUrl && dataUrl.startsWith('data:image')) {
    try {
      const fmt = dataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
      // Fit the image within the box, preserving a sensible height
      const imgH = h - 8;
      const imgW = w - 12;
      pdf.addImage(dataUrl, fmt, x + 6, y + 4, imgW, imgH, undefined, 'FAST');
      return;
    } catch (e) {
      // fall through to typed name
    }
  }
  setText(pdf, INK);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(13);
  pdf.text(fallbackName, x + w / 2, y + h / 2 + 4, { align: 'center' });
}

export async function buildCertifiedInstrumentPdf(request: CommissioningRequest): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  const verifyCode = request.securityNumber || request.certificateNumber;
  const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://walayi.ug'}/#verify/${verifyCode}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 220,
      margin: 1,
      color: { dark: '#0f172aff', light: '#ffffffff' },
    });
  } catch (e) {
    qrDataUrl = '';
  }

  const station = (request.assignedProfessionalStation || 'Kampala').toUpperCase();
  const completedDate = formatDate(request.completedAt || request.createdAt);

  let y = MARGIN;

  // ---- Header ----
  setText(pdf, INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('THE REPUBLIC OF UGANDA', A4_WIDTH / 2, y, { align: 'center' });
  y += 16;
  pdf.setFontSize(11);
  pdf.text(`IN THE HIGH COURT OF UGANDA AT ${station}`, A4_WIDTH / 2, y, { align: 'center' });
  y += 14;
  setText(pdf, MUTED);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(9);
  pdf.text('IN THE MATTER OF THE COMMISSIONERS FOR OATHS (ADVOCATES) ACT, CAP. 5', A4_WIDTH / 2, y, { align: 'center' });
  y += 12;
  pdf.text('AND THE ELECTRONIC SIGNATURES ACT & ELECTRONIC TRANSACTIONS ACT, 2011', A4_WIDTH / 2, y, { align: 'center' });
  y += 16;

  setDraw(pdf, INK);
  pdf.setLineWidth(1.2);
  pdf.line(MARGIN, y, A4_WIDTH - MARGIN, y);
  y += 22;

  // ---- Title & identifiers ----
  setText(pdf, ACCENT);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  const title = (request.documentTitle || 'Certified Legal Instrument').toUpperCase();
  const titleLines = pdf.splitTextToSize(title, CONTENT_WIDTH);
  pdf.text(titleLines, A4_WIDTH / 2, y, { align: 'center' });
  y += titleLines.length * 16 + 6;

  setText(pdf, MUTED);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Certificate No: ${request.certificateNumber}`, A4_WIDTH / 2, y, { align: 'center' });
  y += 20;

  // ---- Jurat / body ----
  setText(pdf, INK);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  const jurat =
    request.juratText ||
    `SWORN / AFFIRMED at ${request.assignedProfessionalStation || 'Kampala'}, Uganda, this ${completedDate}, ` +
      `by the said ${request.deponentName}, who appeared before me via secure statutory video link and was ` +
      `duly identified, having taken the prescribed oath / affirmation in accordance with the law.`;
  const juratLines = pdf.splitTextToSize(jurat, CONTENT_WIDTH);
  pdf.text(juratLines, MARGIN, y);
  y += juratLines.length * 13 + 18;

  // ---- Execution grid (two designated provisions) ----
  const colGap = 20;
  const colW = (CONTENT_WIDTH - colGap) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colW + colGap;
  const boxTop = y;
  const boxH = 150;

  // Provision boxes
  setDraw(pdf, LINE);
  pdf.setLineWidth(0.8);
  pdf.setLineDashPattern([], 0);
  pdf.roundedRect(leftX, boxTop, colW, boxH, 6, 6, 'S');
  pdf.roundedRect(rightX, boxTop, colW, boxH, 6, 6, 'S');

  // Left: DEPONENT
  setText(pdf, MUTED);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('DEPONENT EXECUTION', leftX + 10, boxTop + 16);

  const isThumb = request.deponentExecutionMethod === 'THUMBPRINT';
  const deponentAsset = isThumb ? request.deponentThumbprintDataUrl : request.deponentSignatureDataUrl;
  placeSignature(pdf, deponentAsset, request.deponentName, leftX + 10, boxTop + 24, colW - 20, 58);

  setText(pdf, INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(request.deponentName, leftX + 10, boxTop + 100);
  setText(pdf, MUTED);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(`NIN: ${request.deponentNin || 'N/A'}`, leftX + 10, boxTop + 113);
  pdf.text(`${isThumb ? 'Thumbprint' : 'Signature'} • ${formatDate(request.deponentSignedAt || request.completedAt)}`, leftX + 10, boxTop + 124);
  setText(pdf, MUTED);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('Deponent', leftX + 10, boxTop + 138);

  // Right: COMMISSIONER
  setText(pdf, MUTED);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('COMMISSIONER ATTESTATION & SEAL', rightX + 10, boxTop + 16);

  const commissionerName = request.assignedProfessionalName || 'Commissioner for Oaths';
  placeSignature(pdf, request.commissionerSignatureDataUrl, commissionerName, rightX + 10, boxTop + 24, colW - 90, 58);

  // Seal to the right of the commissioner signature
  drawSeal(pdf, rightX + colW - 40, boxTop + 54, 30, request);

  setText(pdf, INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  const cnLines = pdf.splitTextToSize(commissionerName, colW - 20);
  pdf.text(cnLines, rightX + 10, boxTop + 100);
  setText(pdf, MUTED);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('COMMISSIONER FOR OATHS / ADVOCATE', rightX + 10, boxTop + 113);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.text(`Warrant: CFO/${new Date().getFullYear()}/0119`, rightX + 10, boxTop + 124);
  pdf.text(`Sealed: ${formatDate(request.commissionerSignedAt || request.completedAt)}`, rightX + 10, boxTop + 135);

  y = boxTop + boxH + 22;

  // ---- WALAYI verification block ----
  const vbH = 96;
  setFill(pdf, '#F8FAFC');
  setDraw(pdf, LINE);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, vbH, 6, 6, 'FD');

  if (qrDataUrl) {
    try {
      pdf.addImage(qrDataUrl, 'PNG', MARGIN + 12, y + 12, 72, 72, undefined, 'FAST');
    } catch (e) {
      /* ignore */
    }
  }

  const vx = MARGIN + 100;
  setText(pdf, GOLD);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('WALAYI VERIFICATION NUMBER', vx, y + 24);
  setText(pdf, ACCENT);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(16);
  pdf.text(verifyCode, vx, y + 44);

  setText(pdf, MUTED);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(`Certificate ID: ${request.certificateNumber}`, vx, y + 60);
  const vLines = pdf.splitTextToSize(
    `Independently verifiable at ${verificationUrl}`,
    CONTENT_WIDTH - 120
  );
  pdf.text(vLines, vx, y + 72);
  setText(pdf, '#047857');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('DIGITALLY COMMISSIONED VIA WALAYI • INDEPENDENTLY VERIFIABLE', vx, y + 86);

  y += vbH + 18;

  // ---- Cryptographic digests ----
  setText(pdf, MUTED);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  if (request.documentSha256) {
    pdf.text(`Original SHA-256: ${request.documentSha256}`, MARGIN, y);
    y += 10;
  }
  if (request.finalDocumentSha256) {
    pdf.text(`Sealed Instrument SHA-256: ${request.finalDocumentSha256}`, MARGIN, y);
    y += 10;
  }

  // ---- Footer ----
  const footerY = A4_HEIGHT - 40;
  setDraw(pdf, LINE);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, footerY - 12, A4_WIDTH - MARGIN, footerY - 12);
  setText(pdf, MUTED);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.text(
    'WALAYI provides a technology-enabled workflow for commissioning documents. Users remain responsible for ensuring that the document and commissioning process meet applicable professional, institutional and procedural requirements.',
    A4_WIDTH / 2,
    footerY,
    { align: 'center', maxWidth: CONTENT_WIDTH }
  );
  pdf.text(
    `Generated by WALAYI Digital Trust Root • ${new Date().toISOString()}`,
    A4_WIDTH / 2,
    footerY + 10,
    { align: 'center' }
  );

  return pdf;
}

/** Build and trigger download of the certified instrument PDF. */
export async function downloadCertifiedInstrumentPdf(request: CommissioningRequest): Promise<void> {
  const pdf = await buildCertifiedInstrumentPdf(request);
  const code = request.securityNumber || request.certificateNumber;
  const safe = String(code).replace(/[^a-zA-Z0-9_-]/g, '_');
  pdf.save(`WALAYI_Certified_Instrument_${safe}.pdf`);
}
