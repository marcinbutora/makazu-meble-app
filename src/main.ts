import { StorageService } from "./infrastructure/StorageService.js";
import { OrderService } from "./application/OrderService.js";
import { WizardService } from "./application/WizardService.js";
import { ThemeService } from "./application/ThemeService.js";
import { Renderer } from "./presentation/Renderer.js";
import { ThemeUI } from "./presentation/ThemeUI.js";
import { ContractorUI } from "./presentation/ContractorUI.js";
import { WizardUI } from "./presentation/WizardUI.js";
import { OrderUI } from "./presentation/OrderUI.js";

function main(): void {
  const storage = new StorageService();
  const orderService = new OrderService(storage);
  const wizardService = new WizardService();
  const themeService = new ThemeService(storage);
  const renderer = new Renderer();

  const wizardUI = new WizardUI(wizardService, orderService, renderer);
  const orderUI = new OrderUI(orderService, renderer, (index) => wizardUI.openForEdit(index));
  wizardUI.onSave = () => orderUI.refresh();
  new ThemeUI(themeService, renderer);
  new ContractorUI(orderService, renderer);

  // expose for inline onclick handlers
  (window as any).__wiz = wizardUI;
  (window as any).__orderUI = orderUI;

  // initial render
  orderUI.refresh();
}

document.addEventListener("DOMContentLoaded", main);
