// frontend/src/app/editable.directive.ts
import { Directive, ElementRef, output, HostListener, inject, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appEditable]',
  standalone: true
})
export class EditableDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private inputElement: HTMLInputElement | null = null;

  editComplete = output<string>();

  @HostListener('dblclick') onEdit() {
    if (this.inputElement) return;

    const hostDiv = this.el.nativeElement;
    const currentText = hostDiv.innerText;

    this.renderer.setStyle(hostDiv, 'display', 'none');

    this.inputElement = this.renderer.createElement('input');
    this.renderer.setProperty(this.inputElement, 'value', currentText.trim());
    this.renderer.setStyle(this.inputElement, 'padding', '4px');
    
    const parent = this.renderer.parentNode(hostDiv);
    this.renderer.insertBefore(parent, this.inputElement, hostDiv);

    // Écouteurs d'événements pour la sauvegarde
    this.renderer.listen(this.inputElement, 'keydown.enter', (e) => this.finishEdit(e.target.value));
    this.renderer.listen(this.inputElement, 'blur', (e) => this.finishEdit(e.target.value));

    this.inputElement?.focus();
  }

  private finishEdit(value: string) {
    if (!this.inputElement) return;
    
    this.editComplete.emit(value);
    
    // Nettoyage et restauration de la div originale
    const parent = this.renderer.parentNode(this.el.nativeElement);
    this.renderer.removeChild(parent, this.inputElement);
    this.inputElement = null;
    this.renderer.setStyle(this.el.nativeElement, 'display', '');
  }
}