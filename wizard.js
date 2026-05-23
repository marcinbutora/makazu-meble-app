// wizard.js
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

// Słupek: normalizacja slotów i UI
function normalizeColumnSlots() {
  if (wizardItem.type !== "column") return;
  const totalH = wizardItem.dimensions.height;
  const slots = wizardItem.columnSlots || [];
  const minH = 100; // minimalna wysokość slotu

  while (slots.length === 0)
    slots.push({
      kind: "shelf",
      height: Math.max(minH, Math.floor(totalH / 3)),
    });
  // ensure heights array length matches
  let sum = slots.reduce((s, v) => s + (v.height || 0), 0);
  if (!wizardItem.columnManualAdjust || sum === 0) {
    const base = Math.floor(totalH / slots.length);
    let rem = totalH - base * slots.length;
    for (let i = 0; i < slots.length; i++) {
      slots[i].height = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem -= 1;
    }
  } else {
    // scale proportionally but respect minH
    let s = slots.reduce((a, b) => a + (b.height || 0), 0);
    if (s === 0) s = slots.length * minH;
    slots.forEach((sl) => {
      sl.height = Math.max(minH, Math.floor((sl.height * totalH) / s));
    });
    // adjust diff
    let adjSum = slots.reduce((a, b) => a + (b.height || 0), 0);
    let diff = totalH - adjSum;
    let idx = 0;
    while (diff !== 0 && idx < slots.length * 10) {
      const i = idx % slots.length;
      if (diff > 0) {
        slots[i].height += 1;
        diff -= 1;
      } else if (slots[i].height > minH) {
        slots[i].height -= 1;
        diff += 1;
      }
      idx++;
    }
  }
  wizardItem.columnSlots = slots;
}

function recalculateColumnDistribution() {
  normalizeColumnSlots();
  renderColumnSlotsUI();
  updateInteriorStepUI();
}

function renderColumnSlotsUI() {
  const container = document.getElementById("column-slots-container");
  if (!container) return;
  container.innerHTML = "";
  (wizardItem.columnSlots || []).forEach((slot, idx) => {
    const row = document.createElement("div");
    row.className = "flex items-center gap-2 bg-slate-900 p-2 rounded";
    row.innerHTML = `
      <div class="text-xs w-6">#${idx + 1}</div>
      <select data-idx="${idx}" class="slot-kind text-xs bg-slate-800 p-1 rounded">
        <option value="shelf">Półka</option>
        <option value="oven">Piekarnik</option>
        <option value="microwave">Mikrofala</option>
      </select>
      <input type="number" data-idx="${idx}" class="slot-height text-xs p-1 rounded w-20" value="${slot.height}" min="50"> <span class="text-xs text-slate-400">mm</span>
      <div class="ml-auto flex items-center gap-1">
        <button data-action="up" data-idx="${idx}" class="px-2 py-1 bg-slate-700 rounded text-xs">▲</button>
        <button data-action="down" data-idx="${idx}" class="px-2 py-1 bg-slate-700 rounded text-xs">▼</button>
        <button data-action="delete" data-idx="${idx}" class="px-2 py-1 bg-red-700 rounded text-xs">Usuń</button>
      </div>
    `;
    container.appendChild(row);
  });

  // bind events
  container.querySelectorAll(".slot-kind").forEach((sel) => {
    sel.value = wizardItem.columnSlots[parseInt(sel.dataset.idx)].kind;
    sel.addEventListener("change", (e) => {
      const i = parseInt(e.target.dataset.idx);
      wizardItem.columnSlots[i].kind = e.target.value;
      updateInteriorStepUI();
    });
  });
  container.querySelectorAll(".slot-height").forEach((inp) => {
    inp.addEventListener("change", (e) => {
      const i = parseInt(e.target.dataset.idx);
      let v = parseInt(e.target.value) || 50;
      wizardItem.columnSlots[i].height = v;
      wizardItem.columnManualAdjust = true;
      recalculateColumnDistribution();
    });
  });
  container.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const act = btn.dataset.action;
      const i = parseInt(btn.dataset.idx);
      if (act === "up" && i > 0) {
        const a = wizardItem.columnSlots.splice(i, 1)[0];
        wizardItem.columnSlots.splice(i - 1, 0, a);
      }
      if (act === "down" && i < wizardItem.columnSlots.length - 1) {
        const a = wizardItem.columnSlots.splice(i, 1)[0];
        wizardItem.columnSlots.splice(i + 1, 0, a);
      }
      if (act === "delete") {
        wizardItem.columnSlots.splice(i, 1);
      }
      recalculateColumnDistribution();
    });
  });
}

