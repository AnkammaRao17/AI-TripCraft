import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminService } from '../../core/services/admin.service';
import { DestinationService } from '../../core/services/destination.service';
import { TripService } from '../../core/services/trip.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, Trip, Destination } from '../../models/interfaces';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="admin-wrapper">
      <div class="admin-header">
        <h1 class="admin-title">System Control Center</h1>
        <p class="admin-subtitle">Manage registered users, review all planned trips, configure default destinations, and audit metrics.</p>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid" *ngIf="stats()">
        <div class="glass-card stat-card">
          <mat-icon>people</mat-icon>
          <div>
            <span class="stat-label">Total Users</span>
            <h3 class="stat-value">{{ stats().summary.totalUsers }}</h3>
          </div>
        </div>

        <div class="glass-card stat-card">
          <mat-icon>luggage</mat-icon>
          <div>
            <span class="stat-label">Total System Trips</span>
            <h3 class="stat-value">{{ stats().summary.totalTrips }}</h3>
          </div>
        </div>

        <div class="glass-card stat-card">
          <mat-icon>place</mat-icon>
          <div>
            <span class="stat-label">Configured Destinations</span>
            <h3 class="stat-value">{{ stats().summary.totalDestinations }}</h3>
          </div>
        </div>
      </div>

      <!-- Control Panel Tabs -->
      <mat-card class="glass-card tab-card">
        <mat-tab-group animationDuration="200ms">
          <!-- Users Management -->
          <mat-tab label="Registered Users">
            <div class="tab-content">
              <div *ngIf="isUsersLoading()" class="spinner-box">
                <mat-spinner diameter="35"></mat-spinner>
              </div>

              <div *ngIf="!isUsersLoading()">
                <table mat-table [dataSource]="users()" class="admin-table">
                  <!-- Username Column -->
                  <ng-container matColumnDef="username">
                    <th mat-header-cell *matHeaderCellDef> Username </th>
                    <td mat-cell *matCellDef="let element"> 
                      <div class="user-row">
                        <img [src]="element.profile.avatarUrl" class="avatar-sm" alt="Avatar"/>
                        <span>{{element.username}}</span>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Email Column -->
                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef> Email </th>
                    <td mat-cell *matCellDef="let element"> {{element.email}} </td>
                  </ng-container>

                  <!-- Role Column -->
                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef> Role </th>
                    <td mat-cell *matCellDef="let element"> 
                      <span class="role-badge" [class.badge-admin]="element.role === 'admin'">
                        {{element.role}}
                      </span>
                    </td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef> Actions </th>
                    <td mat-cell *matCellDef="let element">
                      <button mat-icon-button color="warn" (click)="deleteUser(element._id)" [disabled]="element.role === 'admin'" title="Delete user account">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: userColumns;"></tr>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- Trips Auditing -->
          <mat-tab label="System Trips Audit">
            <div class="tab-content">
              <div *ngIf="isTripsLoading()" class="spinner-box">
                <mat-spinner diameter="35"></mat-spinner>
              </div>

              <div *ngIf="!isTripsLoading()">
                <table mat-table [dataSource]="trips()" class="admin-table">
                  <!-- User Column -->
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef> Owner </th>
                    <td mat-cell *matCellDef="let element"> {{element.user?.email || 'Unknown'}} </td>
                  </ng-container>

                  <!-- Destination Column -->
                  <ng-container matColumnDef="destination">
                    <th mat-header-cell *matHeaderCellDef> Destination </th>
                    <td mat-cell *matCellDef="let element"> {{element.destination}}, {{element.country}} </td>
                  </ng-container>

                  <!-- Days Column -->
                  <ng-container matColumnDef="days">
                    <th mat-header-cell *matHeaderCellDef> Days </th>
                    <td mat-cell *matCellDef="let element"> {{element.numberOfDays}} </td>
                  </ng-container>

                  <!-- Budget Column -->
                  <ng-container matColumnDef="budget">
                    <th mat-header-cell *matHeaderCellDef> Budget </th>
                    <td mat-cell *matCellDef="let element"> {{element.budget}} </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="tripColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: tripColumns;"></tr>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- Destinations Management -->
          <mat-tab label="Configure Featured Spots">
            <div class="tab-content destinations-tab">
              <!-- Destination Form -->
              <div class="glass-card dest-form-card">
                <h3 class="form-title">Create New Featured Destination</h3>
                
                <form [formGroup]="destForm" (ngSubmit)="onSubmitDestination()" class="dest-form">
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>City Name</mat-label>
                      <input matInput formControlName="name" placeholder="e.g. Kyoto" />
                      <mat-error *ngIf="destForm.get('name')?.invalid">Required</mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Country</mat-label>
                      <input matInput formControlName="country" placeholder="e.g. Japan" />
                      <mat-error *ngIf="destForm.get('country')?.invalid">Required</mat-error>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description Summary</mat-label>
                    <textarea matInput formControlName="description" rows="2" placeholder="Describe the sights and vibes..."></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Spot Image URL</mat-label>
                    <input matInput formControlName="imageUrl" placeholder="https://images.unsplash.com/..." />
                  </mat-form-field>

                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Latitude (Coordinates)</mat-label>
                      <input matInput type="number" step="any" formControlName="lat" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Longitude (Coordinates)</mat-label>
                      <input matInput type="number" step="any" formControlName="lng" />
                    </mat-form-field>
                  </div>

                  <button mat-raised-button type="submit" class="btn-primary form-submit-btn" [disabled]="destForm.invalid">
                    Create Spot Entry
                  </button>
                </form>
              </div>

              <!-- Configured Spots List -->
              <div class="spots-list">
                <h3 class="form-title">Current Destinations ({{destinations().length}})</h3>
                <div class="spots-scroller">
                  <div class="spot-row" *ngFor="let dest of destinations()">
                    <img [src]="dest.imageUrl" class="spot-img-sm" alt="Spot"/>
                    <div class="spot-details">
                      <span class="spot-name">{{dest.name}}, {{dest.country}}</span>
                      <span class="spot-rating">⭐ {{dest.averageRating}} ({{dest.totalReviews}} reviews)</span>
                    </div>
                    <button mat-icon-button color="warn" (click)="deleteDestination(dest._id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-wrapper {
      animation: fade-in 0.4s ease-out;
    }
    .admin-header {
      margin-bottom: 32px;
    }
    .admin-title {
      font-size: 32px;
      font-weight: 800;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .admin-subtitle {
      color: var(--text-secondary);
      font-size: 15px;
    }
    
    // Stats Grid
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 20px;
      margin-bottom: 32px;
      @media (min-width: 768px) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 0;
      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--accent-primary);
      }
    }
    .stat-label {
      color: var(--text-muted);
      font-size: 13px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 800;
    }

    // Tabs
    .tab-card {
      padding: 0;
      border-radius: 16px;
    }
    .tab-content {
      padding: 24px;
    }
    .spinner-box {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    // Tables
    .admin-table {
      width: 100%;
      background: transparent !important;
      th {
        font-weight: 700;
        color: var(--text-secondary);
        font-size: 14px;
      }
      td {
        color: var(--text-primary);
        font-size: 14px;
      }
    }
    .user-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar-sm {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }
    .role-badge {
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      &.badge-admin {
        background: rgba(99, 102, 241, 0.15);
        color: var(--accent-primary);
      }
    }

    // Destinations configuration view
    .destinations-tab {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      @media (min-width: 1024px) {
        grid-template-columns: 1.2fr 1fr;
      }
    }
    .dest-form-card {
      margin-bottom: 0;
      border: 1px solid var(--border-color);
    }
    .form-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 20px;
      color: var(--text-primary);
    }
    .dest-form {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .full-width {
      width: 100%;
    }
    .form-submit-btn {
      height: 48px !important;
      margin-top: 12px;
    }
    .spots-list {
      display: flex;
      flex-direction: column;
    }
    .spots-scroller {
      max-height: 420px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .spot-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 8px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
    }
    .spot-img-sm {
      width: 44px;
      height: 44px;
      border-radius: 6px;
      object-fit: cover;
    }
    .spot-details {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .spot-name {
      font-weight: 700;
      font-size: 13px;
    }
    .spot-rating {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }
  `],
})
export class AdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private destService = inject(DestinationService);
  private tripService = inject(TripService);
  private notification = inject(NotificationService);

  // States
  users = signal<User[]>([]);
  trips = signal<Trip[]>([]);
  destinations = signal<Destination[]>([]);
  stats = signal<any | null>(null);
  
  isUsersLoading = signal(true);
  isTripsLoading = signal(true);

  // Table Columns
  userColumns = ['username', 'email', 'role', 'actions'];
  tripColumns = ['user', 'destination', 'days', 'budget'];

  // Destination Creation Form
  destForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    country: ['', Validators.required],
    description: [''],
    imageUrl: [''],
    lat: [0],
    lng: [0],
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadTrips();
    this.loadDestinations();
    this.loadStats();
  }

  loadUsers(): void {
    this.isUsersLoading.set(true);
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.users.set(res.data.users);
        this.isUsersLoading.set(false);
      },
      error: () => this.isUsersLoading.set(false),
    });
  }

  loadTrips(): void {
    this.isTripsLoading.set(true);
    this.adminService.getAllTrips().subscribe({
      next: (res) => {
        this.trips.set(res.data.trips);
        this.isTripsLoading.set(false);
      },
      error: () => this.isTripsLoading.set(false),
    });
  }

  loadDestinations(): void {
    this.destService.getDestinations().subscribe({
      next: (res) => this.destinations.set(res.data.destinations),
    });
  }

  loadStats(): void {
    this.tripService.getStats().subscribe({
      next: (res) => this.stats.set(res.data),
    });
  }

  deleteUser(id: string): void {
    if (confirm('Delete this user? All their trips and reviews will be permanently removed.')) {
      this.adminService.deleteUser(id).subscribe({
        next: () => {
          this.notification.success('User and associated data deleted.');
          this.loadUsers();
          this.loadStats();
        },
        error: (err) => this.notification.error(err.error?.message || 'Delete user failed.'),
      });
    }
  }

  deleteDestination(id: string): void {
    if (confirm('Delete this featured spot?')) {
      this.destService.deleteDestination(id).subscribe({
        next: () => {
          this.notification.success('Featured spot deleted.');
          this.loadDestinations();
          this.loadStats();
        },
        error: () => this.notification.error('Delete destination failed.'),
      });
    }
  }

  onSubmitDestination(): void {
    if (this.destForm.invalid) return;

    const payload = this.destForm.value;
    if (!payload.imageUrl) {
      payload.imageUrl = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
    }

    this.destService.createDestination(payload).subscribe({
      next: () => {
        this.notification.success('New featured destination spot configured!');
        this.destForm.reset({ lat: 0, lng: 0 });
        this.loadDestinations();
        this.loadStats();
      },
      error: (err) => this.notification.error(err.error?.message || 'Configuration failed.'),
    });
  }
}
