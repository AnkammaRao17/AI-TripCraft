import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
  selector: 'app-otp-verification',
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
          <mat-card-title>Verify Your Email</mat-card-title>
          <mat-card-subtitle>
            We sent a 6-digit OTP verification code to:<br/>
            <strong class="email-highlight">{{ email() }}</strong>
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="otpForm" (ngSubmit)="onSubmit()" class="auth-form">
            <!-- OTP Input -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>6-Digit Verification Code</mat-label>
              <input matInput type="text" formControlName="otp" maxlength="6" placeholder="123456" autocomplete="one-time-code" />
              <mat-icon matPrefix>lock_open</mat-icon>
              <mat-error *ngIf="otpForm.get('otp')?.hasError('required')">OTP is required</mat-error>
              <mat-error *ngIf="otpForm.get('otp')?.hasError('pattern')">Must be exactly 6 digits</mat-error>
            </mat-form-field>

            <!-- Submit Button -->
            <button mat-raised-button type="submit" class="full-width btn-primary submit-btn" [disabled]="otpForm.invalid || isLoading()">
              {{ isLoading() ? 'Verifying...' : 'Verify Code' }}
            </button>
          </form>

          <!-- Resend Block -->
          <div class="resend-container">
            <span class="font-sm text-secondary" *ngIf="countdown() > 0">
              Resend code in <strong class="timer">{{ countdown() }}s</strong>
            </span>
            <button mat-button class="resend-btn" (click)="onResend()" *ngIf="countdown() === 0" [disabled]="isLoading()">
              <mat-icon>refresh</mat-icon> Resend OTP
            </button>
          </div>
        </mat-card-content>

        <mat-card-actions class="auth-actions">
          <a routerLink="/auth/login" class="auth-link font-sm font-semibold">Back to Sign In</a>
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
      max-width: 440px;
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
        line-height: 1.5;
      }
    }
    .email-highlight {
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
      word-break: break-all;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .full-width {
      width: 100%;
    }
    .submit-btn {
      height: 48px !important;
    }
    .resend-container {
      display: flex;
      justify-content: center;
      margin-top: 20px;
      text-align: center;
      min-height: 36px;
      align-items: center;
    }
    .timer {
      color: var(--accent-primary);
      font-weight: 600;
    }
    .resend-btn {
      color: var(--accent-primary) !important;
      font-weight: 600 !important;
    }
    .auth-actions {
      display: flex;
      justify-content: center;
      padding: 16px 0 8px 0;
      border-top: 1px solid var(--border-color);
      margin-top: 16px;
    }
    .auth-link {
      color: var(--accent-primary);
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
    .font-sm {
      font-size: 13px;
    }
    .font-semibold {
      font-weight: 600;
    }
  `],
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  otpForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  email = signal<string>('');
  isLoading = signal<boolean>(false);
  countdown = signal<number>(30);
  private timerId: any = null;

  ngOnInit(): void {
    // Extract email from query params
    const emailParam = this.route.snapshot.queryParams['email'] || '';
    if (!emailParam) {
      this.notification.warning('No email provided for verification. Redirecting...');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.email.set(emailParam);
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  startCountdown(): void {
    this.countdown.set(30);
    this.stopCountdown();
    this.timerId = setInterval(() => {
      this.countdown.update((val) => {
        if (val <= 1) {
          this.stopCountdown();
          return 0;
        }
        return val - 1;
      });
    }, 1000);
  }

  stopCountdown(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  onResend(): void {
    this.isLoading.set(true);
    this.authService.resendOtp(this.email()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notification.success('Verification OTP resent successfully!');
        this.startCountdown();
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || 'Failed to resend OTP. Please try again.';
        this.notification.error(errMsg);
      },
    });
  }

  onSubmit(): void {
    if (this.otpForm.invalid) return;

    this.isLoading.set(true);
    const { otp } = this.otpForm.value;

    this.authService.verifyOtp(this.email(), otp).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notification.success('Account verified successfully! Please sign in.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || 'Verification failed. Please try again.';
        this.notification.error(errMsg);
      },
    });
  }
}
