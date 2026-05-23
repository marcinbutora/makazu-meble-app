// app.js

// Stan aplikacji (zmienne globalne i pomocnicze) znajdują się w pliku state.js
let orderViewTab = "table";

// --- SILNIK GENEROWANIA JEDNOLITEGO WIDOKU 2D ---
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

function syncLedTempPickerUI() {
  const temp = wizardItem.ledColorTemperature || "4000K";
  const hidden = document.getElementById("input-led-temp");
  if (hidden) hidden.value = temp;
  document.querySelectorAll("#led-temp-picker .led-temp-card").forEach((btn) => {
    btn.classList.toggle("led-temp-card--active", btn.dataset.temp === temp);
  });
}

function setLedColorTemperature(temp) {
  wizardItem.ledColorTemperature = temp;
  const hidden = document.getElementById("input-led-temp");
  if (hidden) hidden.value = temp;
  syncLedTempPickerUI();
  updateInteriorStepUI();
}

function setupLedTemperaturePicker() {
  const picker = document.getElementById("led-temp-picker");
  if (!picker || picker.dataset.bound) return;
  picker.dataset.bound = "1";
  picker.querySelectorAll(".led-temp-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLedColorTemperature(btn.dataset.temp);
    });
  });
}

// Funkcja generuje stabilny layout zsynchronizowany z widokiem zlecenia (brak zniekształceń proporcji aspect-ratio)
function generateCabinetFlexTemplate(item, options = {}) {
  const compact = options.compact === true;
  const w = item.dimensions.width || 600;
  const h = item.dimensions.height || 720;
  const d = item.dimensions.depth || 510;

  let graphicHtml = "";
  let specsHtml = "";

  if (item.type === "countertop") {
    const cColor = item.countertopColor || "Dąb Werona K002";
    const cThick = item.countertopThickness || 38;
    const blatPreviewH = compact
      ? Math.round(32 + cThick * 0.65)
      : Math.round(48 + cThick * 0.85);

    graphicHtml = `
      <div class="w-full bg-amber-800 border-2 border-amber-600 rounded-xl ${compact ? "px-3" : "p-6"} flex flex-col items-center justify-center text-amber-100 shadow-inner transition-all duration-200" style="min-height: ${blatPreviewH}px;">
        <span class="font-bold ${compact ? "text-xs" : "text-sm"} tracking-wide">🪵 BLAT KUCHENNY</span>
        <span class="font-mono text-[10px] mt-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/40">Grubość: ${cThick} mm</span>
        ${compact ? "" : `<span class="text-[10px] text-amber-200/80 mt-2">${cColor}</span>`}
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
      <div class="w-full ${compact ? "min-h-[3.5rem]" : "h-20"} bg-slate-800 border-2 border-slate-600 rounded-xl flex flex-col items-center justify-center relative overflow-hidden p-2 shadow-lg gap-1">
        <div class="absolute inset-x-4 inset-y-3 rounded opacity-95 animate-pulse" style="background: ${glow.glow}; box-shadow: ${glow.shadow};"></div>
        <span class="relative z-10 font-mono ${compact ? "text-[10px]" : "text-xs"} font-bold text-slate-950 bg-white/90 px-2 py-0.5 rounded shadow-sm">LED L = ${w} mm</span>
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
    // Standardowa szafka (GÓRA / DÓŁ) - identycznie jak w image_bcf4eb.png
    let interiorHtml = "";
    if (item.interiorType === "shelves") {
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

    if (compact) {
      const baseW = Math.min(240, Math.max(160, Math.round(220 * (w / 600))));
      graphicHtml = `
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
            <div class="flex-1 flex flex-col min-h-0 p-1.5">
              ${interiorHtml}
            </div>
          </div>
        </div>
      `;
    } else {
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
    }

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

  if (compact) {
    return `
      <div class="order-tile-preview-host w-full">
        ${graphicHtml}
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

// --- INICJALIZACJA I OBSŁUGA ZDARZEŃ ---
document.addEventListener("DOMContentLoaded", () => {
  if (typeof loadContractor === "function") loadContractor();
  if (typeof loadOrder === "function") loadOrder();
  if (typeof setupEventListeners === "function") setupEventListeners();
  if (typeof setupDynamicFormListeners === "function")
    setupDynamicFormListeners();
  setupLedTemperaturePicker();
  if (typeof updateMainUI === "function") updateMainUI();
});

function loadContractor() {
  const saved = localStorage.getItem("makazu_contractor");
  if (saved) {
    contractorProfile = JSON.parse(saved);
    document.getElementById("nav-contractor-name").innerText =
      contractorProfile.name || "Dane Wykonawcy";
    setValSafely("input-cfg-name", contractorProfile.name || "");
    setValSafely("input-cfg-nip", contractorProfile.nip || "");
    setValSafely("input-cfg-email", contractorProfile.email || "");
    setValSafely("input-cfg-phone", contractorProfile.phone || "");
  }
}

function loadOrder() {
  const savedOrder = localStorage.getItem("makazu_current_order");
  if (savedOrder) {
    currentOrder = JSON.parse(savedOrder);
  }
}

function saveOrderToStorage() {
  localStorage.setItem("makazu_current_order", JSON.stringify(currentOrder));
}

function openModalAnimated(modalId, cardId) {
  const modal = document.getElementById(modalId);
  const card = document.getElementById(cardId);
  modal.classList.remove("hidden");
  card.className = card.className.replace(/animate-modal-leave/g, "").trim();
  card.classList.add("animate-modal-enter");
}

function closeModalAnimated(modalId, cardId) {
  const modal = document.getElementById(modalId);
  const card = document.getElementById(cardId);
  card.classList.remove("animate-modal-enter");
  card.classList.add("animate-modal-leave");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 190);
}

function setupEventListeners() {
  document
    .getElementById("btn-print-pdf")
    .addEventListener("click", () => window.print());

  document.getElementById("btn-clear-order").addEventListener("click", () => {
    if (confirm("Czy na pewno chcesz wyczyścić całe obecne zamówienie?")) {
      currentOrder = [];
      saveOrderToStorage();
      updateMainUI();
    }
  });

  document
    .getElementById("btn-open-contractor")
    .addEventListener("click", () =>
      openModalAnimated("contractor-modal", "contractor-modal-card"),
    );
  document
    .getElementById("btn-close-contractor")
    .addEventListener("click", () =>
      closeModalAnimated("contractor-modal", "contractor-modal-card"),
    );

  document
    .getElementById("btn-save-contractor")
    .addEventListener("click", () => {
      contractorProfile.name = document.getElementById("input-cfg-name").value;
      contractorProfile.nip = document.getElementById("input-cfg-nip").value;
      contractorProfile.email =
        document.getElementById("input-cfg-email").value;
      contractorProfile.phone =
        document.getElementById("input-cfg-phone").value;

      localStorage.setItem(
        "makazu_contractor",
        JSON.stringify(contractorProfile),
      );
      document.getElementById("nav-contractor-name").innerText =
        contractorProfile.name || "Dane Wykonawcy";
      closeModalAnimated("contractor-modal", "contractor-modal-card");
      updateMainUI();
    });

  const openNewItemWizard = () => {
    editIndex = null;
    currentStep = 1;
    wizardItem = {
      type: "bottom",
      dimensions: { width: 600, height: 720, depth: 510 },
      colorBody: "Biały Alpejski U12188",
      colorFront: "Dąb Craft Złoty K003",
      handleType: "Krawędziowy Czarny Mat",
      interiorType: "shelves",
      shelvesCount: 2,
      drawersCount: 3,
      drawerHeights: [140, 280, 280],
      drawerManualAdjust: false,
      drawerOwnSides: true,
      countertopColor: "Dąb Werona K002",
      countertopThickness: 38,
      ledType: "recessed",
      ledColorTemperature: "4000K",
      ledProfileColor: "Anodowane Srebrne",
    };

    setValSafely("input-color-body", wizardItem.colorBody);
    setValSafely("input-color-front", wizardItem.colorFront);
    setValSafely("input-handle-type", wizardItem.handleType);
    setValSafely("input-width", wizardItem.dimensions.width);
    setValSafely("input-height", wizardItem.dimensions.height);
    setValSafely("input-depth", wizardItem.dimensions.depth);
    setValSafely("input-countertop-color", wizardItem.countertopColor);
    setValSafely("input-countertop-thickness", wizardItem.countertopThickness);
    setValSafely("input-led-type", wizardItem.ledType);
    setValSafely("input-led-temp", wizardItem.ledColorTemperature);
    setValSafely("input-led-profile-color", wizardItem.ledProfileColor);
    syncLedTempPickerUI();
    syncDrawerOwnSidesUI();

    selectType("bottom");
    openWizardModal();
  };

  document
    .getElementById("btn-start-wizard")
    .addEventListener("click", openNewItemWizard);
  const addOrderBtn = document.getElementById("btn-add-order-item");
  if (addOrderBtn) addOrderBtn.addEventListener("click", openNewItemWizard);

  document
    .getElementById("order-tab-btn-table")
    ?.addEventListener("click", () => setOrderViewTab("table"));
  document
    .getElementById("order-tab-btn-cabinets")
    ?.addEventListener("click", () => setOrderViewTab("cabinets"));

  const drawerOwnSidesEl = document.getElementById("input-drawer-own-sides");
  if (drawerOwnSidesEl) {
    drawerOwnSidesEl.addEventListener("change", (e) => {
      wizardItem.drawerOwnSides = e.target.checked;
      updateInteriorStepUI();
    });
  }

  document.getElementById("btn-close-wizard").addEventListener("click", () => {
    document.getElementById("wizard-modal").classList.add("hidden");
  });

  document.getElementById("btn-wizard-back").addEventListener("click", () => {
    if (currentStep > 1) {
      currentStep--;
      renderWizard();
    }
  });

  document.getElementById("btn-wizard-next").addEventListener("click", () => {
    const isCabinet = wizardItem.type === "bottom" || wizardItem.type === "top";
    const maxSteps = isCabinet ? 3 : 2;

    if (currentStep < maxSteps) {
      currentStep++;
      renderWizard();
    } else {
      // Mapowanie wartości z formularzy (pobiera dane tylko jeśli element istnieje w DOM)
      const getVal = (id, fallback) => {
        const el = document.getElementById(id);
        return el ? el.value : fallback;
      };

      wizardItem.colorBody = getVal("input-color-body", wizardItem.colorBody);
      wizardItem.colorFront = getVal(
        "input-color-front",
        wizardItem.colorFront,
      );
      wizardItem.handleType = getVal(
        "input-handle-type",
        wizardItem.handleType,
      );
      wizardItem.countertopColor = getVal(
        "input-countertop-color",
        wizardItem.countertopColor,
      );
      wizardItem.countertopThickness = Number(
        getVal("input-countertop-thickness", wizardItem.countertopThickness),
      );
      wizardItem.ledType = getVal("input-led-type", wizardItem.ledType);
      wizardItem.ledColorTemperature = getVal(
        "input-led-temp",
        wizardItem.ledColorTemperature,
      );
      wizardItem.ledProfileColor = getVal(
        "input-led-profile-color",
        wizardItem.ledProfileColor,
      );

      if (editIndex !== null) {
        currentOrder[editIndex] = JSON.parse(JSON.stringify(wizardItem));
      } else {
        currentOrder.push(JSON.parse(JSON.stringify(wizardItem)));
      }

      saveOrderToStorage();
      updateMainUI();
      document.getElementById("wizard-modal").classList.add("hidden");
    }
  });

  document.querySelectorAll(".type-card").forEach((card) => {
    card.addEventListener("click", () =>
      selectType(card.getAttribute("data-type")),
    );
  });

  document
    .getElementById("btn-opt-shelves")
    .addEventListener("click", () => setInterior("shelves"));
  document
    .getElementById("btn-opt-drawers")
    .addEventListener("click", () => setInterior("drawers"));

  document
    .getElementById("input-shelves-count")
    .addEventListener("input", (e) => {
      wizardItem.shelvesCount = Number(e.target.value);
      document.getElementById("lbl-shelves-count").innerText = e.target.value;
      updateInteriorStepUI();
    });

  document.getElementById("btn-drawer-minus").addEventListener("click", () => {
    if (wizardItem.drawersCount > 1) {
      wizardItem.drawersCount--;
      wizardItem.drawerHeights.pop();
      wizardItem.drawerManualAdjust = false;
      recalculateDrawersMaxDistribution();
    }
  });
  document.getElementById("btn-drawer-plus").addEventListener("click", () => {
    if (wizardItem.drawersCount < 6) {
      wizardItem.drawersCount++;
      wizardItem.drawerHeights.push(150);
      wizardItem.drawerManualAdjust = false;
      recalculateDrawersMaxDistribution();
    }
  });
}

// Spina zdarzenia zmian pól formularzy z dynamicznym odświeżaniem podglądu (Live Preview)
function setupDynamicFormListeners() {
  const inputs = [
    "input-width",
    "input-height",
    "input-depth",
    "input-color-body",
    "input-color-front",
    "input-handle-type",
    "input-countertop-color",
    "input-countertop-thickness",
    "input-led-type",
    "input-led-temp",
    "input-led-profile-color",
  ];

  const applyWizardField = (id, val) => {
    if (id === "input-width") wizardItem.dimensions.width = Number(val);
    if (id === "input-height") wizardItem.dimensions.height = Number(val);
    if (id === "input-depth") wizardItem.dimensions.depth = Number(val);
    if (id === "input-color-body") wizardItem.colorBody = val;
    if (id === "input-color-front") wizardItem.colorFront = val;
    if (id === "input-handle-type") wizardItem.handleType = val;
    if (id === "input-countertop-color") wizardItem.countertopColor = val;
    if (id === "input-countertop-thickness")
      wizardItem.countertopThickness = Number(val);
    if (id === "input-led-type") wizardItem.ledType = val;
    if (id === "input-led-temp") {
      wizardItem.ledColorTemperature = val;
      syncLedTempPickerUI();
    }
    if (id === "input-led-profile-color") wizardItem.ledProfileColor = val;
    recalculateDrawersMaxDistribution();
    updateInteriorStepUI();
  };

  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const onField = (e) => applyWizardField(id, e.target.value);
    el.addEventListener("input", onField);
    el.addEventListener("change", onField);
  });
}

