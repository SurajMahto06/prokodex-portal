import { jsPDF } from "jspdf";
import QRCodeLib from "qrcode";

// ── Colour Palette (Internshala-inspired) ──
const NAVY = "#0a192f";
const TEAL = "#0ea5a0";
const TEAL_DK = "#0d9488";
const TEAL_LT = "#5eead4";
const BLACK = "#111827";
const GREY = "#6b7280";
const GREY_LT = "#9ca3af";
const WHITE = "#ffffff";

// ── Helper: hex → RGB ──
function hexRGB(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// ── Helper: get text width in pt ──
function getTextWidth(pdf: jsPDF, text: string, size: number): number {
  return pdf.getStringUnitWidth(text) * size;
}

// ── Helper: centered text ──
function centreText(
  pdf: jsPDF,
  text: string,
  y: number,
  opts: {
    size?: number;
    color?: string;
    font?: string;
    style?: string;
    letterSpacing?: number;
    pageW?: number;
  } = {}
) {
  const {
    size = 14,
    color = BLACK,
    font = "helvetica",
    style = "normal",
    pageW = 842,
  } = opts;
  pdf.setFont(font, style);
  pdf.setFontSize(size);
  pdf.setTextColor(...hexRGB(color));

  if (opts.letterSpacing && opts.letterSpacing > 0) {
    // Calculate total width with letter spacing
    const chars = text.split("");
    const charWidths = chars.map((ch) => getTextWidth(pdf, ch, size));
    const totalW = charWidths.reduce((s, w) => s + w, 0) + (chars.length - 1) * opts.letterSpacing;
    let x = (pageW - totalW) / 2;
    for (let i = 0; i < chars.length; i++) {
      pdf.text(chars[i], x, y);
      x += charWidths[i] + opts.letterSpacing;
    }
  } else {
    pdf.text(text, pageW / 2, y, { align: "center" });
  }
}

// ═══════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  certificateId: string;
  startDate?: string;
  endDate?: string;
}

