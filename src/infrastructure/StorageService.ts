import { OrderItem } from "../domain/entities/OrderItem.js";
import { Contractor } from "../domain/entities/Contractor.js";
import { Theme } from "../application/ThemeService.js";

const KEYS = {
  ORDER: "makazu_current_order",
  CONTRACTOR: "makazu_contractor",
  THEME: "makazu_theme",
} as const;

export class StorageService {
  loadOrder(): Record<string, unknown>[] | null {
    try {
      const raw = localStorage.getItem(KEYS.ORDER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveOrder(items: OrderItem[]): void {
    localStorage.setItem(KEYS.ORDER, JSON.stringify(items));
  }

  loadContractor(): Record<string, string> | null {
    try {
      const raw = localStorage.getItem(KEYS.CONTRACTOR);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveContractor(contractor: Contractor): void {
    localStorage.setItem(KEYS.CONTRACTOR, JSON.stringify(contractor));
  }

  loadTheme(): Theme {
    try {
      const raw = localStorage.getItem(KEYS.THEME);
      if (raw === "light" || raw === "dark") return raw;
    } catch {
      /* ignore */
    }
    return "dark";
  }

  saveTheme(theme: Theme): void {
    localStorage.setItem(KEYS.THEME, theme);
  }
}