function openWizardModal() {
  const wizardModal = document.getElementById("wizard-modal");
  const stepsContainer = document.getElementById("wizard-steps-container");
  wizardModal.classList.remove("hidden");
  stepsContainer.className =
    "lg:col-span-2 flex flex-col justify-center space-y-6 animate-modal-enter";
  renderWizard();
}

window.editOrderItem = function (index) {
  editIndex = index;
  wizardItem = JSON.parse(JSON.stringify(currentOrder[index]));
  currentStep = 1;

  // Zabezpieczone ładowanie danych do edycji
  setValSafely("input-color-body", wizardItem.colorBody || "");
  setValSafely("input-color-front", wizardItem.colorFront || "");
  setValSafely("input-handle-type", wizardItem.handleType || "");
  setValSafely("input-width", wizardItem.dimensions.width);
  setValSafely("input-height", wizardItem.dimensions.height);
  setValSafely("input-depth", wizardItem.dimensions.depth || 510);
  setValSafely(
    "input-countertop-color",
    wizardItem.countertopColor || "Dąb Werona K002",
  );
  setValSafely(
    "input-countertop-thickness",
    wizardItem.countertopThickness || 38,
  );
  setValSafely("input-led-type", wizardItem.ledType || "recessed");
  setValSafely("input-led-temp", wizardItem.ledColorTemperature || "4000K");
  setValSafely(
    "input-led-profile-color",
    wizardItem.ledProfileColor || "Anodowane Srebrne",
  );
  syncLedTempPickerUI();

  if (wizardItem.interiorType === "shelves") {
    const elShelves = document.getElementById("input-shelves-count");
    if (elShelves) elShelves.value = wizardItem.shelvesCount;
    const lblShelves = document.getElementById("lbl-shelves-count");
    if (lblShelves) lblShelves.innerText = wizardItem.shelvesCount;
  }

  if (wizardItem.drawerManualAdjust === undefined) {
    wizardItem.drawerManualAdjust = false;
  }
  if (wizardItem.drawerOwnSides === undefined) {
    wizardItem.drawerOwnSides = true;
  }

  syncDrawerOwnSidesUI();
  selectType(wizardItem.type);
  openWizardModal();
};

