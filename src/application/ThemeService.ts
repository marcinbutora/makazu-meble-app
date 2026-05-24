import { StorageService } from "../infrastructure/StorageService.js";

export type Theme = "dark" | "light";

export class ThemeService {
  private current: Theme;

  constructor(private storage: StorageService) {
    this.current = this.storage.loadTheme();
    this.apply();
  }

  get theme(): Theme {
    return this.current;
  }

  get isLight(): boolean {
    return this.current === "light";
  }

  get buttonIcon(): string {
    return this.isLight ? "🌙" : "☀️";
  }

  toggle(): Theme {
    this.current = this.isLight ? "dark" : "light";
    this.apply();
    this.storage.saveTheme(this.current);
    return this.current;
  }

  private apply(): void {
    document.documentElement.classList.toggle("theme-light", this.isLight);
  }
}
