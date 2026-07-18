import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(
            (m) => m.RegisterComponent
          ),
      },
      {
        path: 'verify-otp',
        loadComponent: () =>
          import('./features/auth/otp-verification/otp-verification.component').then(
            (m) => m.OtpVerificationComponent
          ),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
      },
      {
        path: 'reset-password/:token',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
      },
    ],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'destination/:id',
    loadComponent: () =>
      import('./features/destination-details/destination-details.component').then(
        (m) => m.DestinationDetailsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'trip-builder',
    loadComponent: () =>
      import('./features/trip-builder/trip-builder.component').then(
        (m) => m.TripBuilderComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'itinerary/:id',
    loadComponent: () =>
      import('./features/itinerary-view/itinerary-view.component').then(
        (m) => m.ItineraryViewComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