function syncDrawerOwnSidesUI() {
  const el = document.getElementById("input-drawer-own-sides");
  if (el) el.checked = wizardItem.drawerOwnSides !== false;
}

function setOrderViewTab(tab) {
  orderViewTab = tab;
  const panelTable = document.getElementById("order-panel-table");
  const panelCabinets = document.getElementById("order-panel-cabinets");
  const btnTable = document.getElementById("order-tab-btn-table");
  const btnCabinets = document.getElementById("order-tab-btn-cabinets");
  const isTable = tab === "table";

  if (panelTable) panelTable.classList.toggle("hidden", !isTable);
  if (panelCabinets) panelCabinets.classList.toggle("hidden", isTable);
  if (btnTable) btnTable.classList.toggle("order-tab-btn--active", isTable);
  if (btnCabinets) btnCabinets.classList.toggle("order-tab-btn--active", !isTable);

  if (!isTable) renderOrderVisualWall();
}

function selectType(type) {
  wizardItem.type = type;
  document.querySelectorAll(".type-card").forEach((card) => {
    if (card.getAttribute("data-type") === type) {
      card.className =
        "type-card p-4 border-2 border-blue-600 bg-blue-950/40 text-blue-400 font-bold rounded-xl flex flex-col items-center gap-2 cursor-pointer";
    } else {
      card.className =
        "type-card p-4 border border-slate-700 rounded-xl flex flex-col items-center gap-2 cursor-pointer bg-slate-800 text-white";
    }
  });

  // Kontrola bloków formularza Kroku 2 w zależności od wybranego asortymentu
  const materialsBlock = document.getElementById("cabinet-materials-block");
  const countertopBlock = document.getElementById("countertop-options-block");
  const ledBlock = document.getElementById("led-options-block");
  const boxHeight = document.getElementById("dim-height-box");
  const boxDepth = document.getElementById("dim-depth-box");

  if (materialsBlock) materialsBlock.classList.add("hidden");
  if (countertopBlock) countertopBlock.classList.add("hidden");
  if (ledBlock) ledBlock.classList.add("hidden");
  if (boxHeight) boxHeight.classList.remove("hidden");
  if (boxDepth) boxDepth.classList.remove("hidden");

  if (type === "countertop") {
    if (countertopBlock) countertopBlock.classList.remove("hidden");
    if (boxHeight) boxHeight.classList.add("hidden");
    if (
      wizardItem.dimensions.depth === 510 ||
      wizardItem.dimensions.depth === 320
    )
      wizardItem.dimensions.depth = 600;
  } else if (type === "led") {
    if (ledBlock) ledBlock.classList.remove("hidden");
    if (boxHeight) boxHeight.classList.add("hidden");
    if (boxDepth) boxDepth.classList.add("hidden");
    syncLedTempPickerUI();
  } else {
    if (materialsBlock) materialsBlock.classList.remove("hidden");
    wizardItem.dimensions.depth = type === "top" ? 320 : 510;
  }

  updateHintText();
  updateInteriorStepUI();
}

