import { OrderService } from "../application/OrderService.js";
import { Contractor } from "../domain/entities/Contractor.js";
import { Renderer } from "./Renderer.js";

export class ContractorUI {
  constructor(
    private orderService: OrderService,
    private renderer: Renderer,
  ) {
    this.bind();
    this.syncNav();
  }

  private bind(): void {
    this.renderer.getEl("btn-open-contractor")?.addEventListener("click", () =>
      this.renderer.openModal("contractor-modal", "contractor-modal-card"),
    );
    this.renderer.getEl("btn-close-contractor")?.addEventListener("click", () =>
      this.renderer.closeModal("contractor-modal", "contractor-modal-card"),
    );
    this.renderer.getEl("btn-save-contractor")?.addEventListener("click", () => this.save());
  }

  private save(): void {
    const getVal = (id: string): string =>
      (this.renderer.getEl<HTMLInputElement>(id)?.value ?? "");

    const c = new Contractor({
      name: getVal("input-cfg-name"),
      nip: getVal("input-cfg-nip"),
      email: getVal("input-cfg-email"),
      phone: getVal("input-cfg-phone"),
    });

    this.orderService.updateContractor(c);
    this.renderer.closeModal("contractor-modal", "contractor-modal-card");
    this.syncNav();
  }

  private syncNav(): void {
    const c = this.orderService.getContractor();
    this.renderer.setText("nav-contractor-name", c.name || "Dane Wykonawcy");
    this.renderer.setVal("input-cfg-name", c.name);
    this.renderer.setVal("input-cfg-nip", c.nip);
    this.renderer.setVal("input-cfg-email", c.email);
    this.renderer.setVal("input-cfg-phone", c.phone);
  }
}
