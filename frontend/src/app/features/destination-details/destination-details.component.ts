import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DestinationService } from '../../core/services/destination.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { Destination, Review } from '../../models/interfaces';
import { getDestinationImageUrl, getNextDestinationImageUrl } from '../../shared/constants/destination-images';

@Component({
  selector: 'app-destination-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="details-wrapper" *ngIf="!isLoading(); else loadingSpinner">
      <!-- Header / Back Navigation -->
      <div class="details-header">
        <a mat-button routerLink="/dashboard" class="back-btn">
          <mat-icon>arrow_back</mat-icon> Back to Dashboard
        </a>
      </div>

      <!-- Hero Banner Section -->
      <div class="hero-banner" [style.background-image]="'url(' + bannerUrl() + ')'">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="brand-badge">{{ dest()?.country }}</div>
          <h1 class="hero-title">{{ dest()?.name }}</h1>
          <p class="hero-subtitle">{{ dest()?.description }}</p>
          
          <div class="hero-metrics">
            <div class="metric-pill">
              <mat-icon>paid</mat-icon>
              <span>{{ dest()?.budget }} Tier</span>
            </div>
            <div class="metric-pill">
              <mat-icon>calendar_today</mat-icon>
              <span>Best: {{ dest()?.bestTime }}</span>
            </div>
            <div class="metric-pill">
              <mat-icon>star</mat-icon>
              <span>{{ dest()?.averageRating }} ({{ dest()?.totalReviews }} Reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Columns Layout -->
      <div class="details-grid">
        
        <!-- Left Side: Information Modules -->
        <div class="info-column">

          <!-- History & Culture -->
          <mat-card class="glass-card module-card" *ngIf="dest()?.history || dest()?.culture">
            <h3 class="module-title"><mat-icon>history_edu</mat-icon> History & Culture</h3>
            <div class="history-culture-content" style="display: flex; flex-direction: column; gap: 16px;">
              <div *ngIf="dest()?.history">
                <h4 style="font-weight: 700; margin-bottom: 6px; color: var(--accent-primary);">Historical Background</h4>
                <p style="color: var(--text-secondary); line-height: 1.5; font-size: 14px; margin: 0;">{{ dest()?.history }}</p>
              </div>
              <div *ngIf="dest()?.culture">
                <h4 style="font-weight: 700; margin-bottom: 6px; color: var(--accent-primary);">Cultural Heritage</h4>
                <p style="color: var(--text-secondary); line-height: 1.5; font-size: 14px; margin: 0;">{{ dest()?.culture }}</p>
              </div>
            </div>
          </mat-card>
          
          <!-- Image Gallery Carousel Mockup -->
          <mat-card class="glass-card module-card">
            <h3 class="module-title"><mat-icon>collections</mat-icon> Photo Gallery</h3>
            <div class="gallery-scroller">
              <div class="gallery-item hover-scale" *ngFor="let img of dest()?.gallery" (click)="activeGalleryImg.set(img)">
                <img [src]="img" alt="Gallery Preview" loading="lazy" (error)="onImgError($event, dest()?.name)" />
              </div>
            </div>
            <div class="active-gallery-preview" *ngIf="activeGalleryImg()">
              <img [src]="activeGalleryImg()" alt="Active Preview" loading="lazy" (error)="onImgError($event, dest()?.name)" />
            </div>
          </mat-card>

          <!-- Weather and Practical Info Row -->
          <div class="two-column-row">
            <mat-card class="glass-card module-card">
              <h3 class="module-title"><mat-icon>thermostat</mat-icon> Climate & Weather</h3>
              <div class="weather-details" style="font-size: 14px; line-height: 1.8; color: var(--text-secondary);">
                <div><strong>Climate:</strong> {{ dest()?.climate }}</div>
                <div><strong>Current Weather:</strong> {{ dest()?.weather }}</div>
                <div><strong>Average Temp:</strong> {{ dest()?.avgTemperature }}</div>
              </div>
            </mat-card>

            <mat-card class="glass-card module-card">
              <h3 class="module-title"><mat-icon>info</mat-icon> Practical Info</h3>
              <div class="practical-details" style="font-size: 14px; line-height: 1.8; color: var(--text-secondary);">
                <div><strong>Language:</strong> {{ dest()?.language }}</div>
                <div><strong>Currency:</strong> {{ dest()?.currency }}</div>
                <div><strong>Airport:</strong> {{ dest()?.nearbyAirport }}</div>
              </div>
            </mat-card>
          </div>

          <!-- Core Details Lists -->
          <mat-card class="glass-card module-card">
            <h3 class="module-title"><mat-icon>explore</mat-icon> Must-Visit Attractions</h3>
            <div class="attractions-list">
              <div class="attraction-item" *ngFor="let attr of dest()?.attractions">
                <mat-icon class="bullet-icon">check_circle</mat-icon>
                <span>{{ attr }}</span>
              </div>
            </div>
          </mat-card>

          <div class="two-column-row">
            <mat-card class="glass-card module-card">
              <h3 class="module-title"><mat-icon>hotel</mat-icon> Recommended Stays</h3>
              <ul class="styled-list">
                <li *ngFor="let hotel of dest()?.hotels">
                  <mat-icon>apartment</mat-icon> {{ hotel }}
                </li>
              </ul>
            </mat-card>

            <mat-card class="glass-card module-card">
              <h3 class="module-title"><mat-icon>restaurant</mat-icon> Local Restaurants</h3>
              <ul class="styled-list">
                <li *ngFor="let rest of dest()?.restaurants">
                  <mat-icon>storefront</mat-icon> {{ rest }}
                </li>
              </ul>
            </mat-card>
          </div>

          <mat-card class="glass-card module-card">
            <h3 class="module-title"><mat-icon>restaurant_menu</mat-icon> Culinary Specialties</h3>
            <p class="module-info-text">Don't leave without tasting these local foods:</p>
            <div class="foods-row">
              <span class="food-chip hover-scale" *ngFor="let food of dest()?.localFoods">
                🍕 {{ food }}
              </span>
            </div>
          </mat-card>

          <!-- Nearby Places to Visit -->
          <mat-card class="glass-card module-card" *ngIf="dest()?.nearbyPlaces?.length">
            <h3 class="module-title"><mat-icon>near_me</mat-icon> Nearby Excursions</h3>
            <div class="nearby-places-row" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
              <span class="food-chip hover-scale" *ngFor="let place of dest()?.nearbyPlaces" style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2); color: #a855f7; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                📍 {{ place }}
              </span>
            </div>
          </mat-card>

          <!-- Sample Itinerary Preview -->
          <mat-card class="glass-card module-card" *ngIf="dest()?.sampleItinerary?.length">
            <h3 class="module-title"><mat-icon>schedule</mat-icon> Highlight Sample Itinerary</h3>
            <div class="sample-itinerary-timeline" style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
              <div class="timeline-day" *ngFor="let day of dest()?.sampleItinerary" style="border-left: 2px solid var(--accent-primary); padding-left: 16px; position: relative;">
                <div style="position: absolute; left: -6px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--accent-primary);"></div>
                <h4 style="font-weight: 700; color: var(--text-primary); font-size: 14px; margin: 0 0 4px 0;">Day {{ day.dayNumber }}: {{ day.morningPlan ? 'Day Schedule' : day.title }}</h4>
                <p style="color: var(--text-secondary); font-size: 13px; margin: 0; line-height: 1.5;" *ngIf="day.morningPlan">
                  <strong>Morning:</strong> {{ day.morningPlan }}<br/>
                  <strong>Afternoon:</strong> {{ day.afternoonPlan }}<br/>
                  <strong>Evening:</strong> {{ day.eveningPlan }}
                </p>
                <p style="color: var(--text-secondary); font-size: 13px; margin: 0; line-height: 1.5;" *ngIf="day.plan">
                  {{ day.plan }}
                </p>
              </div>
            </div>
          </mat-card>

        </div>

        <!-- Right Side: Sticky Interactive Maps, Reviews & Booking Actions -->
        <div class="sidebar-column">
          
          <!-- Plan Trip Action -->
          <mat-card class="glass-card action-card">
            <h3 class="action-card-title">Craft an AI Itinerary</h3>
            <p class="action-card-text">Let Google Gemini AI design a custom schedule for {{ dest()?.name }} based on your duration and preferences.</p>
            
            <button mat-raised-button class="btn-primary full-width" (click)="planTrip()">
              <mat-icon>insights</mat-icon> Plan Trip to {{ dest()?.name }}
            </button>

            <div class="action-buttons-row">
              <button mat-button class="btn-secondary flex-grow" (click)="toggleFavorite()">
                <mat-icon [color]="isFavorited() ? 'warn' : ''">
                  {{ isFavorited() ? 'favorite' : 'favorite_border' }}
                </mat-icon>
                {{ isFavorited() ? 'Favorited' : 'Bookmark' }}
              </button>
              <button mat-button class="btn-secondary" (click)="shareDestination()" title="Copy share link">
                <mat-icon>share</mat-icon> Share
              </button>
            </div>
          </mat-card>

          <!-- Interactive Map Widget -->
          <mat-card class="glass-card map-card">
            <h3 class="module-title"><mat-icon>map</mat-icon> Map Coordinate</h3>
            <div class="map-viewport">
              <div class="map-grid-lines"></div>
              <div class="map-marker">
                <mat-icon class="marker-pin" color="warn">location_on</mat-icon>
                <div class="marker-popup">
                  <p class="popup-name">{{ dest()?.name }}</p>
                  <p class="popup-coord">Lat: {{ dest()?.latitude }} | Lng: {{ dest()?.longitude }}</p>
                </div>
              </div>
              <span class="map-center-tag">Centering map at {{ dest()?.name }}</span>
            </div>
          </mat-card>

          <!-- Reviews List & Submission -->
          <mat-card class="glass-card reviews-card">
            <h3 class="module-title"><mat-icon>rate_review</mat-icon> Traveler Feedback</h3>

            <!-- Review writing form -->
            <form (ngSubmit)="submitReview()" class="write-review-form">
              <div class="stars-selector">
                <span>Your Rating:</span>
                <div class="stars-row">
                  <button type="button" mat-icon-button *ngFor="let star of [1,2,3,4,5]" (click)="userRating.set(star)">
                    <mat-icon class="selector-star" [class.active]="star <= userRating()">star</mat-icon>
                  </button>
                </div>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Add Your Comment</mat-label>
                <textarea matInput rows="3" [(ngModel)]="userComment" name="comment" placeholder="Describe the vibes, transport tips or hotel stays..." required></textarea>
              </mat-form-field>

              <button mat-raised-button type="submit" class="btn-primary submit-review-btn" [disabled]="!userComment().trim() || isSubmittingReview()">
                Submit Review
              </button>
            </form>

            <mat-divider class="my-md"></mat-divider>

            <!-- Reviews display list -->
            <div class="reviews-list-container">
              <div class="no-reviews" *ngIf="reviews().length === 0">
                <p>No traveler reviews yet. Be the first to share your experience!</p>
              </div>

              <div class="review-item" *ngFor="let rev of reviews()">
                <div class="review-header">
                  <img [src]="rev.user?.profile?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + rev.user?.username" class="review-avatar" alt="Avatar" loading="lazy" (error)="onImgError($event)" />
                  <div class="review-meta">
                    <span class="review-username">{{ rev.user?.profile?.firstName || rev.user?.username }}</span>
                    <span class="review-date">{{ rev.createdAt | date:'mediumDate' }}</span>
                  </div>
                  <div class="review-rating">
                    <mat-icon class="star-mini-icon">star</mat-icon>
                    <span>{{ rev.rating }}</span>
                  </div>
                </div>
                <p class="review-comment">{{ rev.comment }}</p>
              </div>
            </div>
          </mat-card>

        </div>
        
      </div>
    </div>

    <ng-template #loadingSpinner>
      <div class="loading-screen">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading destination profile details...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .details-wrapper {
      animation: fade-in 0.4s ease-out;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .details-header {
      margin-bottom: 16px;
    }
    .back-btn {
      color: var(--text-secondary) !important;
    }

    // Hero Banner
    .hero-banner {
      height: 380px;
      border-radius: 20px;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      position: relative;
      display: flex;
      align-items: flex-end;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--glass-border);
    }
    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 60%, rgba(0, 0, 0, 0) 100%);
    }
    .hero-content {
      position: relative;
      color: white;
      z-index: 10;
      max-width: 800px;
    }
    .brand-badge {
      display: inline-block;
      background: var(--accent-gradient);
      color: white;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 12px;
      letter-spacing: 0.05em;
    }
    .hero-title {
      font-size: 42px;
      font-weight: 800;
      margin-bottom: 12px;
      line-height: 1.1;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    .hero-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.85);
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .hero-metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .metric-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid rgba(255,255,255,0.2);
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    // Grid Columns
    .details-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      align-items: start;
      @media (min-width: 1024px) {
        grid-template-columns: 1.8fr 1fr;
      }
    }

    .info-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .sidebar-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
      position: sticky;
      top: 90px;
    }

    .module-card {
      margin-bottom: 0;
    }
    .module-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 20px;
      color: var(--text-primary);
      mat-icon {
        color: var(--accent-primary);
      }
    }
    .module-info-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }

    // Gallery Carousel
    .gallery-scroller {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
      &::-webkit-scrollbar {
        height: 6px;
      }
    }
    .gallery-item {
      flex: 0 0 120px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      &:hover {
        border-color: var(--accent-primary);
      }
    }
    .active-gallery-preview {
      width: 100%;
      height: 320px;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 16px;
      border: 1px solid var(--border-color);
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    // Attractions List
    .attractions-list {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 12px;
      @media (min-width: 640px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .attraction-item {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      padding: 12px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
    }
    .bullet-icon {
      color: var(--accent-primary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    // Lists
    .two-column-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      @media (min-width: 640px) {
        grid-template-columns: 1fr 1fr;
      }
    }
    .styled-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--text-secondary);
        background: var(--bg-tertiary);
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        mat-icon {
          color: var(--accent-secondary);
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    // Foods Chips
    .foods-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .food-chip {
      background: var(--bg-tertiary);
      border: 1.5px solid var(--border-color);
      color: var(--text-primary);
      padding: 6px 14px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
    }

    // Sidebar Booking Actions
    .action-card {
      background: linear-gradient(135deg, var(--glass-bg) 0%, rgba(99, 102, 241, 0.05) 100%);
      border: 1.5px solid var(--accent-primary);
    }
    .action-card-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    .action-card-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .action-buttons-row {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }
    .full-width {
      width: 100%;
    }
    .flex-grow {
      flex-grow: 1;
    }

    // Map Card
    .map-card {
      padding: 20px;
    }
    .map-viewport {
      height: 200px;
      background: #f1f5f9;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      position: relative;
      overflow: hidden;
    }
    .map-grid-lines {
      position: absolute;
      width: 100%;
      height: 100%;
      background: linear-gradient(#e2e8f0 1px, transparent 1px) 0 0 / 20px 20px,
                  linear-gradient(90deg, #e2e8f0 1px, transparent 1px) 0 0 / 20px 20px;
      opacity: 0.5;
    }
    .map-marker {
      position: absolute;
      top: 40%;
      left: 45%;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      &:hover .marker-popup {
        display: block;
      }
    }
    .marker-pin {
      font-size: 32px;
      width: 32px;
      height: 32px;
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    .marker-popup {
      display: none;
      position: absolute;
      bottom: 36px;
      background: rgba(15, 23, 42, 0.95);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 11px;
      white-space: nowrap;
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
      z-index: 100;
    }
    .popup-name {
      font-weight: 700;
      margin-bottom: 2px;
    }
    .popup-coord {
      color: #94a3b8;
    }
    .map-location-tag, .map-center-tag {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(15, 23, 42, 0.8);
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    // Reviews Card
    .reviews-card {
      padding: 24px;
    }
    .write-review-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .stars-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
      span {
        font-size: 13px;
        font-weight: 600;
      }
    }
    .selector-star {
      color: var(--text-muted);
      font-size: 24px;
      width: 24px;
      height: 24px;
      &.active {
        color: #fbbf24;
      }
    }
    .submit-review-btn {
      align-self: flex-end;
    }
    .reviews-list-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
      max-height: 380px;
      overflow-y: auto;
      &::-webkit-scrollbar {
        width: 6px;
      }
    }
    .no-reviews {
      text-align: center;
      padding: 20px;
      color: var(--text-secondary);
      font-size: 13px;
    }
    .review-item {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 14px;
    }
    .review-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .review-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
    }
    .review-meta {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .review-username {
      font-weight: 700;
      font-size: 13px;
    }
    .review-date {
      font-size: 10px;
      color: var(--text-muted);
    }
    .review-rating {
      display: flex;
      align-items: center;
      gap: 3px;
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }
    .star-mini-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .review-comment {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    .my-md {
      margin: 16px 0;
    }
    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
      color: var(--text-secondary);
      gap: 16px;
    }
  `],
})
export class DestinationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destService = inject(DestinationService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  authService = inject(AuthService);

  // Dynamic States
  dest = signal<Destination | null>(null);
  reviews = signal<Review[]>([]);
  isLoading = signal(true);
  isFavorited = signal(false);
  activeGalleryImg = signal<string>('');
  bannerUrl = signal<string>('');

  // Review Form States
  userRating = signal(5);
  userComment = signal('');
  isSubmittingReview = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadDetails(id);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  loadDetails(id: string): void {
    this.isLoading.set(true);
    this.destService.getDestination(id).subscribe({
      next: (res) => {
        const destData = res.data.destination;
        const correctImg = getDestinationImageUrl(destData.name);
        destData.imageUrl = correctImg;
        destData.gallery = [correctImg];
        this.dest.set(destData);
        this.activeGalleryImg.set(correctImg);
        this.bannerUrl.set(correctImg);
        
        // Fetch reviews
        this.loadReviews(id);

        // Check if favorited
        this.checkFavoriteState(id);
        
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Failed to load destination details.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loadReviews(destId: string): void {
    this.destService.getReviews(destId).subscribe({
      next: (res) => this.reviews.set(res.data.reviews),
    });
  }

  checkFavoriteState(destId: string): void {
    this.destService.getFavoriteDestinations().subscribe({
      next: (res) => {
        const favs = res.data.favorites || [];
        const isFav = favs.some((f: any) => f.destination?._id === destId);
        this.isFavorited.set(isFav);
      }
    });
  }

  toggleFavorite(): void {
    const d = this.dest();
    if (!d) return;

    this.destService.toggleFavoriteDestination(d._id).subscribe({
      next: (res) => {
        this.isFavorited.set(res.data.isFavorited);
        this.notification.success(res.message);
      },
      error: () => this.notification.error('Failed to update bookmark.')
    });
  }

  planTrip(): void {
    const d = this.dest();
    if (!d) return;
    this.router.navigate(['/trip-builder'], {
      queryParams: { destination: d.name, country: d.country }
    });
  }

  shareDestination(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.notification.success('Share link copied to clipboard!');
    }).catch(() => {
      this.notification.error('Failed to copy link.');
    });
  }

  submitReview(): void {
    const d = this.dest();
    if (!d) return;

    if (!this.userComment().trim()) {
      this.notification.warning('Please add a comment.');
      return;
    }

    this.isSubmittingReview.set(true);
    this.destService.addReview(d._id, this.userRating(), this.userComment()).subscribe({
      next: (res) => {
        this.notification.success('Review added successfully!');
        this.userComment.set('');
        this.userRating.set(5);
        this.isSubmittingReview.set(false);
        
        // Reload details (for average rating updates) and reviews list
        this.loadDetails(d._id);
      },
      error: (err) => {
        this.isSubmittingReview.set(false);
        const errMsg = err.error?.message || 'Failed to submit review.';
        this.notification.error(errMsg);
      }
    });
  }

  onImgError(event: any, destName?: string): void {
    const currentUrl = event.target.src;
    const name = destName || 'Destination';
    const nextUrl = getNextDestinationImageUrl(currentUrl, name);
    if (event.target.src !== nextUrl) {
      event.target.src = nextUrl;
    }
  }
}