function setInterior(type) {
  wizardItem.interiorType = type;
  const activeCls =
    "flex-1 py-2 px-4 border border-blue-600 bg-blue-900/20 text-blue-400 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer";
  const normalCls =
    "flex-1 py-2 px-4 border border-slate-700 text-slate-400 rounded-xl flex items-center justify-center gap-1 bg-slate-800 cursor-pointer";

  const btnShelves = document.getElementById("btn-opt-shelves");
  const btnDrawers = document.getElementById("btn-opt-drawers");
  if (btnShelves)
    btnShelves.className = type === "shelves" ? activeCls : normalCls;
  if (btnDrawers)
    btnDrawers.className = type === "drawers" ? activeCls : normalCls;

  const ctrlShelves = document.getElementById("ctrl-shelves");
  const ctrlDrawers = document.getElementById("ctrl-drawers");
  if (ctrlShelves) ctrlShelves.classList.toggle("hidden", type !== "shelves");
  if (ctrlDrawers) ctrlDrawers.classList.toggle("hidden", type !== "drawers");

  if (type === "drawers") {
    wizardItem.drawerManualAdjust = false;
    recalculateDrawersMaxDistribution();
    syncDrawerOwnSidesUI();
    updateInteriorStepUI();
  } else {
    updateInteriorStepUI();
  }
}

