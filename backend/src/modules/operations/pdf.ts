import { Response } from "express";
import PDFDocument from "pdfkit";
export function sendPdf(
  res: Response,
  filename: string,
  title: string,
  lines: string[],
) {
  res.type("application/pdf").attachment(filename);
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  doc.on("error", () => res.destroy());
  doc.pipe(res);
  doc.fillColor("#16624b").fontSize(24).text(title);
  doc.moveDown().fillColor("#334155").fontSize(11);
  for (const line of lines) doc.text(line).moveDown(0.5);
  doc.end();
}
