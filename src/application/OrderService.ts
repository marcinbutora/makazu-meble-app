import { OrderItem } from "../domain/entities/OrderItem.js";
import { Contractor } from "../domain/entities/Contractor.js";
import { BOMService } from "../domain/services/BOMService.js";
import { PreviewService } from "../domain/services/PreviewService.js";
import { StorageService } from "../infrastructure/StorageService.js";

export class OrderService {
  private items: OrderItem[] = [];
  private contractor: Contractor = new Contractor();
  private bomService = new BOMService();
  private previewService = new PreviewService();

  constructor(private storage: StorageService) {
    this.load();
  }

  getItems(): OrderItem[] {
    return this.items;
  }

  getContractor(): Contractor {
    return this.contractor;
  }

  addItem(item: OrderItem): void {
    this.items.push(item);
    this.save();
  }

  updateItem(index: number, item: OrderItem): void {
    if (index >= 0 && index < this.items.length) {
      this.items[index] = item.clone();
      this.save();
    }
  }

  removeItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.save();
    }
  }

  clear(): void {
    this.items = [];
    this.save();
  }

  updateContractor(c: Contractor): void {
    this.contractor = c.clone();
    this.storage.saveContractor(this.contractor);
  }

  getBomRows(item: OrderItem, index: number): string {
    return this.bomService.toHtmlRows(item, index);
  }

  getPreview(item: OrderItem, compact = false): string {
    return this.previewService.render(item, compact);
  }

  getCabinetItems(): { item: OrderItem; idx: number }[] {
    return this.items
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => !item.isLinear);
  }

  getLinearItems(): { item: OrderItem; idx: number }[] {
    return this.items
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.isLinear);
  }

  private load(): void {
    const saved = this.storage.loadOrder();
    if (saved) {
      this.items = saved.map((d: Record<string, unknown>) => new OrderItem(d as any));
    }
    const contractorData = this.storage.loadContractor();
    if (contractorData) {
      this.contractor = new Contractor(contractorData);
    }
  }

  private save(): void {
    this.storage.saveOrder(this.items);
  }
}