export const generateCertificatePDF = async (
  _elementIdOrData: string | CertificateData,
  fileName: string = "certificate.pdf"
) => {
  let data: CertificateData;
  if (typeof _elementIdOrData === "string") {
    console.warn("generateCertificatePDF: element-id mode is deprecated. Use data mode.");
    return false;
  } else {
    data = _elementIdOrData;
  }

  const { studentName, courseTitle, issueDate, certificateId } = data;

  const formatFullDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch { return d; }
  };

  // For "Date of Certification" footer — keeps original en-IN style: "7 September 2026"
  const formatIssueDateDisplay = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    } catch { return d; }
  };

  const W = 842;
  const H = 595;

  try {
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // ─────────────────────────────────────────────
    // 1. WHITE BACKGROUND
    // ─────────────────────────────────────────────
    pdf.setFillColor(...hexRGB(WHITE));
    pdf.rect(0, 0, W, H, "F");

    // TOP TEAL BAR
    pdf.setFillColor(...hexRGB(TEAL));
    pdf.rect(0, 0, W, 5, "F");

    // ─────────────────────────────────────────────
    // 2. TOP-RIGHT DECORATIVE SHAPES
    // ─────────────────────────────────────────────
    // Large teal half-circle clipped at edge
    pdf.setFillColor(...hexRGB(TEAL));
    pdf.circle(W, 0, 80, "F");

    // Medium darker circle overlapping right edge
    pdf.setFillColor(...hexRGB(TEAL_DK));
    pdf.circle(W + 15, 100, 45, "F");

    // Small light accent circle
    pdf.setFillColor(...hexRGB(TEAL_LT));
    pdf.circle(W - 80, 60, 16, "F");

    // ─────────────────────────────────────────────
    // 3. BOTTOM-LEFT DECORATIVE SHAPES (mirror)
    // ─────────────────────────────────────────────
    pdf.setFillColor(...hexRGB(TEAL));
    pdf.circle(0, H, 80, "F");

    pdf.setFillColor(...hexRGB(TEAL_DK));
    pdf.circle(-15, H - 100, 45, "F");

    pdf.setFillColor(...hexRGB(TEAL_LT));
    pdf.circle(80, H - 60, 16, "F");

    // ─────────────────────────────────────────────
    // 4. COMPANY LOGO — Top-left
    // ─────────────────────────────────────────────
    const logoX = 46;
    const logoY = 30;

    try {
      const logoResponse = await fetch("/logo-light.png");
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
      const logoH = 40;
      const logoW = logoH * 4;
      pdf.addImage(logoBase64, "PNG", logoX, logoY, logoW, logoH);

      // Draw large centered watermark (transparent, no rotation)
      const wmH = 160;
      const wmW = wmH * 4;

      const cx = W / 2;
      const cy = H / 2;

      pdf.setGState(new (pdf as any).GState({ opacity: 0.045 }));
      // Perfectly centered horizontally and vertically
      pdf.addImage(logoBase64, "PNG", cx - wmW / 2, cy - wmH / 2, wmW, wmH);
      pdf.setGState(new (pdf as any).GState({ opacity: 1.0 }));
    } catch (e) {
      // Fallback text logo
      pdf.setFillColor(...hexRGB(NAVY));
      pdf.roundedRect(logoX, logoY, 40, 40, 8, 8, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.setTextColor(...hexRGB(WHITE));
      pdf.text("PK", logoX + 20, logoY + 26, { align: "center" });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(...hexRGB(NAVY));
      pdf.text("PROKODEX", logoX + 50, logoY + 26);
    }

    // ─────────────────────────────────────────────
    // 4.5 MSME LOGO — Top-left (below main logo)
    // ─────────────────────────────────────────────
    try {
      const msmeResponse = await fetch("/msme.png");
      const msmeBlob = await msmeResponse.blob();
      const msmeBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(msmeBlob);
      });

      // Dynamically calculate aspect ratio to prevent shape distortion
      const img = new Image();
      img.src = msmeBase64;
      await new Promise((resolve) => { img.onload = resolve; });
      const aspectRatio = img.width / img.height;

      // Place MSME logo on the top right, before the decorative elements
      const msmeH = 65; // Increased height even more
      const msmeW = msmeH * aspectRatio; // Correct width based on original shape
      const msmeX = W - msmeW - 110; // Placed before the top-right decorative elements
      const msmeY = 30; // Aligned with the top margin
      pdf.addImage(msmeBase64, "PNG", msmeX, msmeY, msmeW, msmeH);

      // "MSME Registered" text below the logo
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...hexRGB(NAVY)); // Using your NAVY constant
      pdf.text("MSME Registered", msmeX + msmeW / 2, msmeY + msmeH + 12, { align: "center" });
    } catch (e) {
      console.warn("MSME logo not found in public folder");
    }

    // ─────────────────────────────────────────────
    // 5. MAIN TITLE — "CERTIFICATE" + "OF INTERNSHIP"
    // ─────────────────────────────────────────────
    centreText(pdf, "CERTIFICATE", 140, {
      size: 48,
      color: NAVY,
      style: "bold",
      font: "times",
      letterSpacing: 5,
    });

    centreText(pdf, "OF INTERNSHIP COMPLETION", 170, {
      size: 15,
      color: NAVY,
      style: "bold",
      letterSpacing: 7,
    });

    // ─────────────────────────────────────────────
    // 6. BODY — Certify text + Student Name
    // ─────────────────────────────────────────────
    centreText(pdf, "This is to certify that", 210, {
      size: 13,
      color: GREY,
      style: "italic",
      font: "times",
    });

    // Student name — large elegant serif
    centreText(pdf, studentName, 252, {
      size: 36,
      color: NAVY,
      style: "bolditalic",
      font: "times",
    });

    // Teal underline below name
    pdf.setFont("times", "bolditalic");
    pdf.setFontSize(36);
    const nameW = getTextWidth(pdf, studentName, 36);
    const underHalf = Math.max(nameW / 2 + 15, 100);
    pdf.setDrawColor(...hexRGB(TEAL));
    pdf.setLineWidth(2);
    pdf.line(W / 2 - underHalf, 262, W / 2 + underHalf, 262);

    // ─────────────────────────────────────────────
    // 7. DESCRIPTION — Professional real certificate text
    // ─────────────────────────────────────────────

    // Line 1: highlight "internship" and "Prokodex"
    {
      const sz = 12;
      const p1 = "has successfully completed the "; // normal
      const p2 = "internship";                        // bold highlight
      const p3 = " program at ";                      // normal
      const p4 = "Prokodex";                          // bold highlight
      pdf.setFontSize(sz);
      pdf.setFont("helvetica", "normal"); const w1 = getTextWidth(pdf, p1, sz);
      pdf.setFont("helvetica", "bold"); const w2 = getTextWidth(pdf, p2, sz);
      pdf.setFont("helvetica", "normal"); const w3 = getTextWidth(pdf, p3, sz);
      pdf.setFont("helvetica", "bold"); const w4 = getTextWidth(pdf, p4, sz);
      const totalW = w1 + w2 + w3 + w4;
      let x = (W - totalW) / 2;
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexRGB(GREY)); pdf.text(p1, x, 296); x += w1;
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...hexRGB(NAVY)); pdf.text(p2, x, 296); x += w2;
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexRGB(GREY)); pdf.text(p3, x, 296); x += w3;
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...hexRGB(NAVY)); pdf.text(p4, x, 296);
    }

    centreText(pdf, "and demonstrated exceptional skills and dedication in the field of", 312, {
      size: 12,
      color: GREY,
      font: "helvetica",
    });

    // Course title — bold, prominent
    centreText(pdf, courseTitle, 346, {
      size: 22,
      color: NAVY,
      style: "bold",
    });

    // Internship period — highlight dates
    const startStr = data.startDate ? formatFullDate(data.startDate) : formatFullDate(issueDate);
    const endStr = data.endDate ? formatFullDate(data.endDate) : formatFullDate(issueDate);

    {
      const sz = 12;
      const p1 = "During the internship from "; // normal
      const p2 = startStr;                       // bold highlight
      const p3 = " to ";                          // normal
      const p4 = endStr;                          // bold highlight
      const p5 = ", the candidate exhibited a strong understanding"; // normal
      pdf.setFontSize(sz);
      pdf.setFont("helvetica", "normal"); const w1 = getTextWidth(pdf, p1, sz);
      pdf.setFont("helvetica", "bold"); const w2 = getTextWidth(pdf, p2, sz);
      pdf.setFont("helvetica", "normal"); const w3 = getTextWidth(pdf, p3, sz);
      pdf.setFont("helvetica", "bold"); const w4 = getTextWidth(pdf, p4, sz);
      pdf.setFont("helvetica", "normal"); const w5 = getTextWidth(pdf, p5, sz);
      const totalW = w1 + w2 + w3 + w4 + w5;
      let x = (W - totalW) / 2;
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexRGB(GREY)); pdf.text(p1, x, 380); x += w1;
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...hexRGB(NAVY)); pdf.text(p2, x, 380); x += w2;
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexRGB(GREY)); pdf.text(p3, x, 380); x += w3;
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(...hexRGB(NAVY)); pdf.text(p4, x, 380); x += w4;
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexRGB(GREY)); pdf.text(p5, x, 380);
    }

    centreText(pdf, "of core concepts, contributed to real-world projects, and met all performance criteria.", 396, {
      size: 12,
      color: GREY,
      font: "helvetica",
    });

    // ─────────────────────────────────────────────
    // 8. QR CODE — Left bottom (mirrors signature on right)
    // ─────────────────────────────────────────────
    const baseVerifyUrl = process.env.NEXT_PUBLIC_VERIFY_URL || "https://www.prokodex.in/verify";
    const verifyUrl = `${baseVerifyUrl}?id=${certificateId}`;
    const qrDataUrl = await QRCodeLib.toDataURL(verifyUrl, {
      width: 300,
      margin: 1,
      color: { dark: NAVY, light: WHITE },
      errorCorrectionLevel: "H",
    });

    const qrSize = 72;
    const qrCenterX = 170;  // Mirrors sigCenterX (W - 170)
    const qrX = qrCenterX - qrSize / 2;
    const qrY = H - 130;

    // QR border
    pdf.setDrawColor(...hexRGB(TEAL_DK));
    pdf.setLineWidth(1.5);
    pdf.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4, 4, "S");

    // QR image
    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // "Scan to Verify" badge — centered below QR
    const vBadgeW = 84;
    const vBadgeH = 16;
    const vBadgeX = qrCenterX - vBadgeW / 2;
    const vBadgeY = qrY + qrSize + 6;

    pdf.setFillColor(...hexRGB(TEAL));
    pdf.roundedRect(vBadgeX, vBadgeY, vBadgeW, vBadgeH, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...hexRGB(WHITE));
    pdf.text("Scan to Verify", qrCenterX, vBadgeY + 11, { align: "center" });

    // ─────────────────────────────────────────────
    // 9. SIGNATURE — Single, right-aligned
    // ─────────────────────────────────────────────
    const sigLineW = 150;
    const sigCenterX = W - 170;
    const sigLineY = H - 82;

    // Load signature image
    try {
      const sigResponse = await fetch("/signature.png");
      const sigBlob = await sigResponse.blob();
      const sigBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(sigBlob);
      });

      // Signature image above the line
      const sigImgH = 40;
      const sigImgW = sigImgH * 2.5;
      const sigImgX = sigCenterX - sigImgW / 2;
      const sigImgY = sigLineY - sigImgH - 4;
      pdf.addImage(sigBase64, "PNG", sigImgX, sigImgY, sigImgW, sigImgH);
    } catch (e) {
      // Fallback: italic text signature
      pdf.setFont("times", "italic");
      pdf.setFontSize(24);
      pdf.setTextColor(...hexRGB(NAVY));
      pdf.text("S. Mahto", sigCenterX, sigLineY - 10, { align: "center" });
    }

    // Signature line
    pdf.setDrawColor(...hexRGB(BLACK));
    pdf.setLineWidth(0.8);
    pdf.line(sigCenterX - sigLineW / 2, sigLineY, sigCenterX + sigLineW / 2, sigLineY);

    // Name
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...hexRGB(BLACK));
    pdf.text("SURAJ KUMAR MAHTO", sigCenterX, sigLineY + 16, { align: "center" });

    // Title
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(...hexRGB(GREY));
    pdf.text("Founder & CEO, Prokodex", sigCenterX, sigLineY + 30, { align: "center" });

    // ─────────────────────────────────────────────
    // 10. DATE & CERTIFICATE ID — Bottom center
    // ─────────────────────────────────────────────
    // Aligned vertically with the QR badge and Signature title
    centreText(pdf, `Date of Certification:  ${formatIssueDateDisplay(issueDate)}`, H - 70, {
      size: 10,
      color: BLACK,
      style: "bold",
    });
    centreText(pdf, `Certificate ID:  ${certificateId}`, H - 52, { // Exact same baseline as Founder text (H-82 + 30 = H-52)
      size: 9,
      color: GREY,
      style: "normal",
    });

    // ─────────────────────────────────────────────
    // 11. BOTTOM WATERMARK
    // ─────────────────────────────────────────────
    centreText(pdf, "www.prokodex.in", H - 14, {
      size: 8,
      color: GREY_LT,
    });

    // ─────────────────────────────────────────────
    // 11. BOTTOM TEAL BAR
    // ─────────────────────────────────────────────
    pdf.setFillColor(...hexRGB(TEAL));
    pdf.rect(0, H - 5, W, 5, "F");

    // ── SAVE ─────────────────────────────────────
    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};
