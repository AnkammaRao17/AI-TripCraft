import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="auth-wrapper">
      <mat-card class="auth-card glass-card">
        <mat-progress-bar mode="indeterminate" *ngIf="isLoading()"></mat-progress-bar>
        
        <mat-card-header class="auth-header">
          <mat-card-title>Welcome Back</mat-card-title>
          <mat-card-subtitle>Sign in to plan your next adventure</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
            <!-- Email -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email" placeholder="example@email.com" />
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
            </mat-form-field>

            <!-- Password -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button type="button" matSuffix (click)="togglePasswordVisibility()" aria-label="Toggle password visibility">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <!-- Forgot Password Link -->
            <div class="forgot-pwd-container">
              <a routerLink="/auth/forgot-password" class="auth-link font-sm">Forgot Password?</a>
            </div>

            <!-- Submit Button -->
            <button mat-raised-button type="submit" class="full-width btn-primary submit-btn" [disabled]="loginForm.invalid || isLoading()">
              {{ isLoading() ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="auth-actions">
          <span class="font-sm text-secondary">Don't have an account? </span>
          <a routerLink="/auth/register" class="auth-link font-sm font-semibold">Sign Up</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 180px);
      padding: 20px 0;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      overflow: hidden;
      border: 1px solid var(--glass-border);
      border-radius: 20px !important;
      position: relative;
    }
    .auth-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 24px;
      margin-top: 12px;
      mat-card-title {
        font-size: 28px !important;
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        margin-bottom: 8px !important;
        background: var(--accent-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      mat-card-subtitle {
        color: var(--text-secondary);
        font-size: 14px !important;
      }
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .full-width {
      width: 100%;
    }
    .forgot-pwd-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .auth-link {
      color: var(--accent-primary);
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
    .submit-btn {
      height: 48px !important;
    }
    .auth-actions {
      display: flex;
      justify-content: center;
      gap: 4px;
      padding: 16px 0 8px 0;
      border-top: 1px solid var(--border-color);
      margin-top: 16px;
    }
    .font-sm {
      font-size: 13px;
    }
    .font-semibold {
      font-weight: 600;
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  hidePassword = signal(true);
  isLoading = signal(false);

  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notification.success('Logged in successfully! Welcome back.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || 'Login failed. Please verify credentials.';
        this.notification.error(errMsg);
      },
    });
  }
}
