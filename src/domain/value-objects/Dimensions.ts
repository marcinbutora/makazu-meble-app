export class Dimensions {
  constructor(
    readonly width: number,
    readonly height: number,
    readonly depth: number,
  ) {}

  static defaultFor(type: string): Dimensions {
    switch (type) {
      case "top": return new Dimensions(600, 720, 320);
      case "corner": return new Dimensions(900, 720, 510);
      case "countertop": return new Dimensions(600, 600, 38);
      case "led": return new Dimensions(600, 0, 0);
      default: return new Dimensions(600, 720, 510);
    }
  }

  withWidth(w: number): Dimensions {
    return new Dimensions(w, this.height, this.depth);
  }

  withHeight(h: number): Dimensions {
    return new Dimensions(this.width, h, this.depth);
  }

  withDepth(d: number): Dimensions {
    return new Dimensions(this.width, this.height, d);
  }

  toString(): string {
    return `${this.width} x ${this.height} x ${this.depth} mm`;
  }
}
