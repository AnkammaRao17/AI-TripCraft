import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, RefreshResponse, User } from '../../models/interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  
  // Angular Signal for current user state
  currentUser = signal<User | null>(null);
  
  // Computed values
  isLoggedIn = computed(() => this.currentUser() !== null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('ai-tripcraft-user');
      const token = localStorage.getItem('ai-tripcraft-token');
      if (userJson && token) {
        try {
          this.currentUser.set(JSON.parse(userJson));
        } catch (e) {
          this.logout();
        }
      }
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-otp`, { email, otp });
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-otp`, { email });
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => this.handleAuthentication(res.data))
    );
  }

  logout(): void {
    const refreshToken = localStorage.getItem('ai-tripcraft-refresh-token');
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    localStorage.removeItem('ai-tripcraft-user');
    localStorage.removeItem('ai-tripcraft-token');
    localStorage.removeItem('ai-tripcraft-refresh-token');
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<RefreshResponse> {
    const refreshToken = localStorage.getItem('ai-tripcraft-refresh-token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<RefreshResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((res) => {
        localStorage.setItem('ai-tripcraft-token', res.data.accessToken);
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password/${token}`, { password });
  }

  getProfile(): Observable<any> {
    const usersUrl = this.apiUrl.replace('/auth', '/users');
    return this.http.get<any>(`${usersUrl}/profile`).pipe(
      tap((res) => {
        this.currentUser.set(res.data.user);
        localStorage.setItem('ai-tripcraft-user', JSON.stringify(res.data.user));
      })
    );
  }

  updateProfile(profileData: any): Observable<any> {
    const usersUrl = this.apiUrl.replace('/auth', '/users');
    return this.http.put<any>(`${usersUrl}/profile`, profileData).pipe(
      tap((res) => {
        this.currentUser.set(res.data.user);
        localStorage.setItem('ai-tripcraft-user', JSON.stringify(res.data.user));
      })
    );
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai-tripcraft-token');
    }
    return null;
  }

  private handleAuthentication(authData: { user: User; accessToken: string; refreshToken: string }): void {
    this.currentUser.set(authData.user);
    localStorage.setItem('ai-tripcraft-user', JSON.stringify(authData.user));
    localStorage.setItem('ai-tripcraft-token', authData.accessToken);
    localStorage.setItem('ai-tripcraft-refresh-token', authData.refreshToken);
  }
}