function renderWizard() {
  document
    .querySelectorAll(".wizard-step")
    .forEach((s) => s.classList.add("hidden"));
  const stepEl = document.getElementById(`step-${currentStep}`);
  if (stepEl) stepEl.classList.remove("hidden");

  const isCabinet = wizardItem.type === "bottom" || wizardItem.type === "top";
  const totalSteps = isCabinet ? 3 : 2;

  const btnBack = document.getElementById("btn-wizard-back");
  if (btnBack) btnBack.disabled = currentStep === 1;

  const progressLbl = document.getElementById("wizard-progress-lbl");
  if (progressLbl)
    progressLbl.innerText = `Krok ${currentStep} z ${totalSteps}`;

  const btnNext = document.getElementById("btn-wizard-next");
  if (btnNext)
    btnNext.innerText =
      currentStep === totalSteps
        ? editIndex !== null
          ? "Zapisz zmiany"
          : "Dodaj do zamówienia"
        : "Dalej";

  const title2 = document.getElementById("step-2-title");
  const lblWidth = document.getElementById("lbl-dim-width");

  if (wizardItem.type === "countertop") {
    if (title2) title2.innerText = "2. Parametry i wymiary blatu";
    if (lblWidth) lblWidth.innerText = "Długość całkowita blatu (mm)";
  } else if (wizardItem.type === "led") {
    if (title2)
      title2.innerText = "2. Konfiguracja profilu oświetleniowego LED";
    if (lblWidth) lblWidth.innerText = "Długość odcinka LED (mm)";
  } else {
    if (title2) title2.innerText = "2. Gabaryty zewnętrzne szafki";
    if (lblWidth) lblWidth.innerText = "Szerokość zewnętrzna korpusu (mm)";
    if (currentStep === 3) {
      setInterior(wizardItem.interiorType);
    }
  }

  renderSuggestions();
  updateHintText();
  updateInteriorStepUI();
}

function renderSuggestions() {
  const wSugg = document.getElementById("width-suggestions");
  const hSugg = document.getElementById("height-suggestions");

  if (!wSugg) return;

  if (wizardItem.type === "countertop" || wizardItem.type === "led") {
    const list = [600, 1200, 1800, 2400, 3000];
    wSugg.innerHTML = list
      .map(
        (v) =>
          `<button onclick="setDim('width', ${v})" class="text-xs bg-slate-700 px-2 py-1 rounded-md cursor-pointer text-slate-200">${v} mm</button>`,
      )
      .join("");
  } else {
    const widths = [300, 450, 600, 800, 900];
    const heights = wizardItem.type === "top" ? [360, 720, 960] : [720, 820];
    wSugg.innerHTML = widths
      .map(
        (v) =>
          `<button onclick="setDim('width', ${v})" class="text-xs bg-slate-700 px-2 py-1 rounded-md cursor-pointer text-slate-200">${v}</button>`,
      )
      .join("");
    if (hSugg)
      hSugg.innerHTML = heights
        .map(
          (v) =>
            `<button onclick="setDim('height', ${v})" class="text-xs bg-slate-700 px-2 py-1 rounded-md cursor-pointer text-slate-200">${v}</button>`,
        )
        .join("");
  }
}

window.setDim = function (field, val) {
  if (field === "width") {
    setValSafely("input-width", val);
    wizardItem.dimensions.width = val;
  }
  if (field === "height") {
    setValSafely("input-height", val);
    wizardItem.dimensions.height = val;
  }
  recalculateDrawersMaxDistribution();
  updateInteriorStepUI();
};

function updateHintText() {
  let hint = "";
  if (currentStep === 1) hint = ADVISOR_HINTS.step1[wizardItem.type];
  else if (currentStep === 2) hint = ADVISOR_HINTS.step2;
  else hint = ADVISOR_HINTS.step3;
  const hintEl = document.getElementById("wizard-hint-text");
  if (hintEl) hintEl.innerText = hint;
}

