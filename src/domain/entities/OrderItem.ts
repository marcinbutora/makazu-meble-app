import { Dimensions } from "../value-objects/Dimensions.js";

export type CabinetType = "bottom" | "top" | "corner" | "countertop" | "led";
export type InteriorType = "shelves" | "drawers";
export type LedMountType = "recessed" | "surface";
export type CornerType = "blind" | "diagonal" | "open";
export type KidneyType = "pull-out" | "rotating";

export interface OrderItemParams {
  type?: CabinetType;
  dimensions?: Dimensions;
  colorBody?: string;
  colorFront?: string;
  handleType?: string;
  interiorType?: InteriorType;
  shelvesCount?: number;
  drawersCount?: number;
  drawerHeights?: number[];
  drawerManualAdjust?: boolean;
  drawerOwnSides?: boolean;
  countertopColor?: string;
  countertopThickness?: number;
  ledType?: LedMountType;
  ledColorTemperature?: string;
  ledProfileColor?: string;
  cornerType?: CornerType;
  kidneyType?: KidneyType;
  kidneyShelvesCount?: number;
  cornerFrontWidth?: number;
  cornerDepthLeft?: number;
  cornerDepthRight?: number;
}

export class OrderItem {
  readonly type: CabinetType;
  dimensions: Dimensions;
  colorBody: string;
  colorFront: string;
  handleType: string;
  interiorType: InteriorType;
  shelvesCount: number;
  drawersCount: number;
  drawerHeights: number[];
  drawerManualAdjust: boolean;
  drawerOwnSides: boolean;
  countertopColor: string;
  countertopThickness: number;
  ledType: LedMountType;
  ledColorTemperature: string;
  ledProfileColor: string;
  cornerType: CornerType;
  kidneyType: KidneyType;
  kidneyShelvesCount: number;
  cornerFrontWidth: number;
  cornerDepthLeft: number;
  cornerDepthRight: number;

  constructor(params: OrderItemParams = {}) {
    const type = params.type ?? "bottom";
    this.type = type;
    this.dimensions = params.dimensions ?? Dimensions.defaultFor(type);
    this.colorBody = params.colorBody ?? "Biały Alpejski U12188";
    this.colorFront = params.colorFront ?? "Dąb Craft Złoty K003";
    this.handleType = params.handleType ?? "Krawędziowy Czarny Mat";
    this.interiorType = params.interiorType ?? "shelves";
    this.shelvesCount = params.shelvesCount ?? 2;
    this.drawersCount = params.drawersCount ?? 3;
    this.drawerHeights = params.drawerHeights ?? [140, 280, 280];
    this.drawerManualAdjust = params.drawerManualAdjust ?? false;
    this.drawerOwnSides = params.drawerOwnSides ?? true;
    this.countertopColor = params.countertopColor ?? "Dąb Werona K002";
    this.countertopThickness = params.countertopThickness ?? 38;
    this.ledType = params.ledType ?? "recessed";
    this.ledColorTemperature = params.ledColorTemperature ?? "4000K";
    this.ledProfileColor = params.ledProfileColor ?? "Anodowane Srebrne";
    this.cornerType = params.cornerType ?? "blind";
    this.kidneyType = params.kidneyType ?? "pull-out";
    this.kidneyShelvesCount = params.kidneyShelvesCount ?? 3;
    this.cornerFrontWidth = params.cornerFrontWidth ?? 400;
    this.cornerDepthLeft = params.cornerDepthLeft ?? 510;
    this.cornerDepthRight = params.cornerDepthRight ?? 510;
  }

  get isCabinet(): boolean {
    return this.type === "bottom" || this.type === "top" || this.type === "corner";
  }

  get typeLabel(): string {
    const labels: Record<CabinetType, string> = {
      bottom: "szafka dolna",
      top: "szafka górna",
      corner: "szafka narożna",
      countertop: "blat",
      led: "profil LED",
    };
    return labels[this.type] ?? "pozycja";
  }

