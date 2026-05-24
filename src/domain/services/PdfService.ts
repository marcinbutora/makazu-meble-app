import { jsPDF } from "jspdf";
import { OrderItem } from "../entities/OrderItem.js";
import { BOMService, BOMPart } from "./BOMService.js";

const THICKNESS = 18;
const FONT = "DJSans";

interface Col {
  label: string;
  x: number;
  w: number;
  align: "left" | "center" | "right";
}

export class PdfService {
  private bom = new BOMService();
  private fontReady = false;

  private readonly PW = 210;
  private readonly PH = 297;
  private readonly M = 18;

  // ── font ──────────────────────────────────────────────

  private async ensureFont(doc: jsPDF): Promise<void> {
    if (this.fontReady) return;
    try {
      const url = "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37/ttf/DejaVuSans.ttf";
      const res = await fetch(url);
      if (!res.ok) throw new Error("font fetch failed");
      const buf = await res.arrayBuffer();
      const b64 = this.bufToB64(buf);
      doc.addFileToVFS("DejaVuSans.ttf", b64);
      doc.addFont("DejaVuSans.ttf", FONT, "normal");
      doc.addFont("DejaVuSans.ttf", FONT, "bold");
      this.fontReady = true;
    } catch {
      // fallback – Polish diacritics will be stripped
    }
  }

  private bufToB64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  private setFont(doc: jsPDF, size: number, style: "normal" | "bold" = "normal"): void {
    doc.setFont(FONT, style);
    doc.setFontSize(size);
  }

  private t(doc: jsPDF, text: string, x: number, y: number, opts?: any): void {
    doc.text(this.cleanText(text), x, y, opts);
  }

