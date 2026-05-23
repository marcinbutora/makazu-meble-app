// state.js
// Centralny stan aplikacji
let currentOrder = [];
let contractorProfile = { name: "", nip: "", email: "", phone: "" };
let currentStep = 1;
let editIndex = null;

let wizardItem = {
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

const ADVISOR_HINTS = {
  step1: {
    bottom: "Szafka dolna standardowa. Głębokość korpusu wynosi 510mm.",
    top: "Szafka wisząca/górna. Maksymalna zalecana głębokość to 320mm.",
    countertop:
      "Blat kuchenny. Możesz zdefiniować długość, głębokość, grubość oraz dekor.",
    led: "Profil oświetleniowy LED. Wybierz typ profilu, barwę światła oraz długość odcinka.",
  },
  step2:
    "Określ wymiary gabarytowe oraz parametry techniczne i wizualne wybranego elementu.",
  step3:
    "Ustaw wysokości szuflad. Opcjonalnie wyłącz własne boki, gdy używasz systemu prowadnic z gotowymi elementami.",
};

const setValSafely = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.value = value;
};

