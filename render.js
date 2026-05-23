// render.js
function getLedPreviewGlow(temp) {
  switch (temp) {
    case "3000K":
      return {
        fill: "#fbbf24",
        glow: "rgba(251, 191, 36, 0.92)",
        shadow: "0 0 24px rgba(245, 158, 11, 0.85)",
        label: "Ciepła",
      };
    case "6000K":
      return {
        fill: "#7dd3fc",
        glow: "rgba(125, 211, 252, 0.92)",
        shadow: "0 0 24px rgba(56, 189, 248, 0.85)",
        label: "Zimna",
      };
    default:
      return {
        fill: "#fef08a",
        glow: "rgba(254, 240, 138, 0.92)",
        shadow: "0 0 22px rgba(250, 204, 21, 0.7)",
        label: "Neutralna",
      };
  }
}

function generateCabinetFlexTemplate(item) {
  const w = item.dimensions.width || 600;
  const h = item.dimensions.height || 720;
  const d = item.dimensions.depth || 510;

  let graphicHtml = "";
  let specsHtml = "";

  if (item.type === "countertop") {
    const cColor = item.countertopColor || "Dąb Werona K002";
    const cThick = item.countertopThickness || 38;

    const blatPreviewH = Math.round(48 + cThick * 0.85);
    graphicHtml = `
      <div class="w-full bg-amber-800 border-2 border-amber-600 rounded-xl p-6 flex flex-col items-center justify-center text-amber-100 shadow-inner transition-all duration-200" style="min-height: ${blatPreviewH}px;">
        <span class="font-bold text-sm tracking-wide">🪵 BLAT KUCHENNY</span>
        <span class="font-mono text-xs mt-2 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/40">Grubość: ${cThick} mm</span>
        <span class="text-[10px] text-amber-200/80 mt-2">${cColor}</span>
      </div>
    `;

    specsHtml = `
      <div class="flex justify-between items-center border-b border-slate-800 pb-1.5">
        <span class="text-slate-400">Wymiary gabarytowe:</span>
        <span class="font-mono font-bold text-blue-400">${w} × ${d} × ${cThick} mm</span>
      </div>
      <div class="flex justify-between items-center pt-0.5">
        <span class="text-slate-400">Dekor blatu:</span>
        <span class="text-slate-200 font-semibold text-right">${cColor}</span>
      </div>
    `;
  } else if (item.type === "led") {
    const lType = item.ledType === "recessed" ? "Wpuszczany" : "Nawierzchniowy";
    const lTemp = item.ledColorTemperature || "4000K";
    const lProf = item.ledProfileColor || "Anodowane Srebrne";

    const glow = getLedPreviewGlow(lTemp);
    graphicHtml = `
      <div class="w-full h-20 bg-slate-800 border-2 border-slate-600 rounded-xl flex flex-col items-center justify-center relative overflow-hidden p-2 shadow-lg gap-1">
        <div class="absolute inset-x-4 inset-y-3 rounded opacity-95 animate-pulse" style="background: ${glow.glow}; box-shadow: ${glow.shadow};"></div>
        <span class="relative z-10 font-mono text-xs font-bold text-slate-950 bg-white/90 px-2 py-0.5 rounded shadow-sm">LED L = ${w} mm</span>
        <span class="relative z-10 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/20" style="color: #0f172a; background: ${glow.fill};">${glow.label} · ${lTemp}</span>
      </div>
    `;

    specsHtml = `
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
        <span class="text-cyan-400 font-bold text-right">${lTemp}</span>
      </div>
      <div class="flex justify-between items-center pt-0.5">
        <span class="text-slate-400">Kolor profilu:</span>
        <span class="text-slate-300 italic text-right">${lProf}</span>
      </div>
    `;
  } else {
    let interiorHtml = "";
    // Support for 'column' type
    if (item.type === "column") {
      const slots = Array.isArray(item.columnSlots) ? item.columnSlots : [];
      interiorHtml += `<div class="flex flex-col h-full w-full min-h-0 justify-start p-1 bg-slate-900/90 rounded-lg border border-slate-700/80 gap-1.5">`;
      slots.forEach((sl, i) => {
        const kind = sl.kind || "shelf";
        const label =
          kind === "shelf"
            ? `PÓŁKA ${i + 1}`
            : kind === "oven"
              ? "PIEKARNIK"
              : "MIKROFALA";
        const hVal =
          sl.height ||
          Math.floor(
            (item.dimensions.height || 720) / Math.max(1, slots.length),
          );
        interiorHtml += `
          <div class="flex items-center justify-center rounded-lg text-center p-2" style="flex: ${hVal} 1 0%; min-height:36px; border:1px solid rgba(96,165,250,0.08);">
            <div class="w-full">
              <div class="text-[9px] font-bold uppercase text-slate-300">${label}</div>
              <div class="text-xs font-mono font-bold text-blue-400">${hVal} mm</div>
            </div>
          </div>
        `;
      });
      interiorHtml += `</div>`;
    } else if (item.interiorType === "shelves") {
      const count = Number(item.shelvesCount) || 0;
      const sections = count + 1;
      const totalPlatesThickness = 36 + count * 18;
      const clearSpace = Math.max(
        0,
        Math.floor((h - totalPlatesThickness) / sections),
      );

      interiorHtml += `<div class="flex flex-col h-full w-full min-h-0 justify-between p-2 bg-slate-900/90 rounded-lg border border-slate-700/80 gap-1.5">`;
      for (let i = 0; i < sections; i++) {
        interiorHtml += `
          <div class="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-1">
            <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">PRZEŚWIT</span>
            <span class="text-xs font-mono font-bold text-blue-400">${clearSpace} mm</span>
          </div>
        `;
        if (i < sections - 1) {
          interiorHtml += `<div class="h-[2px] bg-blue-500/20 w-full border-b border-dashed border-blue-400/40"></div>`;
        }
      }
      interiorHtml += `</div>`;
    } else {
      interiorHtml += `<div class="flex flex-col h-full w-full min-h-0 gap-[2px] p-1 bg-slate-900/50 rounded-lg">`;
      item.drawerHeights.forEach((dh, idx) => {
        interiorHtml += `
          <div class="border border-blue-500/40 bg-blue-950/40 rounded-lg flex flex-col items-center justify-center min-h-0 overflow-hidden px-2" style="flex: ${dh} 1 0%">
            <span class="text-[9px] text-blue-300/90 font-bold uppercase tracking-wider">SZUFLADA ${idx + 1}</span>
            <span class="text-xs font-mono font-bold text-white mt-0.5">${dh} mm</span>
          </div>
        `;
      });
      interiorHtml += `</div>`;
    }

    graphicHtml = `
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
          <div class="flex-1 flex flex-col min-h-0 p-2">
            ${interiorHtml}
          </div>
        </div>
      </div>
    `;

    specsHtml = `
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
    `;
  }

  return `
    <div class="w-full flex flex-col space-y-5">
      <div class="w-full px-2">
        ${graphicHtml}
      </div>
      <div class="w-full bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2 text-left text-xs shadow-inner">
        ${specsHtml}
      </div>
    </div>
  `;
}

