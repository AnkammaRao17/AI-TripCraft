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
  selector: 'app-forgot-password',
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
          <mat-card-title>Forgot Password</mat-card-title>
          <mat-card-subtitle>Enter email to fetch a secure reset key</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Reset Link Alert Box -->
          <div class="alert alert-info" *ngIf="resetToken()">
            <mat-icon>vpn_key</mat-icon>
            <div>
              <p class="alert-title">Sandbox Token Generated!</p>
              <p class="alert-desc">Copy token or click below to proceed:</p>
              <code class="token-code">{{ resetToken() }}</code>
              <div class="alert-action">
                <a mat-flat-button color="primary" [routerLink]="['/auth/reset-password', resetToken()]" class="reset-btn-link">
                  Reset Password Now
                </a>
              </div>
            </div>
          </div>

          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" *ngIf="!resetToken()" class="auth-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email" placeholder="example@email.com" />
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="forgotForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="forgotForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
            </mat-form-field>

            <button mat-raised-button type="submit" class="full-width btn-primary submit-btn" [disabled]="forgotForm.invalid || isLoading()">
              {{ isLoading() ? 'Requesting...' : 'Get Reset Token' }}
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="auth-actions">
          <a routerLink="/auth/login" class="auth-link font-sm font-semibold">Back to Login</a>
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
        font-size: 26px !important;
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        margin-bottom: 8px !important;
        background: var(--accent-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      mat-card-subtitle {
        color: var(--text-secondary);
        font-size: 13px !important;
      }
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .full-width {
      width: 100%;
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
    .alert {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.2);
      color: var(--text-primary);
      mat-icon {
        color: var(--accent-primary);
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
    .alert-title {
      font-weight: 600;
      font-size: 15px;
      margin-bottom: 4px;
    }
    .alert-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    .token-code {
      display: block;
      background: var(--bg-tertiary);
      padding: 8px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
      word-break: break-all;
      margin-bottom: 12px;
      border: 1px solid var(--border-color);
    }
    .alert-action {
      margin-top: 12px;
    }
    .reset-btn-link {
      background: var(--accent-gradient) !important;
      color: white !important;
      font-weight: 600;
      border-radius: 20px !important;
    }
  `],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = signal(false);
  resetToken = signal<string | null>(null);

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.isLoading.set(true);
    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.resetToken.set(res.data.resetToken);
        this.notification.success('Reset token generated! Copy from the panel.');
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || 'Error occurred. Please verify email.';
        this.notification.error(errMsg);
      },
    });
  }
}
