import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WastewiseApiService } from '../../services/wastewise-api/wastewise-api.service';

@Component({
  selector: 'monthly-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./monthly-insights.component.html",
  styleUrls: ["./monthly-insights.component.scss"]
})
export class MonthlyInsightsComponent implements OnInit {
  isLoading = true;
  insights: string | null = null;
  error: string | null = null;

  constructor(private wastewiseApiService: WastewiseApiService) {}

  ngOnInit(): void {
    this.loadInsights();
  }

  loadInsights(): void {
    this.isLoading = true;
    this.error = null;
    
    this.wastewiseApiService.getInsights().subscribe({
      next: (response) => {
        this.isLoading = false;
        // The backend returns { message: "...", response: "..." }
        // where response contains the actual insights content
        if (response.response) {
          this.insights = response.response;
        } else if (response.message) {
          this.insights = response.message;
        } else {
          this.insights = JSON.stringify(response);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.detail || err.message || 'Failed to load insights';
        console.error('Error loading insights:', err);
      }
    });
  }
}

