import { WizardService } from "../application/WizardService.js";
import { OrderService } from "../application/OrderService.js";
import { OrderItem, CabinetType, InteriorType } from "../domain/entities/OrderItem.js";
import { Renderer } from "./Renderer.js";

export class WizardUI {
  private ledPickerBound = false;
  onSave: (() => void) | null = null;

  constructor(
    private wizard: WizardService,
    private orderService: OrderService,
    private renderer: Renderer,
    onSave?: () => void,
  ) {
    this.onSave = onSave ?? null;
    this.bindEvents();
    this.setupLedPicker();
    this.setupDynamicListeners();
  }

  open(): void {
    this.wizard.reset();
    this.syncForm();
    this.updateTypeCards();
    this.renderer.getEl("wizard-modal")?.classList.remove("hidden");
    const sc = this.renderer.getEl("wizard-steps-container");
    if (sc) sc.className = "lg:col-span-2 flex flex-col justify-center space-y-6 animate-modal-enter";
    this.renderWizard();
  }

  openForEdit(index: number): void {
    const item = this.orderService.getItems()[index];
    if (!item) return;
    this.wizard.loadForEdit(index, item);
    this.syncForm();
    this.updateTypeCards();
    this.renderer.getEl("wizard-modal")?.classList.remove("hidden");
    const sc = this.renderer.getEl("wizard-steps-container");
    if (sc) sc.className = "lg:col-span-2 flex flex-col justify-center space-y-6 animate-modal-enter";
    this.renderWizard();
  }

  // ── event binding ──────────────────────────────────────

  private bindEvents(): void {
    this.renderer.getEl("btn-start-wizard")?.addEventListener("click", () => this.open());
    this.renderer.getEl("btn-add-order-item")?.addEventListener("click", () => this.open());
    this.renderer.getEl("btn-close-wizard")?.addEventListener("click", () => {
      this.renderer.getEl("wizard-modal")?.classList.add("hidden");
    });

    this.renderer.getEl("btn-wizard-back")?.addEventListener("click", () => {
      if (this.wizard.goBack()) this.renderWizard();
    });

    this.renderer.getEl("btn-wizard-next")?.addEventListener("click", () => this.handleNext());

    document.querySelectorAll(".type-card").forEach(card => {
      card.addEventListener("click", () => {
        this.wizard.setType(card.getAttribute("data-type") as CabinetType);
        this.syncForm();
        this.updateTypeCards();
        this.renderWizard();
      });
    });
  }

  private updateTypeCards(): void {
    const sel = this.wizard.state.item.type;
    document.querySelectorAll(".type-card").forEach(card => {
      const t = card.getAttribute("data-type");
      card.className = t === sel
        ? "type-card p-4 border-2 border-blue-600 bg-blue-950/40 text-blue-400 font-bold rounded-xl flex flex-col items-center gap-2 cursor-pointer"
        : "type-card p-4 border border-slate-700 rounded-xl flex flex-col items-center gap-2 cursor-pointer bg-slate-800 text-white";
    });
  }

  private handleNext(): void {
    if (!this.wizard.isLastStep) {
      this.wizard.goNext();
      this.renderWizard();
      return;
    }

    this.collectFormValues();

    const item = this.wizard.state.item.clone();
    const editIdx = this.wizard.state.editIndex;

    if (editIdx !== null) {
      this.orderService.updateItem(editIdx, item);
    } else {
      this.orderService.addItem(item);
    }

    this.renderer.getEl("wizard-modal")?.classList.add("hidden");
    this.onSave?.();
  }

  private collectFormValues(): void {
    const getVal = (id: string, fallback: string | number = "") => {
      const el = this.renderer.getEl<HTMLInputElement | HTMLSelectElement>(id);
      return el ? el.value : fallback;
    };

    const item = this.wizard.state.item;
    item.colorBody = String(getVal("input-color-body", item.colorBody));
    item.colorFront = String(getVal("input-color-front", item.colorFront));
    item.handleType = String(getVal("input-handle-type", item.handleType));
    item.countertopColor = String(getVal("input-countertop-color", item.countertopColor));
    item.countertopThickness = Number(getVal("input-countertop-thickness", item.countertopThickness));
    item.ledType = String(getVal("input-led-type", item.ledType)) as any;
    item.ledColorTemperature = String(getVal("input-led-temp", item.ledColorTemperature));
    item.ledProfileColor = String(getVal("input-led-profile-color", item.ledProfileColor));
  }