  get typeBadge(): string {
    const badges: Record<CabinetType, string> = {
      bottom: "DÓŁ",
      top: "GÓRA",
      corner: "NAROŻ",
      countertop: "BLAT",
      led: "LED",
    };
    return badges[this.type] ?? "";
  }

  get isLinear(): boolean {
    return this.type === "countertop" || this.type === "led";
  }

  get totalDrawerHeight(): number {
    return this.drawerHeights.reduce((a, b) => a + b, 0);
  }

  get drawerHeightRemaining(): number {
    return this.dimensions.height - this.totalDrawerHeight;
  }

  clone(): OrderItem {
    return new OrderItem({
      type: this.type,
      dimensions: this.dimensions,
      colorBody: this.colorBody,
      colorFront: this.colorFront,
      handleType: this.handleType,
      interiorType: this.interiorType,
      shelvesCount: this.shelvesCount,
      drawersCount: this.drawersCount,
      drawerHeights: [...this.drawerHeights],
      drawerManualAdjust: this.drawerManualAdjust,
      drawerOwnSides: this.drawerOwnSides,
      countertopColor: this.countertopColor,
      countertopThickness: this.countertopThickness,
      ledType: this.ledType,
      ledColorTemperature: this.ledColorTemperature,
      ledProfileColor: this.ledProfileColor,
      cornerType: this.cornerType,
      kidneyType: this.kidneyType,
      kidneyShelvesCount: this.kidneyShelvesCount,
      cornerFrontWidth: this.cornerFrontWidth,
      cornerDepthLeft: this.cornerDepthLeft,
      cornerDepthRight: this.cornerDepthRight,
    });
  }

  normalizeDrawerHeights(): void {
    if (this.isLinear) return;
    const totalH = this.dimensions.height;
    const count = this.drawersCount;
    const minHeight = 60;

    while (this.drawerHeights.length < count) {
      this.drawerHeights.push(minHeight);
    }
    while (this.drawerHeights.length > count) {
      this.drawerHeights.pop();
    }
    if (count === 0) return;
    if (totalH < count * minHeight) {
      this.drawerHeights = new Array(count).fill(minHeight);
      return;
    }

    const sum = this.drawerHeights.reduce((a, b) => a + b, 0);
    let targetHeights: number[];

    if (!this.drawerManualAdjust || sum === 0) {
      const base = Math.floor(totalH / count);
      let rem = totalH - base * count;
      targetHeights = new Array(count).fill(base);
      for (let i = count - 1; rem > 0; i--) {
        targetHeights[i] += 1;
        rem -= 1;
        if (i === 0) i = count;
      }
    } else {
      targetHeights = this.drawerHeights.map(h =>
        Math.max(minHeight, Math.floor((h * totalH) / sum)),
      );
    }

    let adjSum = targetHeights.reduce((a, b) => a + b, 0);
    let diff = totalH - adjSum;
    const order = [...Array(count).keys()].reverse();
    let idx = 0;
    while (diff !== 0 && idx < count * 20) {
      const i = order[idx % count];
      if (diff > 0) { targetHeights[i] += 1; diff -= 1; }
      else if (targetHeights[i] > minHeight) { targetHeights[i] -= 1; diff += 1; }
      idx++;
    }

    this.drawerHeights = targetHeights;
  }

  setDrawerHeight(index: number, value: number): void {
    const sumOthers = this.drawerHeights.reduce(
      (s, h, i) => (i === index ? s : s + h), 0,
    );
    const maxAllowed = this.dimensions.height - sumOthers;
    const clamped = Math.max(60, Math.min(value, maxAllowed));
    this.drawerManualAdjust = true;

    if (this.drawersCount > 1 && sumOthers > 0) {
      const remaining = this.dimensions.height - clamped;
      this.drawerHeights = this.drawerHeights.map((h, i) =>
        i === index ? clamped : Math.max(60, Math.floor((h * remaining) / sumOthers)),
      );
    } else {
      this.drawerHeights[index] = clamped;
    }

    this.normalizeDrawerHeights();
  }
}
