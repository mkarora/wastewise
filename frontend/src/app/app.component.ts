import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div class="container">
      <h1>Hello World!</h1>
      <p>Welcome to WasteWise Frontend</p>
    </div>
  `,
  styles: [`
    .container {
      text-align: center;
      color: white;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }

    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    p {
      font-size: 1.5rem;
      opacity: 0.9;
    }
  `]
})
export class AppComponent {
  title = 'wastewise-frontend';
}

