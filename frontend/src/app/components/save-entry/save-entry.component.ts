import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WastewiseApiService } from '../../services/wastewise-api/wastewise-api.service';

@Component({
  selector: 'save-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./save-entry.component.html",
  styleUrls: ["./save-entry.component.scss"]
})
export class SaveEntryComponent {
  entryText: string = '';

  constructor(private api: WastewiseApiService) {}

  onSubmit() {
    if (!this.entryText){
      //validation
    }

    this.api.saveEntry(this.entryText.trim()).subscribe({
      next: () => {
        this.entryText = '';
      },
      error: (err) => {
        console.error('Failed to save entry', err);
      }
    });
  }
}