  // ── live preview ─────────────────────────────────────

  private setupDynamicListeners(): void {
    const ids = [
      "input-width", "input-height", "input-depth",
      "input-color-body", "input-color-front", "input-handle-type",
      "input-countertop-color", "input-countertop-thickness",
      "input-led-type", "input-led-temp", "input-led-profile-color",
      "input-corner-type", "input-kidney-type", "input-kidney-shelves",
      "input-corner-front-width", "input-corner-depth-left", "input-corner-depth-right",
    ];
    ids.forEach(id => {
      const el = this.renderer.getEl<HTMLInputElement>(id);
      if (!el) return;
      const handler = () => {
        this.wizard.setValFromForm(el.id, el.value);
        this.syncLedPicker();
        this.renderDrawerSliders();
        this.updateInteriorUI();
      };
      el.addEventListener("input", handler);
      el.addEventListener("change", handler);
    });

    this.renderer.getEl("btn-opt-shelves")?.addEventListener("click", () => {
      this.wizard.setInterior("shelves");
      this.updateInteriorUI();
    });

    this.renderer.getEl("btn-opt-drawers")?.addEventListener("click", () => {
      this.wizard.setInterior("drawers");
      this.updateInteriorUI();
    });

    this.renderer.getEl("input-shelves-count")?.addEventListener("input", (e) => {
      const val = Number((e.target as HTMLInputElement).value);
      this.wizard.state.item.shelvesCount = val;
      this.renderer.setText("lbl-shelves-count", String(val));
      this.updateInteriorUI();
    });

    this.renderer.getEl("btn-drawer-minus")?.addEventListener("click", () => {
      if (this.wizard.state.item.drawersCount > 1) {
        this.wizard.state.item.drawersCount--;
        this.wizard.state.item.drawerHeights.pop();
        this.wizard.state.item.drawerManualAdjust = false;
        this.renderDrawerSliders();
        this.updateInteriorUI();
      }
    });

    this.renderer.getEl("btn-drawer-plus")?.addEventListener("click", () => {
      if (this.wizard.state.item.drawersCount < 6) {
        this.wizard.state.item.drawersCount++;
        this.wizard.state.item.drawerHeights.push(150);
        this.wizard.state.item.drawerManualAdjust = false;
        this.wizard.state.item.normalizeDrawerHeights();
        this.renderDrawerSliders();
        this.updateInteriorUI();
      }
    });

    this.renderer.getEl("input-drawer-own-sides")?.addEventListener("change", (e) => {
      this.wizard.state.item.drawerOwnSides = (e.target as HTMLInputElement).checked;
      this.updateInteriorUI();
    });

    this.renderer.getEl("input-corner-type")?.addEventListener("change", (e) => {
      this.wizard.setCornerType((e.target as HTMLSelectElement).value as any);
      this.renderTypeBlocks();
      this.updateInteriorUI();
    });

    this.renderer.getEl("input-kidney-type")?.addEventListener("change", (e) => {
      this.wizard.setKidneyType((e.target as HTMLSelectElement).value as any);
      this.updateInteriorUI();
    });
  }

  // ── LED picker ───────────────────────────────────────

  private setupLedPicker(): void {
    const picker = this.renderer.getEl("led-temp-picker");
    if (!picker || this.ledPickerBound) return;
    this.ledPickerBound = true;
    picker.querySelectorAll(".led-temp-card").forEach(btn => {
      btn.addEventListener("click", () => {
        const temp = (btn as HTMLElement).dataset.temp ?? "4000K";
        this.wizard.state.item.ledColorTemperature = temp;
        this.syncLedPicker();
        this.updateInteriorUI();
      });
    });
  }

  private syncLedPicker(): void {
    const temp = this.wizard.state.item.ledColorTemperature || "4000K";
    const hidden = this.renderer.getEl<HTMLInputElement>("input-led-temp");
    if (hidden) hidden.value = temp;
    document.querySelectorAll("#led-temp-picker .led-temp-card").forEach(btn => {
      btn.classList.toggle("led-temp-card--active", (btn as HTMLElement).dataset.temp === temp);
    });
  }

