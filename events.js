// events.js
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
  const printBtn = document.getElementById("btn-print-pdf");
  if (printBtn) printBtn.addEventListener("click", () => window.print());

  const clearBtn = document.getElementById("btn-clear-order");
  if (clearBtn)
    clearBtn.addEventListener("click", () => {
      if (confirm("Czy na pewno chcesz wyczyścić całe obecne zamówienie?")) {
        currentOrder = [];
        saveOrderToStorage();
        updateMainUI();
      }
    });

  const openContractor = document.getElementById("btn-open-contractor");
  if (openContractor)
    openContractor.addEventListener("click", () =>
      openModalAnimated("contractor-modal", "contractor-modal-card"),
    );
  const closeContractor = document.getElementById("btn-close-contractor");
  if (closeContractor)
    closeContractor.addEventListener("click", () =>
      closeModalAnimated("contractor-modal", "contractor-modal-card"),
    );

  const saveContractor = document.getElementById("btn-save-contractor");
  if (saveContractor)
    saveContractor.addEventListener("click", () => {
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
      const nav = document.getElementById("nav-contractor-name");
      if (nav) nav.innerText = contractorProfile.name || "Dane Wykonawcy";
      closeModalAnimated("contractor-modal", "contractor-modal-card");
      updateMainUI();
    });

  const startBtn = document.getElementById("btn-start-wizard");
  if (startBtn)
    startBtn.addEventListener("click", () => {
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
      setValSafely(
        "input-countertop-thickness",
        wizardItem.countertopThickness,
      );
      setValSafely("input-led-type", wizardItem.ledType);
      setValSafely("input-led-temp", wizardItem.ledColorTemperature);
      setValSafely("input-led-profile-color", wizardItem.ledProfileColor);

      selectType("bottom");
      openWizardModal();
    });

  const closeWizard = document.getElementById("btn-close-wizard");
  if (closeWizard)
    closeWizard.addEventListener("click", () => {
      const modal = document.getElementById("wizard-modal");
      if (modal) modal.classList.add("hidden");
    });

  const backBtn = document.getElementById("btn-wizard-back");
  if (backBtn)
    backBtn.addEventListener("click", () => {
      if (currentStep > 1) {
        currentStep--;
        renderWizard();
      }
    });

  const nextBtn = document.getElementById("btn-wizard-next");
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      const isCabinet =
        wizardItem.type === "bottom" || wizardItem.type === "top" || wizardItem.type === "column";
      const maxSteps = isCabinet ? 3 : 2;

      if (currentStep < maxSteps) {
        currentStep++;
        renderWizard();
      } else {
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
        const modal = document.getElementById("wizard-modal");
        if (modal) modal.classList.add("hidden");
      }
    });

  document.querySelectorAll(".type-card").forEach((card) => {
    card.addEventListener("click", () =>
      selectType(card.getAttribute("data-type")),
    );
  });

  const btnShelves = document.getElementById("btn-opt-shelves");
  if (btnShelves)
    btnShelves.addEventListener("click", () => setInterior("shelves"));
  const btnDrawers = document.getElementById("btn-opt-drawers");
  if (btnDrawers)
    btnDrawers.addEventListener("click", () => setInterior("drawers"));

  const inputShelves = document.getElementById("input-shelves-count");
  if (inputShelves)
    inputShelves.addEventListener("input", (e) => {
      wizardItem.shelvesCount = Number(e.target.value);
      const lbl = document.getElementById("lbl-shelves-count");
      if (lbl) lbl.innerText = e.target.value;
      updateInteriorStepUI();
    });

  const drawerMinus = document.getElementById("btn-drawer-minus");
  if (drawerMinus)
    drawerMinus.addEventListener("click", () => {
      if (wizardItem.drawersCount > 1) {
        wizardItem.drawersCount--;
        wizardItem.drawerHeights.pop();
        wizardItem.drawerManualAdjust = false;
        recalculateDrawersMaxDistribution();
      }
    });
  const drawerPlus = document.getElementById("btn-drawer-plus");
  if (drawerPlus)
    drawerPlus.addEventListener("click", () => {
      if (wizardItem.drawersCount < 6) {
        wizardItem.drawersCount++;
        wizardItem.drawerHeights.push(150);
        wizardItem.drawerManualAdjust = false;
        recalculateDrawersMaxDistribution();
      }
    });
}

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

  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", (e) => {
        const val = e.target.value;
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
        if (id === "input-led-temp") wizardItem.ledColorTemperature = val;
        if (id === "input-led-profile-color") wizardItem.ledProfileColor = val;

        recalculateDrawersMaxDistribution();
        updateInteriorStepUI();
      });
    }
  });
}
