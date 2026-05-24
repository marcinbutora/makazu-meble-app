import { ThemeService } from "../application/ThemeService.js";
import { Renderer } from "./Renderer.js";

export class ThemeUI {
  private btn: HTMLElement | null;

  constructor(
    private themeService: ThemeService,
    private renderer: Renderer,
  ) {
    this.btn = renderer.getEl("btn-toggle-theme");
    if (this.btn) {
      this.btn.textContent = themeService.buttonIcon;
      this.btn.addEventListener("click", () => this.handleToggle());
    }
  }

  private handleToggle(): void {
    this.themeService.toggle();
    if (this.btn) {
      this.btn.textContent = this.themeService.buttonIcon;
    }
  }
}
