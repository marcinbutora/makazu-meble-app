import { OrderItem, CornerType } from "../entities/OrderItem.js";

export interface BOMPart {
  name: string;
  w: number | string;
  h: number | string;
  qty: number;
  mat: string;
  edge: string;
}

const THICKNESS = 18;

export class BOMService {
  calculate(item: OrderItem, index: number): BOMPart[] {
    const label = `#${index + 1} [${item.typeLabel}]`;
    if (item.type === "countertop") {
      return [{
        name: "Blat roboczy (format na wymiar)",
        w: item.dimensions.width,
        h: item.dimensions.depth,
        qty: 1,
        mat: item.countertopColor,
        edge: `gr. ${item.countertopThickness} mm`,
      }];
    }
    if (item.type === "led") {
      const mount = item.ledType === "recessed" ? "Wpuszczany" : "Nawierzchniowy";
      return [{
        name: `Profil LED (${mount})`,
        w: item.dimensions.width,
        h: "—",
        qty: 1,
        mat: `${item.ledProfileColor} · ${item.ledColorTemperature}`,
        edge: "na wymiar",
      }];
    }

    if (item.type === "corner") {
      return this.cornerCabinet(item, index);
    }

    const parts = this.cabinetShell(item);
    const innerW = item.dimensions.width - 2 * THICKNESS;

    if (item.interiorType === "shelves" && item.shelvesCount > 0) {
      parts.push({
        name: "Półka",
        w: innerW - 1,
        h: item.dimensions.depth - 20,
        qty: item.shelvesCount,
        mat: item.colorBody,
        edge: "1 × szer.",
      });
      parts.push({
        name: "Front",
        w: item.dimensions.height - 4,
        h: item.dimensions.width - 4,
        qty: 1,
        mat: item.colorFront,
        edge: "wokół ABS",
      });
    } else if (item.interiorType === "drawers") {
      const heights = item.drawerHeights.length
        ? item.drawerHeights
        : [Math.floor((item.dimensions.height - (item.drawersCount + 1) * 3) / item.drawersCount)];
      heights.forEach((dh, i) => {
        parts.push(...this.drawerBox(item, i, dh));
      });
    }

    return parts.map(p => ({ ...p }));
  }