function generateCabinetBOMRows(item, idx) {
  const parts =
    typeof calculateItemBOM === "function" ? calculateItemBOM(item, idx) : [];

  return parts
    .map(
      (p) => `
    <tr class="hover:bg-slate-800/30">
      <td class="p-2 font-medium text-slate-200">${p.name}</td>
      <td class="p-2 text-right font-mono font-bold text-blue-400">${p.w}</td>
      <td class="p-2 text-right font-mono text-slate-500">${p.h}</td>
      <td class="p-2 text-center">${p.qty} szt.</td>
      <td class="p-2 text-slate-400 max-w-[200px] truncate" title="${p.mat}">${p.mat}</td>
      <td class="p-2 text-center"><span class="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500">${p.edge}</span></td>
    </tr>
  `,
    )
    .join("");
}

function updateMainUI() {
  console.log(
    "[makazu] updateMainUI called - currentOrder.length:",
    currentOrder.length,
  );
  const startBtn = document.getElementById("btn-start-wizard");
  const bSection = document.getElementById("main-order-layout");
  const heroSection = document.getElementById("hero-section");
  const infoBlock = document.getElementById("bom-contractor-info");
  const tablesWrapper = document.getElementById("tables-wrapper");

  if (infoBlock) {
    if (contractorProfile.name) {
      infoBlock.innerHTML = `<span class="font-bold text-white">👷 Wykonawca: ${contractorProfile.name}</span> | NIP: ${contractorProfile.nip || "brak"}`;
    } else {
      infoBlock.innerHTML = `<span class="text-amber-500 italic">⚠️ Brak danych wykonawcy.</span>`;
    }
  }

  if (currentOrder.length === 0) {
    if (startBtn) startBtn.innerText = "Rozpocznij konfigurację mebli";
    if (bSection) bSection.classList.add("hidden");
    if (heroSection) heroSection.classList.remove("hero-compact");
    return;
  }

  if (startBtn) startBtn.innerText = "+ Dodaj kolejny element";
  if (bSection) bSection.classList.remove("hidden");
  if (heroSection) heroSection.classList.add("hero-compact");

  const cabCountEl = document.getElementById("summary-cabinet-count");
  if (cabCountEl)
    cabCountEl.innerText = `Łączna ilość pozycji: ${currentOrder.length}`;

  if (typeof renderOrderVisualWall === "function") renderOrderVisualWall();

  if (tablesWrapper) {
    tablesWrapper.innerHTML = "";
    let cabinetItems = [];
    let linearItems = [];

    currentOrder.forEach((item, idx) => {
      if (item.type === "bottom" || item.type === "top" || item.type === "column") {
        cabinetItems.push({ item, idx });
      } else {
        linearItems.push({ item, idx });
      }
    });

    cabinetItems.forEach(({ item, idx }) => {
      const cabinetBox = document.createElement("div");
      cabinetBox.className =
        "bg-slate-900/40 p-4 rounded-xl border border-slate-700 space-y-2";
      let typeLabel = "";
      let interiorLabel = "";
      
      if (item.type === "column") {
        typeLabel = "SŁUPEK PIONOWY";
        const slotCount = (item.columnSlots || []).length;
        interiorLabel = `${slotCount} slot(y)`;
      } else {
        typeLabel =
          item.type === "bottom" ? "SZAFKA DOLNA" : "SZAFKA GÓRNA WISZĄCA";
        interiorLabel =
          item.interiorType === "shelves"
            ? `Półki (${item.shelvesCount} szt.)`
            : `Szuflady (${item.drawersCount} szt.)`;
      }

      cabinetBox.innerHTML = `
        <div class="flex justify-between items-center bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-100">
          <span>POZYCJA #${idx + 1}: ${typeLabel} (${item.dimensions.width} x ${item.dimensions.height} x ${item.dimensions.depth}mm)</span>
          <span class="text-blue-400">${interiorLabel}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-700 font-semibold text-slate-500 uppercase tracking-wider">
                <th class="p-2">Element składowy</th>
                <th class="p-2 text-right">Długość (mm)</th>
                <th class="p-2 text-right">Szerokość (mm)</th>
                <th class="p-2 text-center">Sztuki</th>
                <th class="p-2">Materiał / Kolor</th>
                <th class="p-2 text-center">Oklejanie</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              ${generateCabinetBOMRows(item, idx)}
            </tbody>
          </table>
        </div>
      `;
      tablesWrapper.appendChild(cabinetBox);
    });

    if (linearItems.length > 0) {
      const linearBox = document.createElement("div");
      linearBox.className =
        "bg-amber-950/10 p-4 rounded-xl border border-amber-900/30 space-y-2 mt-6";

      let rowsHtml = "";
      linearItems.forEach(({ item, idx }) => {
        if (item.type === "countertop") {
          rowsHtml += `
            <tr class="border-b border-slate-800">
              <td class="p-3 font-bold text-amber-400">🪵 BLAT (#${idx + 1})</td>
              <td class="p-3 font-medium">Blat roboczy kuchenny, grubość ${item.countertopThickness}mm</td>
              <td class="p-3 text-right font-mono font-bold text-blue-400">${item.dimensions.width}</td>
              <td class="p-3 text-right font-mono text-slate-400">${item.dimensions.depth}</td>
              <td class="p-3 text-center font-bold">1 szt.</td>
              <td class="p-3 text-slate-200 font-medium">${item.countertopColor}</td>
              <td class="p-3 text-center"><span class="bg-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-semibold">ABS 2xDł+1xSz</span></td>
            </tr>
          `;
        } else if (item.type === "led") {
          const typeStr =
            item.ledType === "recessed" ? "Wpuszczany" : "Nawierzchniowy";
          rowsHtml += `
            <tr class="border-b border-slate-800">
              <td class="p-3 font-bold text-cyan-400">💡 LED (#${idx + 1})</td>
              <td class="p-3 font-medium">Profil aluminiowy ${typeStr} (${item.ledColorTemperature})</td>
              <td class="p-3 text-right font-mono font-bold text-blue-400">${item.dimensions.width}</td>
              <td class="p-3 text-right font-mono text-slate-500">-</td>
              <td class="p-3 text-center font-bold">1 szt.</td>
              <td class="p-3 text-slate-300">${item.ledProfileColor} + Klosz Mleczny</td>
              <td class="p-3 text-center"><span class="bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono text-[10px]">brak</span></td>
            </tr>
          `;
        }
      });

      linearBox.innerHTML = `
        <div class="bg-amber-950/50 text-amber-300 px-3 py-2 rounded-lg text-xs font-black tracking-wide uppercase">
          📦 Zestawienie dodatków: Blaty kuchenne i profile oświetleniowe LED
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-700 font-bold text-slate-500 uppercase tracking-wider">
                <th class="p-3">Typ</th>
                <th class="p-3">Opis techniczny</th>
                <th class="p-3 text-right">Długość (mm)</th>
                <th class="p-3 text-right">Głębokość (mm)</th>
                <th class="p-3 text-center">Ilość</th>
                <th class="p-3">Wykończenie / Kolor</th>
                <th class="p-3 text-center">Obróbka</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
      tablesWrapper.appendChild(linearBox);
    }
  }
}
