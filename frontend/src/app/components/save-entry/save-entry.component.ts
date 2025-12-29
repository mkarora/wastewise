import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'save-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./save-entry.component.html",
  styleUrls: ["./save-entry.component.scss"]
})
export class SaveEntryComponent {
  entryText: string = '';

  onSubmit(event: Event) {
    event.preventDefault();
    // No functionality yet as requested
  }
}

