import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AuthService } from '../../core/services/auth.service';
import { TripService } from '../../core/services/trip.service';
import { NotificationService } from '../../core/services/notification.service';
import { Trip } from '../../models/interfaces';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="profile-wrapper">
      <div class="profile-header">
        <h1 class="profile-title">Account Profiles</h1>
        <p class="profile-subtitle">Configure your personal information, update your traveler avatar, and audit settings.</p>
      </div>

      <div class="profile-grid">
        <!-- Edit Profile Form -->
        <mat-card class="glass-card profile-card">
          <mat-progress-bar mode="indeterminate" *ngIf="isSaving()"></mat-progress-bar>
          <h3 class="card-title"><mat-icon>manage_accounts</mat-icon> Edit Profile Details</h3>
          
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
            <div class="avatar-edit-row">
              <img [src]="profileForm.get('avatarUrl')?.value" class="avatar-preview" alt="Avatar"/>
              <div class="avatar-action">
                <button mat-button type="button" class="btn-secondary font-sm" (click)="regenerateAvatar()">
                  <mat-icon>cached</mat-icon> Roll New Avatar
                </button>
                <p class="avatar-info-text">Dicebear avatar generated based on username seed.</p>
              </div>
            </div>

            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" />
              </mat-form-field>
            </div>

            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Email Address</mat-label>
                <input matInput formControlName="email" readonly title="Email cannot be changed"/>
                <mat-icon matSuffix>lock</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phone" placeholder="+123456789"/>
                <mat-icon matSuffix>phone</mat-icon>
              </mat-form-field>
            </div>

            <button mat-raised-button type="submit" class="btn-primary save-btn" [disabled]="profileForm.invalid || isSaving()">
              {{ isSaving() ? 'Saving Changes...' : 'Save Settings' }}
            </button>
          </form>
        </mat-card>

        <!-- Stats and Meta Info Side panel -->
        <div class="meta-side-panel">
          <mat-card class="glass-card info-card">
            <h3 class="card-title"><mat-icon>insights</mat-icon> Personal Travel Insights</h3>
            
            <div class="stats-summary" *ngIf="tripStats()">
              <div class="stat-item">
                <span class="stat-count">{{ tripStats()?.totalTrips }}</span>
                <span class="stat-name">Trips Built</span>
              </div>
              <div class="stat-item">
                <span class="stat-count">{{ tripStats()?.totalDays }}</span>
                <span class="stat-name">Days Traveled</span>
              </div>
            </div>

            <div class="profile-details-list">
              <div class="detail-row">
                <span class="detail-label">Username</span>
                <span class="detail-value">{{ authService.currentUser()?.username }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Account Role</span>
                <span class="detail-value text-uppercase">{{ authService.currentUser()?.role }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Member Since</span>
                <span class="detail-value">{{ authService.currentUser()?.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-wrapper {
      animation: fade-in 0.4s ease-out;
    }
    .profile-header {
      margin-bottom: 32px;
    }
    .profile-title {
      font-size: 32px;
      font-weight: 800;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .profile-subtitle {
      color: var(--text-secondary);
      font-size: 15px;
    }

    // Grid Layout
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      align-items: start;
      @media (min-width: 960px) {
        grid-template-columns: 2fr 1fr;
      }
    }

    .profile-card {
      margin-bottom: 0;
      overflow: hidden;
      position: relative;
    }
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 24px;
      color: var(--text-primary);
      mat-icon {
        color: var(--accent-primary);
      }
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    // Avatar preview edit
    .avatar-edit-row {
      display: flex;
      align-items: center;
      gap: 20px;
      background: var(--bg-tertiary);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      border: 1px solid var(--border-color);
    }
    .avatar-preview {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 2px solid var(--glass-border);
    }
    .avatar-action {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
    .avatar-info-text {
      font-size: 11px;
      color: var(--text-muted);
    }

    .save-btn {
      height: 48px !important;
      margin-top: 12px;
    }

    // Sidebar Insights
    .info-card {
      margin-bottom: 0;
    }
    .stats-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
    }
    .stat-count {
      font-size: 26px;
      font-weight: 800;
      color: var(--accent-primary);
    }
    .stat-name {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .profile-details-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
      font-size: 13px;
      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
    }
    .detail-label {
      font-weight: 600;
      color: var(--text-secondary);
    }
    .detail-value {
      font-weight: 700;
      color: var(--text-primary);
      &.text-uppercase {
        text-transform: uppercase;
      }
    }
    .font-sm {
      font-size: 12px;
    }
  `],
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  private tripService = inject(TripService);
  private fb = inject(FormBuilder);
  private notification = inject(NotificationService);

  profileForm!: FormGroup;
  isSaving = signal(false);

  // Travel Stats
  tripStats = signal<{ totalTrips: number; totalDays: number } | null>(null);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    
    this.profileForm = this.fb.group({
      firstName: [user?.profile?.firstName || ''],
      lastName: [user?.profile?.lastName || ''],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: [user?.profile?.phone || ''],
      avatarUrl: [user?.profile?.avatarUrl || ''],
    });

    this.loadPersonalStats();
  }

  loadPersonalStats(): void {
    this.tripService.getTrips({ limit: 100 }).subscribe({
      next: (res) => {
        const trips: Trip[] = res.data.trips;
        let totalDays = 0;
        trips.forEach((t) => totalDays += t.numberOfDays);
        this.tripStats.set({
          totalTrips: trips.length,
          totalDays,
        });
      },
    });
  }

  regenerateAvatar(): void {
    const seed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
    this.profileForm.patchValue({ avatarUrl: newAvatar });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);
    const { firstName, lastName, phone, avatarUrl } = this.profileForm.value;

    this.authService.updateProfile({ firstName, lastName, phone, avatarUrl }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notification.success('Profile settings updated successfully!');
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to update profile settings.');
      },
    });
  }
}
