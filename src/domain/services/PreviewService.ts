import { OrderItem } from "../entities/OrderItem.js";

interface GlowColors {
  fill: string;
  glow: string;
  shadow: string;
  label: string;
}

export class PreviewService {
  private getLedGlow(temp: string): GlowColors {
    switch (temp) {
      case "3000K":
        return { fill: "#fbbf24", glow: "rgba(251, 191, 36, 0.92)", shadow: "0 0 24px rgba(245, 158, 11, 0.85)", label: "Ciepła" };
      case "6000K":
        return { fill: "#7dd3fc", glow: "rgba(125, 211, 252, 0.92)", shadow: "0 0 24px rgba(56, 189, 248, 0.85)", label: "Zimna" };
      default:
        return { fill: "#fef08a", glow: "rgba(254, 240, 138, 0.92)", shadow: "0 0 22px rgba(250, 204, 21, 0.7)", label: "Neutralna" };
    }
  }

  render(item: OrderItem, compact = false): string {
    const { width: w, height: h, depth: d } = item.dimensions;

    if (item.type === "countertop") {
      return this.renderCountertop(item, w, d, compact);
    }
    if (item.type === "led") {
      return this.renderLed(item, w, compact);
    }
    if (item.type === "corner") {
      return this.renderCorner(item, w, h, d, compact);
    }

    const interiorHtml = this.renderInterior(item, compact);
    return this.renderCabinet(item, w, h, d, interiorHtml, compact);
  }

