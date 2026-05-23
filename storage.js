// storage.js
function loadContractor() {
  const saved = localStorage.getItem("makazu_contractor");
  if (saved) {
    contractorProfile = JSON.parse(saved);
    const el = document.getElementById("nav-contractor-name");
    if (el) el.innerText = contractorProfile.name || "Dane Wykonawcy";
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
