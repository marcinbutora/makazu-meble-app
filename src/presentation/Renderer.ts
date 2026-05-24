export class Renderer {
  getEl<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
  }

  setVal(id: string, value: string | number): void {
    const el = this.getEl<HTMLInputElement>(id);
    if (el) el.value = String(value);
  }

  setText(id: string, text: string): void {
    const el = this.getEl(id);
    if (el) el.innerText = text;
  }

  setHtml(id: string, html: string): void {
    const el = this.getEl(id);
    if (el) el.innerHTML = html;
  }

  show(id: string): void {
    this.getEl(id)?.classList.remove("hidden");
  }

  hide(id: string): void {
    this.getEl(id)?.classList.add("hidden");
  }

  toggle(id: string, visible: boolean): void {
    this.getEl(id)?.classList.toggle("hidden", !visible);
  }

  toggleClass(id: string, cls: string, force?: boolean): void {
    this.getEl(id)?.classList.toggle(cls, force);
  }

  openModal(modalId: string, cardId: string): void {
    const modal = this.getEl(modalId);
    const card = this.getEl(cardId);
    if (!modal || !card) return;
    modal.classList.remove("hidden");
    card.classList.remove("animate-modal-leave");
    card.classList.add("animate-modal-enter");
  }

  closeModal(modalId: string, cardId: string): void {
    const modal = this.getEl(modalId);
    const card = this.getEl(cardId);
    if (!modal || !card) return;
    card.classList.remove("animate-modal-enter");
    card.classList.add("animate-modal-leave");
    setTimeout(() => modal.classList.add("hidden"), 190);
  }
}