  private renderCountertop(item: OrderItem, w: number, d: number, compact: boolean): string {
    const previewH = compact ? Math.round(32 + item.countertopThickness * 0.65) : Math.round(48 + item.countertopThickness * 0.85);
    const pad = compact ? "px-3" : "p-6";
    const fontSize = compact ? "text-xs" : "text-sm";

    const graphic = `
      <div class="w-full bg-amber-800 border-2 border-amber-600 rounded-xl ${pad} flex flex-col items-center justify-center text-amber-100 shadow-inner transition-all duration-200" style="min-height: ${previewH}px;">
        <span class="font-bold ${fontSize} tracking-wide">🪵 BLAT KUCHENNY</span>
        <span class="font-mono text-[10px] mt-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/40">Grubość: ${item.countertopThickness} mm</span>
        ${compact ? "" : `<span class="text-[10px] text-amber-200/80 mt-2">${item.countertopColor}</span>`}
      </div>
    `;

    if (compact) return `<div class="order-tile-preview-host w-full">${graphic}</div>`;

    return `
      <div class="w-full flex flex-col space-y-5">
        <div class="w-full px-2">${graphic}</div>
        <div class="w-full bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2 text-left text-xs shadow-inner">
          <div class="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span class="text-slate-400">Wymiary gabarytowe:</span>
            <span class="font-mono font-bold text-blue-400">${w} × ${d} × ${item.countertopThickness} mm</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Dekor blatu:</span>
            <span class="text-slate-200 font-semibold text-right">${item.countertopColor}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderLed(item: OrderItem, w: number, compact: boolean): string {
    const lType = item.ledType === "recessed" ? "Wpuszczany" : "Nawierzchniowy";
    const glow = this.getLedGlow(item.ledColorTemperature);
    const minH = compact ? "min-h-[3.5rem]" : "h-20";

    const graphic = `
      <div class="w-full ${minH} bg-slate-800 border-2 border-slate-600 rounded-xl flex flex-col items-center justify-center relative overflow-hidden p-2 shadow-lg gap-1">
        <div class="absolute inset-x-4 inset-y-3 rounded opacity-95 animate-pulse" style="background: ${glow.glow}; box-shadow: ${glow.shadow};"></div>
        <span class="relative z-10 font-mono ${compact ? "text-[10px]" : "text-xs"} font-bold text-slate-950 bg-white/90 px-2 py-0.5 rounded shadow-sm">LED L = ${w} mm</span>
        <span class="relative z-10 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/20" style="color: #0f172a; background: ${glow.fill};">${glow.label} · ${item.ledColorTemperature}</span>
      </div>
    `;

    if (compact) return graphic;

    return `
      <div class="w-full flex flex-col space-y-5">
        <div class="w-full px-2">${graphic}</div>
        <div class="w-full bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2 text-left text-xs shadow-inner">
          <div class="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span class="text-slate-400">Długość odcinka:</span>
            <span class="font-mono font-bold text-blue-400">${w} mm</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Typ montażu profilu:</span>
            <span class="text-slate-200 font-semibold text-right">${lType}</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Temperatura barwowa:</span>
            <span class="text-cyan-400 font-bold text-right">${item.ledColorTemperature}</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Kolor profilu:</span>
            <span class="text-slate-300 italic text-right">${item.ledProfileColor}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderCorner(item: OrderItem, w: number, h: number, d: number, compact: boolean): string {
    const cornerLabel = item.cornerType === "blind" ? "NAROŻNA ŚLEPA" : item.cornerType === "diagonal" ? "NAROŻNA 45°" : "NAROŻNA OTWARTA";
    const kidneyLabel = item.kidneyType === "pull-out" ? "wysuwana" : "obrotowa";

    const interiorHtml = this.renderCornerInterior(item, compact);

    if (compact) {
      const baseW = Math.min(240, Math.max(160, Math.round(220 * (w / 900))));
      const graphic = `
        <div class="relative shrink-0 mx-auto box-border pt-4 pl-5 pr-1 pb-1" style="width: ${baseW}px; aspect-ratio: ${w} / ${h};">
          <div class="absolute top-0 left-1/2 -translate-x-1/2 z-10">
            <span class="bg-slate-950 text-slate-200 border border-slate-600 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-md">SZER: ${w}</span>
          </div>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <span class="bg-slate-950 text-slate-200 border border-slate-600 px-1 py-0.5 rounded text-[8px] font-mono font-bold whitespace-nowrap shadow-md" style="writing-mode: vertical-rl; transform: rotate(180deg);">WYS: ${h}</span>
          </div>
          <div class="absolute right-0 bottom-0 z-10">
            <span class="bg-slate-950 text-slate-400 border border-slate-700 px-1 py-0.5 rounded text-[8px] font-mono shadow-md">Gł: ${d}</span>
          </div>
          <div class="absolute inset-0 bg-slate-900/40 border-2 border-slate-700 rounded-xl shadow-md flex flex-col min-h-0 overflow-hidden">
            <div class="flex-1 flex flex-col min-h-0 p-1.5">${interiorHtml}</div>
          </div>
        </div>
      `;
      return `<div class="order-tile-preview-host w-full">${graphic}</div>`;
    }

    const graphic = `
      <div class="w-full max-w-[280px] mx-auto relative" style="aspect-ratio: ${w} / ${h};">
        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <span class="bg-slate-950 text-slate-200 border border-slate-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-md">SZER: ${w} mm</span>
        </div>
        <div class="absolute -left-3 top-1/2 transform -translate-y-1/2 -rotate-90 origin-center z-10">
          <span class="bg-slate-950 text-slate-200 border border-slate-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-md">WYS: ${h} mm</span>
        </div>
        <div class="absolute -right-2 -bottom-2 z-10">
          <span class="bg-slate-950 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono shadow-md">Gł: ${d} mm</span>
        </div>
        <div class="absolute inset-0 bg-slate-900/40 border-2 border-slate-700 rounded-2xl shadow-md flex flex-col min-h-0 overflow-hidden">
          <div class="flex-1 flex flex-col min-h-0 p-2">${interiorHtml}</div>
        </div>
      </div>
    `;

    return `
      <div class="w-full flex flex-col space-y-5">
        <div class="w-full px-2">${graphic}</div>
        <div class="w-full bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2 text-left text-xs shadow-inner">
          <div class="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span class="text-slate-400">Typ narożnej:</span>
            <span class="font-mono font-bold text-blue-400">${cornerLabel}</span>
          </div>
          ${item.cornerType === "blind" ? `<div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Nerkę:</span>
            <span class="text-slate-200 font-semibold text-right">${kidneyLabel} · ${item.kidneyShelvesCount} półki</span>
          </div>` : ""}
          ${item.cornerType === "diagonal" ? `<div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Front 45°:</span>
            <span class="text-slate-200 font-semibold text-right">${item.cornerFrontWidth} mm</span>
          </div>` : ""}
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Gabaryty:</span>
            <span class="font-mono font-bold text-blue-400">${w} × ${h} × ${d} mm</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Głębokość boków:</span>
            <span class="text-slate-200 font-semibold text-right">L: ${item.cornerDepthLeft} / P: ${item.cornerDepthRight} mm</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Kolor korpusu:</span>
            <span class="text-slate-200 font-semibold text-right">${item.colorBody}</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Kolor frontu:</span>
            <span class="text-slate-200 font-semibold text-right">${item.colorFront}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderCornerInterior(item: OrderItem, compact: boolean): string {
    const h = item.dimensions.height;

    if (item.cornerType === "blind") {
      // Nerkę visualization
      const shelvesCount = item.kidneyShelvesCount;
      const sections = shelvesCount + 1;
      const clearH = Math.max(0, Math.floor((h - 120) / sections));

      let html = `<div class="flex flex-col h-full w-full min-h-0 justify-between ${compact ? "p-1" : "p-1.5"} bg-slate-900/90 rounded-lg border border-amber-700/40 gap-1">`;
      html += `<div class="text-center"><span class="text-[8px] text-amber-400 font-bold uppercase">Nerka ${item.kidneyType === "pull-out" ? "wysuwana" : "obrotowa"}</span></div>`;
      for (let i = 0; i < shelvesCount; i++) {
        html += `<div class="h-[2px] bg-amber-500/30 w-full"></div>`;
        html += `<div class="flex-1 min-h-0 flex items-center justify-center"><span class="text-[8px] text-slate-500">${clearH}mm</span></div>`;
      }
      html += `</div>`;
      return html;
    }

    if (item.cornerType === "diagonal") {
      // Diagonal front visualization
      if (item.interiorType === "shelves") {
        const count = item.shelvesCount || 0;
        const sections = count + 1;
        const totalPlates = 36 + count * 18;
        const clearSpace = Math.max(0, Math.floor((h - totalPlates) / sections));

        let html = `<div class="flex flex-col h-full w-full min-h-0 justify-between ${compact ? "p-1" : "p-1.5"} bg-slate-900/90 rounded-lg border border-slate-700/80 gap-1.5">`;
        for (let i = 0; i < sections; i++) {
          html += `<div class="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-1">
            <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">PRZEŚWIT</span>
            <span class="text-xs font-mono font-bold text-blue-400">${clearSpace} mm</span>
          </div>`;
          if (i < sections - 1) {
            html += `<div class="h-[2px] bg-blue-500/20 w-full border-b border-dashed border-blue-400/40"></div>`;
          }
        }
        html += `</div>`;
        return html;
      } else {
        // Drawers
        let html = `<div class="flex flex-col h-full w-full min-h-0 gap-[2px] ${compact ? "p-1" : "p-1"} bg-slate-900/50 rounded-lg">`;
        item.drawerHeights.forEach((dh, idx) => {
          html += `<div class="border border-blue-500/40 bg-blue-950/40 rounded-lg flex flex-col items-center justify-center min-h-0 overflow-hidden px-2" style="flex: ${dh} 1 0%">
            <span class="text-[9px] text-blue-300/90 font-bold uppercase tracking-wider">SZUFLADA ${idx + 1}</span>
            <span class="text-xs font-mono font-bold text-white mt-0.5">${dh} mm</span>
          </div>`;
        });
        html += `</div>`;
        return html;
      }
    }

    // Open L-shape
    const count = item.shelvesCount || 0;
    const sections = count + 1;
    const totalPlates = 36 + count * 18;
    const clearSpace = Math.max(0, Math.floor((h - totalPlates) / sections));

    let html = `<div class="flex flex-col h-full w-full min-h-0 justify-between ${compact ? "p-1" : "p-1.5"} bg-slate-900/90 rounded-lg border border-green-700/40 gap-1.5">`;
    html += `<div class="text-center"><span class="text-[8px] text-green-400 font-bold uppercase">OTWARTA L</span></div>`;
    for (let i = 0; i < sections; i++) {
      html += `<div class="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-1">
        <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">PRZEŚWIT</span>
        <span class="text-xs font-mono font-bold text-green-400">${clearSpace} mm</span>
      </div>`;
      if (i < sections - 1) {
        html += `<div class="h-[2px] bg-green-500/20 w-full border-b border-dashed border-green-400/40"></div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  private renderInterior(item: OrderItem, compact: boolean): string {
    const h = item.dimensions.height;

    if (item.interiorType === "shelves") {
      const count = item.shelvesCount || 0;
      const sections = count + 1;
      const totalPlates = 36 + count * 18;
      const clearSpace = Math.max(0, Math.floor((h - totalPlates) / sections));

      let html = `<div class="flex flex-col h-full w-full min-h-0 justify-between ${compact ? "p-1" : "p-2"} bg-slate-900/90 rounded-lg border border-slate-700/80 gap-1.5">`;
      for (let i = 0; i < sections; i++) {
        html += `<div class="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-1">
          <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">PRZEŚWIT</span>
          <span class="text-xs font-mono font-bold text-blue-400">${clearSpace} mm</span>
        </div>`;
        if (i < sections - 1) {
          html += `<div class="h-[2px] bg-blue-500/20 w-full border-b border-dashed border-blue-400/40"></div>`;
        }
      }
      html += `</div>`;
      return html;
    }

    let html = `<div class="flex flex-col h-full w-full min-h-0 gap-[2px] ${compact ? "p-1" : "p-1"} bg-slate-900/50 rounded-lg">`;
    item.drawerHeights.forEach((dh, idx) => {
      html += `<div class="border border-blue-500/40 bg-blue-950/40 rounded-lg flex flex-col items-center justify-center min-h-0 overflow-hidden px-2" style="flex: ${dh} 1 0%">
        <span class="text-[9px] text-blue-300/90 font-bold uppercase tracking-wider">SZUFLADA ${idx + 1}</span>
        <span class="text-xs font-mono font-bold text-white mt-0.5">${dh} mm</span>
      </div>`;
    });
    html += `</div>`;
    return html;
  }

  private renderCabinet(item: OrderItem, w: number, h: number, d: number, interiorHtml: string, compact: boolean): string {
    if (compact) {
      const baseW = Math.min(240, Math.max(160, Math.round(220 * (w / 600))));
      const graphic = `
        <div class="relative shrink-0 mx-auto box-border pt-4 pl-5 pr-1 pb-1" style="width: ${baseW}px; aspect-ratio: ${w} / ${h};">
          <div class="absolute top-0 left-1/2 -translate-x-1/2 z-10">
            <span class="bg-slate-950 text-slate-200 border border-slate-600 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-md">SZER: ${w}</span>
          </div>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <span class="bg-slate-950 text-slate-200 border border-slate-600 px-1 py-0.5 rounded text-[8px] font-mono font-bold whitespace-nowrap shadow-md" style="writing-mode: vertical-rl; transform: rotate(180deg);">WYS: ${h}</span>
          </div>
          <div class="absolute right-0 bottom-0 z-10">
            <span class="bg-slate-950 text-slate-400 border border-slate-700 px-1 py-0.5 rounded text-[8px] font-mono shadow-md">Gł: ${d}</span>
          </div>
          <div class="absolute inset-0 bg-slate-900/40 border-2 border-slate-700 rounded-xl shadow-md flex flex-col min-h-0 overflow-hidden">
            <div class="flex-1 flex flex-col min-h-0 ${interiorHtml.includes("PRZEŚWIT") || interiorHtml.includes("SZUFLADA") ? "p-1.5" : "p-0"}">
              ${interiorHtml}
            </div>
          </div>
        </div>
      `;
      return `<div class="order-tile-preview-host w-full">${graphic}</div>`;
    }

    const graphic = `
      <div class="w-full max-w-[280px] mx-auto relative" style="aspect-ratio: ${w} / ${h};">
        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <span class="bg-slate-950 text-slate-200 border border-slate-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-md">SZER: ${w} mm</span>
        </div>
        <div class="absolute -left-3 top-1/2 transform -translate-y-1/2 -rotate-90 origin-center z-10">
          <span class="bg-slate-950 text-slate-200 border border-slate-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-md">WYS: ${h} mm</span>
        </div>
        <div class="absolute -right-2 -bottom-2 z-10">
          <span class="bg-slate-950 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono shadow-md">Gł: ${d} mm</span>
        </div>
        <div class="absolute inset-0 bg-slate-900/40 border-2 border-slate-700 rounded-2xl shadow-md flex flex-col min-h-0 overflow-hidden">
          <div class="flex-1 flex flex-col min-h-0 p-2">${interiorHtml}</div>
        </div>
      </div>
    `;

    return `
      <div class="w-full flex flex-col space-y-5">
        <div class="w-full px-2">${graphic}</div>
        <div class="w-full bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2 text-left text-xs shadow-inner">
          <div class="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span class="text-slate-400">Gabaryty zewnętrzne:</span>
            <span class="font-mono font-bold text-blue-400">${w} × ${h} × ${d} mm</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Kolor korpusu:</span>
            <span class="text-slate-200 font-semibold text-right">${item.colorBody}</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Kolor frontu:</span>
            <span class="text-slate-200 font-semibold text-right">${item.colorFront}</span>
          </div>
          <div class="flex justify-between items-center pt-0.5">
            <span class="text-slate-400">Typ uchwytu:</span>
            <span class="text-slate-300 italic text-right">${item.handleType}</span>
          </div>
        </div>
      </div>
    `;
  }
}
