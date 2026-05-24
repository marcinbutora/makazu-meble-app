import { StorageService } from "../infrastructure/StorageService.js";

export type CabinetCategory = "bottom" | "top" | "corner" | "countertop" | "led";

export interface ToggleConfig {
  bottom: boolean;
  top: boolean;
  corner: boolean;
  countertop: boolean;
  led: boolean;
}

const DEFAULT_CONFIG: ToggleConfig = {
  bottom: true,
  top: true,
  corner: true,
  countertop: true,
  led: true,
};

const KEY = "makazu_toggles";

export class ToggleService {
  private config: ToggleConfig;

  constructor(private storage: StorageService) {
    this.config = this.load();
  }

  private load(): ToggleConfig {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_CONFIG };
  }

  private save(): void {
    localStorage.setItem(KEY, JSON.stringify(this.config));
  }

  getConfig(): ToggleConfig {
    return { ...this.config };
  }

  isEnabled(category: CabinetCategory): boolean {
    return this.config[category];
  }

  setEnabled(category: CabinetCategory, value: boolean): void {
    this.config[category] = value;
    this.save();
  }

  toggle(category: CabinetCategory): void {
    this.config[category] = !this.config[category];
    this.save();
  }

  anyEnabled(): boolean {
    return Object.values(this.config).some(v => v);
  }
}