  private cabinetShell(item: OrderItem): BOMPart[] {
    const { width: W, height: H, depth: D } = item.dimensions;
    const innerW = W - 2 * THICKNESS;
    const body = item.colorBody;
    const parts: BOMPart[] = [];

    if (item.type === "bottom") {
      parts.push(
        { name: "Wieniec dolny", w: innerW, h: D, qty: 1, mat: body, edge: "1 × szer." },
        { name: "Bok lewy", w: H, h: D, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Bok prawy", w: H, h: D, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Trawers górny", w: innerW, h: 100, qty: 2, mat: body, edge: "1 × szer." },
        { name: "Płyta HDF (plecy)", w: innerW, h: H - THICKNESS, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
        { name: "Nóżka regulowana", w: "—", h: "—", qty: 4, mat: "Komponent / akcesoria", edge: "—" },
      );
    } else if (item.type === "top") {
      parts.push(
        { name: "Bok lewy", w: H, h: D, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Bok prawy", w: H, h: D, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Wieniec dolny", w: innerW, h: D, qty: 1, mat: body, edge: "1 × szer." },
        { name: "Wieniec górny", w: innerW, h: D, qty: 1, mat: body, edge: "1 × szer." },
        { name: "Płyta HDF (plecy)", w: innerW, h: H - 2 * THICKNESS, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
      );
    }

    return parts;
  }

  private cornerCabinet(item: OrderItem, index: number): BOMPart[] {
    const { width: W, height: H } = item.dimensions;
    const dL = item.cornerDepthLeft;
    const dR = item.cornerDepthRight;
    const body = item.colorBody;
    const parts: BOMPart[] = [];

    const innerW = W - 2 * THICKNESS;

    if (item.cornerType === "blind") {
      // Ślepa narożna z nerką
      parts.push(
        { name: "Bok lewy", w: H, h: dL, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Bok prawy", w: H, h: dR, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Wieniec dolny", w: innerW, h: Math.min(dL, dR), qty: 1, mat: body, edge: "1 × szer." },
        { name: "Trawers górny", w: innerW, h: 100, qty: 2, mat: body, edge: "1 × szer." },
        { name: "Płyta HDF (plecy)", w: innerW, h: H - THICKNESS, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
        { name: "Nóżka regulowana", w: "—", h: "—", qty: 4, mat: "Komponent / akcesoria", edge: "—" },
      );

      // Nerkę
      const kidneyLabel = item.kidneyType === "pull-out" ? "Nerkę wysuwaną" : "Nerkę obrotową (karuzela)";
      parts.push({
        name: `System ${kidneyLabel}`,
        w: "—", h: "—", qty: 1, mat: "Komponent / akcesoria", edge: "—"
      });

      // Półki w nerce
      if (item.kidneyShelvesCount > 0) {
        const kidneyW = Math.min(dL, dR) - 40;
        const kidneyH = Math.floor((H - 120) / (item.kidneyShelvesCount + 1));
        parts.push({
          name: "Półka w nerce",
          w: kidneyW, h: kidneyH, qty: item.kidneyShelvesCount, mat: body, edge: "1 × szer."
        });
      }

      // Front
      parts.push({
        name: "Front narożny",
        w: H - 4, h: W - 4, qty: 1, mat: item.colorFront, edge: "wokół ABS"
      });

    } else if (item.cornerType === "diagonal") {
      // Rogowa z frontem pod kątem 45°
      const fw = item.cornerFrontWidth;
      const diagInner = Math.sqrt(2) * (W - 2 * THICKNESS) / 2;

      parts.push(
        { name: "Bok lewy", w: H, h: dL, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Bok prawy", w: H, h: dR, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Wieniec dolny", w: innerW, h: Math.min(dL, dR), qty: 1, mat: body, edge: "1 × szer." },
        { name: "Trawers górny", w: innerW, h: 100, qty: 2, mat: body, edge: "1 × szer." },
        { name: "Płyta HDF (plecy lewa)", w: dL - THICKNESS, h: H - THICKNESS, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
        { name: "Płyta HDF (plecy prawa)", w: dR - THICKNESS, h: H - THICKNESS, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
        { name: "Nóżka regulowana", w: "—", h: "—", qty: 4, mat: "Komponent / akcesoria", edge: "—" },
      );

      // Front pod kątem
      parts.push({
        name: `Front narożny 45° (szer. ${fw}mm)`,
        w: H - 4, h: fw, qty: 1, mat: item.colorFront, edge: "wokół ABS"
      });

      // Wnętrze: półki lub szuflady
      if (item.interiorType === "shelves" && item.shelvesCount > 0) {
        parts.push({
          name: "Półka narożna",
          w: Math.floor(diagInner - 1), h: Math.min(dL, dR) - 20, qty: item.shelvesCount, mat: body, edge: "1 × szer."
        });
      } else if (item.interiorType === "drawers") {
        const heights = item.drawerHeights.length ? item.drawerHeights : [Math.floor(H / item.drawersCount)];
        heights.forEach((dh, i) => {
          parts.push(...this.cornerDrawerBox(item, i, dh, fw));
        });
      }

    } else {
      // Otwarta L-kształtna
      parts.push(
        { name: "Bok lewy", w: H, h: dL, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Bok prawy", w: H, h: dR, qty: 1, mat: body, edge: "2 × wys." },
        { name: "Wieniec dolny", w: innerW, h: Math.min(dL, dR), qty: 1, mat: body, edge: "1 × szer." },
        { name: "Trawers górny", w: innerW, h: 100, qty: 2, mat: body, edge: "1 × szer." },
        { name: "Płyta HDF (plecy lewa)", w: dL - THICKNESS, h: H - THICKNESS, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
        { name: "Płyta HDF (plecy prawa)", w: dR - THICKNESS, h: H - THICKNESS, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
        { name: "Nóżka regulowana", w: "—", h: "—", qty: 4, mat: "Komponent / akcesoria", edge: "—" },
      );

      // Półki
      if (item.shelvesCount > 0) {
        const shelfW = Math.min(dL, dR) - 20;
        parts.push({
          name: "Półka L-kształtna",
          w: shelfW, h: shelfW, qty: item.shelvesCount, mat: body, edge: "1 × szer."
        });
      }
    }

    return parts.map(p => ({ ...p }));
  }

  private cornerDrawerBox(item: OrderItem, drawerIndex: number, drawerHeight: number, frontWidth: number): BOMPart[] {
    const { height: H } = item.dimensions;
    const dL = item.cornerDepthLeft;
    const dR = item.cornerDepthRight;
    const n = drawerIndex + 1;
    const boxDepth = Math.min(dL, dR) - 60;
    const boxHeight = Math.max(60, drawerHeight - 20);
    const parts: BOMPart[] = [];

    if (item.drawerOwnSides) {
      parts.push(
        { name: `Szuflada ${n}: Bok lewy`, w: boxDepth, h: boxHeight, qty: 1, mat: item.colorBody, edge: "1 × wys." },
        { name: `Szuflada ${n}: Bok prawy`, w: boxDepth, h: boxHeight, qty: 1, mat: item.colorBody, edge: "1 × wys." },
      );
    } else {
      parts.push({
        name: `Szuflada ${n}: System prowadnic`,
        w: "—", h: "—", qty: 1, mat: "Komponent / akcesoria", edge: "—",
      });
    }

    parts.push(
      { name: `Szuflada ${n}: Tył`, w: frontWidth - 4, h: boxHeight, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
      { name: `Szuflada ${n}: Dno (HDF)`, w: frontWidth - 4, h: boxDepth - 10, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
      { name: `Szuflada ${n}: Front 45°`, w: drawerHeight - 4, h: frontWidth - 4, qty: 1, mat: item.colorFront, edge: "wokół ABS" },
    );

    return parts;
  }

  private drawerBox(item: OrderItem, drawerIndex: number, drawerHeight: number): BOMPart[] {
    const { width: W, depth: D } = item.dimensions;
    const innerW = W - 2 * THICKNESS;
    const n = drawerIndex + 1;
    const boxDepth = D - 60;
    const boxHeight = Math.max(60, drawerHeight - 20);
    const parts: BOMPart[] = [];

    if (item.drawerOwnSides) {
      parts.push(
        { name: `Szuflada ${n}: Bok lewy`, w: boxDepth, h: boxHeight, qty: 1, mat: item.colorBody, edge: "1 × wys." },
        { name: `Szuflada ${n}: Bok prawy`, w: boxDepth, h: boxHeight, qty: 1, mat: item.colorBody, edge: "1 × wys." },
      );
    } else {
      parts.push({
        name: `Szuflada ${n}: System prowadnic (boki w zestawie)`,
        w: "—", h: "—", qty: 1, mat: "Komponent / akcesoria", edge: "—",
      });
    }

    parts.push(
      { name: `Szuflada ${n}: Tył`, w: innerW - 4, h: boxHeight, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
      { name: `Szuflada ${n}: Dno (HDF)`, w: innerW - 4, h: boxDepth - 10, qty: 1, mat: "Płyta HDF 3 mm", edge: "brak" },
      { name: `Szuflada ${n}: Front`, w: drawerHeight - 4, h: W - 4, qty: 1, mat: item.colorFront, edge: "wokół ABS" },
    );

    return parts;
  }

  toHtmlRows(item: OrderItem, index: number): string {
    const parts = this.calculate(item, index);
    return parts.map(p => `
      <tr class="hover:bg-slate-800/30">
        <td class="p-2 font-medium text-slate-200">${p.name}</td>
        <td class="p-2 text-right font-mono font-bold text-blue-400">${p.w}</td>
        <td class="p-2 text-right font-mono text-slate-500">${p.h}</td>
        <td class="p-2 text-center">${p.qty} szt.</td>
        <td class="p-2 text-slate-400 max-w-[200px] truncate" title="${p.mat}">${p.mat}</td>
        <td class="p-2 text-center"><span class="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500">${p.edge}</span></td>
      </tr>
    `).join("");
  }
}
