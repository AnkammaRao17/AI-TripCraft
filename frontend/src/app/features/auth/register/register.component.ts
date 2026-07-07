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
  selector: 'app-register',
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
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Start crafting your customized travel plans</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
            <!-- Username -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="johndoe" />
              <mat-icon matPrefix>person</mat-icon>
              <mat-error *ngIf="registerForm.get('username')?.hasError('required')">Username is required</mat-error>
              <mat-error *ngIf="registerForm.get('username')?.hasError('minlength')">Must be at least 3 characters</mat-error>
            </mat-form-field>

            <!-- Email -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email" placeholder="example@email.com" />
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
            </mat-form-field>

            <!-- First & Last Name -->
            <div class="form-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" />
              </mat-form-field>
            </div>

            <!-- Phone -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone Number</mat-label>
              <input matInput formControlName="phone" placeholder="+123456789" />
              <mat-icon matPrefix>phone</mat-icon>
            </mat-form-field>

            <!-- Password -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button type="button" matSuffix (click)="togglePasswordVisibility()" aria-label="Toggle password visibility">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">Password is required</mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">Must be at least 6 characters</mat-error>
            </mat-form-field>

            <!-- Submit Button -->
            <button mat-raised-button type="submit" class="full-width btn-primary submit-btn" [disabled]="registerForm.invalid || isLoading()">
              {{ isLoading() ? 'Creating Account...' : 'Sign Up' }}
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="auth-actions">
          <span class="font-sm text-secondary">Already have an account? </span>
          <a routerLink="/auth/login" class="auth-link font-sm font-semibold">Sign In</a>
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
      max-width: 460px;
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
      gap: 6px;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
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
      margin-top: 8px;
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    firstName: [''],
    lastName: [''],
    phone: [''],
  });

  hidePassword = signal(true);
  isLoading = signal(false);

  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notification.success('Registration successful! Welcome to AI TripCraft.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || 'Registration failed. Try a different username/email.';
        this.notification.error(errMsg);
      },
    });
  }
}