  private cleanText(s: string): string {
    if (this.fontReady) return s;
    const map: Record<string, string> = {
      "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n",
      "ó": "o", "ś": "s", "ź": "z", "ż": "z",
      "Ą": "A", "Ć": "C", "Ę": "E", "Ł": "L", "Ń": "N",
      "Ó": "O", "Ś": "S", "Ź": "Z", "Ż": "Z",
    };
    return s.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => map[ch] || ch);
  }

  // ── full report ──────────────────────────────────────

  async generate(items: OrderItem[], contractor?: { name: string; nip?: string }): Promise<jsPDF> {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    await this.ensureFont(doc);

    this.pageBomTable(doc, items, contractor);
    let cabNum = 0;
    items.forEach((item) => {
      if (item.isCabinet) {
        cabNum++;
        doc.addPage();
        this.pageCabinet(doc, item, cabNum);
      }
    });
    return doc;
  }

  // ── BOM table page(s) ─────────────────────────────────

  private pageBomTable(doc: jsPDF, items: OrderItem[], contractor?: { name: string; nip?: string }): void {
    this.drawHeader(doc, "ZESTAWIENIE MATERIALOWE (BOM)");
    this.drawContractor(doc, contractor);

    let y = 42;
    items.forEach((item, idx) => {
      const parts = this.bom.calculate(item, idx);
      if (y > this.PH - 30) { doc.addPage(); y = this.M; }
      y = this.drawGroupHeader(doc, item, idx, y);
      y = this.drawBomRows(doc, parts, y);
      y += 4;
    });
  }

  private drawGroupHeader(doc: jsPDF, item: OrderItem, idx: number, y: number): number {
    doc.setFillColor(37, 99, 235);
    doc.rect(this.M, y, this.PW - 2 * this.M, 7, "F");
    doc.setTextColor(255, 255, 255);
    this.setFont(doc, 9, "bold");
    this.t(doc, `#${idx + 1}  ${item.typeBadge}       ${item.dimensions.width} x ${item.dimensions.height} x ${item.dimensions.depth} mm`, this.M + 2, y + 5);
    doc.setTextColor(0, 0, 0);
    return y + 9;
  }

  private drawBomRows(doc: jsPDF, parts: BOMPart[], y: number): number {
    const cols = this.bomCols();
    const rowH = 6.5;
    let cy = y;

    doc.setFillColor(51, 65, 85);
    doc.setTextColor(255, 255, 255);
    this.setFont(doc, 7, "bold");
    doc.rect(this.M, cy, this.PW - 2 * this.M, rowH, "F");
    cols.forEach(c => this.t(doc, c.label, c.x, cy + rowH * 0.7));
    doc.setTextColor(0, 0, 0);
    cy += rowH;

    parts.forEach((p, i) => {
      if (cy > this.PH - 20) { doc.addPage(); cy = this.M; }
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(this.M, cy, this.PW - 2 * this.M, rowH, "F"); }
      this.setFont(doc, 7, "normal");
      this.t(doc, p.name, cols[0].x, cy + rowH * 0.7, { maxWidth: cols[0].w });
      this.t(doc, String(p.w), cols[1].x, cy + rowH * 0.7, { align: "right" });
      this.t(doc, String(p.h), cols[2].x, cy + rowH * 0.7, { align: "right" });
      this.t(doc, `${p.qty} szt.`, cols[3].x, cy + rowH * 0.7, { align: "center" });
      this.t(doc, p.mat, cols[4].x, cy + rowH * 0.7);
      this.t(doc, String(p.edgeLong ?? 0), cols[5].x, cy + rowH * 0.7, { align: "center" });
      this.t(doc, String(p.edgeShort ?? 0), cols[6].x, cy + rowH * 0.7, { align: "center" });
      cy += rowH;
    });
    return cy;
  }

  private bomCols(): Col[] {
    const left = this.M;
    const fullW = this.PW - 2 * this.M;
    const specs: { label: string; frac: number; align: Col["align"] }[] = [
      { label: "Element", frac: 0.28, align: "left" },
      { label: "Szer. mm", frac: 0.12, align: "right" },
      { label: "Wys. mm", frac: 0.12, align: "right" },
      { label: "Ilosc", frac: 0.10, align: "center" },
      { label: "Material", frac: 0.22, align: "left" },
      { label: "Dl.", frac: 0.08, align: "center" },
      { label: "Krot.", frac: 0.08, align: "center" },
    ];
    let x = left;
    return specs.map(c => {
      const w = fullW * c.frac;
      const col = { label: c.label, x, w: w - 0.5, align: c.align };
      x += w;
      return col;
    });
  }

  // ── cabinet detail page ───────────────────────────────

  private pageCabinet(doc: jsPDF, item: OrderItem, num: number): void {
    const w = item.dimensions.width;
    const h = item.dimensions.height;
    const d = item.dimensions.depth;

    this.drawHeader(doc, `SZAFKA ${item.type === "corner" ? "NAROŻNA" : item.typeBadge}  #${num}       ${w} x ${h} x ${d} mm`);

    // top row: drawing left + specs right
    const rowTop = 23;
    const rowH = 80;
    const drawW = 62;
    const drawH = 72;
    const drawX = 18;
    const drawY = rowTop + (rowH - drawH) / 2;
    const specsX = 92;
    const bomsY = rowTop + rowH + 6;

    this.drawMiniCabinet(doc, item, drawX, drawY, drawW, drawH);
    this.drawCabinetSpecs(doc, item, specsX, rowTop);
    this.drawCabinetBomTable(doc, item, num, bomsY);
  }

  // ── mini cabinet drawing ──────────────────────────────

  private drawMiniCabinet(doc: jsPDF, item: OrderItem, bx: number, by: number, maxW: number, maxH: number): void {
    const w = item.dimensions.width;
    const h = item.dimensions.height;

    const scale = Math.min(maxW / w, maxH / h);
    const sW = w * scale;
    const sH = h * scale;
    const cx = bx + (maxW - sW) / 2;
    const cy = by + (maxH - sH) / 2;

    // outline
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.rect(cx, cy, sW, sH);

    // interior
    if (item.interiorType === "shelves" && item.shelvesCount > 0) {
      const sections = item.shelvesCount + 1;
      const totalPlates = 36 + item.shelvesCount * THICKNESS;
      const clear = Math.max(0, Math.floor((h - totalPlates) / sections));
      const gapH = clear * scale;
      const shelfH = THICKNESS * scale;

      for (let i = 0; i <= item.shelvesCount; i++) {
        const gapTop = cy + i * (shelfH + gapH);
        if (gapH > 4) {
          this.setFont(doc, 4, "normal");
          this.t(doc, `${clear}mm`, cx + sW / 2, gapTop + gapH / 2 + 0.5, { align: "center" });
        }
        if (i < item.shelvesCount) {
          const shelfTop = gapTop + gapH;
          doc.setFillColor(200, 210, 225);
          doc.setDrawColor(148, 163, 184);
          doc.setLineWidth(0.15);
          doc.rect(cx, shelfTop, sW, shelfH, "FD");
        }
      }
    } else if (item.interiorType === "drawers") {
      let y = cy;
      doc.setFontSize(4.5);
      doc.setFont(FONT, "normal");
      doc.setTextColor(0, 0, 0);
      item.drawerHeights.forEach((dh, i) => {
        const ds = h > 0 ? (dh / h) * sH : 0;
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.25);
        doc.rect(cx + 0.5, y + 0.5, sW - 1, ds - 0.5);
        this.t(doc, ds > 6 ? `sz.${i + 1}: ${dh}mm` : `s.${i + 1}`, cx + sW / 2, y + ds / 2 + 1.5, { align: "center" });
        y += ds;
      });
    }

    // dimension arrows
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.15);
    const dTop = cy - 5;

    this.arrowTickLeft(doc, cx, dTop, cy);
    this.arrowTickRight(doc, cx + sW, dTop, cy);
    doc.line(cx, dTop, cx + sW, dTop);
    this.setFont(doc, 7, "bold");
    this.t(doc, `${w}`, cx + sW / 2, dTop - 1.5, { align: "center" });

    // right height dimension
    const dX = cx + sW + 8;
    this.arrowTickTop(doc, dX, cy, cx + sW);
    this.arrowTickBottom(doc, dX, cy + sH, cx + sW);
    doc.line(dX, cy, dX, cy + sH);
    this.setFont(doc, 7, "bold");
    this.t(doc, `${h}`, dX + 3, cy + sH / 2, { angle: -90, align: "center" });

    // depth label
    this.setFont(doc, 6, "normal");
    this.t(doc, `gl.${item.dimensions.depth}`, cx + sW, cy + sH + 4, { align: "right" });
  }

  private arrowTickLeft(doc: jsPDF, x: number, y: number, anchorY: number): void {
    doc.line(x, y, x, anchorY);
    doc.line(x, y, x + 1.2, y - 0.8);
    doc.line(x, y, x + 1.2, y + 0.8);
  }
  private arrowTickRight(doc: jsPDF, x: number, y: number, anchorY: number): void {
    doc.line(x, y, x, anchorY);
    doc.line(x, y, x - 1.2, y - 0.8);
    doc.line(x, y, x - 1.2, y + 0.8);
  }
  private arrowTickTop(doc: jsPDF, x: number, y: number, anchorX: number): void {
    doc.line(x, y, anchorX, y);
    doc.line(x, y, x - 0.8, y + 1.2);
    doc.line(x, y, x + 0.8, y + 1.2);
  }
  private arrowTickBottom(doc: jsPDF, x: number, y: number, anchorX: number): void {
    doc.line(x, y, anchorX, y);
    doc.line(x, y, x - 0.8, y - 1.2);
    doc.line(x, y, x + 0.8, y - 1.2);
  }

  // ── cabinet specs box ─────────────────────────────────

  private drawCabinetSpecs(doc: jsPDF, item: OrderItem, x: number, y: number): void {
    this.setFont(doc, 8, "bold");
    this.t(doc, "SPECYFIKACJA", x, y); y += 5;
    this.setFont(doc, 7, "normal");

    const specs: [string, string][] = [
      ["Typ", `${item.typeBadge} \u2013 ${item.typeLabel}`],
      ["Gabaryty", `${item.dimensions.width} x ${item.dimensions.height} x ${item.dimensions.depth} mm`],
      ["Korpus", item.colorBody],
      ["Fronty", item.colorFront],
      ["Uchwyt", item.handleType],
      ["Wnetrze", item.interiorType === "shelves"
        ? `Polki x ${item.shelvesCount}`
        : `Szuflady x ${item.drawersCount}`],
    ];

    if (item.interiorType === "drawers") {
      specs.push(["Wys. szuflad", item.drawerHeights.map((h, i) => `#${i + 1}:${h}`).join(" | ")]);
      specs.push(["Boki szuflad", item.drawerOwnSides ? "Wlasne" : "Systemowe"]);
    }

    specs.forEach(([label, value]) => {
      this.setFont(doc, 7, "bold");
      this.t(doc, `${label}:`, x, y);
      this.setFont(doc, 7, "normal");
      this.t(doc, value, x + 25, y);
      y += 4.3;
    });
  }

  // ── cabinet BOM sub-table ─────────────────────────────

  private drawCabinetBomTable(doc: jsPDF, item: OrderItem, num: number, startY: number): void {
    const parts = this.bom.calculate(item, num - 1);
    const cols = this.bomCols();
    const rowH = 5.8;
    const left = 18;
    let y = startY;

    this.setFont(doc, 7.5, "bold");
    this.t(doc, "ELEMENTY SKLADOWE", left, y);
    y += 3.5;

    doc.setFillColor(51, 65, 85);
    doc.setTextColor(255, 255, 255);
    this.setFont(doc, 6.5, "bold");
    doc.rect(left, y, this.PW - 2 * left, rowH, "F");
    cols.forEach(c => this.t(doc, c.label, c.x, y + rowH * 0.7));
    doc.setTextColor(0, 0, 0);
    y += rowH;

    parts.forEach((p, i) => {
      if (y > this.PH - 10) { doc.addPage(); y = this.M; }
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(left, y, this.PW - 2 * left, rowH, "F"); }
      this.setFont(doc, 6.5, "normal");
      this.t(doc, p.name, cols[0].x, y + rowH * 0.7, { maxWidth: cols[0].w });
      this.t(doc, String(p.w), cols[1].x, y + rowH * 0.7, { align: "right" });
      this.t(doc, String(p.h), cols[2].x, y + rowH * 0.7, { align: "right" });
      this.t(doc, `${p.qty} szt.`, cols[3].x, y + rowH * 0.7, { align: "center" });
      this.t(doc, p.mat, cols[4].x, y + rowH * 0.7);
      this.t(doc, String(p.edgeLong ?? 0), cols[5].x, y + rowH * 0.7, { align: "center" });
      this.t(doc, String(p.edgeShort ?? 0), cols[6].x, y + rowH * 0.7, { align: "center" });
      y += rowH;
    });
  }

  // ── shared helpers ────────────────────────────────────

  private drawHeader(doc: jsPDF, title: string): void {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, this.PW, 18, "F");
    doc.setTextColor(255, 255, 255);
    this.setFont(doc, 11, "bold");
    this.t(doc, "MAKAZU-MEBLE", this.M, 10);
    this.setFont(doc, 8, "normal");
    this.t(doc, title, this.M, 14.5);
    doc.setTextColor(0, 0, 0);
  }

  private drawContractor(doc: jsPDF, contractor?: { name: string; nip?: string }): void {
    if (!contractor || !contractor.name) return;
    let cy = 24;
    this.setFont(doc, 7, "normal");
    this.t(doc, `Wykonawca: ${contractor.name}`, this.M, cy); cy += 4;
    if (contractor.nip) this.t(doc, `NIP: ${contractor.nip}`, this.M, cy);
  }

  // ── public save helper ─────────────────────────────────

  save(doc: jsPDF, filename?: string): void {
    const ts = new Date().toISOString().slice(0, 10);
    doc.save(filename ?? `makazu-raport-${ts}.pdf`);
  }
}
