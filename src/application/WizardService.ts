import { OrderItem, CabinetType, InteriorType, CornerType, KidneyType } from "../domain/entities/OrderItem.js";
import { Dimensions } from "../domain/value-objects/Dimensions.js";
import { PreviewService } from "../domain/services/PreviewService.js";

export interface WizardState {
  item: OrderItem;
  currentStep: number;
  editIndex: number | null;
}

export const ADVISOR_HINTS: {
  step1: Record<string, string>;
  step2: string;
  step3: string;
} = {
  step1: {
    bottom: "Szafka dolna standardowa. Głębokość korpusu wynosi 510mm.",
    top: "Szafka wisząca/górna. Maksymalna zalecana głębokość to 320mm.",
    corner: "Szafka narożna. Wybierz typ: ślepa z nerką, rogowa z frontem pod kątem, lub otwarta L-kształtna.",
    countertop: "Blat kuchenny. Możesz zdefiniować długość, głębokość, grubość oraz dekor.",
    led: "Profil oświetleniowy LED. Wybierz typ profilu, barwę światła oraz długość odcinka.",
  },
  step2: "Określ wymiary gabarytowe oraz parametry techniczne i wizualne wybranego elementu.",
  step3: "Ustaw wysokości szuflad. Opcjonalnie wyłącz własne boki, gdy używasz systemu prowadnic z gotowymi elementami.",
};

export class WizardService {
  private previewService = new PreviewService();
  state: WizardState;

  constructor() {
    this.state = this.freshState();
  }

  freshState(): WizardState {
    return {
      item: new OrderItem(),
      currentStep: 1,
      editIndex: null,
    };
  }

  reset(): void {
    this.state = this.freshState();
  }

  get totalSteps(): number {
    return this.state.item.isCabinet ? 3 : 2;
  }

  get isLastStep(): boolean {
    return this.state.currentStep === this.totalSteps;
  }

  get isFirstStep(): boolean {
    return this.state.currentStep === 1;
  }

  get hint(): string {
    const s = this.state.currentStep;
    if (s === 1) return ADVISOR_HINTS.step1[this.state.item.type] ?? "";
    if (s === 2) return ADVISOR_HINTS.step2;
    return ADVISOR_HINTS.step3;
  }

  get preview(): string {
    return this.previewService.render(this.state.item);
  }

  get progressLabel(): string {
    return `Krok ${this.state.currentStep} z ${this.totalSteps}`;
  }

  get nextButtonLabel(): string {
    if (!this.isLastStep) return "Dalej";
    return this.state.editIndex !== null ? "Zapisz zmiany" : "Dodaj do zamówienia";
  }

  goNext(): boolean {
    if (this.state.currentStep < this.totalSteps) {
      this.state.currentStep++;
      return true;
    }
    return false;
  }

  goBack(): boolean {
    if (this.state.currentStep > 1) {
      this.state.currentStep--;
      return true;
    }
    return false;
  }

  setType(type: CabinetType): void {
    const newItem = new OrderItem({
      ...this.state.item,
      type,
      dimensions: Dimensions.defaultFor(type),
    });
    if (type === "countertop") {
      newItem.dimensions = new Dimensions(newItem.dimensions.width, newItem.dimensions.height, 600);
    } else if (type === "corner") {
      newItem.dimensions = new Dimensions(900, 720, 510);
      newItem.cornerType = "blind";
      newItem.kidneyType = "pull-out";
      newItem.kidneyShelvesCount = 3;
    } else if (!newItem.isLinear) {
      newItem.dimensions = new Dimensions(
        newItem.dimensions.width,
        newItem.dimensions.height,
        type === "top" ? 320 : 510,
      );
    }
    this.state.item = newItem;
  }

  setInterior(type: InteriorType): void {
    this.state.item.interiorType = type;
    if (type === "drawers") {
      this.state.item.drawerManualAdjust = false;
      this.state.item.normalizeDrawerHeights();
    }
  }

  setDimension(field: "width" | "height", value: number): void {
    const dim = this.state.item.dimensions;
    this.state.item.dimensions = field === "width"
      ? dim.withWidth(value)
      : dim.withHeight(value);
    this.state.item.normalizeDrawerHeights();
  }

  loadForEdit(index: number, item: OrderItem): void {
    this.state.editIndex = index;
    this.state.item = item.clone();
    this.state.currentStep = 1;
  }

  collectFormValues(formValues: Record<string, string | number>): void {
    const item = this.state.item;
    if (typeof formValues.colorBody === "string") item.colorBody = formValues.colorBody;
    if (typeof formValues.colorFront === "string") item.colorFront = formValues.colorFront;
    if (typeof formValues.handleType === "string") item.handleType = formValues.handleType;
    if (typeof formValues.countertopColor === "string") item.countertopColor = formValues.countertopColor;
    if (typeof formValues.countertopThickness === "number") item.countertopThickness = formValues.countertopThickness;
    if (typeof formValues.ledType === "string") item.ledType = formValues.ledType as any;
    if (typeof formValues.ledColorTemperature === "string") item.ledColorTemperature = formValues.ledColorTemperature;
    if (typeof formValues.ledProfileColor === "string") item.ledProfileColor = formValues.ledProfileColor;
  }

  setValFromForm(id: string, value: string): void {
    const item = this.state.item;
    switch (id) {
      case "input-width": item.dimensions = item.dimensions.withWidth(Number(value)); break;
      case "input-height": item.dimensions = item.dimensions.withHeight(Number(value)); break;
      case "input-depth": item.dimensions = item.dimensions.withDepth(Number(value)); break;
      case "input-color-body": item.colorBody = value; break;
      case "input-color-front": item.colorFront = value; break;
      case "input-handle-type": item.handleType = value; break;
      case "input-countertop-color": item.countertopColor = value; break;
      case "input-countertop-thickness": item.countertopThickness = Number(value); break;
      case "input-led-type": item.ledType = value as any; break;
      case "input-led-temp": item.ledColorTemperature = value; break;
      case "input-led-profile-color": item.ledProfileColor = value; break;
      case "input-corner-type": item.cornerType = value as CornerType; break;
      case "input-kidney-type": item.kidneyType = value as KidneyType; break;
      case "input-kidney-shelves": item.kidneyShelvesCount = Number(value); break;
      case "input-corner-front-width": item.cornerFrontWidth = Number(value); break;
      case "input-corner-depth-left": item.cornerDepthLeft = Number(value); break;
      case "input-corner-depth-right": item.cornerDepthRight = Number(value); break;
    }
    item.normalizeDrawerHeights();
  }

  setCornerType(type: CornerType): void {
    this.state.item.cornerType = type;
  }

  setKidneyType(type: KidneyType): void {
    this.state.item.kidneyType = type;
  }
}
