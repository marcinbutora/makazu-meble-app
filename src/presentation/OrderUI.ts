import { OrderService } from "../application/OrderService.js";
import { Renderer } from "./Renderer.js";
import { PdfService } from "../domain/services/PdfService.js";

export class OrderUI {
  private currentTab: "table" | "cabinets" = "table";

  constructor(
    private orderService: OrderService,
    private renderer: Renderer,
    private onEditItem: (index: number) => void,
    private pdfService: PdfService,
  ) {
    this.bindEvents();
  }

  refresh(): void {
    this.renderer.setText("summary-cabinet-count", `Łączna ilość pozycji: ${this.orderService.getItems().length}`);

    const hero = this.renderer.getEl("hero-section");
    const layout = this.renderer.getEl("main-order-layout");
    const startBtn = this.renderer.getEl("btn-start-wizard");
    const info = this.renderer.getEl("bom-contractor-info");
    const c = this.orderService.getContractor();

    if (info) {
      info.innerHTML = c.isComplete
        ? `<span class="font-bold text-white">👷 Wykonawca: ${c.name}</span> | NIP: ${c.nip || "brak"}`
        : `<span class="text-amber-500 italic">⚠️ Brak danych wykonawcy.</span>`;
    }

    if (this.orderService.getItems().length === 0) {
      if (startBtn) startBtn.innerText = "Rozpocznij konfigurację mebli";
      if (layout) layout.classList.add("hidden");
      if (hero) hero.classList.remove("hero-compact");
      return;
    }

    if (startBtn) startBtn.innerText = "+ Dodaj kolejny element";
    if (layout) layout.classList.remove("hidden");
    if (hero) hero.classList.add("hero-compact");

    this.renderTable();
    if (this.currentTab === "cabinets") this.renderVisualWall();
  }

  setTab(tab: "table" | "cabinets"): void {
    this.currentTab = tab;
    const isTable = tab === "table";
    this.renderer.toggle("order-panel-table", isTable);
    this.renderer.toggle("order-panel-cabinets", !isTable);
    this.renderer.toggleClass("order-tab-btn-table", "order-tab-btn--active", isTable);
    this.renderer.toggleClass("order-tab-btn-cabinets", "order-tab-btn--active", !isTable);

    if (!isTable) this.renderVisualWall();
  }

  // ── table view ───────────────────────────────────────