function normalizeDrawerHeights() {
  if (wizardItem.type === "countertop" || wizardItem.type === "led") return;
  const totalH = wizardItem.dimensions.height;
  const count = wizardItem.drawersCount;
  const minDrawerHeight = 60;

  while (wizardItem.drawerHeights.length < count) {
    wizardItem.drawerHeights.push(minDrawerHeight);
  }
  while (wizardItem.drawerHeights.length > count) {
    wizardItem.drawerHeights.pop();
  }

  if (count === 0) return;
  if (totalH < count * minDrawerHeight) {
    for (let i = 0; i < count; i++) {
      wizardItem.drawerHeights[i] = minDrawerHeight;
    }
    return;
  }

  const sum = wizardItem.drawerHeights.reduce((a, b) => a + b, 0);
  let targetHeights;

  if (!wizardItem.drawerManualAdjust || sum === 0) {
    const baseHeight = Math.floor(totalH / count);
    let remainder = totalH - baseHeight * count;
    targetHeights = new Array(count).fill(baseHeight);
    for (let i = count - 1; remainder > 0; i--) {
      targetHeights[i] += 1;
      remainder -= 1;
      if (i === 0) i = count;
    }
  } else {
    targetHeights = wizardItem.drawerHeights.map((h) =>
      Math.max(minDrawerHeight, Math.floor((h * totalH) / sum)),
    );
  }

  let adjustedSum = targetHeights.reduce((a, b) => a + b, 0);
  let diff = totalH - adjustedSum;
  const order = [...Array(count).keys()].reverse();
  let idx = 0;

  while (diff !== 0 && idx < count * 20) {
    const current = order[idx % count];
    if (diff > 0) {
      targetHeights[current] += 1;
      diff -= 1;
    } else if (targetHeights[current] > minDrawerHeight) {
      targetHeights[current] -= 1;
      diff += 1;
    }
    idx += 1;
  }

  for (let i = 0; i < count; i++) {
    wizardItem.drawerHeights[i] = targetHeights[i];
  }
}

function recalculateDrawersMaxDistribution() {
  normalizeDrawerHeights();
  renderDrawerSliders();
  updateInteriorStepUI();
}

function renderDrawerSliders() {
  const container = document.getElementById("drawer-sliders-container");
  if (!container) return;

  const lblDrawers = document.getElementById("lbl-drawers-count");
  if (lblDrawers) lblDrawers.innerText = wizardItem.drawersCount;

  container.innerHTML = "";
  wizardItem.drawerHeights.forEach((hValue, index) => {
    const row = document.createElement("div");
    row.className =
      "space-y-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800";
    row.innerHTML = `
      <div class="flex justify-between text-xs font-bold text-slate-300">
        <span>Szuflada nr ${index + 1}</span>
        <span class="font-mono text-blue-400">${hValue} mm</span>
      </div>
      <input type="range" min="60" max="${wizardItem.dimensions.height}" value="${hValue}" data-idx="${index}" class="drawer-single-slider w-full accent-blue-600 cursor-pointer">
    `;
    container.appendChild(row);
  });

  document.querySelectorAll(".drawer-single-slider").forEach((slider) => {
    slider.addEventListener("input", (e) => {
      const idx = parseInt(e.target.getAttribute("data-idx"));
      let newVal = parseInt(e.target.value);
      let sumOthers = 0;
      wizardItem.drawerHeights.forEach((val, i) => {
        if (i !== idx) sumOthers += val;
      });

      const maxAllowed = wizardItem.dimensions.height - sumOthers;
      if (newVal > maxAllowed) {
        newVal = maxAllowed;
        e.target.value = maxAllowed;
      }
      if (newVal < 60) newVal = 60;

      wizardItem.drawerHeights[idx] = newVal;
      wizardItem.drawerManualAdjust = true;

      const totalH = wizardItem.dimensions.height;
      const otherSum = wizardItem.drawerHeights.reduce(
        (sum, h, i) => (i === idx ? sum : sum + h),
        0,
      );
      const remainingHeight = totalH - newVal;

      if (wizardItem.drawersCount > 1 && otherSum > 0) {
        wizardItem.drawerHeights = wizardItem.drawerHeights.map((h, i) => {
          if (i === idx) return newVal;
          return Math.max(60, Math.floor((h * remainingHeight) / otherSum));
        });
      }

      normalizeDrawerHeights();
      renderDrawerSliders();
      updateInteriorStepUI();
      e.target.previousElementSibling.children[1].innerText = `${newVal} mm`;
    });
  });
}

function updateInteriorStepUI() {
  const pBox = document.getElementById("preview-box");
  const alertEl = document.getElementById("interior-validation-alert");
  const btnNext = document.getElementById("btn-wizard-next");

  if (!pBox) return;
  const h = wizardItem.dimensions.height;

  if (
    wizardItem.type !== "countertop" &&
    wizardItem.type !== "led" &&
    wizardItem.interiorType === "drawers"
  ) {
    const usedSum = wizardItem.drawerHeights.reduce((a, b) => a + b, 0);
    const diff = h - usedSum;
    const statusEl = document.getElementById("info-val-status");

    if (statusEl) {
      statusEl.innerText = diff > 0 ? `Luz: ${diff}mm` : `Idealnie: 0mm`;
      statusEl.className =
        diff > 0 ? "font-bold text-amber-500" : "font-bold text-emerald-600";
    }

    const usedEl = document.getElementById("info-val-used");
    if (usedEl) usedEl.innerText = usedSum;

    if (usedSum > h) {
      if (alertEl) {
        alertEl.className = "p-2 bg-red-950/30 text-red-400 rounded-lg text-xs";
        alertEl.innerText = "⚠️ Szuflady przekraczają gabaryt!";
      }
      if (btnNext) btnNext.disabled = true;
    } else {
      if (alertEl) {
        alertEl.className =
          "p-2 bg-green-950/30 text-green-400 rounded-lg text-xs";
        alertEl.innerText = "✓ Gabaryty szuflad poprawne.";
      }
      if (btnNext) btnNext.disabled = false;
    }
  } else {
    if (alertEl) {
      alertEl.className =
        "p-2 bg-green-950/30 text-green-400 rounded-lg text-xs";
      alertEl.innerText = "✓ Element poprawny konstrukcyjnie.";
    }
    if (btnNext) btnNext.disabled = false;
  }

  pBox.className =
    "w-full bg-slate-900/20 p-4 rounded-2xl flex items-center justify-center";
  pBox.innerHTML = generateCabinetFlexTemplate(wizardItem);
}