  // ── form sync ────────────────────────────────────────

  private syncForm(): void {
    const item = this.wizard.state.item;
    this.renderer.setVal("input-color-body", item.colorBody);
    this.renderer.setVal("input-color-front", item.colorFront);
    this.renderer.setVal("input-handle-type", item.handleType);
    this.renderer.setVal("input-width", item.dimensions.width);
    this.renderer.setVal("input-height", item.dimensions.height);
    this.renderer.setVal("input-depth", item.dimensions.depth);
    this.renderer.setVal("input-countertop-color", item.countertopColor);
    this.renderer.setVal("input-countertop-thickness", item.countertopThickness);
    this.renderer.setVal("input-led-type", item.ledType);
    this.renderer.setVal("input-led-temp", item.ledColorTemperature);
    this.renderer.setVal("input-led-profile-color", item.ledProfileColor);
    this.syncLedPicker();

    const el = this.renderer.getEl<HTMLInputElement>("input-drawer-own-sides");
    if (el) el.checked = item.drawerOwnSides !== false;

    if (item.interiorType === "shelves") {
      this.renderer.setVal("input-shelves-count", item.shelvesCount);
      this.renderer.setText("lbl-shelves-count", String(item.shelvesCount));
    }
  }

  // ── render wizard step ───────────────────────────────

  renderWizard(): void {
    document.querySelectorAll(".wizard-step").forEach(s => {
      s.classList.add("hidden");
      s.classList.remove("animate-step-enter");
    });
    const stepEl = this.renderer.getEl(`step-${this.wizard.state.currentStep}`);
    if (stepEl) {
      stepEl.classList.remove("hidden");
      requestAnimationFrame(() => stepEl.classList.add("animate-step-enter"));
    }

    const btnBack = this.renderer.getEl<HTMLButtonElement>("btn-wizard-back");
    if (btnBack) btnBack.disabled = this.wizard.isFirstStep;

    this.renderer.setText("wizard-progress-lbl", this.wizard.progressLabel);
    this.renderer.setText("btn-wizard-next", this.wizard.nextButtonLabel);

    this.renderStep2Labels();
    this.renderTypeBlocks();
    this.renderSuggestions();
    this.renderer.setText("wizard-hint-text", this.wizard.hint);
    this.updateInteriorUI();
    this.updateTypeCards();
  }

  private renderStep2Labels(): void {
    const item = this.wizard.state.item;
    const title2 = this.renderer.getEl("step-2-title");
    const lblW = this.renderer.getEl("lbl-dim-width");
    const lblH = this.renderer.getEl("lbl-dim-height");
    const dimW = this.renderer.getEl("dim-width-box");
    const dimH = this.renderer.getEl("dim-height-box");
    const interiorSel = this.renderer.getEl("interior-type-selector");
    const ctrlShelves = this.renderer.getEl("ctrl-shelves");
    const ctrlDrawers = this.renderer.getEl("ctrl-drawers");

    if (item.type === "countertop") {
      if (title2) title2.innerText = "2. Parametry i wymiary blatu";
      if (lblW) lblW.innerText = "Długość całkowita blatu (mm)";
      if (dimW) dimW?.classList.remove("hidden");
      if (dimH) dimH?.classList.add("hidden");
    } else if (item.type === "led") {
      if (title2) title2.innerText = "2. Konfiguracja profilu oświetleniowego LED";
      if (lblW) lblW.innerText = "Długość odcinka LED (mm)";
      if (dimW) dimW?.classList.remove("hidden");
      if (dimH) dimH?.classList.add("hidden");
    } else if (item.type === "corner") {
      if (title2) title2.innerText = "2. Gabaryty szafki narożnej";
      if (lblW) lblW.innerText = "Szerokość narożnej (mm)";
      if (lblH) lblH.innerText = "Wysokość szafki";
      if (dimW) dimW?.classList.remove("hidden");
      if (dimH) dimH?.classList.remove("hidden");
      // Interior selector only for diagonal corner
      if (this.wizard.state.currentStep === 3) {
        if (interiorSel) interiorSel.classList.toggle("hidden", item.cornerType !== "diagonal");
        if (ctrlShelves) ctrlShelves.classList.toggle("hidden", item.interiorType !== "shelves" || item.cornerType !== "diagonal");
        if (ctrlDrawers) ctrlDrawers.classList.toggle("hidden", item.interiorType !== "drawers" || item.cornerType !== "diagonal");
      }
    } else {
      if (title2) title2.innerText = "2. Gabaryty zewnętrzne szafki";
      if (lblW) lblW.innerText = "Szerokość zewnętrzna korpusu (mm)";
      if (lblH) lblH.innerText = "Wysokość szafki";
      if (dimW) dimW?.classList.remove("hidden");
      if (dimH) dimH?.classList.remove("hidden");
      if (this.wizard.state.currentStep === 3) {
        if (interiorSel) interiorSel.classList.remove("hidden");
        if (ctrlShelves) ctrlShelves.classList.toggle("hidden", item.interiorType !== "shelves");
        if (ctrlDrawers) ctrlDrawers.classList.toggle("hidden", item.interiorType !== "drawers");
      }
    }

    if (this.wizard.state.currentStep !== 3 && interiorSel) {
      interiorSel.classList.toggle("hidden", item.type === "corner" && item.cornerType !== "diagonal");
    }
  }

