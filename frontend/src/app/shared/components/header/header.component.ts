import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar class="header-toolbar glass-header">
      <div class="header-content">
        <!-- Logo / Brand -->
        <a routerLink="/" class="brand-link">
          <mat-icon class="brand-icon">explore</mat-icon>
          <span class="brand-name">AI TripCraft</span>
        </a>

        <!-- Desktop Navigation -->
        <nav class="nav-links" *ngIf="authService.isLoggedIn()">
          <a routerLink="/dashboard" routerLinkActive="active-link" class="nav-link">
            <mat-icon>dashboard</mat-icon> Dashboard
          </a>
          <a routerLink="/trip-builder" routerLinkActive="active-link" class="nav-link">
            <mat-icon>add_circle</mat-icon> Plan Trip
          </a>
        </nav>

        <span class="spacer"></span>

        <!-- Right Side Actions -->
        <div class="header-actions">
          <!-- Dark Mode Toggle -->
          <button mat-icon-button (click)="themeService.toggleTheme()" aria-label="Toggle Theme" class="theme-toggle">
            <mat-icon>{{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <!-- Authenticated Menu -->
          <ng-container *ngIf="authService.isLoggedIn(); else guestButtons">
            <button mat-button [matMenuTriggerFor]="profileMenu" class="user-menu-btn">
              <img [src]="authService.currentUser()?.profile?.avatarUrl" alt="Avatar" class="avatar-img" />
              <span class="username-text">{{ authService.currentUser()?.profile?.firstName || authService.currentUser()?.username }}</span>
              <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
            </button>
            <mat-menu #profileMenu="matMenu" xPosition="before" class="profile-dropdown-panel">
              <button mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>My Profile</span>
              </button>
              <button mat-menu-item (click)="authService.logout()">
                <mat-icon>logout</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          </ng-container>

          <!-- Guest Buttons -->
          <ng-template #guestButtons>
            <div class="guest-group">
              <a mat-button routerLink="/auth/login" class="login-btn">Sign In</a>
              <a mat-raised-button routerLink="/auth/register" class="register-btn btn-primary">Sign Up</a>
            </div>
          </ng-template>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header-toolbar {
      height: 70px;
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 0 24px;
      background: var(--glass-bg);
      border-bottom: 1px solid var(--glass-border);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
    }
    .header-content {
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
    }
    .brand-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: var(--text-primary);
      gap: 8px;
      margin-right: 32px;
    }
    .brand-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-name {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 22px;
      letter-spacing: -0.03em;
    }
    .nav-links {
      display: none;
      gap: 16px;
      @media (min-width: 768px) {
        display: flex;
      }
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
      &:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    .active-link {
      background: rgba(99, 102, 241, 0.1);
      color: var(--accent-primary);
      font-weight: 600;
      &:hover {
        background: rgba(99, 102, 241, 0.15);
        color: var(--accent-primary);
      }
    }
    .spacer {
      flex: 1 1 auto;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .theme-toggle {
      color: var(--text-secondary);
    }
    .user-menu-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--glass-border);
      border-radius: 50px;
      padding: 4px 12px 4px 4px !important;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
    .avatar-img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      background: var(--bg-tertiary);
    }
    .username-text {
      font-weight: 600;
      font-size: 14px;
      display: none;
      @media (min-width: 640px) {
        display: inline;
      }
    }
    .dropdown-arrow {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-left: -4px;
    }
    .guest-group {
      display: flex;
      gap: 8px;
    }
    .login-btn {
      color: var(--text-secondary) !important;
      font-weight: 600 !important;
    }
    .register-btn {
      font-size: 13px !important;
    }
  `],
})
export class HeaderComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
}
