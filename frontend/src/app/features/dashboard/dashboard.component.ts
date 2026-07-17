import { Component, inject, signal, OnInit, AfterViewInit, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Chart } from 'chart.js/auto';

import { TripService } from '../../core/services/trip.service';
import { DestinationService } from '../../core/services/destination.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { Trip, Destination } from '../../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    MatMenuModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  // Services
  tripService = inject(TripService);
  destService = inject(DestinationService);
  notification = inject(NotificationService);
  authService = inject(AuthService);
  fb = inject(FormBuilder);
  router = inject(Router);

  // Signals
  trips = signal<Trip[]>([]);
  destinations = signal<Destination[]>([]);
  favoriteDestinations = signal<any[]>([]);
  isLoading = signal(true);
  isDestLoading = signal(true);
  
  // Pagination
  totalTrips = signal(0);
  page = signal(1);
  limit = signal(6);

  // Stats signals
  totalBudgetSpent = signal(0);
  upcomingTripsCount = signal(0);

  // Search & Filter Form
  filterForm: FormGroup = this.fb.group({
    search: [''],
    budget: [''],
    tripType: [''],
    duration: ['']
  });

  // Computed signals for dashboard polish
  recentlyCreatedTrips = computed(() => this.trips().slice(0, 3));
  
  aiRecommendations = computed(() => {
    const plannedCities = this.trips().map(t => t.destination.toLowerCase());
    const recs: string[] = [];
    if (!plannedCities.includes('goa')) {
      recs.push('🏖️ Goa: A paradise of sun, sand, and seafood. Highly recommended for beaches and water sports.');
    }
    if (!plannedCities.includes('manali')) {
      recs.push('🏔️ Manali, Himachal Pradesh: Surrounded by snow-capped peaks. Perfect for paragliding, skiing, and trekking.');
    }
    if (!plannedCities.includes('jaipur')) {
      recs.push('🏰 Jaipur, Rajasthan: The Pink City. Explore historic palaces, forts, and royal heritage.');
    }
    if (recs.length === 0) {
      recs.push('🌊 Kerala: The Venice of the East. Famous for backwater houseboats and coconut groves.');
    }
    return recs;
  });

  // Chart Canvas Elements
  @ViewChild('tripsChart') tripsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('budgetChart') budgetChartRef!: ElementRef<HTMLCanvasElement>;
  
  tripsChartInstance: any = null;
  budgetChartInstance: any = null;

  // Selected destination review form
  selectedDestForReview = signal<Destination | null>(null);
  reviewRating = signal(5);
  reviewComment = signal('');

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadDestinations();
    this.loadFavoriteDestinations();
  }

  ngAfterViewInit(): void {
    // Wait for data load before rendering charts
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    
    // Prepare query parameters
    const queryParams = {
      ...this.filterForm.value,
      page: this.page(),
      limit: this.limit()
    };

    this.tripService.getTrips(queryParams).subscribe({
      next: (res) => {
        this.trips.set(res.data.trips);
        this.totalTrips.set(res.data.pagination.total);
        
        // Compute simple aggregate stats
        let totalBudget = 0;
        let upcoming = 0;
        const now = new Date();
        
        res.data.trips.forEach((t: Trip) => {
          totalBudget += t.estimatedBudgetBreakdown.total || 0;
          if (new Date(t.startDate) > now) {
            upcoming++;
          }
        });
        
        this.totalBudgetSpent.set(totalBudget);
        this.upcomingTripsCount.set(upcoming);
        
        this.isLoading.set(false);
        this.loadStatsAndRenderCharts();
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Failed to load trips. Please try again.');
      }
    });
  }

  loadDestinations(): void {
    this.isDestLoading.set(true);
    this.destService.getDestinations().subscribe({
      next: (res) => {
        this.destinations.set(res.data.destinations);
        this.isDestLoading.set(false);
      },
      error: () => {
        this.isDestLoading.set(false);
      }
    });
  }

  loadFavoriteDestinations(): void {
    this.destService.getFavoriteDestinations().subscribe({
      next: (res) => {
        this.favoriteDestinations.set(res.data.favorites || []);
      },
      error: () => {}
    });
  }

  toggleFavoriteDestination(destId: string, event: Event): void {
    event.stopPropagation();
    this.destService.toggleFavoriteDestination(destId).subscribe({
      next: (res) => {
        this.notification.success(res.message);
        this.loadFavoriteDestinations();
      },
      error: () => this.notification.error('Failed to bookmark destination.')
    });
  }

  isDestFavorited(destId: string): boolean {
    return this.favoriteDestinations().some(f => f.destination?._id === destId);
  }

  loadStatsAndRenderCharts(): void {
    if (this.totalTrips() === 0) {
      // Do not query backend stats or render charts if user has no trips
      return;
    }
    this.tripService.getStats().subscribe({
      next: (res) => {
        const stats = res.data;
        this.renderTripsPerMonthChart(stats.charts.tripsPerMonth);
        this.renderBudgetDistributionChart(stats.charts.budgetDistribution);
      },
      error: () => {
        // Render fallback empty charts if no stats yet
        this.renderTripsPerMonthChart([]);
        this.renderBudgetDistributionChart({ Budget: 0, Moderate: 0, Luxury: 0 });
      }
    });
  }

  renderTripsPerMonthChart(dataPoints: any[]): void {
    if (!this.tripsChartRef) return;
    if (this.tripsChartInstance) this.tripsChartInstance.destroy();

    const ctx = this.tripsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = dataPoints.length > 0 ? dataPoints.map(d => d.label) : ['Past Months'];
    const counts = dataPoints.length > 0 ? dataPoints.map(d => d.count) : [0];

    this.tripsChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Trips Plotted',
          data: counts,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  renderBudgetDistributionChart(dist: any): void {
    if (!this.budgetChartRef) return;
    if (this.budgetChartInstance) this.budgetChartInstance.destroy();

    const ctx = this.budgetChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const hasData = dist.Budget > 0 || dist.Moderate > 0 || dist.Luxury > 0;
    const data = hasData ? [dist.Budget, dist.Moderate, dist.Luxury] : [1, 1, 1];
    const bgColors = hasData ? ['#3b82f6', '#8b5cf6', '#ec4899'] : ['#cbd5e1', '#e2e8f0', '#f1f5f9'];

    this.budgetChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Budget', 'Moderate', 'Luxury'],
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  onSearchFilter(): void {
    this.page.set(1);
    this.loadDashboardData();
  }

  onResetFilters(): void {
    this.filterForm.reset({
      search: '',
      budget: '',
      tripType: '',
      duration: ''
    });
    this.page.set(1);
    this.loadDashboardData();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadDashboardData();
  }

  duplicateTrip(id: string): void {
    this.tripService.duplicateTrip(id).subscribe({
      next: () => {
        this.notification.success('Trip duplicated successfully!');
        this.loadDashboardData();
      },
      error: () => this.notification.error('Failed to duplicate trip.')
    });
  }

  deleteTrip(id: string): void {
    if (confirm('Are you sure you want to delete this trip and its itinerary?')) {
      this.tripService.deleteTrip(id).subscribe({
        next: () => {
          this.notification.success('Trip deleted successfully.');
          this.loadDashboardData();
        },
        error: () => this.notification.error('Failed to delete trip.')
      });
    }
  }

  toggleFavorite(id: string): void {
    this.tripService.toggleFavorite(id).subscribe({
      next: (res) => {
        this.notification.success(res.message);
        this.loadDashboardData();
      }
    });
  }

  openReviewForm(dest: Destination): void {
    this.selectedDestForReview.set(dest);
    this.reviewRating.set(5);
    this.reviewComment.set('');
  }

  closeReviewForm(): void {
    this.selectedDestForReview.set(null);
  }

  submitReview(): void {
    const dest = this.selectedDestForReview();
    if (!dest) return;

    if (!this.reviewComment().trim()) {
      this.notification.warning('Please enter a comment.');
      return;
    }

    this.destService.addReview(dest._id, this.reviewRating(), this.reviewComment()).subscribe({
      next: () => {
        this.notification.success(`Review added for ${dest.name}!`);
        this.closeReviewForm();
        this.loadDestinations(); // Reload destination ratings
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to submit review.';
        this.notification.error(msg);
      }
    });
  }

  loadedImages = new Map<string, boolean>();

  setImageLoaded(id: string): void {
    this.loadedImages.set(id, true);
  }

  isImageLoaded(id: string): boolean {
    return this.loadedImages.get(id) || false;
  }

  onImgError(event: any, destName?: string): void {
    if (destName?.toLowerCase() === 'hyderabad') {
      event.target.src = 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=800&q=80';
    } else {
      event.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
    }
  }
}