  private renderTypeBlocks(): void {
    const item = this.wizard.state.item;
    const ctBlock = this.renderer.getEl("countertop-options-block");
    const ledBlock = this.renderer.getEl("led-options-block");
    const cornerBlock = this.renderer.getEl("corner-options-block");

    if (ctBlock) ctBlock.classList.toggle("hidden", item.type !== "countertop");
    if (ledBlock) ledBlock.classList.toggle("hidden", item.type !== "led");
    if (cornerBlock) cornerBlock.classList.toggle("hidden", item.type !== "corner");

    if (item.type === "corner") {
      const kidneyBlock = this.renderer.getEl("corner-kidney-block");
      const diagBlock = this.renderer.getEl("corner-diagonal-block");
      if (kidneyBlock) kidneyBlock.classList.toggle("hidden", item.cornerType !== "blind");
      if (diagBlock) diagBlock.classList.toggle("hidden", item.cornerType !== "diagonal");

      this.renderer.setVal("input-corner-type", item.cornerType);
      this.renderer.setVal("input-kidney-type", item.kidneyType);
      this.renderer.setVal("input-kidney-shelves", item.kidneyShelvesCount);
      this.renderer.setVal("input-corner-front-width", item.cornerFrontWidth);
      this.renderer.setVal("input-corner-depth-left", item.cornerDepthLeft);
      this.renderer.setVal("input-corner-depth-right", item.cornerDepthRight);
    }
  }

  private renderSuggestions(): void {
    const wSugg = this.renderer.getEl("width-suggestions");
    const hSugg = this.renderer.getEl("height-suggestions");
    if (!wSugg) return;
    const type = this.wizard.state.item.type;

    if (type === "countertop" || type === "led") {
      wSugg.innerHTML = [600, 1200, 1800, 2400, 3000]
        .map(v => `<button onclick="window.__wiz?.setDim('width', ${v})" class="text-xs bg-slate-700 px-2 py-1 rounded-md cursor-pointer text-slate-200">${v} mm</button>`)
        .join("");
    } else {
      const widths = [300, 450, 600, 800, 900];
      const heights = type === "top" ? [360, 720, 960] : [720, 820];
      wSugg.innerHTML = widths
        .map(v => `<button onclick="window.__wiz?.setDim('width', ${v})" class="text-xs bg-slate-700 px-2 py-1 rounded-md cursor-pointer text-slate-200">${v}</button>`)
        .join("");
      if (hSugg) {
        hSugg.innerHTML = heights
          .map(v => `<button onclick="window.__wiz?.setDim('height', ${v})" class="text-xs bg-slate-700 px-2 py-1 rounded-md cursor-pointer text-slate-200">${v}</button>`)
          .join("");
      }
    }
  }