function getOrderVisualBadge(item) {
  if (item.type === "top") return "GÓRA";
  if (item.type === "countertop") return "BLAT";
  if (item.type === "led") return "LED";
  return "DÓŁ";
}

function getOrderItemTypeLabel(item) {
  if (item.type === "top") return "szafka górna";
  if (item.type === "bottom") return "szafka dolna";
  if (item.type === "countertop") return "blat";
  if (item.type === "led") return "profil LED";
  return "pozycja";
}

function removeOrderItem(index) {
  const item = currentOrder[index];
  if (!item) return;

  const typeLabel = getOrderItemTypeLabel(item);
  if (
    !confirm(
      `Czy na pewno usunąć pozycję #${index + 1} (${typeLabel}) z zamówienia?`,
    )
  ) {
    return;
  }

  currentOrder.splice(index, 1);
  saveOrderToStorage();
  updateMainUI();
}

function createOrderVisualTile(item, index) {
  const tile = document.createElement("div");
  tile.className =
    "order-carousel-item bg-slate-800 border border-slate-700 rounded-2xl p-3 flex flex-col text-white shadow-lg cursor-pointer group";
  tile.setAttribute("data-carousel-item", "");
  tile.addEventListener("click", (e) => {
    if (e.target.closest("[data-order-delete]")) return;
    if (!tile.classList.contains("order-carousel-item--active")) {
      tile.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "smooth",
      });
      return;
    }
    editOrderItem(index);
  });

  const badgeType = getOrderVisualBadge(item);
  tile.innerHTML = `
    <div class="w-full flex justify-between items-center gap-2 text-[10px] text-slate-400 font-bold mb-2 border-b border-slate-700/50 pb-2">
      <span class="group-hover:text-blue-400 transition-colors truncate">#${index + 1} Modyfikuj pozycję 📝</span>
      <div class="flex items-center gap-1.5 shrink-0">
        <span class="px-1.5 py-0.5 border border-slate-600 bg-slate-900 rounded text-[9px] font-mono text-slate-300">${badgeType}</span>
        <button type="button" data-order-delete class="no-print w-7 h-7 flex items-center justify-center rounded-lg border border-red-900/60 bg-red-950/50 text-red-400 hover:bg-red-900/60 hover:text-red-300 hover:border-red-500 cursor-pointer transition-colors" title="Usuń z zamówienia" aria-label="Usuń pozycję #${index + 1}">🗑</button>
      </div>
    </div>
    ${generateCabinetFlexTemplate(item, { compact: true })}
  `;

  const deleteBtn = tile.querySelector("[data-order-delete]");
  deleteBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    removeOrderItem(index);
  });

  return tile;
}

function getCarouselScrollStep(trackEl) {
  const item = trackEl?.querySelector("[data-carousel-item]");
  if (item) return item.offsetWidth + 8;
  return Math.floor(trackEl.clientWidth / 3);
}

function updateCarouselActiveSlide(trackEl) {
  if (!trackEl) return;
  const items = trackEl.querySelectorAll("[data-carousel-item]");
  if (!items.length) return;

  const trackRect = trackEl.getBoundingClientRect();
  const centerX = trackRect.left + trackRect.width / 2;

  let activeIdx = 0;
  let minDist = Infinity;
  items.forEach((item, i) => {
    const r = item.getBoundingClientRect();
    const dist = Math.abs(centerX - (r.left + r.width / 2));
    if (dist < minDist) {
      minDist = dist;
      activeIdx = i;
    }
  });

  items.forEach((item, i) => {
    item.classList.toggle("order-carousel-item--active", i === activeIdx);
  });
}

function refreshOrderCarouselButtons(trackEl, prevBtn, nextBtn) {
  if (!trackEl) return;
  const items = trackEl.querySelectorAll("[data-carousel-item]");
  const count = items.length;
  const hasMultiple = count > 1;
  const activeIdx = [...items].findIndex((el) =>
    el.classList.contains("order-carousel-item--active"),
  );

  if (prevBtn) {
    prevBtn.classList.toggle("hidden", !hasMultiple);
    prevBtn.disabled = !hasMultiple || activeIdx <= 0;
  }
  if (nextBtn) {
    nextBtn.classList.toggle("hidden", !hasMultiple);
    nextBtn.disabled = !hasMultiple || activeIdx >= count - 1;
  }
}