  private renderTable(): void {
    const wrapper = this.renderer.getEl("tables-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = "";

    const cabinetItems = this.orderService.getCabinetItems();
    const linearItems = this.orderService.getLinearItems();

    cabinetItems.forEach(({ item, idx }) => {
      const box = document.createElement("div");
      box.className = "bg-slate-900/40 p-4 rounded-xl border border-slate-700 space-y-2";
      const typeLabel = item.type === "bottom" ? "SZAFKA DOLNA"
        : item.type === "corner" ? "SZAFKA NAROŻNA"
        : "SZAFKA GÓRNA WISZĄCA";
      const interiorLabel = item.interiorType === "shelves"
        ? `Półki (${item.shelvesCount} szt.)`
        : `Szuflady (${item.drawersCount} szt.)`;

      box.innerHTML = `
        <div class="flex justify-between items-center bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-100">
          <span>POZYCJA #${idx + 1}: ${typeLabel} (Szerokość: ${item.dimensions.width} mm, Wysokość: ${item.dimensions.height} mm, Głębokość: ${item.dimensions.depth} mm)</span>
          <span class="text-blue-400">${interiorLabel}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-700 font-semibold text-slate-500 uppercase tracking-wider">
                <th class="p-2">Element składowy</th>
                <th class="p-2 text-right">Wysokość (mm)</th>
                <th class="p-2 text-right">Szerokość (mm)</th>
                <th class="p-2 text-center">Sztuki</th>
                <th class="p-2">Materiał / Kolor</th>
                <th class="p-2 text-center">Oklej dł.</th>
                <th class="p-2 text-center">Oklej krót.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              ${this.orderService.getBomRows(item, idx)}
            </tbody>
          </table>
        </div>
      `;
      wrapper.appendChild(box);
    });

    if (linearItems.length > 0) {
      const box = document.createElement("div");
      box.className = "bg-amber-950/10 p-4 rounded-xl border border-amber-900/30 space-y-2 mt-6";
      let rows = "";
      linearItems.forEach(({ item, idx }) => {
        if (item.type === "countertop") {
          rows += `
            <tr class="border-b border-slate-800">
              <td class="p-3 font-bold text-amber-400">🪵 BLAT (#${idx + 1})</td>
              <td class="p-3 font-medium">Blat roboczy kuchenny, grubość ${item.countertopThickness}mm</td>
              <td class="p-3 text-right font-mono font-bold text-blue-400">${item.dimensions.width}</td>
              <td class="p-3 text-right font-mono text-slate-400">${item.dimensions.depth}</td>
              <td class="p-3 text-center font-bold">1 szt.</td>
              <td class="p-3 text-slate-200 font-medium">${item.countertopColor}</td>
              <td class="p-3 text-center"><span class="bg-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-semibold">ABS 2xDł+1xSz</span></td>
            </tr>`;
        } else {
          const typeStr = item.ledType === "recessed" ? "Wpuszczany" : "Nawierzchniowy";
          rows += `
            <tr class="border-b border-slate-800">
              <td class="p-3 font-bold text-cyan-400">💡 LED (#${idx + 1})</td>
              <td class="p-3 font-medium">Profil aluminiowy ${typeStr} (${item.ledColorTemperature})</td>
              <td class="p-3 text-right font-mono font-bold text-blue-400">${item.dimensions.width}</td>
              <td class="p-3 text-right font-mono text-slate-500">-</td>
              <td class="p-3 text-center font-bold">1 szt.</td>
              <td class="p-3 text-slate-300">${item.ledProfileColor} + Klosz Mleczny</td>
              <td class="p-3 text-center"><span class="bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono text-[10px]">brak</span></td>
            </tr>`;
        }
      });

      box.innerHTML = `
        <div class="bg-amber-950/50 text-amber-300 px-3 py-2 rounded-lg text-xs font-black tracking-wide uppercase">📦 Zestawienie dodatków: Blaty kuchenne i profile oświetleniowe LED</div>
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
            <tbody class="divide-y divide-slate-800 text-slate-300">${rows}</tbody>
          </table>
        </div>
      `;
      wrapper.appendChild(box);
    }
  }

  // ── visual wall ──────────────────────────────────────

  private renderVisualWall(): void {
    const topTrack = this.renderer.getEl("order-visual-top");
    const bottomTrack = this.renderer.getEl("order-visual-bottom");
    const cornerTrack = this.renderer.getEl("order-visual-corner");
    const accessoriesSection = this.renderer.getEl("order-visual-accessories");
    const accessoriesInner = this.renderer.getEl("order-visual-accessories-inner");
    const topEmpty = this.renderer.getEl("order-visual-top-empty");
    const bottomEmpty = this.renderer.getEl("order-visual-bottom-empty");
    const cornerEmpty = this.renderer.getEl("order-visual-corner-empty");

    if (!topTrack || !bottomTrack || !cornerTrack) return;

    const items = this.orderService.getItems();

    this.renderTiles(topTrack, items, "top", topEmpty);
    this.renderTiles(bottomTrack, items, "bottom", bottomEmpty);
    this.renderTiles(cornerTrack, items, "corner", cornerEmpty);

    const accItems = items.filter((_, i) => items[i].isLinear);
    const hasAcc = accItems.length > 0;

    if (accessoriesSection) accessoriesSection.classList.toggle("hidden", !hasAcc);
    if (accessoriesInner && hasAcc) {
      accessoriesInner.innerHTML = items
        .map((item, idx) => {
          if (!item.isLinear) return "";
          return `
            <div class="order-carousel-item order-carousel-item--active bg-slate-800 border border-slate-700 rounded-2xl p-3 flex flex-col text-white shadow-lg cursor-pointer" onclick="window.__orderUI?.editItem(${idx})">
              <div class="text-[10px] text-slate-400 font-bold border-b border-slate-700/50 pb-2 mb-2">#${idx + 1} ${item.typeBadge}</div>
              ${this.orderService.getPreview(item, true)}
            </div>`;
        })
        .filter(Boolean)
        .join("");
    }

    this.bindCarousel("order-visual-top", "carousel-top-prev", "carousel-top-next");
    this.bindCarousel("order-visual-bottom", "carousel-bottom-prev", "carousel-bottom-next");
    this.bindCarousel("order-visual-corner", "carousel-corner-prev", "carousel-corner-next");

    this.refreshCarousel("order-visual-top", "carousel-top-prev", "carousel-top-next");
    this.refreshCarousel("order-visual-bottom", "carousel-bottom-prev", "carousel-bottom-next");
    this.refreshCarousel("order-visual-corner", "carousel-corner-prev", "carousel-corner-next");
  }

  private renderTiles(track: HTMLElement, allItems: any[], type: string, emptyEl: HTMLElement | null): void {
    track.innerHTML = "";
    let count = 0;

    const filtered = allItems.filter(item => item.type === type);
    const c = filtered.length;
    const itemPercent = c > 0 ? Math.max(100 / c, 100 / 3) : 33.333;
    const isMobile = window.innerWidth <= 768;
    const sidePadding = isMobile ? 0 : (100 - itemPercent) / 2;

    filtered.forEach((item, _i) => {
      const globalIdx = allItems.indexOf(item);
      count++;
      const tile = document.createElement("div");
      tile.className = "order-carousel-item bg-slate-800 border border-slate-700 rounded-2xl p-3 flex flex-col text-white shadow-lg cursor-pointer group";
      tile.setAttribute("data-carousel-item", "");

      if (isMobile) {
        tile.style.flex = _i === 0 ? "0 0 100%" : "0 0 80%";
      } else {
        tile.style.flex = `0 0 ${itemPercent}%`;
      }
      tile.style.minWidth = "0";

      tile.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest("[data-order-delete]")) return;
        if (!tile.classList.contains("order-carousel-item--active")) {
          tile.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
          setTimeout(() => this.updateActiveSlide(track), 220);
          return;
        }
        this.onEditItem(globalIdx);
      });

      tile.innerHTML = `
        <div class="w-full flex justify-between items-center gap-2 text-[10px] text-slate-400 font-bold mb-2 border-b border-slate-700/50 pb-2">
          <span class="group-hover:text-blue-400 transition-colors truncate">#${globalIdx + 1} Modyfikuj pozycję 📝</span>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="px-1.5 py-0.5 border border-slate-600 bg-slate-900 rounded text-[9px] font-mono text-slate-300">${item.typeBadge}</span>
            <button type="button" data-order-delete class="no-print w-7 h-7 flex items-center justify-center rounded-lg border border-red-900/60 bg-red-950/50 text-red-400 hover:bg-red-900/60 hover:text-red-300 hover:border-red-500 cursor-pointer transition-colors" title="Usuń z zamówienia">🗑</button>
          </div>
        </div>
        ${this.orderService.getPreview(item, true)}
      `;

      tile.querySelector("[data-order-delete]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Czy na pewno usunąć pozycję #${globalIdx + 1}?`)) {
          this.orderService.removeItem(globalIdx);
          this.refresh();
        }
      });

      track.appendChild(tile);
    });

    track.style.paddingLeft = `${sidePadding}%`;
    track.style.paddingRight = `${sidePadding}%`;

    if (emptyEl) emptyEl.classList.toggle("hidden", count > 0);
  }

  private bindCarousel(trackId: string, prevId: string, nextId: string): void {
    const track = this.renderer.getEl(trackId);
    if (!track || track.dataset.carouselBound) return;
    track.dataset.carouselBound = "1";

    const refresh = () => {
      this.updateActiveSlide(track);
      this.updateCarouselButtons(track, prevId, nextId);
    };

    track.addEventListener("scroll", refresh, { passive: true });
    refresh();

    this.renderer.getEl(prevId)?.addEventListener("click", () => {
      const step = this.getScrollStep(track);
      track.scrollBy({ left: -step, behavior: "smooth" });
    });
    this.renderer.getEl(nextId)?.addEventListener("click", () => {
      const step = this.getScrollStep(track);
      track.scrollBy({ left: step, behavior: "smooth" });
    });
  }

  private refreshCarousel(trackId: string, prevId: string, nextId: string): void {
    const track = this.renderer.getEl(trackId);
    if (!track) return;
    this.updateActiveSlide(track);
    this.updateCarouselButtons(track, prevId, nextId);
  }

  private getScrollStep(track: HTMLElement): number {
    const item = track.querySelector("[data-carousel-item]");
    return item ? (item as HTMLElement).offsetWidth + 8 : Math.floor(track.clientWidth / 3);
  }

  private updateActiveSlide(track: HTMLElement): void {
    const items = track.querySelectorAll<HTMLElement>("[data-carousel-item]");
    if (!items.length) return;
    const trackRect = track.getBoundingClientRect();
    const centerX = trackRect.left + trackRect.width / 2;
    let activeIdx = 0;
    let minDist = Infinity;

    items.forEach((item, i) => {
      const r = item.getBoundingClientRect();
      const dist = Math.abs(centerX - (r.left + r.width / 2));
      if (dist < minDist) { minDist = dist; activeIdx = i; }
    });

    items.forEach((item, i) => item.classList.toggle("order-carousel-item--active", i === activeIdx));
  }

  private updateCarouselButtons(track: HTMLElement, prevId: string, nextId: string): void {
    const items = track.querySelectorAll("[data-carousel-item]");
    const count = items.length;
    const hasMultiple = count > 1;
    const activeIdx = [...items].findIndex(el => el.classList.contains("order-carousel-item--active"));

    const prev = this.renderer.getEl<HTMLButtonElement>(prevId);
    const next = this.renderer.getEl<HTMLButtonElement>(nextId);
    if (prev) { prev.classList.toggle("hidden", !hasMultiple); prev.disabled = !hasMultiple || activeIdx <= 0; }
    if (next) { next.classList.toggle("hidden", !hasMultiple); next.disabled = !hasMultiple || activeIdx >= count - 1; }
  }

  // ── event binding ────────────────────────────────────

  private bindEvents(): void {
    this.renderer.getEl("btn-print-pdf")?.addEventListener("click", async () => {
      const items = this.orderService.getItems();
      if (items.length === 0) { alert("Brak pozycji w zamowieniu."); return; }
      const doc = await this.pdfService.generate(items, this.orderService.getContractor());
      this.pdfService.save(doc);
    });

    this.renderer.getEl("btn-clear-order")?.addEventListener("click", () => {
      if (confirm("Czy na pewno chcesz wyczyścić całe obecne zamówienie?")) {
        this.orderService.clear();
        this.refresh();
      }
    });

    this.renderer.getEl("order-tab-btn-table")?.addEventListener("click", () => this.setTab("table"));
    this.renderer.getEl("order-tab-btn-cabinets")?.addEventListener("click", () => this.setTab("cabinets"));
  }

  // ── exposed for inline onclick ───────────────────────

  editItem(index: number): void {
    this.onEditItem(index);
  }
}