// bind buttons
document.addEventListener("DOMContentLoaded", () => {
  const add = document.getElementById("btn-column-add-slot");
  if (add)
    add.addEventListener("click", () => {
      wizardItem.columnSlots.push({
        kind: "shelf",
        height: Math.floor(
          wizardItem.dimensions.height / (wizardItem.columnSlots.length + 1),
        ),
      });
      wizardItem.columnManualAdjust = false;
      recalculateColumnDistribution();
    });
  const reset = document.getElementById("btn-column-reset");
  if (reset)
    reset.addEventListener("click", () => {
      wizardItem.columnSlots = [
        { kind: "shelf", height: 240 },
        { kind: "shelf", height: 240 },
        { kind: "shelf", height: 240 },
      ];
      wizardItem.columnManualAdjust = false;
      recalculateColumnDistribution();
    });
});

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

  if (wizardItem.interiorType === "shelves") {
    const elShelves = document.getElementById("input-shelves-count");
    if (elShelves) elShelves.value = wizardItem.shelvesCount;
    const lblShelves = document.getElementById("lbl-shelves-count");
    if (lblShelves) lblShelves.innerText = wizardItem.shelvesCount;
  }

  if (wizardItem.drawerManualAdjust === undefined) {
    wizardItem.drawerManualAdjust = false;
  }

  selectType(wizardItem.type);
  openWizardModal();
};

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
  } else {
    if (materialsBlock) materialsBlock.classList.remove("hidden");
    wizardItem.dimensions.depth = type === "top" ? 320 : 510;
  }

  // pokaż kontrolki słupka kiedy wybrano typ 'column'
  const ctrlColumn = document.getElementById("ctrl-column");
  if (ctrlColumn) ctrlColumn.classList.toggle("hidden", type !== "column");

  if (type === "column") {
    // ustaw domyślne sloty jeśli brak
    if (
      !Array.isArray(wizardItem.columnSlots) ||
      wizardItem.columnSlots.length === 0
    ) {
      wizardItem.columnSlots = [
        { kind: "shelf", height: 240 },
        { kind: "shelf", height: 240 },
        { kind: "shelf", height: 240 },
      ];
    }
    recalculateColumnDistribution();
  }

  updateHintText();
  updateInteriorStepUI();
}

function setInterior(type) {
  wizardItem.interiorType = type;
  const btnShelves = document.getElementById("btn-opt-shelves");
  const btnDrawers = document.getElementById("btn-opt-drawers");
  if (btnShelves)
    btnShelves.className =
      type === "shelves"
        ? "flex-1 py-2 px-4 border border-blue-600 bg-blue-900/20 text-blue-400 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
        : "flex-1 py-2 px-4 border border-slate-700 text-slate-400 rounded-xl flex items-center justify-center gap-1 bg-slate-800 cursor-pointer";
  if (btnDrawers)
    btnDrawers.className =
      type === "drawers"
        ? "flex-1 py-2 px-4 border border-blue-600 bg-blue-900/20 text-blue-400 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
        : "flex-1 py-2 px-4 border border-slate-700 text-slate-400 rounded-xl flex items-center justify-center gap-1 bg-slate-800 cursor-pointer";

  const ctrlShelves = document.getElementById("ctrl-shelves");
  const ctrlDrawers = document.getElementById("ctrl-drawers");
  if (ctrlShelves) ctrlShelves.classList.toggle("hidden", type !== "shelves");
  if (ctrlDrawers) ctrlDrawers.classList.toggle("hidden", type !== "drawers");

  if (type === "drawers") {
    wizardItem.drawerManualAdjust = false;
    recalculateDrawersMaxDistribution();
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