function bindOrderCarousel(trackEl, prevBtn, nextBtn) {
  if (!trackEl) return;
  if (!trackEl.dataset.carouselBound) {
    trackEl.dataset.carouselBound = "1";
    prevBtn?.addEventListener("click", () => {
      const step = getCarouselScrollStep(trackEl);
      trackEl.scrollBy({ left: -step, behavior: "smooth" });
    });
    nextBtn?.addEventListener("click", () => {
      const step = getCarouselScrollStep(trackEl);
      trackEl.scrollBy({ left: step, behavior: "smooth" });
    });
    trackEl.addEventListener("scroll", () => {
      updateCarouselActiveSlide(trackEl);
      refreshOrderCarouselButtons(trackEl, prevBtn, nextBtn);
    });
  }
  updateCarouselActiveSlide(trackEl);
  refreshOrderCarouselButtons(trackEl, prevBtn, nextBtn);
}

function initCarouselTrack(trackEl) {
  if (!trackEl) return;
  trackEl.scrollLeft = 0;
  requestAnimationFrame(() => {
    updateCarouselActiveSlide(trackEl);
    const frame = trackEl.closest(".order-carousel-frame");
    const prevBtn = frame?.querySelector(".order-carousel-btn--prev");
    const nextBtn = frame?.querySelector(".order-carousel-btn--next");
    refreshOrderCarouselButtons(trackEl, prevBtn, nextBtn);
  });
}

function populateOrderCarousel(trackEl, entries) {
  if (!trackEl) return;
  trackEl.innerHTML = "";
  entries.forEach(({ item, index }) => {
    trackEl.appendChild(createOrderVisualTile(item, index));
  });
  initCarouselTrack(trackEl);
}

function renderOrderVisualWall() {
  const topTrack = document.getElementById("order-visual-top");
  const bottomTrack = document.getElementById("order-visual-bottom");
  const topEmpty = document.getElementById("order-visual-top-empty");
  const bottomEmpty = document.getElementById("order-visual-bottom-empty");
  const accessoriesSection = document.getElementById("order-visual-accessories");
  const accessoriesInner = document.getElementById("order-visual-accessories-inner");

  const topEntries = [];
  const bottomEntries = [];
  const accessoryEntries = [];

  currentOrder.forEach((item, index) => {
    if (item.type === "top") topEntries.push({ item, index });
    else if (item.type === "bottom") bottomEntries.push({ item, index });
    else if (item.type === "countertop" || item.type === "led")
      accessoryEntries.push({ item, index });
  });

  populateOrderCarousel(topTrack, topEntries);
  populateOrderCarousel(bottomTrack, bottomEntries);

  if (topEmpty) topEmpty.classList.toggle("hidden", topEntries.length > 0);
  if (bottomEmpty)
    bottomEmpty.classList.toggle("hidden", bottomEntries.length > 0);

  bindOrderCarousel(
    topTrack,
    document.getElementById("carousel-top-prev"),
    document.getElementById("carousel-top-next"),
  );
  bindOrderCarousel(
    bottomTrack,
    document.getElementById("carousel-bottom-prev"),
    document.getElementById("carousel-bottom-next"),
  );

  if (accessoriesInner) {
    accessoriesInner.innerHTML = "";
    accessoryEntries.forEach(({ item, index }) => {
      const tile = createOrderVisualTile(item, index);
      tile.classList.remove("order-carousel-item");
      tile.classList.add("w-full");
      accessoriesInner.appendChild(tile);
    });
  }
  if (accessoriesSection) {
    accessoriesSection.classList.toggle("hidden", accessoryEntries.length === 0);
  }

  requestAnimationFrame(() => {
    initCarouselTrack(topTrack);
    initCarouselTrack(bottomTrack);
  });
}

if (!window.__makazuCarouselResizeBound) {
  window.__makazuCarouselResizeBound = true;
  window.addEventListener("resize", () => {
    if (currentOrder.length === 0) return;
    ["order-visual-top", "order-visual-bottom"].forEach((id) => {
      const track = document.getElementById(id);
      if (track) updateCarouselActiveSlide(track);
    });
  });
}

function updateMainUI() {
  console.log(
    "[makazu] (app.js) updateMainUI called - currentOrder.length:",
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

  setOrderViewTab(orderViewTab);

  if (tablesWrapper) {
    tablesWrapper.innerHTML = "";
    let cabinetItems = [];
    let linearItems = [];

    currentOrder.forEach((item, idx) => {
      if (item.type === "bottom" || item.type === "top") {
        cabinetItems.push({ item, idx });
      } else {
        linearItems.push({ item, idx });
      }
    });

    cabinetItems.forEach(({ item, idx }) => {
      const cabinetBox = document.createElement("div");
      cabinetBox.className =
        "bg-slate-900/40 p-4 rounded-xl border border-slate-700 space-y-2";
      const typeLabel =
        item.type === "bottom" ? "SZAFKA DOLNA" : "SZAFKA GÓRNA WISZĄCA";
      const interiorLabel =
        item.interiorType === "shelves"
          ? `Półki (${item.shelvesCount} szt.)`
          : `Szuflady (${item.drawersCount} szt.)${item.drawerOwnSides === false ? " · system prowadnic" : ""}`;

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

function generateCabinetBOMRows(item, idx) {
  const parts =
    typeof calculateItemBOM === "function"
      ? calculateItemBOM(item, idx)
      : [];

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
