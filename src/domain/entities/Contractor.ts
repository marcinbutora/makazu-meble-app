export interface ContractorParams {
  name?: string;
  nip?: string;
  email?: string;
  phone?: string;
}

export class Contractor {
  name: string;
  nip: string;
  email: string;
  phone: string;

  constructor(params: ContractorParams = {}) {
    this.name = params.name ?? "";
    this.nip = params.nip ?? "";
    this.email = params.email ?? "";
    this.phone = params.phone ?? "";
  }

  get isComplete(): boolean {
    return this.name.trim().length > 0;
  }

  clone(): Contractor {
    return new Contractor({
      name: this.name,
      nip: this.nip,
      email: this.email,
      phone: this.phone,
    });
  }
}