  private updateInteriorButtons(): void {
    const type = this.wizard.state.item.interiorType;
    const activeCls = "flex-1 py-2 px-4 border border-blue-600 bg-blue-900/20 text-blue-400 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer";
    const normalCls = "flex-1 py-2 px-4 border border-slate-700 text-slate-400 rounded-xl flex items-center justify-center gap-1 bg-slate-800 cursor-pointer";

    const btnShelves = this.renderer.getEl("btn-opt-shelves");
    const btnDrawers = this.renderer.getEl("btn-opt-drawers");
    if (btnShelves) btnShelves.className = type === "shelves" ? activeCls : normalCls;
    if (btnDrawers) btnDrawers.className = type === "drawers" ? activeCls : normalCls;

    const ctrlShelves = this.renderer.getEl("ctrl-shelves");
    const ctrlDrawers = this.renderer.getEl("ctrl-drawers");
    if (ctrlShelves) ctrlShelves.classList.toggle("hidden", type !== "shelves");
    if (ctrlDrawers) ctrlDrawers.classList.toggle("hidden", type !== "drawers");
  }

  // ── interior / preview ───────────────────────────────

  private updateInteriorUI(): void {
    const pBox = this.renderer.getEl("preview-box");
    const alertEl = this.renderer.getEl("interior-validation-alert");
    const btnNext = this.renderer.getEl<HTMLButtonElement>("btn-wizard-next");
    const item = this.wizard.state.item;
    if (!pBox) return;

    this.updateInteriorButtons();

    if (!item.isLinear && item.interiorType === "drawers") {
      const used = item.totalDrawerHeight;
      const diff = item.drawerHeightRemaining;

      this.renderer.setText("info-val-used", String(used));
      const statusEl = this.renderer.getEl("info-val-status");
      if (statusEl) {
        statusEl.innerText = diff > 0 ? `Luz: ${diff}mm` : "Idealnie: 0mm";
        statusEl.className = diff > 0 ? "font-bold text-amber-500" : "font-bold text-emerald-600";
      }

      if (used > item.dimensions.height) {
        if (alertEl) { alertEl.className = "p-2 bg-red-950/30 text-red-400 rounded-lg text-xs"; alertEl.innerText = "⚠️ Szuflady przekraczają gabaryt!"; }
        if (btnNext) btnNext.disabled = true;
      } else {
        if (alertEl) { alertEl.className = "p-2 bg-green-950/30 text-green-400 rounded-lg text-xs"; alertEl.innerText = "✓ Gabaryty szuflad poprawne."; }
        if (btnNext) btnNext.disabled = false;
      }
    } else {
      if (alertEl) { alertEl.className = "p-2 bg-green-950/30 text-green-400 rounded-lg text-xs"; alertEl.innerText = "✓ Element poprawny konstrukcyjnie."; }
      if (btnNext) btnNext.disabled = false;
    }

    pBox.className = "w-full bg-slate-900/20 p-4 rounded-2xl flex items-center justify-center";
    pBox.innerHTML = this.wizard.preview;
    this.renderDrawerSliders();
  }

  private renderDrawerSliders(): void {
    const container = this.renderer.getEl("drawer-sliders-container");
    if (!container) return;
    const item = this.wizard.state.item;

    this.renderer.setText("lbl-drawers-count", String(item.drawersCount));
    container.innerHTML = "";

    item.drawerHeights.forEach((hVal, idx) => {
      const row = document.createElement("div");
      row.className = "space-y-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800";
      row.innerHTML = `
        <div class="flex justify-between text-xs font-bold text-slate-300">
          <span>Szuflada nr ${idx + 1}</span>
          <span class="font-mono text-blue-400">${hVal} mm</span>
        </div>
        <input type="range" min="60" max="${item.dimensions.height}" value="${hVal}" data-idx="${idx}" class="drawer-single-slider w-full accent-blue-600 cursor-pointer">
      `;
      container.appendChild(row);
    });

    container.querySelectorAll(".drawer-single-slider").forEach(slider => {
      slider.addEventListener("input", (e) => {
        const idx = parseInt((e.target as HTMLElement).dataset.idx ?? "0");
        const val = parseInt((e.target as HTMLInputElement).value);
        item.setDrawerHeight(idx, val);
        this.renderDrawerSliders();
        this.updateInteriorUI();
      });
    });
  }

  // ── exposed for inline onclick ───────────────────────

  setDim(field: "width" | "height", value: number): void {
    this.wizard.setDimension(field, value);
    this.renderer.setVal(`input-${field}`, value);
    this.renderDrawerSliders();
    this.updateInteriorUI();
  }
}
